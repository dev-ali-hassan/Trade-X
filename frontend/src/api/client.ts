import axios from "axios";

export const configuredApiUrl = import.meta.env.VITE_API_URL?.trim() || "";

export const api = axios.create({
  baseURL: configuredApiUrl || "/api",
  timeout: 45_000
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("tradex_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
