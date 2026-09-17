import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatPrice, formatDiscountPercent } from "../utils/format";
import { useAuth } from "../context/AuthContext";
import * as wishlistApi from "../api/wishlist";

export default function ProductCard({ product }) {
  const { isAuthenticated } = useAuth();
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

  const hasDiscount = product.discountPrice != null && product.discountPrice < product.price;
  const offLabel = hasDiscount ? formatDiscountPercent(product.price, product.discountPrice) : null;

  return (
    <div className="group hairline-card relative women:border-transparent women:bg-transparent">
      <Link to={`/products/${product.id}`} className="zoom-media block aspect-[4/5] overflow-hidden bg-muted">
        {product.thumbnailUrl ? (
          <img src={product.thumbnailUrl} alt={product.name} loading="lazy" className="h-full w-full object-cover" />
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
      <div className="space-y-1 p-4 women:space-y-1.5 women:p-0 women:pt-4">
        <Link to={`/products/${product.id}`} className="display block text-base women:text-lg women:italic">
          {product.name}
        </Link>
        <div className="flex items-baseline gap-2 text-xs">
          <span className={hasDiscount ? "text-accent" : "text-foreground"}>
            {formatPrice(hasDiscount ? product.discountPrice : product.price)}
          </span>
          {hasDiscount && <span className="text-muted-foreground line-through">{formatPrice(product.price)}</span>}
        </div>
        {offLabel && <p className="label-xs text-accent">{offLabel}</p>}
      </div>
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="hairline-card women:border-transparent women:bg-transparent">
      <div className="skeleton aspect-[4/5] w-full" />
      <div className="space-y-2 p-4 women:p-0 women:pt-4">
        <div className="skeleton h-4 w-2/3" />
        <div className="skeleton h-3 w-1/3" />
      </div>
    </div>
  );
}
