import Client from "./api";

export const GetProfile = async () => {
  const response = await Client.get("/users/profile");
  return response.data;
};

export const UpdateProfile = async (data) => {
  const response = await Client.patch("/users/profile", data);
  return response.data;
};

export const ChangePassword = async (data) => {
  const response = await Client.patch("/users/change-password", data);
  return response.data;
};
