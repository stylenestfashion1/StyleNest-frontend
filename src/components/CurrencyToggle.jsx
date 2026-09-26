import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCurrency } from "../context/CurrencyContext";
import { useAuth } from "../context/AuthContext";
import { useGuestCart } from "../context/GuestCartContext";
import * as cartApi from "../api/cart";

/**
 * INR / USD pill switch, next to the theme toggle in the header. Per spec,
 * switching currency while the active cart (server-side for a registered
 * customer, local for a guest) has items in it clears that cart first --
 * StyleNest never lets a cart mix currencies (see Cart.currency /
 * CartServiceImpl.addToCart), so there's nothing sensible to carry over.
 */
export default function CurrencyToggle() {
  const { currency, setCurrency } = useCurrency();
  const { isAuthenticated } = useAuth();
  const guestCart = useGuestCart();
  const queryClient = useQueryClient();

  const { data: cart } = useQuery({ queryKey: ["cart"], queryFn: cartApi.getCart, enabled: isAuthenticated });

  const clearServerCart = useMutation({
    mutationFn: cartApi.clearCart,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
  });

  function handleSwitch(next) {
    if (next === currency) return;

    const hasItems = isAuthenticated ? (cart?.items?.length ?? 0) > 0 : guestCart.items.length > 0;

    if (hasItems) {
      const confirmed = window.confirm("Switching currency will clear your bag. Continue?");
      if (!confirmed) return;

      if (isAuthenticated) {
        clearServerCart.mutate();
      } else {
        guestCart.clear();
      }
    }

    setCurrency(next);
  }

  return (
    <div className="label-xs inline-flex items-center overflow-hidden rounded-full border text-[10px]" role="group" aria-label="Currency">
      {["INR", "USD"].map((c) => (
        <button
          key={c}
          type="button"
          aria-pressed={currency === c}
          onClick={() => handleSwitch(c)}
          className={`px-2.5 py-1 transition-colors ${currency === c ? "bg-foreground text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          {c}
        </button>
      ))}
    </div>
  );
}
