import Client from "./api";

const BASE = "/company/projects/expenses";

export const GetAllExpenses = async () => {
  const response = await Client.get(BASE);
  return response.data;
};

export const GetExpenseById = async (expenseId) => {
  const response = await Client.get(`${BASE}/${expenseId}`);
  return response.data;
};

export const CreateExpense = async (data) => {
  const response = await Client.post(BASE, data);
  return response.data;
};

export const UpdateExpense = async (expenseId, data) => {
  const response = await Client.put(`${BASE}/${expenseId}`, data);
  return response.data;
};

export const ArchiveExpense = async (expenseId) => {
  const response = await Client.delete(`${BASE}/${expenseId}`);
  return response.data;
};
