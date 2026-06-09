import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform, Variants } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  Building2,
  Clock,
  FileText,
  MapPin,
  Rocket,
  Search,
  Sparkles,
  Trophy,
  UserPlus,
  Zap,
} from "lucide-react";
import { getVacancies } from "@/services/vacancyService";
import { Vacancy } from "@/types/vacancy";
import {
  Reveal,
  RevealStagger,
  StaggerItem,
  StaggerList,
  MotionCard,
  AnimatedCounter,
  SkeletonGrid,
  TiltCard,
} from "@/components/animations";

const SPECIALIZATIONS = [
  "Реклама",
  "PR",
  "Журналистика",
  "SMM",
  "Продюсирование",
  "Копирайтинг",
  "Дизайн",
  "Аналитика",
];

const LEVELS = [
  "Новичок",
  "Ученик",
  "Практик",
  "Профи",
  "Эксперт",
  "Мастер",
  "Легенда",
];

const FEATURES = [
  {
    icon: Briefcase,
    title: "Вакансии и стажировки",
    text: "Реальные предложения от медиа-команд: от первых стажировок до полноценных позиций.",
  },
  {
    icon: FileText,
    title: "Конструктор резюме",
    text: "Собери сильное резюме по готовым шаблонам с подсказками на каждом шаге.",
  },
  {
    icon: BookOpen,
    title: "Мини-курсы",
    text: "Короткие практические курсы по PR, SMM, аналитике и другим направлениям.",
  },
  {
    icon: Trophy,
    title: "Геймификация",
    text: "Получай XP за обучение, расти от Новичка до Легенды и следи за прогрессом.",
  },
  {
    icon: Building2,
    title: "Компании",
    text: "Профили проверенных работодателей с открытыми вакансиями и стажировками.",
  },
  {
    icon: Sparkles,
    title: "Рекомендации",
    text: "Платформа подбирает вакансии под твой профиль и специализацию.",
  },
];

const STEPS = [
  {
    icon: UserPlus,
    title: "Зарегистрируйся",
    text: "Создай аккаунт соискателя или работодателя за минуту.",
  },
  {
    icon: FileText,
    title: "Создай резюме",
    text: "Заполни профиль и собери резюме в конструкторе.",
  },
  {
    icon: BookOpen,
    title: "Проходи курсы",
    text: "Прокачивай навыки и получай XP за каждый урок.",
  },
  {
    icon: Rocket,
    title: "Откликайся",
    text: "Находи стажировки и вакансии — и начинай карьеру.",
  },
];

const STATS = [
  { value: 120, suffix: "+", label: "Вакансий и стажировок" },
  { value: 40, suffix: "+", label: "Компаний-партнёров" },
  { value: 25, suffix: "+", label: "Мини-курсов" },
  { value: 3500, suffix: "", label: "XP до уровня «Легенда»" },
];

const heroStagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const heroItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const formatSalary = (item: Vacancy) => {
  if (item.is_salary_hidden) return "По договоренности";
  if (item.salary_from && item.salary_to)
    return `${item.salary_from} - ${item.salary_to} ₽`;
  if (item.salary_from) return `от ${item.salary_from} ₽`;
  if (item.salary_to) return `до ${item.salary_to} ₽`;
  return "Зарплата не указана";
};

const PublicNavbar: React.FC = () => (
  <header className="sticky top-0 z-50 border-b border-primary-100 bg-white/70 backdrop-blur">
    <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
      <Link to="/" className="flex items-center gap-3">
        <img
          src="/logo.jpg"
          alt="InitMedia logo"
          className="h-10 w-10 rounded-xl border border-primary-200 object-cover shadow-sm"
        />
        <span className="text-lg font-semibold text-primary-900">InitMedia</span>
      </Link>

      <nav className="hidden items-center gap-6 text-sm font-medium text-primary-800 md:flex">
        <a href="#features" className="transition-colors hover:text-primary-600">
          Возможности
        </a>
        <a href="#how" className="transition-colors hover:text-primary-600">
          Как это работает
        </a>
        <a href="#levels" className="transition-colors hover:text-primary-600">
          Геймификация
        </a>
      </nav>

      <div className="flex items-center gap-2 sm:gap-3">
        <Link
          to="/login"
          className="rounded-xl px-4 py-2 text-sm font-semibold text-primary-700 transition-colors hover:bg-primary-50"
        >
          Войти
        </Link>
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Link
            to="/register"
            className="block rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700"
          >
            Регистрация
          </Link>
        </motion.div>
      </div>
    </div>
  </header>
);

