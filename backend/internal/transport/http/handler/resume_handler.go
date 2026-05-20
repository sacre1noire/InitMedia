package handler

import (
	"net/http"
	"strconv"

	"backend/internal/domain/resume"
	"backend/internal/domain/user"
	"backend/internal/transport/http/dto"
	"backend/internal/transport/http/middleware"
	resumeusecase "backend/internal/usecase/resume"

	"github.com/gin-gonic/gin"
)

type ResumeHandler struct {
	uc *resumeusecase.UseCase
}

func NewResumeHandler(uc *resumeusecase.UseCase) *ResumeHandler {
	return &ResumeHandler{uc: uc}
}

// ListMyResumes godoc
// @Summary      List my resumes
// @Tags         resumes
// @Produce      json
// @Success      200  {array}  resume.Resume
// @Router       /api/resumes/my [get]
func (h *ResumeHandler) ListMyResumes(c *gin.Context) {
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
		c.JSON(http.StatusForbidden, gin.H{"error": "Only applicants have resumes"})
		return
	}
	items, err := h.uc.ListMine(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}
	c.JSON(http.StatusOK, items)
}

// GetMyResume godoc
// @Summary      Get resume by id
// @Tags         resumes
// @Produce      json
// @Param        id path int true "Resume ID"
// @Success      200  {object}  resume.Resume
// @Failure      400  {object}  map[string]string
// @Failure      401  {object}  map[string]string
// @Failure      403  {object}  map[string]string
// @Failure      404  {object}  map[string]string
// @Failure      500  {object}  map[string]string
// @Router       /api/resumes/{id} [get]
func (h *ResumeHandler) GetMyResume(c *gin.Context) {
	userID, _, ok := ensureApplicant(c)
	if !ok {
		return
	}

	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id must be a valid integer"})
		return
	}

	item, err := h.uc.GetByID(c.Request.Context(), userID, id)
	if err != nil {
		switch err {
		case resumeusecase.ErrResumeNotFound:
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
			return
		}
	}

	c.JSON(http.StatusOK, item)
}

// CreateResume godoc
// @Summary      Create resume
// @Tags         resumes
// @Accept       json
// @Produce      json
// @Param        request body dto.CreateResumeRequest true "Resume payload"
// @Success      201  {object}  resume.Resume
// @Failure      400  {object}  map[string]string
// @Failure      401  {object}  map[string]string
// @Failure      403  {object}  map[string]string
// @Failure      404  {object}  map[string]string
// @Failure      500  {object}  map[string]string
// @Router       /api/resumes [post]
func (h *ResumeHandler) CreateResume(c *gin.Context) {
	userID, _, ok := ensureApplicant(c)
	if !ok {
		return
	}

	var req dto.CreateResumeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request fields", "details": err.Error()})
		return
	}

	created, err := h.uc.Create(c.Request.Context(), userID, resume.Resume{
		Title:      req.Title,
		TemplateID: req.TemplateID,
		IsPrimary:  req.IsPrimary,
		Content:    &req.Content,
	})
	if err != nil {
		switch err {
		case resumeusecase.ErrInvalidResumeInput:
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		case resumeusecase.ErrTemplateNotFound:
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
			return
		}
	}

	c.JSON(http.StatusCreated, created)
}

// UpdateResume godoc
// @Summary      Update resume
// @Tags         resumes
// @Accept       json
// @Produce      json
// @Param        id path int true "Resume ID"
// @Param        request body dto.UpdateResumeRequest true "Resume payload"
// @Success      200  {object}  resume.Resume
// @Failure      400  {object}  map[string]string
// @Failure      401  {object}  map[string]string
// @Failure      403  {object}  map[string]string
// @Failure      404  {object}  map[string]string
// @Failure      500  {object}  map[string]string
// @Router       /api/resumes/{id} [put]
func (h *ResumeHandler) UpdateResume(c *gin.Context) {
	userID, _, ok := ensureApplicant(c)
	if !ok {
		return
	}

	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id must be a valid integer"})
		return
	}

	var req dto.UpdateResumeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request fields", "details": err.Error()})
		return
	}

	updated, err := h.uc.Update(c.Request.Context(), userID, id, resume.Resume{
		Title:      req.Title,
		TemplateID: req.TemplateID,
		IsPrimary:  req.IsPrimary,
		Content:    &req.Content,
	})
	if err != nil {
		switch err {
		case resumeusecase.ErrInvalidResumeInput:
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		case resumeusecase.ErrResumeNotFound, resumeusecase.ErrTemplateNotFound:
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
			return
		}
	}

	c.JSON(http.StatusOK, updated)
}

