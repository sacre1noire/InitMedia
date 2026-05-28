import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { getCourses, getMyProgress } from "@/services/courseService";
import { getUserGamification } from "@/services/gamificationService";
import { Course, CourseProgress } from "@/types/course";
import { UserGamification } from "@/types/gamification";
import { GamificationCard } from "@/components/GamificationCard";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowRight,
  Clock3,
  Sparkles,
  GraduationCap,
  PlayCircle,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import { StaggerList, StaggerItem } from "@/components/animations";

const studyTracks = [
  { title: "Маркетинг и SMM", lessons: "12 мини-уроков", keyword: "smm" },
  { title: "Видео и продакшн", lessons: "9 мини-уроков", keyword: "видео" },
  { title: "PR и коммуникации", lessons: "10 мини-уроков", keyword: "pr" },
  { title: "Дизайн для медиа", lessons: "7 мини-уроков", keyword: "дизайн" },
];

const CoursesPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const catalogRef = useRef<HTMLElement>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [progressList, setProgressList] = useState<CourseProgress[]>([]);
  const [gamification, setGamification] = useState<UserGamification | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trackFilter, setTrackFilter] = useState<string | null>(null);

  useEffect(() => {
    const loadCourses = async () => {
      setLoading(true);
      setError(null);
      try {
        const [data, progress, gam] = await Promise.all([
          getCourses(),
          getMyProgress().catch(() => [] as CourseProgress[]),
          user?.id
            ? getUserGamification(user.id).catch(() => null)
            : Promise.resolve(null),
        ]);
        setCourses(data || []);
        setProgressList(progress || []);
        setGamification(gam);
      } catch (e) {
        console.error(e);
        setError("Не удалось загрузить курсы");
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, [user?.id]);

  const firstCourse = courses[0];
  const filteredCourses = useMemo(() => {
    if (!trackFilter) return courses;
    const kw = trackFilter.toLowerCase();
    return courses.filter(
      (c) =>
        c.title.toLowerCase().includes(kw) ||
        c.description.toLowerCase().includes(kw) ||
        c.specializations?.some((s) => s.toLowerCase().includes(kw)),
    );
  }, [courses, trackFilter]);

  const findCourseForTrack = (keyword: string) =>
    courses.find(
      (c) =>
        c.title.toLowerCase().includes(keyword) ||
        c.description.toLowerCase().includes(keyword) ||
        c.specializations?.some((s) => s.toLowerCase().includes(keyword)),
    );

  const formatDuration = (minutes: number) => {
    if (!minutes) return "0м";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours <= 0) return `${mins}м`;
    return `${hours}ч ${mins}м`;
  };

  const scrollToCatalog = () => {
    catalogRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const getProgressForCourse = (courseId: number) =>
    progressList.find((p) => p.course_id === courseId);

  return (
    <Layout>
      <div className="mx-auto max-w-6xl space-y-6 sm:space-y-8 py-1 sm:py-2">
        <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-primary-200 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 p-4 sm:p-6 md:p-10 text-primary-50 shadow-xl">
          <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-primary-300/20 blur-2xl" />
          

          <div className="relative grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-center">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-primary-300/40 bg-primary-50/10 px-3 py-1 text-xs font-semibold tracking-wide">
                <Sparkles className="h-3.5 w-3.5" />
                Новая библиотека знаний
              </p>
              <h1 className="mt-3 sm:mt-4 text-2xl sm:text-4xl md:text-5xl font-semibold leading-tight">
                Курсы InitMedia
              </h1>
              <p className="mt-4 max-w-2xl text-sm text-primary-100 sm:text-base">
                Выбирайте короткие практические треки: от SMM и видеомонтажа до
                карьерного PR. Учитесь в удобном темпе и зарабатывайте XP.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (firstCourse) {
                      navigate(`/courses/${firstCourse.id}`);
                    } else {
                      scrollToCatalog();
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary-300 px-4 py-2 text-sm font-semibold text-primary-900 transition hover:bg-primary-200"
                >
                  Начать обучение
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (firstCourse) {
                      navigate(`/courses/${firstCourse.id}`);
                    } else {
                      scrollToCatalog();
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-primary-200/50 bg-primary-50/5 px-4 py-2 text-sm font-semibold text-primary-50 transition hover:bg-primary-50/10"
                >
                  <PlayCircle className="h-4 w-4" />
                  Смотреть демо
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-primary-200/30 bg-primary-50/10 p-5 backdrop-blur">
              <h2 className="text-xl font-semibold">Треки по направлениям</h2>
              <div className="mt-4 space-y-3">
                {studyTracks.map((track) => {
                  const matched = findCourseForTrack(track.keyword);
                  return (
                    <button
                      key={track.title}
                      type="button"
                      onClick={() => {
                        if (matched) {
                          navigate(`/courses/${matched.id}`);
                          return;
                        }
                        setTrackFilter(track.keyword);
                        scrollToCatalog();
                      }}
                      className="w-full rounded-xl border border-primary-200/25 bg-primary-900/25 px-4 py-3 text-left transition hover:bg-primary-900/40"
                    >
                      <p className="font-semibold">{track.title}</p>
                      <p className="text-xs text-primary-100">
                        {track.lessons}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section ref={catalogRef} className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-primary-900">
              Рекомендуемые курсы
            </h2>
            {trackFilter && (
              <button
                type="button"
                onClick={() => setTrackFilter(null)}
                className="text-sm text-primary-700 hover:underline"
              >
                Сбросить фильтр
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center rounded-2xl border border-dashed border-primary-200 bg-white p-10 text-primary-700">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Загружаем курсы...
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
              {error}
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-primary-200 bg-white p-10 text-center text-primary-700">
              {trackFilter
                ? "Нет курсов по выбранному направлению."
                : "Пока нет опубликованных курсов."}
            </div>
          ) : (
            <StaggerList className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredCourses.map((course) => {
                const cp = getProgressForCourse(course.id);
                return (
                  <StaggerItem
                    key={course.id}
                    className="group rounded-2xl border border-primary-200 bg-white p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow"
                  >
                  <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <span className="rounded-full bg-primary-100 px-2.5 py-1 text-xs font-semibold text-primary-800">
                        {course.specializations?.[0] || "Media"}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-primary-700">
                        <Clock3 className="h-3.5 w-3.5" />
                        {formatDuration(course.duration_minutes)}
                      </span>
                    </div>

                    <Link to={`/courses/${course.id}`}>
                      <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-primary-900 hover:text-primary-700 leading-snug">
                        {course.title}
                      </h3>
                    </Link>
                    <p className="mt-2 text-sm leading-relaxed text-primary-800/80">
                      {course.description.slice(0, 120)}
                      {course.description.length > 120 ? "…" : ""}
                    </p>

                    {cp && (
                      <div className="mt-3 h-1.5 rounded-full bg-primary-100 overflow-hidden">
                        <div
                          className="h-full bg-primary-600"
                          style={{
                            width: `${Math.round(
                              (cp.completed_lessons.length /
                                Math.max(course.lessons.length, 1)) *
                                100,
                            )}%`,
                          }}
                        />
                      </div>
                    )}

                    <div className="mt-5 flex items-center justify-between border-t border-primary-100 pt-4">
                      <div className="text-xs text-primary-700">
                        <p className="font-semibold">
                          {course.lessons.length} уроков
                        </p>
                        <p>
                          {course.is_free ? "Бесплатно" : "Платно"}
                          {course.xp_reward ? ` · +${course.xp_reward} XP` : ""}
                        </p>
                      </div>
                      <Link
                        to={`/courses/${course.id}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-primary-900 px-3 py-1.5 text-xs font-semibold text-primary-50 transition hover:bg-primary-800"
                      >
                        {cp ? "Продолжить" : "Открыть"}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </motion.div>
                  </StaggerItem>
                );
              })}
            </StaggerList>
          )}
        </section>

        <section className="rounded-2xl border border-primary-200 bg-primary-100/40 px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-primary-900 p-2 text-primary-50">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-primary-900">
                  Ваш прогресс и уровень
                </h3>
                <p className="text-sm text-primary-800/80">
                  XP и уровень видны всем в вашем профиле после прохождения
                  тестов.
                </p>
              </div>
            </div>
            {gamification ? (
              <div className="w-full lg:max-w-md">
                <GamificationCard stats={gamification} />
              </div>
            ) : null}
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                to="/profile"
                className="rounded-xl bg-primary-900 px-4 py-2 text-sm font-semibold text-primary-50 hover:bg-primary-800 text-center"
              >
                Открыть профиль
              </Link>
              <button
                type="button"
                onClick={scrollToCatalog}
                className="rounded-xl border border-primary-300 bg-white px-4 py-2 text-sm font-semibold text-primary-900 hover:bg-primary-50"
              >
                Выбрать курс
              </button>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default CoursesPage;
