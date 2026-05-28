import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { getVacancies } from "@/services/vacancyService";
import { Vacancy } from "@/types/vacancy";
import { Loader2, Search, MapPin, SlidersHorizontal, X } from "lucide-react";
import { motion } from "framer-motion";
import { StaggerList, StaggerItem } from "@/components/animations";

const PAGE_SIZE = 20;

function useDebouncedEffect(
  value: string,
  delay: number,
  onDebounced: (v: string) => void,
) {
  useEffect(() => {
    const t = window.setTimeout(() => onDebounced(value), delay);
    return () => window.clearTimeout(t);
  }, [value, delay, onDebounced]);
}

const VacanciesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(
    () => searchParams.get("search") || "",
  );
  const [showFilters, setShowFilters] = useState(false);

  const page = Math.max(1, Number(searchParams.get("page") || "1") || 1);
  const type = searchParams.get("type") || undefined;

  const syncSearchToUrl = useCallback(
    (v: string) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (v.trim()) next.set("search", v.trim());
          else next.delete("search");
          next.set("page", "1");
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  useDebouncedEffect(searchInput, 400, syncSearchToUrl);

  useEffect(() => {
    setSearchInput(searchParams.get("search") || "");
  }, [searchParams]);

  const fetchVacancies = useCallback(async () => {
    setLoading(true);
    try {
      const isRemoteRaw = searchParams.get("is_remote");
      const data = await getVacancies({
        search: searchParams.get("search") || undefined,
        type: searchParams.get("type") || undefined,
        specialization: searchParams.get("specialization") || undefined,
        schedule: searchParams.get("schedule") || undefined,
        city: searchParams.get("city") || undefined,
        is_remote:
          isRemoteRaw === "true"
            ? true
            : isRemoteRaw === "false"
              ? false
              : undefined,
        salary_from: searchParams.get("salary_from")
          ? Number(searchParams.get("salary_from"))
          : undefined,
        salary_to: searchParams.get("salary_to")
          ? Number(searchParams.get("salary_to"))
          : undefined,
        sort: searchParams.get("sort") || undefined,
        order: searchParams.get("order") || undefined,
        limit: PAGE_SIZE,
        skip: (page - 1) * PAGE_SIZE,
      });
      setVacancies(data.items);
      setTotal(data.total);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [searchParams, page]);

  useEffect(() => {
    fetchVacancies();
  }, [fetchVacancies]);

  const setParam = (key: string, value: string | null) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value === null || value === "") next.delete(key);
      else next.set(key, value);
      next.set("page", "1");
      return next;
    });
  };

  const resetFilters = () => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams();
        const t = prev.get("type");
        if (t) next.set("type", t);
        return next;
      },
      { replace: true },
    );
    setSearchInput("");
  };

  const chips = useMemo(() => {
    const c: { key: string; label: string }[] = [];
    const s = searchParams.get("search");
    if (s) c.push({ key: "search", label: `Поиск: ${s}` });
    const sp = searchParams.get("specialization");
    if (sp) c.push({ key: "specialization", label: `Специализация: ${sp}` });
    const sch = searchParams.get("schedule");
    if (sch) c.push({ key: "schedule", label: `График: ${sch}` });
    const city = searchParams.get("city");
    if (city) c.push({ key: "city", label: `Город: ${city}` });
    const ir = searchParams.get("is_remote");
    if (ir === "true") c.push({ key: "is_remote", label: "Удалённо" });
    if (ir === "false") c.push({ key: "is_remote", label: "Не удалённо" });
    const sf = searchParams.get("salary_from");
    if (sf) c.push({ key: "salary_from", label: `Зарплата от ${sf}` });
    const st = searchParams.get("salary_to");
    if (st) c.push({ key: "salary_to", label: `Зарплата до ${st}` });
    const sort = searchParams.get("sort");
    if (sort)
      c.push({
        key: "sort",
        label: `Сортировка: ${sort} ${searchParams.get("order") || "desc"}`,
      });
    return c;
  }, [searchParams]);

  const removeChip = (key: string) => {
    if (key === "sort") {
      setParam("sort", null);
      setParam("order", null);
      return;
    }
    setParam(key, null);
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageTitle = type === "internship" ? "Стажировки" : "Вакансии";

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <h1 className="text-3xl font-bold text-gray-900">{pageTitle}</h1>
          <Link
            to="/vacancies/recommended"
            className="text-sm text-primary-600 hover:underline"
          >
            Рекомендации для вас
          </Link>
        </div>

        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            syncSearchToUrl(searchInput);
          }}
        >
          <input
            type="text"
            placeholder="Поиск по названию и описанию..."
            className="input-field flex-1"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button
            type="submit"
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
          >
            <Search size={20} />
          </button>
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className="border border-gray-300 px-3 py-2 rounded-lg flex items-center gap-1 text-gray-700 hover:bg-gray-50"
          >
            <SlidersHorizontal size={18} />
            Фильтры
          </button>
        </form>

        {chips.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            {chips.map((ch) => (
              <span
                key={ch.key}
                className="inline-flex items-center gap-1 bg-primary-50 text-primary-800 text-sm px-2 py-1 rounded-full"
              >
                {ch.label}
                <button
                  type="button"
                  className="p-0.5 hover:text-primary-950"
                  onClick={() => removeChip(ch.key)}
                  aria-label="Убрать фильтр"
                >
                  <X size={14} />
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={resetFilters}
              className="text-sm text-gray-600 underline"
            >
              Сбросить всё
            </button>
          </div>
        )}

        {showFilters && (
          <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3 shadow-sm">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500">Специализация</label>
                <input
                  className="input-field mt-1 w-full"
                  value={searchParams.get("specialization") || ""}
                  onChange={(e) =>
                    setParam("specialization", e.target.value || null)
                  }
                  placeholder="например frontend"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">График</label>
                <input
                  className="input-field mt-1 w-full"
                  value={searchParams.get("schedule") || ""}
                  onChange={(e) =>
                    setParam("schedule", e.target.value || null)
                  }
                  placeholder="full_time, hybrid..."
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Город</label>
                <input
                  className="input-field mt-1 w-full"
                  value={searchParams.get("city") || ""}
                  onChange={(e) => setParam("city", e.target.value || null)}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Удалёнка</label>
                <select
                  className="input-field mt-1 w-full"
                  value={searchParams.get("is_remote") || ""}
                  onChange={(e) =>
                    setParam("is_remote", e.target.value || null)
                  }
                >
                  <option value="">Любой формат</option>
                  <option value="true">Удалённо</option>
                  <option value="false">Офис / гибрид</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500">Зарплата от</label>
                <input
                  type="number"
                  className="input-field mt-1 w-full"
                  value={searchParams.get("salary_from") || ""}
                  onChange={(e) =>
                    setParam("salary_from", e.target.value || null)
                  }
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Зарплата до</label>
                <input
                  type="number"
                  className="input-field mt-1 w-full"
                  value={searchParams.get("salary_to") || ""}
                  onChange={(e) =>
                    setParam("salary_to", e.target.value || null)
                  }
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-3 items-end">
              <div>
                <label className="text-xs text-gray-500">Сортировка</label>
                <select
                  className="input-field mt-1"
                  value={searchParams.get("sort") || "date"}
                  onChange={(e) => setParam("sort", e.target.value)}
                >
                  <option value="date">По дате</option>
                  <option value="salary">По зарплате</option>
                  <option value="relevance">По релевантности</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500">Порядок</label>
                <select
                  className="input-field mt-1"
                  value={searchParams.get("order") || "desc"}
                  onChange={(e) => setParam("order", e.target.value)}
                >
                  <option value="desc">По убыванию</option>
                  <option value="asc">По возрастанию</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center p-10">
            <Loader2 className="animate-spin text-primary-600 w-8 h-8" />
          </div>
        ) : vacancies.length === 0 ? (
          <p className="text-center text-gray-500 py-10">
            {type === "internship" ? "Стажировок" : "Вакансий"} не найдено
          </p>
        ) : (
          <StaggerList className="space-y-4">
            {vacancies.map((v) => (
              <StaggerItem key={v.id}>
                <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                  <Link
                    to={`/vacancies/${v.id}`}
                    className="block bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-1">
                          {v.title}
                        </h3>
                        <p className="text-gray-600 mb-2">
                          {v.company?.name || "Компания"}
                        </p>
                        <div className="flex items-center text-sm text-gray-500 gap-4 flex-wrap">
                          <span className="flex items-center">
                            <MapPin size={14} className="mr-1" />{" "}
                            {v.city || (v.is_remote ? "Удалённо" : "Город не указан")}
                          </span>
                          <span className="bg-gray-100 px-2 py-0.5 rounded text-xs uppercase">
                            {v.type === "internship" ? "Стажировка" : v.type}
                          </span>
                          <span className="text-xs text-gray-400">
                            {v.published_at
                              ? new Date(v.published_at).toLocaleDateString()
                              : new Date(v.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-green-600">
                          {v.is_salary_hidden
                            ? "По договоренности"
                            : `от ${v.salary_from ?? 0} ₽`}
                        </p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerList>
        )}

        {total > PAGE_SIZE && (
          <div className="flex justify-between items-center pt-4 border-t border-gray-100">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() =>
                setSearchParams((prev) => {
                  const next = new URLSearchParams(prev);
                  next.set("page", String(page - 1));
                  return next;
                })
              }
              className="px-3 py-1 rounded border disabled:opacity-40"
            >
              Назад
            </button>
            <span className="text-sm text-gray-600">
              Стр. {page} из {totalPages} ({total} всего)
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() =>
                setSearchParams((prev) => {
                  const next = new URLSearchParams(prev);
                  next.set("page", String(page + 1));
                  return next;
                })
              }
              className="px-3 py-1 rounded border disabled:opacity-40"
            >
              Вперёд
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default VacanciesPage;
