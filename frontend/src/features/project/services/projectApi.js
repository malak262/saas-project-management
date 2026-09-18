import axios from "axios";

const projectClient = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080" });
export const getProjects = async () => (await projectClient.get("/api/projects")).data;
export const getProject = async (id) => (await projectClient.get(`/api/projects/${id}`)).data;
export const getProjectsByWorkspace = async (workspaceId) => (await projectClient.get(`/api/projects/workspace/${workspaceId}`)).data;
export const createProject = async (data) => (await projectClient.post("/api/projects", data)).data;
export const updateProject = async (id, data) => (await projectClient.put(`/api/projects/${id}`, data)).data;
export const deleteProject = async (id) => { await projectClient.delete(`/api/projects/${id}`); };
