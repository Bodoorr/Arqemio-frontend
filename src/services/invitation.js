import Client from "./api";

export const ValidateInvitation = async (token) => {
  const res = await Client.get(`/invitation/validate/${token}`);
  return res.data;
};

export const RegisterInvitation = async (data) => {
  const res = await Client.post("/invitation/register", data);
  return res.data;
};
