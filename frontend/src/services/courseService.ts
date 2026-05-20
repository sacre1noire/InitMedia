import api from "./api";
import {
  Course,
  CourseProgress,
  Lesson,
  QuizQuestion,
  SubmitQuizResult,
} from "../types/course";

export const getCourses = async () => {
  const response = await api.get<Course[]>("/api/courses");
  return response.data;
};

export const getCourse = async (id: number) => {
  const response = await api.get<Course>(`/api/courses/${id}`);
  return response.data;
};

export const getLesson = async (courseId: number, lessonId: number) => {
  const response = await api.get<Lesson>(
    `/api/courses/${courseId}/lessons/${lessonId}`,
  );
  return response.data;
};

export const getMyProgress = async () => {
  const response = await api.get<CourseProgress[]>("/api/courses/my-progress");
  return response.data;
};

export const getCompletedCourses = async () => {
  const response = await api.get<Course[]>("/api/courses/completed");
  return response.data;
};

export const getCourseQuiz = async (courseId: number) => {
  const response = await api.get<QuizQuestion[]>(
    `/api/courses/${courseId}/quiz`,
  );
  return response.data;
};

export const startCourse = async (id: number) => {
  const response = await api.post<CourseProgress>(`/api/courses/${id}/start`);
  return response.data;
};

export const completeLesson = async (courseId: number, lessonId: number) => {
  const response = await api.post<CourseProgress>(
    `/api/courses/${courseId}/lessons/${lessonId}/complete`,
  );
  return response.data;
};

export const submitQuiz = async (courseId: number, answers: number[]) => {
  const response = await api.post<SubmitQuizResult>(
    `/api/courses/${courseId}/quiz/submit`,
    { answers },
  );
  return response.data;
};
