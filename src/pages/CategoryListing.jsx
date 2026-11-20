import { NavLink, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import * as categoriesApi from "../api/categories";
import LoadingState from "../components/LoadingState";
import ErrorState from "../components/ErrorState";
import ProductListing from "./ProductListing";

/**
 * The clean public category route -- /women/{categorySlug}, /men/{categorySlug}
 * -- e.g. /women/kurti, /men/winter. Resolves the category by its full, gender-prefixed
 * slug (see CategoryServiceImpl.buildSlug: "women-kurti", "men-winter").
 * If the category has subcategories (like Winter -> Sweatshirts, Hoodies), renders
 * a dedicated interactive subcategory filter pill bar above the product grid.
 */
export default function CategoryListing({ gender }) {
  const { categorySlug } = useParams();
  const fullSlug = `${gender.toLowerCase()}-${categorySlug}`;

  const categoryQuery = useQuery({
    queryKey: ["category", "slug", fullSlug],
    queryFn: () => categoriesApi.getCategoryBySlug(fullSlug),
  });

  if (categoryQuery.isLoading) return <LoadingState label="Loading category" />;
  if (categoryQuery.isError || !categoryQuery.data) return <ErrorState message="Category not found." />;

  const cat = categoryQuery.data;
  const subcategories = cat.subcategories;

  return (
    <div>
      {subcategories && subcategories.length > 0 && (
        <div className="bg-muted/30 border-b border-border/60 py-3 px-4">
          <div className="mx-auto max-w-7xl flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-xs font-serif tracking-wider text-muted-foreground mr-1 uppercase">
              {cat.name}:
            </span>
            <NavLink
              to={`/${gender.toLowerCase()}/${categorySlug}`}
              end
              className={({ isActive }) =>
                `text-xs px-3.5 py-1.5 rounded-full border transition-colors whitespace-nowrap ${
                  isActive
                    ? "bg-foreground text-background border-foreground font-medium"
                    : "bg-background text-muted-foreground border-border hover:border-foreground/40"
                }`
              }
            >
              All {cat.name}
            </NavLink>
            {subcategories.map((sub) => {
              const prefix = `${gender.toLowerCase()}-`;
              const bareSubSlug = sub.slug.startsWith(prefix) ? sub.slug.slice(prefix.length) : sub.slug;
              return (
                <NavLink
                  key={sub.id}
                  to={`/${gender.toLowerCase()}/${bareSubSlug}`}
                  className={({ isActive }) =>
                    `text-xs px-3.5 py-1.5 rounded-full border transition-colors whitespace-nowrap ${
                      isActive
                        ? "bg-foreground text-background border-foreground font-medium"
                        : "bg-background text-muted-foreground border-border hover:border-foreground/40"
                    }`
                  }
                >
                  {sub.name}
                </NavLink>
              );
            })}
          </div>
        </div>
      )}
      <ProductListing
        overrideGender={gender}
        overrideCategoryId={cat.id}
        overrideCategoryName={cat.name}
      />
    </div>
  );
}
