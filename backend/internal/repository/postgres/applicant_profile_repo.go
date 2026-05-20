package postgres

import (
	"context"
	"errors"
	"fmt"
	"strings"

	profileDomain "backend/internal/domain/profile"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ApplicantProfileRepo struct {
	db *pgxpool.Pool
}

func NewApplicantProfileRepo(db *pgxpool.Pool) *ApplicantProfileRepo {
	return &ApplicantProfileRepo{db: db}
}

func (r *ApplicantProfileRepo) GetByUserID(ctx context.Context, userID int64) (*profileDomain.ApplicantProfile, error) {
	query := `
		SELECT id, user_id, first_name, last_name, phone, avatar_url,
		       education_level, study_course, university, experience, projects, achievements, skills,
		       city, specialization, skill_level, employment_types, schedule_preferences, bio, telegram, portfolio_url
		FROM applicant_profiles
		WHERE user_id = $1
	`

	profile := &profileDomain.ApplicantProfile{}
	err := r.db.QueryRow(ctx, query, userID).Scan(
		&profile.ID,
		&profile.UserID,
		&profile.FirstName,
		&profile.LastName,
		&profile.Phone,
		&profile.AvatarURL,
		&profile.EducationLevel,
		&profile.StudyCourse,
		&profile.University,
		&profile.Experience,
		&profile.Projects,
		&profile.Achievements,
		&profile.Skills,
		&profile.City,
		&profile.Specialization,
		&profile.SkillLevel,
		&profile.EmploymentTypes,
		&profile.SchedulePreferences,
		&profile.Bio,
		&profile.Telegram,
		&profile.PortfolioURL,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	if profile.EmploymentTypes == nil {
		profile.EmploymentTypes = []string{}
	}
	if profile.SchedulePreferences == nil {
		profile.SchedulePreferences = []string{}
	}

	return profile, nil
}

func (r *ApplicantProfileRepo) UpsertByUserID(ctx context.Context, p *profileDomain.ApplicantProfile) (*profileDomain.ApplicantProfile, error) {
	query := `
		INSERT INTO applicant_profiles (
			user_id, first_name, last_name, phone, avatar_url,
			education_level, study_course, university, experience, projects, achievements, skills,
			city,
			specialization, skill_level, employment_types, schedule_preferences,
			bio, telegram, portfolio_url
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
		ON CONFLICT (user_id) DO UPDATE SET
			first_name = EXCLUDED.first_name,
			last_name = EXCLUDED.last_name,
			phone = EXCLUDED.phone,
			avatar_url = EXCLUDED.avatar_url,
			education_level = EXCLUDED.education_level,
			study_course = EXCLUDED.study_course,
			university = EXCLUDED.university,
			experience = EXCLUDED.experience,
			projects = EXCLUDED.projects,
			achievements = EXCLUDED.achievements,
			skills = EXCLUDED.skills,
			city = EXCLUDED.city,
			specialization = EXCLUDED.specialization,
			skill_level = EXCLUDED.skill_level,
			employment_types = EXCLUDED.employment_types,
			schedule_preferences = EXCLUDED.schedule_preferences,
			bio = EXCLUDED.bio,
			telegram = EXCLUDED.telegram,
			portfolio_url = EXCLUDED.portfolio_url
		RETURNING id, user_id, first_name, last_name, phone, avatar_url,
		          education_level, study_course, university, experience, projects, achievements, skills,
		          city, specialization,
		          skill_level, employment_types, schedule_preferences, bio, telegram, portfolio_url
	`

	updated := &profileDomain.ApplicantProfile{}
	err := r.db.QueryRow(
		ctx,
		query,
		p.UserID,
		p.FirstName,
		p.LastName,
		p.Phone,
		p.AvatarURL,
		p.EducationLevel,
		p.StudyCourse,
		p.University,
		p.Experience,
		p.Projects,
		p.Achievements,
		p.Skills,
		p.City,
		p.Specialization,
		p.SkillLevel,
		p.EmploymentTypes,
		p.SchedulePreferences,
		p.Bio,
		p.Telegram,
		p.PortfolioURL,
	).Scan(
		&updated.ID,
		&updated.UserID,
		&updated.FirstName,
		&updated.LastName,
		&updated.Phone,
		&updated.AvatarURL,
		&updated.EducationLevel,
		&updated.StudyCourse,
		&updated.University,
		&updated.Experience,
		&updated.Projects,
		&updated.Achievements,
		&updated.Skills,
		&updated.City,
		&updated.Specialization,
		&updated.SkillLevel,
		&updated.EmploymentTypes,
		&updated.SchedulePreferences,
		&updated.Bio,
		&updated.Telegram,
		&updated.PortfolioURL,
	)
	if err != nil {
		return nil, err
	}

	if updated.EmploymentTypes == nil {
		updated.EmploymentTypes = []string{}
	}
	if updated.SchedulePreferences == nil {
		updated.SchedulePreferences = []string{}
	}

	return updated, nil
}

func (r *ApplicantProfileRepo) SearchCandidates(ctx context.Context, query string, limit int32, offset int32) ([]*profileDomain.CandidateSummary, error) {
	base := `
		SELECT p.user_id,
		       trim(concat_ws(' ', p.first_name, p.last_name)) AS full_name,
		       u.email,
		       p.specialization,
		       p.skill_level,
		       p.city
		FROM applicant_profiles p
		JOIN users u ON u.id = p.user_id
		WHERE u.role = 'APPLICANT'
	`
	args := make([]interface{}, 0)
	argPos := 1
	if strings.TrimSpace(query) != "" {
		needle := "%" + strings.TrimSpace(query) + "%"
		base += fmt.Sprintf(" AND (p.first_name ILIKE $%d OR p.last_name ILIKE $%d OR u.email ILIKE $%d OR p.skills ILIKE $%d OR p.specialization ILIKE $%d OR p.city ILIKE $%d)", argPos, argPos, argPos, argPos, argPos, argPos)
		args = append(args, needle)
		argPos++
	}

	if limit <= 0 || limit > 100 {
		limit = 20
	}
	base += fmt.Sprintf(" ORDER BY p.user_id DESC LIMIT $%d OFFSET $%d", argPos, argPos+1)
	args = append(args, limit, offset)

	rows, err := r.db.Query(ctx, base, args...)
	if err != nil {
		return nil, fmt.Errorf("search candidates: %w", err)
	}
	defer rows.Close()

	items := make([]*profileDomain.CandidateSummary, 0)
	for rows.Next() {
		item := &profileDomain.CandidateSummary{}
		if err := rows.Scan(&item.ID, &item.FullName, &item.Email, &item.Specialization, &item.SkillLevel, &item.City); err != nil {
			return nil, fmt.Errorf("search candidates scan: %w", err)
		}
		items = append(items, item)
	}
	if rows.Err() != nil {
		return nil, fmt.Errorf("search candidates rows: %w", rows.Err())
	}
	return items, nil
}

func (r *ApplicantProfileRepo) GetCandidateSummaryByID(ctx context.Context, userID int64) (*profileDomain.CandidateSummary, error) {
	query := `
		SELECT p.user_id,
		       trim(concat_ws(' ', p.first_name, p.last_name)) AS full_name,
		       u.email,
		       p.specialization,
		       p.skill_level,
		       p.city
		FROM applicant_profiles p
		JOIN users u ON u.id = p.user_id
		WHERE u.role = 'APPLICANT' AND p.user_id = $1
	`

	item := &profileDomain.CandidateSummary{}
	if err := r.db.QueryRow(ctx, query, userID).Scan(
		&item.ID,
		&item.FullName,
		&item.Email,
		&item.Specialization,
		&item.SkillLevel,
		&item.City,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("get candidate summary: %w", err)
	}

	return item, nil
}
