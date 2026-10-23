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
              item.name !== fresh.name
            ) {
              hasDiff = true;
              return {
                ...item,
                price: freshPrice,
                name: fresh.name,
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

  const addItem = useCallback((product, quantity, selectedColor = null) => {
    setItems((prev) => {
      const qty = Math.max(product.minOrderQuantity ?? 1, quantity ?? product.minOrderQuantity ?? 1);
      const colorName = typeof selectedColor === "string" ? selectedColor : selectedColor?.name || null;
      const itemKey = colorName ? `${product.id}-${colorName}` : String(product.id);

      // Determine photo: if a color is selected, prefer that color's first photo
      let displayImage = product.imageUrl;
      if (colorName && product.colors && Array.isArray(product.colors)) {
        const found = product.colors.find(
          (c) => (c.name || "").trim().toLowerCase() === colorName.trim().toLowerCase()
        );
        if (found && found.images && found.images.length > 0) {
          displayImage = found.images[0];
        }
      }

      const existingIndex = prev.findIndex((i) => (i.itemKey || String(i.bulkProductId)) === itemKey);
      if (existingIndex > -1) {
        return prev.map((i, idx) =>
          idx === existingIndex
            ? {
                ...i,
                quantity: qty,
                price: Number(product.price),
                name: product.name,
                selectedColor: colorName,
                imageUrl: displayImage || i.imageUrl,
                minOrderQuantity: product.minOrderQuantity,
                availableStock: product.availableStock,
              }
            : i
        );
      }
      return [
        ...prev,
        {
          itemKey,
          bulkProductId: product.id,
          name: product.name,
          selectedColor: colorName,
          imageUrl: displayImage,
          price: Number(product.price),
          minOrderQuantity: product.minOrderQuantity,
          availableStock: product.availableStock,
          quantity: qty,
        },
      ];
    });
  }, []);

  const updateQuantity = useCallback((itemKeyOrId, quantity) => {
    setItems((prev) =>
      prev.map((i) =>
        (i.itemKey || String(i.bulkProductId)) === String(itemKeyOrId) || i.bulkProductId === itemKeyOrId
          ? { ...i, quantity: Math.max(i.minOrderQuantity ?? 1, quantity) }
          : i
      )
    );
  }, []);

  const removeItem = useCallback((itemKeyOrId) => {
    setItems((prev) =>
      prev.filter(
        (i) => (i.itemKey || String(i.bulkProductId)) !== String(itemKeyOrId) && i.bulkProductId !== itemKeyOrId
      )
    );
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
