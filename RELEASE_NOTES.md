# Release Notes: Nexus Search Engine v0.1.0-beta

Welcome to the first **Beta Release (v0.1.0-beta)** of the Nexus Search Engine stack! This release introduces a high-performance, single-tenant, isolated vertical search architecture designed to crawl, index, and query websites with complete data sovereignty and sub-millisecond keyword lookup speeds.

---

## 🚀 Key Features

*   **Breadth-First Web Crawler (Go)**: A concurrent, depth-bounded crawler that traverses link structures starting from a seed URL, parsing metadata, and tracking job telemetry.
*   **High-Speed Indexing Engine (C++20)**: A native C++ core service that handles raw document indexing and parsing. It connects to the gateway via gRPC IPC channels.
*   **Thread-Safe Memory Arena**: Uses a custom pre-allocated memory layout in C++ to handle large document parses efficiently, eliminating heap fragmentation and allocation latency.
*   **Redis Telemetry Cache (v7.4)**: Cache look-aside pattern that records query matches to Redis, cutting database query pressure and serving repeat matches instantly.
*   **System Overview Dashboard (Astro 5 + React 19)**: An administrative console to trigger crawls, explore raw database documents, view real-time log outputs, and monitor system resources.

---

## 🛠️ Fixes & Optimizations in this Beta

### 1. Ubuntu 24.04 Compiler Core Fix
*   **Issue**: Compilation failure in Docker stage 2 for the C++ indexer due to missing dynamic packages (`libprotobuf32t64` and `libgrpc++1.54`) in the Ubuntu Noble Numbat package pool.
*   **Resolution**: Shifted stage 2 imports to standard system dev libraries (`libprotobuf-dev` and `libgrpc++-dev`) and configured native CMake target finders to resolve standard shared compiler paths.

### 2. gRPC Struct Serialization Correction
*   **Issue**: Gateway crawler failed during serialization, returning `grpc: error while marshaling ... want proto.Message` due to hand-mapped Go structs missing required reflection tags.
*   **Resolution**: Built an Alpine-based compilation container to compile gRPC bindings using `protoc` directly into the workspace. All structs now implement the required Go `proto.Message` interface.

### 3. Live Memory Telemetry & UI Adjustments
*   **Issue**: Dashboard showed a hardcoded page crawl count (`142`) and the Memory Arena utilization chart rendered static coordinates.
*   **Resolution**: Reset the initial page count to `0` (waiting for live database stats) and updated the Memory Arena telemetry module to dynamically compute SVG coordinate grids based on active workers in real-time.

### 4. Git Version Exclusions
*   **Issue**: Staging index pulled compile outputs and dependency stores (e.g. `node_modules`).
*   **Resolution**: Implemented comprehensive `.gitignore` rules at the project root and sub-modules to exclude build targets, packages, and local datastore volumes.

---

## 🐳 Getting Started

Start the entire vertical search ecosystem with a single command:

```bash
docker-compose up -d --build
```

### Access Ports
*   **Admin Console**: [http://localhost:3000](http://localhost:3000)
*   **API Gateway**: [http://localhost:8080/api/v1](http://localhost:8080/api/v1)

---

## 🔗 External API Integration

To utilize Nexus Search as a global search in external web portals or mobile apps, query the search endpoint:

```bash
curl "http://localhost:8080/api/v1/search?q=search-keywords"
```

For full endpoint definitions, JSON payload structures, and JS/Go code client snippets, refer to the [REST API Documentation](GATEWAY_API.md).
