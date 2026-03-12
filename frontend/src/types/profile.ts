export enum Specialization {
  PR = "PR",
  JOURNALISM = "Journalism",
  MEDIA_COM = "MediaCom",
  MARKETING = "Marketing",
  SMM = "SMM",
}

export enum SkillLevel {
  NOVICE = "Novice",
  BEGINNER = "Beginner",
  CONFIDENT = "Confident",
  ADVANCED = "Advanced",
}

export enum EmploymentType {
  INTERNSHIP = "internship",
  VACANCY = "vacancy",
  PROJECT = "project",
}

export enum SchedulePreference {
  FULL_TIME = "full-time",
  PART_TIME = "part-time",
  REMOTE = "remote",
  OFFICE = "office",
  HYBRID = "hybrid",
}

export interface Profile {
  id: number;
  user_id: number;
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  avatar_url?: string;
  specialization?: Specialization;
  skill_level?: SkillLevel;
  employment_types?: string[];
  schedule_preferences?: string[];
  bio?: string;
  city?: string;
  telegram?: string;
  portfolio_url?: string;
}

export interface ProfileUpdateData {
  first_name?: string;
  last_name?: string;
  phone?: string;
  specialization?: Specialization;
  skill_level?: SkillLevel;
  employment_types?: string[];
  schedule_preferences?: string[];
  bio?: string;
  city?: string;
  telegram?: string;
  portfolio_url?: string;
}
