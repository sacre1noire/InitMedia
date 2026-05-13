package postgres

import (
	"context"
	"fmt"
	"strings"

	"backend/internal/domain/company"
	"backend/internal/domain/vacancy"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type VacancyRepo struct {
	db *pgxpool.Pool
}

func NewVacancyRepo(db *pgxpool.Pool) *VacancyRepo {
	return &VacancyRepo{db: db}
}

func (r *VacancyRepo) Create(ctx context.Context, v *vacancy.Vacancy) error {
	query := `
		INSERT INTO vacancies (
			company_id, title, description, requirements, duties, type, specialization, schedule,
			salary_from, salary_to, is_salary_hidden, city, is_remote, status, expires_at, published_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
		RETURNING id, created_at, updated_at
	`
	if err := r.db.QueryRow(
		ctx,
		query,
		v.CompanyID,
		v.Title,
		v.Description,
		v.Requirements,
		v.Duties,
		toDBVacancyEnum(string(v.Type)),
		v.Specialization,
		v.Schedule,
		v.SalaryFrom,
		v.SalaryTo,
		v.IsSalaryHidden,
		v.City,
		v.IsRemote,
		toDBVacancyEnum(string(v.Status)),
		v.ExpiresAt,
		v.PublishedAt,
	).Scan(&v.ID, &v.CreatedAt, &v.UpdatedAt); err != nil {
		return fmt.Errorf("create vacancy: %w", err)
	}
	return nil
}

func (r *VacancyRepo) Update(ctx context.Context, v *vacancy.Vacancy) error {
	query := `
		UPDATE vacancies
		SET title = $2,
			description = $3,
			requirements = $4,
			duties = $5,
			type = $6,
			specialization = $7,
			schedule = $8,
			salary_from = $9,
			salary_to = $10,
			is_salary_hidden = $11,
			city = $12,
			is_remote = $13,
			status = $14,
			updated_at = NOW(),
			expires_at = $15,
			published_at = $16
		WHERE id = $1
		RETURNING updated_at
	`
	if err := r.db.QueryRow(
		ctx,
		query,
		v.ID,
		v.Title,
		v.Description,
		v.Requirements,
		v.Duties,
		toDBVacancyEnum(string(v.Type)),
		v.Specialization,
		v.Schedule,
		v.SalaryFrom,
		v.SalaryTo,
		v.IsSalaryHidden,
		v.City,
		v.IsRemote,
		toDBVacancyEnum(string(v.Status)),
		v.ExpiresAt,
		v.PublishedAt,
	).Scan(&v.UpdatedAt); err != nil {
		return fmt.Errorf("update vacancy: %w", err)
	}
	return nil
}

func (r *VacancyRepo) Delete(ctx context.Context, id int64) error {
	query := `DELETE FROM vacancies WHERE id = $1`
	ct, err := r.db.Exec(ctx, query, id)
	if err != nil {
		return fmt.Errorf("delete vacancy: %w", err)
	}
	if ct.RowsAffected() == 0 {
		return fmt.Errorf("delete vacancy: not found")
	}
	return nil
}

func (r *VacancyRepo) GetByID(ctx context.Context, id int64) (*vacancy.Vacancy, error) {
	query := `
		SELECT v.id, v.company_id, v.title, v.description, v.requirements, v.duties,
		       v.type, v.specialization, v.schedule, v.salary_from, v.salary_to, v.is_salary_hidden,
		       v.city, v.is_remote, v.status, v.created_at, v.updated_at, v.expires_at, v.published_at,
		       COALESCE(vac_apps.cnt, 0)::int,
		       c.id, c.name, c.description, c.website_url, c.logo_url, c.city
		FROM vacancies v
		JOIN companies c ON c.id = v.company_id
		LEFT JOIN (
			SELECT vacancy_id, COUNT(*)::bigint AS cnt
			FROM applications
			GROUP BY vacancy_id
		) vac_apps ON vac_apps.vacancy_id = v.id
		WHERE v.id = $1
	`
	row := r.db.QueryRow(ctx, query, id)
	result := &vacancy.Vacancy{Company: &company.Company{}}
	var dbType string
	var dbStatus string
	if err := row.Scan(
		&result.ID,
		&result.CompanyID,
		&result.Title,
		&result.Description,
		&result.Requirements,
		&result.Duties,
		&dbType,
		&result.Specialization,
		&result.Schedule,
		&result.SalaryFrom,
		&result.SalaryTo,
		&result.IsSalaryHidden,
		&result.City,
		&result.IsRemote,
		&dbStatus,
		&result.CreatedAt,
		&result.UpdatedAt,
		&result.ExpiresAt,
		&result.PublishedAt,
		&result.ApplicationCount,
		&result.Company.ID,
		&result.Company.Name,
		&result.Company.Description,
		&result.Company.WebsiteURL,
		&result.Company.LogoURL,
		&result.Company.City,
	); err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("get vacancy by id: %w", err)
	}

	result.Type = vacancy.VacancyType(fromDBVacancyEnum(dbType))
	result.Status = vacancy.VacancyStatus(fromDBVacancyEnum(dbStatus))
	return result, nil
}

