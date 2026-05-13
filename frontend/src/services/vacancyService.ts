import api from "./api";
import { Vacancy, VacancyListResponse } from "../types/vacancy";

export const getVacancies = async (params?: {
  search?: string;
  limit?: number;
  skip?: number;
  type?: string;
  specialization?: string;
  schedule?: string;
  city?: string;
  is_remote?: boolean;
  salary_from?: number;
  salary_to?: number;
  sort?: string;
  order?: string;
}) => {
  const response = await api.get<VacancyListResponse>("/api/vacancies", {
    params,
  });
  return response.data;
};

export const getVacancy = async (id: number) => {
  const response = await api.get<Vacancy>(`/api/vacancies/${id}`);
  return response.data;
};

export const getRecommendedVacancies = async (limit?: number) => {
  const response = await api.get<{ items: unknown[] }>(
    "/api/vacancies/recommended",
    { params: { limit } },
  );
  return response.data;
};

export const applyToVacancy = async (
  id: number,
  body?: { cover_letter?: string; resume_id?: number },
) => {
  const response = await api.post(`/api/vacancies/${id}/apply`, body ?? {});
  return response.data;
};

export const applyVacancy = async (
  id: number,
  body?: { cover_letter?: string; resume_id?: number },
) => applyToVacancy(id, body);