const HeroSection: React.FC = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const blobY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const blobY2 = useTransform(scrollYProgress, [0, 1], [0, -80]);

  return (
    <section
      ref={heroRef}
      className="relative overflow-hidden bg-gradient-to-br from-white via-primary-50 to-primary-100"
    >
      <motion.div
        style={{ y: blobY }}
        className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-primary-200/40 blur-3xl animate-float motion-reduce:animate-none"
      />
      <motion.div
        style={{ y: blobY2 }}
        className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-primary-300/30 blur-3xl animate-float-slow motion-reduce:animate-none"
      />
      <motion.div
        style={{ y: blobY }}
        className="absolute left-1/2 top-1/3 h-56 w-56 rounded-full bg-primary-400/15 blur-3xl animate-float-slow motion-reduce:animate-none"
      />

      <motion.div
        className="relative mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 sm:py-28 lg:px-8"
        initial="hidden"
        animate="visible"
        variants={heroStagger}
      >
        <motion.p
          variants={heroItem}
          className="mx-auto inline-flex items-center gap-2 rounded-full bg-primary-600/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-primary-700"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Карьерный старт в медиа
        </motion.p>

        <motion.h1
          variants={heroItem}
          className="mx-auto mt-6 max-w-3xl text-4xl font-bold leading-tight text-gray-900 sm:text-6xl"
        >
          Найди свою карьеру{" "}
          <span className="bg-gradient-to-r from-primary-600 via-primary-400 to-primary-700 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient-shift motion-reduce:animate-none">
            в медиа
          </span>
        </motion.h1>

        <motion.p
          variants={heroItem}
          className="mx-auto mt-6 max-w-2xl text-base text-gray-600 sm:text-lg"
        >
          Стажировки, вакансии, конструктор резюме и мини-курсы для студентов и
          начинающих специалистов медиасферы — всё в одном месте.
        </motion.p>

        <motion.div
          variants={heroItem}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
            <Link
              to="/register"
              className="flex items-center gap-2 rounded-xl bg-primary-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary-300/50 transition-colors hover:bg-primary-700"
            >
              Начать бесплатно
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
            <Link
              to="/login"
              className="block rounded-xl border border-primary-200 bg-white/80 px-7 py-3.5 text-sm font-semibold text-primary-700 backdrop-blur transition-colors hover:bg-primary-50"
            >
              Войти
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
};

const MarqueeSection: React.FC = () => {
  const chips = [...SPECIALIZATIONS, ...SPECIALIZATIONS];
  return (
    <section className="relative overflow-hidden border-y border-primary-100 bg-primary-50 py-6">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-primary-50 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-primary-50 to-transparent" />
      <div className="flex w-max gap-4 animate-marquee motion-reduce:animate-none">
        {chips.map((label, i) => (
          <span
            key={`${label}-${i}`}
            className="whitespace-nowrap rounded-full border border-primary-200 bg-white/80 px-5 py-2 text-sm font-medium text-primary-800 shadow-sm"
          >
            {label}
          </span>
        ))}
      </div>
    </section>
  );
};

const StatsSection: React.FC = () => (
  <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
    <RevealStagger className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {STATS.map((stat) => (
        <StaggerItem
          key={stat.label}
          className="rounded-2xl border border-primary-100 bg-white/70 p-6 text-center shadow-sm backdrop-blur"
        >
          <p className="text-3xl font-bold text-primary-700 sm:text-4xl">
            <AnimatedCounter value={stat.value} suffix={stat.suffix} />
          </p>
          <p className="mt-2 text-sm text-gray-600">{stat.label}</p>
        </StaggerItem>
      ))}
    </RevealStagger>
  </section>
);

const FeaturesSection: React.FC = () => (
  <section id="features" className="bg-white py-16 sm:py-20">
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <Reveal className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
          Всё для старта карьеры
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-gray-600">
          Платформа сопровождает тебя от первого резюме до оффера.
        </p>
      </Reveal>

      <RevealStagger className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => (
          <StaggerItem key={feature.title}>
            <MotionCard className="h-full rounded-2xl border border-primary-100 bg-white/70 p-6 shadow-sm backdrop-blur transition-shadow hover:shadow-md">
              <div className="inline-flex rounded-xl bg-primary-50 p-3 text-primary-600">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                {feature.text}
              </p>
            </MotionCard>
          </StaggerItem>
        ))}
      </RevealStagger>
    </div>
  </section>
);

