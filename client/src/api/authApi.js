import { apiRequest } from "./apiClient";

export function loginUser(dtoIn) {
  return apiRequest("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(dtoIn),
  });
}

export async function logoutUser() {
  const token = localStorage.getItem("token");

  await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/logout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
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