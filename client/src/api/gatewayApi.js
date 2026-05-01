import { apiRequest } from "./apiClient";

export const listGateways = async () => {
  return await apiRequest("/api/gateway/list");
};

export const registerGateway = async (data) => {
  return await apiRequest("/api/gateway/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const listGatewayMonitors = async (gatewayId) => {
  return await apiRequest(`/api/gateway/${gatewayId}/monitor/list`);
};

export const updateGateway = async (gatewayId, data) => {
  return await apiRequest(`/api/gateway/update/${gatewayId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
};

export const deleteGateway = async (gatewayId) => {
  return await apiRequest(`/api/gateway/delete/${gatewayId}`, {
    method: "DELETE",
  });
};