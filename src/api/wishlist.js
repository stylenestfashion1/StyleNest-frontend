import client from "./client";

export const getWishlist = () => client.get("/wishlist");
export const addToWishlist = (data) => client.post("/wishlist/add", data);
export const removeWishlistItem = (wishlistItemId) => client.delete(`/wishlist/items/${wishlistItemId}`);
export const clearWishlist = () => client.delete("/wishlist/clear");
