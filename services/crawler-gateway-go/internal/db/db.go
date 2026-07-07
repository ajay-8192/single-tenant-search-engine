package db

import (
	"database/sql"
	"fmt"
	"strings"
	"sync"
	"time"

	_ "github.com/lib/pq"
)

type Document struct {
	ID              string    `json:"document_id"`
	URL             string    `json:"target_url"`
	Title           string    `json:"page_title"`
	Description     string    `json:"meta_description"`
	CrawledAt       time.Time `json:"crawled_at"`
}

type SearchResultItem struct {
	URL         string `json:"target_url"`
	Title       string `json:"page_title"`
	Description string `json:"meta_description"`
	Score       int    `json:"score"`
}

type Repository struct {
	db     *sql.DB
	isMock bool
	// In-memory fallback structures
	documents map[string]Document
	invIndex  map[string]map[string]int // keyword -> document_id -> term_frequency
	mu        sync.RWMutex
}

func NewRepository(connStr string) (*Repository, error) {
	if connStr == "" {
		// Boot in Mock Mode
		return &Repository{
			isMock:    true,
			documents: make(map[string]Document),
			invIndex:  make(map[string]map[string]int),
		}, nil
	}

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		return nil, err
	}

	err = db.Ping()
	if err != nil {
		// Ping failed: fallback to in-memory mock for initial developer bootstrap
		fmt.Printf("Database connection failed (%s). Falling back to safe In-Memory Repo.\n", err.Error())
		return &Repository{
			isMock:    true,
			documents: make(map[string]Document),
			invIndex:  make(map[string]map[string]int),
		}, nil
	}

	repo := &Repository{db: db}
	if err := repo.InitializeSchema(); err != nil {
		return nil, err
	}

	return repo, nil
}

func (r *Repository) InitializeSchema() error {
	if r.isMock {
		return nil
	}

	queries := []string{
		`CREATE TABLE IF NOT EXISTS crawled_documents (
			document_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			target_url TEXT UNIQUE NOT NULL,
			page_title TEXT NOT NULL,
			meta_description TEXT,
			crawled_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
		);`,
		`CREATE TABLE IF NOT EXISTS inverted_keyword_index (
			keyword VARCHAR(128) NOT NULL,
			document_id UUID NOT NULL REFERENCES crawled_documents(document_id) ON DELETE CASCADE,
			term_frequency INT NOT NULL,
			PRIMARY KEY (keyword, document_id)
		);`,
		`CREATE INDEX IF NOT EXISTS idx_token_lookup ON inverted_keyword_index (keyword ASC);`,
	}

	for _, query := range queries {
		if _, err := r.db.Exec(query); err != nil {
			return err
		}
	}
	return nil
}

func (r *Repository) SaveIndexedDocument(url, title, desc string, termFreqs map[string]int32) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if r.isMock {
		docID := fmt.Sprintf("mock-uuid-%d", len(r.documents)+1)
		r.documents[docID] = Document{
			ID:          docID,
			URL:         url,
			Title:       title,
			Description: desc,
			CrawledAt:   time.Now(),
		}
		for kw, freq := range termFreqs {
			kwLower := strings.ToLower(kw)
			if r.invIndex[kwLower] == nil {
				r.invIndex[kwLower] = make(map[string]int)
			}
			r.invIndex[kwLower][docID] = int(freq)
		}
		return nil
	}

	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Insert or update crawled document metadata
	var docID string
	err = tx.QueryRow(`
		INSERT INTO crawled_documents (target_url, page_title, meta_description)
		VALUES ($1, $2, $3)
		ON CONFLICT (target_url) DO UPDATE 
		SET page_title = EXCLUDED.page_title, meta_description = EXCLUDED.meta_description, crawled_at = NOW()
		RETURNING document_id`, url, title, desc).Scan(&docID)
	if err != nil {
		return err
	}

	// Delete old keyword indexes for this document to clear old crawled states
	_, err = tx.Exec(`DELETE FROM inverted_keyword_index WHERE document_id = $1`, docID)
	if err != nil {
		return err
	}

	// Bulk insert new keyword frequencies
	if len(termFreqs) > 0 {
		stmt, err := tx.Prepare(`INSERT INTO inverted_keyword_index (keyword, document_id, term_frequency) VALUES ($1, $2, $3)`)
		if err != nil {
			return err
		}
		defer stmt.Close()

		for word, freq := range termFreqs {
			if len(word) > 128 {
				word = word[:128]
			}
			_, err = stmt.Exec(strings.ToLower(word), docID, freq)
			if err != nil {
				return err
			}
		}
	}

	return tx.Commit()
}

