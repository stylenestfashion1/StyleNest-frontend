import client from "./client";

export const getCheckout = () => client.get("/checkout");
export const getMyOrders = () => client.get("/orders");
export const placeOrder = (data) => client.post("/orders", data);
export const getOrder = (id) => client.get(`/orders/${id}`);
export const cancelOrder = (id) => client.put(`/orders/${id}/cancel`);
export const getOrderInvoice = (id) => client.get(`/orders/${id}/invoice`);
export const getOrderInvoicePdfBlob = (id) => client.get(`/orders/${id}/invoice/pdf`, { responseType: "blob" });

export const createGuestOrder = (data) => client.post("/guest/orders", data);
export const getGuestOrderInvoiceView = (params) => client.get("/guest/orders/invoice/view", { params });
export const getGuestOrderInvoicePdfBlob = (params) => client.get("/guest/orders/invoice", { params, responseType: "blob" });
export const trackGuestOrder = (data) => client.post("/guest/orders/track", data);

export const calculateShipping = (data) => client.post("/shipping/calculate", data);
