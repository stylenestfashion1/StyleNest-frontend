import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Minus, Plus, X } from "lucide-react";
import * as cartApi from "../api/cart";
import { formatPrice } from "../utils/format";
import { getSizeLabel } from "../utils/sizeLabel";
import { PageFade, Reveal } from "../components/Reveal";
import LoadingState from "../components/LoadingState";
import ErrorState from "../components/ErrorState";
import BackButton from "../components/BackButton";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { useGuestCart } from "../context/GuestCartContext";

export default function Cart() {
  const { isAuthenticated } = useAuth();
  const guestCart = useGuestCart();
  const queryClient = useQueryClient();
  const { notify } = useToast();

  const { data: serverCart, isLoading, isError, refetch } = useQuery({
    queryKey: ["cart"],
    queryFn: cartApi.getCart,
    enabled: isAuthenticated,
  });

  const updateItem = useMutation({
    mutationFn: ({ cartItemId, quantity }) => cartApi.updateCartItem(cartItemId, { quantity }),
    onSuccess: (data) => queryClient.setQueryData(["cart"], data),
    onError: (err) => notify(err.message, "error"),
  });

  const removeItem = useMutation({
    mutationFn: (cartItemId) => cartApi.removeCartItem(cartItemId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
    onError: (err) => notify(err.message, "error"),
  });

  // Registered: server-authoritative cart (react-query). Guest: local
  // context, shaped to match the same {items, totalPrice} contract so the
  // JSX below doesn't need to branch item-by-item.
  const cart = isAuthenticated
    ? serverCart
    : {
        items: guestCart.items.map((i) => ({
          cartItemId: i.productVariantId,
          productName: i.productName,
          color: i.color,
          size: i.size,
          quantity: i.quantity,
          imageUrl: i.imageUrl,
          subTotal: i.price * i.quantity,
        })),
        totalPrice: guestCart.totalPrice,
      };

  function handleUpdateQuantity(cartItemId, quantity) {
    if (isAuthenticated) {
      updateItem.mutate({ cartItemId, quantity });
    } else {
      guestCart.updateQuantity(cartItemId, quantity);
    }
  }

  function handleRemoveItem(cartItemId) {
    if (isAuthenticated) {
      removeItem.mutate(cartItemId);
    } else {
      guestCart.removeItem(cartItemId);
    }
  }

  if (isAuthenticated && isLoading) return <LoadingState label="Loading bag" />;
  if (isAuthenticated && isError) return <ErrorState message="Could not load your bag." onRetry={refetch} />;

  if (!cart || cart.items.length === 0) {
    return (
      <PageFade>
        <div className="mx-auto max-w-[1440px] px-5 py-24 text-center md:px-10">
          <h1 className="text-[clamp(1.9rem,3.6vw,2.8rem)]">Your bag is empty</h1>
          <p className="mx-auto mt-4 max-w-sm text-sm text-muted-foreground">Nothing here yet. Start with tailoring, denim or the silk that started it all.</p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link to="/men" className="btn-solid">
              Shop men
            </Link>
            <Link to="/women" className="btn-outline">
              Shop women
            </Link>
          </div>
        </div>
      </PageFade>
    );
  }

  return (
    <PageFade>
      <div className="mx-auto max-w-[1440px] px-5 py-12 md:px-10">
        <BackButton className="mb-6" />
        <h1 className="text-[clamp(1.9rem,3.6vw,2.8rem)]">Shopping Bag</h1>
        <div className="mt-10 grid gap-12 lg:grid-cols-[1.4fr_1fr]">
          <ul className="border-t">
            {cart.items.map((item, i) => (
              <Reveal as="li" key={item.cartItemId} delay={i * 70}>
                <div className="flex gap-5 border-b py-6">
                  <div className="h-32 w-24 shrink-0 border bg-muted">
                    {item.imageUrl && <img src={item.imageUrl} alt={item.productName} className="h-full w-full object-cover" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="display text-lg">{item.productName}</p>
                        <p className="label-xs mt-2 text-muted-foreground">
                          {item.color} · Size {getSizeLabel(item.size)}
                        </p>
                      </div>
                      <button aria-label="Remove" onClick={() => handleRemoveItem(item.cartItemId)}>
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-5 flex items-center justify-between">
                      <div className="flex items-center border">
                        <button
                          className="px-3 py-2"
                          aria-label="Decrease quantity"
                          onClick={() => item.quantity > 1 && handleUpdateQuantity(item.cartItemId, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="label-xs w-8 text-center">{item.quantity}</span>
                        <button
                          className="px-3 py-2"
                          aria-label="Increase quantity"
                          onClick={() => handleUpdateQuantity(item.cartItemId, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <span className="text-sm">{formatPrice(item.subTotal)}</span>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </ul>

          <Reveal>
            <div className="hairline-card p-6">
              <h2 className="text-xl">Order Summary</h2>
              <dl className="mt-6 space-y-3 text-sm">
                <Row label="Subtotal" value={formatPrice(cart.totalPrice)} />
                <Row label="Shipping" value="Calculated at checkout" />
              </dl>
              <div className="mt-6 flex items-baseline justify-between border-t pt-5">
                <span className="label-xs">Total</span>
                <span className="display text-xl">{formatPrice(cart.totalPrice)}</span>
              </div>
              <Link to="/checkout" className="btn-solid mt-8 w-full">
                Checkout
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </PageFade>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-baseline justify-between">
      <dt className="label-xs text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
