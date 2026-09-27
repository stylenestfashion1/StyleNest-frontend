import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { SlidersHorizontal } from "lucide-react";
import * as productsApi from "../api/products";
import * as categoriesApi from "../api/categories";
import { PageFade, Reveal } from "../components/Reveal";
import ProductGrid from "../components/ProductGrid";
import ErrorState from "../components/ErrorState";
import FilterDrawer from "../components/FilterDrawer";
import BackButton from "../components/BackButton";
import { useGender } from "../context/GenderContext";

const SORT_OPTIONS = [
  { value: "createdAt:desc", label: "Newest" },
  { value: "price:asc", label: "Price: Low to High" },
  { value: "price:desc", label: "Price: High to Low" },
  { value: "name:asc", label: "Name: A–Z" },
];

// overrideGender/overrideCategoryId/overrideCategoryName let a clean
// /women/{categorySlug} route (see CategoryListing.jsx) drive this exact
// same listing/filter logic without duplicating it -- the only other
// difference in that mode is how a category CHANGE from the filter drawer
// is handled (see updateFilter below): the clean route's category is part
// of the URL PATH, not a query param, so switching categories there means
// navigating to a different path rather than setting ?categoryId=.
export default function ProductListing({ overrideGender, overrideCategoryId, overrideCategoryName } = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(0);
  const { setGender } = useGender();

  const cleanCategoryPath = Boolean(overrideCategoryId);
  const gender = overrideGender ?? (searchParams.get("gender") || undefined);
  const categoryId = overrideCategoryId ?? (searchParams.get("categoryId") || undefined);
  const color = searchParams.get("color") || undefined;
  const size = searchParams.get("size") || undefined;
  const minPrice = searchParams.get("minPrice") || undefined;
  const maxPrice = searchParams.get("maxPrice") || undefined;
  const search = searchParams.get("q") || undefined;
  const sort = searchParams.get("sort") || "createdAt:desc";
  const [sortBy, direction] = sort.split(":");

  useEffect(() => {
    if (gender) setGender(gender.toLowerCase());
  }, [gender, setGender]);

  const { data: categories } = useQuery({
    queryKey: ["categories", gender],
    queryFn: () => categoriesApi.getCategories(gender ? { gender } : undefined),
  });

  const filters = useMemo(
    () => ({ gender, categoryId, color, size, minPrice, maxPrice, search, sortBy, direction, page, sizePerPage: 12, active: true }),
    [gender, categoryId, color, size, minPrice, maxPrice, search, sortBy, direction, page]
  );

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["products", "listing", filters],
    queryFn: () => productsApi.filterProducts(filters),
  });

  // A page-0 result is always a full replacement (covers both "filters
  // changed" -- updateFilter() resets page to 0 -- and a genuinely fresh
  // page-0 fetch), so this single effect is sufficient on its own. It used
  // to be paired with a second effect that unconditionally reset `items` to
  // [] whenever any filter changed, meant to clear stale items before new
  // data arrived -- but on a React Query cache hit (e.g. navigating back to
  // a listing within staleTime), `data` is already populated on the very
  // first render after mount, so both effects fired in the same commit and,
  // since the reset effect ran second, it clobbered the correct items this
  // effect had just set, leaving the page stuck on "no products found"
  // until a hard reload cleared the cache. Removing that effect removes the
  // race entirely; it was never needed for its own stated purpose.
  const [items, setItems] = useState([]);
  useEffect(() => {
    if (!data) return;
    setItems((prev) => (page === 0 ? data.content : [...prev, ...data.content]));
  }, [data, page]);

  // On the clean /women/{categorySlug} route, the category is part of the
  // URL PATH, not a query param -- switching categories there means
  // navigating to a different path (or back to the generic /products
  // listing when the drawer's "Clear" is used), never adding a redundant
  // ?categoryId= that would contradict what the path itself says.
  function navigateToCategoryPath(nextCategoryId) {
    if (nextCategoryId == null) {
      navigate(`/products?gender=${gender}`);
      return;
    }
    const target = categories?.find((c) => String(c.id) === String(nextCategoryId));
    if (!target?.slug) return;
    const barSlug = target.slug.startsWith(`${gender.toLowerCase()}-`)
      ? target.slug.slice(gender.length + 1)
      : target.slug;
    navigate(`/${gender.toLowerCase()}/${barSlug}`);
  }

  function updateFilter(patch) {
    if (cleanCategoryPath && "categoryId" in patch) {
      navigateToCategoryPath(patch.categoryId);
      return;
    }
    setPage(0);
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([key, value]) => {
      if (value === undefined || value === "") next.delete(key);
      else next.set(key, value);
    });
    setSearchParams(next);
  }

  const heading =
    overrideCategoryName ||
    (search
      ? `Results for "${search}"`
      : categories?.find((c) => String(c.id) === String(categoryId))?.name ||
        (gender === "MEN" ? "Men's Collection" : gender === "WOMEN" ? "Women's Collection" : "All Products"));

  return (
    <PageFade>
      <div className="mx-auto max-w-[1440px] px-5 py-12 md:px-10">
        <BackButton fallback={gender ? `/${gender.toLowerCase()}` : "/"} className="mb-6" />
        <Reveal className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[clamp(1.9rem,3.6vw,2.8rem)]">{heading}</h1>
            {data && <p className="label-xs mt-2 text-muted-foreground">{data.totalElements} items</p>}
          </div>
          <div className="flex items-center gap-3">
            <select value={sort} onChange={(e) => updateFilter({ sort: e.target.value })} className="field label-xs w-auto">
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <button onClick={() => setFilterOpen(true)} className="label-xs flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" /> Filters
            </button>
          </div>
        </Reveal>

        {isLoading && page === 0 ? (
          <div className="mt-10">
            <ProductGrid loading />
          </div>
        ) : isError ? (
          <ErrorState message="Could not load products." onRetry={refetch} />
        ) : (
          <>
            <div className="mt-10">
              <ProductGrid products={items} />
            </div>
            {data && !data.last && (
              <div className="mt-14 text-center">
                <button onClick={() => setPage((p) => p + 1)} className="btn-outline">
                  Load More
                </button>
              </div>
            )}
          </>
        )}

        <FilterDrawer
          open={filterOpen}
          onClose={() => setFilterOpen(false)}
          filters={{ categoryId, color, size, minPrice, maxPrice }}
          onChange={updateFilter}
          categories={categories}
        />
      </div>
    </PageFade>
  );
}
