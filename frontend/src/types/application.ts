import { Vacancy } from "./vacancy";
import { User } from "./auth";

export enum ApplicationStatus {
  PENDING = "pending",
  VIEWED = "viewed",
  ACCEPTED = "accepted",
  REJECTED = "rejected",
}

export interface Application {
  id: number;
  status: ApplicationStatus;
  created_at: string;
  updated_at?: string;
  vacancy: Vacancy;
  applicant?: User; // Available for employer
  resume_id?: number;
}
