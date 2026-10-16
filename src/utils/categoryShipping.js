/**
 * Category-based smart shipping presets (grams & cm).
 * Jeans/Denim: 650g (35x28x6 cm)
 * Suit Sets / Gowns: 550g (35x26x5 cm)
 * Co-ord Sets: 500g (32x25x5 cm)
 * Lower / Trackpants / Palazzo: 400g (32x24x4 cm)
 * Kurti / One Piece / Dresses: 350g (30x22x3 cm)
 * T-Shirts / Tops / Shirts / Polo: 300g (30x20x3 cm)
 */
export function defaultShippingForCategory(categoryName) {
  const norm = (categoryName || "").trim().toLowerCase();
  if (norm.includes("jean") || norm.includes("denim")) {
    return { shippingWeightGrams: 650, packageLengthCm: 35, packageWidthCm: 28, packageHeightCm: 6 };
  }
  if (norm.includes("suit") || norm.includes("gown")) {
    return { shippingWeightGrams: 550, packageLengthCm: 35, packageWidthCm: 26, packageHeightCm: 5 };
  }
  if (norm.includes("cordset") || norm.includes("co-ord") || norm.includes("coord")) {
    return { shippingWeightGrams: 500, packageLengthCm: 32, packageWidthCm: 25, packageHeightCm: 5 };
  }
  if (norm.includes("lower") || norm.includes("track") || norm.includes("pant") || norm.includes("palazzo") || norm.includes("jogger")) {
    return { shippingWeightGrams: 400, packageLengthCm: 32, packageWidthCm: 24, packageHeightCm: 4 };
  }
  if (norm.includes("kurti") || norm.includes("dress") || norm.includes("one piece")) {
    return { shippingWeightGrams: 350, packageLengthCm: 30, packageWidthCm: 22, packageHeightCm: 3 };
  }
  if (norm.includes("top") || norm.includes("shirt") || norm.includes("polo")) {
    return { shippingWeightGrams: 300, packageLengthCm: 30, packageWidthCm: 20, packageHeightCm: 3 };
  }
  return { shippingWeightGrams: 350, packageLengthCm: 30, packageWidthCm: 20, packageHeightCm: 4 };
}
