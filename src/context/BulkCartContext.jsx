import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getBulkProducts } from "../api/bulk";

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
 * Client-only cart for the wholesale flow -- quantities and prices here are
 * synced with the catalog so whenever admin updates a wholesale price, the cart
 * reflects the fresh price immediately.
 */
export function BulkCartProvider({ children }) {
  const [items, setItems] = useState(readStoredItems);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // storage unavailable
    }
  }, [items]);

  // Synchronize cart items with live catalog prices and stock on mount
  useEffect(() => {
    if (items.length === 0) return;
    let cancelled = false;

    getBulkProducts()
      .then((res) => {
        if (cancelled) return;
        const catalogProducts = res?.data || res || [];
        if (!Array.isArray(catalogProducts) || catalogProducts.length === 0) return;

        setItems((current) => {
          let hasDiff = false;
          const updated = current.map((item) => {
            const fresh = catalogProducts.find((p) => p.id === item.bulkProductId);
            if (!fresh) return item;

            const freshPrice = Number(fresh.price);
            if (
              item.price !== freshPrice ||
              item.availableStock !== fresh.availableStock ||
              item.name !== fresh.name ||
              item.imageUrl !== fresh.imageUrl
            ) {
              hasDiff = true;
              return {
                ...item,
                price: freshPrice,
                name: fresh.name,
                imageUrl: fresh.imageUrl,
                minOrderQuantity: fresh.minOrderQuantity,
                availableStock: fresh.availableStock,
              };
            }
            return item;
          });
          return hasDiff ? updated : current;
        });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  const addItem = useCallback((product, quantity) => {
    setItems((prev) => {
      const qty = Math.max(product.minOrderQuantity ?? 1, quantity ?? product.minOrderQuantity ?? 1);
      const existing = prev.find((i) => i.bulkProductId === product.id);
      if (existing) {
        return prev.map((i) =>
          i.bulkProductId === product.id
            ? {
                ...i,
                quantity: qty,
                price: Number(product.price),
                name: product.name,
                imageUrl: product.imageUrl,
                minOrderQuantity: product.minOrderQuantity,
                availableStock: product.availableStock,
              }
            : i
        );
      }
      return [
        ...prev,
        {
          bulkProductId: product.id,
          name: product.name,
          imageUrl: product.imageUrl,
          price: Number(product.price),
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
    const totalPrice = items.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0);
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
