import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as adminApi from "../../api/admin";
import * as categoriesApi from "../../api/categories";
import { formatPrice } from "../../utils/format";
import { useToast } from "../../context/ToastContext";
import BackButton from "../../components/BackButton";

/**
 * Full-object PUT, same shape AdminProductForm sends — the API has no
 * partial-update endpoint, so removing a product from Trending here (without
 * opening its full edit form) reconstructs the same payload from the already
 * -fetched product-list row plus the resolved categoryId.
 */
function toUpdatePayload(product, categories, overrides) {
  const categoryId = categories?.find((c) => c.name === product.categoryName)?.id ?? "";
  return {
    name: product.name ?? "",
    shortDescription: product.shortDescription ?? "",
    description: product.description ?? "",
    price: Number(product.price),
    discountPrice: product.discountPrice ?? null,
    fabric: product.fabric ?? "",
    careInstructions: product.careInstructions ?? "",
    featured: product.featured ?? false,
    trending: product.trending ?? false,
    active: product.active ?? true,
    categoryId: Number(categoryId),
    ...overrides,
  };
}

export default function AdminTrending() {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const [gender, setGender] = useState("MEN");

  const { data: products, isLoading } = useQuery({ queryKey: ["admin", "products"], queryFn: () => adminApi.getAdminProducts() });
  const { data: categories } = useQuery({ queryKey: ["admin", "categories"], queryFn: () => categoriesApi.getCategories() });

  const removeFromTrending = useMutation({
    mutationFn: (product) => adminApi.updateProduct(product.id, toUpdatePayload(product, categories, { trending: false })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      notify("Removed from Trending", "success");
    },
    onError: (err) => notify(err.message, "error"),
  });

  const rows = (products ?? []).filter((p) => p.gender === gender && p.trending === true);

  return (
    <div>
      <BackButton fallback="/admin" className="mb-3" />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl">Trending</h2>
          <p className="label-xs mt-2 text-muted-foreground">{rows.length} pieces</p>
        </div>
        <div className="flex gap-2">
          {["MEN", "WOMEN"].map((g) => (
            <button
              type="button"
              key={g}
              onClick={() => setGender(g)}
              className={`label-xs border px-4 py-2 transition-colors ${gender === g ? "bg-foreground text-primary-foreground" : "hover:border-accent"}`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="skeleton mt-8 h-60 w-full" />
      ) : rows.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">
          No {gender === "MEN" ? "men's" : "women's"} products are marked Trending yet. Mark a product as Trending
          from its edit page in Catalog.
        </p>
      ) : (
        <>
          {/* Desktop/tablet: table */}
          <div className="mt-8 hidden overflow-x-auto md:block">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-y">
                  {["Piece", "Category", "Price", "Actions"].map((h) => (
                    <th key={h} className="label-xs py-3 font-normal text-muted-foreground">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id} className="border-b transition-colors hover:bg-muted/50">
                    <td className="py-4">
                      <div className="flex items-center gap-4">
                        {p.thumbnailUrl ? (
                          <img src={p.thumbnailUrl} alt={p.name} className="h-14 w-11 object-cover" loading="lazy" />
                        ) : (
                          <div className="h-14 w-11 bg-muted" />
                        )}
                        <span>{p.name}</span>
                      </div>
                    </td>
                    <td className="py-4 text-muted-foreground">{p.categoryName}</td>
                    <td className="py-4">
                      {formatPrice(p.discountPrice ?? p.price)}
                      {p.discountPrice && <span className="label-xs ml-2 text-muted-foreground line-through">{formatPrice(p.price)}</span>}
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex justify-end gap-4">
                        <Link to={`/admin/products/${p.slug ?? p.id}/edit`} className="label-xs link-underline">
                          Edit
                        </Link>
                        <button
                          type="button"
                          disabled={removeFromTrending.isPending}
                          className="label-xs link-underline text-destructive disabled:opacity-45"
                          onClick={() => removeFromTrending.mutate(p)}
                        >
                          Remove from Trending
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: stacked cards */}
          <div className="mt-8 flex flex-col gap-4 md:hidden">
            {rows.map((p) => (
              <div key={p.id} className="hairline-card flex gap-4 p-4">
                {p.thumbnailUrl ? (
                  <img src={p.thumbnailUrl} alt={p.name} className="h-24 w-19 shrink-0 object-cover" loading="lazy" />
                ) : (
                  <div className="h-24 w-19 shrink-0 bg-muted" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{p.name}</p>
                  <p className="label-xs mt-1.5 text-muted-foreground">{p.categoryName}</p>
                  <p className="mt-2 text-sm">
                    {formatPrice(p.discountPrice ?? p.price)}
                    {p.discountPrice && <span className="label-xs ml-2 text-muted-foreground line-through">{formatPrice(p.price)}</span>}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-4">
                    <Link to={`/admin/products/${p.slug ?? p.id}/edit`} className="label-xs link-underline">
                      Edit
                    </Link>
                    <button
                      type="button"
                      disabled={removeFromTrending.isPending}
                      className="label-xs link-underline text-destructive disabled:opacity-45"
                      onClick={() => removeFromTrending.mutate(p)}
                    >
                      Remove from Trending
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