const HowItWorksSection: React.FC = () => (
  <section id="how" className="bg-primary-50 py-16 sm:py-20">
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <Reveal className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
          Как это работает
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-gray-600">
          Четыре шага от регистрации до первого оффера.
        </p>
      </Reveal>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, i) => (
          <Reveal key={step.title} delay={i * 0.12} className="relative">
            {i < STEPS.length - 1 && (
              <div className="absolute right-0 top-8 hidden w-1/3 translate-x-1/2 border-t-2 border-dashed border-primary-200 lg:block" />
            )}
            <div className="relative h-full rounded-2xl border border-primary-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">
                  {i + 1}
                </span>
                <step.icon className="h-5 w-5 text-primary-500" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-gray-900">
                {step.title}
              </h3>
              <p className="mt-2 text-sm text-gray-600">{step.text}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
);

const RolesSection: React.FC = () => (
  <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
    <Reveal className="text-center">
      <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
        Кому подойдёт InitMedia
      </h2>
    </Reveal>

    <div className="mt-12 grid gap-6 md:grid-cols-2">
      <Reveal>
        <TiltCard className="h-full rounded-3xl border border-primary-100 bg-gradient-to-br from-white to-primary-50 p-8 shadow-sm">
          <div className="inline-flex rounded-2xl bg-primary-600/10 p-3 text-primary-600">
            <Search className="h-7 w-7" />
          </div>
          <h3 className="mt-5 text-xl font-semibold text-gray-900">
            Я соискатель
          </h3>
          <ul className="mt-4 space-y-3 text-sm text-gray-700">
            {[
              "Конструктор резюме с шаблонами",
              "Мини-курсы и XP за обучение",
              "Персональные рекомендации вакансий",
              "Отклики и статусы в одном кабинете",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="h-2 w-2 shrink-0 rounded-full bg-primary-500" />
                {item}
              </li>
            ))}
          </ul>
          <Link
            to="/register"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
          >
            Найти стажировку
            <ArrowRight className="h-4 w-4" />
          </Link>
        </TiltCard>
      </Reveal>

      <Reveal delay={0.12}>
        <TiltCard className="h-full rounded-3xl border border-primary-100 bg-gradient-to-br from-white to-primary-50 p-8 shadow-sm">
          <div className="inline-flex rounded-2xl bg-primary-600/10 p-3 text-primary-600">
            <Building2 className="h-7 w-7" />
          </div>
          <h3 className="mt-5 text-xl font-semibold text-gray-900">
            Я работодатель
          </h3>
          <ul className="mt-4 space-y-3 text-sm text-gray-700">
            {[
              "Публикация вакансий и стажировок",
              "Поиск мотивированных кандидатов",
              "Управление откликами и статусами",
              "Профиль компании с верификацией",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="h-2 w-2 shrink-0 rounded-full bg-primary-500" />
                {item}
              </li>
            ))}
          </ul>
          <Link
            to="/register"
            className="mt-6 inline-flex items-center gap-2 rounded-xl border border-primary-300 bg-white px-5 py-2.5 text-sm font-semibold text-primary-700 transition-colors hover:bg-primary-50"
          >
            Разместить вакансию
            <ArrowRight className="h-4 w-4" />
          </Link>
        </TiltCard>
      </Reveal>
    </div>
  </section>
);

const GamificationSection: React.FC = () => (
  <section id="levels" className="bg-white py-16 sm:py-20">
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-8 sm:p-12">
        <Reveal className="text-center">
          <p className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-amber-700">
            <Zap className="h-3.5 w-3.5" />
            Геймификация
          </p>
          <h2 className="mt-4 text-3xl font-bold text-gray-900 sm:text-4xl">
            Учись и расти до Легенды
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-gray-600">
            Проходи курсы, получай XP и поднимайся по уровням — от Новичка до
            Легенды за 3500 XP.
          </p>
        </Reveal>

        <RevealStagger className="mt-10 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          {LEVELS.map((level, i) => (
            <StaggerItem key={level} className="flex items-center gap-2 sm:gap-3">
              <span
                className={`rounded-full px-4 py-1.5 text-sm font-semibold shadow-sm ${
                  i === LEVELS.length - 1
                    ? "bg-amber-500 text-white"
                    : "border border-amber-200 bg-white text-amber-800"
                }`}
              >
                {level}
              </span>
              {i < LEVELS.length - 1 && (
                <ArrowRight className="h-4 w-4 text-amber-400" />
              )}
            </StaggerItem>
          ))}
        </RevealStagger>

        <Reveal delay={0.2} className="mx-auto mt-10 max-w-xl">
          <div className="flex justify-between text-xs font-medium text-amber-800/70">
            <span>0 XP</span>
            <span>3500 XP</span>
          </div>
          <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-amber-200/60">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-600"
              initial={{ width: 0 }}
              whileInView={{ width: "65%" }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
          </div>
        </Reveal>
      </div>
    </div>
  </section>
);

