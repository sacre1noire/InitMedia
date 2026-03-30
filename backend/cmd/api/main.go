package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"time"

	"backend/internal/domain/user"
	"backend/internal/platform/jwt"
	"backend/internal/repository/postgres"
	"backend/internal/transport/http/handler"
	"backend/internal/transport/http/middleware"
	companyUseCase "backend/internal/usecase/company"
	profileUseCase "backend/internal/usecase/profile"
	usecase "backend/internal/usecase/user"

	_ "backend/docs"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

// @title           InitMedia API
// @version         1.0
// @description     API for InitMedia platform.
// @host            localhost:8080
// @BasePath        /
func main() {
	// Load environment variables
	if err := godotenv.Load("../../../.env"); err != nil {
		log.Println("No .env file found in ../../../.env, checking current directory")
		if err := godotenv.Load(); err != nil {
			log.Println("No .env file found")
		}
	}

	dbUrl := os.Getenv("DATABASE_URL")
	if dbUrl == "" {
		log.Fatal("DATABASE_URL is not set")
	}

	// Connect to database
	config, err := pgxpool.ParseConfig(dbUrl)
	if err != nil {
		log.Fatalf("Unable to parse database URL: %v", err)
	}

	pool, err := pgxpool.NewWithConfig(context.Background(), config)
	if err != nil {
		log.Fatalf("Unable to create connection pool: %v", err)
	}
	defer pool.Close()

	// Verify connection
	if err := pool.Ping(context.Background()); err != nil {
		log.Fatalf("Unable to ping database: %v", err)
	}
	log.Println("Successfully connected to the database")

	// Setup Dependencies
	userRepo := postgres.NewUserRepo(pool)
	sessionRepo := postgres.NewSessionRepo(pool)
	profileRepo := postgres.NewApplicantProfileRepo(pool)
	companyRepo := postgres.NewCompanyRepo(pool)
	tokenGenerator := jwt.NewTokenGenerator(os.Getenv("JWT_SECRET"), 15*time.Minute)
	authUseCase := usecase.NewAuthUseCase(userRepo, sessionRepo, tokenGenerator)
	applicantProfileUseCase := profileUseCase.NewProfileUseCase(profileRepo, userRepo)
	companyUC := companyUseCase.NewCompanyUseCase(companyRepo)
	authHandler := handler.NewAuthHandler(authUseCase)
	profileHandler := handler.NewProfileHandler(applicantProfileUseCase)
	companyHandler := handler.NewCompanyHandler(companyUC)
	authMiddleware := middleware.NewAuthMiddleware(tokenGenerator)

	// Setup Router
	r := gin.Default()
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173", "http://127.0.0.1:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// API Routes
	api := r.Group("/api")
	{
		authRoutes := api.Group("/auth")
		{
			authRoutes.POST("/register", authHandler.Register)
			authRoutes.POST("/login", authHandler.Login)
			authRoutes.POST("/refresh", authHandler.RefreshTokens)
			authRoutes.POST("/logout", authHandler.Logout)
			authRoutes.GET("/me", authMiddleware.RequireAuth(), authHandler.Me)
		}

		protectedRoutes := api.Group("/protected")
		protectedRoutes.Use(authMiddleware.RequireAuth())
		{
			protectedRoutes.GET("/profile", func(c *gin.Context) {
				c.JSON(http.StatusOK, gin.H{"message": "This is a protected route"})
			})
		}

		profileRoutes := api.Group("/profile")
		profileRoutes.Use(authMiddleware.RequireAuth(), middleware.RequireRole(user.RoleApplicant))
		{
			profileRoutes.GET("/me", profileHandler.GetMyProfile)
			profileRoutes.PUT("/me", profileHandler.UpdateMyProfile)
			profileRoutes.PATCH("/me/avatar", profileHandler.UploadAvatar)
		}

		companyRoutes := api.Group("/companies")
		companyRoutes.Use(authMiddleware.RequireAuth(), middleware.RequireRole(user.RoleEmployer, user.RoleAdmin))
		{
			companyRoutes.POST("", companyHandler.CreateCompany)
			companyRoutes.GET("", companyHandler.ListCompanies)
			companyRoutes.GET("/:id", companyHandler.GetCompanyByID)
			companyRoutes.PUT("/:id", companyHandler.ReplaceCompany)
			companyRoutes.PATCH("/:id", companyHandler.UpdateCompany)
			companyRoutes.DELETE("/:id", companyHandler.DeleteCompany)
		}
	}

	// Swagger Endpoint
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
	r.Static("/uploads", "./uploads")

	// Root endpoint
	r.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"service": "InitMedia API",
			"status":  "UP",
			"version": "1.0",
			"docs":    "/swagger/index.html",
			"health":  "/health",
			"ready":   "/ready",
		})
	})

	// Health check (Liveness)
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "UP",
		})
	})

	// Readiness check
	r.GET("/ready", func(c *gin.Context) {
		if err := pool.Ping(context.Background()); err != nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{
				"status": "DOWN",
				"error":  "Database not reachable",
			})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"status": "READY",
		})
	})

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to run server: %v", err)
	}
}
