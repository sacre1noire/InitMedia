package postgres

import (
	"context"
	"fmt"
	"strings"

	"backend/internal/domain/application"
	"backend/internal/domain/company"
	"backend/internal/domain/user"
	"backend/internal/domain/vacancy"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ApplicationRepo struct {
	db *pgxpool.Pool
}

func NewApplicationRepo(db *pgxpool.Pool) *ApplicationRepo {
	return &ApplicationRepo{db: db}
}

func (r *ApplicationRepo) Create(ctx context.Context, a *application.Application) error {
	query := `
		INSERT INTO applications (vacancy_id, applicant_id, status, cover_letter, resume_id, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
		RETURNING id, created_at, updated_at
	`
	if err := r.db.QueryRow(
		ctx,
		query,
		a.VacancyID,
		a.ApplicantID,
		toDBApplicationStatus(string(a.Status)),
		a.CoverLetter,
		a.ResumeID,
	).Scan(&a.ID, &a.CreatedAt, &a.UpdatedAt); err != nil {
		return fmt.Errorf("create application: %w", err)
	}
	return nil
}

func (r *ApplicationRepo) Exists(ctx context.Context, vacancyID int64, applicantID int64) (bool, error) {
	query := `SELECT 1 FROM applications WHERE vacancy_id = $1 AND applicant_id = $2`
	var tmp int
	err := r.db.QueryRow(ctx, query, vacancyID, applicantID).Scan(&tmp)
	if err != nil {
		if err == pgx.ErrNoRows {
			return false, nil
		}
		return false, fmt.Errorf("check application exists: %w", err)
	}
	return true, nil
}

func (r *ApplicationRepo) ListByApplicant(ctx context.Context, applicantID int64) ([]*application.Application, error) {
	query := `
		SELECT a.id, a.vacancy_id, a.applicant_id, a.status, a.cover_letter, a.resume_id, a.created_at, a.updated_at,
		       v.id, v.company_id, v.title, v.description, v.requirements, v.duties, v.type, v.specialization, v.schedule,
		       v.salary_from, v.salary_to, v.is_salary_hidden, v.city, v.is_remote, v.status, v.created_at, v.updated_at, v.expires_at, v.published_at,
		       c.id, c.name, c.description, c.website_url, c.logo_url, c.city,
		       r.title
		FROM applications a
		JOIN vacancies v ON v.id = a.vacancy_id
		JOIN companies c ON c.id = v.company_id
		LEFT JOIN resumes r ON r.id = a.resume_id AND r.applicant_id = a.applicant_id
		WHERE a.applicant_id = $1
		ORDER BY a.created_at DESC
	`
	rows, err := r.db.Query(ctx, query, applicantID)
	if err != nil {
		return nil, fmt.Errorf("list applications by applicant: %w", err)
	}
	defer rows.Close()

	result := make([]*application.Application, 0)
	for rows.Next() {
		app := &application.Application{Vacancy: &vacancy.Vacancy{Company: &company.Company{}}}
		var appStatus string
		var vacType string
		var vacStatus string
		if err := rows.Scan(
			&app.ID,
			&app.VacancyID,
			&app.ApplicantID,
			&appStatus,
			&app.CoverLetter,
			&app.ResumeID,
			&app.CreatedAt,
			&app.UpdatedAt,
			&app.Vacancy.ID,
			&app.Vacancy.CompanyID,
			&app.Vacancy.Title,
			&app.Vacancy.Description,
			&app.Vacancy.Requirements,
			&app.Vacancy.Duties,
			&vacType,
			&app.Vacancy.Specialization,
			&app.Vacancy.Schedule,
			&app.Vacancy.SalaryFrom,
			&app.Vacancy.SalaryTo,
			&app.Vacancy.IsSalaryHidden,
			&app.Vacancy.City,
			&app.Vacancy.IsRemote,
			&vacStatus,
			&app.Vacancy.CreatedAt,
			&app.Vacancy.UpdatedAt,
			&app.Vacancy.ExpiresAt,
			&app.Vacancy.PublishedAt,
			&app.Vacancy.Company.ID,
			&app.Vacancy.Company.Name,
			&app.Vacancy.Company.Description,
			&app.Vacancy.Company.WebsiteURL,
			&app.Vacancy.Company.LogoURL,
			&app.Vacancy.Company.City,
			&app.ResumeTitle,
		); err != nil {
			return nil, fmt.Errorf("list applications scan: %w", err)
		}
		app.Status = application.ApplicationStatus(fromDBApplicationStatus(appStatus))
		app.Vacancy.Type = vacancy.VacancyType(fromDBVacancyEnum(vacType))
		app.Vacancy.Status = vacancy.VacancyStatus(fromDBVacancyEnum(vacStatus))
		result = append(result, app)
	}
	if rows.Err() != nil {
		return nil, fmt.Errorf("list applications rows: %w", rows.Err())
	}
	return result, nil
}

func (r *ApplicationRepo) ListByEmployer(ctx context.Context, ownerID int64) ([]*application.Application, error) {
	query := `
		SELECT a.id, a.vacancy_id, a.applicant_id, a.status, a.cover_letter, a.resume_id, a.created_at, a.updated_at,
		       v.id, v.company_id, v.title, v.description, v.requirements, v.duties, v.type, v.specialization, v.schedule,
		       v.salary_from, v.salary_to, v.is_salary_hidden, v.city, v.is_remote, v.status, v.created_at, v.updated_at, v.expires_at, v.published_at,
		       c.id, c.name, c.description, c.website_url, c.logo_url, c.city,
		       u.id, u.email, u.role, u.is_active, u.created_at, u.updated_at,
		       r.title
		FROM applications a
		JOIN vacancies v ON v.id = a.vacancy_id
		JOIN companies c ON c.id = v.company_id
		JOIN users u ON u.id = a.applicant_id
		LEFT JOIN resumes r ON r.id = a.resume_id AND r.applicant_id = a.applicant_id
		WHERE c.owner_id = $1
		ORDER BY a.created_at DESC
	`
	rows, err := r.db.Query(ctx, query, ownerID)
	if err != nil {
		return nil, fmt.Errorf("list applications by employer: %w", err)
	}
	defer rows.Close()

	result := make([]*application.Application, 0)
	for rows.Next() {
		app := &application.Application{
			Vacancy:   &vacancy.Vacancy{Company: &company.Company{}},
			Applicant: &user.User{},
		}
		var appStatus string
		var vacType string
		var vacStatus string
		if err := rows.Scan(
			&app.ID,
			&app.VacancyID,
			&app.ApplicantID,
			&appStatus,
			&app.CoverLetter,
			&app.ResumeID,
			&app.CreatedAt,
			&app.UpdatedAt,
			&app.Vacancy.ID,
			&app.Vacancy.CompanyID,
			&app.Vacancy.Title,
			&app.Vacancy.Description,
			&app.Vacancy.Requirements,
			&app.Vacancy.Duties,
			&vacType,
			&app.Vacancy.Specialization,
			&app.Vacancy.Schedule,
			&app.Vacancy.SalaryFrom,
			&app.Vacancy.SalaryTo,
			&app.Vacancy.IsSalaryHidden,
			&app.Vacancy.City,
			&app.Vacancy.IsRemote,
			&vacStatus,
			&app.Vacancy.CreatedAt,
			&app.Vacancy.UpdatedAt,
			&app.Vacancy.ExpiresAt,
			&app.Vacancy.PublishedAt,
			&app.Vacancy.Company.ID,
			&app.Vacancy.Company.Name,
			&app.Vacancy.Company.Description,
			&app.Vacancy.Company.WebsiteURL,
			&app.Vacancy.Company.LogoURL,
			&app.Vacancy.Company.City,
			&app.Applicant.ID,
			&app.Applicant.Email,
			&app.Applicant.Role,
			&app.Applicant.IsActive,
			&app.Applicant.CreatedAt,
			&app.Applicant.UpdatedAt,
			&app.ResumeTitle,
		); err != nil {
			return nil, fmt.Errorf("list employer applications scan: %w", err)
		}
		app.Status = application.ApplicationStatus(fromDBApplicationStatus(appStatus))
		app.Vacancy.Type = vacancy.VacancyType(fromDBVacancyEnum(vacType))
		app.Vacancy.Status = vacancy.VacancyStatus(fromDBVacancyEnum(vacStatus))
		result = append(result, app)
	}
	if rows.Err() != nil {
		return nil, fmt.Errorf("list employer applications rows: %w", rows.Err())
	}
	return result, nil
}

func (r *ApplicationRepo) ListByEmployerVacancy(ctx context.Context, ownerID int64, vacancyID int64) ([]*application.Application, error) {
	query := `
		SELECT a.id, a.vacancy_id, a.applicant_id, a.status, a.cover_letter, a.resume_id, a.created_at, a.updated_at,
		       v.id, v.company_id, v.title, v.description, v.requirements, v.duties, v.type, v.specialization, v.schedule,
		       v.salary_from, v.salary_to, v.is_salary_hidden, v.city, v.is_remote, v.status, v.created_at, v.updated_at, v.expires_at, v.published_at,
		       c.id, c.name, c.description, c.website_url, c.logo_url, c.city,
		       u.id, u.email, u.role, u.is_active, u.created_at, u.updated_at,
		       r.title
		FROM applications a
		JOIN vacancies v ON v.id = a.vacancy_id
		JOIN companies c ON c.id = v.company_id
		JOIN users u ON u.id = a.applicant_id
		LEFT JOIN resumes r ON r.id = a.resume_id AND r.applicant_id = a.applicant_id
		WHERE c.owner_id = $1 AND v.id = $2
		ORDER BY a.created_at DESC
	`
	rows, err := r.db.Query(ctx, query, ownerID, vacancyID)
	if err != nil {
		return nil, fmt.Errorf("list employer vacancy applications: %w", err)
	}
	defer rows.Close()

	result := make([]*application.Application, 0)
	for rows.Next() {
		app := &application.Application{
			Vacancy:   &vacancy.Vacancy{Company: &company.Company{}},
			Applicant: &user.User{},
		}
		var appStatus string
		var vacType string
		var vacStatus string
		if err := rows.Scan(
			&app.ID,
			&app.VacancyID,
			&app.ApplicantID,
			&appStatus,
			&app.CoverLetter,
			&app.ResumeID,
			&app.CreatedAt,
			&app.UpdatedAt,
			&app.Vacancy.ID,
			&app.Vacancy.CompanyID,
			&app.Vacancy.Title,
			&app.Vacancy.Description,
			&app.Vacancy.Requirements,
			&app.Vacancy.Duties,
			&vacType,
			&app.Vacancy.Specialization,
			&app.Vacancy.Schedule,
			&app.Vacancy.SalaryFrom,
			&app.Vacancy.SalaryTo,
			&app.Vacancy.IsSalaryHidden,
			&app.Vacancy.City,
			&app.Vacancy.IsRemote,
			&vacStatus,
			&app.Vacancy.CreatedAt,
			&app.Vacancy.UpdatedAt,
			&app.Vacancy.ExpiresAt,
			&app.Vacancy.PublishedAt,
			&app.Vacancy.Company.ID,
			&app.Vacancy.Company.Name,
			&app.Vacancy.Company.Description,
			&app.Vacancy.Company.WebsiteURL,
			&app.Vacancy.Company.LogoURL,
			&app.Vacancy.Company.City,
			&app.Applicant.ID,
			&app.Applicant.Email,
			&app.Applicant.Role,
			&app.Applicant.IsActive,
			&app.Applicant.CreatedAt,
			&app.Applicant.UpdatedAt,
			&app.ResumeTitle,
		); err != nil {
			return nil, fmt.Errorf("list employer vacancy applications scan: %w", err)
		}
		app.Status = application.ApplicationStatus(fromDBApplicationStatus(appStatus))
		app.Vacancy.Type = vacancy.VacancyType(fromDBVacancyEnum(vacType))
		app.Vacancy.Status = vacancy.VacancyStatus(fromDBVacancyEnum(vacStatus))
		result = append(result, app)
	}
	if rows.Err() != nil {
		return nil, fmt.Errorf("list employer vacancy applications rows: %w", rows.Err())
	}
	return result, nil
}

func (r *ApplicationRepo) GetByIDForApplicant(ctx context.Context, id int64, applicantID int64) (*application.Application, error) {
	query := `
		SELECT a.id, a.vacancy_id, a.applicant_id, a.status, a.cover_letter, a.resume_id, a.created_at, a.updated_at,
		       v.id, v.company_id, v.title, v.description, v.requirements, v.duties, v.type, v.specialization, v.schedule,
		       v.salary_from, v.salary_to, v.is_salary_hidden, v.city, v.is_remote, v.status, v.created_at, v.updated_at, v.expires_at, v.published_at,
		       c.id, c.name, c.description, c.website_url, c.logo_url, c.city,
		       r.title
		FROM applications a
		JOIN vacancies v ON v.id = a.vacancy_id
		JOIN companies c ON c.id = v.company_id
		LEFT JOIN resumes r ON r.id = a.resume_id AND r.applicant_id = a.applicant_id
		WHERE a.id = $1 AND a.applicant_id = $2
	`
	app := &application.Application{Vacancy: &vacancy.Vacancy{Company: &company.Company{}}}
	var appStatus string
	var vacType string
	var vacStatus string
	if err := r.db.QueryRow(ctx, query, id, applicantID).Scan(
		&app.ID,
		&app.VacancyID,
		&app.ApplicantID,
		&appStatus,
		&app.CoverLetter,
		&app.ResumeID,
		&app.CreatedAt,
		&app.UpdatedAt,
		&app.Vacancy.ID,
		&app.Vacancy.CompanyID,
		&app.Vacancy.Title,
		&app.Vacancy.Description,
		&app.Vacancy.Requirements,
		&app.Vacancy.Duties,
		&vacType,
		&app.Vacancy.Specialization,
		&app.Vacancy.Schedule,
		&app.Vacancy.SalaryFrom,
		&app.Vacancy.SalaryTo,
		&app.Vacancy.IsSalaryHidden,
		&app.Vacancy.City,
		&app.Vacancy.IsRemote,
		&vacStatus,
		&app.Vacancy.CreatedAt,
		&app.Vacancy.UpdatedAt,
		&app.Vacancy.ExpiresAt,
		&app.Vacancy.PublishedAt,
		&app.Vacancy.Company.ID,
		&app.Vacancy.Company.Name,
		&app.Vacancy.Company.Description,
		&app.Vacancy.Company.WebsiteURL,
		&app.Vacancy.Company.LogoURL,
		&app.Vacancy.Company.City,
		&app.ResumeTitle,
	); err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("get application by id for applicant: %w", err)
	}
	app.Status = application.ApplicationStatus(fromDBApplicationStatus(appStatus))
	app.Vacancy.Type = vacancy.VacancyType(fromDBVacancyEnum(vacType))
	app.Vacancy.Status = vacancy.VacancyStatus(fromDBVacancyEnum(vacStatus))
	return app, nil
}

