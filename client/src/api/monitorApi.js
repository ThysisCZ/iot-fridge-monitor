import { apiRequest } from "./apiClient";

export const getMonitor = (monitorId) => apiRequest(`/api/monitor/${monitorId}`);

export const addMonitorToFridge = (monitorId, fridgeId) =>
  apiRequest(`/api/monitor/${monitorId}/addFridge/${fridgeId}`, { method: "PATCH" });

export const removeMonitorFromFridge = (monitorId, fridgeId) =>
  apiRequest(`/api/monitor/${monitorId}/removeFridge/${fridgeId}`, { method: "PATCH" });

export const deleteMonitor = (monitorId) =>
  apiRequest(`/api/monitor/delete/${monitorId}`, { method: "DELETE" });
