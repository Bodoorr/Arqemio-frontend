import Client from "./api";

const BASE = "/company/expenses";

export const GetAllExpenses = async () => {
  const response = await Client.get(BASE);
  return response.data;
};

export const GetExpenseById = async (id) => {
  const response = await Client.get(`${BASE}/${id}`);
  return response.data;
};

export const CreateExpense = async (data) => {
  const response = await Client.post(BASE, data);
  return response.data;
};

export const UpdateExpense = async (id, data) => {
  const response = await Client.put(`${BASE}/${id}`, data);
  return response.data;
};

export const DeleteExpense = async (id) => {
  const response = await Client.delete(`${BASE}/${id}`);
  return response.data;
};
