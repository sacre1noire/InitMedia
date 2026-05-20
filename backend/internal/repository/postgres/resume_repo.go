package postgres

import (
	"context"
	"encoding/json"
	"fmt"

	"backend/internal/domain/resume"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ResumeRepo struct {
	db *pgxpool.Pool
}

func NewResumeRepo(db *pgxpool.Pool) *ResumeRepo {
	return &ResumeRepo{db: db}
}

func (r *ResumeRepo) Create(ctx context.Context, m *resume.Resume) error {
	contentBytes, err := json.Marshal(m.Content)
	if err != nil {
		return fmt.Errorf("marshal resume content: %w", err)
	}

	tx, err := r.db.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	if m.IsPrimary {
		if _, err := tx.Exec(ctx, `UPDATE resumes SET is_primary = false WHERE applicant_id = $1`, m.ApplicantID); err != nil {
			return fmt.Errorf("reset primary: %w", err)
		}
	}

	query := `
		INSERT INTO resumes (applicant_id, template_id, title, content, is_primary, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
		RETURNING id, created_at, updated_at
	`
	if err := tx.QueryRow(ctx, query, m.ApplicantID, m.TemplateID, m.Title, contentBytes, m.IsPrimary).
		Scan(&m.ID, &m.CreatedAt, &m.UpdatedAt); err != nil {
		return fmt.Errorf("create resume: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("commit resume create: %w", err)
	}
	return nil
}

func (r *ResumeRepo) Update(ctx context.Context, m *resume.Resume) error {
	contentBytes, err := json.Marshal(m.Content)
	if err != nil {
		return fmt.Errorf("marshal resume content: %w", err)
	}

	tx, err := r.db.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	if m.IsPrimary {
		if _, err := tx.Exec(ctx, `UPDATE resumes SET is_primary = false WHERE applicant_id = $1`, m.ApplicantID); err != nil {
			return fmt.Errorf("reset primary: %w", err)
		}
	}

	query := `
		UPDATE resumes
		SET template_id = $3,
		    title = $4,
		    content = $5,
		    is_primary = $6,
		    updated_at = NOW()
		WHERE id = $1 AND applicant_id = $2
		RETURNING updated_at
	`
	if err := tx.QueryRow(ctx, query, m.ID, m.ApplicantID, m.TemplateID, m.Title, contentBytes, m.IsPrimary).
		Scan(&m.UpdatedAt); err != nil {
		if err == pgx.ErrNoRows {
			return fmt.Errorf("update resume: not found")
		}
		return fmt.Errorf("update resume: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("commit resume update: %w", err)
	}
	return nil
}

func (r *ResumeRepo) Delete(ctx context.Context, id int64, applicantID int64) error {
	query := `DELETE FROM resumes WHERE id = $1 AND applicant_id = $2`
	ct, err := r.db.Exec(ctx, query, id, applicantID)
	if err != nil {
		return fmt.Errorf("delete resume: %w", err)
	}
	if ct.RowsAffected() == 0 {
		return fmt.Errorf("delete resume: not found")
	}
	return nil
}

func (r *ResumeRepo) GetByID(ctx context.Context, id int64, applicantID int64) (*resume.Resume, error) {
	query := `
		SELECT id, applicant_id, template_id, title, content, COALESCE(is_primary, false), created_at, updated_at
		FROM resumes
		WHERE id = $1 AND applicant_id = $2
	`
	var contentBytes []byte
	item := &resume.Resume{}
	if err := r.db.QueryRow(ctx, query, id, applicantID).Scan(
		&item.ID,
		&item.ApplicantID,
		&item.TemplateID,
		&item.Title,
		&contentBytes,
		&item.IsPrimary,
		&item.CreatedAt,
		&item.UpdatedAt,
	); err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("get resume: %w", err)
	}
	if len(contentBytes) > 0 {
		var content resume.ResumeContent
		if err := json.Unmarshal(contentBytes, &content); err != nil {
			return nil, fmt.Errorf("unmarshal resume content: %w", err)
		}
		item.Content = &content
	}
	return item, nil
}

// ListByApplicant returns resumes owned by the applicant (newest / primary first).
func (r *ResumeRepo) ListByApplicant(ctx context.Context, applicantID int64) ([]*resume.Resume, error) {
	query := `
		SELECT id, applicant_id, template_id, title, COALESCE(is_primary, false), created_at, updated_at
		FROM resumes
		WHERE applicant_id = $1
		ORDER BY is_primary DESC NULLS LAST, id DESC
	`
	rows, err := r.db.Query(ctx, query, applicantID)
	if err != nil {
		return nil, fmt.Errorf("list resumes: %w", err)
	}
	defer rows.Close()

	out := make([]*resume.Resume, 0)
	for rows.Next() {
		var m resume.Resume
		if err := rows.Scan(&m.ID, &m.ApplicantID, &m.TemplateID, &m.Title, &m.IsPrimary, &m.CreatedAt, &m.UpdatedAt); err != nil {
			return nil, fmt.Errorf("list resumes scan: %w", err)
		}
		out = append(out, &m)
	}
	if rows.Err() != nil {
		return nil, fmt.Errorf("list resumes rows: %w", rows.Err())
	}
	return out, nil
}

func (r *ResumeRepo) ListTemplates(ctx context.Context) ([]*resume.ResumeTemplate, error) {
	query := `
		SELECT id, name, preview_url, structure, COALESCE(specializations, '{}'), created_at
		FROM resume_templates
		ORDER BY id ASC
	`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("list resume templates: %w", err)
	}
	defer rows.Close()

	items := make([]*resume.ResumeTemplate, 0)
	for rows.Next() {
		var m resume.ResumeTemplate
		if err := rows.Scan(&m.ID, &m.Name, &m.PreviewURL, &m.Structure, &m.Specializations, &m.CreatedAt); err != nil {
			return nil, fmt.Errorf("list resume templates scan: %w", err)
		}
		items = append(items, &m)
	}
	if rows.Err() != nil {
		return nil, fmt.Errorf("list resume templates rows: %w", rows.Err())
	}
	return items, nil
}

func (r *ResumeRepo) GetTemplateByID(ctx context.Context, id int64) (*resume.ResumeTemplate, error) {
	query := `
		SELECT id, name, preview_url, structure, COALESCE(specializations, '{}'), created_at
		FROM resume_templates
		WHERE id = $1
	`
	item := &resume.ResumeTemplate{}
	if err := r.db.QueryRow(ctx, query, id).Scan(&item.ID, &item.Name, &item.PreviewURL, &item.Structure, &item.Specializations, &item.CreatedAt); err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("get resume template: %w", err)
	}
	return item, nil
}
