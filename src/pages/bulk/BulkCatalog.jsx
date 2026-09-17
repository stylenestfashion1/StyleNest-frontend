import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ShoppingBag } from "lucide-react";
import { PageFade, Reveal } from "../../components/Reveal";
import LoadingState from "../../components/LoadingState";
import ErrorState from "../../components/ErrorState";
import EmptyState from "../../components/EmptyState";
import { getBulkCategories, getBulkProducts } from "../../api/bulk";
import { clearBulkToken } from "../../api/bulkClient";
import { useBulkCart } from "../../context/BulkCartContext";
import { formatPrice } from "../../utils/format";

export default function BulkCatalog() {
  const navigate = useNavigate();
  const bulkCart = useBulkCart();
  const [categoryId, setCategoryId] = useState(null);

  const {
    data: categories,
    isLoading: categoriesLoading,
  } = useQuery({ queryKey: ["bulk-categories"], queryFn: getBulkCategories });

  const {
    data: products,
    isLoading: productsLoading,
    isError,
    refetch,
    error,
  } = useQuery({
    queryKey: ["bulk-products", categoryId],
    queryFn: () => getBulkProducts(categoryId || undefined),
  });

  function handleSessionInvalid() {
    clearBulkToken();
    navigate("/bulk-orders");
  }

  // Browsing endpoints only ever fail with "not found" or "revoked" (never
  // "already assigned" -- that's only checked at order placement), so any
  // error here always means this tab's token is no longer usable.
  if (isError) {
    return (
      <PageFade>
        <div className="mx-auto max-w-xl px-5 py-24 text-center">
          <ErrorState message={error.message} onRetry={handleSessionInvalid} />
          <button onClick={handleSessionInvalid} className="btn-outline mt-2">
            Enter access code again
          </button>
        </div>
      </PageFade>
    );
  }

  return (
    <PageFade>
      <div className="mx-auto max-w-[1440px] px-5 py-12 md:px-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="label-xs text-accent">Wholesale</p>
            <h1 className="mt-3 text-[clamp(1.9rem,3.6vw,2.6rem)]">Bulk Order Catalog</h1>
          </div>
          <Link to="/bulk-orders/cart" className="btn-outline flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" />
            Bulk Cart {bulkCart.totalItems > 0 && `(${bulkCart.totalItems})`}
          </Link>
        </div>

        {!categoriesLoading && categories?.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2">
            <button
              onClick={() => setCategoryId(null)}
              className={`label-xs rounded-full border px-4 py-2 ${!categoryId ? "bg-foreground text-background" : ""}`}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategoryId(c.id)}
                className={`label-xs rounded-full border px-4 py-2 ${categoryId === c.id ? "bg-foreground text-background" : ""}`}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}

        <div className="mt-10">
          {productsLoading ? (
            <LoadingState label="Loading catalog" />
          ) : !products || products.length === 0 ? (
            <EmptyState title="No bulk products yet" description="Check back soon, or ask the shop directly." />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product, i) => (
                <Reveal key={product.id} delay={(i % 8) * 60}>
                  <Link to={`/bulk-orders/products/${product.id}`} className="group block">
                    <div className="aspect-[4/5] overflow-hidden bg-muted">
                      {product.imageUrl && (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      )}
                    </div>
                    <p className="mt-3 text-sm">{product.name}</p>
                    <p className="label-xs mt-1 text-muted-foreground">
                      {formatPrice(product.price)} · Min {product.minOrderQuantity} pcs
                    </p>
                  </Link>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageFade>
  );
}
