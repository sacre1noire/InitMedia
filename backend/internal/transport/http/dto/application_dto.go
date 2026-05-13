package dto

import "backend/internal/domain/application"

// CreateApplicationRequest is payload for applying.
type CreateApplicationRequest struct {
	CoverLetter *string `json:"cover_letter"`
	ResumeID    *int64  `json:"resume_id"`
}

// UpdateApplicationStatusRequest is payload for status update.
type UpdateApplicationStatusRequest struct {
	Status application.ApplicationStatus `json:"status" binding:"required"`
}
