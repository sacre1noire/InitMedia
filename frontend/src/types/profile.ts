export enum Specialization {
  WEB_ANALYST = "WEB_ANALYST",
  DIGITAL_ANALYST = "DIGITAL_ANALYST",
  DATA_SCIENTIST_ADS = "DATA_SCIENTIST_ADS",
  ML_ENGINEER = "ML_ENGINEER",
  FRONTEND_DEVELOPER = "FRONTEND_DEVELOPER",
  BACKEND_DEVELOPER = "BACKEND_DEVELOPER",
  MOBILE_DEVELOPER = "MOBILE_DEVELOPER",
  SEO_SPECIALIST = "SEO_SPECIALIST",
  CRM_MARKETOLOGIST = "CRM_MARKETOLOGIST",
  TRAFFIC_MANAGER = "TRAFFIC_MANAGER",
  TARGETOLOGIST = "TARGETOLOGIST",
  UX_UI_DESIGNER = "UX_UI_DESIGNER",
  PRODUCT_MANAGER_ADTECH = "PRODUCT_MANAGER_ADTECH",
  COPYWRITER = "COPYWRITER",
  CREATIVE_EDITOR = "CREATIVE_EDITOR",
  ART_DIRECTOR = "ART_DIRECTOR",
  SMM_MANAGER = "SMM_MANAGER",
  PR_MANAGER = "PR_MANAGER",
  INFLUENCER_MARKETER = "INFLUENCER_MARKETER",
  BRAND_MANAGER = "BRAND_MANAGER",
  MEDIA_PLANNER = "MEDIA_PLANNER",
  MEDIA_BUYER = "MEDIA_BUYER",
  AD_SHOOT_PRODUCER = "AD_SHOOT_PRODUCER",
  VIDEO_EDITOR = "VIDEO_EDITOR",
  MOTION_DESIGNER = "MOTION_DESIGNER",
  ACCOUNT_MANAGER = "ACCOUNT_MANAGER",
}

export enum SkillLevel {
  NOVICE = "NOVICE",
  MIDDLE = "MIDDLE",
  EXPERT = "EXPERT",
}

export enum EducationLevel {
  BACHELOR = "BACHELOR",
  MASTER = "MASTER",
  PHD = "PHD",
  SPECIALIST = "SPECIALIST",
}

export enum EmploymentType {
  OFFICE = "OFFICE",
  HYBRID = "HYBRID",
  REMOTE = "REMOTE",
}

export enum SchedulePreference {
  TWO_TWO = "2/2",
  FIVE_TWO = "5/2",
  THREE_THREE = "3/3",
}

export interface Profile {
  id: number;
  user_id: number;
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  avatar_url?: string;
  education_level?: EducationLevel;
  study_course?: number;
  university?: string;
  experience?: string;
  projects?: string;
  achievements?: string;
  skills?: string;
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
  avatar_url?: string;
  education_level?: EducationLevel;
  study_course?: number;
  university?: string;
  experience?: string;
  projects?: string;
  achievements?: string;
  skills?: string;
  specialization?: Specialization;
  skill_level?: SkillLevel;
  employment_types?: string[];
  schedule_preferences?: string[];
  bio?: string;
  city?: string;
  telegram?: string;
  portfolio_url?: string;
}
