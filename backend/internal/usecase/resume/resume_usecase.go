package resumeusecase

import (
	"context"
	"errors"
	"fmt"
	"strings"

	domainresume "backend/internal/domain/resume"
	"backend/internal/service/resume_agent"
	"backend/internal/service/resume_render"
)

var (
	ErrResumeNotFound     = errors.New("resume not found")
	ErrInvalidResumeInput = errors.New("invalid resume payload")
	ErrTemplateNotFound   = errors.New("resume template not found")
)

// Repository loads resume aggregates.
type Repository interface {
	Create(ctx context.Context, m *domainresume.Resume) error
	Update(ctx context.Context, m *domainresume.Resume) error
	Delete(ctx context.Context, id int64, applicantID int64) error
	GetByID(ctx context.Context, id int64, applicantID int64) (*domainresume.Resume, error)
	ListByApplicant(ctx context.Context, applicantID int64) ([]*domainresume.Resume, error)
	ListTemplates(ctx context.Context) ([]*domainresume.ResumeTemplate, error)
	GetTemplateByID(ctx context.Context, id int64) (*domainresume.ResumeTemplate, error)
}

// UseCase is applicant resume read operations.
type UseCase struct {
	repo Repository
}

func NewUseCase(repo Repository) *UseCase {
	return &UseCase{repo: repo}
}

func (u *UseCase) ListMine(ctx context.Context, applicantID int64) ([]*domainresume.Resume, error) {
	items, err := u.repo.ListByApplicant(ctx, applicantID)
	if err != nil {
		return nil, fmt.Errorf("resume list: %w", err)
	}
	return items, nil
}

func (u *UseCase) GetByID(ctx context.Context, applicantID int64, id int64) (*domainresume.Resume, error) {
	item, err := u.repo.GetByID(ctx, id, applicantID)
	if err != nil {
		return nil, fmt.Errorf("get resume: %w", err)
	}
	if item == nil {
		return nil, ErrResumeNotFound
	}
	return item, nil
}

func (u *UseCase) Create(ctx context.Context, applicantID int64, input domainresume.Resume) (*domainresume.Resume, error) {
	normalized, err := normalizeResumeInput(input)
	if err != nil {
		return nil, err
	}
	if normalized.TemplateID == nil {
		return nil, ErrInvalidResumeInput
	}

	tpl, err := u.repo.GetTemplateByID(ctx, *normalized.TemplateID)
	if err != nil {
		return nil, fmt.Errorf("get resume template: %w", err)
	}
	if tpl == nil {
		return nil, ErrTemplateNotFound
	}

	model := &domainresume.Resume{
		ApplicantID: applicantID,
		TemplateID:  normalized.TemplateID,
		Title:       normalized.Title,
		Content:     normalized.Content,
		IsPrimary:   normalized.IsPrimary,
	}
	if err := u.repo.Create(ctx, model); err != nil {
		return nil, fmt.Errorf("create resume: %w", err)
	}
	return model, nil
}

func (u *UseCase) Update(ctx context.Context, applicantID int64, id int64, input domainresume.Resume) (*domainresume.Resume, error) {
	normalized, err := normalizeResumeInput(input)
	if err != nil {
		return nil, err
	}
	if normalized.TemplateID == nil {
		return nil, ErrInvalidResumeInput
	}

	tpl, err := u.repo.GetTemplateByID(ctx, *normalized.TemplateID)
	if err != nil {
		return nil, fmt.Errorf("get resume template: %w", err)
	}
	if tpl == nil {
		return nil, ErrTemplateNotFound
	}

	model := &domainresume.Resume{
		ID:          id,
		ApplicantID: applicantID,
		TemplateID:  normalized.TemplateID,
		Title:       normalized.Title,
		Content:     normalized.Content,
		IsPrimary:   normalized.IsPrimary,
	}
	if err := u.repo.Update(ctx, model); err != nil {
		if strings.Contains(err.Error(), "not found") {
			return nil, ErrResumeNotFound
		}
		return nil, fmt.Errorf("update resume: %w", err)
	}
	return model, nil
}

func (u *UseCase) Delete(ctx context.Context, applicantID int64, id int64) error {
	if err := u.repo.Delete(ctx, id, applicantID); err != nil {
		if strings.Contains(err.Error(), "not found") {
			return ErrResumeNotFound
		}
		return fmt.Errorf("delete resume: %w", err)
	}
	return nil
}

func (u *UseCase) ListTemplates(ctx context.Context) ([]*domainresume.ResumeTemplate, error) {
	items, err := u.repo.ListTemplates(ctx)
	if err != nil {
		return nil, fmt.Errorf("list resume templates: %w", err)
	}
	return items, nil
}

func (u *UseCase) GetPreviewHTML(ctx context.Context, applicantID int64, id int64) (string, error) {
	item, err := u.repo.GetByID(ctx, id, applicantID)
	if err != nil {
		return "", fmt.Errorf("get resume for preview: %w", err)
	}
	if item == nil || item.Content == nil {
		return "", ErrResumeNotFound
	}
	if item.TemplateID == nil {
		return "", ErrTemplateNotFound
	}
	// template data reserved for future template variants
	_, err = u.repo.GetTemplateByID(ctx, *item.TemplateID)
	if err != nil {
		return "", fmt.Errorf("get resume template: %w", err)
	}
	return resume_render.RenderClassicBW(*item.Content), nil
}

func (u *UseCase) GetHelper(ctx context.Context, applicantID int64, id int64) (*resume_agent.HelperResponse, error) {
	item, err := u.repo.GetByID(ctx, id, applicantID)
	if err != nil {
		return nil, fmt.Errorf("get resume for helper: %w", err)
	}
	if item == nil || item.Content == nil {
		return nil, ErrResumeNotFound
	}
	resp := resume_agent.Evaluate(*item.Content)
	return &resp, nil
}

func normalizeResumeInput(input domainresume.Resume) (*domainresume.Resume, error) {
	if input.Content == nil {
		return nil, ErrInvalidResumeInput
	}
	input.Title = strings.TrimSpace(input.Title)
	if input.Title == "" {
		return nil, ErrInvalidResumeInput
	}
	content := *input.Content
	content.FullName = strings.TrimSpace(content.FullName)
	content.Qualification = strings.TrimSpace(content.Qualification)
	if content.FullName == "" || content.Qualification == "" {
		return nil, ErrInvalidResumeInput
	}
	if len(content.Skills) > 0 {
		clean := make([]string, 0, len(content.Skills))
		for _, skill := range content.Skills {
			trimmed := strings.TrimSpace(skill)
			if trimmed != "" {
				clean = append(clean, trimmed)
			}
		}
		content.Skills = clean
	}
	for i := range content.Experience {
		content.Experience[i].Company = strings.TrimSpace(content.Experience[i].Company)
		content.Experience[i].Role = strings.TrimSpace(content.Experience[i].Role)
	}
	for i := range content.Education {
		content.Education[i].Institution = strings.TrimSpace(content.Education[i].Institution)
		content.Education[i].Degree = strings.TrimSpace(content.Education[i].Degree)
	}
	for i := range content.Recommendations {
		content.Recommendations[i].Name = strings.TrimSpace(content.Recommendations[i].Name)
	}
	input.Content = &content
	return &input, nil
}
