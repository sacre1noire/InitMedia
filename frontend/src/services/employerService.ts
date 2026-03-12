import api from "./api";
import { Vacancy } from "../types/vacancy";
import { Application } from "../types/application";
import { ApplicationStatus } from "../types/application";

export const getMyVacancies = async () => {
  const response = await api.get<Vacancy[]>("/api/employer/vacancies");
  return response.data;
};

export const createVacancy = async (data: any) => {
  const response = await api.post<Vacancy>("/api/employer/vacancies", data);
  return response.data;
};

export const updateVacancy = async (id: number, data: any) => {
  const response = await api.put<Vacancy>(
    `/api/employer/vacancies/${id}`,
    data,
  );
  return response.data;
};

export const deleteVacancy = async (id: number) => {
  const response = await api.delete(`/api/employer/vacancies/${id}`);
  return response.data;
};

export const getMyApplications = async () => {
  const response = await api.get<Application[]>("/api/employer/applications");
  return response.data;
};

export const updateApplicationStatus = async (
  id: number,
  status: ApplicationStatus,
) => {
  const response = await api.patch<Application>(
    `/api/employer/applications/${id}/status`,
    { status },
  );
  return response.data;
};

export const searchCandidates = async (search?: string) => {
  const response = await api.get<any[]>("/api/employer/candidates", {
    params: { search },
  });
  return response.data;
};

export const getCandidate = async (id: number) => {
  const response = await api.get<any>(`/api/employer/candidates/${id}`);
  return response.data;
};
