// High-resolution real hero product photography from StyleNest live catalog
// Discarding stock / AI / Unsplash imagery with real authentic StyleNest pieces
export const REAL_CATEGORY_PRODUCT_IMAGES = {
  // Women (Official Shopdeck StyleNest hero photography with ample headroom)
  KURTI: {
    image: "https://d1311wbk6unapo.cloudfront.net/NushopCatalogue/tr:f-webp,w-1200,fo-auto/6acf6ff6d488cd0ea435cb10/cat_img/wAyZV8jS_9ADDPQX4P0_2026-10-14_2.jpg", // Blue Elephant Print Kurti
    position: "50% 0%",
  },
  SUIT: {
    image: "https://d1311wbk6unapo.cloudfront.net/NushopCatalogue/tr:f-webp,w-1200,fo-auto/6acf6ff6d488cd0ea435cb10/cat_img/SJKsbhvE_LYOSGPPSDZ_2026-10-14_1.jpg", // Purple Tree Print Suit Set
    position: "50% 0%",
  },
  WOMEN_CORDSET: {
    image: "https://api.stylenestfashion.com/uploads/products/d3ac4dda-bf7d-4863-86d8-2e4d6346cc1f.jpg", // Off White Wave Print Co-ord Set
    position: "50% 0%",
  },
  DRESS: {
    image: "https://api.stylenestfashion.com/uploads/products/1f5ac2d9-76b1-49b0-8176-fa16c8daa36e.jpg", // Black Ruffle Strap Tiered Maxi Dress
    position: "50% 0%",
  },
  TOPS: {
    image: "https://d1311wbk6unapo.cloudfront.net/NushopCatalogue/tr:f-webp,w-1200,fo-auto/6acf6ff6d488cd0ea435cb10/cat_img/4CAcrYeY_YMXCJ3X4QV_2026-10-14_2.jpg", // Blue Checkered Button-Down Shirt
    position: "50% 0%",
  },
  JEANS: {
    image: "https://api.stylenestfashion.com/uploads/products/88a808cd-3d28-49e9-a684-e8c93526adfc.jpg", // White High-Waist Wide-Leg Jeans
    position: "50% 55%",
  },
  PALAZZO: {
    image: "https://api.stylenestfashion.com/uploads/products/f90e0d71-21f9-4d8f-92ed-accfcfea8072.jpg", // Black Boho Medallion Flared Skirt
    position: "50% 55%",
  },
  GOWN: {
    image: "https://api.stylenestfashion.com/uploads/products/676d8628-6e36-434a-b8f0-afb370f2dbef.jpg", // Light Pink Floral Print Nighty/Gown
    position: "50% 0%",
  },
  WOMEN_TSHIRTS: {
    image: "https://api.stylenestfashion.com/uploads/products/16240e1a-09e3-4e60-bd90-89e48ab53372.jpg", // Sky Blue Love Heart Graphic T-Shirt
    position: "50% 0%",
  },

  // Men (Official Shopdeck StyleNest hero photography with ample headroom)
  MEN_TSHIRTS: {
    image: "https://d1311wbk6unapo.cloudfront.net/NushopCatalogue/tr:f-webp,w-1200,fo-auto/6acf6ff6d488cd0ea435cb10/cat_img/uS8q3TcH_1H1L6VE3FY_2026-10-14_2.jpg", // Charcoal Acid-Wash Polo
    position: "50% 0%",
  },
  MEN_CORDSET: {
    image: "https://d1311wbk6unapo.cloudfront.net/NushopCatalogue/tr:f-webp,w-1200,fo-auto/6acf6ff6d488cd0ea435cb10/cat_img/9ZYSTgxv_37UYG1ZF6J_2026-10-14_2.jpg", // Navy Himble Co-ord Set
    position: "50% 0%",
  },
  MEN_LOWER: {
    image: "https://d1311wbk6unapo.cloudfront.net/NushopCatalogue/tr:f-webp,w-1200,fo-auto/6acf6ff6d488cd0ea435cb10/cat_img/T77o7hEv_L6N04YKQUC_2026-10-14_2.jpg", // Black Piped Track Pants
    position: "50% 60%",
  },
};

const KEYWORDS = [
  { test: /kurti/i, item: REAL_CATEGORY_PRODUCT_IMAGES.KURTI },
  { test: /suit/i, item: REAL_CATEGORY_PRODUCT_IMAGES.SUIT },
  { test: /gown|nighty|nightwear|sleep/i, item: REAL_CATEGORY_PRODUCT_IMAGES.GOWN },
  { test: /dress|one.?piece/i, item: REAL_CATEGORY_PRODUCT_IMAGES.DRESS },
  { test: /top|blouse|shirt/i, item: REAL_CATEGORY_PRODUCT_IMAGES.TOPS },
  { test: /jean|denim/i, item: REAL_CATEGORY_PRODUCT_IMAGES.JEANS },
  { test: /plazzo|palazzo|skirt/i, item: REAL_CATEGORY_PRODUCT_IMAGES.PALAZZO },
  { test: /saree/i, item: REAL_CATEGORY_PRODUCT_IMAGES.SUIT },
  { test: /lower|trouser|pant|track/i, item: REAL_CATEGORY_PRODUCT_IMAGES.MEN_LOWER },
];

/**
 * Returns a real, top-quality live product image and position config for the given category name and gender.
 */
export function getCategoryHeroImageInfo(category, gender) {
  const catName = typeof category === "string" ? category : category?.name ?? "";
  const gen = typeof category === "object" && category?.gender ? category.gender : gender;
  const isMen = String(gen).toUpperCase() === "MEN";

  // Men vs Women Co-ord sets
  if (/cordset|co-?ord/i.test(catName)) {
    return isMen ? REAL_CATEGORY_PRODUCT_IMAGES.MEN_CORDSET : REAL_CATEGORY_PRODUCT_IMAGES.WOMEN_CORDSET;
  }

  // Men vs Women T-shirts
  if (/t-?shirt/i.test(catName)) {
    return isMen ? REAL_CATEGORY_PRODUCT_IMAGES.MEN_TSHIRTS : REAL_CATEGORY_PRODUCT_IMAGES.WOMEN_TSHIRTS;
  }

  const match = KEYWORDS.find((k) => k.test.test(catName));
  if (match) return match.item;

  return isMen ? REAL_CATEGORY_PRODUCT_IMAGES.MEN_TSHIRTS : REAL_CATEGORY_PRODUCT_IMAGES.KURTI;
}

/**
 * Backward compatible getter for image URL string.
 */
export function getCategoryHeroImage(category, gender) {
  const url = typeof category === "string" ? category : category?.imageUrl;
  if (url && (url.includes("/uploads/products") || url.includes("/uploads/categories"))) {
    return url;
  }
  return getCategoryHeroImageInfo(category, gender).image;
}

export function categoryImageFallback(name, gender) {
  return getCategoryHeroImage(name, gender);
}
