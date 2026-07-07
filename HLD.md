# Low-Level Design (LLD): Core Isolated Search & Indexing Engine

**Project Status:** Technical Implementation Specification  
**Architecture Pattern:** Isolated Single-Tenant Vertical Search Subsystem (Pull, Index, and Query)

---

## 1. Project Directory Structure

```text
├── apps/
│   └── search-frontend-astro/    # Astro SSR Search Layouts & Query Islands
│       ├── src/
│       │   ├── components/      # Google-style interactive search components
│       │   │   └── SearchResultsIsland.tsx
│       │   ├── layouts/
│       │   └── pages/           # Search query input & Admin spider control panels
├── services/
│   ├── crawler-gateway-go/      # Go Crawler Tier & Gin HTTP API Gateway
│   │   ├── cmd/main.go          # System bootstrap entry-point
│   │   ├── internal/
│   │   │   ├── config/          # Instance-level sandbox configurations
│   │   │   ├── crawler/         # HTTP scraping worker pool implementation
│   │   │   ├── db/              # Inverted index PostgreSQL database repository
│   │   │   ├── ipc/             # UDS gRPC client communications connector
│   │   │   └── server/          # Gin routing, endpoints, and middleware layers
│   └── index-compute-cpp/       # High-Performance Unmanaged HTML Tokenizer Core
│       ├── src/
│       │   ├── arena/           # 10MB Fixed-block memory arena allocator
│       │   ├── ipc/             # Unix Domain Socket (UDS) gRPC listener bindings
│       │   ├── parser/          # HTML metadata extractor & tag stripping engine
│       │   └── main.cpp
├── shared/
│   └── proto/                   # Architecture schema definition file
│       └── search_engine.proto
```

---

## 2. Shared Cross-Process Schema Definition (`search_engine.proto`)

This Protocol Buffers contract defines the schema for data passing across the local high-speed **Unix Domain Socket (UDS)** connecting the Go scraper and the unmanaged C++ sanitization pipeline.

```protobuf
syntax = "proto3";

package search_engine;

option go_package = "services/crawler-gateway-go/internal/ipc/pb";

// Compiling service exposed by the unmanaged C++ tier
service HTMLProcessor {
  rpc ExtractAndTokenize (ProcessDocumentRequest) returns (ProcessDocumentResponse);
}

// Ingestion payload containing the raw web page data stream
message ProcessDocumentRequest {
  string target_url = 1;
  string raw_html_content = 2;
}

// Computed index metadata return block
message ProcessDocumentResponse {
  bool success = 1;
  string error_log = 2;
  string page_title = 3;
  string meta_description = 4;
  map<string, int32> token_frequencies = 5; // Term frequencies calculated by C++
}
```

---

## 3. Go Web Crawler & API Gateway Implementation

### 3.1 HTTP Crawling Worker Engine (`crawler.go`)
This module implements the low-overhead web scraping pipeline, downloading raw HTML webpage contents and executing network timeout thresholds safely.

```go
package crawler

import (
	"context"
	"io"
	"net/http"
	"time"
)

type ScrapeResult struct {
	URL        string
	HTMLBody   string
	ErrorFault error
}

type WebCrawlerWorker struct {
	httpClient *http.Client
	userAgent  string
}

func NewCrawlerWorker(ua string) *WebCrawlerWorker {
	return &WebCrawlerWorker{
		httpClient: &http.Client{
			Timeout: 10 * time.Second, // Shield system threads from long hanging requests
		},
		userAgent: ua,
	}
}

func (w *WebCrawlerWorker) FetchRawHTML(ctx context.Context, targetURL string) (*ScrapeResult, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", targetURL, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", w.userAgent)

	resp, err := w.httpClient.Do(req)
	if err != nil {
		return &ScrapeResult{URL: targetURL, ErrorFault: err}, err
	}
	defer resp.Body.Close()

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return &ScrapeResult{URL: targetURL, ErrorFault: err}, err
	}

	return &ScrapeResult{
		URL:      targetURL,
		HTMLBody: string(bodyBytes),
	}, nil
}
```

### 3.2 Main Gateway Execution Router Configuration (`main.go`)
Configures the system's endpoints using the Gin framework, providing pathways for both admin crawl initialization and customer queries.

```go
package main

import (
	"context"
	"log"
	"net/http"
	"time"

	"[github.com/gin-gonic/gin](https://github.com/gin-gonic/gin)"
	"services/crawler-gateway-go/internal/crawler"
	"services/crawler-gateway-go/internal/server"
)

func main() {
	gin.SetMode(gin.ReleaseMode)
	router := gin.New()
	router.Use(gin.Recovery())

	// Initialize application dependencies
	spider := crawler.NewCrawlerWorker("StandaloneVerticalCrawler/1.0")

	// Register vertical search custom route paths
	server.RegisterSearchRoutes(router, spider)

	srv := &http.Server{
		Addr:         ":8080",
		Handler:      router,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 15 * time.Second,
	}

	log.Printf("Single-tenant search engine service listening on :8080...")
	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("Critical platform routing crash: %s\n", err)
	}
}
```

