package application

import (
	"context"
	"errors"
	"fmt"

	"backend/internal/domain/application"
	"backend/internal/domain/user"
	"backend/internal/domain/vacancy"
	vacancyUsecase "backend/internal/usecase/vacancy"
)

var (
	ErrApplicationAlreadyExists = errors.New("already applied")
	ErrApplicationForbidden     = errors.New("application access forbidden")
	ErrApplicationNotFound      = errors.New("application not found")
	ErrApplicationInvalid       = errors.New("invalid application payload")
)

type ApplicationUseCase struct {
	repo        application.ApplicationRepository
	vacancyRepo vacancy.VacancyRepository
	userRepo    user.Repository
}

func NewApplicationUseCase(repo application.ApplicationRepository, vacancyRepo vacancy.VacancyRepository, userRepo user.Repository) *ApplicationUseCase {
	return &ApplicationUseCase{repo: repo, vacancyRepo: vacancyRepo, userRepo: userRepo}
}

func (u *ApplicationUseCase) Apply(ctx context.Context, vacancyID int64, applicantID int64, input application.CreateApplicationInput) (*application.Application, error) {
	usr, err := u.userRepo.FindByID(ctx, applicantID)
	if err != nil {
		return nil, fmt.Errorf("get applicant: %w", err)
	}
	if usr == nil || usr.Role != user.RoleApplicant {
		return nil, ErrApplicationForbidden
	}

	v, err := u.vacancyRepo.GetByID(ctx, vacancyID)
	if err != nil {
		return nil, fmt.Errorf("get vacancy: %w", err)
	}
	if v == nil {
		return nil, vacancyUsecase.ErrVacancyNotFound
	}
	if v.Status != vacancy.VacancyStatusActive {
		return nil, ErrApplicationForbidden
	}

	exists, err := u.repo.Exists(ctx, vacancyID, applicantID)
	if err != nil {
		return nil, fmt.Errorf("check application exists: %w", err)
	}
	if exists {
		return nil, ErrApplicationAlreadyExists
	}

	app := &application.Application{
		VacancyID:   vacancyID,
		ApplicantID: applicantID,
		Status:      application.ApplicationStatusPending,
		CoverLetter: input.CoverLetter,
		ResumeID:    input.ResumeID,
		Vacancy:     v,
		Applicant:   usr,
	}

	if err := u.repo.Create(ctx, app); err != nil {
		return nil, fmt.Errorf("create application: %w", err)
	}
	return app, nil
}

func (u *ApplicationUseCase) ListMyApplications(ctx context.Context, applicantID int64) ([]*application.Application, error) {
	return u.repo.ListByApplicant(ctx, applicantID)
}

func (u *ApplicationUseCase) GetMyApplication(ctx context.Context, id int64, applicantID int64) (*application.Application, error) {
	app, err := u.repo.GetByIDForApplicant(ctx, id, applicantID)
	if err != nil {
		return nil, fmt.Errorf("get application: %w", err)
	}
	if app == nil {
		return nil, ErrApplicationNotFound
	}
	return app, nil
}

func (u *ApplicationUseCase) DeleteMyApplication(ctx context.Context, id int64, applicantID int64) error {
	app, err := u.repo.GetByIDForApplicant(ctx, id, applicantID)
	if err != nil {
		return fmt.Errorf("get application: %w", err)
	}
	if app == nil {
		return ErrApplicationNotFound
	}
	if app.Status != application.ApplicationStatusPending {
		return ErrApplicationForbidden
	}
	return u.repo.DeleteByApplicant(ctx, id, applicantID)
}

func (u *ApplicationUseCase) ListEmployerApplications(ctx context.Context, ownerID int64) ([]*application.Application, error) {
	return u.repo.ListByEmployer(ctx, ownerID)
}

func (u *ApplicationUseCase) ListEmployerVacancyApplications(ctx context.Context, ownerID int64, vacancyID int64) ([]*application.Application, error) {
	return u.repo.ListByEmployerVacancy(ctx, ownerID, vacancyID)
}

func (u *ApplicationUseCase) GetEmployerApplication(ctx context.Context, ownerID int64, id int64) (*application.Application, error) {
	app, err := u.repo.GetByIDForEmployer(ctx, id, ownerID)
	if err != nil {
		return nil, fmt.Errorf("get employer application: %w", err)
	}
	if app == nil {
		return nil, ErrApplicationNotFound
	}
	return app, nil
}

func (u *ApplicationUseCase) UpdateStatus(ctx context.Context, ownerID int64, id int64, status application.ApplicationStatus) (*application.Application, error) {
	normalized := application.NormalizeApplicationStatus(status)
	if !isValidStatus(normalized) {
		return nil, ErrApplicationInvalid
	}
	if err := u.repo.UpdateStatusForEmployer(ctx, id, ownerID, normalized); err != nil {
		return nil, err
	}
	return u.repo.GetByIDForEmployer(ctx, id, ownerID)
}

func isValidStatus(status application.ApplicationStatus) bool {
	switch status {
	case application.ApplicationStatusPending,
		application.ApplicationStatusViewed,
		application.ApplicationStatusAccepted,
		application.ApplicationStatusRejected:
		return true
	default:
		return false
	}
}
