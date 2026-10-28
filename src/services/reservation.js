import Client from "./api";

const BASE = "/company/equipments/reservations";

export const CreateReservation = async (data) => {
  const response = await Client.post(BASE, data);
  return response.data;
};

export const GetAllReservations = async () => {
  const response = await Client.get(BASE);
  return response.data;
};

export const GetEquipmentAvailability = async (
  equipmentId,
  startDateTime,
  endDateTime,
) => {
  const response = await Client.get(`${BASE}/availability/${equipmentId}`, {
    params: { startDateTime, endDateTime },
  });
  return response.data;
};

export const CancelReservation = async (reservationId) => {
  const response = await Client.delete(`${BASE}/${reservationId}`);
  return response.data;
};
