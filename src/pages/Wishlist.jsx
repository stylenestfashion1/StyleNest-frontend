import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as wishlistApi from "../api/wishlist";
import * as cartApi from "../api/cart";
import { formatPrice, formatDiscountPercent } from "../utils/format";
import { getSizeLabel } from "../utils/sizeLabel";
import { PageFade, Reveal } from "../components/Reveal";
import LoadingState from "../components/LoadingState";
import ErrorState from "../components/ErrorState";
import BackButton from "../components/BackButton";
import { useToast } from "../context/ToastContext";
import { useCurrency } from "../context/CurrencyContext";

// Wishlist prices are always shown in INR -- the wishlist endpoint doesn't
// carry per-currency prices (it's a "saved for later" list, not part of
// cart/checkout), so this intentionally doesn't follow the site-wide
// currency toggle the way ProductCard/Cart/Checkout do.
export default function Wishlist() {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const { currency } = useCurrency();

  const { data: wishlist, isLoading, isError, refetch } = useQuery({ queryKey: ["wishlist"], queryFn: wishlistApi.getWishlist });

  const removeItem = useMutation({
    mutationFn: (id) => wishlistApi.removeWishlistItem(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["wishlist"] }),
  });

  const moveToBag = useMutation({
    mutationFn: async (item) => {
      await cartApi.addToCart({ productVariantId: item.productVariantId, quantity: 1, currency });
      await wishlistApi.removeWishlistItem(item.wishlistItemId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      window.dispatchEvent(new Event("stylenest:cart-bump"));
      notify("Moved to bag", "success");
    },
    onError: (err) => notify(err.message, "error"),
  });

  if (isLoading) return <LoadingState label="Loading wishlist" />;
  if (isError) return <ErrorState message="Could not load your wishlist." onRetry={refetch} />;

  if (!wishlist || wishlist.items.length === 0) {
    return (
      <PageFade>
        <div className="mx-auto max-w-[1440px] px-5 py-24 text-center md:px-10">
          <h2 className="text-2xl">Nothing saved yet</h2>
          <p className="mx-auto mt-3 max-w-sm text-sm text-muted-foreground">Tap the heart on any piece to keep it here.</p>
          <Link to="/women" className="btn-solid mt-8 inline-block">
            Continue shopping
          </Link>
        </div>
      </PageFade>
    );
  }

  return (
    <PageFade>
      <div className="mx-auto max-w-[1440px] px-5 py-12 md:px-10">
        <BackButton fallback="/account" className="mb-6" />
        <h1 className="text-[clamp(1.9rem,3.6vw,2.8rem)]">Wishlist</h1>
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {wishlist.items.map((item, i) => {
            const hasDiscount = item.discountPrice != null && item.discountPrice < item.price;
            return (
              <Reveal key={item.wishlistItemId} delay={i * 60} className="hairline-card">
                <Link to={`/products/${item.slug ?? item.productId}`} className="zoom-media block aspect-[4/5] overflow-hidden bg-muted">
                  {item.imageUrl && <img src={item.imageUrl} alt={item.productName} className="h-full w-full object-cover" />}
                </Link>
                <div className="space-y-1 p-4">
                  <Link to={`/products/${item.slug ?? item.productId}`} className="display block text-base">
                    {item.productName}
                  </Link>
                  {(item.color || item.size) && <p className="label-xs text-muted-foreground">{[item.color, item.size && getSizeLabel(item.size)].filter(Boolean).join(" / ")}</p>}
                  <div className="flex items-baseline gap-2 text-xs">
                    <span className={hasDiscount ? "text-accent" : ""}>{formatPrice(hasDiscount ? item.discountPrice : item.price)}</span>
                    {hasDiscount && <span className="text-muted-foreground line-through">{formatPrice(item.price)}</span>}
                  </div>
                  {hasDiscount && <p className="label-xs text-accent">{formatDiscountPercent(item.price, item.discountPrice)}</p>}
                  <div className="mt-2 flex items-center gap-4">
                    {item.productVariantId ? (
                      <button onClick={() => moveToBag.mutate(item)} className="label-xs link-underline text-accent">
                        Move to bag
                      </button>
                    ) : (
                      <Link to={`/products/${item.slug ?? item.productId}`} className="label-xs link-underline text-accent">
                        Select options
                      </Link>
                    )}
                    <button onClick={() => removeItem.mutate(item.wishlistItemId)} className="label-xs text-muted-foreground">
                      Remove
                    </button>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </PageFade>
  );
}
