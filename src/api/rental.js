import client from "./client";

// PUBLIC -- no auth, gated only by the unguessable share token in the URL.
export const getRentalCatalogByShareToken = (shareToken) => client.get(`/rental-catalogs/${shareToken}`);

// PUBLIC -- backs the main-site "Rentals" nav link (see RentalLanding.jsx),
// which has no token of its own; resolves to whichever catalog is
// currently ACTIVE. { available: false } is a normal response, not an error.
export const getActiveRentalCatalog = () => client.get("/rental-catalogs/active");

// ADMIN -- all covered by the existing /api/admin/** ROLE_ADMIN rule.
export const getAdminRentalCatalogs = () => client.get("/admin/rental-catalogs");
export const getAdminRentalCatalog = (id) => client.get(`/admin/rental-catalogs/${id}`);
export const createAdminRentalCatalog = (data) => client.post("/admin/rental-catalogs", data);
export const renameAdminRentalCatalog = (id, data) => client.put(`/admin/rental-catalogs/${id}`, data);
export const activateAdminRentalCatalog = (id) => client.post(`/admin/rental-catalogs/${id}/activate`);
export const deactivateAdminRentalCatalog = (id) => client.post(`/admin/rental-catalogs/${id}/deactivate`);
export const deleteAdminRentalCatalog = (id) => client.delete(`/admin/rental-catalogs/${id}`);

export const addAdminRentalItem = (catalogId, data) => client.post(`/admin/rental-catalogs/${catalogId}/items`, data);
export const updateAdminRentalItem = (catalogId, itemId, data) =>
  client.put(`/admin/rental-catalogs/${catalogId}/items/${itemId}`, data);
export const deleteAdminRentalItem = (catalogId, itemId) =>
  client.delete(`/admin/rental-catalogs/${catalogId}/items/${itemId}`);
export const reorderAdminRentalItems = (catalogId, orderedItemIds) =>
  client.put(`/admin/rental-catalogs/${catalogId}/items/reorder`, orderedItemIds);

// Kept as its own endpoint (not the retail POST /api/admin/images/upload)
// so rental photos land under uploads/rental/, never mixed into
// uploads/products/.
export const uploadAdminRentalImage = (formData) =>
  client.post("/admin/rental-catalogs/images/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// RENTAL BOOKING -- PUBLIC (guest flow, no login, gated only by the
// catalog's share token -- see RentalBookingController).

export const getPublicRentalSettings = (shareToken) => client.get(`/rental-catalogs/${shareToken}/settings`);

export const getUnavailableDates = (shareToken, itemId) =>
  client.get(`/rental-catalogs/${shareToken}/items/${itemId}/unavailable-dates`);

export const createRentalBooking = (shareToken, itemId, data) =>
  client.post(`/rental-catalogs/${shareToken}/items/${itemId}/bookings`, data);

export const submitRentalPayment = (shareToken, bookingReference, formData) =>
  client.post(`/rental-catalogs/${shareToken}/bookings/${bookingReference}/payment`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// RENTAL BOOKING -- ADMIN (all covered by the existing /api/admin/** ROLE_ADMIN rule).

export const getAdminRentalBookings = () => client.get("/admin/rental-bookings");
export const getAdminRentalBooking = (bookingReference) => client.get(`/admin/rental-bookings/${bookingReference}`);
export const confirmAdminRentalBooking = (bookingReference) =>
  client.post(`/admin/rental-bookings/${bookingReference}/confirm`);
// Omit `data` (or pass undefined) to cancel the entire booking; pass
// { startDate, endDate } to cancel only that sub-range -- see
// RentalCancelRequest's backend javadoc.
export const cancelAdminRentalBooking = (bookingReference, data) =>
  client.post(`/admin/rental-bookings/${bookingReference}/cancel`, data);
export const completeAdminRentalBooking = (bookingReference) =>
  client.post(`/admin/rental-bookings/${bookingReference}/complete`);

export const getAdminRentalSettings = () => client.get("/admin/rental-settings");
export const updateAdminRentalSettings = (data) => client.put("/admin/rental-settings", data);
export const uploadAdminRentalPaymentQr = (formData) =>
  client.post("/admin/rental-settings/payment-qr/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
