package server

import (
	"context"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"regexp"
	"runtime"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"services/crawler-gateway-go/internal/crawler"
	"services/crawler-gateway-go/internal/db"
	"services/crawler-gateway-go/internal/ipc"
)

type Server struct {
	router      *gin.Engine
	spider      *crawler.WebCrawlerWorker
	repo        *db.Repository
	ipcClient   *ipc.IPCClient
	rdb         *redis.Client
	isRedisMock bool

	// Thread-safe log store for Diagnostics Terminal
	logs   []string
	logsMu sync.RWMutex
}

type CrawlRequest struct {
	SeedURL            string `json:"seed_url" binding:"required"`
	CrawlDepthLimit    int    `json:"crawl_depth_limit"`
	MaxPagesPerDomain  int    `json:"max_pages_per_domain"`
	UserAgentIdentifier string `json:"user_agent_identifier"`
}

func NewServer(repo *db.Repository, ipcAddr string, redisAddr string) *Server {
	router := gin.New()
	router.Use(gin.Recovery())

	// CORs Middleware
	router.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	})

	var ipcClient *ipc.IPCClient
	var err error
	if ipcAddr != "" {
		ipcClient, err = ipc.NewIPCClient(ipcAddr)
		if err != nil {
			fmt.Printf("Warning: Failed to connect to C++ gRPC at %s: %s. Using internal Go fallback.\n", ipcAddr, err)
		}
	}

	var rdb *redis.Client
	isRedisMock := true
	if redisAddr != "" {
		rdb = redis.NewClient(&redis.Options{
			Addr: redisAddr,
		})
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		defer cancel()
		if err := rdb.Ping(ctx).Err(); err == nil {
			isRedisMock = false
		} else {
			fmt.Println("Warning: Redis offline. Falling back to local cache.")
		}
	}

	srv := &Server{
		router:      router,
		spider:      crawler.NewCrawlerWorker(""),
		repo:        repo,
		ipcClient:   ipcClient,
		rdb:         rdb,
		isRedisMock: isRedisMock,
		logs:        []string{"[INIT] Initialized CrawlerOS Router Engine... OK"},
	}

	srv.registerRoutes()
	return srv
}

func (s *Server) registerRoutes() {
	v1 := s.router.Group("/api/v1")
	{
		v1.GET("/health", s.handleHealth)
		v1.GET("/search", s.handleSearch)
		v1.GET("/documents", s.handleDocuments)
		v1.DELETE("/documents/:id", s.handleDeleteDocument)
		v1.GET("/logs", s.handleLogs)
		v1.POST("/crawl", s.handleCrawl)
		v1.POST("/clear-logs", s.handleClearLogs)
	}
}

func (s *Server) AddLog(format string, args ...interface{}) {
	s.logsMu.Lock()
	defer s.logsMu.Unlock()
	msg := fmt.Sprintf("[%s] %s", time.Now().Format("15:04:05.000"), fmt.Sprintf(format, args...))
	s.logs = append(s.logs, msg)
	if len(s.logs) > 500 { // Keep bounded
		s.logs = s.logs[1:]
	}
}

func (s *Server) handleHealth(c *gin.Context) {
	var m runtime.MemStats
	runtime.ReadMemStats(&m)

	dbStatus := "Optimal"
	if s.repo == nil {
		dbStatus = "Offline"
	}

	cppStatus := "Active"
	if s.ipcClient == nil {
		cppStatus = "Inactive (Using Internal Parsing)"
	}

	c.JSON(http.StatusOK, gin.H{
		"epoch":            time.Now().Unix(),
		"cpu_cores":        runtime.NumCPU(),
		"goroutines":       runtime.NumGoroutine(),
		"allocated_memory": fmt.Sprintf("%.2f MB", float64(m.Alloc)/1024/1024),
		"db_status":        dbStatus,
		"cpp_status":       cppStatus,
		"redis_status":     func() string {
			if s.isRedisMock {
				return "Offline (Local)"
			}
			return "Optimal"
		}(),
	})
}

func (s *Server) handleSearch(c *gin.Context) {
	query := strings.TrimSpace(c.Query("q"))
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Query parameter 'q' is required"})
		return
	}

	// 1. Invalidate or check Redis Cache
	cacheKey := fmt.Sprintf("search:cache:v1:results:%x", sha256.Sum256([]byte(query)))
	if !s.isRedisMock {
		if val, err := s.rdb.Get(c.Request.Context(), cacheKey).Result(); err == nil {
			var cachedResults []db.SearchResultItem
			if err := json.Unmarshal([]byte(val), &cachedResults); err == nil {
				c.JSON(http.StatusOK, gin.H{
					"query":   query,
					"cached":  true,
					"results": cachedResults,
				})
				return
			}
		}
	}

	// 2. Query Database
	keywords := strings.Fields(query)
	results, err := s.repo.QuerySearchIndex(keywords, 50)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 3. Write Cache
	if !s.isRedisMock && len(results) > 0 {
		if jsonBytes, err := json.Marshal(results); err == nil {
			s.rdb.Set(c.Request.Context(), cacheKey, jsonBytes, 1*time.Hour)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"query":   query,
		"cached":  false,
		"results": results,
	})
}

