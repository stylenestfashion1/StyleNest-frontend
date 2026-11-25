import { useQuery } from "@tanstack/react-query";
import * as categoriesApi from "../api/categories";
import * as productsApi from "../api/products";
import ProductGrid from "../components/ProductGrid";
import { PageFade, Reveal } from "../components/Reveal";

// A real unisex category now (gender: UNISEX, slug "unisex-winter") -- not
// gender-split, and already excluded from the Men/Women category listings
// since those query by exact gender match (see CategoryServiceImpl /
// ProductSpecification). Sweatshirts/Hoodies are filed directly under it.
const WINTER_SLUG = "unisex-winter";

export default function Winter() {
  const categoryQuery = useQuery({
    queryKey: ["category", "slug", WINTER_SLUG],
    queryFn: () => categoriesApi.getCategoryBySlug(WINTER_SLUG),
  });

  const categoryId = categoryQuery.data?.id;

  const productsQuery = useQuery({
    queryKey: ["products", "winter-source", categoryId],
    queryFn: () => productsApi.filterProducts({ categoryId, active: true, sizePerPage: 1000 }),
    enabled: !!categoryId,
  });

  const isLoading = categoryQuery.isLoading || productsQuery.isLoading;
  const winterItems = productsQuery.data?.content ?? [];

  return (
    <PageFade>
      <div className="mx-auto max-w-[1440px] px-5 py-14 md:px-10">
        <Reveal>
          <p className="label-xs text-accent">Season</p>
          <h1 className="mt-4 max-w-3xl text-[clamp(2.2rem,4.6vw,3.6rem)] leading-[1.06]">Winter</h1>
          <p className="mt-4 max-w-xl text-sm text-muted-foreground">Sweatshirts and hoodies for the season, for everyone.</p>
        </Reveal>
        <div className="mt-10">
          {isLoading ? (
            <ProductGrid loading />
          ) : winterItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">No winter items available right now — check back soon.</p>
          ) : (
            <ProductGrid products={winterItems} />
          )}
        </div>
      </div>
    </PageFade>
  );
}