func (r *ApplicationRepo) GetByIDForEmployer(ctx context.Context, id int64, ownerID int64) (*application.Application, error) {
	query := `
		SELECT a.id, a.vacancy_id, a.applicant_id, a.status, a.cover_letter, a.resume_id, a.created_at, a.updated_at,
		       v.id, v.company_id, v.title, v.description, v.requirements, v.duties, v.type, v.specialization, v.schedule,
		       v.salary_from, v.salary_to, v.is_salary_hidden, v.city, v.is_remote, v.status, v.created_at, v.updated_at, v.expires_at, v.published_at,
		       c.id, c.name, c.description, c.website_url, c.logo_url, c.city,
		       u.id, u.email, u.role, u.is_active, u.created_at, u.updated_at,
		       r.title
		FROM applications a
		JOIN vacancies v ON v.id = a.vacancy_id
		JOIN companies c ON c.id = v.company_id
		JOIN users u ON u.id = a.applicant_id
		LEFT JOIN resumes r ON r.id = a.resume_id AND r.applicant_id = a.applicant_id
		WHERE a.id = $1 AND c.owner_id = $2
	`
	app := &application.Application{
		Vacancy:   &vacancy.Vacancy{Company: &company.Company{}},
		Applicant: &user.User{},
	}
	var appStatus string
	var vacType string
	var vacStatus string
	if err := r.db.QueryRow(ctx, query, id, ownerID).Scan(
		&app.ID,
		&app.VacancyID,
		&app.ApplicantID,
		&appStatus,
		&app.CoverLetter,
		&app.ResumeID,
		&app.CreatedAt,
		&app.UpdatedAt,
		&app.Vacancy.ID,
		&app.Vacancy.CompanyID,
		&app.Vacancy.Title,
		&app.Vacancy.Description,
		&app.Vacancy.Requirements,
		&app.Vacancy.Duties,
		&vacType,
		&app.Vacancy.Specialization,
		&app.Vacancy.Schedule,
		&app.Vacancy.SalaryFrom,
		&app.Vacancy.SalaryTo,
		&app.Vacancy.IsSalaryHidden,
		&app.Vacancy.City,
		&app.Vacancy.IsRemote,
		&vacStatus,
		&app.Vacancy.CreatedAt,
		&app.Vacancy.UpdatedAt,
		&app.Vacancy.ExpiresAt,
		&app.Vacancy.PublishedAt,
		&app.Vacancy.Company.ID,
		&app.Vacancy.Company.Name,
		&app.Vacancy.Company.Description,
		&app.Vacancy.Company.WebsiteURL,
		&app.Vacancy.Company.LogoURL,
		&app.Vacancy.Company.City,
		&app.Applicant.ID,
		&app.Applicant.Email,
		&app.Applicant.Role,
		&app.Applicant.IsActive,
		&app.Applicant.CreatedAt,
		&app.Applicant.UpdatedAt,
		&app.ResumeTitle,
	); err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("get application by id for employer: %w", err)
	}
	app.Status = application.ApplicationStatus(fromDBApplicationStatus(appStatus))
	app.Vacancy.Type = vacancy.VacancyType(fromDBVacancyEnum(vacType))
	app.Vacancy.Status = vacancy.VacancyStatus(fromDBVacancyEnum(vacStatus))
	return app, nil
}

