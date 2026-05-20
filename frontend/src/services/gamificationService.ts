import api from "./api";
import { UserGamification } from "@/types/gamification";

export const getUserGamification = async (userId: number) => {
  const response = await api.get<UserGamification>(
    `/api/gamification/users/${userId}`,
  );
  return response.data;
};
