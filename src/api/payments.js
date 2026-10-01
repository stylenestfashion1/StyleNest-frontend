import client from "./client";

export const initiatePayment = () => client.post("/payments/initiate");
export const initiateGuestPayment = (data) => client.post("/payments/guest/initiate", data);
export const verifyPayment = (data) => client.post("/payments/verify", data);
