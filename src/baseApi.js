import axios from "axios";
import { useAuthStore } from "./store/authStore";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "https://api-field.gravitycat.tw/v1";

const instance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

let refreshPromise;

export function refreshSession() {
  if (!refreshPromise) {
    const tokenBeforeRefresh = useAuthStore.getState().token;
    refreshPromise = instance.post("/auth/refresh").then(({ data }) => {
      if (!data?.access_token || !data?.user?.id) {
        throw new Error("Session refresh did not return an access token and user");
      }
      if (useAuthStore.getState().token === tokenBeforeRefresh) {
        useAuthStore.getState().setAuth(data);
      }
      return data;
    }).finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

// Attach the current session token when available.
instance.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;

  if (token && !config.url?.startsWith("/auth/")) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error.config;
    if (error.response?.status !== 401 || !request || request._retriedAfterRefresh || request.url?.startsWith("/auth/")) {
      return Promise.reject(error);
    }
    request._retriedAfterRefresh = true;
    try {
      await refreshSession();
      return instance(request);
    } catch (refreshError) {
      if (refreshError.response?.status === 401) {
        useAuthStore.getState().setLogout();
        if (window.location.pathname.startsWith("/external/") || window.location.pathname.startsWith("/ntust/")) {
          window.location.assign("/");
        }
      }
      return Promise.reject(refreshError);
    }
  },
);

export default instance;