func (r *VacancyRepo) ListPublic(ctx context.Context, filter vacancy.ListVacancyFilter) ([]*vacancy.Vacancy, int64, error) {
	baseQuery := `
		FROM vacancies v
		JOIN companies c ON c.id = v.company_id
		LEFT JOIN (
			SELECT vacancy_id, COUNT(*)::bigint AS cnt
			FROM applications
			GROUP BY vacancy_id
		) vac_apps ON vac_apps.vacancy_id = v.id
		WHERE v.status = $1
	`
	args := make([]interface{}, 0)
	args = append(args, toDBVacancyEnum(string(vacancy.VacancyStatusActive)))
	argPos := 2

	searchPattern := ""
	if filter.Search != nil && strings.TrimSpace(*filter.Search) != "" {
		searchPattern = "%" + strings.TrimSpace(*filter.Search) + "%"
		baseQuery += fmt.Sprintf(" AND (v.title ILIKE $%d OR v.description ILIKE $%d)", argPos, argPos+1)
		args = append(args, searchPattern, searchPattern)
		argPos += 2
	}
	if filter.Type != nil {
		baseQuery += fmt.Sprintf(" AND v.type = $%d", argPos)
		args = append(args, toDBVacancyEnum(string(*filter.Type)))
		argPos++
	}
	if filter.Specialization != nil && strings.TrimSpace(*filter.Specialization) != "" {
		baseQuery += fmt.Sprintf(" AND lower(v.specialization) = $%d", argPos)
		args = append(args, strings.ToLower(strings.TrimSpace(*filter.Specialization)))
		argPos++
	}
	if filter.Schedule != nil && strings.TrimSpace(*filter.Schedule) != "" {
		baseQuery += fmt.Sprintf(" AND lower(v.schedule) = $%d", argPos)
		args = append(args, strings.ToLower(strings.TrimSpace(*filter.Schedule)))
		argPos++
	}
	if filter.City != nil && strings.TrimSpace(*filter.City) != "" {
		baseQuery += fmt.Sprintf(" AND lower(v.city) = $%d", argPos)
		args = append(args, strings.ToLower(strings.TrimSpace(*filter.City)))
		argPos++
	}
	if filter.IsRemote != nil {
		baseQuery += fmt.Sprintf(" AND v.is_remote = $%d", argPos)
		args = append(args, *filter.IsRemote)
		argPos++
	}
	if filter.SalaryFrom != nil {
		baseQuery += fmt.Sprintf(" AND v.salary_from >= $%d", argPos)
		args = append(args, *filter.SalaryFrom)
		argPos++
	}
	if filter.SalaryTo != nil {
		baseQuery += fmt.Sprintf(" AND v.salary_to <= $%d", argPos)
		args = append(args, *filter.SalaryTo)
		argPos++
	}

	countQuery := "SELECT COUNT(*) " + baseQuery
	var total int64
	if err := r.db.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count vacancies: %w", err)
	}

	orderBy := "v.created_at DESC"
	if filter.Sort != nil {
		switch strings.ToLower(strings.TrimSpace(*filter.Sort)) {
		case "salary":
			orderBy = "COALESCE(v.salary_from, 0) DESC"
		case "relevance":
			if searchPattern != "" {
				orderBy = fmt.Sprintf("(CASE WHEN v.title ILIKE $%d THEN 0 ELSE 1 END), v.created_at DESC", argPos)
				args = append(args, searchPattern)
				argPos++
			}
		case "date":
			orderBy = "COALESCE(v.published_at, v.created_at) DESC"
		}
	}

	if filter.Order != nil {
		order := strings.ToLower(strings.TrimSpace(*filter.Order))
		if order == "asc" {
			orderBy = strings.Replace(orderBy, "DESC", "ASC", 1)
		}
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

	query := `
		SELECT v.id, v.company_id, v.title, v.description, v.requirements, v.duties,
		       v.type, v.specialization, v.schedule, v.salary_from, v.salary_to, v.is_salary_hidden,
		       v.city, v.is_remote, v.status, v.created_at, v.updated_at, v.expires_at, v.published_at,
		       COALESCE(vac_apps.cnt, 0)::int,
		       c.id, c.name, c.description, c.website_url, c.logo_url, c.city
		` + baseQuery + fmt.Sprintf(" ORDER BY %s LIMIT $%d OFFSET $%d", orderBy, argPos, argPos+1)
	args = append(args, limit, filter.Offset)

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("list vacancies: %w", err)
	}
	defer rows.Close()

	result := make([]*vacancy.Vacancy, 0)
	for rows.Next() {
		item := &vacancy.Vacancy{Company: &company.Company{}}
		var dbType string
		var dbStatus string
		if err := rows.Scan(
			&item.ID,
			&item.CompanyID,
			&item.Title,
			&item.Description,
			&item.Requirements,
			&item.Duties,
			&dbType,
			&item.Specialization,
			&item.Schedule,
			&item.SalaryFrom,
			&item.SalaryTo,
			&item.IsSalaryHidden,
			&item.City,
			&item.IsRemote,
			&dbStatus,
			&item.CreatedAt,
			&item.UpdatedAt,
			&item.ExpiresAt,
			&item.PublishedAt,
			&item.ApplicationCount,
			&item.Company.ID,
			&item.Company.Name,
			&item.Company.Description,
			&item.Company.WebsiteURL,
			&item.Company.LogoURL,
			&item.Company.City,
		); err != nil {
			return nil, 0, fmt.Errorf("list vacancies scan: %w", err)
		}
		item.Type = vacancy.VacancyType(fromDBVacancyEnum(dbType))
		item.Status = vacancy.VacancyStatus(fromDBVacancyEnum(dbStatus))
		result = append(result, item)
	}
	if rows.Err() != nil {
		return nil, 0, fmt.Errorf("list vacancies rows: %w", rows.Err())
	}
	return result, total, nil
}

