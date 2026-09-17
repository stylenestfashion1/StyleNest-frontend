import bulkClient from "./bulkClient";

export const validateBulkAccess = (accessToken) => bulkClient.post("/bulk/access/validate", { accessToken });

export const getBulkCategories = () => bulkClient.get("/bulk/customer/categories");
export const getBulkProducts = (categoryId) =>
  bulkClient.get("/bulk/customer/products", { params: categoryId ? { categoryId } : undefined });
export const getBulkProduct = (id) => bulkClient.get(`/bulk/customer/products/${id}`);

export const placeBulkOrder = (data) => bulkClient.post("/bulk/customer/orders", data);
