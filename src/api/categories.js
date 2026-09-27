import client from "./client";

export const getCategories = (params) => client.get("/categories", { params });
export const getCategory = (id) => client.get(`/categories/${id}`);
export const getCategoryBySlug = (slug) => client.get(`/categories/slug/${slug}`);
