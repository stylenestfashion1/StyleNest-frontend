import client from "./client";

export const initiateEasebuzzPayment = (data) => client.post("/payments/easebuzz/initiate", data);
export const initiateGuestEasebuzzPayment = (data) => client.post("/payments/easebuzz/guest/initiate", data);
