import api from "./api";
import {
    Company,
    CompanyCreateRequest,
    CompanyListParams,
    CompanyUpdateRequest,
} from "@/types/company";

export const getCompanies = async (params?: CompanyListParams) => {
    const response = await api.get<Company[]>("/api/companies", { params });
    return response.data;
};

export const getCompanyById = async (id: number) => {
    const response = await api.get<Company>(`/api/companies/${id}`);
    return response.data;
};

export const createCompany = async (payload: CompanyCreateRequest) => {
    const response = await api.post<Company>("/api/companies", payload);
    return response.data;
};

export const updateCompany = async (id: number, payload: CompanyUpdateRequest) => {
    const response = await api.put<Company>(`/api/companies/${id}`, payload);
    return response.data;
};
