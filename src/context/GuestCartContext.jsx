import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const GuestCartContext = createContext(null);
const STORAGE_KEY = "stylenest_guest_cart";

function readStoredItems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Client-only cart for guests (no account, no server-side Cart row --
 * StyleNest's Cart entity is user-scoped only, by design). Lives entirely
 * in localStorage so guest "Add to Cart" never requires login; the backend
 * still recomputes prices/stock authoritatively from productVariantId at
 * order-placement time (see OrderServiceImpl#linesFromGuestRequest), so
 * nothing here is trusted for the actual charge.
 */
export function GuestCartProvider({ children }) {
  const [items, setItems] = useState(readStoredItems);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // storage unavailable (private mode, quota) -- guest cart just won't persist across reloads
    }
  }, [items]);

  const addItem = useCallback((item, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productVariantId === item.productVariantId);
      if (existing) {
        const nextQty = Math.min(existing.quantity + quantity, item.stock ?? existing.stock ?? 99);
        return prev.map((i) => (i.productVariantId === item.productVariantId ? { ...i, quantity: nextQty, stock: item.stock ?? i.stock } : i));
      }
      const clamped = Math.max(1, Math.min(quantity, item.stock ?? 99));
      return [...prev, { ...item, quantity: clamped }];
    });
  }, []);

  const updateQuantity = useCallback((productVariantId, quantity) => {
    setItems((prev) =>
      prev
        .map((i) => (i.productVariantId === productVariantId ? { ...i, quantity: Math.max(1, Math.min(quantity, i.stock ?? 99)) } : i))
        .filter((i) => i.quantity > 0)
    );
  }, []);

  const removeItem = useCallback((productVariantId) => {
    setItems((prev) => prev.filter((i) => i.productVariantId !== productVariantId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const totals = useMemo(() => {
    const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
    const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    return { totalItems, totalPrice };
  }, [items]);

  const value = useMemo(
    () => ({ items, addItem, updateQuantity, removeItem, clear, ...totals }),
    [items, addItem, updateQuantity, removeItem, clear, totals]
  );

  return <GuestCartContext.Provider value={value}>{children}</GuestCartContext.Provider>;
}

export function useGuestCart() {
  const ctx = useContext(GuestCartContext);
  if (!ctx) throw new Error("useGuestCart must be used within GuestCartProvider");
  return ctx;
}
