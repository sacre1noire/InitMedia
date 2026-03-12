export enum VacancyType {
  INTERNSHIP = "internship",
  VACANCY = "vacancy",
  PROJECT = "project",
}

export enum VacancyStatus {
  DRAFT = "draft",
  ACTIVE = "active",
  ARCHIVED = "archived",
  MODERATION = "moderation",
}

export interface Company {
  id: number;
  name: string; 
  description?: string;
  website?: string;
  logo_url?: string;
}

export interface Vacancy {
  id: number;
  company_id: number;
  company?: Company; // Added company object
  title: string;
  description: string;
  requirements?: string;
  type: VacancyType;
  specialization: string; // Enum string from backend
  schedule?: string;
  salary_from?: number;
  salary_to?: number;
  is_salary_hidden: boolean;
  city?: string;
  is_remote: boolean;
  status: VacancyStatus;
  created_at: string;
  updated_at?: string;
}
  expires_at?: string;
  company?: {
    id: number;
    name: string;
    logo_url?: string;
    city?: string;
  };
}

export interface VacancyListResponse {
  items: Vacancy[];
  total: number;
}
