import Client from "./api";

const BASE = "/company/projects/updates";

export const GetProjectUpdates = async (projectId) => {
  const response = await Client.get(`${BASE}/project/${projectId}`);
  return response.data;
};

export const GetProjectUpdateById = async (updateId) => {
  const response = await Client.get(`${BASE}/${updateId}`);
  return response.data;
};

export const CreateProjectUpdate = async (data) => {
  const response = await Client.post(BASE, data);
  return response.data;
};

export const UpdateProjectUpdate = async (updateId, data) => {
  const response = await Client.put(`${BASE}/${updateId}`, data);
  return response.data;
};

export const ArchiveProjectUpdate = async (updateId) => {
  const response = await Client.delete(`${BASE}/${updateId}`);
  return response.data;
};

export const ReviewProjectUpdate = async (updateId, data) => {
  const response = await Client.patch(`${BASE}/${updateId}/review`, data);
  return response.data;
};

export const ShareProjectUpdate = async (updateId, data) => {
  const response = await Client.post(`/project-share/${updateId}`, data);
  return response.data;
};
