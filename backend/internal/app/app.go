// Package app wires platform-level dependencies (DB, JWT) into usecases and
// HTTP handlers, then exposes a configured *gin.Engine to cmd/api.
package app

import (
	"context"
	"os"
	"strings"
	"time"

	"backend/internal/platform/jwt"
	"backend/internal/repository/postgres"
	"backend/internal/transport/http/handler"
	"backend/internal/transport/http/middleware"
	applicationUseCase "backend/internal/usecase/application"
	companyUseCase "backend/internal/usecase/company"
	courseUseCase "backend/internal/usecase/course"
	matchingUseCase "backend/internal/usecase/matching"
	profileUseCase "backend/internal/usecase/profile"
	resumeUseCase "backend/internal/usecase/resume"
	userUseCase "backend/internal/usecase/user"
	vacancyUseCase "backend/internal/usecase/vacancy"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

// App holds wired dependencies needed by the HTTP layer.
type App struct {
	Pool *pgxpool.Pool

	AuthMiddleware *middleware.AuthMiddleware

	AuthHandler        *handler.AuthHandler
	ProfileHandler     *handler.ProfileHandler
	CompanyHandler     *handler.CompanyHandler
	CandidateHandler   *handler.CandidateHandler
	VacancyHandler     *handler.VacancyHandler
	ApplicationHandler *handler.ApplicationHandler
	MatchingHandler    *handler.MatchingHandler
	ResumeHandler      *handler.ResumeHandler
	CourseHandler      *handler.CourseHandler
}

// New wires repositories, usecases, handlers and middleware.
func New(pool *pgxpool.Pool) *App {
	userRepo := postgres.NewUserRepo(pool)
	sessionRepo := postgres.NewSessionRepo(pool)
	profileRepo := postgres.NewApplicantProfileRepo(pool)
	companyRepo := postgres.NewCompanyRepo(pool)
	vacancyRepo := postgres.NewVacancyRepo(pool)
	applicationRepo := postgres.NewApplicationRepo(pool)
	resumeRepo := postgres.NewResumeRepo(pool)
	courseRepo := postgres.NewCourseRepo(pool)

	tokenGenerator := jwt.NewTokenGenerator(os.Getenv("JWT_SECRET"), 15*time.Minute)

	authUC := userUseCase.NewAuthUseCase(userRepo, sessionRepo, tokenGenerator)
	profileUC := profileUseCase.NewProfileUseCase(profileRepo, userRepo)
	companyUC := companyUseCase.NewCompanyUseCase(companyRepo)
	vacancyUC := vacancyUseCase.NewVacancyUseCase(vacancyRepo, companyRepo)
	applicationUC := applicationUseCase.NewApplicationUseCase(applicationRepo, vacancyRepo, userRepo)
	matchingUC := matchingUseCase.NewUseCase(vacancyRepo, profileRepo)
	resumeUC := resumeUseCase.NewUseCase(resumeRepo)
	courseUC := courseUseCase.NewUseCase(courseRepo, userRepo)

	return &App{
		Pool:               pool,
		AuthMiddleware:     middleware.NewAuthMiddleware(tokenGenerator),
		AuthHandler:        handler.NewAuthHandler(authUC),
		ProfileHandler:     handler.NewProfileHandler(profileUC),
		CompanyHandler:     handler.NewCompanyHandler(companyUC),
		CandidateHandler:   handler.NewCandidateHandler(profileUC),
		VacancyHandler:     handler.NewVacancyHandler(vacancyUC),
		ApplicationHandler: handler.NewApplicationHandler(applicationUC),
		MatchingHandler:    handler.NewMatchingHandler(matchingUC),
		ResumeHandler:      handler.NewResumeHandler(resumeUC),
		CourseHandler:      handler.NewCourseHandler(courseUC),
	}
}

// Router builds the gin engine with CORS, system endpoints and API routes.
func (a *App) Router() *gin.Engine {
	r := gin.Default()
	r.Use(cors.New(cors.Config{
		AllowOrigins:     corsAllowedOrigins(),
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	a.registerSystemRoutes(r)
	a.registerAPIRoutes(r)
	return r
}

// Ping verifies DB connectivity. Used by /ready and at startup.
func (a *App) Ping(ctx context.Context) error {
	return a.Pool.Ping(ctx)
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
