import { apiRequest } from "./apiClient";

export function loginUser(dtoIn) {
  return apiRequest("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(dtoIn),
  });
}

export async function logoutUser() {
  return apiRequest("/api/auth/logout", {
    method: "POST",
  });
}

export function registerUser(dtoIn) {
  return apiRequest("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(dtoIn),
  });
}

export function getUserProfile() {
  return apiRequest("/api/user/profile", {
    method: "GET",
  });
}