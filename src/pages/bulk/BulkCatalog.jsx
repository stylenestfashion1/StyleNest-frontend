import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ShoppingBag, Check, ArrowRight, X, ChevronRight, Images, Palette } from "lucide-react";
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
      (c) => c.gender === "WOMEN" || c.slug?.startsWith("women-")
    );
  }, [categories]);

  const activeCategory = useMemo(() => {
    if (!selectedCategoryId) return null;
    return categories.find((c) => c.id === selectedCategoryId);
  }, [categories, selectedCategoryId]);

  function handleExitBulk() {
    clearBulkToken();
    navigate("/bulk-orders");
  }

  return (
    <div className="mx-auto max-w-[1440px] px-5 py-10 md:px-10">
      {/* Top Banner / Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-6">
        <div>
          <span className="label-xs text-accent uppercase font-bold tracking-wider">
            Wholesale B2B Portal
          </span>
          <h1 className="mt-1 text-2xl md:text-3xl font-extrabold text-foreground font-serif">
            Wholesale Catalog
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Browse our wholesale lots by category. Select colors, customize order quantities, and request factory direct dispatch.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/bulk-orders/cart"
            className="btn-outline text-xs px-4 py-2.5 flex items-center gap-2 shadow-xs"
          >
            <ShoppingBag className="h-4 w-4" />
            Bulk Cart
            {bulkCart.totalItems > 0 && (
              <span className="ml-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-accent-foreground">
                {bulkCart.totalItems} pcs
              </span>
            )}
          </Link>
          <button
            onClick={handleExitBulk}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Exit Wholesale
          </button>
        </div>
      </div>

      {/* Category Filter Cards */}
      {categoriesLoading ? (
        <LoadingState label="Loading wholesale categories..." />
      ) : (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Filter By Collection & Category
            </h2>
            {selectedCategoryId && (
              <button
                onClick={() => setSelectedCategoryId(null)}
                className="text-xs text-accent font-semibold hover:underline flex items-center gap-1"
              >
                Clear filter <X className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Men's Wholesale Categories */}
            <div className="rounded-xl border border-border/80 bg-muted/20 p-4">
              <div className="flex items-center justify-between mb-3 border-b border-border/60 pb-2">
                <span className="text-xs font-bold tracking-wider uppercase text-foreground">
                  Men&apos;s Wholesale
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {menCategories.length} Collections
                </span>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
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

            {/* Women's Wholesale Categories */}
            <div className="rounded-xl border border-border/80 bg-muted/20 p-4">
              <div className="flex items-center justify-between mb-3 border-b border-border/60 pb-2">
                <span className="text-xs font-bold tracking-wider uppercase text-foreground">
                  Women&apos;s Wholesale
                </span>
                <span className="text-[11px] text-muted-foreground">
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

      {/* Wholesale Product Cards */}
      <div className="mt-6">
        {productsLoading ? (
          <LoadingState label="Loading wholesale catalog..." />
        ) : !products || products.length === 0 ? (
          <EmptyState
            title="No wholesale products available"
            description="No bulk products found for this selection. Try choosing another category above."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => {
              const photoCount = product.imageUrls?.length || (product.imageUrl ? 1 : 0);
              const colorCount = product.colors?.length || 0;

              return (
                <Link
                  key={product.id}
                  to={`/bulk-orders/products/${product.id}`}
                  className="group flex flex-col rounded-xl border border-border/80 bg-card overflow-hidden hover:border-foreground/50 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  {/* Image Viewport */}
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

                      {/* Color Dots Preview & Clickable Teaser */}
                      <div className="mt-2.5 flex items-center justify-between gap-1.5 bg-muted/40 px-2.5 py-1.5 rounded-lg border border-border/60">
                        <div className="flex items-center gap-1.5">
                          {colorCount > 0 ? (
                            <div className="flex -space-x-1 overflow-hidden">
                              {product.colors.slice(0, 4).map((col, cIdx) => (
                                <span
                                  key={cIdx}
                                  className="inline-block h-3.5 w-3.5 rounded-full border border-white shadow-2xs"
                                  style={{ backgroundColor: col.hex || "#111827" }}
                                  title={col.name}
                                />
                              ))}
                            </div>
                          ) : (
                            <Palette className="h-3.5 w-3.5 text-primary" />
                          )}
                          <span className="text-[11px] font-bold text-primary">
                            {colorCount > 1 ? `${colorCount} Colors Available` : "Colors Available"}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-semibold">
                          View &rarr;
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-border/60">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <span className="text-[11px] text-muted-foreground block font-medium">Wholesale Rate</span>
                          <span className="text-lg font-bold text-foreground font-serif">
                            {formatPrice(product.price)}
                            <span className="text-xs font-normal text-muted-foreground ml-1">/ pc</span>
                          </span>
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 border border-accent/20 px-2.5 py-0.5 text-[11px] font-bold text-accent">
                          Min: {product.minOrderQuantity} pcs
                        </span>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-dashed border-border/50">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          {colorCount > 1 ? `${colorCount} Colors` : "Colors inside"}
                        </span>
                        <span className="text-accent font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          Select Color <ArrowRight className="h-3 w-3" />
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