func (r *ApplicationRepo) UpdateStatusForEmployer(ctx context.Context, id int64, ownerID int64, status application.ApplicationStatus) error {
	query := `
		UPDATE applications a
		SET status = $3, updated_at = NOW()
		FROM vacancies v
		JOIN companies c ON c.id = v.company_id
		WHERE a.id = $1 AND a.vacancy_id = v.id AND c.owner_id = $2
	`
	ct, err := r.db.Exec(ctx, query, id, ownerID, toDBApplicationStatus(string(status)))
	if err != nil {
		return fmt.Errorf("update application status: %w", err)
	}
	if ct.RowsAffected() == 0 {
		return fmt.Errorf("update application status: not found")
	}
	return nil
}

func (r *ApplicationRepo) DeleteByApplicant(ctx context.Context, id int64, applicantID int64) error {
	query := `DELETE FROM applications WHERE id = $1 AND applicant_id = $2`
	ct, err := r.db.Exec(ctx, query, id, applicantID)
	if err != nil {
		return fmt.Errorf("delete application: %w", err)
	}
	if ct.RowsAffected() == 0 {
		return fmt.Errorf("delete application: not found")
	}
	return nil
}

func toDBApplicationStatus(value string) string {
	return strings.ToUpper(strings.TrimSpace(value))
}

func fromDBApplicationStatus(value string) string {
	return strings.ToLower(strings.TrimSpace(value))
}
