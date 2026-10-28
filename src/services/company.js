import Client from "./api";

export const GetCompanies = async () => {
  const res = await Client.get("/company");
  return res.data;
};

export const CreateCompany = async (data) => {
  const res = await Client.post("/company", data);
  return res.data;
};
