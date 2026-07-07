package main

import (
	"log"
	"os"

	"services/crawler-gateway-go/internal/db"
	"services/crawler-gateway-go/internal/server"
)

func main() {
	// Read configuration parameters from environment variables (with defaults)
	dbConnStr := os.Getenv("DATABASE_URL")
	redisAddr := os.Getenv("REDIS_URL")
	ipcAddr := os.Getenv("IPC_ADDRESS")

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("[INIT] Bootstrapping standalone search engine gateway...")

	// Initialize database layer
	repo, err := db.NewRepository(dbConnStr)
	if err != nil {
		log.Fatalf("[FATAL] Failed to configure database repository: %s", err)
	}
	defer repo.Close()

	// Initialize and run API server
	srv := server.NewServer(repo, ipcAddr, redisAddr)
	
	log.Printf("[INIT] Server listening on http://localhost:%s", port)
	if err := srv.Run(":" + port); err != nil {
		log.Fatalf("[FATAL] Gateway API Server crash: %s", err)
	}
}
