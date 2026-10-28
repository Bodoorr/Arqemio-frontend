import Client from "./api";

const BASE_URL = "/company/equipments";

export const GetAllEquipments = async () => {
  const response = await Client.get(BASE_URL);
  return response.data;
};

export const GetEquipmentById = async (equipmentId) => {
  const response = await Client.get(`${BASE_URL}/${equipmentId}`);
  return response.data;
};

export const CreateEquipment = async (data) => {
  const response = await Client.post(BASE_URL, data);
  return response.data;
};

export const UpdateEquipment = async (equipmentId, data) => {
  const response = await Client.put(`${BASE_URL}/${equipmentId}`, data);
  return response.data;
};

export const ArchiveEquipment = async (equipmentId) => {
  const response = await Client.delete(`${BASE_URL}/${equipmentId}`);
  return response.data;
};
