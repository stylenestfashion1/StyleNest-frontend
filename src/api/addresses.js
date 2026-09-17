import client from "./client";

export const getAddresses = () => client.get("/address");
export const getAddress = (id) => client.get(`/address/${id}`);
export const createAddress = (data) => client.post("/address", data);
export const updateAddress = (id, data) => client.put(`/address/${id}`, data);
export const deleteAddress = (id) => client.delete(`/address/${id}`);
export const setDefaultAddress = (id) => client.put(`/address/${id}/default`);
export const lookupPostalCode = (postalCode, countryCode) => client.get("/postal-lookup", { params: { postalCode, countryCode } });
