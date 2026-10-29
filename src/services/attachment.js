import Client from "./api";

const BASE = "/company/projects/attachments";

export const UploadExpenseAttachment = async (file, projectId, expenseId) => {
  const formData = new FormData();

  formData.append("file", file);
  formData.append("projectId", projectId);
  formData.append("expenseId", expenseId);

  const response = await Client.post(BASE, formData);

  return response.data;
};

export const GetExpenseAttachments = async (expenseId) => {
  const response = await Client.get(`${BASE}/expense/${expenseId}`);
  return response.data;
};

export const ArchiveAttachment = async (attachmentId) => {
  const response = await Client.delete(`${BASE}/${attachmentId}`);
  return response.data;
};

export const UploadProjectUpdateAttachment = async (
  file,
  projectId,
  projectUpdateId,
) => {
  const formData = new FormData();

  formData.append("file", file);
  formData.append("projectId", projectId);
  formData.append("projectUpdateId", projectUpdateId);

  const response = await Client.post(BASE, formData);
  return response.data;
};

export const GetProjectUpdateAttachments = async (projectUpdateId) => {
  const response = await Client.get(`${BASE}/update/${projectUpdateId}`);
  return response.data;
};
