export function formatPrice(value) {
  if (value === null || value === undefined) return "";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(value));
}

// Returns the "X.XX% OFF" figure for a sale, or null when there's no real
// discount to show (missing/equal/invalid prices) -- never fabricated,
// always derived live from the two prices actually in play.
export function discountPercent(originalPrice, salePrice) {
  const original = Number(originalPrice);
  const sale = Number(salePrice);
  if (!Number.isFinite(original) || !Number.isFinite(sale) || original <= 0 || sale >= original) return null;
  return ((original - sale) / original) * 100;
}

export function formatDiscountPercent(originalPrice, salePrice) {
  const pct = discountPercent(originalPrice, salePrice);
  return pct === null ? null : `${pct.toFixed(2)}% OFF`;
}
