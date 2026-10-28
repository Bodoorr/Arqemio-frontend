import Client from "./api";

const BASE_URL = "/company/projects";

export const CreateProject = async (data) => {
  const res = await Client.post(BASE_URL, data);
  return res.data;
};

export const GetProjects = async () => {
  const res = await Client.get(BASE_URL);
  return res.data;
};

export const SearchProjects = async ({
  page = 0,
  size = 5,
  sortBy = "id",
  ascending = true,
  name,
  status,
} = {}) => {
  const res = await Client.get(`${BASE_URL}/search`, {
    params: {
      page,
      size,
      sortBy,
      ascending,
      ...(name ? { name } : {}),
      ...(status ? { status } : {}),
    },
  });

  return res.data;
};

export const GetProjectById = async (projectId) => {
  const res = await Client.get(`${BASE_URL}/${projectId}`);
  return res.data;
};

export const UpdateProject = async (projectId, data) => {
  const res = await Client.put(`${BASE_URL}/${projectId}`, data);
  return res.data;
};

export const ArchiveProject = async (projectId) => {
  const res = await Client.delete(`${BASE_URL}/${projectId}`);
  return res.data;
};

export const AssignProjectManager = async (projectId, membershipId) => {
  const res = await Client.post(
    `${BASE_URL}/${projectId}/managers/${membershipId}`,
  );
  return res.data;
};

export const RemoveProjectManager = async (projectId, membershipId) => {
  const res = await Client.delete(
    `${BASE_URL}/${projectId}/managers/${membershipId}`,
  );
  return res.data;
};

export const AssignProjectWorker = async (projectId, membershipId) => {
  const res = await Client.post(
    `${BASE_URL}/${projectId}/workers/${membershipId}`,
  );
  return res.data;
};

export const RemoveProjectWorker = async (projectId, membershipId) => {
  const res = await Client.delete(
    `${BASE_URL}/${projectId}/workers/${membershipId}`,
  );
  return res.data;
};
