import axios, { type InternalAxiosRequestConfig } from "axios";

// Same-origin "/api" is proxied to the backend by the rewrite in next.config.ts, so the
// httpOnly auth cookies are first-party and the browser attaches them automatically:
// no Authorization header, no token in JS.
// ponytail: client-side only; a relative baseURL has no host on the server.
const AxiosInstance = axios.create({
  baseURL: "/api",
  timeout: 30_000,
  withCredentials: true,
});

// Single in-flight refresh shared by every caller, so concurrent 401s trigger one refresh.
// The server rotates both cookies in the response; nothing to store here.
let refreshPromise: Promise<void> | null = null;

export const refreshSession = (): Promise<void> => {
  refreshPromise ??= axios
    .post("/api/auth/refresh-token", {}, { withCredentials: true })
    .then(() => undefined)
    .finally(() => {
      refreshPromise = null;
    });
  return refreshPromise;
};

AxiosInstance.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // backend sends TOKEN_EXPIRED only when the access cookie is gone/expired but a
    // refresh cookie is still present (see authenticate.middleware.ts)
    if (
      error.response?.status === 401 &&
      error.response?.data?.error === "TOKEN_EXPIRED" &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true; // prevent infinite retry loops
      await refreshSession();
      return AxiosInstance(originalRequest);
    }

    return Promise.reject(error);
  },
);

export default AxiosInstance;
