import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const BulkCartContext = createContext(null);
const STORAGE_KEY = "stylenest_bulk_cart";

function readStoredItems() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Client-only cart for the wholesale flow -- there is no server-side bulk
 * cart table by design (see BulkOrderServiceImpl on the backend): quantities
 * and prices here are only a preview, always re-validated authoritatively
 * against BulkProduct (min order qty, available stock, current price) at
 * the moment the order is actually placed. sessionStorage, not
 * localStorage, since this cart is meaningless once the bulk access token
 * (also sessionStorage-only) expires or the tab closes.
 */
export function BulkCartProvider({ children }) {
  const [items, setItems] = useState(readStoredItems);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // storage unavailable -- bulk cart just won't persist across reloads
    }
  }, [items]);

  const addItem = useCallback((product, quantity) => {
    setItems((prev) => {
      const qty = Math.max(product.minOrderQuantity ?? 1, quantity ?? product.minOrderQuantity ?? 1);
      const existing = prev.find((i) => i.bulkProductId === product.id);
      if (existing) {
        return prev.map((i) => (i.bulkProductId === product.id ? { ...i, quantity: qty } : i));
      }
      return [
        ...prev,
        {
          bulkProductId: product.id,
          name: product.name,
          imageUrl: product.imageUrl,
          price: product.price,
          minOrderQuantity: product.minOrderQuantity,
          availableStock: product.availableStock,
          quantity: qty,
        },
      ];
    });
  }, []);

  const updateQuantity = useCallback((bulkProductId, quantity) => {
    setItems((prev) =>
      prev.map((i) =>
        i.bulkProductId === bulkProductId
          ? { ...i, quantity: Math.max(i.minOrderQuantity ?? 1, quantity) }
          : i
      )
    );
  }, []);

  const removeItem = useCallback((bulkProductId) => {
    setItems((prev) => prev.filter((i) => i.bulkProductId !== bulkProductId));
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

  return <BulkCartContext.Provider value={value}>{children}</BulkCartContext.Provider>;
}

export function useBulkCart() {
  const ctx = useContext(BulkCartContext);
  if (!ctx) throw new Error("useBulkCart must be used within BulkCartProvider");
  return ctx;
}
