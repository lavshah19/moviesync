import api from "@/lib/axiosInstance";
import type { ApiResponse } from "@/modules/auth/types";

// 60s ticket for the socket handshake (the httpOnly cookie can't reach the socket server).
// Goes through the axios instance, so an expired access token is refreshed first.
export const socketApi = {
  ticket: () =>
    api.get<ApiResponse<{ ticket: string }>>("/auth/socket-ticket").then((r) => r.data.data.ticket),
};
