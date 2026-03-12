import api from "./api";
import { Profile, ProfileUpdateData } from "../types/profile";

export const getProfile = async (): Promise<Profile> => {
  const response = await api.get("/api/profile/me");
  return response.data; // Now calling the endpoint implemented in backend/app/api/routes/profile.py
};

export const updateProfile = async (
  data: ProfileUpdateData,
): Promise<Profile> => {
  const response = await api.put("/api/profile/me", data);
  return response.data;
};

export const uploadAvatar = async (file: File): Promise<Profile> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.patch("/api/profile/me/avatar", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};
