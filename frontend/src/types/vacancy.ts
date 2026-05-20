export enum VacancyType {
  INTERNSHIP = "internship",
  VACANCY = "vacancy",
  PROJECT = "project",
}

export enum VacancyStatus {
  ACTIVE = "active",
  ARCHIVED = "archived",
}

export interface Company {
  id: number;
  name: string;
  description?: string;
  website?: string;
  logo_url?: string;
  city?: string;
}

export interface Vacancy {
  id: number;
  company_id: number;
  company?: Company;
  title: string;
  description: string;
  requirements?: string;
  duties?: string;
  type: VacancyType;
  specialization: string;
  schedule?: string;
  salary_from?: number;
  salary_to?: number;
  is_salary_hidden: boolean;
  city?: string;
  is_remote: boolean;
  status: VacancyStatus;
  created_at: string;
  updated_at?: string;
  expires_at?: string;
  published_at?: string;
  applications_count?: number;
}

export interface VacancyListResponse {
  items: Vacancy[];
  total: number;
}
