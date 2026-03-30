package company

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"backend/internal/domain/company"
	"backend/internal/domain/user"

	slugify "github.com/gosimple/slug"
)

var (
	ErrCompanyNotFound        = errors.New("company not found")
	ErrOwnerAlreadyHasCompany = errors.New("owner already has a company")
	ErrForbiddenCompanyUpdate = errors.New("only company owner or admin can update company")
	ErrInvalidCompanyPayload  = errors.New("invalid company payload")
)

type CompanyUseCase struct {
	repo company.CompanyRepository
}

func NewCompanyUseCase(repo company.CompanyRepository) *CompanyUseCase {
	return &CompanyUseCase{repo: repo}
}

func (u *CompanyUseCase) Create(ctx context.Context, ownerID int64, actorRole string, input company.CreateCompanyInput) (*company.Company, error) {
	if err := company.ValidateCreateInput(input); err != nil {
		return nil, fmt.Errorf("%w: %v", ErrInvalidCompanyPayload, err)
	}

	if actorRole != string(user.RoleEmployer) && actorRole != string(user.RoleAdmin) {
		return nil, ErrForbiddenCompanyUpdate
	}

	existing, err := u.repo.GetByOwnerID(ctx, ownerID)
	if err != nil {
		return nil, fmt.Errorf("check owner company: %w", err)
	}
	if existing != nil {
		return nil, ErrOwnerAlreadyHasCompany
	}

	slug, err := u.generateUniqueSlug(ctx, input.Name, 0)
	if err != nil {
		return nil, err
	}

	companyModel := &company.Company{
		OwnerID:     ownerID,
		Name:        strings.TrimSpace(input.Name),
		Slug:        slug,
		Description: input.Description,
		IndustryID:  input.IndustryID,
		WebsiteURL:  input.WebsiteURL,
		LogoURL:     input.LogoURL,
		Size:        input.Size,
		IsVerified:  company.VerificationPending,
	}

	if err := u.repo.Create(ctx, companyModel); err != nil {
		return nil, fmt.Errorf("create company usecase: %w", err)
	}

	return companyModel, nil
}

func (u *CompanyUseCase) List(ctx context.Context, actorID int64, actorRole string, filter company.ListCompanyFilter) ([]*company.Company, error) {
	if actorRole != string(user.RoleEmployer) && actorRole != string(user.RoleAdmin) {
		return nil, ErrForbiddenCompanyUpdate
	}

	if actorRole == string(user.RoleAdmin) {
		companies, err := u.repo.List(ctx, filter)
		if err != nil {
			return nil, fmt.Errorf("list companies usecase: %w", err)
		}
		return companies, nil
	}

	owned, err := u.repo.GetByOwnerID(ctx, actorID)
	if err != nil {
		return nil, fmt.Errorf("get owner company: %w", err)
	}
	if owned == nil {
		return []*company.Company{}, nil
	}

	if filter.IndustryID != nil && (owned.IndustryID == nil || *owned.IndustryID != *filter.IndustryID) {
		return []*company.Company{}, nil
	}
	if filter.Size != nil && (owned.Size == nil || *owned.Size != *filter.Size) {
		return []*company.Company{}, nil
	}

	return []*company.Company{owned}, nil
}

func (u *CompanyUseCase) GetByID(ctx context.Context, id int64, actorID int64, actorRole string) (*company.Company, error) {
	if actorRole != string(user.RoleEmployer) && actorRole != string(user.RoleAdmin) {
		return nil, ErrForbiddenCompanyUpdate
	}

	existing, err := u.repo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("get company by id usecase: %w", err)
	}
	if existing == nil {
		return nil, ErrCompanyNotFound
	}

	if actorRole != string(user.RoleAdmin) && existing.OwnerID != actorID {
		return nil, ErrForbiddenCompanyUpdate
	}

	return existing, nil
}

func (u *CompanyUseCase) GetBySlug(ctx context.Context, slug string) (*company.Company, error) {
	c, err := u.repo.GetBySlug(ctx, slug)
	if err != nil {
		return nil, fmt.Errorf("get company by slug usecase: %w", err)
	}
	if c == nil {
		return nil, ErrCompanyNotFound
	}
	return c, nil
}