// DeleteResume godoc
// @Summary      Delete resume
// @Tags         resumes
// @Param        id path int true "Resume ID"
// @Success      200  {object}  map[string]string
// @Failure      400  {object}  map[string]string
// @Failure      401  {object}  map[string]string
// @Failure      403  {object}  map[string]string
// @Failure      404  {object}  map[string]string
// @Failure      500  {object}  map[string]string
// @Router       /api/resumes/{id} [delete]
func (h *ResumeHandler) DeleteResume(c *gin.Context) {
	userID, _, ok := ensureApplicant(c)
	if !ok {
		return
	}

	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id must be a valid integer"})
		return
	}

	if err := h.uc.Delete(c.Request.Context(), userID, id); err != nil {
		switch err {
		case resumeusecase.ErrResumeNotFound:
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Resume deleted"})
}

// ListResumeTemplates godoc
// @Summary      List resume templates
// @Tags         resumes
// @Produce      json
// @Success      200  {array}  resume.ResumeTemplate
// @Failure      500  {object}  map[string]string
// @Router       /api/resume-templates [get]
func (h *ResumeHandler) ListResumeTemplates(c *gin.Context) {
	items, err := h.uc.ListTemplates(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}
	c.JSON(http.StatusOK, items)
}

// GetResumePreview godoc
// @Summary      Get resume HTML preview
// @Tags         resumes
// @Produce      json
// @Param        id path int true "Resume ID"
// @Success      200  {object}  dto.ResumePreviewResponse
// @Failure      400  {object}  map[string]string
// @Failure      401  {object}  map[string]string
// @Failure      403  {object}  map[string]string
// @Failure      404  {object}  map[string]string
// @Failure      500  {object}  map[string]string
// @Router       /api/resumes/{id}/preview [get]
func (h *ResumeHandler) GetResumePreview(c *gin.Context) {
	userID, _, ok := ensureApplicant(c)
	if !ok {
		return
	}

	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id must be a valid integer"})
		return
	}

	html, err := h.uc.GetPreviewHTML(c.Request.Context(), userID, id)
	if err != nil {
		switch err {
		case resumeusecase.ErrResumeNotFound, resumeusecase.ErrTemplateNotFound:
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
			return
		}
	}

	c.JSON(http.StatusOK, dto.ResumePreviewResponse{HTML: html})
}

// GetResumeHelper godoc
// @Summary      Get resume helper recommendations
// @Tags         resumes
// @Produce      json
// @Param        id path int true "Resume ID"
// @Success      200  {object}  resume_agent.HelperResponse
// @Failure      400  {object}  map[string]string
// @Failure      401  {object}  map[string]string
// @Failure      403  {object}  map[string]string
// @Failure      404  {object}  map[string]string
// @Failure      500  {object}  map[string]string
// @Router       /api/resumes/{id}/helper [get]
func (h *ResumeHandler) GetResumeHelper(c *gin.Context) {
	userID, _, ok := ensureApplicant(c)
	if !ok {
		return
	}

	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id must be a valid integer"})
		return
	}

	resp, err := h.uc.GetHelper(c.Request.Context(), userID, id)
	if err != nil {
		switch err {
		case resumeusecase.ErrResumeNotFound:
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
			return
		}
	}

	c.JSON(http.StatusOK, resp)
}

func ensureApplicant(c *gin.Context) (int64, user.Role, bool) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return 0, "", false
	}
	roleVal, ok := c.Get(middleware.UserRoleCtxKey)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return 0, "", false
	}
	role, _ := roleVal.(user.Role)
	if role != user.RoleApplicant {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only applicants have resumes"})
		return 0, "", false
	}
	return userID, role, true
}
