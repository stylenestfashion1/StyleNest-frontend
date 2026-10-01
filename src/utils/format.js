// currency defaults to "INR" so every pre-existing call site (which never
// passed a second argument) keeps behaving exactly as before.
export function formatPrice(value, currency = "INR") {
  if (value === null || value === undefined) return "";
  if (currency === "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

// Rental catalog colour labels are free-typed by admins ("green", "GREEN",
// "Green" all mean the same thing) -- this normalizes only the DISPLAY
// casing, never the underlying stored value, so card/detail pages always
// read consistently regardless of how it was originally entered.
export function titleCase(value) {
  if (!value) return "";
  return value
    .toLowerCase()
    .split(" ")
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
    .join(" ");
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

// Picks the price entry for the given currency out of a ProductResponse's
// `prices[]` (see backend ProductPrice/ProductPricingService) -- INR falls
// back to the product's own flat price/discountPrice fields as a safety
// net (those two are always supposed to agree, see PricingBackfillRunner),
// but any other currency returns null when the admin hasn't configured it
// yet. Never derives one currency's price from another's.
export function resolveProductPrice(product, currency) {
  const entry = product?.prices?.find((p) => p.currency === currency);
  if (entry) return { regularPrice: entry.regularPrice, discountPrice: entry.discountPrice };
  if (currency === "INR") return { regularPrice: product?.price, discountPrice: product?.discountPrice };
  return null;
}
