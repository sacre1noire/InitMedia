package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"backend/internal/domain/user"
	"backend/internal/platform/jwt"
	"backend/internal/repository/postgres"
	"backend/internal/transport/http/handler"
	"backend/internal/transport/http/middleware"
	applicationUseCase "backend/internal/usecase/application"
	companyUseCase "backend/internal/usecase/company"
	courseUseCase "backend/internal/usecase/course"
	matchingUseCase "backend/internal/usecase/matching"
	profileUseCase "backend/internal/usecase/profile"
	resumeusecase "backend/internal/usecase/resume"
	usecase "backend/internal/usecase/user"
	vacancyUseCase "backend/internal/usecase/vacancy"

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
	if err := ensureCompanySchema(context.Background(), pool); err != nil {
		log.Fatalf("Unable to ensure company schema: %v", err)
	}
	if err := ensureVacancySchema(context.Background(), pool); err != nil {
		log.Fatalf("Unable to ensure vacancy schema: %v", err)
	}
	log.Println("Successfully connected to the database")

	// Setup Dependencies
	userRepo := postgres.NewUserRepo(pool)
	sessionRepo := postgres.NewSessionRepo(pool)
	profileRepo := postgres.NewApplicantProfileRepo(pool)
	companyRepo := postgres.NewCompanyRepo(pool)
	vacancyRepo := postgres.NewVacancyRepo(pool)
	applicationRepo := postgres.NewApplicationRepo(pool)
	resumeRepo := postgres.NewResumeRepo(pool)
	courseRepo := postgres.NewCourseRepo(pool)
	tokenGenerator := jwt.NewTokenGenerator(os.Getenv("JWT_SECRET"), 15*time.Minute)
	authUseCase := usecase.NewAuthUseCase(userRepo, sessionRepo, tokenGenerator)
	applicantProfileUseCase := profileUseCase.NewProfileUseCase(profileRepo, userRepo)
	companyUC := companyUseCase.NewCompanyUseCase(companyRepo)
	vacancyUC := vacancyUseCase.NewVacancyUseCase(vacancyRepo, companyRepo)
	applicationUC := applicationUseCase.NewApplicationUseCase(applicationRepo, vacancyRepo, userRepo)
	matchingUC := matchingUseCase.NewUseCase(vacancyRepo, profileRepo)
	resumeUC := resumeusecase.NewUseCase(resumeRepo)
	courseUC := courseUseCase.NewUseCase(courseRepo, userRepo)
	authHandler := handler.NewAuthHandler(authUseCase)
	profileHandler := handler.NewProfileHandler(applicantProfileUseCase)
	companyHandler := handler.NewCompanyHandler(companyUC)
	candidateHandler := handler.NewCandidateHandler(applicantProfileUseCase)
	vacancyHandler := handler.NewVacancyHandler(vacancyUC)
	applicationHandler := handler.NewApplicationHandler(applicationUC)
	matchingHandler := handler.NewMatchingHandler(matchingUC)
	resumeHandler := handler.NewResumeHandler(resumeUC)
	courseHandler := handler.NewCourseHandler(courseUC)
	authMiddleware := middleware.NewAuthMiddleware(tokenGenerator)

	// Setup Router
	r := gin.Default()
	r.Use(cors.New(cors.Config{
		AllowOrigins:     corsAllowedOrigins(),
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

		applicantRoutes := api.Group("/applicants")
		applicantRoutes.Use(authMiddleware.RequireAuth())
		{
			applicantRoutes.GET("/:id", profileHandler.GetApplicantSummary)
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

		vacancyRoutes := api.Group("/vacancies")
		{
			vacancyRoutes.GET("", vacancyHandler.ListVacancies)
			vacancyRoutes.POST("", authMiddleware.RequireAuth(), middleware.RequireRole(user.RoleEmployer, user.RoleAdmin), vacancyHandler.CreateVacancy)
			vacancyRoutes.GET("/recommended", authMiddleware.RequireAuth(), matchingHandler.GetRecommendedVacancies)
			vacancyRoutes.PUT("/:id", authMiddleware.RequireAuth(), middleware.RequireRole(user.RoleEmployer, user.RoleAdmin), vacancyHandler.UpdateVacancy)
			vacancyRoutes.DELETE("/:id", authMiddleware.RequireAuth(), middleware.RequireRole(user.RoleEmployer, user.RoleAdmin), vacancyHandler.DeleteVacancy)
			vacancyRoutes.GET("/:id", vacancyHandler.GetVacancy)
			vacancyRoutes.PATCH("/:id/status", authMiddleware.RequireAuth(), middleware.RequireRole(user.RoleEmployer, user.RoleAdmin), vacancyHandler.UpdateVacancyStatus)
			vacancyRoutes.POST("/:id/apply", authMiddleware.RequireAuth(), middleware.RequireRole(user.RoleApplicant), applicationHandler.ApplyToVacancy)
		}

		employerRoutes := api.Group("/employer")
		employerRoutes.Use(authMiddleware.RequireAuth(), middleware.RequireRole(user.RoleEmployer, user.RoleAdmin))
		{
			employerRoutes.GET("/vacancies", vacancyHandler.ListMyVacancies)
			employerRoutes.GET("/vacancies/:id", vacancyHandler.GetEmployerVacancy)
			employerRoutes.POST("/vacancies", vacancyHandler.CreateVacancy)
			employerRoutes.PUT("/vacancies/:id", vacancyHandler.UpdateVacancy)
			employerRoutes.DELETE("/vacancies/:id", vacancyHandler.DeleteVacancy)
			employerRoutes.GET("/vacancies/:id/applications", applicationHandler.ListEmployerVacancyApplications)
			employerRoutes.GET("/applications", applicationHandler.ListEmployerApplications)
			employerRoutes.GET("/applications/:id", applicationHandler.GetEmployerApplication)
			employerRoutes.PATCH("/applications/:id/status", applicationHandler.UpdateApplicationStatus)
			employerRoutes.GET("/candidates", candidateHandler.ListCandidates)
			employerRoutes.GET("/candidates/:id", candidateHandler.GetCandidate)
		}

		resumeRoutes := api.Group("/resumes")
		resumeRoutes.Use(authMiddleware.RequireAuth(), middleware.RequireRole(user.RoleApplicant))
		{
			resumeRoutes.GET("/my", resumeHandler.ListMyResumes)
			resumeRoutes.POST("", resumeHandler.CreateResume)
			resumeRoutes.GET("/:id", resumeHandler.GetMyResume)
			resumeRoutes.PUT("/:id", resumeHandler.UpdateResume)
			resumeRoutes.DELETE("/:id", resumeHandler.DeleteResume)
			resumeRoutes.GET("/:id/preview", resumeHandler.GetResumePreview)
			resumeRoutes.GET("/:id/helper", resumeHandler.GetResumeHelper)
		}

		resumeTemplateRoutes := api.Group("/resume-templates")
		{
			resumeTemplateRoutes.GET("", resumeHandler.ListResumeTemplates)
		}

		api.GET("/gamification/users/:user_id", authMiddleware.RequireAuth(), courseHandler.GetUserGamification)

		courseRoutes := api.Group("/courses")
		{
			courseRoutes.GET("/my-progress", authMiddleware.RequireAuth(), courseHandler.ListMyProgress)
			courseRoutes.GET("/completed", authMiddleware.RequireAuth(), courseHandler.ListCompletedCourses)
			courseRoutes.GET("", courseHandler.ListCourses)
			courseRoutes.GET("/:id", courseHandler.GetCourse)
			courseRoutes.GET("/:id/quiz", courseHandler.GetQuiz)
			courseRoutes.GET("/:id/lessons/:lesson_id", courseHandler.GetLesson)
			courseRoutes.POST("/:id/start", authMiddleware.RequireAuth(), courseHandler.StartCourse)
			courseRoutes.POST("/:id/lessons/:lesson_id/complete", authMiddleware.RequireAuth(), courseHandler.CompleteLesson)
			courseRoutes.POST("/:id/quiz/submit", authMiddleware.RequireAuth(), courseHandler.SubmitQuiz)
		}

		applicationRoutes := api.Group("/applications")
		applicationRoutes.Use(authMiddleware.RequireAuth(), middleware.RequireRole(user.RoleApplicant))
		{
			applicationRoutes.GET("/my/:id", applicationHandler.GetMyApplication)
			applicationRoutes.GET("/my", applicationHandler.ListMyApplications)
			applicationRoutes.DELETE("/:id", applicationHandler.DeleteMyApplication)
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

func corsAllowedOrigins() []string {
	if raw := os.Getenv("CORS_ORIGINS"); raw != "" {
		parts := strings.Split(raw, ",")
		origins := make([]string, 0, len(parts))
		for _, part := range parts {
			origin := strings.TrimSpace(part)
			if origin != "" {
				origins = append(origins, origin)
			}
		}
		if len(origins) > 0 {
			return origins
		}
	}
	return []string{
		"http://localhost:5173",
		"http://127.0.0.1:5173",
		"http://5.35.99.120:5173",
	}
}

func ensureVacancySchema(ctx context.Context, pool *pgxpool.Pool) error {
	statements := []string{
		`ALTER TABLE vacancies ADD COLUMN IF NOT EXISTS duties TEXT`,
		`ALTER TABLE vacancies ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ`,
		`ALTER TABLE vacancies ALTER COLUMN specialization TYPE VARCHAR(64) USING specialization::text`,
		`ALTER TABLE vacancies ALTER COLUMN schedule TYPE VARCHAR(32) USING schedule::text`,
	}
	for _, stmt := range statements {
		if _, err := pool.Exec(ctx, stmt); err != nil {
			return err
		}
	}
	return nil
}

func ensureCompanySchema(ctx context.Context, pool *pgxpool.Pool) error {
	statements := []string{
		`DO $$ BEGIN
			CREATE TYPE company_size_range AS ENUM ('1-10', '11-50', '51-200', '201-500', '500+');
		EXCEPTION
			WHEN duplicate_object THEN null;
		END $$;`,
		`DO $$ BEGIN
			CREATE TYPE company_verification_status AS ENUM ('pending', 'verified', 'rejected');
		EXCEPTION
			WHEN duplicate_object THEN null;
		END $$;`,
		`ALTER TABLE companies ADD COLUMN IF NOT EXISTS slug VARCHAR(160)`,
		`ALTER TABLE companies ADD COLUMN IF NOT EXISTS industry_id INTEGER`,
		`ALTER TABLE companies ADD COLUMN IF NOT EXISTS website_url VARCHAR(255)`,
		`ALTER TABLE companies ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ`,
		`ALTER TABLE companies ADD COLUMN IF NOT EXISTS search_vector tsvector`,
		`DO $$
		DECLARE
			size_type text;
		BEGIN
			SELECT udt_name INTO size_type
			FROM information_schema.columns
			WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'size';
			IF size_type = 'companysize' THEN
				ALTER TABLE companies ADD COLUMN IF NOT EXISTS size_tmp company_size_range;
				UPDATE companies
				SET size_tmp = CASE
					WHEN size::text = 'SMALL' THEN '1-10'::company_size_range
					WHEN size::text = 'MEDIUM' THEN '11-50'::company_size_range
					WHEN size::text = 'LARGE' THEN '51-200'::company_size_range
					ELSE NULL
				END
				WHERE size_tmp IS NULL;
				ALTER TABLE companies DROP COLUMN IF EXISTS size;
				ALTER TABLE companies RENAME COLUMN size_tmp TO size;
			END IF;
		END $$;`,
		`DO $$
		DECLARE
			verified_type text;
		BEGIN
			SELECT data_type INTO verified_type
			FROM information_schema.columns
			WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'is_verified';
			IF verified_type = 'boolean' THEN
				ALTER TABLE companies
				ALTER COLUMN is_verified TYPE company_verification_status
				USING (CASE WHEN is_verified THEN 'verified'::company_verification_status ELSE 'pending'::company_verification_status END);
			ELSIF verified_type IS NULL THEN
				ALTER TABLE companies ADD COLUMN IF NOT EXISTS is_verified company_verification_status;
			END IF;
		END $$;`,
		`UPDATE companies SET is_verified = 'pending' WHERE is_verified IS NULL`,
		`ALTER TABLE companies ALTER COLUMN is_verified SET DEFAULT 'pending'`,
		`UPDATE companies
		SET slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || id
		WHERE slug IS NULL OR slug = ''`,
	}
	for _, stmt := range statements {
		if _, err := pool.Exec(ctx, stmt); err != nil {
			return err
		}
	}
	return nil
}
