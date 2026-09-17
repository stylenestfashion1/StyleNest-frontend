import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as adminApi from "../../api/admin";
import { formatPrice } from "../../utils/format";
import { useToast } from "../../context/ToastContext";
import BackButton from "../../components/BackButton";

export default function AdminBulkProducts() {
  const queryClient = useQueryClient();
  const { notify } = useToast();

  const { data, isLoading } = useQuery({ queryKey: ["admin", "bulk-products"], queryFn: adminApi.getAdminBulkProducts });

  const remove = useMutation({
    mutationFn: (id) => adminApi.deleteAdminBulkProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "bulk-products"] });
      notify("Bulk product deleted", "success");
    },
    onError: (err) => notify(err.message, "error"),
  });

  const rows = data ?? [];

  return (
    <div>
      <BackButton fallback="/admin" className="mb-3" />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl">Bulk Products</h2>
          <p className="label-xs mt-2 text-muted-foreground">{rows.length} wholesale products</p>
        </div>
        <Link to="/admin/bulk/products/new" className="btn-solid">
          + New
        </Link>
      </div>

      {isLoading ? (
        <div className="skeleton mt-8 h-80 w-full" />
      ) : (
        <>
          <div className="mt-8 hidden overflow-x-auto md:block">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead>
                <tr className="border-y">
                  {["Product", "Category", "Price", "Min Qty", "Available", "Status", "Actions"].map((h) => (
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
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt={p.name} className="h-14 w-11 object-cover" loading="lazy" />
                        ) : (
                          <div className="h-14 w-11 bg-muted" />
                        )}
                        <span>{p.name}</span>
                      </div>
                    </td>
                    <td className="py-4 text-muted-foreground">{p.categoryName}</td>
                    <td className="py-4">{formatPrice(p.price)}</td>
                    <td className="py-4 text-muted-foreground">{p.minOrderQuantity}</td>
                    <td className="py-4 text-muted-foreground">{p.availableStock ?? "—"}</td>
                    <td className="py-4">
                      <span className={`label-xs ${p.active ? "text-accent" : "text-muted-foreground"}`}>{p.active ? "Live" : "Hidden"}</span>
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex justify-end gap-4">
                        <Link to={`/admin/bulk/products/${p.id}`} className="label-xs link-underline">
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
            {rows.length === 0 && <p className="py-8 text-sm text-muted-foreground">No bulk products found.</p>}
          </div>

          <div className="mt-8 flex flex-col gap-4 md:hidden">
            {rows.map((p) => (
              <div key={p.id} className="hairline-card flex gap-4 p-4">
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt={p.name} className="h-24 w-19 shrink-0 object-cover" loading="lazy" />
                ) : (
                  <div className="h-24 w-19 shrink-0 bg-muted" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-sm">{p.name}</p>
                    <span className={`label-xs shrink-0 ${p.active ? "text-accent" : "text-muted-foreground"}`}>{p.active ? "Live" : "Hidden"}</span>
                  </div>
                  <p className="label-xs mt-1.5 text-muted-foreground">
                    {p.categoryName} · Min {p.minOrderQuantity}
                  </p>
                  <p className="mt-2 text-sm">{formatPrice(p.price)}</p>
                  <div className="mt-3 flex flex-wrap gap-4">
                    <Link to={`/admin/bulk/products/${p.id}`} className="label-xs link-underline">
                      Edit
                    </Link>
                    <button className="label-xs link-underline text-destructive" onClick={() => remove.mutate(p.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {rows.length === 0 && <p className="py-8 text-sm text-muted-foreground">No bulk products found.</p>}
          </div>
        </>
      )}
    </div>
  );
}
