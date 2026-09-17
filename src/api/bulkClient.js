import axios from "axios";

// Deliberately separate from the main api/client.js instance. Bulk-order
// customers are never authenticated Users/JWT holders -- they carry a
// short-lived X-Bulk-Token header instead -- and critically, the shared
// client's response interceptor calls logout() on ANY 401 (see
// AuthContext's setUnauthorizedHandler). A wrong/expired bulk access code
// is a 401 from the backend too (see GlobalExceptionHandler's
// BulkTokenInvalidException/BulkTokenExpiredException handlers), so if
// bulk calls went through the shared client, a customer mistyping a code
// -- or an admin testing the bulk flow while logged into their own admin
// session in the same browser -- would get silently logged out of their
// real account. This instance never touches that handler.

export const BULK_TOKEN_KEY = "stylenest_bulk_token";

const bulkClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  headers: { "Content-Type": "application/json" },
});

bulkClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem(BULK_TOKEN_KEY);
  if (token) {
    config.headers["X-Bulk-Token"] = token;
  }
  return config;
});

bulkClient.interceptors.response.use(
  (response) => {
    const body = response.data;
    if (body && typeof body === "object" && "success" in body && "data" in body) {
      return body.data;
    }
    return body;
  },
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong. Please try again.";
    return Promise.reject(new Error(message));
  }
);

export function setBulkToken(token) {
  sessionStorage.setItem(BULK_TOKEN_KEY, token);
}

export function getBulkToken() {
  return sessionStorage.getItem(BULK_TOKEN_KEY);
}

export function clearBulkToken() {
  sessionStorage.removeItem(BULK_TOKEN_KEY);
}

export default bulkClient;
