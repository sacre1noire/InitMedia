package handler

import (
	"errors"
	"net/http"
	"strconv"

	"backend/internal/domain/company"
	"backend/internal/domain/user"
	"backend/internal/transport/http/dto"
	"backend/internal/transport/http/middleware"
	companyUsecase "backend/internal/usecase/company"

	"github.com/gin-gonic/gin"
)

type CompanyHandler struct {
	usecase *companyUsecase.CompanyUseCase
}

func NewCompanyHandler(u *companyUsecase.CompanyUseCase) *CompanyHandler {
	return &CompanyHandler{usecase: u}
}

// ListCompanies godoc
// @Summary      List companies
// @Description  Returns companies available for current employer/admin
// @Tags         companies
// @Produce      json
// @Param        industry_id query int false "Industry ID"
// @Param        size query string false "Company size"
// @Param        limit query int false "Limit"
// @Param        offset query int false "Offset"
// @Success      200  {array}  company.Company
// @Failure      400  {object}  map[string]string
// @Failure      401  {object}  map[string]string
// @Failure      403  {object}  map[string]string
// @Failure      500  {object}  map[string]string
// @Router       /api/companies [get]
func (h *CompanyHandler) ListCompanies(c *gin.Context) {
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

	var query dto.ListCompaniesQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid query fields", "details": err.Error()})
		return
	}

	companies, err := h.usecase.List(c.Request.Context(), userID, string(role), company.ListCompanyFilter{
		IndustryID: query.IndustryID,
		Size:       query.Size,
		Limit:      query.Limit,
		Offset:     query.Offset,
	})
	if err != nil {
		if errors.Is(err, companyUsecase.ErrForbiddenCompanyUpdate) {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}

	c.JSON(http.StatusOK, companies)
}

// GetCompanyByID godoc
// @Summary      Get company by id
// @Description  Returns company by id for owner/admin
// @Tags         companies
// @Produce      json
// @Param        id path int true "Company ID"
// @Success      200  {object}  company.Company
// @Failure      400  {object}  map[string]string
// @Failure      401  {object}  map[string]string
// @Failure      403  {object}  map[string]string
// @Failure      404  {object}  map[string]string
// @Failure      500  {object}  map[string]string
// @Router       /api/companies/{id} [get]
func (h *CompanyHandler) GetCompanyByID(c *gin.Context) {
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

	idVal := c.Param("id")
	id, err := strconv.ParseInt(idVal, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id must be a valid integer"})
		return
	}

	companyData, err := h.usecase.GetByID(c.Request.Context(), id, userID, string(role))
	if err != nil {
		if errors.Is(err, companyUsecase.ErrCompanyNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		if errors.Is(err, companyUsecase.ErrForbiddenCompanyUpdate) {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}

	c.JSON(http.StatusOK, companyData)
}

// CreateCompany godoc
// @Summary      Create company
// @Description  Create a new company for current employer
// @Tags         companies
// @Accept       json
// @Produce      json
// @Param        request body dto.CreateCompanyRequest true "Company payload"
// @Success      201  {object}  company.Company
// @Failure      400  {object}  map[string]string
// @Failure      401  {object}  map[string]string
// @Failure      403  {object}  map[string]string
// @Failure      409  {object}  map[string]string
// @Failure      500  {object}  map[string]string
// @Router       /api/companies [post]
func (h *CompanyHandler) CreateCompany(c *gin.Context) {
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

	var req dto.CreateCompanyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request fields", "details": err.Error()})
		return
	}

	created, err := h.usecase.Create(c.Request.Context(), userID, string(role), company.CreateCompanyInput{
		Name:        req.Name,
		Description: req.Description,
		IndustryID:  req.IndustryID,
		WebsiteURL:  req.WebsiteURL,
		LogoURL:     req.LogoURL,
		Size:        req.Size,
	})
	if err != nil {
		if errors.Is(err, companyUsecase.ErrOwnerAlreadyHasCompany) {
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
			return
		}
		if errors.Is(err, companyUsecase.ErrForbiddenCompanyUpdate) {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		}
		if errors.Is(err, companyUsecase.ErrInvalidCompanyPayload) {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}

	c.JSON(http.StatusCreated, created)
}

// GetCompanyBySlug godoc
// @Summary      Get company by slug
// @Description  Public company profile endpoint
// @Tags         companies
// @Produce      json
// @Param        slug path string true "Company slug"
// @Success      200  {object}  company.Company
// @Failure      404  {object}  map[string]string
// @Failure      500  {object}  map[string]string
// @Router       /api/companies/{slug} [get]
func (h *CompanyHandler) GetCompanyBySlug(c *gin.Context) {
	slug := c.Param("slug")
	if slug == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "slug is required"})
		return
	}

	companyData, err := h.usecase.GetBySlug(c.Request.Context(), slug)
	if err != nil {
		if errors.Is(err, companyUsecase.ErrCompanyNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}

	c.JSON(http.StatusOK, companyData)
}

