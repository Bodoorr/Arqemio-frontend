import Client from "./api";

export const GetSharedProjectUpdate = async (token) => {
  const response = await Client.get(`/project-share/customer/${token}`);
  return response.data;
};

export const GetCustomerRegistrationEmail = async (token) => {
  const response = await Client.get(`/project-share/register/${token}`);
  return response.data;
};

export const RegisterCustomer = async (token, data) => {
  const response = await Client.post(`/project-share/register/${token}`, data);
  return response.data;
};

export const GetCustomerSharedUpdates = async () => {
  const response = await Client.get("/project-share/my-updates");
  return response.data;
};
