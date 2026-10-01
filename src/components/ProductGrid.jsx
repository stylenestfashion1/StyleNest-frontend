import ProductCard, { ProductCardSkeleton } from "./ProductCard";
import EmptyState from "./EmptyState";
import { Reveal } from "./Reveal";

export default function ProductGrid({ products, loading, skeletonCount = 6 }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return <EmptyState title="No products found" description="Try adjusting your filters or check back soon for new arrivals." />;
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
      {/* Delay capped low (was up to 420ms via i%8*60) -- a long stagger
          widens the window where a card sits in its pre-reveal state
          waiting on an IntersectionObserver callback that can lag on a
          fast/reversed scroll, which is what read as shake/jitter. */}
      {products.map((product, i) => (
        <Reveal key={product.id} delay={(i % 4) * 40}>
          <ProductCard product={product} />
        </Reveal>
      ))}
    </div>
  );
}
