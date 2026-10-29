import Client from "./api";

export const GetPlatformAuditLogs = async () => {
  const response = await Client.get("/audit-logs/admin");
  return response.data;
};

export const GetCompanyAuditLogs = async (companyId) => {
  const response = await Client.get(`/audit-logs/company/${companyId}`);
  return response.data;
};
