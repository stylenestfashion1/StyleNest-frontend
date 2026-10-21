// High-resolution real product photography from StyleNest live catalog
// Replacing AI / stock imagery with real authentic pieces
export const REAL_CATEGORY_PRODUCT_IMAGES = {
  // Women
  KURTI: "https://api.stylenestfashion.com/uploads/products/335f5806-fe57-4387-a85c-020313c668e8.jpg", // White Paisley Print Kurti
  SUIT: "https://api.stylenestfashion.com/uploads/products/aa9fe998-189a-48dc-8f97-d7d10f5652b7.jpg", // Paisley Chevron Suit Set
  WOMEN_CORDSET: "https://api.stylenestfashion.com/uploads/products/d3ac4dda-bf7d-4863-86d8-2e4d6346cc1f.jpg", // Off White Wave Print Co-ord Set
  DRESS: "https://api.stylenestfashion.com/uploads/products/1f5ac2d9-76b1-49b0-8176-fa16c8daa36e.jpg", // Black Ruffle Strap Tiered Maxi Dress
  TOPS: "https://api.stylenestfashion.com/uploads/products/09d59a39-349c-45fa-a6f3-91c90f7d10c4.jpg", // Floral Appliqué Collared Shirt
  JEANS: "https://api.stylenestfashion.com/uploads/products/88a808cd-3d28-49e9-a684-e8c93526adfc.jpg", // White High-Waist Wide-Leg Jeans
  PALAZZO: "https://api.stylenestfashion.com/uploads/products/f90e0d71-21f9-4d8f-92ed-accfcfea8072.jpg", // Black Boho Medallion Flared Skirt
  GOWN: "https://api.stylenestfashion.com/uploads/products/676d8628-6e36-434a-b8f0-afb370f2dbef.jpg", // Light Pink Floral Print Nighty
  WOMEN_TSHIRTS: "https://api.stylenestfashion.com/uploads/products/ea1e20f1-3ad3-4808-bacd-a43f3a80027d.jpg", // Maroon Graphic T-Shirt

  // Men
  MEN_TSHIRTS: "https://api.stylenestfashion.com/uploads/products/b91c61aa-839c-4619-b802-0a2afb8d6bbf.jpg", // Men's Ombre Dip-Dye Graphic T-Shirt
  MEN_CORDSET: "https://api.stylenestfashion.com/uploads/products/776dd8f5-3b3e-403b-a8a4-97fe90fb3394.jpg", // Men's Brown Graphic Co-ord Set
  MEN_LOWER: "https://api.stylenestfashion.com/uploads/products/041939f1-fc14-4026-a73b-01df06c854ea.jpg", // Men's Piped Track Pants
};

const KEYWORDS = [
  { test: /kurti/i, image: REAL_CATEGORY_PRODUCT_IMAGES.KURTI },
  { test: /\bsuit\b/i, image: REAL_CATEGORY_PRODUCT_IMAGES.SUIT },
  { test: /dress|one.?piece|gown/i, image: REAL_CATEGORY_PRODUCT_IMAGES.DRESS },
  { test: /top|blouse|shirt/i, image: REAL_CATEGORY_PRODUCT_IMAGES.TOPS },
  { test: /jean|denim/i, image: REAL_CATEGORY_PRODUCT_IMAGES.JEANS },
  { test: /plazzo|palazzo|skirt/i, image: REAL_CATEGORY_PRODUCT_IMAGES.PALAZZO },
  { test: /nighty|nightwear|sleep/i, image: REAL_CATEGORY_PRODUCT_IMAGES.GOWN },
  { test: /saree/i, image: REAL_CATEGORY_PRODUCT_IMAGES.SUIT },
  { test: /lower|trouser|\bpant|track/i, image: REAL_CATEGORY_PRODUCT_IMAGES.MEN_LOWER },
];

/**
 * Returns a real, top-quality live product image for the given category name and gender.
 */
export function categoryImageFallback(name, gender) {
  const isMen = String(gender).toUpperCase() === "MEN";
  const catName = name ?? "";

  // Men vs Women Co-ord sets
  if (/cordset|co-?ord/i.test(catName)) {
    return isMen ? REAL_CATEGORY_PRODUCT_IMAGES.MEN_CORDSET : REAL_CATEGORY_PRODUCT_IMAGES.WOMEN_CORDSET;
  }

  // Men vs Women T-shirts
  if (/t-?shirt/i.test(catName)) {
    return isMen ? REAL_CATEGORY_PRODUCT_IMAGES.MEN_TSHIRTS : REAL_CATEGORY_PRODUCT_IMAGES.WOMEN_TSHIRTS;
  }

  const match = KEYWORDS.find((k) => k.test.test(catName));
  if (match) return match.image;

  return isMen ? REAL_CATEGORY_PRODUCT_IMAGES.MEN_TSHIRTS : REAL_CATEGORY_PRODUCT_IMAGES.KURTI;
}
