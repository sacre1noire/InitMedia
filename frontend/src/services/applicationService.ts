import api from "./api";
import { Application } from "../types/application";

export const getMyApplications = async () => {
  const response = await api.get<Application[]>("/api/applications/my");
  return response.data;
};

export const deleteApplication = async (id: number) => {
  const response = await api.delete(`/api/applications/${id}`);
  return response.data;
};
