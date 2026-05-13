package vacancy

import (
	"context"
	"strings"
	"time"

	"backend/internal/domain/company"
)

// VacancyType describes vacancy kind.
type VacancyType string

const (
	VacancyTypeInternship VacancyType = "internship"
	VacancyTypeVacancy    VacancyType = "vacancy"
	VacancyTypeProject    VacancyType = "project"
)

// VacancyStatus describes publication state.
type VacancyStatus string

const (
	VacancyStatusDraft      VacancyStatus = "draft"
	VacancyStatusActive     VacancyStatus = "active"
	VacancyStatusArchived   VacancyStatus = "archived"
	VacancyStatusModeration VacancyStatus = "moderation"
)

// Vacancy is a domain entity for job listings.
type Vacancy struct {
	ID             int64            `json:"id" db:"id"`
	CompanyID      int64            `json:"company_id" db:"company_id"`
	Company        *company.Company `json:"company,omitempty"`
	Title          string           `json:"title" db:"title"`
	Description    string           `json:"description" db:"description"`
	Requirements   *string          `json:"requirements,omitempty" db:"requirements"`
	Duties         *string          `json:"duties,omitempty" db:"duties"`
	Type           VacancyType      `json:"type" db:"type"`
	Specialization string           `json:"specialization" db:"specialization"`
	Schedule       *string          `json:"schedule,omitempty" db:"schedule"`
	SalaryFrom     *int32           `json:"salary_from,omitempty" db:"salary_from"`
	SalaryTo       *int32           `json:"salary_to,omitempty" db:"salary_to"`
	IsSalaryHidden bool             `json:"is_salary_hidden" db:"is_salary_hidden"`
	City           *string          `json:"city,omitempty" db:"city"`
	IsRemote       bool             `json:"is_remote" db:"is_remote"`
	Status         VacancyStatus    `json:"status" db:"status"`
	CreatedAt      time.Time        `json:"created_at" db:"created_at"`
	UpdatedAt      *time.Time       `json:"updated_at,omitempty" db:"updated_at"`
	ExpiresAt      *time.Time       `json:"expires_at,omitempty" db:"expires_at"`
	PublishedAt    *time.Time       `json:"published_at,omitempty" db:"published_at"`
	// ApplicationCount is populated in reads that join applications aggregate (0 if none).
	ApplicationCount int32 `json:"applications_count" db:"-"`
}

// CreateVacancyInput describes payload for vacancy creation.
type CreateVacancyInput struct {
	Title          string        `json:"title"`
	Description    string        `json:"description"`
	Requirements   *string       `json:"requirements,omitempty"`
	Duties         *string       `json:"duties,omitempty"`
	Type           VacancyType   `json:"type"`
	Specialization string        `json:"specialization"`
	Schedule       *string       `json:"schedule,omitempty"`
	SalaryFrom     *int32        `json:"salary_from,omitempty"`
	SalaryTo       *int32        `json:"salary_to,omitempty"`
	IsSalaryHidden bool          `json:"is_salary_hidden"`
	City           *string       `json:"city,omitempty"`
	IsRemote       bool          `json:"is_remote"`
	Status         VacancyStatus `json:"status"`
	ExpiresAt      *time.Time    `json:"expires_at,omitempty"`
	PublishedAt    *time.Time    `json:"published_at,omitempty"`
}

// UpdateVacancyInput describes payload for vacancy updates.
type UpdateVacancyInput struct {
	Title          string        `json:"title"`
	Description    string        `json:"description"`
	Requirements   *string       `json:"requirements,omitempty"`
	Duties         *string       `json:"duties,omitempty"`
	Type           VacancyType   `json:"type"`
	Specialization string        `json:"specialization"`
	Schedule       *string       `json:"schedule,omitempty"`
	SalaryFrom     *int32        `json:"salary_from,omitempty"`
	SalaryTo       *int32        `json:"salary_to,omitempty"`
	IsSalaryHidden bool          `json:"is_salary_hidden"`
	City           *string       `json:"city,omitempty"`
	IsRemote       bool          `json:"is_remote"`
	Status         VacancyStatus `json:"status"`
	ExpiresAt      *time.Time    `json:"expires_at,omitempty"`
	PublishedAt    *time.Time    `json:"published_at,omitempty"`
}

// UpdateVacancyStatusInput describes status update payload.
type UpdateVacancyStatusInput struct {
	Status VacancyStatus `json:"status"`
}

// ListVacancyFilter describes filter options for public listing.
type ListVacancyFilter struct {
	Search         *string
	Type           *VacancyType
	Specialization *string
	Schedule       *string
	City           *string
	IsRemote       *bool
	SalaryFrom     *int32
	SalaryTo       *int32
	Status         *VacancyStatus
	Limit          int32
	Offset         int32
	Sort           *string
	Order          *string
}

// VacancyRepository describes persistence operations for vacancies.
type VacancyRepository interface {
	Create(ctx context.Context, v *Vacancy) error
	Update(ctx context.Context, v *Vacancy) error
	Delete(ctx context.Context, id int64) error
	GetByID(ctx context.Context, id int64) (*Vacancy, error)
	ListPublic(ctx context.Context, filter ListVacancyFilter) ([]*Vacancy, int64, error)
	ListByCompany(ctx context.Context, companyID int64) ([]*Vacancy, error)
}

// NormalizeVacancyType ensures a lower-case type value.
func NormalizeVacancyType(value VacancyType) VacancyType {
	return VacancyType(strings.ToLower(strings.TrimSpace(string(value))))
}

// NormalizeVacancyStatus ensures a lower-case status value.
func NormalizeVacancyStatus(value VacancyStatus) VacancyStatus {
	return VacancyStatus(strings.ToLower(strings.TrimSpace(string(value))))
}

// NormalizeString trims and lowercases a string.
func NormalizeString(value string) string {
	return strings.ToLower(strings.TrimSpace(value))
}