func (u *CompanyUseCase) Update(ctx context.Context, id int64, actorID int64, actorRole string, input company.UpdateCompanyInput) (*company.Company, error) {
	if err := company.ValidateUpdateInput(input); err != nil {
		return nil, fmt.Errorf("%w: %v", ErrInvalidCompanyPayload, err)
	}

	existing, err := u.repo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("get company for update: %w", err)
	}
	if existing == nil {
		return nil, ErrCompanyNotFound
	}

	if existing.OwnerID != actorID && actorRole != string(user.RoleAdmin) {
		return nil, ErrForbiddenCompanyUpdate
	}

	criticalChanged := false

	if input.Name != nil {
		newName := strings.TrimSpace(*input.Name)
		if newName != "" && newName != existing.Name {
			existing.Name = newName
			criticalChanged = true

			slug, err := u.generateUniqueSlug(ctx, newName, existing.ID)
			if err != nil {
				return nil, err
			}
			existing.Slug = slug
		}
	}

	if input.Description != nil {
		if existing.Description == nil || *existing.Description != *input.Description {
			existing.Description = input.Description
			criticalChanged = true
		}
	}

	if input.IndustryID != nil {
		existing.IndustryID = input.IndustryID
	}
	if input.WebsiteURL != nil {
		existing.WebsiteURL = input.WebsiteURL
	}
	if input.LogoURL != nil {
		existing.LogoURL = input.LogoURL
	}
	if input.Size != nil {
		existing.Size = input.Size
	}

	if criticalChanged {
		existing.IsVerified = company.VerificationPending
	}

	if err := u.repo.Update(ctx, existing); err != nil {
		return nil, fmt.Errorf("update company usecase: %w", err)
	}

	return existing, nil
}

func (u *CompanyUseCase) Replace(ctx context.Context, id int64, actorID int64, actorRole string, input company.ReplaceCompanyInput) (*company.Company, error) {
	if err := company.ValidateReplaceInput(input); err != nil {
		return nil, fmt.Errorf("%w: %v", ErrInvalidCompanyPayload, err)
	}

	existing, err := u.repo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("get company for replace: %w", err)
	}
	if existing == nil {
		return nil, ErrCompanyNotFound
	}

	if existing.OwnerID != actorID && actorRole != string(user.RoleAdmin) {
		return nil, ErrForbiddenCompanyUpdate
	}

	newName := strings.TrimSpace(input.Name)
	if newName != existing.Name {
		existing.Name = newName
		slug, err := u.generateUniqueSlug(ctx, newName, existing.ID)
		if err != nil {
			return nil, err
		}
		existing.Slug = slug
	}

	existing.Description = input.Description
	existing.IndustryID = input.IndustryID
	existing.WebsiteURL = input.WebsiteURL
	existing.LogoURL = input.LogoURL
	existing.Size = input.Size
	existing.IsVerified = company.VerificationPending

	if err := u.repo.Update(ctx, existing); err != nil {
		return nil, fmt.Errorf("replace company usecase: %w", err)
	}

	return existing, nil
}

func (u *CompanyUseCase) Delete(ctx context.Context, id int64, actorID int64, actorRole string) error {
	existing, err := u.repo.GetByID(ctx, id)
	if err != nil {
		return fmt.Errorf("get company for delete: %w", err)
	}
	if existing == nil {
		return ErrCompanyNotFound
	}

	if existing.OwnerID != actorID && actorRole != string(user.RoleAdmin) {
		return ErrForbiddenCompanyUpdate
	}

	if err := u.repo.Delete(ctx, id); err != nil {
		return fmt.Errorf("delete company usecase: %w", err)
	}
	return nil
}

func (u *CompanyUseCase) generateUniqueSlug(ctx context.Context, name string, excludeID int64) (string, error) {
	base := slugify.Make(name)
	if base == "" {
		base = "company"
	}

	candidate := base
	for suffix := 0; suffix < 1000; suffix++ {
		existing, err := u.repo.GetBySlug(ctx, candidate)
		if err != nil {
			return "", fmt.Errorf("check company slug uniqueness: %w", err)
		}
		if existing == nil || existing.ID == excludeID {
			return candidate, nil
		}
		candidate = fmt.Sprintf("%s-%d", base, suffix+2)
	}

	return "", fmt.Errorf("failed to generate unique slug for company")
}
