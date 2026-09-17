import client from "./client";

export const getMe = () => client.get("/users/me");
export const updateMe = (data) => client.put("/users/me", data);
