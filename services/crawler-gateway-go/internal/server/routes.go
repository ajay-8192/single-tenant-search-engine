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

	visited := make(map[string]bool)
	queue := []string{req.SeedURL}
	depthMap := map[string]int{req.SeedURL: 0}
	pagesCount := 0

	worker := crawler.NewCrawlerWorker(req.UserAgentIdentifier)

	for len(queue) > 0 && pagesCount < maxPages {
		currentURL := queue[0]
		queue = queue[1:]

		if visited[currentURL] {
			continue
		}
		visited[currentURL] = true
		pagesCount++

		currentDepth := depthMap[currentURL]
		s.AddLog("[INFO] Scraping page %d: %s (Depth: %d)", pagesCount, currentURL, currentDepth)

		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		res, err := worker.FetchRawHTML(ctx, currentURL)
		cancel()

		if err != nil {
			s.AddLog("[ERROR] Failed to fetch %s: %s", currentURL, err.Error())
			continue
		}

		title := "Untitled Page Document"
		description := "No description available."
		tokens := make(map[string]int32)

		// Handoff to C++ Ingestion Service over gRPC
		if s.ipcClient != nil {
			response, err := s.ipcClient.ExtractAndTokenize(context.Background(), currentURL, res.HTMLBody)
			if err == nil && response.Success {
				title = response.PageTitle
				description = response.MetaDescription
				tokens = response.TokenFrequencies
				s.AddLog("[SUCCESS] IPC Parse complete. Extracted: %d words", len(tokens))
			} else {
				errMsg := "IPC error"
				if err != nil {
					errMsg = err.Error()
				} else {
					errMsg = response.ErrorLog
				}
				s.AddLog("[WARNING] C++ IPC Parser failed: %s. Using basic fallback.", errMsg)
				title, description, tokens = s.mockParser(res.HTMLBody)
			}
		} else {
			// Fallback to internal parser
			title, description, tokens = s.mockParser(res.HTMLBody)
		}

		// Persist indexing details to database
		err = s.repo.SaveIndexedDocument(currentURL, title, description, tokens)
		if err != nil {
			s.AddLog("[ERROR] Database persistence failed for %s: %s", currentURL, err.Error())
		}

		// Extract further links if below depth limit
		if currentDepth < depthLimit {
			links := crawler.ExtractDomainLinks(res.HTMLBody, currentURL)
			for _, link := range links {
				if !visited[link] && depthMap[link] == 0 {
					depthMap[link] = currentDepth + 1
					queue = append(queue, link)
				}
			}
		}
	}

	s.AddLog("[SUCCESS] Crawl Job Complete. Crawled: %d pages.", pagesCount)
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