const FreshVacanciesSection: React.FC = () => {
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getVacancies({ limit: 3, sort: "date", order: "desc" });
        setVacancies((data.items ?? []).slice(0, 3));
      } catch (e) {
        console.error(e);
        setFailed(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (failed || (!loading && vacancies.length === 0)) return null;

  return (
    <section className="bg-primary-50 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Свежие вакансии
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-gray-600">
            Команды уже ищут таких, как ты.
          </p>
        </Reveal>

        {loading ? (
          <SkeletonGrid
            count={3}
            className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
          />
        ) : (
          <StaggerList className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {vacancies.map((item) => (
              <StaggerItem key={item.id}>
                <MotionCard className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                  <div className="flex items-start justify-between">
                    <div className="rounded-xl bg-primary-50 p-2 text-primary-600">
                      <Briefcase className="h-5 w-5" />
                    </div>
                    <span className="rounded-full bg-primary-100 px-2.5 py-1 text-xs font-semibold text-primary-800">
                      {item.type === "internship" ? "Стажировка" : "Вакансия"}
                    </span>
                  </div>

                  <h3 className="mt-4 text-lg font-semibold text-gray-900">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {item.company?.name || "Без названия компании"}
                  </p>

                  <div className="mt-4 space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      {item.city || (item.is_remote ? "Удаленно" : "Город не указан")}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      {item.schedule || "График не указан"}
                    </div>
                  </div>

                  <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-4">
                    <span className="text-sm font-semibold text-gray-900">
                      {formatSalary(item)}
                    </span>
                    <Link
                      to="/register"
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
      </div>
    </section>
  );
};

const CtaSection: React.FC = () => (
  <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
    <Reveal>
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 to-primary-800 p-10 text-center text-white sm:p-16">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary-400/30 blur-3xl animate-float motion-reduce:animate-none" />
        <div className="absolute -bottom-20 -left-16 h-72 w-72 rounded-full bg-primary-300/20 blur-3xl animate-float-slow motion-reduce:animate-none" />

        <div className="relative">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Готов начать карьеру в медиа?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-primary-100">
            Регистрация бесплатна. Резюме, курсы и первые отклики — уже через
            несколько минут.
          </p>
          <motion.div
            className="mt-8 inline-block"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-sm font-bold text-primary-700 shadow-lg animate-glow motion-reduce:animate-none transition-colors hover:bg-primary-50"
            >
              Создать аккаунт
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </div>
    </Reveal>
  </section>
);

const PublicFooter: React.FC = () => (
  <footer className="border-t border-gray-200 bg-white">
    <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-6 sm:flex-row sm:justify-between sm:px-6 lg:px-8">
      <p className="text-sm text-gray-500">
        &copy; 2026 InitMedia. Платформа для развития карьеры в медиа.
      </p>
      <div className="flex gap-5 text-sm text-gray-500">
        <a href="#features" className="transition-colors hover:text-primary-600">
          Возможности
        </a>
        <a href="#how" className="transition-colors hover:text-primary-600">
          Как это работает
        </a>
        <Link to="/login" className="transition-colors hover:text-primary-600">
          Войти
        </Link>
      </div>
    </div>
  </footer>
);

const LandingPage: React.FC = () => (
  <div className="min-h-screen bg-primary-50">
    <PublicNavbar />
    <main>
      <HeroSection />
      <MarqueeSection />
      <StatsSection />
      <FeaturesSection />
      <HowItWorksSection />
      <RolesSection />
      <GamificationSection />
      <FreshVacanciesSection />
      <CtaSection />
    </main>
    <PublicFooter />
  </div>
);

export default LandingPage;
