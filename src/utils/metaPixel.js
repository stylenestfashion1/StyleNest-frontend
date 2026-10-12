/**
 * Official Meta (Facebook) Pixel Event Tracking Helper
 * Uses native window.fbq directly with zero external third-party dependencies.
 * Supports Meta Event Deduplication via eventID matching for Conversions API (CAPI).
 */

export const isMetaPixelLoaded = () => {
  return typeof window !== "undefined" && typeof window.fbq === "function";
};

export const trackMetaEvent = (eventName, params = {}, options = {}) => {
  try {
    if (!isMetaPixelLoaded()) return;

    if (options.eventId) {
      window.fbq("track", eventName, params, { eventID: String(options.eventId) });
    } else {
      window.fbq("track", eventName, params);
    }
  } catch (err) {
    console.debug("[MetaPixel] Track error:", err);
  }
};

export const trackCustomMetaEvent = (eventName, params = {}, options = {}) => {
  try {
    if (!isMetaPixelLoaded()) return;

    if (options.eventId) {
      window.fbq("trackCustom", eventName, params, { eventID: String(options.eventId) });
    } else {
      window.fbq("trackCustom", eventName, params);
    }
  } catch (err) {
    console.debug("[MetaPixel] TrackCustom error:", err);
  }
};

/**
 * Standard E-Commerce Events
 */
export const trackPageView = () => {
  trackMetaEvent("PageView");
};

export const trackViewContent = (product, currency = "INR") => {
  if (!product) return;
  const price = Number(product.discountedPrice ?? product.price ?? 0);
  trackMetaEvent("ViewContent", {
    content_name: product.name,
    content_category: product.categoryName || product.category?.name || "Apparel",
    content_ids: [String(product.id)],
    content_type: "product",
    value: price,
    currency: currency || "INR",
  });
};

export const trackAddToCart = ({ id, name, category, price, quantity = 1, currency = "INR" }) => {
  const numPrice = Number(price || 0);
  const qty = Number(quantity || 1);
  trackMetaEvent("AddToCart", {
    content_name: name,
    content_category: category || "Apparel",
    content_ids: [String(id)],
    content_type: "product",
    value: numPrice * qty,
    currency: currency || "INR",
  });
};

export const trackInitiateCheckout = ({ total, numItems = 1, contentIds = [], currency = "INR" }) => {
  trackMetaEvent("InitiateCheckout", {
    num_items: Number(numItems || 1),
    value: Number(total || 0),
    currency: currency || "INR",
    content_ids: contentIds.map(String),
    content_type: "product",
  });
};

export const trackPurchase = ({ orderNumber, total, currency = "INR", numItems = 1, contentIds = [] }) => {
  if (!orderNumber) return;
  trackMetaEvent(
    "Purchase",
    {
      value: Number(total || 0),
      currency: currency || "INR",
      content_type: "product",
      content_ids: contentIds.map(String),
      num_items: Number(numItems || 1),
      order_id: String(orderNumber),
    },
    { eventId: String(orderNumber) } // Event ID for Deduplication with CAPI
  );
};
