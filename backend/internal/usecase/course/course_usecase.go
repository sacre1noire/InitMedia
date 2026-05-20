package courseusecase

import (
	"context"
	"errors"
	"time"

	"backend/internal/domain/course"
	"backend/internal/domain/user"
	"backend/internal/pkg/gamification"
)

var (
	ErrCourseNotFound     = errors.New("course not found")
	ErrLessonNotFound     = errors.New("lesson not found")
	ErrInvalidQuizInput   = errors.New("invalid quiz payload")
	ErrUserForbidden      = errors.New("user is not allowed")
	ErrCourseNotPublished = errors.New("course not published")
)

const quizPassThreshold = 0.7

type UseCase struct {
	repo     course.Repository
	userRepo user.Repository
}

func NewUseCase(repo course.Repository, userRepo user.Repository) *UseCase {
	return &UseCase{repo: repo, userRepo: userRepo}
}

func (u *UseCase) ListCourses(ctx context.Context) ([]*course.Course, error) {
	status := course.CourseStatusPublished
	items, err := u.repo.ListCourses(ctx, &status)
	if err != nil {
		return nil, err
	}
	for _, item := range items {
		if item.Lessons == nil {
			item.Lessons = []*course.Lesson{}
		}
	}
	return items, nil
}

func (u *UseCase) GetCourse(ctx context.Context, id int64) (*course.Course, error) {
	item, err := u.repo.GetCourseByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if item == nil {
		return nil, ErrCourseNotFound
	}

	lessons, err := u.repo.ListLessonsByCourse(ctx, id)
	if err != nil {
		return nil, err
	}
	item.Lessons = lessons
	return item, nil
}

func (u *UseCase) GetLesson(ctx context.Context, courseID int64, lessonID int64) (*course.Lesson, error) {
	lesson, err := u.repo.GetLessonByID(ctx, courseID, lessonID)
	if err != nil {
		return nil, err
	}
	if lesson == nil {
		return nil, ErrLessonNotFound
	}
	return lesson, nil
}

func (u *UseCase) StartCourse(ctx context.Context, userID int64, courseID int64) (*course.CourseProgress, error) {
	usr, err := u.userRepo.FindByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if usr == nil || !usr.IsActive {
		return nil, ErrUserForbidden
	}

	item, err := u.repo.GetCourseByID(ctx, courseID)
	if err != nil {
		return nil, err
	}
	if item == nil {
		return nil, ErrCourseNotFound
	}

	progress, err := u.repo.GetProgress(ctx, userID, courseID)
	if err != nil {
		return nil, err
	}
	if progress == nil {
		progress = &course.CourseProgress{
			UserID:           userID,
			CourseID:         courseID,
			CompletedLessons: []int64{},
			QuizPassed:       false,
			QuizScore:        0,
			QuizAttempts:     0,
			XPEarned:         0,
			StartedAt:        time.Now(),
		}
	}

	return u.repo.UpsertProgress(ctx, progress)
}

func (u *UseCase) CompleteLesson(ctx context.Context, userID int64, courseID int64, lessonID int64) (*course.CourseProgress, error) {
	usr, err := u.userRepo.FindByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if usr == nil || !usr.IsActive {
		return nil, ErrUserForbidden
	}

	lesson, err := u.repo.GetLessonByID(ctx, courseID, lessonID)
	if err != nil {
		return nil, err
	}
	if lesson == nil {
		return nil, ErrLessonNotFound
	}

	progress, err := u.repo.GetProgress(ctx, userID, courseID)
	if err != nil {
		return nil, err
	}
	if progress == nil {
		progress = &course.CourseProgress{
			UserID:           userID,
			CourseID:         courseID,
			CompletedLessons: []int64{},
			QuizPassed:       false,
			QuizScore:        0,
			QuizAttempts:     0,
			XPEarned:         0,
			StartedAt:        time.Now(),
		}
	}

	if !containsLesson(progress.CompletedLessons, lessonID) {
		progress.CompletedLessons = append(progress.CompletedLessons, lessonID)
	}

	lessonCount, err := u.repo.GetLessonCount(ctx, courseID)
	if err != nil {
		return nil, err
	}
	if progress.QuizPassed && int32(len(progress.CompletedLessons)) >= lessonCount {
		now := time.Now()
		progress.CompletedAt = &now
	}

	return u.repo.UpsertProgress(ctx, progress)
}

