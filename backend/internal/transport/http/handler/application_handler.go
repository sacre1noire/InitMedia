package handler

import (
	"errors"
	"net/http"
	"strconv"

	"backend/internal/domain/application"
	"backend/internal/domain/user"
	"backend/internal/transport/http/dto"
	"backend/internal/transport/http/middleware"
	applicationUsecase "backend/internal/usecase/application"
	vacancyUsecase "backend/internal/usecase/vacancy"

	"github.com/gin-gonic/gin"
)

type ApplicationHandler struct {
	usecase *applicationUsecase.ApplicationUseCase
}

func NewApplicationHandler(u *applicationUsecase.ApplicationUseCase) *ApplicationHandler {
	return &ApplicationHandler{usecase: u}
}

// ApplyToVacancy godoc
// @Summary      Apply to vacancy
// @Description  Create application for vacancy
// @Tags         applications
// @Accept       json
// @Produce      json
// @Param        id path int true "Vacancy ID"
// @Param        request body dto.CreateApplicationRequest false "Application payload"
// @Success      201  {object}  application.Application
// @Failure      400  {object}  map[string]string
// @Failure      401  {object}  map[string]string
// @Failure      403  {object}  map[string]string
// @Failure      404  {object}  map[string]string
// @Failure      409  {object}  map[string]string
// @Failure      500  {object}  map[string]string
// @Router       /api/vacancies/{id}/apply [post]
func (h *ApplicationHandler) ApplyToVacancy(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	roleVal, ok := c.Get(middleware.UserRoleCtxKey)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	role, _ := roleVal.(user.Role)
	if role != user.RoleApplicant {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only applicants can apply"})
		return
	}

	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id must be a valid integer"})
		return
	}

	var req dto.CreateApplicationRequest
	if err := c.ShouldBindJSON(&req); err != nil && err.Error() != "EOF" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request fields", "details": err.Error()})
		return
	}

	created, err := h.usecase.Apply(c.Request.Context(), id, userID, application.CreateApplicationInput{
		CoverLetter: req.CoverLetter,
		ResumeID:    req.ResumeID,
	})
	if err != nil {
		switch {
		case errors.Is(err, applicationUsecase.ErrApplicationAlreadyExists):
			c.JSON(http.StatusConflict, gin.H{"error": err.Error(), "detail": "Already applied"})
			return
		case errors.Is(err, vacancyUsecase.ErrVacancyNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		case errors.Is(err, applicationUsecase.ErrApplicationForbidden):
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
			return
		}
	}

	c.JSON(http.StatusCreated, created)
}

// ListMyApplications godoc
// @Summary      List my applications
// @Description  Returns applications for current applicant
// @Tags         applications
// @Produce      json
// @Success      200  {array}  application.Application
// @Failure      401  {object}  map[string]string
// @Failure      403  {object}  map[string]string
// @Failure      500  {object}  map[string]string
// @Router       /api/applications/my [get]
func (h *ApplicationHandler) ListMyApplications(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	roleVal, ok := c.Get(middleware.UserRoleCtxKey)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	role, _ := roleVal.(user.Role)
	if role != user.RoleApplicant {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only applicants can view applications"})
		return
	}

	items, err := h.usecase.ListMyApplications(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}

	c.JSON(http.StatusOK, items)
}

// GetMyApplication godoc
// @Summary      Get my application by id
// @Tags         applications
// @Produce      json
// @Param        id path int true "Application ID"
// @Success      200  {object}  application.Application
// @Failure      401  {object}  map[string]string
// @Failure      403  {object}  map[string]string
// @Failure      404  {object}  map[string]string
// @Router       /api/applications/my/{id} [get]
func (h *ApplicationHandler) GetMyApplication(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	roleVal, ok := c.Get(middleware.UserRoleCtxKey)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	role, _ := roleVal.(user.Role)
	if role != user.RoleApplicant {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only applicants can view applications"})
		return
	}
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id must be a valid integer"})
		return
	}
	app, err := h.usecase.GetMyApplication(c.Request.Context(), id, userID)
	if err != nil {
		switch {
		case errors.Is(err, applicationUsecase.ErrApplicationNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
			return
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
			return
		}
	}
	c.JSON(http.StatusOK, app)
}

