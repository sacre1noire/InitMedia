package handler

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"backend/internal/transport/http/dto"
	"backend/internal/transport/http/middleware"
	profileUseCase "backend/internal/usecase/profile"

	"github.com/gin-gonic/gin"
)

type ProfileHandler struct {
	profileUseCase *profileUseCase.ProfileUseCase
}

func NewProfileHandler(u *profileUseCase.ProfileUseCase) *ProfileHandler {
	return &ProfileHandler{profileUseCase: u}
}

// GetMyProfile godoc
// @Summary      Get applicant profile
// @Description  Returns current applicant profile
// @Tags         profile
// @Produce      json
// @Success      200  {object}  profile.ApplicantProfile
// @Failure      401  {object}  map[string]string
// @Failure      403  {object}  map[string]string
// @Failure      500  {object}  map[string]string
// @Router       /api/profile/me [get]
func (h *ProfileHandler) GetMyProfile(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	profile, err := h.profileUseCase.GetMyProfile(c.Request.Context(), userID)
	if err != nil {
		if err == profileUseCase.ErrProfileForbidden {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}

	c.JSON(http.StatusOK, profile)
}

// UpdateMyProfile godoc
// @Summary      Update applicant profile
// @Description  Creates or updates current applicant profile
// @Tags         profile
// @Accept       json
// @Produce      json
// @Param        request body dto.UpdateApplicantProfileRequest true "Profile payload"
// @Success      200  {object}  profile.ApplicantProfile
// @Failure      400  {object}  map[string]string
// @Failure      401  {object}  map[string]string
// @Failure      403  {object}  map[string]string
// @Failure      500  {object}  map[string]string
// @Router       /api/profile/me [put]
func (h *ProfileHandler) UpdateMyProfile(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req dto.UpdateApplicantProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request fields", "details": err.Error()})
		return
	}

	updated, err := h.profileUseCase.UpdateMyProfile(c.Request.Context(), userID, req)
	if err != nil {
		switch err {
		case profileUseCase.ErrProfileForbidden,
			profileUseCase.ErrInvalidEducationLevel,
			profileUseCase.ErrInvalidStudyCourse,
			profileUseCase.ErrInvalidSpecialization,
			profileUseCase.ErrInvalidSkillLevel,
			profileUseCase.ErrInvalidEmploymentType,
			profileUseCase.ErrInvalidSchedulePreference:
			status := http.StatusBadRequest
			if err == profileUseCase.ErrProfileForbidden {
				status = http.StatusForbidden
			}
			c.JSON(status, gin.H{"error": err.Error()})
			return
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
			return
		}
	}

	c.JSON(http.StatusOK, updated)
}

// UploadAvatar godoc
// @Summary      Upload applicant avatar
// @Description  Uploads avatar image from device and updates profile avatar_url
// @Tags         profile
// @Accept       multipart/form-data
// @Produce      json
// @Param        file formData file true "Avatar image"
// @Success      200  {object}  profile.ApplicantProfile
// @Failure      400  {object}  map[string]string
// @Failure      401  {object}  map[string]string
// @Failure      403  {object}  map[string]string
// @Failure      500  {object}  map[string]string
// @Router       /api/profile/me/avatar [patch]
func (h *ProfileHandler) UploadAvatar(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Avatar file is required"})
		return
	}

	if file.Size > 5*1024*1024 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Avatar file size must be <= 5MB"})
		return
	}

	ext := strings.ToLower(filepath.Ext(file.Filename))
	allowedExt := map[string]bool{
		".jpg":  true,
		".jpeg": true,
		".png":  true,
		".webp": true,
	}
	if !allowedExt[ext] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Only .jpg, .jpeg, .png and .webp files are allowed"})
		return
	}

	uploadDir := filepath.Join("uploads", "avatars")
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to prepare upload directory"})
		return
	}

	filename := fmt.Sprintf("%d_%d%s", userID, time.Now().UnixNano(), ext)
	filePath := filepath.Join(uploadDir, filename)
	if err := c.SaveUploadedFile(file, filePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save avatar file"})
		return
	}

	scheme := "http"
	if c.Request.TLS != nil {
		scheme = "https"
	}
	if forwardedProto := c.GetHeader("X-Forwarded-Proto"); forwardedProto != "" {
		scheme = forwardedProto
	}

	avatarURL := fmt.Sprintf("%s://%s/uploads/avatars/%s", scheme, c.Request.Host, filename)
	updated, err := h.profileUseCase.UpdateMyProfile(c.Request.Context(), userID, dto.UpdateApplicantProfileRequest{
		AvatarURL: &avatarURL,
	})
	if err != nil {
		switch err {
		case profileUseCase.ErrProfileForbidden:
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
			return
		}
	}

	c.JSON(http.StatusOK, updated)
}

// GetApplicantSummary godoc
// @Summary      Get applicant public profile summary
// @Description  Returns limited applicant profile for authenticated users
// @Tags         profile
// @Produce      json
// @Param        id path int true "Applicant user ID"
// @Success      200  {object}  dto.PublicApplicantProfileResponse
// @Failure      400  {object}  map[string]string
// @Failure      401  {object}  map[string]string
// @Failure      403  {object}  map[string]string
// @Failure      404  {object}  map[string]string
// @Failure      500  {object}  map[string]string
// @Router       /api/applicants/{id} [get]
func (h *ProfileHandler) GetApplicantSummary(c *gin.Context) {
	userIDVal := c.Param("id")
	if strings.TrimSpace(userIDVal) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id is required"})
		return
	}

	userID, err := strconv.ParseInt(userIDVal, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id must be a valid integer"})
		return
	}

	summary, portfolioURL, err := h.profileUseCase.GetPublicProfileSummary(c.Request.Context(), userID)
	if err != nil {
		switch err {
		case profileUseCase.ErrProfileForbidden:
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
			return
		}
	}
	if summary == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Applicant not found"})
		return
	}

	resp := dto.PublicApplicantProfileResponse{
		ID:             summary.ID,
		FullName:       summary.FullName,
		Specialization: summary.Specialization,
		SkillLevel:     summary.SkillLevel,
		City:           summary.City,
		PortfolioURL:   portfolioURL,
	}

	c.JSON(http.StatusOK, resp)
}
