export function sanitizeErrorMessage(error) {
  const status = error.response?.status;
  const rawMsg =
    error.response?.data?.message ||
    error.response?.data?.error ||
    error.message;

  if (error.code === "ECONNABORTED" || error.message === "Network Error" || !error.response) {
    return "Unable to connect to the server. Please check your internet connection.";
  }

  if (status === 401) {
    if (typeof rawMsg === "string" && !/exception|trace|sql|\/api|status code/i.test(rawMsg) && rawMsg.trim()) {
      return rawMsg;
    }
    return "Invalid credentials or session expired. Please sign in again.";
  }

  if (status === 403) {
    return "You do not have permission to perform this action.";
  }

  if (status === 404) {
    return "The requested resource was not found.";
  }

  if (status >= 500) {
    return "Unable to process request at this time. Please try again.";
  }

  if (typeof rawMsg === "string") {
    if (
      /\/api\/|https?:\/\/|status code \d+|nullpointer|sql|exception|at com\.|org\.spring|syntax error|<html|<body/i.test(
        rawMsg
      )
    ) {
      return "Unable to process request at this time. Please try again.";
    }
    return rawMsg;
  }

  return "Unable to process request at this time. Please try again.";
}

import axios from "axios";

export const TOKEN_KEY = "stylenest_token";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  headers: { "Content-Type": "application/json" },
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let onUnauthorized = null;
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

client.interceptors.response.use(
  (response) => {
    const body = response.data;
    if (body && typeof body === "object" && "success" in body && "data" in body) {
      return body.data;
    }
    return body;
  },
  (error) => {
    if (error.response?.status === 401) {
      onUnauthorized?.();
    }
    const message = sanitizeErrorMessage(error);
    return Promise.reject(new Error(message));
  }
);

export default client;
