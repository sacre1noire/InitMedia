import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { getMyVacancies, deleteVacancy } from "@/services/employerService";
import { Vacancy } from "@/types/vacancy";
import { Plus, Edit, Trash2, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { useConfirm, useToast, StaggerList, StaggerItem } from "@/components/animations";

const EmployerVacanciesPage: React.FC = () => {
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const confirm = useConfirm();
  const toast = useToast();

  const statusLabel = (status: Vacancy["status"]) => {
    switch (status) {
      case "archived":
        return "Архив"
      case "active":
      default:
        return "Активна"
    }
  };

  useEffect(() => {
    loadVacancies();
  }, []);

  const loadVacancies = async () => {
    try {
      const data = await getMyVacancies();
      setVacancies(data);
    } catch (error) {
      console.error("Failed to load vacancies", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    const ok = await confirm({
      title: "Удалить вакансию?",
      description: "Вакансия и все связанные с ней отклики будут скрыты.",
      confirmLabel: "Удалить",
      variant: "danger",
    });
    if (!ok) return;
    try {
      await deleteVacancy(id);
      setVacancies(vacancies.filter((v) => v.id !== id));
      toast("Вакансия удалена", "success");
    } catch (error) {
      console.error("Failed to delete vacancy", error);
      toast("Не удалось удалить вакансию", "error");
    }
  };

  const vacancyItems = useMemo(
    () => vacancies.filter((v) => v.type !== "internship"),
    [vacancies],
  );

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Мои вакансии</h1>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/employer/vacancies/new")}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center shadow-sm"
          >
            <Plus className="w-5 h-5 mr-2" />
            Создать вакансию
          </motion.button>
        </div>

        {loading ? (
          <div className="text-center py-10">Загрузка...</div>
        ) : vacancyItems.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            У вас пока нет активных вакансий.
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <StaggerList className="divide-y divide-gray-200">
              {vacancyItems.map((vacancy) => (
                <StaggerItem key={vacancy.id}>
                  <div className="px-4 py-4 sm:px-6 flex justify-between items-center">
                    <div>
                      <h3 className="text-lg leading-6 font-medium text-primary-600 truncate">
                        {vacancy.title}
                      </h3>
                      <p className="mt-1 max-w-2xl text-sm text-gray-500 flex flex-wrap gap-2">
                        <span>{vacancy.city || "Город не указан"}</span>
                        <span>•</span>
                        <span>
                          {vacancy.type === "internship"
                            ? "Стажировка"
                            : "Вакансия"}
                        </span>
                        <span>•</span>
                        <span>{statusLabel(vacancy.status)}</span>
                        <span>•</span>
                        <span>Откликов: {vacancy.applications_count ?? 0}</span>
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => navigate(`/vacancies/${vacancy.id}`)}
                        className="text-gray-400 hover:text-gray-600 p-2"
                        title="Просмотр"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() =>
                          navigate(`/employer/vacancies/${vacancy.id}/edit`)
                        }
                        className="text-blue-400 hover:text-blue-600 p-2"
                        title="Редактировать"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(vacancy.id)}
                        className="text-red-400 hover:text-red-600 p-2"
                        title="Удалить"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerList>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default EmployerVacanciesPage;
