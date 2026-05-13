package dto

import (
	"backend/internal/domain/resume"
)

// CreateResumeRequest is payload for creating resume.
type CreateResumeRequest struct {
	Title      string               `json:"title" binding:"required"`
	TemplateID *int64               `json:"template_id" binding:"required"`
	IsPrimary  bool                 `json:"is_primary"`
	Content    resume.ResumeContent `json:"content" binding:"required"`
}

// UpdateResumeRequest is payload for updating resume.
type UpdateResumeRequest struct {
	Title      string               `json:"title" binding:"required"`
	TemplateID *int64               `json:"template_id" binding:"required"`
	IsPrimary  bool                 `json:"is_primary"`
	Content    resume.ResumeContent `json:"content" binding:"required"`
}

// ResumePreviewResponse is HTML preview response.
type ResumePreviewResponse struct {
	HTML string `json:"html"`
}
