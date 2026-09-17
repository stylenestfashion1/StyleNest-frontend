import client from "./client";

export const getDashboard = () => client.get("/admin/dashboard");
export const getLatestOrders = () => client.get("/admin/latest-orders");
export const getLowStock = () => client.get("/admin/low-stock");
export const getTopSelling = () => client.get("/admin/top-selling");

export const getAdminOrders = (params) => client.get("/admin/orders", { params });
export const searchAdminOrders = (params) => client.get("/admin/orders/search", { params });
export const getAdminOrder = (id) => client.get(`/admin/orders/${id}`);
export const getAdminOrderInvoice = (id) => client.get(`/admin/orders/${id}/invoice`);
export const getAdminOrderInvoicePdfBlob = (id) => client.get(`/admin/orders/${id}/invoice/pdf`, { responseType: "blob" });
export const resendAdminOrderInvoiceEmail = (id) => client.post(`/admin/orders/${id}/invoice/resend-email`);
export const updateOrderStatus = (id, data) => client.put(`/admin/orders/${id}/status`, data);
export const updateOrderShipment = (id, data) => client.put(`/admin/orders/${id}/shipment`, data);

export const getAdminProducts = (params) => client.get("/admin/products", { params });
export const getAdminProduct = (id) => client.get(`/admin/products/${id}`);
export const createProduct = (data) => client.post("/admin/products", data);
export const updateProduct = (id, data) => client.put(`/admin/products/${id}`, data);
export const deleteProduct = (id) => client.delete(`/admin/products/${id}`);

export const createCategory = (data) => client.post("/categories", data);
export const updateCategory = (id, data) => client.put(`/categories/${id}`, data);
export const deleteCategory = (id) => client.delete(`/categories/${id}`);

export const createVariant = (productId, data) => client.post(`/products/${productId}/variants`, data);
export const updateVariant = (variantId, data) => client.put(`/variants/${variantId}`, data);
export const deleteVariant = (variantId) => client.delete(`/variants/${variantId}`);

// Color-GROUP level rename -- every existing size that currently has `color` becomes
// `newColor` in one operation (see ProductVariantServiceImpl.renameColorGroup on the backend).
// This is the only supported way to change a color; individual variants no longer expose a
// color field of their own, so two sizes of the same product can never end up on different
// color names by accident.
export const renameColorGroup = (productId, color, data) =>
  client.put(`/products/${productId}/colors/${encodeURIComponent(color)}/rename`, data);

// Images belong to a (product, color) pair, not an individual size variant --
// every size of the same color shares one photo set, uploaded once. Color is
// free-form (can contain spaces, e.g. "Dusty Rose"), so it must be
// URL-encoded going into the path.
export const getColorImages = (productId, color) => client.get(`/products/${productId}/colors/${encodeURIComponent(color)}/images`);
export const addImageToColor = (productId, color, data) => client.post(`/products/${productId}/colors/${encodeURIComponent(color)}/images`, data);
export const reorderColorImages = (productId, color, orderedImageIds) =>
  client.put(`/products/${productId}/colors/${encodeURIComponent(color)}/images/reorder`, { orderedImageIds });
export const deleteImage = (imageId) => client.delete(`/images/${imageId}`);

export const uploadAdminImage = (formData) =>
  client.post("/admin/images/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const updateScrollImage = (gender, step, data) => client.put(`/admin/scroll-images/${gender}/${step}`, data);
export const deleteScrollImage = (gender, step) => client.delete(`/admin/scroll-images/${gender}/${step}`);

// BULK ORDERS (wholesale) -- fully separate admin sub-system, kept here
// alongside the rest of the admin API surface for consistency, but every
// endpoint lives under /admin/bulk/** on the backend and never touches the
// retail products/categories/orders tables.

export const getAdminBulkTokens = () => client.get("/admin/bulk/access-tokens");
export const provisionAdminBulkTokens = () => client.post("/admin/bulk/access-tokens/provision");
export const revokeAdminBulkToken = (id) => client.post(`/admin/bulk/access-tokens/${id}/revoke`);
export const reactivateAdminBulkToken = (id) => client.post(`/admin/bulk/access-tokens/${id}/reactivate`);
export const unassignAdminBulkToken = (id) => client.post(`/admin/bulk/access-tokens/${id}/unassign`);
export const reissueAdminBulkToken = (id) => client.post(`/admin/bulk/access-tokens/${id}/reissue`);

export const getAdminBulkCategories = () => client.get("/admin/bulk/categories");
export const getAdminBulkCategory = (id) => client.get(`/admin/bulk/categories/${id}`);
export const createAdminBulkCategory = (data) => client.post("/admin/bulk/categories", data);
export const updateAdminBulkCategory = (id, data) => client.put(`/admin/bulk/categories/${id}`, data);
export const deleteAdminBulkCategory = (id) => client.delete(`/admin/bulk/categories/${id}`);

export const getAdminBulkProducts = () => client.get("/admin/bulk/products");
export const getAdminBulkProduct = (id) => client.get(`/admin/bulk/products/${id}`);
export const createAdminBulkProduct = (data) => client.post("/admin/bulk/products", data);
export const updateAdminBulkProduct = (id, data) => client.put(`/admin/bulk/products/${id}`, data);
export const deleteAdminBulkProduct = (id) => client.delete(`/admin/bulk/products/${id}`);

export const getAdminBulkOrders = () => client.get("/admin/bulk/orders");
export const getAdminBulkOrder = (id) => client.get(`/admin/bulk/orders/${id}`);
export const updateAdminBulkOrderStatus = (id, data) => client.put(`/admin/bulk/orders/${id}/status`, data);
export const getAdminBulkOrderInvoice = (id) => client.get(`/admin/bulk/orders/${id}/invoice`);
export const getAdminBulkOrderInvoicePdfBlob = (id) => client.get(`/admin/bulk/orders/${id}/invoice/pdf`, { responseType: "blob" });
export const resendAdminBulkOrderInvoiceEmail = (id) => client.post(`/admin/bulk/orders/${id}/invoice/resend-email`);

// REWARDS (in-store QR discount) -- fully separate admin sub-system, kept
// alongside the rest of the admin API surface for consistency. Hidden from
// normal customer navigation entirely; only reachable via the physical
// shop's permanent QR code (see AdminRewardsQr.jsx / SpecialOffer.jsx).

export const getAdminDiscountConfig = () => client.get("/admin/discount/config");
export const updateAdminDiscountConfig = (data) => client.put("/admin/discount/config", data);
export const updateAdminDiscountRange = (data) => client.put("/admin/discount/range", data);
export const getAdminDiscountOffers = (params) => client.get("/admin/discount/offers", { params });
export const getAdminDiscountQr = () => client.get("/admin/discount/qr");
