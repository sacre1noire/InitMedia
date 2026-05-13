package handler

import (
	"errors"
	"net/http"
	"strconv"
	"strings"

	"backend/internal/domain/user"
	"backend/internal/domain/vacancy"
	"backend/internal/transport/http/dto"
	"backend/internal/transport/http/middleware"
	vacancyUsecase "backend/internal/usecase/vacancy"

	"github.com/gin-gonic/gin"
)

type VacancyHandler struct {
	usecase *vacancyUsecase.VacancyUseCase
}

func NewVacancyHandler(u *vacancyUsecase.VacancyUseCase) *VacancyHandler {
	return &VacancyHandler{usecase: u}
}

// ListVacancies godoc
// @Summary      List vacancies
// @Description  Returns public vacancies list
// @Tags         vacancies
// @Produce      json
// @Param        search query string false "Search text"
// @Param        type query string false "Vacancy type"
// @Param        specialization query string false "Specialization"
// @Param        schedule query string false "Schedule"
// @Param        city query string false "City"
// @Param        is_remote query bool false "Remote"
// @Param        salary_from query int false "Salary from"
// @Param        salary_to query int false "Salary to"
// @Param        limit query int false "Limit"
// @Param        offset query int false "Offset"
// @Param        skip query int false "Offset"
// @Param        sort query string false "Sort field"
// @Param        order query string false "Sort order"
// @Success      200  {object}  dto.VacancyListResponse
// @Failure      400  {object}  map[string]string
// @Failure      500  {object}  map[string]string
// @Router       /api/vacancies [get]
func (h *VacancyHandler) ListVacancies(c *gin.Context) {
	var query dto.ListVacanciesQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid query fields", "details": err.Error()})
		return
	}

	offset := query.Offset
	if offset == 0 && query.Skip > 0 {
		offset = query.Skip
	}

	filter := vacancy.ListVacancyFilter{
		Search:         query.Search,
		Specialization: normalizeOptional(query.Specialization),
		Schedule:       normalizeOptional(query.Schedule),
		City:           normalizeOptional(query.City),
		IsRemote:       query.IsRemote,
		SalaryFrom:     query.SalaryFrom,
		SalaryTo:       query.SalaryTo,
		Limit:          query.Limit,
		Offset:         offset,
		Sort:           query.Sort,
		Order:          query.Order,
	}
	if query.Type != nil && strings.TrimSpace(*query.Type) != "" {
		vType := vacancy.VacancyType(strings.ToLower(strings.TrimSpace(*query.Type)))
		filter.Type = &vType
	}

	items, total, err := h.usecase.ListPublic(c.Request.Context(), filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}

	c.JSON(http.StatusOK, dto.VacancyListResponse{Items: items, Total: total})
}

// GetVacancy godoc
// @Summary      Get vacancy by id
// @Description  Returns public vacancy by id
// @Tags         vacancies
// @Produce      json
// @Param        id path int true "Vacancy ID"
// @Success      200  {object}  vacancy.Vacancy
// @Failure      400  {object}  map[string]string
// @Failure      404  {object}  map[string]string
// @Failure      500  {object}  map[string]string
// @Router       /api/vacancies/{id} [get]
func (h *VacancyHandler) GetVacancy(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id must be a valid integer"})
		return
	}

	v, err := h.usecase.GetPublicByID(c.Request.Context(), id)
	if err != nil {
		if errors.Is(err, vacancyUsecase.ErrVacancyNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Vacancy not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}

	c.JSON(http.StatusOK, v)
}

