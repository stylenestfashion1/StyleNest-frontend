import client from "./client";

export const initiateRazorpayPayment = () => client.post("/payments/razorpay/initiate");
export const initiateGuestRazorpayPayment = (data) => client.post("/payments/razorpay/guest/initiate", data);
export const verifyRazorpayPayment = (data) => client.post("/payments/razorpay/verify", data);
