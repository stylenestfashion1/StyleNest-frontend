import { useQuery } from "@tanstack/react-query";
import * as categoriesApi from "../api/categories";
import * as productsApi from "../api/products";

export function useGenderStorefront(gender) {
  const categories = useQuery({
    queryKey: ["categories", gender],
    queryFn: () => categoriesApi.getCategories({ gender }),
  });

  const newArrivals = useQuery({
    queryKey: ["products", gender, "new"],
    queryFn: () => productsApi.filterProducts({ gender, sortBy: "createdAt", direction: "desc", sizePerPage: 8, active: true }),
  });

  const featured = useQuery({
    queryKey: ["products", gender, "featured"],
    queryFn: () => productsApi.filterProducts({ gender, featured: true, sizePerPage: 8, active: true }),
  });

  const trending = useQuery({
    queryKey: ["products", gender, "trending"],
    // The backend doesn't yet filter by `trending` server-side (see
    // THIRD-PARTY-NOTICES.md-adjacent backend prompt) — the `trending: true`
    // param is passed so this starts working automatically once it does,
    // but results are always re-filtered client-side on the real
    // `trending` flag so this never shows non-trending products in the
    // meantime.
    queryFn: async () => {
      const res = await productsApi.filterProducts({ gender, trending: true, sizePerPage: 8, active: true });
      return { ...res, content: (res.content ?? []).filter((p) => p.trending === true) };
    },
  });

  return { categories, newArrivals, featured, trending };
}
