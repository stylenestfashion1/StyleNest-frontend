import { useQueries } from "@tanstack/react-query";
import * as productsApi from "../api/products";
import ProductGrid from "../components/ProductGrid";
import { PageFade, Reveal } from "../components/Reveal";

export default function Trending() {
  const results = useQueries({
    queries: ["MEN", "WOMEN"].map((gender) => ({
      queryKey: ["products", "trending-source", gender],
      queryFn: () => productsApi.filterProducts({ gender, trending: true, sizePerPage: 48, active: true, sortBy: "createdAt", direction: "desc" }),
    })),
  });

  const isLoading = results.some((r) => r.isLoading);
  const trendingItems = results.flatMap((r) => r.data?.content ?? []).filter((p) => p.trending === true);

  return (
    <PageFade>
      <div className="mx-auto max-w-[1440px] px-5 py-14 md:px-10">
        <Reveal>
          <p className="label-xs text-accent">Right Now</p>
          <h1 className="mt-4 max-w-3xl text-[clamp(2.2rem,4.6vw,3.6rem)] leading-[1.06]">Trending</h1>
          <p className="mt-4 max-w-xl text-sm text-muted-foreground">What StyleNest Fashion customers are reaching for, across men's and women's.</p>
        </Reveal>
        <div className="mt-10">
          {isLoading ? (
            <ProductGrid loading />
          ) : trendingItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing trending right now — check back soon.</p>
          ) : (
            <ProductGrid products={trendingItems} />
          )}
        </div>
      </div>
    </PageFade>
  );
}
