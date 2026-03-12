import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { getVacancies } from "@/services/vacancyService";
import { Vacancy } from "@/types/vacancy";
import { Loader2, Search, MapPin, Briefcase } from "lucide-react";

const VacanciesPage: React.FC = () => {
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchParams] = useSearchParams();
  const type = searchParams.get("type");

  useEffect(() => {
    fetchVacancies();
  }, [type]); // Re-fetch when type changes

  const fetchVacancies = async () => {
    setLoading(true);
    try {
      const data = await getVacancies({
        search: search,
        type: type || undefined,
      });
      setVacancies(data.items);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchVacancies();
  };

  const pageTitle = type === "internship" ? "Стажировки" : "Вакансии";

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">{pageTitle}</h1>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            placeholder={`Поиск по ${type === "internship" ? "стажировкам" : "вакансиям"}...`}
            className="input-field flex-1"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            type="submit"
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
          >
            <Search size={20} />
          </button>
        </form>

        {loading ? (
          <div className="flex justify-center p-10">
            <Loader2 className="animate-spin text-primary-600 w-8 h-8" />
          </div>
        ) : vacancies.length === 0 ? (
          <p className="text-center text-gray-500 py-10">
            {type === "internship" ? "Стажировок" : "Вакансий"} не найдено
          </p>
        ) : (
          <div className="space-y-4">
            {vacancies.map((v) => (
              <Link
                to={`/vacancies/${v.id}`}
                key={v.id}
                className="block bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">
                      {v.title}
                    </h3>
                    <p className="text-gray-600 mb-2">
                      {v.company?.name || "Компания"}
                    </p>
                    <div className="flex items-center text-sm text-gray-500 gap-4">
                      <span className="flex items-center">
                        <MapPin size={14} className="mr-1" />{" "}
                        {v.city || "Удаленно"}
                      </span>
                      <span className="bg-gray-100 px-2 py-0.5 rounded text-xs uppercase">
                        {v.type === "internship" ? "Стажировка" : "Вакансия"}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-green-600">
                      {v.is_salary_hidden
                        ? "По договоренности"
                        : `от ${v.salary_from || 0} ₽`}
                    </p>
                    <span className="text-xs text-gray-400 block mt-1">
                      {new Date(v.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default VacanciesPage;
