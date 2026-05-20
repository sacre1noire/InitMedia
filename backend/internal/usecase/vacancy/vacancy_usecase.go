package vacancy

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"backend/internal/domain/company"
	"backend/internal/domain/user"
	"backend/internal/domain/vacancy"
)

var (
	ErrVacancyNotFound     = errors.New("vacancy not found")
	ErrVacancyForbidden    = errors.New("vacancy access forbidden")
	ErrInvalidVacancyInput = errors.New("invalid vacancy payload")
	ErrCompanyNotFound     = errors.New("company not found")
	ErrCompanyNotVerified  = errors.New("company is not verified")
)

type VacancyUseCase struct {
	repo        vacancy.VacancyRepository
	companyRepo company.CompanyRepository
}

func NewVacancyUseCase(repo vacancy.VacancyRepository, companyRepo company.CompanyRepository) *VacancyUseCase {
	return &VacancyUseCase{repo: repo, companyRepo: companyRepo}
}

func isValidType(v vacancy.VacancyType) bool {
	switch v {
	case vacancy.VacancyTypeInternship, vacancy.VacancyTypeVacancy, vacancy.VacancyTypeProject:
		return true
	default:
		return false
	}
}

func isValidStatus(v vacancy.VacancyStatus) bool {
	switch v {
	case vacancy.VacancyStatusActive, vacancy.VacancyStatusArchived:
		return true
	default:
		return false
	}
}

func normalizeCreateInput(input vacancy.CreateVacancyInput) (*vacancy.CreateVacancyInput, error) {
	input.Title = strings.TrimSpace(input.Title)
	input.Description = strings.TrimSpace(input.Description)
	input.Type = vacancy.NormalizeVacancyType(input.Type)
	input.Status = vacancy.NormalizeVacancyStatus(input.Status)
	input.Specialization = vacancy.NormalizeString(input.Specialization)
	if input.Title == "" || input.Description == "" || input.Type == "" || input.Specialization == "" {
		return nil, ErrInvalidVacancyInput
	}
	if !isValidType(input.Type) {
		return nil, ErrInvalidVacancyInput
	}
	input.Status = vacancy.VacancyStatusActive
	if input.Schedule != nil {
		trimmed := strings.TrimSpace(*input.Schedule)
		if trimmed == "" {
			input.Schedule = nil
		} else {
			lower := strings.ToLower(trimmed)
			input.Schedule = &lower
		}
	}
	if input.City != nil {
		trimmed := strings.TrimSpace(*input.City)
		if trimmed == "" {
			input.City = nil
		} else {
			lower := strings.ToLower(trimmed)
			input.City = &lower
		}
	}
	if input.Duties != nil {
		trimmed := strings.TrimSpace(*input.Duties)
		if trimmed == "" {
			input.Duties = nil
		} else {
			input.Duties = &trimmed
		}
	}
	return &input, nil
}

func normalizeUpdateInput(input vacancy.UpdateVacancyInput) (*vacancy.UpdateVacancyInput, error) {
	input.Title = strings.TrimSpace(input.Title)
	input.Description = strings.TrimSpace(input.Description)
	input.Type = vacancy.NormalizeVacancyType(input.Type)
	input.Status = vacancy.NormalizeVacancyStatus(input.Status)
	input.Specialization = vacancy.NormalizeString(input.Specialization)
	if input.Title == "" || input.Description == "" || input.Type == "" || input.Specialization == "" {
		return nil, ErrInvalidVacancyInput
	}
	if !isValidType(input.Type) {
		return nil, ErrInvalidVacancyInput
	}
	if input.Status == vacancy.VacancyStatusArchived {
		input.Status = vacancy.VacancyStatusArchived
	} else {
		input.Status = vacancy.VacancyStatusActive
	}
	if input.Schedule != nil {
		trimmed := strings.TrimSpace(*input.Schedule)
		if trimmed == "" {
			input.Schedule = nil
		} else {
			lower := strings.ToLower(trimmed)
			input.Schedule = &lower
		}
	}
	if input.City != nil {
		trimmed := strings.TrimSpace(*input.City)
		if trimmed == "" {
			input.City = nil
		} else {
			lower := strings.ToLower(trimmed)
			input.City = &lower
		}
	}
	if input.Duties != nil {
		trimmed := strings.TrimSpace(*input.Duties)
		if trimmed == "" {
			input.Duties = nil
		} else {
			input.Duties = &trimmed
		}
	}
	return &input, nil
}

