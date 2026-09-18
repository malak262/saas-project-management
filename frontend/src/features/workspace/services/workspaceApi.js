import axios from "axios";

const workspaceClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080",
});

export const getWorkspaces = async () => {
    const response = await workspaceClient.get("/api/workspaces");

    return response.data;
};

export const getWorkspaceById = async (id) => {
    const response = await workspaceClient.get(`/api/workspaces/${id}`);

    return response.data;
};

export const createWorkspace = async (data) => {
    const response = await workspaceClient.post("/api/workspaces", data);

    return response.data;
};

export const getMembers = async (workspaceId) => {
    const response = await workspaceClient.get(`/api/workspaces/${workspaceId}/members`);

    return response.data;
};

export const addMember = async (workspaceId, data) => {
    const response = await workspaceClient.post(`/api/workspaces/${workspaceId}/members`, data);

    return response.data;
};

export const removeMember = async (workspaceId, userId) => {
    await workspaceClient.delete(`/api/workspaces/${workspaceId}/members/${userId}`);
};

export const updateMemberRole = async (workspaceId, userId, role) => {
    const response = await workspaceClient.put(
        `/api/workspaces/${workspaceId}/members/${userId}/role`,
        { role },
    );

    return response.data;
};
