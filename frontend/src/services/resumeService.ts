import api from "./api";
import {
  Resume,
  ResumeContent,
  ResumeHelperResponse,
  ResumePreviewResponse,
  ResumeTemplate,
} from "@/types/resume";

export const getMyResumes = async () => {
  const response = await api.get<Resume[]>("/api/resumes/my");
  return response.data;
};

export const getResume = async (id: number) => {
  const response = await api.get<Resume>(`/api/resumes/${id}`);
  return response.data;
};

export const createResume = async (payload: {
  title: string;
  template_id: number;
  is_primary: boolean;
  content: ResumeContent;
}) => {
  const response = await api.post<Resume>("/api/resumes", payload);
  return response.data;
};

export const updateResume = async (
  id: number,
  payload: {
    title: string;
    template_id: number;
    is_primary: boolean;
    content: ResumeContent;
  },
) => {
  const response = await api.put<Resume>(`/api/resumes/${id}`, payload);
  return response.data;
};

export const deleteResume = async (id: number) => {
  const response = await api.delete(`/api/resumes/${id}`);
  return response.data;
};

export const getResumeTemplates = async () => {
  const response = await api.get<ResumeTemplate[]>("/api/resume-templates");
  return response.data;
};

export const getResumePreview = async (id: number) => {
  const response = await api.get<ResumePreviewResponse>(
    `/api/resumes/${id}/preview`,
  );
  return response.data;
};

export const getResumeHelper = async (id: number) => {
  const response = await api.get<ResumeHelperResponse>(
    `/api/resumes/${id}/helper`,
  );
  return response.data;
};
