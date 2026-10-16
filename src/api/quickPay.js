import client from "./client";

export async function initiateQuickPayment(data) {
  return client.post("/quick-pay/initiate", data);
}

export async function getQuickPaymentStatus(paymentNumber) {
  return client.get(`/quick-pay/${paymentNumber}`);
}

export async function getAdminQuickPayments() {
  return client.get("/admin/bulk/quick-payments");
}
