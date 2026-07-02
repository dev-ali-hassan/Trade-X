import axios from "axios";

export const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() || "";
export const hasConfiguredApiBaseUrl = Boolean(configuredApiBaseUrl);

export const api = axios.create({
  baseURL: configuredApiBaseUrl || "/api"
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("tradex_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
