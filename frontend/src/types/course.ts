export const COURSE_STATUS = {
  DRAFT: "draft",
  PUBLISHED: "published",
  ARCHIVED: "archived",
} as const;

export type CourseStatus = (typeof COURSE_STATUS)[keyof typeof COURSE_STATUS];

export interface Lesson {
  id: number;
  course_id: number;
  title: number;
  content: string;
  video_url?: string;
  order: number;
}

export interface Course {
  id: number;
  title: string;
  description: string;
  cover_url?: string;
  specializations?: string[];
  duration_minutes: number;
  is_free: boolean;
  order: number;
  status: CourseStatus;
  lessons: Lesson[];
}

export interface CourseProgress {
  id: number;
  course_id: number;
  user_id: number;
  completed_lessons: number[];
  started_at: string;
  completed_at?: string;
}
