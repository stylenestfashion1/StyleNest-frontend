import { useQueries } from "@tanstack/react-query";
import * as productsApi from "../api/products";
import ProductGrid from "../components/ProductGrid";
import { PageFade, Reveal } from "../components/Reveal";

export default function Sale() {
  const results = useQueries({
    queries: ["MEN", "WOMEN"].map((gender) => ({
      queryKey: ["products", "sale-source", gender],
      queryFn: () => productsApi.filterProducts({ gender, sizePerPage: 48, active: true, sortBy: "createdAt", direction: "desc" }),
    })),
  });

  const isLoading = results.some((r) => r.isLoading);
  const saleItems = results
    .flatMap((r) => r.data?.content ?? [])
    .filter((p) => p.discountPrice != null && p.discountPrice < p.price)
    .sort((a, b) => b.price - b.discountPrice - (a.price - a.discountPrice));

  return (
    <PageFade>
      <div className="mx-auto max-w-[1440px] px-5 py-14 md:px-10">
        <Reveal>
          <p className="label-xs text-accent">Reductions</p>
          <h1 className="mt-4 max-w-3xl text-[clamp(2.2rem,4.6vw,3.6rem)] leading-[1.06]">Sale</h1>
          <p className="mt-4 max-w-xl text-sm text-muted-foreground">Limited-time reductions across men's and women's collections.</p>
        </Reveal>
        <div className="mt-10">
          {isLoading ? (
            <ProductGrid loading />
          ) : saleItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">No items on sale right now — check back soon.</p>
          ) : (
            <ProductGrid products={saleItems} />
          )}
        </div>
      </div>
    </PageFade>
  );
}
