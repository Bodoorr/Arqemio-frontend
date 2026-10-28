import Client from "./api";

export const GetAllTasks = async () => {
  const response = await Client.get("/company/projects/tasks");
  return response.data;
};

export const GetTaskById = async (taskId) => {
  const response = await Client.get(`/company/projects/tasks/${taskId}`);
  return response.data;
};

export const CreateTask = async (taskData) => {
  const response = await Client.post("/company/projects/tasks", taskData);
  return response.data;
};

export const UpdateTask = async (taskId, taskData) => {
  const response = await Client.put(
    `/company/projects/tasks/${taskId}`,
    taskData,
  );
  return response.data;
};

export const ArchiveTask = async (taskId) => {
  const response = await Client.delete(`/company/projects/tasks/${taskId}`);
  return response.data;
};

export const UpdateTaskStatus = async (taskId, status) => {
  const response = await Client.patch(
    `/company/projects/tasks/${taskId}/status`,
    { status },
  );
  return response.data;
};

export const AssignTaskWorker = async (taskId, assignmentData) => {
  const response = await Client.post(
    `/company/projects/tasks/${taskId}/assignments`,
    assignmentData,
  );
  return response.data;
};

export const RemoveTaskWorker = async (taskId, workerMembershipId) => {
  const response = await Client.delete(
    `/company/projects/tasks/${taskId}/assignments/${workerMembershipId}`,
  );
  return response.data;
};
