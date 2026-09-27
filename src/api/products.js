import client from "./client";

export const filterProducts = (params) => client.get("/products/filter", { params });
export const searchProducts = (body) => client.post("/products/search", body);
export const getProduct = (id) => client.get(`/products/${id}`);
export const getProductBySlug = (slug) => client.get(`/products/slug/${slug}`);
export const getProductVariants = (productId) => client.get(`/products/${productId}/variants`);
