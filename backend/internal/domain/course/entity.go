package course

import (
	"context"
	"time"
)

// CourseStatus describes course publish state.
type CourseStatus string

const (
	CourseStatusDraft     CourseStatus = "draft"
	CourseStatusPublished CourseStatus = "published"
	CourseStatusArchived  CourseStatus = "archived"
)

// Course is a domain entity for skill tracks.
type Course struct {
	ID              int64        `json:"id" db:"id"`
	Title           string       `json:"title" db:"title"`
	Description     string       `json:"description" db:"description"`
	CoverURL        *string      `json:"cover_url,omitempty" db:"cover_url"`
	Specializations []string     `json:"specializations,omitempty" db:"specializations"`
	DurationMinutes int32        `json:"duration_minutes" db:"duration_minutes"`
	IsFree          bool         `json:"is_free" db:"is_free"`
	Order           int32        `json:"order" db:"order"`
	Status          CourseStatus `json:"status" db:"status"`
	XPReward        int32        `json:"xp_reward" db:"xp_reward"`
	Lessons         []*Lesson    `json:"lessons" db:"-"`
	CreatedAt       time.Time    `json:"created_at" db:"created_at"`
	UpdatedAt       *time.Time   `json:"updated_at,omitempty" db:"updated_at"`
}

// Lesson describes a course lesson.
type Lesson struct {
	ID       int64   `json:"id" db:"id"`
	CourseID int64   `json:"course_id" db:"course_id"`
	Title    string  `json:"title" db:"title"`
	Content  string  `json:"content" db:"content"`
	VideoURL *string `json:"video_url,omitempty" db:"video_url"`
	Order    int32   `json:"order" db:"order"`
}

// CourseProgress stores user progress.
type CourseProgress struct {
	ID               int64      `json:"id" db:"id"`
	CourseID         int64      `json:"course_id" db:"course_id"`
	UserID           int64      `json:"user_id" db:"user_id"`
	CompletedLessons []int64    `json:"completed_lessons" db:"completed_lessons"`
	QuizPassed       bool       `json:"quiz_passed" db:"quiz_passed"`
	QuizScore        int32      `json:"quiz_score" db:"quiz_score"`
	QuizAttempts     int32      `json:"quiz_attempts" db:"quiz_attempts"`
	XPEarned         int32      `json:"xp_earned" db:"xp_earned"`
	StartedAt        time.Time  `json:"started_at" db:"started_at"`
	CompletedAt      *time.Time `json:"completed_at,omitempty" db:"completed_at"`
}

// QuizQuestion describes a course quiz question.
type QuizQuestion struct {
	ID           int64    `json:"id" db:"id"`
	CourseID     int64    `json:"course_id" db:"course_id"`
	Question     string   `json:"question" db:"question"`
	Options      []string `json:"options" db:"options"`
	CorrectIndex int32    `json:"correct_index" db:"correct_index"`
	Explanation  *string  `json:"explanation,omitempty" db:"explanation"`
	Order        int32    `json:"order" db:"order"`
}

// QuizAttempt stores quiz attempt results.
type QuizAttempt struct {
	ID        int64     `json:"id" db:"id"`
	CourseID  int64     `json:"course_id" db:"course_id"`
	UserID    int64     `json:"user_id" db:"user_id"`
	Answers   []int32   `json:"answers" db:"answers"`
	Score     int32     `json:"score" db:"score"`
	Total     int32     `json:"total" db:"total"`
	Passed    bool      `json:"passed" db:"passed"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

// Repository defines course persistence operations.
type Repository interface {
	ListCourses(ctx context.Context, status *CourseStatus) ([]*Course, error)
	GetCourseByID(ctx context.Context, id int64) (*Course, error)
	ListLessonsByCourse(ctx context.Context, courseID int64) ([]*Lesson, error)
	GetLessonByID(ctx context.Context, courseID int64, lessonID int64) (*Lesson, error)
	GetLessonCount(ctx context.Context, courseID int64) (int32, error)
	GetProgress(ctx context.Context, userID int64, courseID int64) (*CourseProgress, error)
	UpsertProgress(ctx context.Context, progress *CourseProgress) (*CourseProgress, error)
	ListProgress(ctx context.Context, userID int64) ([]*CourseProgress, error)
	ListCompletedCourses(ctx context.Context, userID int64) ([]*Course, error)
	ListQuizQuestions(ctx context.Context, courseID int64) ([]*QuizQuestion, error)
	CreateQuizAttempt(ctx context.Context, attempt *QuizAttempt) error
}
