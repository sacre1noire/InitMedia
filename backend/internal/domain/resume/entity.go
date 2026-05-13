package resume

import (
	"encoding/json"
	"time"
)

// ResumeContacts describes contact data for a resume.
type ResumeContacts struct {
	Email        *string `json:"email,omitempty"`
	Phone        *string `json:"phone,omitempty"`
	Telegram     *string `json:"telegram,omitempty"`
	PortfolioURL *string `json:"portfolio_url,omitempty"`
}

// ResumeExperience describes one work experience entry.
type ResumeExperience struct {
	Company     string  `json:"company"`
	Role        string  `json:"role"`
	StartDate   *string `json:"start_date,omitempty"`
	EndDate     *string `json:"end_date,omitempty"`
	Description *string `json:"description,omitempty"`
}

// ResumeEducation describes one education entry.
type ResumeEducation struct {
	Institution string  `json:"institution"`
	Degree      string  `json:"degree"`
	StartYear   *int32  `json:"start_year,omitempty"`
	EndYear     *int32  `json:"end_year,omitempty"`
	Description *string `json:"description,omitempty"`
}

// ResumeRecommendation describes one recommendation entry.
type ResumeRecommendation struct {
	Name     string  `json:"name"`
	Position *string `json:"position,omitempty"`
	Contact  *string `json:"contact,omitempty"`
	Text     *string `json:"text,omitempty"`
}

// ResumeContent is a fixed resume schema stored as JSONB.
type ResumeContent struct {
	FullName        string                 `json:"full_name"`
	Qualification   string                 `json:"qualification"`
	Goals           *string                `json:"goals,omitempty"`
	Contacts        ResumeContacts         `json:"contacts"`
	Experience      []ResumeExperience     `json:"experience"`
	Education       []ResumeEducation      `json:"education"`
	Recommendations []ResumeRecommendation `json:"recommendations"`
	Skills          []string               `json:"skills"`
}

// Resume is the full applicant resume record.
type Resume struct {
	ID          int64          `json:"id" db:"id"`
	ApplicantID int64          `json:"applicant_id" db:"applicant_id"`
	TemplateID  *int64         `json:"template_id" db:"template_id"`
	Title       string         `json:"title" db:"title"`
	Content     *ResumeContent `json:"content,omitempty" db:"-"`
	IsPrimary   bool           `json:"is_primary" db:"is_primary"`
	CreatedAt   time.Time      `json:"created_at" db:"created_at"`
	UpdatedAt   *time.Time     `json:"updated_at,omitempty" db:"updated_at"`
}

// ResumeTemplate describes a resume template.
type ResumeTemplate struct {
	ID              int64           `json:"id" db:"id"`
	Name            string          `json:"name" db:"name"`
	PreviewURL      *string         `json:"preview_url,omitempty" db:"preview_url"`
	Structure       json.RawMessage `json:"structure" db:"structure"`
	Specializations []string        `json:"specializations" db:"specializations"`
	CreatedAt       time.Time       `json:"created_at" db:"created_at"`
}
