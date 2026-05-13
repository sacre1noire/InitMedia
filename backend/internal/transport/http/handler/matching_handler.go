package handler

import (
	"net/http"
	"strconv"

	"backend/internal/transport/http/dto"
	"backend/internal/transport/http/middleware"
	matchingUsecase "backend/internal/usecase/matching"

	"github.com/gin-gonic/gin"
)

type MatchingHandler struct {
	usecase *matchingUsecase.UseCase
}

func NewMatchingHandler(u *matchingUsecase.UseCase) *MatchingHandler {
	return &MatchingHandler{usecase: u}
}

// GetRecommendedVacancies godoc
// @Summary      Get recommended vacancies
// @Description  Returns matching vacancies for current applicant
// @Tags         matching
// @Produce      json
// @Param        limit query int false "Limit"
// @Success      200  {object}  dto.MatchingResponse
// @Failure      401  {object}  map[string]string
// @Failure      500  {object}  map[string]string
// @Router       /api/vacancies/recommended [get]
func (h *MatchingHandler) GetRecommendedVacancies(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	limit := int32(0)
	if val := c.Query("limit"); val != "" {
		parsed, err := strconv.ParseInt(val, 10, 32)
		if err == nil {
			limit = int32(parsed)
		}
	}

	items, err := h.usecase.Recommend(c.Request.Context(), userID, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}

	c.JSON(http.StatusOK, dto.MatchingResponse{Items: items})
}