func (r *Repository) QuerySearchIndex(keywords []string, limit int) ([]SearchResultItem, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	if len(keywords) == 0 {
		return []SearchResultItem{}, nil
	}

	if r.isMock {
		scores := make(map[string]int) // docID -> total frequency score
		for _, kw := range keywords {
			kwLower := strings.ToLower(kw)
			if docs, exists := r.invIndex[kwLower]; exists {
				for docID, freq := range docs {
					scores[docID] += freq
				}
			}
		}

		results := []SearchResultItem{}
		for docID, score := range scores {
			doc := r.documents[docID]
			results = append(results, SearchResultItem{
				URL:         doc.URL,
				Title:       doc.Title,
				Description: doc.Description,
				Score:       score,
			})
		}
		
		// Sort results by score descending
		for i := 0; i < len(results); i++ {
			for j := i + 1; j < len(results); j++ {
				if results[i].Score < results[j].Score {
					results[i], results[j] = results[j], results[i]
				}
			}
		}

		if len(results) > limit {
			results = results[:limit]
		}
		return results, nil
	}

	// Prepare placeholder parameters for standard array mapping
	placeholders := make([]string, len(keywords))
	args := make([]interface{}, len(keywords)+1)
	for i, kw := range keywords {
		placeholders[i] = fmt.Sprintf("$%d", i+1)
		args[i] = strings.ToLower(kw)
	}
	args[len(keywords)] = limit

	query := fmt.Sprintf(`
		SELECT d.target_url, d.page_title, d.meta_description, SUM(i.term_frequency) as score
		FROM crawled_documents d
		JOIN inverted_keyword_index i ON d.document_id = i.document_id
		WHERE i.keyword IN (%s)
		GROUP BY d.document_id, d.target_url, d.page_title, d.meta_description
		ORDER BY score DESC
		LIMIT $%d`, strings.Join(placeholders, ", "), len(keywords)+1)

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []SearchResultItem
	for rows.Next() {
		var item SearchResultItem
		err = rows.Scan(&item.URL, &item.Title, &item.Description, &item.Score)
		if err != nil {
			return nil, err
		}
		results = append(results, item)
	}
	return results, nil
}

func (r *Repository) GetTotalDocumentsCount() (int, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	if r.isMock {
		return len(r.documents), nil
	}

	var count int
	err := r.db.QueryRow(`SELECT COUNT(*) FROM crawled_documents`).Scan(&count)
	return count, err
}

func (r *Repository) GetAllDocuments() ([]Document, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	if r.isMock {
		var list []Document
		for _, doc := range r.documents {
			list = append(list, doc)
		}
		return list, nil
	}

	rows, err := r.db.Query(`SELECT document_id, target_url, page_title, meta_description, crawled_at FROM crawled_documents ORDER BY crawled_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []Document
	for rows.Next() {
		var doc Document
		err = rows.Scan(&doc.ID, &doc.URL, &doc.Title, &doc.Description, &doc.CrawledAt)
		if err != nil {
			return nil, err
		}
		list = append(list, doc)
	}
	return list, nil
}

func (r *Repository) Close() error {
	if r.db != nil {
		return r.db.Close()
	}
	return nil
}