// GetEmployerVacancy godoc
// @Summary      Get vacancy by id for employer
// @Description  Returns vacancy by id for current employer
// @Tags         vacancies
// @Produce      json
// @Param        id path int true "Vacancy ID"
// @Success      200  {object}  vacancy.Vacancy
// @Failure      400  {object}  map[string]string
// @Failure      401  {object}  map[string]string
// @Failure      403  {object}  map[string]string
// @Failure      404  {object}  map[string]string
// @Failure      500  {object}  map[string]string
// @Router       /api/employer/vacancies/{id} [get]
func (h *VacancyHandler) GetEmployerVacancy(c *gin.Context) {
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

	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id must be a valid integer"})
		return
	}

	v, err := h.usecase.GetByEmployer(c.Request.Context(), id, userID, string(role))
	if err != nil {
		switch {
		case errors.Is(err, vacancyUsecase.ErrVacancyNotFound), errors.Is(err, vacancyUsecase.ErrCompanyNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		case errors.Is(err, vacancyUsecase.ErrVacancyForbidden):
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
			return
		}
	}

	c.JSON(http.StatusOK, v)
}

// CreateVacancy godoc
// @Summary      Create vacancy
// @Description  Create vacancy for current employer
// @Tags         vacancies
// @Accept       json
// @Produce      json
// @Param        request body dto.CreateVacancyRequest true "Vacancy payload"
// @Success      201  {object}  vacancy.Vacancy
// @Failure      400  {object}  map[string]string
// @Failure      401  {object}  map[string]string
// @Failure      403  {object}  map[string]string
// @Failure      404  {object}  map[string]string
// @Failure      500  {object}  map[string]string
// @Router       /api/employer/vacancies [post]
func (h *VacancyHandler) CreateVacancy(c *gin.Context) {
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

	var req dto.CreateVacancyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request fields", "details": err.Error()})
		return
	}

	created, err := h.usecase.Create(c.Request.Context(), userID, string(role), vacancy.CreateVacancyInput{
		Title:          req.Title,
		Description:    req.Description,
		Requirements:   req.Requirements,
		Duties:         req.Duties,
		Type:           req.Type,
		Specialization: req.Specialization,
		Schedule:       req.Schedule,
		SalaryFrom:     req.SalaryFrom,
		SalaryTo:       req.SalaryTo,
		IsSalaryHidden: req.IsSalaryHidden,
		City:           req.City,
		IsRemote:       req.IsRemote,
		Status:         req.Status,
		ExpiresAt:      req.ExpiresAt,
	})
	if err != nil {
		switch {
		case errors.Is(err, vacancyUsecase.ErrCompanyNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		case errors.Is(err, vacancyUsecase.ErrVacancyForbidden):
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		case errors.Is(err, vacancyUsecase.ErrInvalidVacancyInput):
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
			return
		}
	}

	c.JSON(http.StatusCreated, created)
}

// UpdateVacancy godoc
// @Summary      Update vacancy
// @Description  Update vacancy for current employer
// @Tags         vacancies
// @Accept       json
// @Produce      json
// @Param        id path int true "Vacancy ID"
// @Param        request body dto.UpdateVacancyRequest true "Vacancy payload"
// @Success      200  {object}  vacancy.Vacancy
// @Failure      400  {object}  map[string]string
// @Failure      401  {object}  map[string]string
// @Failure      403  {object}  map[string]string
// @Failure      404  {object}  map[string]string
// @Failure      500  {object}  map[string]string
// @Router       /api/employer/vacancies/{id} [put]
func (h *VacancyHandler) UpdateVacancy(c *gin.Context) {
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

	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id must be a valid integer"})
		return
	}

	var req dto.UpdateVacancyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request fields", "details": err.Error()})
		return
	}

	updated, err := h.usecase.Update(c.Request.Context(), id, userID, string(role), vacancy.UpdateVacancyInput{
		Title:          req.Title,
		Description:    req.Description,
		Requirements:   req.Requirements,
		Duties:         req.Duties,
		Type:           req.Type,
		Specialization: req.Specialization,
		Schedule:       req.Schedule,
		SalaryFrom:     req.SalaryFrom,
		SalaryTo:       req.SalaryTo,
		IsSalaryHidden: req.IsSalaryHidden,
		City:           req.City,
		IsRemote:       req.IsRemote,
		Status:         req.Status,
		ExpiresAt:      req.ExpiresAt,
		PublishedAt:    req.PublishedAt,
	})
	if err != nil {
		switch {
		case errors.Is(err, vacancyUsecase.ErrVacancyNotFound), errors.Is(err, vacancyUsecase.ErrCompanyNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		case errors.Is(err, vacancyUsecase.ErrVacancyForbidden):
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		case errors.Is(err, vacancyUsecase.ErrInvalidVacancyInput):
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
			return
		}
	}

	c.JSON(http.StatusOK, updated)
}

