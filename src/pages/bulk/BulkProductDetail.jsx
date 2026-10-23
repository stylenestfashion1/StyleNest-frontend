import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ShoppingBag,
  ShieldCheck,
  ArrowRight,
  Eye,
  Minus,
  Plus,
  PackageCheck,
  Sparkles,
} from "lucide-react";
import LoadingState from "../../components/LoadingState";
import ErrorState from "../../components/ErrorState";
import BackButton from "../../components/BackButton";
import { getBulkProduct } from "../../api/bulk";
import { useBulkCart } from "../../context/BulkCartContext";
import { useToast } from "../../context/ToastContext";
import { formatPrice } from "../../utils/format";

export default function BulkProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const bulkCart = useBulkCart();
  const { notify } = useToast();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);

  const {
    data: product,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["bulk-product", id],
    queryFn: () => getBulkProduct(id),
  });

  const minQty = product?.minOrderQuantity ?? 10;
  const availableStock = product?.availableStock;

  // Custom quantity state: defaults to MOQ (e.g. 10 or whatever admin set)
  const [quantity, setQuantity] = useState(minQty);

  useEffect(() => {
    if (product?.minOrderQuantity) {
      setQuantity(product.minOrderQuantity);
    }
  }, [product?.minOrderQuantity]);

  // Color selection logic
  const hasColors = product?.colors && Array.isArray(product.colors) && product.colors.length > 0;
  const activeColor = hasColors ? product.colors[selectedColorIndex] || product.colors[0] : null;

  // STRICT COLOR PHOTO ISOLATION:
  // If product has colors, galleryImages strictly derives from activeColor.images!
  // Mixing photos of different colors is strictly prevented.
  const galleryImages = useMemo(() => {
    if (!product) return [];
    if (activeColor && activeColor.images && activeColor.images.length > 0) {
      return activeColor.images;
    }
    if (product.imageUrls && product.imageUrls.length > 0) {
      return product.imageUrls;
    }
    return product.imageUrl ? [product.imageUrl] : [];
  }, [product, activeColor]);

  if (isLoading) return <LoadingState label="Loading wholesale product..." />;
  if (isError) return <ErrorState message={error.message} onRetry={refetch} />;
  if (!product) return null;

  const currentImage = galleryImages[activeImageIndex] || activeColor?.images?.[0] || product.imageUrl;

  // Compute validated quantity and live subtotal
  const numericQty =
    typeof quantity === "number" && !isNaN(quantity)
      ? quantity
      : parseInt(quantity, 10);
  const activeQty = isNaN(numericQty) || numericQty < minQty ? minQty : numericQty;
  const totalPrice = product.price * activeQty;

  function handleQuantityChange(val) {
    if (val === "") {
      setQuantity("");
      return;
    }
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed)) {
      setQuantity(parsed);
    }
  }

  function handleBlur() {
    if (typeof quantity !== "number" || isNaN(quantity) || quantity < minQty) {
      setQuantity(minQty);
    } else if (availableStock != null && quantity > availableStock) {
      setQuantity(availableStock);
      notify(
        `Quantity capped at maximum available stock (${availableStock} pcs)`,
        "info"
      );
    }
  }

  function stepQuantity(delta) {
    const current =
      typeof quantity === "number" && !isNaN(quantity) ? quantity : minQty;
    let next = current + delta;
    if (next < minQty) next = minQty;
    if (availableStock != null && next > availableStock) {
      next = availableStock;
      notify(`Maximum available stock reached (${availableStock} pcs)`, "info");
    }
    setQuantity(next);
  }

  function handleAddToCart() {
    if (activeQty < minQty) {
      notify(`Minimum wholesale quantity is ${minQty} pieces.`, "error");
      return;
    }
    if (availableStock != null && activeQty > availableStock) {
      notify(
        `Only ${availableStock} pieces available in stock for this product.`,
        "error"
      );
      return;
    }
    bulkCart.addItem(product, activeQty, activeColor?.name);
    notify(
      `${product.name}${activeColor?.name ? ` (${activeColor.name})` : ""} (${activeQty} pieces) added to bulk cart`,
      "success"
    );
  }

  function handleBuyNow() {
    if (activeQty < minQty) {
      notify(`Minimum wholesale quantity is ${minQty} pieces.`, "error");
      return;
    }
    if (availableStock != null && activeQty > availableStock) {
      notify(
        `Only ${availableStock} pieces available in stock for this product.`,
        "error"
      );
      return;
    }
    bulkCart.addItem(product, activeQty, activeColor?.name);
    navigate("/bulk-orders/cart");
  }

  return (
    <div className="mx-auto max-w-[1340px] px-5 py-10 md:px-10">
      <BackButton fallback="/bulk-orders/catalog" className="mb-6" />

      <div className="grid gap-12 lg:grid-cols-12 items-start">
        {/* Left Column: Full Product Photos Gallery (Multi-view: Front, Side, Back, etc.) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Main Hero Photo (object-contain with aspect-[3/4] so NO CLIPPING) */}
          <div className="w-full aspect-[3/4] max-h-[660px] rounded-2xl border border-border/80 bg-[#faf9f6] relative overflow-hidden flex items-center justify-center shadow-sm">
            {currentImage ? (
              <img
                src={currentImage}
                alt={`${product.name} ${activeColor?.name ? `(${activeColor.name})` : ""} - View ${activeImageIndex + 1}`}
                className="h-full w-full object-contain p-2"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground">
                No image available
              </div>
            )}

            {/* Wholesale MOQ Overlay Badge */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-black/85 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-sm shadow-sm">
                <PackageCheck className="h-3.5 w-3.5 text-accent" />
                Wholesale · Min: {minQty} Pcs
              </span>
              {activeColor?.name && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 border px-3 py-0.5 text-xs font-bold text-foreground backdrop-blur-sm shadow-xs">
                  <span
                    className="h-2.5 w-2.5 rounded-full border border-black/20"
                    style={{ backgroundColor: activeColor.hex || "#000" }}
                  />
                  {activeColor.name}
                </span>
              )}
            </div>

            {/* Photo Counter */}
            {galleryImages.length > 1 && (
              <div className="absolute bottom-4 right-4 rounded-full bg-black/70 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                View {activeImageIndex + 1} of {galleryImages.length}
              </div>
            )}
          </div>

          {/* Gallery Thumbnails List (All Available Angle Views for Currently Selected Color) */}
          {galleryImages.length > 1 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {activeColor?.name ? `${activeColor.name} Views` : "Available Angle Views"} ({galleryImages.length} Photos):
                  </span>
                </div>
                {activeColor?.name && (
                  <span className="text-[11px] text-muted-foreground">
                    Strictly showing {activeColor.name} photos
                  </span>
                )}
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`h-24 w-20 shrink-0 overflow-hidden rounded-xl border-2 bg-[#faf9f6] transition-all p-1 ${
                      activeImageIndex === idx
                        ? "border-primary shadow-md ring-2 ring-primary/20 scale-105"
                        : "border-border/60 opacity-70 hover:opacity-100 hover:border-foreground/40"
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Angle ${idx + 1}`}
                      className="h-full w-full object-contain"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Wholesale Specifications & Flexible Custom Quantity */}
        <div className="lg:col-span-5 flex flex-col">
          {/* Category & Title */}
          <div className="border-b pb-5">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
              {product.categoryGender ?? "WHOLESALE"} · {product.categoryName}
            </span>
            <h1 className="mt-2 text-2xl md:text-3xl font-extrabold text-foreground font-serif leading-tight">
              {product.name}
            </h1>
            {product.hsnCode && (
              <p className="mt-2 inline-block rounded bg-muted px-2.5 py-0.5 text-xs font-mono text-muted-foreground">
                HSN Code: {product.hsnCode}
              </p>
            )}
          </div>

          {/* Wholesale Unit Pricing */}
          <div className="mt-6 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-foreground font-serif">
              {formatPrice(product.price)}
            </span>
            <span className="text-sm font-medium text-muted-foreground">
              per piece (wholesale rate)
            </span>
          </div>

          {/* Stock Availability status */}
          <div className="mt-3 flex items-center gap-2">
            {availableStock != null ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-0.5 text-xs font-semibold text-emerald-800">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                {availableStock} pieces in warehouse stock
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-0.5 text-xs font-semibold text-primary">
                <Sparkles className="h-3 w-3" />
                Made-to-Order · Wholesale Batch Available
              </span>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <div className="mt-4 text-sm text-muted-foreground leading-relaxed">
              {product.description}
            </div>
          )}

          {/* COLORWAY SELECTOR (STRICT PHOTO ISOLATION) */}
          {hasColors && (
            <div className="mt-6 rounded-2xl border-2 border-border/80 bg-muted/20 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Select Colorway ({product.colors.length} Available):
                </span>
                <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
                  {activeColor?.name}
                </span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {product.colors.map((c, idx) => {
                  const isSelected = selectedColorIndex === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSelectedColorIndex(idx);
                        setActiveImageIndex(0);
                      }}
                      className={`flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-xs font-semibold border-2 transition-all cursor-pointer ${
                        isSelected
                          ? "border-primary bg-background text-primary shadow-xs ring-2 ring-primary/25 scale-[1.02]"
                          : "border-border/80 bg-background/80 text-foreground hover:border-foreground/40"
                      }`}
                    >
                      <span
                        className="h-4 w-4 rounded-full border border-black/20 shrink-0 shadow-xs"
                        style={{ backgroundColor: c.hex || "#111827" }}
                      />
                      <span>{c.name}</span>
                      {c.images?.length > 0 && (
                        <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {c.images.length}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-muted-foreground mt-3 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Switching colors immediately shows only that specific color's photos.
              </p>
            </div>
          )}

          {/* CUSTOM QUANTITY SELECTOR (BUYER KE HATH ME QUANTITY) */}
          <div className="mt-8 rounded-2xl border-2 border-primary/25 bg-primary/5 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-foreground">
                Enter Order Quantity
              </span>
              <span className="text-xs font-bold text-accent bg-accent/10 px-2.5 py-0.5 rounded-full">
                Min. Order: {minQty} Pcs
              </span>
            </div>

            {/* Interactive Quantity Box (Direct Number Input + Steppers) */}
            <div className="mt-4 flex items-center gap-3">
              <div className="flex items-center rounded-xl border-2 border-primary/30 bg-background shadow-xs overflow-hidden">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  onClick={() => stepQuantity(-1)}
                  disabled={activeQty <= minQty}
                  className="px-4 py-3 text-foreground hover:bg-muted active:scale-95 transition-transform disabled:opacity-30 disabled:pointer-events-none"
                >
                  <Minus className="h-5 w-5" />
                </button>

                <input
                  type="number"
                  min={minQty}
                  max={availableStock ?? undefined}
                  value={quantity}
                  onChange={(e) => handleQuantityChange(e.target.value)}
                  onBlur={handleBlur}
                  className="w-24 text-center font-bold text-2xl md:text-3xl text-foreground bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  aria-label="Wholesale quantity"
                />

                <button
                  type="button"
                  aria-label="Increase quantity"
                  onClick={() => stepQuantity(1)}
                  disabled={availableStock != null && activeQty >= availableStock}
                  className="px-4 py-3 text-foreground hover:bg-muted active:scale-95 transition-transform disabled:opacity-30 disabled:pointer-events-none"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>

              <div className="flex flex-col">
                <span className="text-lg font-bold text-foreground">
                  Pieces
                </span>
                <span className="text-xs text-muted-foreground font-medium">
                  Type any custom quantity (e.g. 10, 20, 50, 100)
                </span>
              </div>
            </div>

            {/* Quick Increment Buttons */}
            <div className="mt-3.5 flex items-center gap-2">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Quick Add:
              </span>
              {[5, 10, 25, 50].map((inc) => (
                <button
                  key={inc}
                  type="button"
                  onClick={() => stepQuantity(inc)}
                  className="rounded-lg border border-border/80 bg-background px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-primary/10 hover:border-primary/40 transition-colors shadow-2xs"
                >
                  +{inc}
                </button>
              ))}
            </div>

            {/* Live Calculation Breakdown */}
            <div className="mt-6 pt-5 border-t border-primary/20 flex items-baseline justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">
                  Subtotal: {activeQty} pcs × {formatPrice(product.price)}
                </p>
                <p className="text-sm font-bold text-foreground mt-0.5">
                  Total Order Amount:
                </p>
              </div>
              <span className="text-2xl md:text-3xl font-black text-primary font-serif">
                {formatPrice(totalPrice)}
              </span>
            </div>

            {/* Notice / Policy */}
            <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-background/90 p-3.5 text-xs text-muted-foreground border border-border/80 shadow-xs">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span className="leading-relaxed">
                <strong>Wholesale Rule:</strong> Minimum order requirement is <strong>{minQty} pieces</strong> per wholesale batch. Wholesale orders are manufactured and dispatched directly in bulk lots.
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col gap-3">
            <button
              onClick={handleAddToCart}
              className="btn-outline w-full py-3.5 text-sm font-bold flex items-center justify-center gap-2 rounded-xl shadow-sm hover:shadow cursor-pointer"
            >
              <ShoppingBag className="h-4 w-4" />
              Add {activeQty} Pieces {activeColor?.name ? `(${activeColor.name}) ` : ""}to Bulk Cart
            </button>
            <button
              onClick={handleBuyNow}
              className="btn-solid w-full py-3.5 text-sm font-bold flex items-center justify-center gap-2 rounded-xl shadow-md cursor-pointer"
            >
              Order {activeQty} Pieces Now ({formatPrice(totalPrice)})
            </button>
          </div>

          {/* Navigation link */}
          <div className="mt-6 flex items-center justify-between border-t pt-4">
            <Link
              to="/bulk-orders/catalog"
              className="text-xs text-muted-foreground hover:text-foreground font-medium"
            >
              ← Back to Wholesale Catalog
            </Link>
            <Link
              to="/bulk-orders/cart"
              className="text-xs text-accent font-semibold flex items-center gap-1 hover:underline"
            >
              View Bulk Cart ({bulkCart.totalItems} pcs) <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
