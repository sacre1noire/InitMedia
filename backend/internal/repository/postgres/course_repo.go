package postgres

import (
	"context"
	"encoding/json"
	"fmt"

	"backend/internal/domain/course"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type CourseRepo struct {
	db *pgxpool.Pool
}

func NewCourseRepo(db *pgxpool.Pool) *CourseRepo {
	return &CourseRepo{db: db}
}

func (r *CourseRepo) ListCourses(ctx context.Context, status *course.CourseStatus) ([]*course.Course, error) {
	query := `
		SELECT id, title, description, cover_url, specializations, duration_minutes, is_free, "order", status, xp_reward, created_at, updated_at
		FROM courses
	`
	args := []interface{}{}
	if status != nil {
		query += " WHERE status = $1"
		args = append(args, toDBCourseStatus(string(*status)))
	}
	query += " ORDER BY \"order\" ASC, id ASC"

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("list courses: %w", err)
	}
	defer rows.Close()

	items := make([]*course.Course, 0)
	for rows.Next() {
		item := &course.Course{}
		var dbStatus string
		var specBytes []byte
		if err := rows.Scan(
			&item.ID,
			&item.Title,
			&item.Description,
			&item.CoverURL,
			&specBytes,
			&item.DurationMinutes,
			&item.IsFree,
			&item.Order,
			&dbStatus,
			&item.XPReward,
			&item.CreatedAt,
			&item.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("list courses scan: %w", err)
		}
		item.Status = course.CourseStatus(fromDBCourseStatus(dbStatus))
		if len(specBytes) > 0 {
			var specs []string
			if err := json.Unmarshal(specBytes, &specs); err != nil {
				return nil, fmt.Errorf("list courses specs: %w", err)
			}
			item.Specializations = specs
		} else {
			item.Specializations = []string{}
		}
		items = append(items, item)
	}
	if rows.Err() != nil {
		return nil, fmt.Errorf("list courses rows: %w", rows.Err())
	}
	return items, nil
}

func (r *CourseRepo) GetCourseByID(ctx context.Context, id int64) (*course.Course, error) {
	query := `
		SELECT id, title, description, cover_url, specializations, duration_minutes, is_free, "order", status, xp_reward, created_at, updated_at
		FROM courses
		WHERE id = $1
	`
	item := &course.Course{}
	var dbStatus string
	var specBytes []byte
	if err := r.db.QueryRow(ctx, query, id).Scan(
		&item.ID,
		&item.Title,
		&item.Description,
		&item.CoverURL,
		&specBytes,
		&item.DurationMinutes,
		&item.IsFree,
		&item.Order,
		&dbStatus,
		&item.XPReward,
		&item.CreatedAt,
		&item.UpdatedAt,
	); err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("get course: %w", err)
	}
	item.Status = course.CourseStatus(fromDBCourseStatus(dbStatus))
	if len(specBytes) > 0 {
		var specs []string
		if err := json.Unmarshal(specBytes, &specs); err != nil {
			return nil, fmt.Errorf("get course specs: %w", err)
		}
		item.Specializations = specs
	} else {
		item.Specializations = []string{}
	}
	return item, nil
}

func (r *CourseRepo) ListLessonsByCourse(ctx context.Context, courseID int64) ([]*course.Lesson, error) {
	query := `
		SELECT id, course_id, title, content, video_url, "order"
		FROM lessons
		WHERE course_id = $1
		ORDER BY "order" ASC, id ASC
	`
	rows, err := r.db.Query(ctx, query, courseID)
	if err != nil {
		return nil, fmt.Errorf("list lessons: %w", err)
	}
	defer rows.Close()

	items := make([]*course.Lesson, 0)
	for rows.Next() {
		item := &course.Lesson{}
		if err := rows.Scan(&item.ID, &item.CourseID, &item.Title, &item.Content, &item.VideoURL, &item.Order); err != nil {
			return nil, fmt.Errorf("list lessons scan: %w", err)
		}
		items = append(items, item)
	}
	if rows.Err() != nil {
		return nil, fmt.Errorf("list lessons rows: %w", rows.Err())
	}
	return items, nil
}

func (r *CourseRepo) GetLessonByID(ctx context.Context, courseID int64, lessonID int64) (*course.Lesson, error) {
	query := `
		SELECT id, course_id, title, content, video_url, "order"
		FROM lessons
		WHERE course_id = $1 AND id = $2
	`
	item := &course.Lesson{}
	if err := r.db.QueryRow(ctx, query, courseID, lessonID).
		Scan(&item.ID, &item.CourseID, &item.Title, &item.Content, &item.VideoURL, &item.Order); err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("get lesson: %w", err)
	}
	return item, nil
}