// UpdateVacancyStatus godoc
// @Summary      Update vacancy status
// @Description  Update vacancy status for current employer
// @Tags         vacancies
// @Accept       json
// @Produce      json
// @Param        id path int true "Vacancy ID"
// @Param        request body dto.UpdateVacancyStatusRequest true "Status payload"
// @Success      200  {object}  vacancy.Vacancy
// @Failure      400  {object}  map[string]string
// @Failure      401  {object}  map[string]string
// @Failure      403  {object}  map[string]string
// @Failure      404  {object}  map[string]string
// @Failure      500  {object}  map[string]string
// @Router       /api/vacancies/{id}/status [patch]
func (h *VacancyHandler) UpdateVacancyStatus(c *gin.Context) {
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

	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id must be a valid integer"})
		return
	}

	var req dto.UpdateVacancyStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request fields", "details": err.Error()})
		return
	}

	updated, err := h.usecase.UpdateStatus(c.Request.Context(), id, userID, string(role), req.Status)
	if err != nil {
		switch {
		case errors.Is(err, vacancyUsecase.ErrVacancyNotFound), errors.Is(err, vacancyUsecase.ErrCompanyNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		case errors.Is(err, vacancyUsecase.ErrCompanyNotVerified), errors.Is(err, vacancyUsecase.ErrVacancyForbidden):
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		case errors.Is(err, vacancyUsecase.ErrInvalidVacancyInput):
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
			return
		}
	}

	c.JSON(http.StatusOK, updated)
}

// ListMyVacancies godoc
// @Summary      List employer vacancies
// @Description  Returns vacancies for current employer
// @Tags         vacancies
// @Produce      json
// @Success      200  {array}  vacancy.Vacancy
// @Failure      401  {object}  map[string]string
// @Failure      403  {object}  map[string]string
// @Failure      500  {object}  map[string]string
// @Router       /api/employer/vacancies [get]
func (h *VacancyHandler) ListMyVacancies(c *gin.Context) {
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

	items, err := h.usecase.ListByEmployer(c.Request.Context(), userID, string(role))
	if err != nil {
		if errors.Is(err, vacancyUsecase.ErrVacancyForbidden) {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}

	c.JSON(http.StatusOK, items)
}

// DeleteVacancy godoc
// @Summary      Delete vacancy
// @Description  Delete vacancy for current employer
// @Tags         vacancies
// @Produce      json
// @Param        id path int true "Vacancy ID"
// @Success      200  {object}  map[string]string
// @Failure      400  {object}  map[string]string
// @Failure      401  {object}  map[string]string
// @Failure      403  {object}  map[string]string
// @Failure      404  {object}  map[string]string
// @Failure      500  {object}  map[string]string
// @Router       /api/employer/vacancies/{id} [delete]
func (h *VacancyHandler) DeleteVacancy(c *gin.Context) {
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

	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id must be a valid integer"})
		return
	}

	if err := h.usecase.Delete(c.Request.Context(), id, userID, string(role)); err != nil {
		switch {
		case errors.Is(err, vacancyUsecase.ErrVacancyNotFound), errors.Is(err, vacancyUsecase.ErrCompanyNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		case errors.Is(err, vacancyUsecase.ErrVacancyForbidden):
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Vacancy deleted"})
}

func normalizeOptional(value *string) *string {
	if value == nil {
		return nil
	}
	trimmed := strings.TrimSpace(*value)
	if trimmed == "" {
		return nil
	}
	lower := strings.ToLower(trimmed)
	return &lower
}
