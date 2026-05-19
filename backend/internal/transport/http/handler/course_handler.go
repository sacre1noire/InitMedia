package handler

import (
	"net/http"
	"strconv"

	"backend/internal/domain/course"
	"backend/internal/transport/http/dto"
	"backend/internal/transport/http/middleware"
	courseusecase "backend/internal/usecase/course"

	"github.com/gin-gonic/gin"
)

type CourseHandler struct {
	uc *courseusecase.UseCase
}

func NewCourseHandler(uc *courseusecase.UseCase) *CourseHandler {
	return &CourseHandler{uc: uc}
}

// ListCourses godoc
// @Summary      List courses
// @Description  Returns published courses
// @Tags         courses
// @Produce      json
// @Success      200  {array}  course.Course
// @Failure      500  {object}  map[string]string
// @Router       /api/courses [get]
func (h *CourseHandler) ListCourses(c *gin.Context) {
	items, err := h.uc.ListCourses(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}

	c.JSON(http.StatusOK, items)
}

// GetCourse godoc
// @Summary      Get course by id
// @Tags         courses
// @Produce      json
// @Param        id path int true "Course ID"
// @Success      200  {object}  course.Course
// @Failure      400  {object}  map[string]string
// @Failure      404  {object}  map[string]string
// @Failure      500  {object}  map[string]string
// @Router       /api/courses/{id} [get]
func (h *CourseHandler) GetCourse(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id must be a valid integer"})
		return
	}

	item, err := h.uc.GetCourse(c.Request.Context(), id)
	if err != nil {
		switch err {
		case courseusecase.ErrCourseNotFound:
			c.JSON(http.StatusNotFound, gin.H{"error": "Course not found"})
			return
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
			return
		}
	}
	if item.Status != course.CourseStatusPublished {
		c.JSON(http.StatusNotFound, gin.H{"error": "Course not found"})
		return
	}

	c.JSON(http.StatusOK, item)
}

// GetLesson godoc
// @Summary      Get lesson by id
// @Tags         courses
// @Produce      json
// @Param        id path int true "Course ID"
// @Param        lesson_id path int true "Lesson ID"
// @Success      200  {object}  course.Lesson
// @Failure      400  {object}  map[string]string
// @Failure      404  {object}  map[string]string
// @Failure      500  {object}  map[string]string
// @Router       /api/courses/{id}/lessons/{lesson_id} [get]
func (h *CourseHandler) GetLesson(c *gin.Context) {
	courseID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id must be a valid integer"})
		return
	}
	lessonID, err := strconv.ParseInt(c.Param("lesson_id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "lesson_id must be a valid integer"})
		return
	}

	item, err := h.uc.GetCourse(c.Request.Context(), courseID)
	if err != nil {
		if err == courseusecase.ErrCourseNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Course not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}
	if item.Status != course.CourseStatusPublished {
		c.JSON(http.StatusNotFound, gin.H{"error": "Course not found"})
		return
	}

	lesson, err := h.uc.GetLesson(c.Request.Context(), courseID, lessonID)
	if err != nil {
		switch err {
		case courseusecase.ErrLessonNotFound:
			c.JSON(http.StatusNotFound, gin.H{"error": "Lesson not found"})
			return
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
			return
		}
	}

	c.JSON(http.StatusOK, lesson)
}

// StartCourse godoc
// @Summary      Start course
// @Tags         courses
// @Produce      json
// @Param        id path int true "Course ID"
// @Success      200  {object}  dto.CourseProgressResponse
// @Failure      400  {object}  map[string]string
// @Failure      401  {object}  map[string]string
// @Failure      403  {object}  map[string]string
// @Failure      404  {object}  map[string]string
// @Failure      500  {object}  map[string]string
// @Router       /api/courses/{id}/start [post]
func (h *CourseHandler) StartCourse(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	courseID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id must be a valid integer"})
		return
	}

	progress, err := h.uc.StartCourse(c.Request.Context(), userID, courseID)
	if err != nil {
		switch err {
		case courseusecase.ErrCourseNotFound:
			c.JSON(http.StatusNotFound, gin.H{"error": "Course not found"})
			return
		case courseusecase.ErrUserForbidden:
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
			return
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
			return
		}
	}

	c.JSON(http.StatusOK, toProgressResponse(progress))
}

