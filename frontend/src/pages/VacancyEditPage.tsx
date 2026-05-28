import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Layout } from "@/components/Layout";
import { createVacancy, updateVacancy } from "@/services/employerService";
import { getVacancy } from "@/services/vacancyService";
import { VacancyType } from "@/types/vacancy";
import { useToast } from "@/components/animations";

interface VacancyForm {
  title: string;
  description: string;
  requirements: string;
  duties: string;
  type: VacancyType;
  specialization: string;
  schedule: string;
  salary_from?: number;
  salary_to?: number;
  is_salary_hidden: boolean;
  city?: string;
  is_remote: boolean;
  expires_at: string;
}

const VacancyEditPage: React.FC = () => {
  const { id } = useParams(); // If id exists, it's edit mode
  const isEditMode = !!id;
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { register, handleSubmit, setValue } = useForm<VacancyForm>({
    defaultValues: {
      duties: "",
      schedule: "full_time",
      expires_at: "",
      requirements: "",
      is_salary_hidden: false,
      is_remote: false,
      type: VacancyType.VACANCY,
      specialization: "backend",
    },
  });
  const [loading, setLoading] = useState(false);
  const isInternshipRoute = location.pathname.startsWith("/employer/internships");

  useEffect(() => {
    if (isEditMode && id) {
      loadVacancy(parseInt(id));
      return;
    }

    const typeParam = searchParams.get("type");
    if (typeParam === VacancyType.INTERNSHIP || isInternshipRoute) {
      setValue("type", VacancyType.INTERNSHIP);
    }
  }, [id, isEditMode, isInternshipRoute, searchParams, setValue]);

  const loadVacancy = async (vacancyId: number) => {
    try {
      const data = await getVacancy(vacancyId);
      // Populate form
      setValue("title", data.title);
      setValue("description", data.description);
      setValue("requirements", data.requirements || "");
      setValue("duties", data.duties || "");
      setValue("type", data.type);
      setValue("specialization", data.specialization);
      setValue("schedule", data.schedule || "full_time");
      setValue("salary_from", data.salary_from);
      setValue("salary_to", data.salary_to);
      setValue("is_salary_hidden", data.is_salary_hidden);
      setValue("city", data.city);
      setValue("is_remote", data.is_remote);
      setValue(
        "expires_at",
        data.expires_at ? data.expires_at.slice(0, 16) : "",
      );
    } catch (error) {
      console.error("Failed to load vacancy", error);
    }
  };

  const onSubmit = async (data: VacancyForm) => {
    setLoading(true);
    try {
      let expiresISO: string | undefined;
      if (data.expires_at?.trim()) {
        const d = new Date(data.expires_at);
        if (!Number.isNaN(d.getTime())) {
          expiresISO = d.toISOString();
        }
      }

      const parseSalary = (v: unknown): number | undefined => {
        if (v === "" || v === null || v === undefined) return undefined;
        const n = typeof v === "number" ? v : Number(String(v).trim());
        return Number.isFinite(n) ? Math.trunc(n) : undefined;
      };
      const salaryFrom = parseSalary(data.salary_from);
      const salaryTo = parseSalary(data.salary_to);

      const payload: Record<string, unknown> = {
        title: data.title.trim(),
        description: data.description.trim(),
        type: data.type,
        specialization: data.specialization,
        status: "active",
        is_salary_hidden: data.is_salary_hidden,
        is_remote: data.is_remote,
        requirements: data.requirements?.trim() || undefined,
        duties: data.duties?.trim() || undefined,
        schedule: data.schedule?.trim() || undefined,
        city: data.city?.trim() || undefined,
        expires_at: expiresISO,
      };
      if (salaryFrom !== undefined) payload.salary_from = salaryFrom;
      if (salaryTo !== undefined) payload.salary_to = salaryTo;

      if (isEditMode && id) {
        await updateVacancy(parseInt(id), payload);
      } else {
        await createVacancy(payload);
      }
      const targetList =
        data.type === VacancyType.INTERNSHIP || isInternshipRoute
          ? "/employer/internships"
          : "/employer/vacancies";
      toast(isEditMode ? "Изменения сохранены" : "Вакансия опубликована", "success");
      navigate(targetList);
    } catch (error) {
      console.error("Failed to save vacancy", error);
      toast("Не удалось сохранить вакансию", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {isEditMode
            ? "Редактирование вакансии"
            : isInternshipRoute
              ? "Создание стажировки"
              : "Создание вакансии"}
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

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Обязанности
            </label>
            <textarea
              {...register("duties")}
              rows={3}
              className="input-field mt-1 block w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              График (код для фильтров: full_time, hybrid, remote…)
            </label>
            <input
              {...register("schedule")}
              className="input-field mt-1 block w-full"
              placeholder="full_time"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Дата окончания публикации
            </label>
            <input
              type="datetime-local"
              {...register("expires_at")}
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
