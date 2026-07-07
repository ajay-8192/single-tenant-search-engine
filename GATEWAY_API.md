# Nexus Search Gateway - REST API Documentation

This document describes the external REST API endpoints exposed by the **Go Gateway Service** (`search-engine-gateway`). These endpoints allow external applications, websites, mobile clients, or background services to query, manage, and monitor the vertical search index.

---

## Base Configuration

*   **Default Port**: `8080`
*   **Base URL**: `http://localhost:8080/api/v1`
*   **Content-Type**: `application/json`
*   **CORS Support**: Enforces open CORS wildcard access (`Access-Control-Allow-Origin: *`) with support for standard headers (`Content-Type`, `Authorization`, etc.) and HTTP methods (`GET`, `POST`, `OPTIONS`).

---

## 🔍 Core Integration API

### 1. Execute Search Query
Query the inverted index for documents matching the search terms. Results are rank-sorted based on term frequency and matching density.

*   **Endpoint**: `/search`
*   **HTTP Method**: `GET`
*   **Query Parameters**:
    *   `q` (string, **Required**): The space-separated search query keywords.
*   **Caching**: Query results are cached in Redis for **1 hour**. If cached, the response returns `"cached": true` immediately.

#### Example Request
```bash
curl -X GET "http://localhost:8080/api/v1/search?q=sports+scheduler"
```

#### Success Response (`200 OK`)
```json
{
  "query": "sports scheduler",
  "cached": false,
  "results": [
    {
      "target_url": "https://example.com/about",
      "page_title": "Example Domain - About Us",
      "meta_description": "Learn more about the example domain, our mission, and our services.",
      "score": 45
    },
    {
      "target_url": "https://example.com/services",
      "page_title": "Example Services - Custom Integration",
      "meta_description": "Discover custom integration services, developer APIs, and documentation.",
      "score": 12
    }
  ]
}
```

#### Error Response (`400 Bad Request`)
Returned if the query parameter `q` is missing or empty.
```json
{
  "error": "Query parameter 'q' is required"
}
```

---

## ⚙️ Administrative & Ingestion APIs

### 2. Trigger Depth-Bounded Crawl
Instructs the crawler worker to perform a breadth-first scrape starting at a seed URL.

*   **Endpoint**: `/crawl`
*   **HTTP Method**: `POST`
*   **Request Body**:
    *   `seed_url` (string, **Required**): The absolute HTTP/HTTPS URL where the crawler starts.
    *   `crawl_depth_limit` (integer, *Optional*): The maximum hop depth from the seed page. Default: `0` (scrapes only the seed page).
    *   `max_pages_per_domain` (integer, *Optional*): Hard limit of pages scraped from the target domain. Default: `50`.
    *   `user_agent_identifier` (string, *Optional*): Custom User-Agent string reported by the crawler.

#### Example Request
```bash
curl -X POST http://localhost:8080/api/v1/crawl \
  -H "Content-Type: application/json" \
  -d '{
    "seed_url": "https://example.com/",
    "crawl_depth_limit": 2,
    "max_pages_per_domain": 100,
    "user_agent_identifier": "NexusSearchBot/1.0"
  }'
```

#### Success Response (`202 Accepted` / `200 OK`)
```json
{
  "status": "Crawl job initiated successfully",
  "seed_url": "https://example.com/",
  "depth_limit": 2
}
```

---

### 3. Retrieve All Documents
Retrieve list metadata of all indexed documents stored in the relational index.

*   **Endpoint**: `/documents`
*   **HTTP Method**: `GET`

#### Example Request
```bash
curl -X GET "http://localhost:8080/api/v1/documents"
```

#### Success Response (`200 OK`)
```json
[
  {
    "target_url": "https://example.com/",
    "page_title": "Example Domain",
    "meta_description": "This domain is for use in illustrative examples in documents.",
    "crawled_at": "2026-07-07T12:00:00Z"
  }
]
```

---

## 📊 Telemetry & Diagnostics APIs

### 4. Service Health Status
Verify resource limits and connection availability to datastores (Postgres/Redis) and the C++ gRPC compute module.

*   **Endpoint**: `/health`
*   **HTTP Method**: `GET`

#### Example Request
```bash
curl -X GET "http://localhost:8080/api/v1/health"
```

#### Success Response (`200 OK`)
```json
{
  "epoch": 1783424012,
  "cpu_cores": 8,
  "goroutines": 24,
  "allocated_memory": "4.52 MB",
  "db_status": "Optimal",
  "cpp_status": "Active",
  "redis_status": "Optimal"
}
```

---

### 5. Diagnostics Terminal Logs
Returns the rolling stream of logs captured by the internal gateway runtime.

*   **Endpoint**: `/logs`
*   **HTTP Method**: `GET`

#### Example Request
```bash
curl -X GET "http://localhost:8080/api/v1/logs"
```

#### Success Response (`200 OK`)
```json
[
  "[17:11:18.102] [INIT] Initialized CrawlerOS Router Engine... OK",
  "[17:12:05.420] [INFO] Scraping page 1: https://example.com/ (Depth: 0)",
  "[17:12:06.115] [INFO] Sent gRPC ProcessDocumentRequest to C++ Core parser"
]
```

---

## 🛠️ Code Integration Examples

### JavaScript (Browser Fetch / Node.js)
```javascript
async function searchGlobalIndex(query) {
  const url = `http://localhost:8080/api/v1/search?q=${encodeURIComponent(query)}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.results; // Returns array of matching documents
  } catch (error) {
    console.error("Search API integration failed:", error);
    return [];
  }
}
```

### Go (External Service Client)
```go
package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
)

type SearchResult struct {
	URL         string `json:"target_url"`
	Title       string `json:"page_title"`
	Description string `json:"meta_description"`
	Score       int    `json:"score"`
}

type SearchResponse struct {
	Query   string         `json:"query"`
	Cached  bool           `json:"cached"`
	Results []SearchResult `json:"results"`
}

func GetSearchResults(query string) ([]SearchResult, error) {
	apiURL := fmt.Sprintf("http://localhost:8080/api/v1/search?q=%s", url.QueryEscape(query))
	resp, err := http.Get(apiURL)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var searchResp SearchResponse
	if err := json.NewDecoder(resp.Body).Decode(&searchResp); err != nil {
		return nil, err
	}
	return searchResp.Results, nil
}
```
