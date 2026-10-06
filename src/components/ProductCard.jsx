import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatPrice, formatDiscountPercent, resolveProductPrice } from "../utils/format";
import { useAuth } from "../context/AuthContext";
import { useCurrency } from "../context/CurrencyContext";
import * as wishlistApi from "../api/wishlist";

export default function ProductCard({ product }) {
  const { isAuthenticated } = useAuth();
  const { currency } = useCurrency();
  const queryClient = useQueryClient();

  const { data: wishlist } = useQuery({
    queryKey: ["wishlist"],
    queryFn: wishlistApi.getWishlist,
    enabled: isAuthenticated,
  });
  const saved = wishlist?.items?.some((i) => i.productId === product.id) ?? false;

  const toggleWishlist = useMutation({
    mutationFn: async () => {
      if (saved) {
        const item = wishlist.items.find((i) => i.productId === product.id);
        await wishlistApi.removeWishlistItem(item.wishlistItemId);
      } else {
        await wishlistApi.addToWishlist({ productId: product.id });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["wishlist"] }),
  });

  const activePrice = resolveProductPrice(product, currency);
  const hasDiscount = activePrice?.discountPrice != null && activePrice.discountPrice < activePrice.regularPrice;
  const offLabel = hasDiscount ? formatDiscountPercent(activePrice.regularPrice, activePrice.discountPrice) : null;

  return (
    <div className="group hairline-card relative flex h-full flex-col justify-between women:border-transparent women:bg-transparent">
      <div>
        <Link to={`/products/${product.slug ?? product.id}`} className="zoom-media block aspect-[4/5] overflow-hidden bg-muted">
          {product.thumbnailUrl ? (
            <img src={product.thumbnailUrl} alt={product.name} loading="lazy" className="h-full w-full object-cover object-top" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="label-xs text-muted-foreground">No Image</span>
            </div>
          )}
        </Link>
        {isAuthenticated && (
          <button
            type="button"
            aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
            onClick={(e) => {
              e.preventDefault();
              toggleWishlist.mutate();
            }}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border bg-card/85 transition-colors hover:bg-accent hover:text-accent-foreground women:h-8 women:w-8 women:border-card/60"
          >
            <Heart className="h-4 w-4 women:h-3.5 women:w-3.5" fill={saved ? "currentColor" : "none"} />
          </button>
        )}
        {hasDiscount && (
          <span className="label-xs absolute left-3 top-3 bg-accent px-2 py-1 text-accent-foreground women:border women:border-accent women:bg-card/90 women:text-accent women:tracking-[0.3em]">
            Sale
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between p-4 women:p-0 women:pt-4">
        <div>
          <Link
            to={`/products/${product.slug ?? product.id}`}
            className="display block text-sm sm:text-base leading-snug line-clamp-2 min-h-[2.6rem] women:text-lg women:italic"
            title={product.name}
          >
            {product.name}
          </Link>
        </div>
        <div className="pt-2">
          {activePrice ? (
            <div className="flex items-baseline gap-2 text-xs">
              <span className={hasDiscount ? "text-accent font-medium" : "text-foreground font-medium"}>
                {formatPrice(hasDiscount ? activePrice.discountPrice : activePrice.regularPrice, currency)}
              </span>
              {hasDiscount && <span className="text-muted-foreground line-through">{formatPrice(activePrice.regularPrice, currency)}</span>}
            </div>
          ) : (
            <p className="label-xs text-muted-foreground">Not available in {currency} yet</p>
          )}
          {offLabel && <p className="label-xs text-accent mt-0.5">{offLabel}</p>}
        </div>
      </div>
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="hairline-card flex h-full flex-col justify-between women:border-transparent women:bg-transparent">
      <div>
        <div className="skeleton aspect-[4/5] w-full" />
      </div>
      <div className="flex flex-1 flex-col justify-between p-4 women:p-0 women:pt-4">
        <div>
          <div className="skeleton h-4 w-5/6" />
          <div className="skeleton mt-1 h-4 w-1/2" />
        </div>
        <div className="skeleton h-3 w-1/3 pt-2" />
      </div>
    </div>
  );
}
