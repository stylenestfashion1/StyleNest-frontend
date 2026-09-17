import client from "./client";

export const login = (data) => client.post("/auth/login", data);
export const register = (data) => client.post("/auth/register", data);
export const forgotPassword = (data) => client.post("/auth/forgot-password", data);
export const verifyOtp = (data) => client.post("/auth/verify-otp", data);
export const resetPassword = (data) => client.post("/auth/reset-password", data);
