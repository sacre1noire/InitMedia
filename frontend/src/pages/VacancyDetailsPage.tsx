import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { getVacancy, applyToVacancy } from "@/services/vacancyService";
import { Vacancy } from "@/types/vacancy";
import { Loader2, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types/auth";

const VacancyDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [vacancy, setVacancy] = useState<Vacancy | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const { user } = useAuth();
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    if (id) {
      getVacancy(Number(id))
        .then(setVacancy)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleApply = async () => {
    if (!id) return;
    setApplying(true);
    try {
      await applyToVacancy(Number(id));
      setApplied(true);
      alert("Вы успешно откликнулись на вакансию!");
    } catch (error: any) {
      console.error("Failed to apply", error);
      if (error.response?.data?.detail === "Already applied") {
        setApplied(true);
        alert("Вы уже откликнулись на эту вакансию");
      } else {
        alert("Ошибка при отклике на вакансию");
      }
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center p-10">
          <Loader2 className="animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!vacancy) {
    return (
      <Layout>
        <div className="text-center p-10">Вакансия не найдена</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-8">
        <Link
          to="/vacancies"
          className="flex items-center text-gray-500 mb-6 hover:text-primary-600"
        >
          <ArrowLeft size={20} className="mr-2" />К списку вакансий
        </Link>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {vacancy.title}
              </h1>
              <p className="text-xl text-gray-600">
                {vacancy.company?.name || "Компания"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-600">
                {vacancy.is_salary_hidden
                  ? "З/П не указана"
                  : `${vacancy.salary_from} - ${vacancy.salary_to} ₽`}
              </p>
              <span className="inline-block bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm mt-2">
                {vacancy.type}
              </span>
            </div>
          </div>

          <div className="prose max-w-none text-gray-800">
            <h3 className="text-lg font-semibold mb-2">Описание</h3>
            <div className="whitespace-pre-wrap mb-6">
              {vacancy.description}
            </div>

            {vacancy.requirements && (
              <>
                <h3 className="text-lg font-semibold mb-2">Требования</h3>
                <div className="whitespace-pre-wrap mb-6">
                  {vacancy.requirements}
                </div>
              </>
            )}

            <div className="flex flex-wrap gap-4 mt-8 pt-6 border-t border-gray-100">
              <div>
                <span className="text-gray-500 text-sm block">Город</span>
                <span className="font-medium">
                  {vacancy.city || "Удаленно"}
                </span>
              </div>
              <div>
                <span className="text-gray-500 text-sm block">График</span>
                <span className="font-medium">
                  {vacancy.schedule || "Не указан"}
                </span>
              </div>
              <div>
                <span className="text-gray-500 text-sm block">
                  Опубликовано
                </span>
                <span className="font-medium">
                  {new Date(vacancy.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
            {user ? (
              user.role === UserRole.APPLICANT ? (
                <button
                  onClick={handleApply}
                  disabled={applying || applied}
                  className={`bg-primary-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-primary-700 shadow-md transform transition hover:-translate-y-0.5 ${applying || applied ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {applying
                    ? "Отправка..."
                    : applied
                      ? "Вы уже откликнулись"
                      : "Откликнуться"}
                </button>
              ) : (
                <div className="text-gray-500">
                  Работодатели не могут откликаться на вакансии
                </div>
              )
            ) : (
              <Link
                to="/login"
                className="text-primary-600 font-medium hover:underline"
              >
                Войдите, чтобы откликнуться
              </Link>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default VacancyDetailsPage;
