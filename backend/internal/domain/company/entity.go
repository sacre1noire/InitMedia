package company

import (
	"context"
	"strings"
	"time"

	"github.com/go-playground/validator/v10"
)

// SizeRange describes company size buckets.
type SizeRange string

const (
	SizeRange1To10    SizeRange = "1-10"
	SizeRange11To50   SizeRange = "11-50"
	SizeRange51To200  SizeRange = "51-200"
	SizeRange201To500 SizeRange = "201-500"
	SizeRange500Plus  SizeRange = "500+"
)

// VerificationStatus describes moderation status of company profile.
type VerificationStatus string

const (
	VerificationPending  VerificationStatus = "pending"
	VerificationVerified VerificationStatus = "verified"
	VerificationRejected VerificationStatus = "rejected"
)

// Company is a domain entity for employer company profile.
type Company struct {
	ID           int64              `json:"id" db:"id"`
	OwnerID      int64              `json:"owner_id" db:"owner_id"`
	Name         string             `json:"name" db:"name"`
	Slug         string             `json:"slug" db:"slug"`
	Description  *string            `json:"description,omitempty" db:"description"`
	IndustryID   *int32             `json:"industry_id,omitempty" db:"industry_id"`
	WebsiteURL   *string            `json:"website_url,omitempty" db:"website_url"`
	LogoURL      *string            `json:"logo_url,omitempty" db:"logo_url"`
	Size         *SizeRange         `json:"size,omitempty" db:"size"`
	IsVerified   VerificationStatus `json:"is_verified" db:"is_verified"`
	SearchVector *string            `json:"-" db:"search_vector"`
	CreatedAt    time.Time          `json:"created_at" db:"created_at"`
	UpdatedAt    *time.Time         `json:"updated_at,omitempty" db:"updated_at"`
	DeletedAt    *time.Time         `json:"deleted_at,omitempty" db:"deleted_at"`
}

// CreateCompanyInput describes payload for company creation.
type CreateCompanyInput struct {
	Name        string     `json:"name" validate:"required,min=2,max=120"`
	Description *string    `json:"description,omitempty" validate:"omitempty,max=4000"`
	IndustryID  *int32     `json:"industry_id,omitempty"`
	WebsiteURL  *string    `json:"website_url,omitempty" validate:"omitempty,max=255,url"`
	LogoURL     *string    `json:"logo_url,omitempty" validate:"omitempty,max=255,url"`
	Size        *SizeRange `json:"size,omitempty" validate:"omitempty,oneof=1-10 11-50 51-200 201-500 500+"`
}

// UpdateCompanyInput describes payload for company updates.
type UpdateCompanyInput struct {
	Name        *string    `json:"name,omitempty" validate:"omitempty,min=2,max=120"`
	Description *string    `json:"description,omitempty" validate:"omitempty,max=4000"`
	IndustryID  *int32     `json:"industry_id,omitempty"`
	WebsiteURL  *string    `json:"website_url,omitempty" validate:"omitempty,max=255,url"`
	LogoURL     *string    `json:"logo_url,omitempty" validate:"omitempty,max=255,url"`
	Size        *SizeRange `json:"size,omitempty" validate:"omitempty,oneof=1-10 11-50 51-200 201-500 500+"`
}

// ReplaceCompanyInput describes payload for full company replacement (PUT).
type ReplaceCompanyInput struct {
	Name        string     `json:"name" validate:"required,min=2,max=120"`
	Description *string    `json:"description,omitempty" validate:"omitempty,max=4000"`
	IndustryID  *int32     `json:"industry_id,omitempty"`
	WebsiteURL  *string    `json:"website_url,omitempty" validate:"omitempty,max=255,url"`
	LogoURL     *string    `json:"logo_url,omitempty" validate:"omitempty,max=255,url"`
	Size        *SizeRange `json:"size,omitempty" validate:"omitempty,oneof=1-10 11-50 51-200 201-500 500+"`
}

// ListCompanyFilter describes filter options for listing companies.
type ListCompanyFilter struct {
	IndustryID *int32
	Size       *SizeRange
	Limit      int32
	Offset     int32
}

// CompanyRepository describes persistence operations for company aggregate.
type CompanyRepository interface {
	Create(ctx context.Context, c *Company) error
	GetByID(ctx context.Context, id int64) (*Company, error)
	GetBySlug(ctx context.Context, slug string) (*Company, error)
	GetByOwnerID(ctx context.Context, ownerID int64) (*Company, error)
	Update(ctx context.Context, c *Company) error
	Delete(ctx context.Context, id int64) error
	List(ctx context.Context, filter ListCompanyFilter) ([]*Company, error)
}

// CompanyUsecase describes business operations for company aggregate.
type CompanyUsecase interface {
	Create(ctx context.Context, ownerID int64, actorRole string, input CreateCompanyInput) (*Company, error)
	List(ctx context.Context, actorID int64, actorRole string, filter ListCompanyFilter) ([]*Company, error)
	GetByID(ctx context.Context, id int64, actorID int64, actorRole string) (*Company, error)
	GetBySlug(ctx context.Context, slug string) (*Company, error)
	Update(ctx context.Context, id int64, actorID int64, actorRole string, input UpdateCompanyInput) (*Company, error)
	Replace(ctx context.Context, id int64, actorID int64, actorRole string, input ReplaceCompanyInput) (*Company, error)
	Delete(ctx context.Context, id int64, actorID int64, actorRole string) error
}

var validate = validator.New()

// ValidateCreateInput validates create payload.
func ValidateCreateInput(input CreateCompanyInput) error {
	if input.Name != strings.TrimSpace(input.Name) {
		input.Name = strings.TrimSpace(input.Name)
	}
	return validate.Struct(input)
}

// ValidateUpdateInput validates update payload.
func ValidateUpdateInput(input UpdateCompanyInput) error {
	if input.Name != nil {
		v := strings.TrimSpace(*input.Name)
		input.Name = &v
	}
	return validate.Struct(input)
}

// ValidateReplaceInput validates put payload.
func ValidateReplaceInput(input ReplaceCompanyInput) error {
	if input.Name != strings.TrimSpace(input.Name) {
		input.Name = strings.TrimSpace(input.Name)
	}
	return validate.Struct(input)
}
