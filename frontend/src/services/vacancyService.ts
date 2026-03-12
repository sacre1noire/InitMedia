import api from "./api";
import { Vacancy, VacancyListResponse } from "../types/vacancy";

export const getVacancies = async (params?: {
  search?: string;
  limit?: number;
  skip?: number;
  type?: string;
  specialization?: string;
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

export const applyToVacancy = async (id: number) => {
  const response = await api.post(`/api/vacancies/${id}/apply`);
  return response.data;
};

export const applyVacancy = async (id: number) => {
  const response = await api.post(`/api/vacancies/${id}/apply`);
  return response.data;
};

