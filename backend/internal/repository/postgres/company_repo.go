package postgres

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"backend/internal/domain/company"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type CompanyRepo struct {
	db *pgxpool.Pool
}

func NewCompanyRepo(db *pgxpool.Pool) *CompanyRepo {
	return &CompanyRepo{db: db}
}

func (r *CompanyRepo) Create(ctx context.Context, c *company.Company) error {
	query := `
		INSERT INTO companies (
			owner_id, name, slug, description, industry_id, website_url, logo_url, size, is_verified, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
		RETURNING id, created_at, updated_at
	`
	if err := r.db.QueryRow(
		ctx,
		query,
		c.OwnerID,
		c.Name,
		c.Slug,
		c.Description,
		c.IndustryID,
		c.WebsiteURL,
		c.LogoURL,
		c.Size,
		c.IsVerified,
	).Scan(&c.ID, &c.CreatedAt, &c.UpdatedAt); err != nil {
		return fmt.Errorf("create company: %w", err)
	}
	return nil
}

func (r *CompanyRepo) GetByID(ctx context.Context, id int64) (*company.Company, error) {
	query := `
		SELECT id, owner_id, name, slug, description, industry_id, website_url, logo_url, size, is_verified,
		       search_vector::text, created_at, updated_at, deleted_at
		FROM companies
		WHERE id = $1 AND deleted_at IS NULL
	`
	c := &company.Company{}
	if err := r.db.QueryRow(ctx, query, id).Scan(
		&c.ID,
		&c.OwnerID,
		&c.Name,
		&c.Slug,
		&c.Description,
		&c.IndustryID,
		&c.WebsiteURL,
		&c.LogoURL,
		&c.Size,
		&c.IsVerified,
		&c.SearchVector,
		&c.CreatedAt,
		&c.UpdatedAt,
		&c.DeletedAt,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("get company by id: %w", err)
	}
	return c, nil
}

func (r *CompanyRepo) GetBySlug(ctx context.Context, slug string) (*company.Company, error) {
	query := `
		SELECT id, owner_id, name, slug, description, industry_id, website_url, logo_url, size, is_verified,
		       search_vector::text, created_at, updated_at, deleted_at
		FROM companies
		WHERE slug = $1 AND deleted_at IS NULL
	`
	c := &company.Company{}
	if err := r.db.QueryRow(ctx, query, strings.ToLower(slug)).Scan(
		&c.ID,
		&c.OwnerID,
		&c.Name,
		&c.Slug,
		&c.Description,
		&c.IndustryID,
		&c.WebsiteURL,
		&c.LogoURL,
		&c.Size,
		&c.IsVerified,
		&c.SearchVector,
		&c.CreatedAt,
		&c.UpdatedAt,
		&c.DeletedAt,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("get company by slug: %w", err)
	}
	return c, nil
}

func (r *CompanyRepo) GetByOwnerID(ctx context.Context, ownerID int64) (*company.Company, error) {
	query := `
		SELECT id, owner_id, name, slug, description, industry_id, website_url, logo_url, size, is_verified,
		       search_vector::text, created_at, updated_at, deleted_at
		FROM companies
		WHERE owner_id = $1 AND deleted_at IS NULL
	`
	c := &company.Company{}
	if err := r.db.QueryRow(ctx, query, ownerID).Scan(
		&c.ID,
		&c.OwnerID,
		&c.Name,
		&c.Slug,
		&c.Description,
		&c.IndustryID,
		&c.WebsiteURL,
		&c.LogoURL,
		&c.Size,
		&c.IsVerified,
		&c.SearchVector,
		&c.CreatedAt,
		&c.UpdatedAt,
		&c.DeletedAt,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("get company by owner id: %w", err)
	}
	return c, nil
}

func (r *CompanyRepo) Update(ctx context.Context, c *company.Company) error {
	query := `
		UPDATE companies
		SET name = $2,
		    slug = $3,
		    description = $4,
		    industry_id = $5,
		    website_url = $6,
		    logo_url = $7,
		    size = $8,
		    is_verified = $9,
		    updated_at = NOW()
		WHERE id = $1 AND deleted_at IS NULL
		RETURNING updated_at
	`
	if err := r.db.QueryRow(
		ctx,
		query,
		c.ID,
		c.Name,
		c.Slug,
		c.Description,
		c.IndustryID,
		c.WebsiteURL,
		c.LogoURL,
		c.Size,
		c.IsVerified,
	).Scan(&c.UpdatedAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return fmt.Errorf("update company: company not found")
		}
		return fmt.Errorf("update company: %w", err)
	}
	return nil
}

func (r *CompanyRepo) Delete(ctx context.Context, id int64) error {
	query := `
		UPDATE companies
		SET deleted_at = NOW(), updated_at = NOW()
		WHERE id = $1 AND deleted_at IS NULL
	`
	ct, err := r.db.Exec(ctx, query, id)
	if err != nil {
		return fmt.Errorf("soft delete company: %w", err)
	}
	if ct.RowsAffected() == 0 {
		return fmt.Errorf("soft delete company: company not found")
	}
	return nil
}

func (r *CompanyRepo) List(ctx context.Context, filter company.ListCompanyFilter) ([]*company.Company, error) {
	query := `
		SELECT id, owner_id, name, slug, description, industry_id, website_url, logo_url, size, is_verified,
		       search_vector::text, created_at, updated_at, deleted_at
		FROM companies
		WHERE deleted_at IS NULL
	`
	args := make([]interface{}, 0)
	argPos := 1
	if filter.IndustryID != nil {
		query += fmt.Sprintf(" AND industry_id = $%d", argPos)
		args = append(args, *filter.IndustryID)
		argPos++
	}
	if filter.Size != nil {
		query += fmt.Sprintf(" AND size = $%d", argPos)
		args = append(args, *filter.Size)
		argPos++
	}

	limit := filter.Limit
	if limit <= 0 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}
	if filter.Offset < 0 {
		filter.Offset = 0
	}

	query += fmt.Sprintf(" ORDER BY created_at DESC LIMIT $%d OFFSET $%d", argPos, argPos+1)
	args = append(args, limit, filter.Offset)

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("list companies: %w", err)
	}
	defer rows.Close()

	result := make([]*company.Company, 0)
	for rows.Next() {
		c := &company.Company{}
		if err := rows.Scan(
			&c.ID,
			&c.OwnerID,
			&c.Name,
			&c.Slug,
			&c.Description,
			&c.IndustryID,
			&c.WebsiteURL,
			&c.LogoURL,
			&c.Size,
			&c.IsVerified,
			&c.SearchVector,
			&c.CreatedAt,
			&c.UpdatedAt,
			&c.DeletedAt,
		); err != nil {
			return nil, fmt.Errorf("list companies scan: %w", err)
		}
		result = append(result, c)
	}
	if rows.Err() != nil {
		return nil, fmt.Errorf("list companies rows: %w", rows.Err())
	}
	return result, nil
}
