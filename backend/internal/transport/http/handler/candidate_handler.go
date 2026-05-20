package handler

import (
	"net/http"
	"strconv"

	"backend/internal/domain/user"
	"backend/internal/transport/http/middleware"
	profileUseCase "backend/internal/usecase/profile"

	"github.com/gin-gonic/gin"
)

type CandidateHandler struct {
	profileUC *profileUseCase.ProfileUseCase
}

func NewCandidateHandler(profileUC *profileUseCase.ProfileUseCase) *CandidateHandler {
	return &CandidateHandler{profileUC: profileUC}
}

// ListCandidates godoc
// @Summary      List candidates
// @Tags         candidates
// @Produce      json
// @Param        search query string false "Search"
// @Param        limit query int false "Limit"
// @Param        offset query int false "Offset"
// @Success      200  {array}  profile.CandidateSummary
// @Failure      401  {object}  map[string]string
// @Failure      403  {object}  map[string]string
// @Failure      500  {object}  map[string]string
// @Router       /api/employer/candidates [get]
func (h *CandidateHandler) ListCandidates(c *gin.Context) {
	roleVal, ok := c.Get(middleware.UserRoleCtxKey)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	role, _ := roleVal.(user.Role)
	if role != user.RoleEmployer && role != user.RoleAdmin {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden"})
		return
	}

	search := c.Query("search")
	limitVal := c.DefaultQuery("limit", "20")
	offsetVal := c.DefaultQuery("offset", "0")
	limit, _ := strconv.ParseInt(limitVal, 10, 32)
	offset, _ := strconv.ParseInt(offsetVal, 10, 32)

	items, err := h.profileUC.ListCandidates(c.Request.Context(), search, int32(limit), int32(offset))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}

	c.JSON(http.StatusOK, items)
}

// GetCandidate godoc
// @Summary      Get candidate profile
// @Tags         candidates
// @Produce      json
// @Param        id path int true "Candidate user ID"
// @Success      200  {object}  profile.ApplicantProfile
// @Failure      400  {object}  map[string]string
// @Failure      401  {object}  map[string]string
// @Failure      403  {object}  map[string]string
// @Failure      404  {object}  map[string]string
// @Failure      500  {object}  map[string]string
// @Router       /api/employer/candidates/{id} [get]
func (h *CandidateHandler) GetCandidate(c *gin.Context) {
	roleVal, ok := c.Get(middleware.UserRoleCtxKey)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	role, _ := roleVal.(user.Role)
	if role != user.RoleEmployer && role != user.RoleAdmin {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden"})
		return
	}

	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id must be a valid integer"})
		return
	}

	candidate, err := h.profileUC.GetCandidate(c.Request.Context(), id)
	if err != nil {
		if err == profileUseCase.ErrProfileForbidden {
			c.JSON(http.StatusNotFound, gin.H{"error": "Candidate not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}

	c.JSON(http.StatusOK, candidate)
}