// CompleteLesson godoc
// @Summary      Complete lesson
// @Tags         courses
// @Produce      json
// @Param        id path int true "Course ID"
// @Param        lesson_id path int true "Lesson ID"
// @Success      200  {object}  dto.CourseProgressResponse
// @Failure      400  {object}  map[string]string
// @Failure      401  {object}  map[string]string
// @Failure      403  {object}  map[string]string
// @Failure      404  {object}  map[string]string
// @Failure      500  {object}  map[string]string
// @Router       /api/courses/{id}/lessons/{lesson_id}/complete [post]
func (h *CourseHandler) CompleteLesson(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	courseID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id must be a valid integer"})
		return
	}
	lessonID, err := strconv.ParseInt(c.Param("lesson_id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "lesson_id must be a valid integer"})
		return
	}

	progress, err := h.uc.CompleteLesson(c.Request.Context(), userID, courseID, lessonID)
	if err != nil {
		switch err {
		case courseusecase.ErrCourseNotFound:
			c.JSON(http.StatusNotFound, gin.H{"error": "Course not found"})
			return
		case courseusecase.ErrLessonNotFound:
			c.JSON(http.StatusNotFound, gin.H{"error": "Lesson not found"})
			return
		case courseusecase.ErrUserForbidden:
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
			return
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
			return
		}
	}

	c.JSON(http.StatusOK, toProgressResponse(progress))
}

// SubmitQuiz godoc
// @Summary      Submit quiz answers
// @Tags         courses
// @Accept       json
// @Produce      json
// @Param        id path int true "Course ID"
// @Param        request body dto.SubmitQuizRequest true "Quiz answers"
// @Success      200  {object}  dto.SubmitQuizResponse
// @Failure      400  {object}  map[string]string
// @Failure      401  {object}  map[string]string
// @Failure      403  {object}  map[string]string
// @Failure      404  {object}  map[string]string
// @Failure      500  {object}  map[string]string
// @Router       /api/courses/{id}/quiz/submit [post]
func (h *CourseHandler) SubmitQuiz(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	courseID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id must be a valid integer"})
		return
	}

	var req dto.SubmitQuizRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request fields", "details": err.Error()})
		return
	}

	attempt, progress, err := h.uc.SubmitQuiz(c.Request.Context(), userID, courseID, req.Answers)
	if err != nil {
		switch err {
		case courseusecase.ErrCourseNotFound:
			c.JSON(http.StatusNotFound, gin.H{"error": "Course not found"})
			return
		case courseusecase.ErrInvalidQuizInput:
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid quiz payload"})
			return
		case courseusecase.ErrUserForbidden:
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
			return
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
			return
		}
	}

	resp := dto.SubmitQuizResponse{
		Score:  attempt.Score,
		Total:  attempt.Total,
		Passed: attempt.Passed,
	}
	if progress != nil {
		p := toProgressResponse(progress)
		resp.Progress = &p
	}

	c.JSON(http.StatusOK, resp)
}

// ListMyProgress godoc
// @Summary      List my course progress
// @Tags         courses
// @Produce      json
// @Success      200  {array}  dto.CourseProgressResponse
// @Failure      401  {object}  map[string]string
// @Failure      403  {object}  map[string]string
// @Failure      500  {object}  map[string]string
// @Router       /api/courses/my-progress [get]
func (h *CourseHandler) ListMyProgress(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	items, err := h.uc.ListMyProgress(c.Request.Context(), userID)
	if err != nil {
		switch err {
		case courseusecase.ErrUserForbidden:
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
			return
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
			return
		}
	}

	resp := make([]dto.CourseProgressResponse, 0, len(items))
	for _, item := range items {
		p := toProgressResponse(item)
		resp = append(resp, p)
	}

	c.JSON(http.StatusOK, resp)
}

// ListCompletedCourses godoc
// @Summary      List completed courses
// @Tags         courses
// @Produce      json
// @Success      200  {array}  course.Course
// @Failure      401  {object}  map[string]string
// @Failure      403  {object}  map[string]string
// @Failure      500  {object}  map[string]string
// @Router       /api/courses/completed [get]
func (h *CourseHandler) ListCompletedCourses(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	items, err := h.uc.ListCompletedCourses(c.Request.Context(), userID)
	if err != nil {
		switch err {
		case courseusecase.ErrUserForbidden:
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
			return
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
			return
		}
	}

	c.JSON(http.StatusOK, items)
}

func toProgressResponse(item *course.CourseProgress) dto.CourseProgressResponse {
	return dto.CourseProgressResponse{
		ID:               item.ID,
		CourseID:         item.CourseID,
		UserID:           item.UserID,
		CompletedLessons: item.CompletedLessons,
		QuizPassed:       item.QuizPassed,
		QuizScore:        item.QuizScore,
		QuizAttempts:     item.QuizAttempts,
		XPEarned:         item.XPEarned,
		StartedAt:        item.StartedAt,
		CompletedAt:      item.CompletedAt,
	}
}
