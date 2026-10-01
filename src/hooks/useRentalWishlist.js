import { useCallback, useEffect, useState } from "react";

// Purely client-side, per-catalog "remember what I liked" list for the
// Navratri rental catalog -- never sent to the backend, no DB table, no
// customer account. Mirrors GenderContext's localStorage read/write
// pattern. Keyed per shareToken so favourites from one catalog never leak
// into another if the shop runs more than one rental campaign.
export function useRentalWishlist(shareToken) {
  const storageKey = `stylenest_rental_wishlist_${shareToken}`;

  const [favouriteIds, setFavouriteIds] = useState(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(favouriteIds));
    } catch {
      // Private browsing / storage blocked -- favouriting just won't
      // persist across a reload, which is a fine degradation here.
    }
  }, [storageKey, favouriteIds]);

  const isFavourite = useCallback((itemId) => favouriteIds.includes(itemId), [favouriteIds]);

  const toggleFavourite = useCallback((itemId) => {
    setFavouriteIds((prev) => (prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]));
  }, []);

  return { favouriteIds, isFavourite, toggleFavourite };
}
