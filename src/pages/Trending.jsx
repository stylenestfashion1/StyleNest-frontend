import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import * as productsApi from "../api/products";
import ProductGrid from "../components/ProductGrid";
import { PageFade, Reveal } from "../components/Reveal";

export default function Trending() {
  const results = useQueries({
    queries: ["WOMEN", "MEN"].map((gender) => ({
      queryKey: ["products", "trending-source", gender],
      queryFn: () => productsApi.filterProducts({ gender, trending: true, sizePerPage: 48, active: true, sortBy: "createdAt", direction: "desc" }),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const isLoading = results.some((r) => r.isLoading);
  const womenItems = results[0]?.data?.content ?? [];
  const menItems = results[1]?.data?.content ?? [];

  // Interleave trending items across women and men for a balanced, vibrant collection
  const trendingItems = useMemo(() => {
    const combined = [];
    const maxLen = Math.max(womenItems.length, menItems.length);
    for (let i = 0; i < maxLen; i++) {
      if (womenItems[i]) combined.push(womenItems[i]);
      if (menItems[i]) combined.push(menItems[i]);
    }
    return combined;
  }, [womenItems, menItems]);

  return (
    <PageFade>
      <div className="mx-auto max-w-[1440px] px-5 py-14 md:px-10">
        <Reveal>
          <p className="label-xs text-accent uppercase tracking-[0.2em]">POPULAR PICKS</p>
          <h1 className="mt-2 max-w-3xl text-[clamp(2.2rem,4.6vw,3.6rem)] leading-[1.06] font-medium">Trending Styles</h1>
          <p className="mt-4 max-w-xl text-sm text-muted-foreground">The most coveted pieces reaching wardrobes right now across women's and men's.</p>
        </Reveal>
        <div className="mt-10">
          {isLoading ? (
            <ProductGrid loading skeletonCount={12} />
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