func (u *VacancyUseCase) Create(ctx context.Context, actorID int64, actorRole string, input vacancy.CreateVacancyInput) (*vacancy.Vacancy, error) {
	if actorRole != string(user.RoleEmployer) && actorRole != string(user.RoleAdmin) {
		return nil, ErrVacancyForbidden
	}
	companyModel, err := u.companyRepo.GetByOwnerID(ctx, actorID)
	if err != nil {
		return nil, fmt.Errorf("get company for vacancy: %w", err)
	}
	if companyModel == nil {
		return nil, ErrCompanyNotFound
	}
	normalized, err := normalizeCreateInput(input)
	if err != nil {
		return nil, err
	}
	model := &vacancy.Vacancy{
		CompanyID:      companyModel.ID,
		Company:        companyModel,
		Title:          normalized.Title,
		Description:    normalized.Description,
		Requirements:   normalized.Requirements,
		Duties:         normalized.Duties,
		Type:           normalized.Type,
		Specialization: normalized.Specialization,
		Schedule:       normalized.Schedule,
		SalaryFrom:     normalized.SalaryFrom,
		SalaryTo:       normalized.SalaryTo,
		IsSalaryHidden: normalized.IsSalaryHidden,
		City:           normalized.City,
		IsRemote:       normalized.IsRemote,
		Status:         normalized.Status,
		ExpiresAt:      normalized.ExpiresAt,
	}
	if model.Status == vacancy.VacancyStatusActive && model.PublishedAt == nil {
		t := time.Now()
		model.PublishedAt = &t
	}
	if err := u.repo.Create(ctx, model); err != nil {
		return nil, fmt.Errorf("create vacancy usecase: %w", err)
	}
	return model, nil
}

func (u *VacancyUseCase) Update(ctx context.Context, id int64, actorID int64, actorRole string, input vacancy.UpdateVacancyInput) (*vacancy.Vacancy, error) {
	if actorRole != string(user.RoleEmployer) && actorRole != string(user.RoleAdmin) {
		return nil, ErrVacancyForbidden
	}
	existing, err := u.repo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("get vacancy: %w", err)
	}
	if existing == nil {
		return nil, ErrVacancyNotFound
	}
	companyModel, err := u.companyRepo.GetByOwnerID(ctx, actorID)
	if err != nil {
		return nil, fmt.Errorf("get company for vacancy: %w", err)
	}
	if companyModel == nil {
		return nil, ErrCompanyNotFound
	}
	if actorRole != string(user.RoleAdmin) && existing.CompanyID != companyModel.ID {
		return nil, ErrVacancyForbidden
	}
	normalized, err := normalizeUpdateInput(input)
	if err != nil {
		return nil, err
	}
	existing.Title = normalized.Title
	existing.Description = normalized.Description
	existing.Requirements = normalized.Requirements
	existing.Duties = normalized.Duties
	existing.Type = normalized.Type
	existing.Specialization = normalized.Specialization
	existing.Schedule = normalized.Schedule
	existing.SalaryFrom = normalized.SalaryFrom
	existing.SalaryTo = normalized.SalaryTo
	existing.IsSalaryHidden = normalized.IsSalaryHidden
	existing.City = normalized.City
	existing.IsRemote = normalized.IsRemote
	existing.Status = normalized.Status
	if normalized.Status == vacancy.VacancyStatusActive && existing.PublishedAt == nil {
		t := time.Now()
		existing.PublishedAt = &t
	}
	if normalized.ExpiresAt != nil {
		existing.ExpiresAt = normalized.ExpiresAt
	}
	if normalized.PublishedAt != nil {
		existing.PublishedAt = normalized.PublishedAt
	}
	if err := u.repo.Update(ctx, existing); err != nil {
		return nil, fmt.Errorf("update vacancy usecase: %w", err)
	}
	return existing, nil
}

