import api from "@/lib/axiosInstance";
import type { ApiResponse, AuthUser } from "../types";
import type { LoginInput, RegisterInput } from "../schema/auth.schema";

type UserResponse = ApiResponse<{ user: AuthUser }>;

export const authApi = {
  login: (body: LoginInput) => api.post<UserResponse>("/auth/login", body).then((r) => r.data.data.user),
  register: (body: RegisterInput) =>
    api.post<UserResponse>("/auth/register", body).then((r) => r.data.data.user),
  me: () => api.get<UserResponse>("/auth/me").then((r) => r.data.data.user),
  logout: () => api.post("/auth/logout"),
};
