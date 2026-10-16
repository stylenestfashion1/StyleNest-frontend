import client from "./client";

export async function initiateQuickPayment(data) {
  return client.post("/quick-pay/initiate", data);
}

export async function getQuickPaymentStatus(paymentNumber) {
  return client.get(`/quick-pay/${paymentNumber}`);
}