// DeleteMyApplication godoc
// @Summary      Delete application
// @Description  Withdraw application for current applicant
// @Tags         applications
// @Produce      json
// @Param        id path int true "Application ID"
// @Success      200  {object}  map[string]string
// @Failure      400  {object}  map[string]string
// @Failure      401  {object}  map[string]string
// @Failure      403  {object}  map[string]string
// @Failure      404  {object}  map[string]string
// @Failure      500  {object}  map[string]string
// @Router       /api/applications/{id} [delete]
func (h *ApplicationHandler) DeleteMyApplication(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	roleVal, ok := c.Get(middleware.UserRoleCtxKey)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	role, _ := roleVal.(user.Role)
	if role != user.RoleApplicant {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only applicants can delete applications"})
		return
	}

	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id must be a valid integer"})
		return
	}

	if err := h.usecase.DeleteMyApplication(c.Request.Context(), id, userID); err != nil {
		switch {
		case errors.Is(err, applicationUsecase.ErrApplicationNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		case errors.Is(err, applicationUsecase.ErrApplicationForbidden):
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Application deleted"})
}

// ListEmployerApplications godoc
// @Summary      List employer applications
// @Description  Returns applications for employer vacancies
// @Tags         applications
// @Produce      json
// @Success      200  {array}  application.Application
// @Failure      401  {object}  map[string]string
// @Failure      403  {object}  map[string]string
// @Failure      500  {object}  map[string]string
// @Router       /api/employer/applications [get]
func (h *ApplicationHandler) ListEmployerApplications(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	roleVal, ok := c.Get(middleware.UserRoleCtxKey)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	role, _ := roleVal.(user.Role)
	if role != user.RoleEmployer && role != user.RoleAdmin {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only employers can view applications"})
		return
	}

	items, err := h.usecase.ListEmployerApplications(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}

	c.JSON(http.StatusOK, items)
}

// ListEmployerVacancyApplications godoc
// @Summary      List applications for vacancy
// @Description  Returns applications for employer vacancy
// @Tags         applications
// @Produce      json
// @Param        id path int true "Vacancy ID"
// @Success      200  {array}  application.Application
// @Failure      400  {object}  map[string]string
// @Failure      401  {object}  map[string]string
// @Failure      403  {object}  map[string]string
// @Failure      500  {object}  map[string]string
// @Router       /api/employer/vacancies/{id}/applications [get]
func (h *ApplicationHandler) ListEmployerVacancyApplications(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	roleVal, ok := c.Get(middleware.UserRoleCtxKey)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	role, _ := roleVal.(user.Role)
	if role != user.RoleEmployer && role != user.RoleAdmin {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only employers can view applications"})
		return
	}

	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id must be a valid integer"})
		return
	}

	items, err := h.usecase.ListEmployerVacancyApplications(c.Request.Context(), userID, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}

	c.JSON(http.StatusOK, items)
}

// GetEmployerApplication godoc
// @Summary      Get employer application
// @Description  Returns application details for employer
// @Tags         applications
// @Produce      json
// @Param        id path int true "Application ID"
// @Success      200  {object}  application.Application
// @Failure      400  {object}  map[string]string
// @Failure      401  {object}  map[string]string
// @Failure      403  {object}  map[string]string
// @Failure      404  {object}  map[string]string
// @Failure      500  {object}  map[string]string
// @Router       /api/employer/applications/{id} [get]
func (h *ApplicationHandler) GetEmployerApplication(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	roleVal, ok := c.Get(middleware.UserRoleCtxKey)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	role, _ := roleVal.(user.Role)
	if role != user.RoleEmployer && role != user.RoleAdmin {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only employers can view applications"})
		return
	}

	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id must be a valid integer"})
		return
	}

	app, err := h.usecase.GetEmployerApplication(c.Request.Context(), userID, id)
	if err != nil {
		if errors.Is(err, applicationUsecase.ErrApplicationNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}

	c.JSON(http.StatusOK, app)
}

// UpdateApplicationStatus godoc
// @Summary      Update application status
// @Description  Update application status for employer
// @Tags         applications
// @Accept       json
// @Produce      json
// @Param        id path int true "Application ID"
// @Param        request body dto.UpdateApplicationStatusRequest true "Status payload"
// @Success      200  {object}  application.Application
// @Failure      400  {object}  map[string]string
// @Failure      401  {object}  map[string]string
// @Failure      403  {object}  map[string]string
// @Failure      404  {object}  map[string]string
// @Failure      500  {object}  map[string]string
// @Router       /api/employer/applications/{id}/status [patch]
func (h *ApplicationHandler) UpdateApplicationStatus(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	roleVal, ok := c.Get(middleware.UserRoleCtxKey)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	role, _ := roleVal.(user.Role)
	if role != user.RoleEmployer && role != user.RoleAdmin {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only employers can update applications"})
		return
	}

	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id must be a valid integer"})
		return
	}

	var req dto.UpdateApplicationStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request fields", "details": err.Error()})
		return
	}

	updated, err := h.usecase.UpdateStatus(c.Request.Context(), userID, id, req.Status)
	if err != nil {
		switch {
		case errors.Is(err, applicationUsecase.ErrApplicationNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		case errors.Is(err, applicationUsecase.ErrApplicationInvalid):
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
			return
		}
	}

	c.JSON(http.StatusOK, updated)
}
