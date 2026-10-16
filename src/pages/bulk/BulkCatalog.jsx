import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ShoppingBag, Check, Layers, ArrowRight, X } from "lucide-react";
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
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  const {
    data: categories = [],
    isLoading: categoriesLoading,
  } = useQuery({ queryKey: ["bulk-categories"], queryFn: getBulkCategories });

  const {
    data: products = [],
    isLoading: productsLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["bulk-products", selectedCategoryId],
    queryFn: () => getBulkProducts(selectedCategoryId || undefined),
  });

  const menCategories = useMemo(() => {
    return categories.filter(
      (c) => c.gender === "MEN" || c.slug?.startsWith("men-")
    );
  }, [categories]);

  const womenCategories = useMemo(() => {
    return categories.filter(
      (c) =>
        c.gender === "WOMEN" ||
        c.slug?.startsWith("women-") ||
        (!c.gender && !c.slug?.startsWith("men-"))
    );
  }, [categories]);

  const activeCategory = useMemo(() => {
    return categories.find((c) => c.id === selectedCategoryId) || null;
  }, [categories, selectedCategoryId]);

  function handleSessionInvalid() {
    clearBulkToken();
    navigate("/bulk-orders");
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-xl px-5 py-24 text-center">
        <ErrorState message={error.message} onRetry={handleSessionInvalid} />
        <button onClick={handleSessionInvalid} className="btn-outline mt-4">
          Enter access code again
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1440px] px-5 py-10 md:px-10">
      {/* Top Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="label-xs tracking-widest text-accent font-semibold uppercase">
              Wholesale Portal · B2B Access Verified
            </p>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl text-foreground">
            Bulk Order Catalog
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Orders are sold exclusively in complete fixed wholesale packs (10–25+ pcs per lot).
          </p>
        </div>
        <Link
          to="/bulk-orders/cart"
          className="btn-outline flex items-center gap-2 py-2.5 px-4 rounded-md shadow-sm hover:shadow"
        >
          <ShoppingBag className="h-4 w-4" />
          <span className="font-medium text-sm">Bulk Cart</span>
          {bulkCart.totalItems > 0 && (
            <span className="ml-1 rounded-full bg-primary text-primary-foreground px-2 py-0.5 text-xs font-bold">
              {bulkCart.totalItems} pcs
            </span>
          )}
        </Link>
      </div>

      {/* Categories Clean List Layout (Men Separate, Women Separate - No Card Animations) */}
      {!categoriesLoading && categories.length > 0 && (
        <div className="mt-8 rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Wholesale Categories (List View)
              </h2>
            </div>
            {selectedCategoryId && (
              <button
                onClick={() => setSelectedCategoryId(null)}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-medium"
              >
                <X className="h-3 w-3" />
                View All Categories
              </button>
            )}
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Men Categories List */}
            <div className="rounded-lg border bg-muted/20 p-4">
              <div className="flex items-center justify-between mb-3 pb-2 border-b">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
                  👔 Men's Wholesale
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {menCategories.length} categories
                </span>
              </div>
              <ul className="space-y-1.5">
                {menCategories.map((c) => {
                  const isSelected = selectedCategoryId === c.id;
                  return (
                    <li key={c.id}>
                      <button
                        onClick={() =>
                          setSelectedCategoryId(isSelected ? null : c.id)
                        }
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm text-left transition-colors ${
                          isSelected
                            ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                            : "hover:bg-muted text-foreground/80 hover:text-foreground"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {isSelected && <Check className="h-3.5 w-3.5" />}
                          {c.name}
                        </span>
                        <span
                          className={`text-xs ${
                            isSelected
                              ? "text-primary-foreground/80"
                              : "text-muted-foreground"
                          }`}
                        >
                          Select →
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Women Categories List */}
            <div className="rounded-lg border bg-muted/20 p-4">
              <div className="flex items-center justify-between mb-3 pb-2 border-b">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-600 flex items-center gap-1.5">
                  👗 Women's Wholesale
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {womenCategories.length} categories
                </span>
              </div>
              <ul className="space-y-1.5 grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1">
                {womenCategories.map((c) => {
                  const isSelected = selectedCategoryId === c.id;
                  return (
                    <li key={c.id}>
                      <button
                        onClick={() =>
                          setSelectedCategoryId(isSelected ? null : c.id)
                        }
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm text-left transition-colors ${
                          isSelected
                            ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                            : "hover:bg-muted text-foreground/80 hover:text-foreground"
                        }`}
                      >
                        <span className="flex items-center gap-2 truncate">
                          {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
                          <span className="truncate">{c.name}</span>
                        </span>
                        <span
                          className={`text-xs shrink-0 ${
                            isSelected
                              ? "text-primary-foreground/80"
                              : "text-muted-foreground"
                          }`}
                        >
                          →
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Selected Category Filter Indicator */}
      <div className="mt-8 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">
            {activeCategory
              ? `${activeCategory.gender ?? (activeCategory.slug?.startsWith("men-") ? "Men" : "Women")} · ${activeCategory.name}`
              : "All Wholesale Products"}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Showing {products.length} bulk wholesale pack{products.length === 1 ? "" : "s"} available
          </p>
        </div>
        {selectedCategoryId && (
          <button
            onClick={() => setSelectedCategoryId(null)}
            className="label-xs rounded-full border px-3 py-1 hover:bg-muted text-muted-foreground"
          >
            Clear category filter ✕
          </button>
        )}
      </div>

      {/* Wholesale Products Grid (No Flashy Bouncy Animation - Clean Professional B2B Cards) */}
      <div className="mt-6">
        {productsLoading ? (
          <LoadingState label="Loading wholesale catalog..." />
        ) : !products || products.length === 0 ? (
          <EmptyState
            title="No wholesale products found"
            description="No bulk lots available in this category currently. Please select another category or check back soon."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {products.map((product) => {
              const packPrice = product.price * product.minOrderQuantity;
              return (
                <Link
                  key={product.id}
                  to={`/bulk-orders/products/${product.id}`}
                  className="group flex flex-col rounded-lg border bg-card overflow-hidden hover:border-foreground/40 transition-colors shadow-sm"
                >
                  {/* Image Container */}
                  <div className="aspect-[4/5] overflow-hidden bg-muted relative">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">
                        No image preview
                      </div>
                    )}
                    {/* Fixed Lot Tag Overlay */}
                    <div className="absolute top-2.5 left-2.5">
                      <span className="inline-flex items-center gap-1 rounded bg-black/80 px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                        🔒 Lot: {product.minOrderQuantity} Pcs
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 flex flex-col flex-1 justify-between">
                    <div>
                      <p className="text-[11px] uppercase tracking-wider font-semibold text-accent truncate">
                        {product.categoryGender ?? "WHOLESALE"} · {product.categoryName}
                      </p>
                      <h3 className="mt-1 text-sm font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                    </div>

                    <div className="mt-4 pt-3 border-t">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs text-muted-foreground">
                          {formatPrice(product.price)} / pc
                        </span>
                        <span className="text-base font-bold text-foreground">
                          {formatPrice(packPrice)}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                        <span>Pack: {product.minOrderQuantity} pieces</span>
                        <span className="text-primary font-medium flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                          View Lot <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
