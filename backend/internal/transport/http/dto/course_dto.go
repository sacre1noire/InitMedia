package dto

import "time"

// SubmitQuizRequest is payload for quiz submission.
type SubmitQuizRequest struct {
	Answers []int32 `json:"answers" binding:"required"`
}

// SubmitQuizResponse describes quiz result.
type SubmitQuizResponse struct {
	Score    int32                   `json:"score"`
	Total    int32                   `json:"total"`
	Passed   bool                    `json:"passed"`
	Progress *CourseProgressResponse `json:"progress,omitempty"`
}

// CourseProgressResponse is a view of user progress.
type CourseProgressResponse struct {
	ID               int64      `json:"id"`
	CourseID         int64      `json:"course_id"`
	UserID           int64      `json:"user_id"`
	CompletedLessons []int64    `json:"completed_lessons"`
	QuizPassed       bool       `json:"quiz_passed"`
	QuizScore        int32      `json:"quiz_score"`
	QuizAttempts     int32      `json:"quiz_attempts"`
	XPEarned         int32      `json:"xp_earned"`
	StartedAt        time.Time  `json:"started_at"`
	CompletedAt      *time.Time `json:"completed_at,omitempty"`
}
