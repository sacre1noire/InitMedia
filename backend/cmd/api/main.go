package main

import (
	"context"
	"log"
	"os"

	"backend/internal/app"

	_ "backend/docs"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

// @title           InitMedia API
// @version         1.0
// @description     API for InitMedia platform.
// @host            localhost:8080
// @BasePath        /
func main() {
	if err := godotenv.Load("../../../.env"); err != nil {
		log.Println("No .env file found in ../../../.env, checking current directory")
		if err := godotenv.Load(); err != nil {
			log.Println("No .env file found")
		}
	}

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL is not set")
	}

	cfg, err := pgxpool.ParseConfig(dbURL)
	if err != nil {
		log.Fatalf("Unable to parse database URL: %v", err)
	}

	pool, err := pgxpool.NewWithConfig(context.Background(), cfg)
	if err != nil {
		log.Fatalf("Unable to create connection pool: %v", err)
	}
	defer pool.Close()

	if err := pool.Ping(context.Background()); err != nil {
		log.Fatalf("Unable to ping database: %v", err)
	}
	log.Println("Successfully connected to the database")

	application := app.New(pool)
	router := application.Router()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Failed to run server: %v", err)
	}
}
