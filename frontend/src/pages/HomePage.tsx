import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { getVacancies } from '@/services/vacancyService';
import { Vacancy } from '@/types/vacancy';
import { Briefcase, Clock, MapPin, Sparkles } from 'lucide-react';
import { Reveal, StaggerList, StaggerItem, MotionCard, SkeletonGrid } from '@/components/animations';

const HomePage: React.FC = () => {
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadLatest = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getVacancies({
          limit: 3,
          sort: 'date',
          order: 'desc',
        });
        setVacancies(data.items ?? []);
      } catch (e) {
        console.error(e);
        setError('Не удалось загрузить вакансии');
      } finally {
        setLoading(false);
      }
    };

    loadLatest();
  }, []);

  const cards = useMemo(() => vacancies.slice(0, 3), [vacancies]);

  const formatSalary = (item: Vacancy) => {
    if (item.is_salary_hidden) {
      return 'По договоренности';
    }
    if (item.salary_from && item.salary_to) {
      return `${item.salary_from} - ${item.salary_to} ₽`;
    }
    if (item.salary_from) {
      return `от ${item.salary_from} ₽`;
    }
    if (item.salary_to) {
      return `до ${item.salary_to} ₽`;
    }
    return 'Зарплата не указана';
  };

  return (
    <Layout>
      <section className="relative overflow-hidden rounded-2xl border border-primary-100 bg-gradient-to-br from-white via-primary-50 to-primary-100 p-8 shadow-sm">
        <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-primary-200/40 blur-2xl animate-float motion-reduce:animate-none" />
        <div className="absolute -bottom-16 -left-10 h-48 w-48 rounded-full bg-primary-300/30 blur-3xl animate-float-slow motion-reduce:animate-none" />

        <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-primary-600/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-700">
              <Sparkles className="h-3.5 w-3.5" />
              Карьерный старт в медиа
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight text-gray-900 sm:text-5xl">
              Найди свою карьеру в медиа
            </h1>
            <p className="mt-4 text-base text-gray-600 sm:text-lg">
              Стажировки, вакансии и карьерное сопровождение в сильных медиа-командах. Собирай опыт, резюме и знания в одном месте.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/vacancies?type=internship"
                className="rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700"
              >
                Найти стажировку
              </Link>
              <Link
                to="/resumes"
                className="rounded-xl border border-primary-200 bg-white px-6 py-3 text-sm font-semibold text-primary-700 transition hover:bg-primary-50"
              >
                Разместить резюме
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-white/60 bg-white/70 p-6 shadow-sm backdrop-blur">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-primary-700">Что внутри</h3>
            <ul className="mt-4 space-y-3 text-sm text-gray-700">
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary-500" />
                Реальные вакансии и стажировки
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary-500" />
                Конструктор резюме и помощь эксперта
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary-500" />
                Мини-курсы по PR, SMM и аналитике
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <Reveal className="flex items-center justify-between" y={16}>
          <h2 className="text-2xl font-semibold text-gray-900">Свежие вакансии</h2>
          <Link to="/vacancies" className="text-sm font-medium text-primary-600 hover:text-primary-700">
            Смотреть все
          </Link>
        </Reveal>

        {loading ? (
          <SkeletonGrid
            count={3}
            className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
          />
        ) : error ? (
          <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-700">
            {error}
          </div>
        ) : cards.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-gray-200 bg-white p-6 text-center text-gray-500">
            Пока нет опубликованных вакансий.
          </div>
        ) : (
          <StaggerList className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {cards.map((item) => (
              <StaggerItem key={item.id} className="h-full">
              <MotionCard
                className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="rounded-xl bg-primary-50 p-2 text-primary-600">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <span className="rounded-full bg-primary-100 px-2.5 py-1 text-xs font-semibold text-primary-800">
                    {item.type === 'internship' ? 'Стажировка' : 'Вакансия'}
                  </span>
                </div>

                <h3 className="mt-4 text-lg font-semibold text-gray-900">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.company?.name || 'Без названия компании'}</p>

                <div className="mt-4 space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    {item.city || (item.is_remote ? 'Удаленно' : 'Город не указан')}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    {item.schedule || 'График не указан'}
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
                  <span className="text-sm font-semibold text-gray-900">{formatSalary(item)}</span>
                  <Link
                    to={`/vacancies/${item.id}`}
                    className="text-sm font-medium text-primary-600 hover:text-primary-700"
                  >
                    Подробнее →
                  </Link>
                </div>
              </MotionCard>
              </StaggerItem>
            ))}
          </StaggerList>
        )}
      </section>
    </Layout>
  );
};

export default HomePage;
