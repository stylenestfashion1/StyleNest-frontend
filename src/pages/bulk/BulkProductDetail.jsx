import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Minus, Plus } from "lucide-react";
import { PageFade } from "../../components/Reveal";
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
  const [quantity, setQuantity] = useState(null);

  const { data: product, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["bulk-product", id],
    queryFn: () => getBulkProduct(id),
  });

  if (isLoading) return <LoadingState label="Loading product" />;
  if (isError) return <ErrorState message={error.message} onRetry={refetch} />;
  if (!product) return null;

  const qty = quantity ?? product.minOrderQuantity;

  function updateQty(next) {
    const floor = product.minOrderQuantity;
    const ceiling = product.availableStock ?? Infinity;
    setQuantity(Math.max(floor, Math.min(next, ceiling)));
  }

  function handleAddToCart() {
    bulkCart.addItem(product, qty);
    notify(`${product.name} added to bulk cart`, "success");
  }

  function handleBuyNow() {
    bulkCart.addItem(product, qty);
    navigate("/bulk-orders/cart");
  }

  return (
    <PageFade>
      <div className="mx-auto max-w-[1200px] px-5 py-12 md:px-10">
        <BackButton fallback="/bulk-orders/catalog" className="mb-6" />
        <div className="grid gap-12 lg:grid-cols-2">
          <div className="aspect-[4/5] overflow-hidden bg-muted">
            {product.imageUrl && <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />}
          </div>
          <div>
            <p className="label-xs text-accent">{product.categoryName}</p>
            <h1 className="mt-3 text-[clamp(1.9rem,3.6vw,2.6rem)]">{product.name}</h1>
            <p className="mt-4 text-xl">{formatPrice(product.price)} / piece</p>
            {product.description && <p className="mt-4 text-sm text-muted-foreground">{product.description}</p>}

            <p className="label-xs mt-8 text-muted-foreground">
              Minimum order quantity: {product.minOrderQuantity} pieces
              {product.availableStock != null && ` · ${product.availableStock} available`}
            </p>

            <div className="mt-4 flex items-center gap-4">
              <div className="flex items-center border">
                <button className="px-4 py-3" aria-label="Decrease quantity" onClick={() => updateQty(qty - product.minOrderQuantity)}>
                  <Minus className="h-4 w-4" />
                </button>
                <span className="label-xs w-16 text-center">{qty}</span>
                <button className="px-4 py-3" aria-label="Increase quantity" onClick={() => updateQty(qty + product.minOrderQuantity)}>
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <span className="text-sm text-muted-foreground">Subtotal: {formatPrice(qty * product.price)}</span>
            </div>

            <div className="mt-8 flex gap-3">
              <button onClick={handleAddToCart} className="btn-outline flex-1">
                Add to Bulk Cart
              </button>
              <button onClick={handleBuyNow} className="btn-solid flex-1">
                Buy Now
              </button>
            </div>

            <Link to="/bulk-orders/cart" className="label-xs link-underline mt-6 inline-block text-accent">
              View bulk cart →
            </Link>
          </div>
        </div>
      </div>
    </PageFade>
  );
}