---

## 4. C++ Unmanaged Text Processing Tier

### 4.1 Fixed Memory Arena Allocator (`arena.hpp`)
Prevents runtime operating heap fragmentation by confining text extraction and string splitting arrays inside a single pre-allocated segment block.

```cpp
#pragma once
#include <cstddef>
#include <cstdint>
#include <stdexcept>
#include <new>

class MemoryArena {
private:
    uint8_t* memory_pool;
    size_t total_capacity;
    size_t current_offset;

public:
    explicit MemoryArena(size_t bytes_to_reserve) 
        : total_capacity(bytes_to_reserve), current_offset(0) {
        memory_pool = new uint8_t[bytes_to_reserve];
    }

    ~MemoryArena() {
        delete[] memory_pool;
    }

    void* allocate(size_t allocation_size, size_t alignment = alignof(std::max_align_t)) {
        size_t current_address = reinterpret_cast<size_t>(memory_pool + current_offset);
        size_t alignment_mask = alignment - 1;
        size_t aligned_address = (current_address + alignment_mask) & ~alignment_mask;
        size_t true_needed_bytes = (aligned_address - current_address) + allocation_size;

        if (current_offset + true_needed_bytes > total_capacity) {
            throw std::bad_alloc(); // Hard constraint: Block document overflow attacks explicitly
        }

        current_offset += true_needed_bytes;
        return reinterpret_cast<void*>(aligned_address);
    }

    void reset_pool() {
        current_offset = 0; // Wipe all worker thread object lifecycles in O(1) clock speed
    }

    MemoryArena(const MemoryArena&) = delete;
    MemoryArena& operator=(const MemoryArena&) = delete;
};
```

### 4.2 HTML Sanitizer & Tokenizer Core Engine (`parser.cpp`)
Trims scripts, styles, and structural boilerplate from raw documents while parsing textual nodes down to specific token sets inside the reserved memory blocks.

```cpp
#include <string>
#include <unordered_map>
#include <vector>
#include <algorithm>
#include "arena.hpp"

struct ProcessedDocumentModel {
    std::string title;
    std::string meta_description;
    std::unordered_map<std::string, int32_t> term_frequencies;
};

class HTMLDocumentSanitizer {
private:
    MemoryArena computational_arena;

public:
    HTMLDocumentSanitizer() : computational_arena(1024 * 1024 * 10) {} // 10MB thread-safe compute workspace

    ProcessedDocumentModel parse_html_document(const std::string& raw_html) {
        computational_arena.reset_pool(); // Clear out variables instantly

        ProcessedDocumentModel result;
        
        // Step 1: Scan layout constraints for metadata extractions
        result.title = extract_tag_content(raw_html, "<title>", "</title>");
        result.meta_description = extract_meta_description(raw_html);

        // Step 2: Strip block structures like scripts and styles sequentially
        std::string cleaned_text = strip_html_boilerplate(raw_html);

        // Step 3: Run the inverted index tokenize loops
        std::string current_token = "";
        for (char character : cleaned_text) {
            if (std::isalnum(character)) {
                current_token += std::tolower(character);
            } else {
                if (!current_token.empty() && current_token.length() > 2) {
                    result.term_frequencies[current_token]++;
                    current_token = "";
                }
            }
        }
        return result;
    }

private:
    std::string extract_tag_content(const std::string& html, const std::string& open_tag, const std::string& close_tag) {
        size_t start_pos = html.find(open_tag);
        if (start_pos == std::string::npos) return "Untitled Page Document";
        start_pos += open_tag.length();
        size_t end_pos = html.find(close_tag, start_pos);
        if (end_pos == std::string::npos) return "Untitled Page Document";
        return html.substr(start_pos, end_pos - start_pos);
    }

    std::string extract_meta_description(const std::string& html) {
        // Implementation traces pattern matches for <meta name="description" content="..." />
        size_t lookup = html.find("name=\"description\"");
        if (lookup == std::string::npos) return "No description block provided.";
        size_t content_start = html.find("content=\"", lookup);
        if (content_start == std::string::npos) return "No description block provided.";
        content_start += 9;
        size_t content_end = html.find("\"", content_start);
        return html.substr(content_start, content_end - content_start);
    }

    std::string strip_html_boilerplate(const std::string& html) {
        // High-speed pass loop parsing layout content nodes, ignoring script text blocks and tag systems
        std::string text_accumulator = "";
        bool in_tag = false;
        
        for (size_t idx = 0; idx < html.length(); ++idx) {
            if (html[idx] == '<') { in_tag = true; continue; }
            if (html[idx] == '>') { in_tag = false; continue; }
            if (!in_tag) {
                text_accumulator += html[idx];
            }
        }
        return text_accumulator;
    }
};
```

