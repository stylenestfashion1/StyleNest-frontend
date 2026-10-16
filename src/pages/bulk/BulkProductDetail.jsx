import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ShoppingBag, Lock, ShieldCheck, CheckCircle2, ArrowRight } from "lucide-react";
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

  if (isLoading) return <LoadingState label="Loading wholesale product..." />;
  if (isError) return <ErrorState message={error.message} onRetry={refetch} />;
  if (!product) return null;

  // Fixed lot quantity configured by admin - non-editable for buyers
  const fixedLotQty = product.minOrderQuantity ?? 25;
  const totalPackPrice = product.price * fixedLotQty;

  function handleAddToCart() {
    bulkCart.addItem(product, fixedLotQty);
    notify(`${product.name} (${fixedLotQty} pcs bulk pack) added to cart`, "success");
  }

  function handleBuyNow() {
    bulkCart.addItem(product, fixedLotQty);
    navigate("/bulk-orders/cart");
  }

  return (
    <div className="mx-auto max-w-[1240px] px-5 py-10 md:px-10">
      <BackButton fallback="/bulk-orders/catalog" className="mb-6" />

      <div className="grid gap-10 lg:grid-cols-2 items-start">
        {/* Left: Product Image */}
        <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
          <div className="aspect-[4/5] bg-muted relative">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground">
                No image preview available
              </div>
            )}
            <div className="absolute top-4 left-4">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-black/85 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                <Lock className="h-3 w-3" />
                Wholesale Lot: {fixedLotQty} Pcs
              </span>
            </div>
          </div>
        </div>

        {/* Right: Product Details & Fixed Lot Specification */}
        <div className="flex flex-col">
          {/* Category & Title */}
          <div>
            <p className="label-xs font-bold uppercase tracking-wider text-accent">
              {product.categoryGender ?? "WHOLESALE"} · {product.categoryName}
            </p>
            <h1 className="mt-2 text-2xl md:text-3xl font-extrabold text-foreground">
              {product.name}
            </h1>
            {product.hsnCode && (
              <p className="mt-1 text-xs font-mono text-muted-foreground">
                HSN Code: {product.hsnCode}
              </p>
            )}
          </div>

          {/* Pricing Info */}
          <div className="mt-5 flex items-baseline gap-3">
            <span className="text-2xl font-bold text-foreground">
              {formatPrice(product.price)}
            </span>
            <span className="text-sm font-medium text-muted-foreground">
              per piece (wholesale rate)
            </span>
          </div>

          {product.description && (
            <div className="mt-4 text-sm text-muted-foreground leading-relaxed border-t pt-4">
              {product.description}
            </div>
          )}

          {/* PROMINENT FIXED BULK LOT BADGE / CARD */}
          <div className="mt-6 rounded-xl border-2 border-primary/25 bg-primary/5 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                Wholesale Pack Lot Size
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-900">
                <Lock className="h-3 w-3" />
                Fixed Lot (Non-Editable)
              </span>
            </div>

            {/* BADE ME QUANTITY (Prominent Size) */}
            <div className="mt-3 flex items-baseline gap-3">
              <span className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
                {fixedLotQty}
              </span>
              <span className="text-xl font-bold text-muted-foreground">
                Pieces per Bulk Pack
              </span>
            </div>

            {/* Calculation Breakdown */}
            <div className="mt-5 pt-4 border-t border-primary/15 flex items-baseline justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">
                  Pack Calculation: {fixedLotQty} pcs × {formatPrice(product.price)}
                </p>
                <p className="text-sm font-semibold text-foreground mt-0.5">
                  Total Bulk Pack Price:
                </p>
              </div>
              <span className="text-2xl md:text-3xl font-black text-primary">
                {formatPrice(totalPackPrice)}
              </span>
            </div>

            {/* Policy Clarification */}
            <div className="mt-4 flex items-start gap-2 rounded-lg bg-background/80 p-3 text-xs text-muted-foreground border">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Wholesale Rule:</strong> This product is pre-packed in a fixed lot of <strong>{fixedLotQty} pieces</strong>. Individual loose pieces or custom quantities are not permitted for this listing.
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleAddToCart}
              className="btn-outline flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2"
            >
              <ShoppingBag className="h-4 w-4" />
              Add Pack ({fixedLotQty} Pcs) to Cart
            </button>
            <button
              onClick={handleBuyNow}
              className="btn-solid flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2"
            >
              Buy Pack Now ({formatPrice(totalPackPrice)})
            </button>
          </div>

          {/* Bulk Cart Link */}
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
