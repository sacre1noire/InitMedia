import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import {
  getCourse,
  getMyProgress,
  startCourse,
} from "@/services/courseService";
import { Course, CourseProgress } from "@/types/course";
import { useAuth } from "@/contexts/AuthContext";
import { CheckCircle, Loader2, Trophy } from "lucide-react";

const CourseDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      try {
        const courseData = await getCourse(Number(id));
        setCourse(courseData);
        if (user) {
          const allProgress = await getMyProgress();
          const courseProgress = allProgress.find(
            (p) => p.course_id === Number(id),
          );
          setProgress(courseProgress ?? null);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, user]);

  const lessonProgress = useMemo(() => {
    if (!course || !progress) return 0;
    return Math.round(
      (progress.completed_lessons.length / Math.max(course.lessons.length, 1)) *
        100,
    );
  }, [course, progress]);

  const allLessonsDone = useMemo(() => {
    if (!course || !progress) return false;
    return progress.completed_lessons.length >= course.lessons.length;
  }, [course, progress]);

  const handleStart = async () => {
    if (!id || !course) return;
    setStarting(true);
    try {
      const p = await startCourse(Number(id));
      setProgress(p);
      if (course.lessons.length > 0) {
        navigate(`/courses/${id}/lessons/${course.lessons[0].id}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setStarting(false);
    }
  };

  const continueLearning = () => {
    if (!course || !id) return;
    const next = course.lessons.find(
      (l) => !progress?.completed_lessons.includes(l.id),
    );
    if (next) {
      navigate(`/courses/${id}/lessons/${next.id}`);
    } else if (allLessonsDone && !progress?.quiz_passed) {
      navigate(`/courses/${id}/quiz`);
    }
  };

  if (loading)
    return (
      <Layout>
        <div className="flex justify-center p-12">
          <Loader2 className="animate-spin" />
        </div>
      </Layout>
    );
  if (!course)
    return (
      <Layout>
        <div className="text-center p-12">Курс не найден</div>
      </Layout>
    );

  return (
    <Layout>
      <div className="max-w-5xl mx-auto py-4 sm:py-8 md:py-10">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="relative h-44 sm:h-56 md:h-64 bg-gray-900">
            {course.cover_url && (
              <img
                src={course.cover_url}
                alt={course.title}
                className="w-full h-full object-cover opacity-60"
              />
            )}
            <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-6 md:p-8 text-white">
              <span className="bg-primary-600 w-fit px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium mb-2 sm:mb-3">
                {course.specializations?.[0] || "Media"}
              </span>
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-2 leading-tight">{course.title}</h1>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-gray-200 text-xs sm:text-sm">
                <span>
                  {Math.floor(course.duration_minutes / 60)}ч{" "}
                  {course.duration_minutes % 60}м
                </span>
                <span>{course.lessons.length} уроков</span>
                {course.xp_reward ? (
                  <span className="inline-flex items-center gap-1 text-amber-300">
                    <Trophy className="h-4 w-4" />+{course.xp_reward} XP
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 md:p-8">
            {progress && (
              <div className="mb-8 rounded-xl border border-primary-100 bg-primary-50/50 p-5">
                <div className="flex justify-between text-sm text-primary-800 mb-2">
                  <span>Прогресс уроков</span>
                  <span>{lessonProgress}%</span>
                </div>
                <div className="h-2 rounded-full bg-primary-100 overflow-hidden">
                  <div
                    className="h-full bg-primary-600 transition-all"
                    style={{ width: `${lessonProgress}%` }}
                  />
                </div>
                {progress.quiz_passed && (
                  <p className="mt-2 text-sm text-green-700 flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    Тест пройден · +{progress.xp_earned} XP
                  </p>
                )}
                {progress.completed_at && (
                  <p className="mt-1 text-sm text-green-700 font-medium">
                    Курс завершён
                  </p>
                )}
              </div>
            )}

            <div className="course-prose text-gray-600 mb-6 sm:mb-8">
              {course.description}
            </div>

            <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">
                Программа курса
              </h3>
              <div className="space-y-3">
                {course.lessons.map((lesson, index) => {
                  const done = progress?.completed_lessons.includes(lesson.id);
                  return (
                    <Link
                      key={lesson.id}
                      to={`/courses/${id}/lessons/${lesson.id}`}
                      className="flex items-center bg-white p-3 sm:p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-sm transition text-sm sm:text-base"
                    >
                      <div
                        className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full font-medium mr-4 ${
                          done
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {done ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          index + 1
                        )}
                      </div>
                      <div className="flex-1 font-medium text-gray-800 min-w-0 line-clamp-2">
                        {lesson.title}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row sm:flex-wrap sm:justify-end gap-2 sm:gap-3">
              {user ? (
                progress ? (
                  <>
                    <button
                      onClick={continueLearning}
                      className="w-full sm:w-auto text-center bg-primary-600 text-white px-5 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl font-bold hover:bg-primary-700 transition"
                    >
                      {progress.completed_at
                        ? "Повторить курс"
                        : allLessonsDone && !progress.quiz_passed
                          ? "Пройти финальный тест"
                          : "Продолжить обучение"}
                    </button>
                    {allLessonsDone && (
                      <Link
                        to={`/courses/${id}/quiz`}
                        className="w-full sm:w-auto text-center px-5 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl font-bold border border-primary-300 text-primary-700 hover:bg-primary-50"
                      >
                        {progress.quiz_passed ? "Пересдать тест" : "К тесту"}
                      </Link>
                    )}
                  </>
                ) : (
                  <button
                    onClick={handleStart}
                    disabled={starting}
                    className="bg-primary-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-primary-700 transition disabled:opacity-50"
                  >
                    {starting ? "Загрузка..." : "Начать обучение"}
                  </button>
                )
              ) : (
                <Link
                  to="/login"
                  className="text-primary-600 font-medium hover:underline"
                >
                  Войдите, чтобы начать обучение
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CourseDetailsPage;