func (r *CourseRepo) GetLessonCount(ctx context.Context, courseID int64) (int32, error) {
	query := `SELECT COUNT(*) FROM lessons WHERE course_id = $1`
	var count int32
	if err := r.db.QueryRow(ctx, query, courseID).Scan(&count); err != nil {
		return 0, fmt.Errorf("get lesson count: %w", err)
	}
	return count, nil
}

func (r *CourseRepo) GetProgress(ctx context.Context, userID int64, courseID int64) (*course.CourseProgress, error) {
	query := `
		SELECT id, course_id, user_id, completed_lessons, quiz_passed, quiz_score, quiz_attempts, xp_earned, started_at, completed_at
		FROM course_progress
		WHERE user_id = $1 AND course_id = $2
	`
	item := &course.CourseProgress{}
	var completedBytes []byte
	if err := r.db.QueryRow(ctx, query, userID, courseID).
		Scan(&item.ID, &item.CourseID, &item.UserID, &completedBytes, &item.QuizPassed, &item.QuizScore, &item.QuizAttempts, &item.XPEarned, &item.StartedAt, &item.CompletedAt); err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("get progress: %w", err)
	}
	if len(completedBytes) > 0 {
		var completed []int64
		if err := json.Unmarshal(completedBytes, &completed); err != nil {
			return nil, fmt.Errorf("get progress completed: %w", err)
		}
		item.CompletedLessons = completed
	} else {
		item.CompletedLessons = []int64{}
	}
	return item, nil
}

func (r *CourseRepo) UpsertProgress(ctx context.Context, progress *course.CourseProgress) (*course.CourseProgress, error) {
	completedBytes, err := json.Marshal(progress.CompletedLessons)
	if err != nil {
		return nil, fmt.Errorf("marshal completed lessons: %w", err)
	}

	query := `
		INSERT INTO course_progress (
			user_id, course_id, completed_lessons, quiz_passed, quiz_score, quiz_attempts, xp_earned, started_at, completed_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		ON CONFLICT (user_id, course_id) DO UPDATE SET
			completed_lessons = EXCLUDED.completed_lessons,
			quiz_passed = EXCLUDED.quiz_passed,
			quiz_score = EXCLUDED.quiz_score,
			quiz_attempts = EXCLUDED.quiz_attempts,
			xp_earned = EXCLUDED.xp_earned,
			started_at = COALESCE(course_progress.started_at, EXCLUDED.started_at),
			completed_at = EXCLUDED.completed_at
		RETURNING id, started_at, completed_at
	`

	updated := &course.CourseProgress{}
	if err := r.db.QueryRow(ctx, query,
		progress.UserID,
		progress.CourseID,
		completedBytes,
		progress.QuizPassed,
		progress.QuizScore,
		progress.QuizAttempts,
		progress.XPEarned,
		progress.StartedAt,
		progress.CompletedAt,
	).Scan(&updated.ID, &updated.StartedAt, &updated.CompletedAt); err != nil {
		return nil, fmt.Errorf("upsert progress: %w", err)
	}

	updated.CourseID = progress.CourseID
	updated.UserID = progress.UserID
	updated.CompletedLessons = progress.CompletedLessons
	updated.QuizPassed = progress.QuizPassed
	updated.QuizScore = progress.QuizScore
	updated.QuizAttempts = progress.QuizAttempts
	updated.XPEarned = progress.XPEarned
	return updated, nil
}

func (r *CourseRepo) ListProgress(ctx context.Context, userID int64) ([]*course.CourseProgress, error) {
	query := `
		SELECT id, course_id, user_id, completed_lessons, quiz_passed, quiz_score, quiz_attempts, xp_earned, started_at, completed_at
		FROM course_progress
		WHERE user_id = $1
		ORDER BY started_at DESC
	`
	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("list progress: %w", err)
	}
	defer rows.Close()

	items := make([]*course.CourseProgress, 0)
	for rows.Next() {
		item := &course.CourseProgress{}
		var completedBytes []byte
		if err := rows.Scan(
			&item.ID,
			&item.CourseID,
			&item.UserID,
			&completedBytes,
			&item.QuizPassed,
			&item.QuizScore,
			&item.QuizAttempts,
			&item.XPEarned,
			&item.StartedAt,
			&item.CompletedAt,
		); err != nil {
			return nil, fmt.Errorf("list progress scan: %w", err)
		}
		if len(completedBytes) > 0 {
			var completed []int64
			if err := json.Unmarshal(completedBytes, &completed); err != nil {
				return nil, fmt.Errorf("list progress completed: %w", err)
			}
			item.CompletedLessons = completed
		} else {
			item.CompletedLessons = []int64{}
		}
		items = append(items, item)
	}
	if rows.Err() != nil {
		return nil, fmt.Errorf("list progress rows: %w", rows.Err())
	}
	return items, nil
}

