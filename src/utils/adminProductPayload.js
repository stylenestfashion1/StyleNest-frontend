// Full-object PUT, same shape AdminProductForm sends — the admin products
// API has no partial-update endpoint, so changing one field (trending,
// discountPrice, price, ...) from a list view (without opening the full
// edit form) means reconstructing the same payload from the already
// -fetched product-list row plus the resolved categoryId. Shared by
// AdminTrending and AdminSaleManager rather than duplicated.
export function buildProductUpdatePayload(product, categories, overrides) {
  const categoryId =
    product.categoryId ??
    categories?.find((c) => c.slug === product.categorySlug)?.id ??
    categories?.find((c) => c.name === product.categoryName && (!product.gender || c.gender === product.gender))?.id ??
    categories?.find((c) => c.name === product.categoryName)?.id ??
    "";
  return {
    name: product.name ?? "",
    shortDescription: product.shortDescription ?? "",
    description: product.description ?? "",
    price: Number(product.price),
    discountPrice: product.discountPrice ?? null,
    fabric: product.fabric ?? "",
    careInstructions: product.careInstructions ?? "",
    featured: product.featured ?? false,
    trending: product.trending ?? false,
    active: product.active ?? true,
    categoryId: Number(categoryId),
    ...overrides,
  };
}