// UpdateCompany godoc
// @Summary      Update company
// @Description  Update company info (owner or admin only)
// @Tags         companies
// @Accept       json
// @Produce      json
// @Param        id path int true "Company ID"
// @Param        request body dto.UpdateCompanyRequest true "Company patch payload"
// @Success      200  {object}  company.Company
// @Failure      400  {object}  map[string]string
// @Failure      401  {object}  map[string]string
// @Failure      403  {object}  map[string]string
// @Failure      404  {object}  map[string]string
// @Failure      500  {object}  map[string]string
// @Router       /api/companies/{id} [patch]
func (h *CompanyHandler) UpdateCompany(c *gin.Context) {
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

	idVal := c.Param("id")
	id, err := strconv.ParseInt(idVal, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id must be a valid integer"})
		return
	}

	var req dto.UpdateCompanyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request fields", "details": err.Error()})
		return
	}

	updated, err := h.usecase.Update(c.Request.Context(), id, userID, string(role), company.UpdateCompanyInput{
		Name:        req.Name,
		Description: req.Description,
		IndustryID:  req.IndustryID,
		WebsiteURL:  req.WebsiteURL,
		LogoURL:     req.LogoURL,
		Size:        req.Size,
	})
	if err != nil {
		if errors.Is(err, companyUsecase.ErrCompanyNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		if errors.Is(err, companyUsecase.ErrForbiddenCompanyUpdate) {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		}
		if errors.Is(err, companyUsecase.ErrInvalidCompanyPayload) {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}

	c.JSON(http.StatusOK, updated)
}

// ReplaceCompany godoc
// @Summary      Replace company
// @Description  Full company update by owner/admin
// @Tags         companies
// @Accept       json
// @Produce      json
// @Param        id path int true "Company ID"
// @Param        request body dto.ReplaceCompanyRequest true "Company payload"
// @Success      200  {object}  company.Company
// @Failure      400  {object}  map[string]string
// @Failure      401  {object}  map[string]string
// @Failure      403  {object}  map[string]string
// @Failure      404  {object}  map[string]string
// @Failure      500  {object}  map[string]string
// @Router       /api/companies/{id} [put]
func (h *CompanyHandler) ReplaceCompany(c *gin.Context) {
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

	idVal := c.Param("id")
	id, err := strconv.ParseInt(idVal, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id must be a valid integer"})
		return
	}

	var req dto.ReplaceCompanyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request fields", "details": err.Error()})
		return
	}

	updated, err := h.usecase.Replace(c.Request.Context(), id, userID, string(role), company.ReplaceCompanyInput{
		Name:        req.Name,
		Description: req.Description,
		IndustryID:  req.IndustryID,
		WebsiteURL:  req.WebsiteURL,
		LogoURL:     req.LogoURL,
		Size:        req.Size,
	})
	if err != nil {
		if errors.Is(err, companyUsecase.ErrCompanyNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		if errors.Is(err, companyUsecase.ErrForbiddenCompanyUpdate) {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		}
		if errors.Is(err, companyUsecase.ErrInvalidCompanyPayload) {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}

	c.JSON(http.StatusOK, updated)
}

// DeleteCompany godoc
// @Summary      Delete company
// @Description  Soft delete company (owner or admin only)
// @Tags         companies
// @Produce      json
// @Param        id path int true "Company ID"
// @Success      204
// @Failure      400  {object}  map[string]string
// @Failure      401  {object}  map[string]string
// @Failure      403  {object}  map[string]string
// @Failure      404  {object}  map[string]string
// @Failure      500  {object}  map[string]string
// @Router       /api/companies/{id} [delete]
func (h *CompanyHandler) DeleteCompany(c *gin.Context) {
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

	idVal := c.Param("id")
	id, err := strconv.ParseInt(idVal, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id must be a valid integer"})
		return
	}

	if err := h.usecase.Delete(c.Request.Context(), id, userID, string(role)); err != nil {
		if errors.Is(err, companyUsecase.ErrCompanyNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		if errors.Is(err, companyUsecase.ErrForbiddenCompanyUpdate) {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}

	c.Status(http.StatusNoContent)
}