func (r *CourseRepo) ListCompletedCourses(ctx context.Context, userID int64) ([]*course.Course, error) {
	query := `
		SELECT c.id, c.title, c.description, c.cover_url, c.specializations, c.duration_minutes, c.is_free, c."order", c.status, c.xp_reward, c.created_at, c.updated_at
		FROM courses c
		JOIN course_progress cp ON cp.course_id = c.id
		WHERE cp.user_id = $1 AND cp.completed_at IS NOT NULL
		ORDER BY cp.completed_at DESC
	`
	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("list completed courses: %w", err)
	}
	defer rows.Close()

	items := make([]*course.Course, 0)
	for rows.Next() {
		item := &course.Course{}
		var dbStatus string
		var specBytes []byte
		if err := rows.Scan(
			&item.ID,
			&item.Title,
			&item.Description,
			&item.CoverURL,
			&specBytes,
			&item.DurationMinutes,
			&item.IsFree,
			&item.Order,
			&dbStatus,
			&item.XPReward,
			&item.CreatedAt,
			&item.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("list completed courses scan: %w", err)
		}
		item.Status = course.CourseStatus(fromDBCourseStatus(dbStatus))
		if len(specBytes) > 0 {
			var specs []string
			if err := json.Unmarshal(specBytes, &specs); err != nil {
				return nil, fmt.Errorf("list completed specs: %w", err)
			}
			item.Specializations = specs
		} else {
			item.Specializations = []string{}
		}
		item.Lessons = []*course.Lesson{}
		items = append(items, item)
	}
	if rows.Err() != nil {
		return nil, fmt.Errorf("list completed courses rows: %w", rows.Err())
	}
	return items, nil
}

func (r *CourseRepo) ListQuizQuestions(ctx context.Context, courseID int64) ([]*course.QuizQuestion, error) {
	query := `
		SELECT id, course_id, question, options, correct_index, explanation, "order"
		FROM course_quiz_questions
		WHERE course_id = $1
		ORDER BY "order" ASC, id ASC
	`
	rows, err := r.db.Query(ctx, query, courseID)
	if err != nil {
		return nil, fmt.Errorf("list quiz questions: %w", err)
	}
	defer rows.Close()

	items := make([]*course.QuizQuestion, 0)
	for rows.Next() {
		item := &course.QuizQuestion{}
		var optionsBytes []byte
		if err := rows.Scan(&item.ID, &item.CourseID, &item.Question, &optionsBytes, &item.CorrectIndex, &item.Explanation, &item.Order); err != nil {
			return nil, fmt.Errorf("list quiz questions scan: %w", err)
		}
		if len(optionsBytes) > 0 {
			var options []string
			if err := json.Unmarshal(optionsBytes, &options); err != nil {
				return nil, fmt.Errorf("list quiz options: %w", err)
			}
			item.Options = options
		} else {
			item.Options = []string{}
		}
		items = append(items, item)
	}
	if rows.Err() != nil {
		return nil, fmt.Errorf("list quiz questions rows: %w", rows.Err())
	}
	return items, nil
}

func (r *CourseRepo) SumUserXP(ctx context.Context, userID int64) (int32, error) {
	query := `SELECT COALESCE(SUM(xp_earned), 0)::int FROM course_progress WHERE user_id = $1`
	var total int32
	if err := r.db.QueryRow(ctx, query, userID).Scan(&total); err != nil {
		return 0, fmt.Errorf("sum user xp: %w", err)
	}
	return total, nil
}

func (r *CourseRepo) CreateQuizAttempt(ctx context.Context, attempt *course.QuizAttempt) error {
	answersBytes, err := json.Marshal(attempt.Answers)
	if err != nil {
		return fmt.Errorf("marshal quiz answers: %w", err)
	}

	query := `
		INSERT INTO course_quiz_attempts (course_id, user_id, answers, score, total, passed, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, NOW())
		RETURNING id, created_at
	`
	if err := r.db.QueryRow(ctx, query, attempt.CourseID, attempt.UserID, answersBytes, attempt.Score, attempt.Total, attempt.Passed).
		Scan(&attempt.ID, &attempt.CreatedAt); err != nil {
		return fmt.Errorf("create quiz attempt: %w", err)
	}
	return nil
}

func toDBCourseStatus(value string) string {
	switch value {
	case string(course.CourseStatusDraft):
		return "DRAFT"
	case string(course.CourseStatusArchived):
		return "ARCHIVED"
	case string(course.CourseStatusPublished):
		return "PUBLISHED"
	default:
		return "DRAFT"
	}
}

func fromDBCourseStatus(value string) string {
	switch value {
	case "DRAFT":
		return string(course.CourseStatusDraft)
	case "ARCHIVED":
		return string(course.CourseStatusArchived)
	case "PUBLISHED":
		return string(course.CourseStatusPublished)
	default:
		return string(course.CourseStatusDraft)
	}
}