func (s *Server) handleDocuments(c *gin.Context) {
	docs, err := s.repo.GetAllDocuments()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, docs)
}

func (s *Server) handleDeleteDocument(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id parameter is required"})
		return
	}

	err := s.repo.DeleteDocument(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	s.AddLog("[INFO] Purged document node from index ledger: %s", id)

	// Flush Redis cache when a document is deleted
	if !s.isRedisMock {
		ctx := context.Background()
		iter := s.rdb.Scan(ctx, 0, "search:cache:*", 0).Iterator()
		for iter.Next(ctx) {
			s.rdb.Del(ctx, iter.Val())
		}
		s.AddLog("[INFO] Search result caches invalidated.")
	}

	c.JSON(http.StatusOK, gin.H{"status": "document purged"})
}

func (s *Server) handleLogs(c *gin.Context) {
	s.logsMu.RLock()
	defer s.logsMu.RUnlock()
	c.JSON(http.StatusOK, s.logs)
}

func (s *Server) handleClearLogs(c *gin.Context) {
	s.logsMu.Lock()
	s.logs = []string{"[INIT] Diagnostics trace log cleared."}
	s.logsMu.Unlock()
	c.JSON(http.StatusOK, gin.H{"status": "logs cleared"})
}

func (s *Server) handleCrawl(c *gin.Context) {
	var req CrawlRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	parsed, err := url.Parse(req.SeedURL)
	if err != nil || parsed.Host == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid seed URL format"})
		return
	}

	// Run crawl asynchronously in a goroutine
	go s.executeCrawlJob(req)

	c.JSON(http.StatusAccepted, gin.H{
		"status":   "Crawl Job Initialized",
		"seed_url": req.SeedURL,
	})
}

type crawlCoordinator struct {
	mu           sync.Mutex
	visited      map[string]bool
	depthMap     map[string]int
	pagesCount   int
	maxPages     int
	depthLimit   int
	workerAgent  string
	server       *Server
	tasks        chan crawlTask
	results      chan crawlResult
	activeTasks  int
}

type crawlTask struct {
	url   string
	depth int
}

type crawlResult struct {
	url      string
	depth    int
	htmlBody string
	err      error
	links    []string
}

func (s *Server) crawlWorker(id int, coord *crawlCoordinator, wg *sync.WaitGroup) {
	defer wg.Done()

	for task := range coord.tasks {
		// Use a local crawler worker instance for safety
		worker := crawler.NewCrawlerWorker(coord.workerAgent)
		coord.server.AddLog("[INFO] Worker %d: Scraping page: %s (Depth: %d)", id, task.url, task.depth)

		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		res, err := worker.FetchRawHTML(ctx, task.url)
		cancel()

		if err != nil {
			coord.results <- crawlResult{url: task.url, depth: task.depth, err: err}
			continue
		}

		title := "Untitled Page Document"
		description := "No description available."
		tokens := make(map[string]int32)

		if coord.server.ipcClient != nil {
			response, err := coord.server.ipcClient.ExtractAndTokenize(context.Background(), task.url, res.HTMLBody)
			if err == nil && response.Success {
				title = response.PageTitle
				description = response.MetaDescription
				tokens = response.TokenFrequencies
				coord.server.AddLog("[SUCCESS] Worker %d: IPC Parse complete. Extracted: %d words", id, len(tokens))
			} else {
				errMsg := "IPC error"
				if err != nil {
					errMsg = err.Error()
				} else {
					errMsg = response.ErrorLog
				}
				coord.server.AddLog("[WARNING] Worker %d: C++ IPC Parser failed: %s. Using basic fallback.", id, errMsg)
				title, description, tokens = coord.server.mockParser(res.HTMLBody)
			}
		} else {
			title, description, tokens = coord.server.mockParser(res.HTMLBody)
		}

		err = coord.server.repo.SaveIndexedDocument(task.url, title, description, tokens)
		if err != nil {
			coord.server.AddLog("[ERROR] Worker %d: Database persistence failed for %s: %s", id, task.url, err.Error())
		}

		var links []string
		if task.depth < coord.depthLimit {
			links = crawler.ExtractDomainLinks(res.HTMLBody, task.url)
		}

		coord.results <- crawlResult{
			url:      task.url,
			depth:    task.depth,
			htmlBody: res.HTMLBody,
			links:    links,
		}
	}
}

