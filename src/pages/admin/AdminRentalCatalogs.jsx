import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as rentalApi from "../../api/rental";
import { formatDate } from "../../utils/format";
import { useToast } from "../../context/ToastContext";
import BackButton from "../../components/BackButton";
import LoadingState from "../../components/LoadingState";
import ErrorState from "../../components/ErrorState";

// Temporary Navratri rental-catalog admin module -- fully isolated from the
// retail Catalog/Orders pages. Admin can create more than one named
// catalog (e.g. a future Diwali campaign) even though only one is in use
// today; each gets its own permanent share link.
export default function AdminRentalCatalogs() {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const [name, setName] = useState("");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "rental-catalogs"],
    queryFn: () => rentalApi.getAdminRentalCatalogs(),
  });

  const create = useMutation({
    mutationFn: () => rentalApi.createAdminRentalCatalog({ name: name.trim() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "rental-catalogs"] });
      notify("Rental catalog created", "success");
      setName("");
    },
    onError: (err) => notify(err.message, "error"),
  });

  if (isLoading) return <LoadingState label="Loading rental catalogs" />;
  if (isError) return <ErrorState message="Could not load rental catalogs." onRetry={refetch} />;

  const catalogs = data ?? [];

  return (
    <div>
      <BackButton fallback="/admin" className="mb-3" />
      <h2 className="text-xl">Rental Catalogs</h2>
      <p className="label-xs mt-2 text-muted-foreground">
        Temporary shareable catalogs (e.g. "Navratri Lehenga Rental 2026") -- separate from the normal product
        catalog. No orders, payments, or accounts are created here.
      </p>

      <div className="hairline-card mt-8 flex flex-wrap items-end gap-4 p-6">
        <label className="block flex-1 min-w-[220px]">
          <span className="label-xs text-muted-foreground">New catalog name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Navratri Lehenga Rental 2026"
            className="field mt-2"
          />
        </label>
        <button
          className="btn-solid disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!name.trim() || create.isPending}
          onClick={() => create.mutate()}
        >
          {create.isPending ? "Creating..." : "+ New Catalog"}
        </button>
      </div>

      {catalogs.length === 0 ? (
        <p className="mt-10 text-sm text-muted-foreground">No rental catalogs yet.</p>
      ) : (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="label-xs border-b text-muted-foreground">
                <th className="pb-3 font-normal">Name</th>
                <th className="pb-3 font-normal">Status</th>
                <th className="pb-3 font-normal">Items</th>
                <th className="pb-3 font-normal">Created</th>
                <th className="pb-3 font-normal text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {catalogs.map((c) => (
                <tr key={c.id} className="border-b">
                  <td className="py-4">{c.name}</td>
                  <td className="py-4">
                    <span className={`label-xs ${c.status === "ACTIVE" ? "text-accent" : "text-muted-foreground"}`}>
                      {c.status === "ACTIVE" ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="py-4 text-muted-foreground">{c.itemCount}</td>
                  <td className="py-4 text-muted-foreground">{formatDate(c.createdAt)}</td>
                  <td className="py-4 text-right">
                    <Link to={`/admin/rental/${c.id}`} className="label-xs link-underline">
                      Manage
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
