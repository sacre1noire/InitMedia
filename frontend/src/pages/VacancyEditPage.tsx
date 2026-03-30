import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Layout } from "@/components/Layout";
import { createVacancy, updateVacancy } from "@/services/employerService";
import { getVacancy } from "@/services/vacancyService";
import { VacancyType, VacancyStatus } from "@/types/vacancy";

interface VacancyForm {
  title: string;
  description: string;
  requirements: string;
  type: VacancyType;
  specialization: string;
  salary_from?: number;
  salary_to?: number;
  is_salary_hidden: boolean;
  city?: string;
  is_remote: boolean;
  status: VacancyStatus;
}

const VacancyEditPage: React.FC = () => {
  const { id } = useParams(); // If id exists, it's edit mode
  const isEditMode = !!id;
  const navigate = useNavigate();
  const { register, handleSubmit, setValue } = useForm<VacancyForm>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEditMode && id) {
      loadVacancy(parseInt(id));
    }
  }, [id]);

  const loadVacancy = async (vacancyId: number) => {
    try {
      const data = await getVacancy(vacancyId);
      // Populate form
      setValue("title", data.title);
      setValue("description", data.description);
      setValue("requirements", data.requirements || "");
      setValue("type", data.type);
      setValue("specialization", data.specialization);
      setValue("salary_from", data.salary_from);
      setValue("salary_to", data.salary_to);
      setValue("is_salary_hidden", data.is_salary_hidden);
      setValue("city", data.city);
      setValue("is_remote", data.is_remote);
      setValue("status", data.status);
    } catch (error) {
      console.error("Failed to load vacancy", error);
    }
  };

  const onSubmit = async (data: VacancyForm) => {
    setLoading(true);
    try {
      // Need to add company_id which is handled by backend from token
      // But API needs payload matching schema
      // Assuming backend extracts company from user
      const payload = {
        ...data,
        schedule: "full_time", // hardcode for now or add field
      };

      if (isEditMode && id) {
        await updateVacancy(parseInt(id), payload);
      } else {
        await createVacancy({ ...payload, company_id: 0 }); // company_id ignored by backend
      }
      navigate("/employer/vacancies");
    } catch (error) {
      console.error("Failed to save vacancy", error);
      alert("Ошибка при сохранении вакансии");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {isEditMode ? "Редактирование вакансии" : "Создание вакансии"}
        </h1>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6 bg-white p-6 rounded-lg shadow"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Название
            </label>
            <input
              {...register("title", { required: true })}
              className="input-field mt-1 block w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Описание
            </label>
            <textarea
              {...register("description", { required: true })}
              rows={4}
              className="input-field mt-1 block w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Требования
            </label>
            <textarea
              {...register("requirements")}
              rows={3}
              className="input-field mt-1 block w-full"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Тип
              </label>
              <select
                {...register("type")}
                className="input-field mt-1 block w-full"
              >
                <option value="vacancy">Вакансия</option>
                <option value="internship">Стажировка</option>
                <option value="project">Проект</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Специализация
              </label>
              <select
                {...register("specialization")}
                className="input-field mt-1 block w-full"
              >
                <option value="backend">Backend</option>
                <option value="frontend">Frontend</option>
                <option value="design">Design</option>
                <option value="management">Management</option>
                <option value="qa">QA</option>
                <option value="analytics">Analytics</option>
                <option value="devops">DevOps</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Зарплата от
              </label>
              <input
                type="number"
                {...register("salary_from")}
                className="input-field mt-1 block w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Зарплата до
              </label>
              <input
                type="number"
                {...register("salary_to")}
                className="input-field mt-1 block w-full"
              />
            </div>
            <div className="flex items-center mt-6">
              <input
                type="checkbox"
                {...register("is_salary_hidden")}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Скрыть зарплату
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Город
              </label>
              <input
                {...register("city")}
                className="input-field mt-1 block w-full"
              />
            </div>
            <div className="flex items-center mt-6">
              <input
                type="checkbox"
                {...register("is_remote")}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Можно удаленно
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={() => navigate("/employer/vacancies")}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg mr-4 hover:bg-gray-300"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? "Сохранение..." : "Сохранить"}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default VacancyEditPage;