---

## 5. Storage Layer Configuration & Indexing Strategy

### 5.1 Document Index Repository Configuration (PostgreSQL DDL)
Maintains physical and logical system isolation per instance, indexing Term Frequencies (TF) directly inside a high-speed inverted index schema structure.

```sql
-- Track comprehensive data metadata targets cleanly
CREATE TABLE IF NOT EXISTS crawled_documents (
    document_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_url TEXT UNIQUE NOT NULL,
    page_title TEXT NOT NULL,
    meta_description TEXT,
    raw_extracted_text TEXT NOT NULL,
    crawled_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Inverted Index table mapping token structures straight to source definitions
CREATE TABLE IF NOT EXISTS inverted_keyword_index (
    keyword VARCHAR(128) NOT NULL,
    document_id UUID NOT NULL REFERENCES crawled_documents(document_id) ON DELETE CASCADE,
    term_frequency INT NOT NULL,
    PRIMARY KEY (keyword, document_id)
);

-- Optimize scanning look-ups during multi-word term matches
CREATE INDEX IF NOT EXISTS idx_token_lookup 
ON inverted_keyword_index (keyword ASC);
```

### 5.2 Hot Cache Architecture (Redis Implementation Rules)
To ensure the system satisfies the `<50ms` user query target under concurrent request loops, the Go search router uses the following caching patterns:

* **Query Strings Cache Mapping:**
    * **Key Design:** `search:cache:v1:results:{sha256_query_hash}`
    * **Data Structure:** Redis String tracking a compressed JSON array of matching document structures.
    * **TTL Configuration:** Fixed at 3600 seconds (1 hour). The cache is instantly invalidated whenever the admin console executes a deep crawl job on the target site.

---

## 6. Astro Frontend Search Interface Integration

This component implements the dynamic search landing page, keeping the global framework shell static while rendering user query results inside an isolated interactive client island.

```tsx
import React, { useState, FormEvent } from 'react';

interface SearchResultItem {
  target_url: string;
  page_title: string;
  meta_description: string;
}

export const SearchResultsIsland: React.FC = () => {
  const [queryInput, setQueryInput] = useState<string>('');
  const [resultsList, setResultsList] = useState<SearchResultItem[]>([]);
  const [executionDelay, setExecutionDelay] = useState<number | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  const executeSearchQuery = async (e: FormEvent) => {
    e.preventDefault();
    if (!queryInput.trim()) return;

    setIsSearching(true);
    const trackingStart = performance.now();

    try {
      // Hit the Go Gin Gateway search API router endpoint
      const response = await fetch(`http://localhost:8080/api/v1/search?q=${encodeURIComponent(queryInput)}`);
      const payloadData = await response.json();
      
      setResultsList(payloadData.results || []);
    } catch (fault) {
      console.error("Failed to compile search results from gateway server: ", fault);
    } finally {
      const trackingEnd = performance.now();
      setExecutionDelay(parseFloat((trackingEnd - trackingStart).toFixed(2)));
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans text-slate-200">
      
      <form onSubmit={executeSearchQuery} className="flex shadow-2xl rounded-lg overflow-hidden border border-slate-800">
        <input 
          type="text" 
          placeholder="Enter keyword parameters (e.g. unmanaged memory compilation)..." 
          value={queryInput}
          onChange={(e) => setQueryInput(e.target.value)}
          className="flex-1 bg-slate-900 text-white p-3 text-sm outline-none placeholder:text-slate-500"
        />
        <button type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 font-bold tracking-wide text-xs uppercase transition">
          {isSearching ? 'Parsing...' : 'Search'}
        </button>
      </form>

      {executionDelay !== null && (
        <p className="text-[11px] font-mono text-slate-500 italic">
          About {resultsList.length} unique document matches resolved in {executionDelay} milliseconds
        </p>
      )}

      <div class="space-y-4">
        {resultsList.length === 0 ? (
          <div className="py-12 text-center text-slate-600 italic text-sm">
            No indexed entries matched the requested keyword vectors.
          </div>
        ) : (
          resultsList.map((document, idx) => (
            <div key={idx} className="p-4 bg-slate-900/40 border border-slate-900 rounded-xl hover:border-slate-800 transition group">
              <a href={document.target_url} target="_blank" rel="noreferrer" className="block">
                <h3 className="text-sm font-bold text-cyan-400 group-hover:underline tracking-tight mb-0.5">
                  {document.page_title}
                </h3>
                <span className="text-[11px] font-mono text-emerald-500/80 block break-all mb-2">
                  {document.target_url}
                </span>
                <p className="text-xs text-slate-400 font-sans leading-relaxed">
                  {document.meta_description}
                </p>
              </a>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
```
```