import { createContext, useCallback, useContext } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import heroMen from "../assets/hero-men.jpg";
import heroWomen from "../assets/hero-women.jpg";
import catJackets from "../assets/cat-jackets.jpg";
import catShoes from "../assets/cat-shoes.jpg";
import catDresses from "../assets/cat-dresses.jpg";
import catTops from "../assets/cat-tops.jpg";
import * as scrollImagesApi from "../api/scrollImages";
import * as adminApi from "../api/admin";

/**
 * Local fallback only for slots the backend has no row for yet (fresh
 * install, or a slot that was reset) — GET /scroll-images?gender=X returns
 * [] until an admin uploads something for that gender.
 */
const DEFAULTS = {
  MEN: { 1: heroMen, 2: catJackets, 3: catShoes },
  WOMEN: { 1: heroWomen, 2: catDresses, 3: catTops },
};

const ScrollExpandImagesContext = createContext(null);

export function ScrollExpandImagesProvider({ children }) {
  const queryClient = useQueryClient();

  const menQuery = useQuery({ queryKey: ["scroll-images", "MEN"], queryFn: () => scrollImagesApi.getScrollImages("MEN") });
  const womenQuery = useQuery({ queryKey: ["scroll-images", "WOMEN"], queryFn: () => scrollImagesApi.getScrollImages("WOMEN") });

  const rowsByGender = { MEN: menQuery.data, WOMEN: womenQuery.data };

  const getImage = useCallback(
    (gender, step) => {
      const row = rowsByGender[gender]?.find((r) => r.step === step);
      return row?.imageUrl || DEFAULTS[gender]?.[step];
    },
    [menQuery.data, womenQuery.data] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const setImage = useCallback(
    async (gender, step, url) => {
      await adminApi.updateScrollImage(gender, step, { imageUrl: url });
      await queryClient.invalidateQueries({ queryKey: ["scroll-images", gender] });
    },
    [queryClient]
  );

  const resetImage = useCallback(
    async (gender, step) => {
      await adminApi.deleteScrollImage(gender, step);
      await queryClient.invalidateQueries({ queryKey: ["scroll-images", gender] });
    },
    [queryClient]
  );

  return (
    <ScrollExpandImagesContext.Provider value={{ getImage, setImage, resetImage }}>
      {children}
    </ScrollExpandImagesContext.Provider>
  );
}

export function useScrollExpandImages() {
  const ctx = useContext(ScrollExpandImagesContext);
  if (!ctx) throw new Error("useScrollExpandImages must be used within ScrollExpandImagesProvider");
  return ctx;
}
