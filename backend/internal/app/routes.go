package app

import (
	"context"
	"net/http"

	"backend/internal/domain/user"
	"backend/internal/transport/http/middleware"

	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

func (a *App) registerSystemRoutes(r *gin.Engine) {
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
	r.Static("/uploads", "./uploads")

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

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "UP"})
	})

	r.GET("/ready", func(c *gin.Context) {
		if err := a.Ping(context.Background()); err != nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{
				"status": "DOWN",
				"error":  "Database not reachable",
			})
			return
		}
		c.JSON(http.StatusOK, gin.H{"status": "READY"})
	})
}

func (a *App) registerAPIRoutes(r *gin.Engine) {
	auth := a.AuthMiddleware.RequireAuth()

	api := r.Group("/api")

	authRoutes := api.Group("/auth")
	{
		authRoutes.POST("/register", a.AuthHandler.Register)
		authRoutes.POST("/login", a.AuthHandler.Login)
		authRoutes.POST("/refresh", a.AuthHandler.RefreshTokens)
		authRoutes.POST("/logout", a.AuthHandler.Logout)
		authRoutes.GET("/me", auth, a.AuthHandler.Me)
	}

	protectedRoutes := api.Group("/protected")
	protectedRoutes.Use(auth)
	{
		protectedRoutes.GET("/profile", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"message": "This is a protected route"})
		})
	}

	profileRoutes := api.Group("/profile")
	profileRoutes.Use(auth, middleware.RequireRole(user.RoleApplicant))
	{
		profileRoutes.GET("/me", a.ProfileHandler.GetMyProfile)
		profileRoutes.PUT("/me", a.ProfileHandler.UpdateMyProfile)
		profileRoutes.PATCH("/me/avatar", a.ProfileHandler.UploadAvatar)
	}

	applicantRoutes := api.Group("/applicants")
	applicantRoutes.Use(auth)
	{
		applicantRoutes.GET("/:id", a.ProfileHandler.GetApplicantSummary)
	}

	companyRoutes := api.Group("/companies")
	companyRoutes.Use(auth, middleware.RequireRole(user.RoleEmployer, user.RoleAdmin))
	{
		companyRoutes.POST("", a.CompanyHandler.CreateCompany)
		companyRoutes.GET("", a.CompanyHandler.ListCompanies)
		companyRoutes.GET("/:id", a.CompanyHandler.GetCompanyByID)
		companyRoutes.PUT("/:id", a.CompanyHandler.ReplaceCompany)
		companyRoutes.PATCH("/:id", a.CompanyHandler.UpdateCompany)
		companyRoutes.DELETE("/:id", a.CompanyHandler.DeleteCompany)
	}

	employerOrAdmin := middleware.RequireRole(user.RoleEmployer, user.RoleAdmin)
	vacancyRoutes := api.Group("/vacancies")
	{
		vacancyRoutes.GET("", a.VacancyHandler.ListVacancies)
		vacancyRoutes.POST("", auth, employerOrAdmin, a.VacancyHandler.CreateVacancy)
		vacancyRoutes.GET("/recommended", auth, a.MatchingHandler.GetRecommendedVacancies)
		vacancyRoutes.PUT("/:id", auth, employerOrAdmin, a.VacancyHandler.UpdateVacancy)
		vacancyRoutes.DELETE("/:id", auth, employerOrAdmin, a.VacancyHandler.DeleteVacancy)
		vacancyRoutes.GET("/:id", a.VacancyHandler.GetVacancy)
		vacancyRoutes.PATCH("/:id/status", auth, employerOrAdmin, a.VacancyHandler.UpdateVacancyStatus)
		vacancyRoutes.POST("/:id/apply", auth, middleware.RequireRole(user.RoleApplicant), a.ApplicationHandler.ApplyToVacancy)
	}

	employerRoutes := api.Group("/employer")
	employerRoutes.Use(auth, employerOrAdmin)
	{
		employerRoutes.GET("/vacancies", a.VacancyHandler.ListMyVacancies)
		employerRoutes.GET("/vacancies/:id", a.VacancyHandler.GetEmployerVacancy)
		employerRoutes.POST("/vacancies", a.VacancyHandler.CreateVacancy)
		employerRoutes.PUT("/vacancies/:id", a.VacancyHandler.UpdateVacancy)
		employerRoutes.DELETE("/vacancies/:id", a.VacancyHandler.DeleteVacancy)
		employerRoutes.GET("/vacancies/:id/applications", a.ApplicationHandler.ListEmployerVacancyApplications)
		employerRoutes.GET("/applications", a.ApplicationHandler.ListEmployerApplications)
		employerRoutes.GET("/applications/:id", a.ApplicationHandler.GetEmployerApplication)
		employerRoutes.PATCH("/applications/:id/status", a.ApplicationHandler.UpdateApplicationStatus)
		employerRoutes.GET("/candidates", a.CandidateHandler.ListCandidates)
		employerRoutes.GET("/candidates/:id", a.CandidateHandler.GetCandidate)
	}

	resumeRoutes := api.Group("/resumes")
	resumeRoutes.Use(auth, middleware.RequireRole(user.RoleApplicant))
	{
		resumeRoutes.GET("/my", a.ResumeHandler.ListMyResumes)
		resumeRoutes.POST("", a.ResumeHandler.CreateResume)
		resumeRoutes.GET("/:id", a.ResumeHandler.GetMyResume)
		resumeRoutes.PUT("/:id", a.ResumeHandler.UpdateResume)
		resumeRoutes.DELETE("/:id", a.ResumeHandler.DeleteResume)
		resumeRoutes.GET("/:id/preview", a.ResumeHandler.GetResumePreview)
		resumeRoutes.GET("/:id/helper", a.ResumeHandler.GetResumeHelper)
	}

	api.GET("/resume-templates", a.ResumeHandler.ListResumeTemplates)
	api.GET("/gamification/users/:user_id", auth, a.CourseHandler.GetUserGamification)

	courseRoutes := api.Group("/courses")
	{
		courseRoutes.GET("/my-progress", auth, a.CourseHandler.ListMyProgress)
		courseRoutes.GET("/completed", auth, a.CourseHandler.ListCompletedCourses)
		courseRoutes.GET("", a.CourseHandler.ListCourses)
		courseRoutes.GET("/:id", a.CourseHandler.GetCourse)
		courseRoutes.GET("/:id/quiz", a.CourseHandler.GetQuiz)
		courseRoutes.GET("/:id/lessons/:lesson_id", a.CourseHandler.GetLesson)
		courseRoutes.POST("/:id/start", auth, a.CourseHandler.StartCourse)
		courseRoutes.POST("/:id/lessons/:lesson_id/complete", auth, a.CourseHandler.CompleteLesson)
		courseRoutes.POST("/:id/quiz/submit", auth, a.CourseHandler.SubmitQuiz)
	}

	applicationRoutes := api.Group("/applications")
	applicationRoutes.Use(auth, middleware.RequireRole(user.RoleApplicant))
	{
		applicationRoutes.GET("/my/:id", a.ApplicationHandler.GetMyApplication)
		applicationRoutes.GET("/my", a.ApplicationHandler.ListMyApplications)
		applicationRoutes.DELETE("/:id", a.ApplicationHandler.DeleteMyApplication)
	}
}
