// High-resolution real hero product photography from StyleNest live catalog
// Discarding stock / AI / Unsplash imagery with real authentic StyleNest pieces
export const REAL_CATEGORY_PRODUCT_IMAGES = {
  // Women (Official Shopdeck StyleNest hero photography with ample headroom)
  KURTI: "https://d1311wbk6unapo.cloudfront.net/NushopCatalogue/tr:f-webp,w-1200,fo-auto/6acf6ff6d488cd0ea435cb10/cat_img/wAyZV8jS_9ADDPQX4P0_2026-10-14_2.jpg", // Blue Elephant Print Kurti
  SUIT: "https://d1311wbk6unapo.cloudfront.net/NushopCatalogue/tr:f-webp,w-1200,fo-auto/6acf6ff6d488cd0ea435cb10/cat_img/SJKsbhvE_LYOSGPPSDZ_2026-10-14_1.jpg", // Purple Tree Print Suit Set
  WOMEN_CORDSET: "https://api.stylenestfashion.com/uploads/products/d3ac4dda-bf7d-4863-86d8-2e4d6346cc1f.jpg", // Off White Wave Print Co-ord Set
  DRESS: "https://api.stylenestfashion.com/uploads/products/1f5ac2d9-76b1-49b0-8176-fa16c8daa36e.jpg", // Black Ruffle Strap Tiered Maxi Dress
  TOPS: "https://d1311wbk6unapo.cloudfront.net/NushopCatalogue/tr:f-webp,w-1200,fo-auto/6acf6ff6d488cd0ea435cb10/cat_img/4CAcrYeY_YMXCJ3X4QV_2026-10-14_2.jpg", // Blue Checkered Button-Down Shirt
  JEANS: "https://api.stylenestfashion.com/uploads/products/88a808cd-3d28-49e9-a684-e8c93526adfc.jpg", // White High-Waist Wide-Leg Jeans
  PALAZZO: "https://api.stylenestfashion.com/uploads/products/f90e0d71-21f9-4d8f-92ed-accfcfea8072.jpg", // Black Boho Medallion Flared Skirt
  GOWN: "https://api.stylenestfashion.com/uploads/products/676d8628-6e36-434a-b8f0-afb370f2dbef.jpg", // Light Pink Floral Print Nighty
  WOMEN_TSHIRTS: "https://api.stylenestfashion.com/uploads/products/ea1e20f1-3ad3-4808-bacd-a43f3a80027d.jpg", // Maroon Graphic T-Shirt

  // Men (Official Shopdeck StyleNest hero photography with ample headroom)
  MEN_TSHIRTS: "https://d1311wbk6unapo.cloudfront.net/NushopCatalogue/tr:f-webp,w-1200,fo-auto/6acf6ff6d488cd0ea435cb10/cat_img/uS8q3TcH_1H1L6VE3FY_2026-10-14_2.jpg", // Charcoal Acid-Wash Polo
  MEN_CORDSET: "https://d1311wbk6unapo.cloudfront.net/NushopCatalogue/tr:f-webp,w-1200,fo-auto/6acf6ff6d488cd0ea435cb10/cat_img/9ZYSTgxv_37UYG1ZF6J_2026-10-14_2.jpg", // Navy Himble Co-ord Set
  MEN_LOWER: "https://d1311wbk6unapo.cloudfront.net/NushopCatalogue/tr:f-webp,w-1200,fo-auto/6acf6ff6d488cd0ea435cb10/cat_img/T77o7hEv_L6N04YKQUC_2026-10-14_2.jpg", // Black Piped Track Pants
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

/**
 * Returns the best real hero product image for a category card.
 * Discards third-party stock/unsplash URLs (which look like AI/stock models)
 * so the card always displays authentic StyleNest pieces worn by our real models.
 */
export function getCategoryHeroImage(category, gender) {
  const url = typeof category === "string" ? category : category?.imageUrl;
  const name = typeof category === "string" ? category : category?.name;
  const gen = typeof category === "object" && category?.gender ? category.gender : gender;

  // If the backend has an uploaded product image from our own domain, use it
  if (url && (url.includes("/uploads/products") || url.includes("/uploads/categories"))) {
    return url;
  }

  // If it's an unsplash stock URL, placeholder, or empty, always use our real hero product photo!
  return categoryImageFallback(name, gen);
}
