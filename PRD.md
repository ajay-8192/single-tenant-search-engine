# Product Requirement Document (PRD): Core Isolated Search & Indexing Engine

**Project Status:** Approved Specification  
**Framework Nature:** Single-Tenant, Domain-Agnostic Custom Search Subsystem

---

## 1. Objective & Business Value

The objective of this project is to build a high-performance, domain-agnostic, single-tenant vertical search engine. Operating on a robust **Pull, Index, and Query** architecture, this platform allows an administrator to feed specific URLs into a standalone crawler, stripping target web pages down to searchable metadata and inverted index text structures.

Each deployment is completely isolated to an independent application instance or client network ecosystem. This architecture eliminates multi-tenant noisy-neighbor performance constraints, guarantees complete data sovereignty, and optimizes keyword matching and query resolution speeds for one site network at a time.

---

## 2. User Personas & Core Journeys

* **Console Administrator:** An operator responsible for seeding URLs, defining the crawling depth boundaries, clearing indexes, and monitoring crawler logs and word catalog densities.
* **End-User Client:** A visitor searching for specific phrases or keywords via a custom site-search input field who expects rapid, highly relevant, and properly ranked document matches.

---

## 3. Functional Requirements

The core capabilities of the standalone vertical search engine are broken down by execution priority below:

| Feature Epic | Requirement Details | Target Actor | Priority |
| :--- | :--- | :--- | :--- |
| **URL Scraper Engine** | Accept target seeds via administrative APIs. Perform low-overhead web scraping by executing HTTP requests to retrieve full webpage HTML string contents. | Go Backend / System | **P0** |
| **HTML Sanitizer & Tokenizer** | Process raw HTML strings across an isolated UDS connection. Strip out style blocks (`<style>`) and script assets (`<script>`), tokenizing the remaining readable text nodes using a fixed memory arena. | C++ Core Engine | **P0** |
| **Metadata Extractor** | Parse the raw HTML structure to extract essential SEO and reference attributes, specifically targeting `<title>`, `<meta name="description">`, and key OpenGraph tags. | C++ Core Engine | **P0** |
| **Inverted Index Data Engine** | Compute Term Frequencies (TF) for extracted tokens to build an optimized inverted keyword match ledger inside an isolated data store for low-latency lookups. | Core Storage Layer | **P0** |
| **Ranked Vector Search Engine** | Intercept multi-word user search terms, execute keyword ranking evaluations, and return matching document metadata slices (Title, URL, Summary Snippet). | Go Backend / API | **P0** |
| **Crawler Control Portal** | A streamlined admin workspace dashboard to submit web links, trace crawling loops, check page-crawl counts, and view keyword catalog densities. | Astro SSR Frontend | **P1** |
| **Search Gateway Portal** | A clean, ultra-fast Google-style search interface built with server-side layouts to ensure lightning-fast initial renders, loading dynamic components only for instant query results. | Astro Islands | **P1** |

---

## 4. Technical Workflows & Data Layout Formats

### 4.1 Crawler Ingestion Schema Input
When an administrator triggers a new deep-crawl job via the workspace console, the backend registers the crawling intent using the following format:

```json
{
  "seed_url": "[https://example-engineering.com/blog/high-performance-systems](https://example-engineering.com/blog/high-performance-systems)",
  "crawl_depth_limit": 1,
  "max_pages_per_domain": 500,
  "user_agent_identifier": "StandaloneVerticalCrawler/1.0"
}
```

### 4.2 Extracted Document Metadata Output
After parsing and processing the raw webpage HTML string inside the unmanaged C++ arena allocator, the engine returns a clean metadata signature to the Go persistence layer:

```json
{
  "target_url": "[https://example-engineering.com/blog/high-performance-systems](https://example-engineering.com/blog/high-performance-systems)",
  "page_title": "Designing High-Performance Scalable Web Systems",
  "meta_description": "An architectural deep dive into maximizing data throughput pipelines using compiled engine binaries, memory management arrays, and lock-free setups...",
  "token_vector": {
    "high-performance": 14,
    "architecture": 8,
    "pipelines": 5,
    "unmanaged": 3
  }
}
```

---

## 5. Boundaries & Out of Scope Explicit Exclusions

To prevent scope creep and ensure maximum performance optimization, the following capabilities are strictly excluded from this phase:

1.  **Global Web Crawling:** The system is explicitly restricted from indexing the open internet. It can only crawl designated seed domains provided manually by the administrator.
2.  **Media & Binary Context Parsing:** The C++ engine completely ignores image binary objects, video assets, and audio file metadata. It parses text nodes and semantic meta tags exclusively.
3.  **Distributed Cluster Sharding:** There is no cross-server cluster synchronization architecture. Horizontal scaling inside a single-instance environment is managed purely at the load balancer layer routing to an isolated database.

---

## 6. Non-Functional Requirements & Performance Targets

Because this system swaps real-time chronological streaming for document processing and text analytics, the core performance metrics are defined as follows:

* **Query Latency Threshold:** User search requests must be compiled, ranked, and served on the user interface in less than **50 milliseconds** under a concurrent load of 1,000 queries per second.
* **Parsing Isolation Safety:** The C++ HTML parsing engine boundary must restrict memory consumption to a strict maximum allocation limit of **10MB per worker thread** to protect the application server from crashing on massive or malformed third-party web pages.
* **Layout Efficiency Metric:** The Astro search landing page must score above a **98+ profile rating across Google Lighthouse speed benchmarks** by utilizing server-rendered layout shells and avoiding client-side frame delays.
* **Data Tier Physical Separation:** Each deployment instance runs on a completely separate, firewalled database server, ensuring absolute logical and physical single-tenant data isolation.
```
