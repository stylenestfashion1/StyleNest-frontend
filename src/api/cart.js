import client from "./client";

export const getCart = () => client.get("/cart");
export const addToCart = (data) => client.post("/cart/add", data);
export const updateCartItem = (cartItemId, data) => client.put(`/cart/items/${cartItemId}`, data);
export const removeCartItem = (cartItemId) => client.delete(`/cart/items/${cartItemId}`);
export const clearCart = () => client.delete("/cart/clear");
