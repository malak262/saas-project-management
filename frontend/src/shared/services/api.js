import axios from "axios";
import { useSession } from "../store/session";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "",
  timeout: 20000,
});
api.interceptors.request.use((config) => {
  const token = useSession.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const payload = error.response?.data?.error;
    error.message =
      payload?.message ||
      (status === 429
        ? "Too many attempts. Please wait a minute and try again."
        : error.code === "ECONNABORTED"
          ? "This request took too long. Please try again."
          : status
            ? "The request could not be completed. Please try again."
            : "Unable to reach Teamflow. Check your connection and try again.");
    error.fields = payload?.fields || {};
    if (status === 401 && !error.config?.url?.startsWith("/api/auth/"))
      useSession.getState().signOut();
    return Promise.reject(error);
  },
);
export const get = async (path) => (await api.get(path)).data;
export const post = async (path, data = {}) =>
  (await api.post(path, data)).data;
export const put = async (path, data = {}) => (await api.put(path, data)).data;
export const remove = async (path) => {
  await api.delete(path);
};
export const refresh = () =>
  window.dispatchEvent(new Event("teamflow:refresh"));