func (u *VacancyUseCase) UpdateStatus(ctx context.Context, id int64, actorID int64, actorRole string, status vacancy.VacancyStatus) (*vacancy.Vacancy, error) {
	if actorRole != string(user.RoleEmployer) && actorRole != string(user.RoleAdmin) {
		return nil, ErrVacancyForbidden
	}
	existing, err := u.repo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("get vacancy: %w", err)
	}
	if existing == nil {
		return nil, ErrVacancyNotFound
	}
	companyModel, err := u.companyRepo.GetByOwnerID(ctx, actorID)
	if err != nil {
		return nil, fmt.Errorf("get company for vacancy: %w", err)
	}
	if companyModel == nil {
		return nil, ErrCompanyNotFound
	}
	if actorRole != string(user.RoleAdmin) && existing.CompanyID != companyModel.ID {
		return nil, ErrVacancyForbidden
	}
	normalizedStatus := vacancy.NormalizeVacancyStatus(status)
	if normalizedStatus == "" {
		return nil, ErrInvalidVacancyInput
	}
	if companyModel.IsVerified != company.VerificationVerified && normalizedStatus == vacancy.VacancyStatusActive {
		return nil, ErrCompanyNotVerified
	}
	existing.Status = normalizedStatus
	if normalizedStatus == vacancy.VacancyStatusActive && existing.PublishedAt == nil {
		t := time.Now()
		existing.PublishedAt = &t
	}
	if err := u.repo.Update(ctx, existing); err != nil {
		return nil, fmt.Errorf("update vacancy status: %w", err)
	}
	return existing, nil
}

func (u *VacancyUseCase) ListPublic(ctx context.Context, filter vacancy.ListVacancyFilter) ([]*vacancy.Vacancy, int64, error) {
	items, total, err := u.repo.ListPublic(ctx, filter)
	if err != nil {
		return nil, 0, err
	}
	for _, v := range items {
		v.ApplicationCount = 0
	}
	return items, total, nil
}

func (u *VacancyUseCase) GetPublicByID(ctx context.Context, id int64) (*vacancy.Vacancy, error) {
	v, err := u.repo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("get vacancy: %w", err)
	}
	if v == nil {
		return nil, ErrVacancyNotFound
	}
	if v.Status != vacancy.VacancyStatusActive {
		return nil, ErrVacancyNotFound
	}
	v.ApplicationCount = 0
	return v, nil
}

func (u *VacancyUseCase) GetByEmployer(ctx context.Context, id int64, actorID int64, actorRole string) (*vacancy.Vacancy, error) {
	if actorRole != string(user.RoleEmployer) && actorRole != string(user.RoleAdmin) {
		return nil, ErrVacancyForbidden
	}
	v, err := u.repo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("get vacancy: %w", err)
	}
	if v == nil {
		return nil, ErrVacancyNotFound
	}
	if actorRole == string(user.RoleAdmin) {
		return v, nil
	}
	companyModel, err := u.companyRepo.GetByOwnerID(ctx, actorID)
	if err != nil {
		return nil, fmt.Errorf("get company for vacancy: %w", err)
	}
	if companyModel == nil {
		return nil, ErrCompanyNotFound
	}
	if v.CompanyID != companyModel.ID {
		return nil, ErrVacancyForbidden
	}
	return v, nil
}

func (u *VacancyUseCase) ListByEmployer(ctx context.Context, actorID int64, actorRole string) ([]*vacancy.Vacancy, error) {
	if actorRole != string(user.RoleEmployer) && actorRole != string(user.RoleAdmin) {
		return nil, ErrVacancyForbidden
	}
	companyModel, err := u.companyRepo.GetByOwnerID(ctx, actorID)
	if err != nil {
		return nil, fmt.Errorf("get company for vacancy: %w", err)
	}
	if companyModel == nil {
		return []*vacancy.Vacancy{}, nil
	}
	return u.repo.ListByCompany(ctx, companyModel.ID)
}

func (u *VacancyUseCase) Delete(ctx context.Context, id int64, actorID int64, actorRole string) error {
	if actorRole != string(user.RoleEmployer) && actorRole != string(user.RoleAdmin) {
		return ErrVacancyForbidden
	}
	existing, err := u.repo.GetByID(ctx, id)
	if err != nil {
		return fmt.Errorf("get vacancy: %w", err)
	}
	if existing == nil {
		return ErrVacancyNotFound
	}
	companyModel, err := u.companyRepo.GetByOwnerID(ctx, actorID)
	if err != nil {
		return fmt.Errorf("get company for vacancy: %w", err)
	}
	if companyModel == nil {
		return ErrCompanyNotFound
	}
	if actorRole != string(user.RoleAdmin) && existing.CompanyID != companyModel.ID {
		return ErrVacancyForbidden
	}
	return u.repo.Delete(ctx, id)
}
