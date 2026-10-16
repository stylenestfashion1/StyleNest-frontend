import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ShoppingBag, Check, ArrowRight, X, ChevronRight, Images } from "lucide-react";
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
      {/* Editorial Wholesale Top Banner */}
      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-border/80 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <p className="label-xs font-semibold uppercase tracking-[0.2em] text-accent">
              StyleNest Wholesale · B2B Client Portal
            </p>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight md:text-4xl text-foreground font-serif">
            Bulk Order Catalog
          </h1>
          <p className="text-xs text-muted-foreground mt-1.5 max-w-xl leading-relaxed">
            Direct factory wholesale pricing. Products are pre-packed in uniform bulk lots with complete multi-angle views and invoicing specifications.
          </p>
        </div>

        <Link
          to="/bulk-orders/cart"
          className="btn-outline flex items-center gap-2.5 py-2.5 px-5 rounded-md hover:bg-foreground hover:text-background transition-all shadow-sm"
        >
          <ShoppingBag className="h-4 w-4" />
          <span className="font-semibold text-xs tracking-wider uppercase">Bulk Cart</span>
          {bulkCart.totalItems > 0 && (
            <span className="ml-1 rounded-full bg-accent text-accent-foreground px-2 py-0.5 text-xs font-bold">
              {bulkCart.totalItems} pcs
            </span>
          )}
        </Link>
      </div>

      {/* Premium Minimalist Categories Section (No Emojis, Subtle Luxury Hover Effects) */}
      {!categoriesLoading && categories.length > 0 && (
        <div className="mt-8 rounded-2xl border border-border/70 bg-card/60 p-6 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between pb-4 border-b border-border/60">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                Browse Collections
              </span>
              <p className="text-xs text-foreground/70 mt-0.5">
                Select a collection below to filter wholesale listings
              </p>
            </div>
            {selectedCategoryId && (
              <button
                onClick={() => setSelectedCategoryId(null)}
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
              >
                <X className="h-3 w-3" />
                Clear Filter (View All)
              </button>
            )}
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Men's Wholesale Collection */}
            <div className="rounded-xl border border-border/50 bg-background/50 p-5 transition-shadow hover:shadow-md">
              <div className="flex items-center justify-between pb-3 border-b border-border/40 mb-3">
                <span className="text-xs font-bold uppercase tracking-[0.22em] text-foreground font-serif">
                  Men's Wholesale
                </span>
                <span className="text-[11px] text-muted-foreground tracking-wider uppercase">
                  {menCategories.length} Collections
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
                        className={`group relative w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm text-left transition-all duration-200 ${
                          isSelected
                            ? "bg-foreground text-background font-semibold shadow-sm border-l-4 border-accent pl-4"
                            : "hover:bg-accent/10 hover:border-accent/40 text-foreground/80 hover:text-foreground hover:pl-5"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {isSelected && <Check className="h-3.5 w-3.5 text-accent shrink-0" />}
                          <span className="tracking-wide">{c.name}</span>
                        </span>
                        <ChevronRight
                          className={`h-3.5 w-3.5 transition-transform duration-200 ${
                            isSelected
                              ? "text-accent translate-x-0.5"
                              : "text-muted-foreground/60 group-hover:translate-x-1 group-hover:text-foreground"
                          }`}
                        />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Women's Wholesale Collection */}
            <div className="rounded-xl border border-border/50 bg-background/50 p-5 transition-shadow hover:shadow-md">
              <div className="flex items-center justify-between pb-3 border-b border-border/40 mb-3">
                <span className="text-xs font-bold uppercase tracking-[0.22em] text-foreground font-serif">
                  Women's Wholesale
                </span>
                <span className="text-[11px] text-muted-foreground tracking-wider uppercase">
                  {womenCategories.length} Collections
                </span>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {womenCategories.map((c) => {
                  const isSelected = selectedCategoryId === c.id;
                  return (
                    <li key={c.id}>
                      <button
                        onClick={() =>
                          setSelectedCategoryId(isSelected ? null : c.id)
                        }
                        className={`group relative w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm text-left transition-all duration-200 ${
                          isSelected
                            ? "bg-foreground text-background font-semibold shadow-sm border-l-4 border-accent pl-4"
                            : "hover:bg-accent/10 hover:border-accent/40 text-foreground/80 hover:text-foreground hover:pl-4"
                        }`}
                      >
                        <span className="flex items-center gap-2 truncate">
                          {isSelected && <Check className="h-3.5 w-3.5 text-accent shrink-0" />}
                          <span className="truncate tracking-wide">{c.name}</span>
                        </span>
                        <ChevronRight
                          className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${
                            isSelected
                              ? "text-accent translate-x-0.5"
                              : "text-muted-foreground/60 group-hover:translate-x-0.5 group-hover:text-foreground"
                          }`}
                        />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Filter Status Bar */}
      <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div>
          <h2 className="text-xl font-bold text-foreground font-serif">
            {activeCategory
              ? `${activeCategory.gender ?? (activeCategory.slug?.startsWith("men-") ? "Men's" : "Women's")} · ${activeCategory.name}`
              : "All Wholesale Listings"}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Showing {products.length} bulk wholesale pack{products.length === 1 ? "" : "s"}
          </p>
        </div>
        {selectedCategoryId && (
          <button
            onClick={() => setSelectedCategoryId(null)}
            className="text-xs font-medium text-accent hover:underline flex items-center gap-1"
          >
            Show all categories <ArrowRight className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Wholesale Product Cards - Full Natural Image View (No Cropping / Kati Kati Nahi) */}
      <div className="mt-6">
        {productsLoading ? (
          <LoadingState label="Loading wholesale catalog..." />
        ) : !products || products.length === 0 ? (
          <EmptyState
            title="No wholesale lots available"
            description="No bulk lots found for this selection. Try choosing another category above."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => {
              const packPrice = product.price * product.minOrderQuantity;
              const photoCount = product.imageUrls?.length || (product.imageUrl ? 1 : 0);

              return (
                <Link
                  key={product.id}
                  to={`/bulk-orders/products/${product.id}`}
                  className="group flex flex-col rounded-xl border border-border/80 bg-card overflow-hidden hover:border-foreground/50 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  {/* Image Viewport - Styled with object-top and aspect-[3/4] to prevent clipping */}
                  <div className="aspect-[3/4] w-full overflow-hidden bg-[#faf9f6] relative flex items-center justify-center">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.02]"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">
                        No image preview
                      </div>
                    )}

                    {/* Fixed Lot Badge */}
                    <div className="absolute top-3 left-3">
                      <span className="inline-flex items-center gap-1 rounded bg-black/85 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white backdrop-blur-sm shadow-sm">
                        Lot: {product.minOrderQuantity} Pcs
                      </span>
                    </div>

                    {/* Multi-angle Photos Badge */}
                    {photoCount > 1 && (
                      <div className="absolute bottom-2.5 right-2.5">
                        <span className="inline-flex items-center gap-1 rounded bg-black/70 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                          <Images className="h-3 w-3" />
                          {photoCount} Photos
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="p-4 flex flex-col flex-1 justify-between">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.15em] font-semibold text-accent truncate">
                        {product.categoryGender ?? "WHOLESALE"} · {product.categoryName}
                      </p>
                      <h3 className="mt-1 text-sm font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                    </div>

                    <div className="mt-4 pt-3 border-t border-border/60">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs text-muted-foreground">
                          {formatPrice(product.price)} / pc
                        </span>
                        <span className="text-base font-bold text-foreground">
                          {formatPrice(packPrice)}
                        </span>
                      </div>

                      <div className="mt-2.5 flex items-center justify-between text-xs text-muted-foreground">
                        <span className="font-medium text-foreground/80">
                          Pack: {product.minOrderQuantity} pieces
                        </span>
                        <span className="text-accent font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          View Details <ArrowRight className="h-3 w-3" />
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
