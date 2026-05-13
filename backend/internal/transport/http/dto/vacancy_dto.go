package dto

import (
	"time"

	"backend/internal/domain/vacancy"
)

// CreateVacancyRequest is payload for creating vacancy.
type CreateVacancyRequest struct {
	Title          string                `json:"title" binding:"required"`
	Description    string                `json:"description" binding:"required"`
	Requirements   *string               `json:"requirements"`
	Duties         *string               `json:"duties"`
	Type           vacancy.VacancyType   `json:"type" binding:"required"`
	Specialization string                `json:"specialization" binding:"required"`
	Schedule       *string               `json:"schedule"`
	SalaryFrom     *int32                `json:"salary_from"`
	SalaryTo       *int32                `json:"salary_to"`
	IsSalaryHidden bool                  `json:"is_salary_hidden"`
	City           *string               `json:"city"`
	IsRemote       bool                  `json:"is_remote"`
	Status         vacancy.VacancyStatus `json:"status"`
	ExpiresAt      *time.Time            `json:"expires_at"`
}

// UpdateVacancyRequest is payload for updating vacancy.
type UpdateVacancyRequest struct {
	Title          string                `json:"title" binding:"required"`
	Description    string                `json:"description" binding:"required"`
	Requirements   *string               `json:"requirements"`
	Duties         *string               `json:"duties"`
	Type           vacancy.VacancyType   `json:"type" binding:"required"`
	Specialization string                `json:"specialization" binding:"required"`
	Schedule       *string               `json:"schedule"`
	SalaryFrom     *int32                `json:"salary_from"`
	SalaryTo       *int32                `json:"salary_to"`
	IsSalaryHidden bool                  `json:"is_salary_hidden"`
	City           *string               `json:"city"`
	IsRemote       bool                  `json:"is_remote"`
	Status         vacancy.VacancyStatus `json:"status"`
	ExpiresAt      *time.Time            `json:"expires_at"`
	PublishedAt    *time.Time            `json:"published_at"`
}

// UpdateVacancyStatusRequest is payload for updating vacancy status.
type UpdateVacancyStatusRequest struct {
	Status vacancy.VacancyStatus `json:"status" binding:"required"`
}

// ListVacanciesQuery describes supported list filters.
type ListVacanciesQuery struct {
	Search         *string `form:"search"`
	Type           *string `form:"type"`
	Specialization *string `form:"specialization"`
	Schedule       *string `form:"schedule"`
	City           *string `form:"city"`
	IsRemote       *bool   `form:"is_remote"`
	SalaryFrom     *int32  `form:"salary_from"`
	SalaryTo       *int32  `form:"salary_to"`
	Limit          int32   `form:"limit"`
	Offset         int32   `form:"offset"`
	Skip           int32   `form:"skip"`
	Sort           *string `form:"sort"`
	Order          *string `form:"order"`
}

// VacancyListResponse describes list response.
type VacancyListResponse struct {
	Items []*vacancy.Vacancy `json:"items"`
	Total int64              `json:"total"`
}
