import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as adminApi from "../../api/admin";
import { formatDate, formatPrice } from "../../utils/format";
import { useToast } from "../../context/ToastContext";
import BackButton from "../../components/BackButton";

export default function AdminProducts() {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const [q, setQ] = useState("");
  const [gender, setGender] = useState("ALL");

  const { data, isLoading } = useQuery({ queryKey: ["admin", "products"], queryFn: () => adminApi.getAdminProducts() });
  // Admin-only internal identification code -- not on the product list
  // response itself (see api/admin.js), fetched separately and merged in
  // here purely for search/display; never sent to any customer-facing
  // page.
  const { data: jeansCodes } = useQuery({
    queryKey: ["admin", "products", "jeansCodes"],
    queryFn: () => adminApi.getAllProductJeansCodes(),
  });
  const jeansCodeById = new Map((jeansCodes ?? []).map((j) => [j.productId, j.jeansCode]));

  const remove = useMutation({
    mutationFn: (id) => adminApi.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      notify("Product deleted", "success");
    },
    onError: (err) => notify(err.message, "error"),
  });

  // Case-insensitive substring match against name, category or Jeans
  // Code -- the same one predicate already covers both "exact" and
  // "partial" code search, since an exact match is just a substring that
  // happens to equal the whole value. matchedViaJeansCode is only true
  // when the code is what actually matched (not name/category too), so
  // the "Matched via Jeans Code" indicator below only shows when it's the
  // real reason the row is in the results.
  const query = q.trim().toLowerCase();
  const rows = (data ?? [])
    .filter((p) => gender === "ALL" || p.gender === gender)
    .map((p) => {
      const jeansCode = jeansCodeById.get(p.id) ?? null;
      const nameMatch = p.name.toLowerCase().includes(query);
      const categoryMatch = p.categoryName?.toLowerCase().includes(query) ?? false;
      const jeansCodeMatch = Boolean(jeansCode) && jeansCode.toLowerCase().includes(query);
      return { ...p, jeansCode, matches: !query || nameMatch || categoryMatch || jeansCodeMatch, matchedViaJeansCode: Boolean(query) && jeansCodeMatch && !nameMatch && !categoryMatch };
    })
    .filter((p) => p.matches);

  return (
    <div>
      <BackButton fallback="/admin" className="mb-3" />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl">Products</h2>
          <p className="label-xs mt-2 text-muted-foreground">{rows.length} pieces</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="SEARCH CATALOG" className="field label-xs w-56" />
          <select value={gender} onChange={(e) => setGender(e.target.value)} className="field label-xs w-auto">
            <option value="ALL">All genders</option>
            <option value="MEN">Men</option>
            <option value="WOMEN">Women</option>
          </select>
          <Link to="/admin/products/new" className="btn-solid">
            + New
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="skeleton mt-8 h-80 w-full" />
      ) : (
        <>
          {/* Desktop/tablet: table */}
          <div className="mt-8 hidden overflow-x-auto md:block">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead>
                <tr className="border-y">
                  {["Piece", "Category", "Gender", "Price", "Updated", "Status", "Actions"].map((h) => (
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
                        <div>
                          <span>{p.name}</span>
                          {p.matchedViaJeansCode && (
                            <p className="label-xs mt-1 text-accent">Matched via Jeans Code: {p.jeansCode}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-muted-foreground">{p.categoryName}</td>
                    <td className="label-xs py-4 text-muted-foreground">{p.gender}</td>
                    <td className="py-4">
                      {formatPrice(p.discountPrice ?? p.price)}
                      {p.discountPrice && <span className="label-xs ml-2 text-muted-foreground line-through">{formatPrice(p.price)}</span>}
                    </td>
                    <td className="py-4 text-muted-foreground">{formatDate(p.updatedAt)}</td>
                    <td className="py-4">
                      <span className={`label-xs ${p.active ? "text-accent" : "text-muted-foreground"}`}>{p.active ? "Live" : "Hidden"}</span>
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex justify-end gap-4">
                        <Link to={`/products/${p.slug ?? p.id}`} target="_blank" rel="noopener noreferrer" className="label-xs link-underline">
                          View
                        </Link>
                        <Link to={`/admin/products/${p.slug ?? p.id}/edit`} className="label-xs link-underline">
                          Edit
                        </Link>
                        <button className="label-xs link-underline text-destructive" onClick={() => remove.mutate(p.id)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && <p className="py-8 text-sm text-muted-foreground">No products found.</p>}
          </div>

          {/* Mobile: stacked cards, not a squeezed table */}
          <div className="mt-8 flex flex-col gap-4 md:hidden">
            {rows.map((p) => (
              <div key={p.id} className="hairline-card flex gap-4 p-4">
                {p.thumbnailUrl ? (
                  <img src={p.thumbnailUrl} alt={p.name} className="h-24 w-19 shrink-0 object-cover" loading="lazy" />
                ) : (
                  <div className="h-24 w-19 shrink-0 bg-muted" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-sm">{p.name}</p>
                    <span className={`label-xs shrink-0 ${p.active ? "text-accent" : "text-muted-foreground"}`}>{p.active ? "Live" : "Hidden"}</span>
                  </div>
                  <p className="label-xs mt-1.5 text-muted-foreground">
                    {p.categoryName} · {p.gender}
                  </p>
                  {p.matchedViaJeansCode && (
                    <p className="label-xs mt-1 text-accent">Matched via Jeans Code: {p.jeansCode}</p>
                  )}
                  <p className="mt-2 text-sm">
                    {formatPrice(p.discountPrice ?? p.price)}
                    {p.discountPrice && <span className="label-xs ml-2 text-muted-foreground line-through">{formatPrice(p.price)}</span>}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-4">
                    <Link to={`/products/${p.slug ?? p.id}`} target="_blank" rel="noopener noreferrer" className="label-xs link-underline">
                      View
                    </Link>
                    <Link to={`/admin/products/${p.slug ?? p.id}/edit`} className="label-xs link-underline">
                      Edit
                    </Link>
                    <button className="label-xs link-underline text-destructive" onClick={() => remove.mutate(p.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {rows.length === 0 && <p className="py-8 text-sm text-muted-foreground">No products found.</p>}
          </div>
        </>
      )}
    </div>
  );
}