func (u *UseCase) SubmitQuiz(ctx context.Context, userID int64, courseID int64, answers []int32) (*course.QuizAttempt, *course.CourseProgress, error) {
	usr, err := u.userRepo.FindByID(ctx, userID)
	if err != nil {
		return nil, nil, err
	}
	if usr == nil || !usr.IsActive {
		return nil, nil, ErrUserForbidden
	}

	item, err := u.repo.GetCourseByID(ctx, courseID)
	if err != nil {
		return nil, nil, err
	}
	if item == nil {
		return nil, nil, ErrCourseNotFound
	}

	questions, err := u.repo.ListQuizQuestions(ctx, courseID)
	if err != nil {
		return nil, nil, err
	}
	if len(questions) == 0 {
		return nil, nil, ErrInvalidQuizInput
	}
	if len(answers) != len(questions) {
		return nil, nil, ErrInvalidQuizInput
	}

	score := int32(0)
	for idx, q := range questions {
		ans := answers[idx]
		if ans < 0 || int(ans) >= len(q.Options) {
			return nil, nil, ErrInvalidQuizInput
		}
		if ans == q.CorrectIndex {
			score++
		}
	}
	passed := float64(score)/float64(len(questions)) >= quizPassThreshold

	attempt := &course.QuizAttempt{
		CourseID: courseID,
		UserID:   userID,
		Answers:  answers,
		Score:    score,
		Total:    int32(len(questions)),
		Passed:   passed,
	}
	if err := u.repo.CreateQuizAttempt(ctx, attempt); err != nil {
		return nil, nil, err
	}

	progress, err := u.repo.GetProgress(ctx, userID, courseID)
	if err != nil {
		return attempt, nil, err
	}
	if progress == nil {
		progress = &course.CourseProgress{
			UserID:           userID,
			CourseID:         courseID,
			CompletedLessons: []int64{},
			QuizPassed:       false,
			QuizScore:        0,
			QuizAttempts:     0,
			XPEarned:         0,
			StartedAt:        time.Now(),
		}
	}

	progress.QuizAttempts++
	progress.QuizScore = score
	if passed && !progress.QuizPassed {
		progress.QuizPassed = true
		progress.XPEarned += item.XPReward
	}

	lessonCount, err := u.repo.GetLessonCount(ctx, courseID)
	if err != nil {
		return attempt, nil, err
	}
	if progress.QuizPassed && int32(len(progress.CompletedLessons)) >= lessonCount {
		now := time.Now()
		progress.CompletedAt = &now
	}

	updated, err := u.repo.UpsertProgress(ctx, progress)
	if err != nil {
		return attempt, nil, err
	}

	return attempt, updated, nil
}

func (u *UseCase) ListMyProgress(ctx context.Context, userID int64) ([]*course.CourseProgress, error) {
	usr, err := u.userRepo.FindByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if usr == nil || !usr.IsActive {
		return nil, ErrUserForbidden
	}
	return u.repo.ListProgress(ctx, userID)
}

func (u *UseCase) ListQuizQuestions(ctx context.Context, courseID int64) ([]*course.QuizQuestion, error) {
	item, err := u.repo.GetCourseByID(ctx, courseID)
	if err != nil {
		return nil, err
	}
	if item == nil {
		return nil, ErrCourseNotFound
	}
	return u.repo.ListQuizQuestions(ctx, courseID)
}

func (u *UseCase) GetUserGamification(ctx context.Context, userID int64) (gamification.Stats, error) {
	usr, err := u.userRepo.FindByID(ctx, userID)
	if err != nil {
		return gamification.Stats{}, err
	}
	if usr == nil {
		return gamification.Stats{}, ErrUserForbidden
	}

	totalXP, err := u.repo.SumUserXP(ctx, userID)
	if err != nil {
		return gamification.Stats{}, err
	}
	return gamification.FromTotalXP(totalXP), nil
}

func (u *UseCase) ListCompletedCourses(ctx context.Context, userID int64) ([]*course.Course, error) {
	usr, err := u.userRepo.FindByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if usr == nil || !usr.IsActive {
		return nil, ErrUserForbidden
	}
	return u.repo.ListCompletedCourses(ctx, userID)
}

func containsLesson(items []int64, lessonID int64) bool {
	for _, item := range items {
		if item == lessonID {
			return true
		}
	}
	return false
}

func (u *UseCase) EnsureCourseReadable(ctx context.Context, courseID int64) error {
	item, err := u.repo.GetCourseByID(ctx, courseID)
	if err != nil {
		return err
	}
	if item == nil {
		return ErrCourseNotFound
	}
	if item.Status != course.CourseStatusPublished {
		return ErrCourseNotPublished
	}
	return nil
}
