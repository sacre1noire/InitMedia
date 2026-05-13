package application

import (
	"context"
	"strings"
	"time"

	"backend/internal/domain/user"
	"backend/internal/domain/vacancy"
)

// ApplicationStatus describes application state.
type ApplicationStatus string

const (
	ApplicationStatusPending  ApplicationStatus = "pending"
	ApplicationStatusViewed   ApplicationStatus = "viewed"
	ApplicationStatusAccepted ApplicationStatus = "accepted"
	ApplicationStatusRejected ApplicationStatus = "rejected"
)

// Application is a domain entity for vacancy responses.
type Application struct {
	ID          int64             `json:"id"`
	VacancyID   int64             `json:"-"`
	ApplicantID int64             `json:"-"`
	Status      ApplicationStatus `json:"status"`
	CoverLetter *string           `json:"cover_letter,omitempty"`
	ResumeID    *int64            `json:"resume_id,omitempty"`
	ResumeTitle *string           `json:"resume_title,omitempty"`
	Vacancy     *vacancy.Vacancy  `json:"vacancy,omitempty"`
	Applicant   *user.User        `json:"applicant,omitempty"`
	CreatedAt   time.Time         `json:"created_at"`
	UpdatedAt   *time.Time        `json:"updated_at,omitempty"`
}

// CreateApplicationInput describes apply payload.
type CreateApplicationInput struct {
	CoverLetter *string `json:"cover_letter,omitempty"`
	ResumeID    *int64  `json:"resume_id,omitempty"`
}

// UpdateApplicationStatusInput describes status change payload.
type UpdateApplicationStatusInput struct {
	Status ApplicationStatus `json:"status"`
}

// ApplicationRepository describes persistence operations for applications.
type ApplicationRepository interface {
	Create(ctx context.Context, a *Application) error
	Exists(ctx context.Context, vacancyID int64, applicantID int64) (bool, error)
	ListByApplicant(ctx context.Context, applicantID int64) ([]*Application, error)
	ListByEmployer(ctx context.Context, ownerID int64) ([]*Application, error)
	ListByEmployerVacancy(ctx context.Context, ownerID int64, vacancyID int64) ([]*Application, error)
	GetByIDForApplicant(ctx context.Context, id int64, applicantID int64) (*Application, error)
	GetByIDForEmployer(ctx context.Context, id int64, ownerID int64) (*Application, error)
	UpdateStatusForEmployer(ctx context.Context, id int64, ownerID int64, status ApplicationStatus) error
	DeleteByApplicant(ctx context.Context, id int64, applicantID int64) error
}

// NormalizeApplicationStatus ensures a lower-case status value.
func NormalizeApplicationStatus(value ApplicationStatus) ApplicationStatus {
	return ApplicationStatus(strings.ToLower(strings.TrimSpace(string(value))))
}
