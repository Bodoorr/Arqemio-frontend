import Client from "./api";

const BASE = "/company/equipments";
const RESERVATIONS = `${BASE}/reservations`;

export const GetAllEquipments = async () => (await Client.get(BASE)).data;

export const GetEquipmentById = async (id) =>
  (await Client.get(`${BASE}/${id}`)).data;

export const CreateEquipment = async (data) =>
  (await Client.post(BASE, data)).data;

export const UpdateEquipment = async (id, data) =>
  (await Client.put(`${BASE}/${id}`, data)).data;

export const ArchiveEquipment = async (id) =>
  (await Client.delete(`${BASE}/${id}`)).data;

export const GetAllReservations = async () =>
  (await Client.get(RESERVATIONS)).data;

export const GetEquipmentAvailability = async (
  equipmentId,
  startDateTime,
  endDateTime,
) =>
  (
    await Client.get(`${RESERVATIONS}/availability/${equipmentId}`, {
      params: { startDateTime, endDateTime },
    })
  ).data;

export const UploadEquipmentImage = async (file, companyId) => {
  const data = new FormData();
  data.append("file", file);
  data.append("companyId", companyId);

  const response = await Client.post(`${BASE}/upload-image`, data);

  return response.data.imageUrl;
};
