import { apiRequest } from "./apiClient";

export const listFridges = () => apiRequest("/api/fridge/list");

export const createFridge = (data) =>
  apiRequest("/api/fridge/create", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const getFridge = (fridgeId) => apiRequest(`/api/fridge/${fridgeId}`);

export const listRules = (fridgeId) =>
  apiRequest(`/api/fridge/${fridgeId}/rules/list`);

export const listMeasurements = (
  fridgeId,
  { startDate, endDate, granularity } = {},
) => {
  const params = new URLSearchParams();
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  if (granularity != null) params.set("granularity", String(granularity));
  const qs = params.toString();
  return apiRequest(
    `/api/fridge/${fridgeId}/measurement/list${qs ? `?${qs}` : ""}`,
  );
};