func (r *VacancyRepo) ListByCompany(ctx context.Context, companyID int64) ([]*vacancy.Vacancy, error) {
	query := `
		SELECT v.id, v.company_id, v.title, v.description, v.requirements, v.duties,
		       v.type, v.specialization, v.schedule, v.salary_from, v.salary_to, v.is_salary_hidden,
		       v.city, v.is_remote, v.status, v.created_at, v.updated_at, v.expires_at, v.published_at,
		       COALESCE(vac_apps.cnt, 0)::int,
		       c.id, c.name, c.description, c.website_url, c.logo_url, c.city
		FROM vacancies v
		JOIN companies c ON c.id = v.company_id
		LEFT JOIN (
			SELECT vacancy_id, COUNT(*)::bigint AS cnt
			FROM applications
			GROUP BY vacancy_id
		) vac_apps ON vac_apps.vacancy_id = v.id
		WHERE v.company_id = $1
		ORDER BY v.created_at DESC
	`
	rows, err := r.db.Query(ctx, query, companyID)
	if err != nil {
		return nil, fmt.Errorf("list company vacancies: %w", err)
	}
	defer rows.Close()

	result := make([]*vacancy.Vacancy, 0)
	for rows.Next() {
		item := &vacancy.Vacancy{Company: &company.Company{}}
		var dbType string
		var dbStatus string
		if err := rows.Scan(
			&item.ID,
			&item.CompanyID,
			&item.Title,
			&item.Description,
			&item.Requirements,
			&item.Duties,
			&dbType,
			&item.Specialization,
			&item.Schedule,
			&item.SalaryFrom,
			&item.SalaryTo,
			&item.IsSalaryHidden,
			&item.City,
			&item.IsRemote,
			&dbStatus,
			&item.CreatedAt,
			&item.UpdatedAt,
			&item.ExpiresAt,
			&item.PublishedAt,
			&item.ApplicationCount,
			&item.Company.ID,
			&item.Company.Name,
			&item.Company.Description,
			&item.Company.WebsiteURL,
			&item.Company.LogoURL,
			&item.Company.City,
		); err != nil {
			return nil, fmt.Errorf("list company vacancies scan: %w", err)
		}
		item.Type = vacancy.VacancyType(fromDBVacancyEnum(dbType))
		item.Status = vacancy.VacancyStatus(fromDBVacancyEnum(dbStatus))
		result = append(result, item)
	}
	if rows.Err() != nil {
		return nil, fmt.Errorf("list company vacancies rows: %w", rows.Err())
	}
	return result, nil
}

func toDBVacancyEnum(value string) string {
	return strings.ToUpper(strings.TrimSpace(value))
}

func fromDBVacancyEnum(value string) string {
	return strings.ToLower(strings.TrimSpace(value))
}
