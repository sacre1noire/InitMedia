package dto

import "backend/internal/domain/company"

// CreateCompanyRequest is payload for creating company.
type CreateCompanyRequest struct {
	Name        string             `json:"name" binding:"required"`
	Description *string            `json:"description"`
	IndustryID  *int32             `json:"industry_id"`
	WebsiteURL  *string            `json:"website_url"`
	LogoURL     *string            `json:"logo_url"`
	Size        *company.SizeRange `json:"size"`
}

// UpdateCompanyRequest is payload for updating company.
type UpdateCompanyRequest struct {
	Name        *string            `json:"name"`
	Description *string            `json:"description"`
	IndustryID  *int32             `json:"industry_id"`
	WebsiteURL  *string            `json:"website_url"`
	LogoURL     *string            `json:"logo_url"`
	Size        *company.SizeRange `json:"size"`
}

// ReplaceCompanyRequest is payload for replacing company.
type ReplaceCompanyRequest struct {
	Name        string             `json:"name" binding:"required"`
	Description *string            `json:"description"`
	IndustryID  *int32             `json:"industry_id"`
	WebsiteURL  *string            `json:"website_url"`
	LogoURL     *string            `json:"logo_url"`
	Size        *company.SizeRange `json:"size"`
}

// ListCompaniesQuery describes supported list filters.
type ListCompaniesQuery struct {
	IndustryID *int32             `form:"industry_id"`
	Size       *company.SizeRange `form:"size"`
	Limit      int32              `form:"limit"`
	Offset     int32              `form:"offset"`
}