func (s *Server) executeCrawlJob(req CrawlRequest) {
	s.AddLog("[INFO] Initializing Crawl Job for: %s", req.SeedURL)

	// Flush Redis cache when a crawl initializes
	if !s.isRedisMock {
		ctx := context.Background()
		iter := s.rdb.Scan(ctx, 0, "search:cache:*", 0).Iterator()
		for iter.Next(ctx) {
			s.rdb.Del(ctx, iter.Val())
		}
		s.AddLog("[INFO] Search result caches invalidated.")
	}

	depthLimit := req.CrawlDepthLimit
	if depthLimit <= 0 {
		depthLimit = 3
	}
	maxPages := req.MaxPagesPerDomain
	if maxPages <= 0 {
		maxPages = 500
	}

	coord := &crawlCoordinator{
		visited:     make(map[string]bool),
		depthMap:    make(map[string]int),
		maxPages:    maxPages,
		depthLimit:  depthLimit,
		workerAgent: req.UserAgentIdentifier,
		server:      s,
		tasks:       make(chan crawlTask, maxPages*10),
		results:     make(chan crawlResult, maxPages*10),
	}

	coord.visited[req.SeedURL] = true
	coord.depthMap[req.SeedURL] = 0
	coord.activeTasks = 1
	coord.tasks <- crawlTask{url: req.SeedURL, depth: 0}

	numWorkers := 8
	var wg sync.WaitGroup
	for i := 1; i <= numWorkers; i++ {
		wg.Add(1)
		go s.crawlWorker(i, coord, &wg)
	}

	// Close results channel when workers terminate
	go func() {
		wg.Wait()
		close(coord.results)
	}()

	// Manager loop
	for coord.activeTasks > 0 {
		res, ok := <-coord.results
		if !ok {
			break
		}
		coord.activeTasks--

		if res.err != nil {
			s.AddLog("[ERROR] Failed to fetch %s: %s", res.url, res.err.Error())
		} else {
			coord.mu.Lock()
			coord.pagesCount++
			currentPagesCount := coord.pagesCount
			coord.mu.Unlock()

			s.AddLog("[INFO] Scraping page %d completed: %s", currentPagesCount, res.url)

			if currentPagesCount >= maxPages {
				s.AddLog("[INFO] Reached max page cap %d. Stopping crawl sequence.", maxPages)
				break
			}

			// Add discovered links to queue
			for _, link := range res.links {
				coord.mu.Lock()
				if !coord.visited[link] && coord.pagesCount+coord.activeTasks < maxPages {
					coord.visited[link] = true
					coord.depthMap[link] = res.depth + 1
					coord.activeTasks++
					coord.tasks <- crawlTask{url: link, depth: res.depth + 1}
				}
				coord.mu.Unlock()
			}
		}

		if coord.activeTasks == 0 {
			break
		}
	}

	// Terminate workers
	close(coord.tasks)

	// Drain results
	for range coord.results {
	}

	coord.mu.Lock()
	finalPagesCount := coord.pagesCount
	coord.mu.Unlock()

	s.AddLog("[SUCCESS] Crawl Job Complete. Crawled: %d pages.", finalPagesCount)
}

// mockParser parses HTML tags inside Go to maintain service availability if C++ is offline
func (s *Server) mockParser(html string) (string, string, map[string]int32) {
	title := "Untitled Document"
	titleStart := strings.Index(strings.ToLower(html), "<title>")
	if titleStart != -1 {
		titleEnd := strings.Index(strings.ToLower(html), "</title>")
		if titleEnd > titleStart {
			title = html[titleStart+7 : titleEnd]
		}
	}

	desc := "Mock extracted description."
	descIdx := strings.Index(strings.ToLower(html), "name=\"description\"")
	if descIdx != -1 {
		contentIdx := strings.Index(strings.ToLower(html[descIdx:]), "content=\"")
		if contentIdx != -1 {
			start := descIdx + contentIdx + 9
			end := strings.Index(html[start:], "\"")
			if end != -1 {
				desc = html[start : start+end]
			}
		}
	}

	// Simple tokenizer
	tokens := make(map[string]int32)
	re := regexp.MustCompile(`[a-zA-Z]{3,}`)
	matches := re.FindAllString(html, -1)
	for _, word := range matches {
		tokens[strings.ToLower(word)]++
	}

	return title, desc, tokens
}

func (s *Server) Run(addr string) error {
	s.AddLog("[INFO] Starting Single-Tenant API Gateway on port %s", addr)
	return s.router.Run(addr)
}
