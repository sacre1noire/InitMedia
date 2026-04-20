import React from "react";
import { Layout } from "@/components/Layout";
import { ArrowRight, Clock3, Sparkles, GraduationCap, PlayCircle } from "lucide-react";

const featuredCourses = [
  {
    id: 1,
    title: "SMM-старт за 14 дней",
    level: "Новичок",
    duration: "6 уроков",
    time: "2ч 20м",
    tag: "Популярно",
    description:
      "Контент-план, тональность бренда и аналитика вовлеченности на реальных кейсах.",
  },
  {
    id: 2,
    title: "Монтаж Reels и Shorts",
    level: "Базовый",
    duration: "8 уроков",
    time: "3ч 15м",
    tag: "Новый",
    description:
      "Быстрый монтаж, динамика кадра и сценарная сборка коротких роликов под медиаформаты.",
  },
  {
    id: 3,
    title: "Карьерный PR: резюме + портфолио",
    level: "Для джуна",
    duration: "5 уроков",
    time: "1ч 50м",
    tag: "Топ выбор",
    description:
      "Упакуйте кейсы, оформите CV и научитесь презентовать опыт на интервью без воды.",
  },
];

const studyTracks = [
  {
    title: "Маркетинг и SMM",
    lessons: "12 мини-уроков",
  },
  {
    title: "Видео и продакшн",
    lessons: "9 мини-уроков",
  },
  {
    title: "PR и коммуникации",
    lessons: "10 мини-уроков",
  },
  {
    title: "Дизайн для медиа",
    lessons: "7 мини-уроков",
  },
];

const CoursesPage: React.FC = () => {
  return (
    <Layout>
      <div className="mx-auto max-w-6xl space-y-8 py-2">
        <section className="relative overflow-hidden rounded-3xl border border-primary-200 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 p-6 text-primary-50 shadow-xl sm:p-10">
          <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-primary-300/20 blur-2xl" />
          <div className="absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-primary-300/20 blur-2xl" />

          <div className="relative grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-center">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-primary-300/40 bg-primary-50/10 px-3 py-1 text-xs font-semibold tracking-wide">
                <Sparkles className="h-3.5 w-3.5" />
                Новая библиотека знаний
              </p>
              <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl">
                Курсы InitMedia
              </h1>
              <p className="mt-4 max-w-2xl text-sm text-primary-100 sm:text-base">
                Выбирайте короткие практические треки: от SMM и видеомонтажа до карьерного PR.
                Учитесь в удобном темпе и собирайте портфолио по шагам.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button className="inline-flex items-center gap-2 rounded-xl bg-primary-300 px-4 py-2 text-sm font-semibold text-primary-900 transition hover:bg-primary-200">
                  Начать обучение
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button className="inline-flex items-center gap-2 rounded-xl border border-primary-200/50 bg-primary-50/5 px-4 py-2 text-sm font-semibold text-primary-50 transition hover:bg-primary-50/10">
                  <PlayCircle className="h-4 w-4" />
                  Смотреть демо
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-primary-200/30 bg-primary-50/10 p-5 backdrop-blur">
              <h2 className="text-xl font-semibold">Треки по направлениям</h2>
              <div className="mt-4 space-y-3">
                {studyTracks.map((track) => (
                  <div
                    key={track.title}
                    className="rounded-xl border border-primary-200/25 bg-primary-900/25 px-4 py-3"
                  >
                    <p className="font-semibold">{track.title}</p>
                    <p className="text-xs text-primary-100">{track.lessons}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-semibold text-primary-900">Рекомендуемые курсы</h2>
            <span className="rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-800">
              Без подключения БД
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {featuredCourses.map((course) => (
              <article
                key={course.id}
                className="group rounded-2xl border border-primary-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <span className="rounded-full bg-primary-100 px-2.5 py-1 text-xs font-semibold text-primary-800">
                    {course.tag}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-primary-700">
                    <Clock3 className="h-3.5 w-3.5" />
                    {course.time}
                  </span>
                </div>

                <h3 className="text-2xl font-semibold text-primary-900">{course.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-primary-800/80">{course.description}</p>

                <div className="mt-5 flex items-center justify-between border-t border-primary-100 pt-4">
                  <div className="text-xs text-primary-700">
                    <p className="font-semibold">{course.level}</p>
                    <p>{course.duration}</p>
                  </div>
                  <button className="inline-flex items-center gap-1 rounded-lg bg-primary-900 px-3 py-1.5 text-xs font-semibold text-primary-50 transition hover:bg-primary-800">
                    Открыть
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-primary-200 bg-primary-100/40 px-6 py-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary-900 p-2 text-primary-50">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-primary-900">Скоро добавим личный прогресс</h3>
                <p className="text-sm text-primary-800/80">
                  Следующим шагом можно подключить БД и трекинг прохождения уроков.
                </p>
              </div>
            </div>
            <button className="rounded-xl bg-primary-900 px-4 py-2 text-sm font-semibold text-primary-50 hover:bg-primary-800">
              Я хочу эту фичу
            </button>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default CoursesPage;
