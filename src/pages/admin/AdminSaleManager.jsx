import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as adminApi from "../../api/admin";
import * as categoriesApi from "../../api/categories";
import { formatPrice } from "../../utils/format";
import { buildProductUpdatePayload } from "../../utils/adminProductPayload";
import { useToast } from "../../context/ToastContext";
import BackButton from "../../components/BackButton";

// Same validation the backend enforces (ProductServiceImpl.syncPricing) --
// checked here too so a bad percent is caught before firing N requests,
// not discovered one failed row at a time.
function discountPriceFor(price, percent) {
  const pct = Number(percent);
  if (!Number.isFinite(price) || !Number.isFinite(pct) || pct <= 0 || pct >= 100) return NaN;
  return Math.round(price * (1 - pct / 100) * 100) / 100;
}

function hikedPriceFor(price, percent) {
  const pct = Number(percent);
  if (!Number.isFinite(price) || !Number.isFinite(pct) || pct <= 0) return NaN;
  return Math.round(price * (1 + pct / 100) * 100) / 100;
}

export default function AdminSaleManager() {
  const queryClient = useQueryClient();
  const { notify } = useToast();

  const [tab, setTab] = useState("sale"); // "sale" | "hike"
  const [q, setQ] = useState("");
  const [gender, setGender] = useState("ALL");
  const [selected, setSelected] = useState(() => new Set());
  const [saleMode, setSaleMode] = useState("uniform"); // "uniform" | "individual"
  const [uniformPercent, setUniformPercent] = useState("");
  const [individualPercents, setIndividualPercents] = useState(() => new Map());
  const [hikePercent, setHikePercent] = useState("");
  const [confirmingHike, setConfirmingHike] = useState(false);
  const [applying, setApplying] = useState(false);

  const { data, isLoading } = useQuery({ queryKey: ["admin", "products"], queryFn: () => adminApi.getAdminProducts() });
  const { data: categories } = useQuery({ queryKey: ["admin", "categories"], queryFn: () => categoriesApi.getCategories() });

  const query = q.trim().toLowerCase();
  const rows = useMemo(
    () =>
      (data ?? [])
        .filter((p) => gender === "ALL" || p.gender === gender)
        .filter((p) => !query || p.name.toLowerCase().includes(query) || p.categoryName?.toLowerCase().includes(query)),
    [data, gender, query]
  );

  const selectedProducts = useMemo(() => rows.filter((p) => selected.has(p.id)), [rows, selected]);

  function toggle(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllVisible() {
    setSelected((prev) => new Set([...prev, ...rows.map((p) => p.id)]));
  }

  function clearSelection() {
    setSelected(new Set());
    setIndividualPercents(new Map());
  }

  // Every bulk action here is the same shape: build each product's full
  // update payload (the admin products API has no partial-update endpoint
  // -- see buildProductUpdatePayload), fire them all, and report how many
  // actually succeeded rather than assuming the whole batch did.
  async function applyToSelected(overridesFor, actionLabel) {
    if (selectedProducts.length === 0) {
      notify("Select at least one product first.", "error");
      return;
    }

    setApplying(true);
    const results = await Promise.allSettled(
      selectedProducts.map((p) => {
        const overrides = overridesFor(p);
        const hasInvalidNumber = Object.values(overrides).some((v) => typeof v === "number" && !Number.isFinite(v));
        if (hasInvalidNumber) return Promise.reject(new Error(`${p.name}: invalid value`));
        return adminApi.updateProduct(p.id, buildProductUpdatePayload(p, categories, overrides));
      })
    );
    setApplying(false);

    const failed = results
      .map((r, i) => (r.status === "rejected" ? selectedProducts[i].name : null))
      .filter(Boolean);
    const succeeded = results.length - failed.length;

    queryClient.invalidateQueries({ queryKey: ["admin", "products"] });

    if (failed.length === 0) {
      notify(`${actionLabel}: ${succeeded} product(s) updated.`, "success");
    } else {
      notify(`${actionLabel}: ${succeeded} updated, ${failed.length} failed (${failed.slice(0, 3).join(", ")}${failed.length > 3 ? "…" : ""}).`, "error");
    }
  }

  function applyUniformSale() {
    const pct = Number(uniformPercent);
    if (!Number.isFinite(pct) || pct <= 0 || pct >= 100) {
      notify("Enter a sale percent between 1 and 99.", "error");
      return;
    }
    applyToSelected((p) => ({ discountPrice: discountPriceFor(p.price, pct) }), `Sale (${pct}% off all selected)`);
  }

  function applyIndividualSale() {
    const missing = selectedProducts.filter((p) => {
      const pct = Number(individualPercents.get(p.id));
      return !Number.isFinite(pct) || pct <= 0 || pct >= 100;
    });
    if (missing.length > 0) {
      notify(`Enter a valid percent (1-99) for every selected product -- missing/invalid for ${missing.length}.`, "error");
      return;
    }
    applyToSelected((p) => ({ discountPrice: discountPriceFor(p.price, individualPercents.get(p.id)) }), "Sale (individual percents)");
  }

  function removeSale() {
    applyToSelected(() => ({ discountPrice: null }), "Remove from Sale");
  }

  function applyHike() {
    const pct = Number(hikePercent);
    if (!Number.isFinite(pct) || pct <= 0) {
      notify("Enter a price hike percent greater than 0.", "error");
      return;
    }
    applyToSelected((p) => ({ price: hikedPriceFor(p.price, pct) }), `Price Hike (+${pct}%)`);
    setConfirmingHike(false);
  }

  return (
    <div>
      <BackButton fallback="/admin" className="mb-3" />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl">Sale Manager</h2>
          <p className="label-xs mt-2 text-muted-foreground">{rows.length} pieces · {selected.size} selected</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="SEARCH CATALOG" className="field label-xs w-56" />
          <select value={gender} onChange={(e) => setGender(e.target.value)} className="field label-xs w-auto">
            <option value="ALL">All genders</option>
            <option value="MEN">Men</option>
            <option value="WOMEN">Women</option>
          </select>
        </div>
      </div>

      <div className="mt-6 flex gap-2">
        <button
          type="button"
          onClick={() => setTab("sale")}
          className={`label-xs border px-4 py-2 transition-colors ${tab === "sale" ? "bg-foreground text-primary-foreground" : "hover:border-accent"}`}
        >
          Sale
        </button>
        <button
          type="button"
          onClick={() => setTab("hike")}
          className={`label-xs border px-4 py-2 transition-colors ${tab === "hike" ? "bg-foreground text-primary-foreground" : "hover:border-accent"}`}
        >
          Price Hike
        </button>
      </div>

      <div className="hairline-card mt-4 flex flex-wrap items-end gap-4 p-4">
        <div className="flex gap-2">
          <button type="button" onClick={selectAllVisible} className="label-xs link-underline">
            Select all visible ({rows.length})
          </button>
          <span className="text-muted-foreground">·</span>
          <button type="button" onClick={clearSelection} className="label-xs link-underline">
            Clear selection
          </button>
        </div>

        {tab === "sale" ? (
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex gap-2">
              {["uniform", "individual"].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setSaleMode(m)}
                  className={`label-xs border px-3 py-1.5 transition-colors ${saleMode === m ? "bg-foreground text-primary-foreground" : "hover:border-accent"}`}
                >
                  {m === "uniform" ? "Same % for all" : "Different % per product"}
                </button>
              ))}
            </div>
            {saleMode === "uniform" && (
              <label className="flex items-center gap-2">
                <span className="label-xs text-muted-foreground">% off</span>
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={uniformPercent}
                  onChange={(e) => setUniformPercent(e.target.value)}
                  className="field label-xs w-20"
                  placeholder="10"
                />
              </label>
            )}
            <button
              type="button"
              disabled={applying}
              onClick={saleMode === "uniform" ? applyUniformSale : applyIndividualSale}
              className="btn-solid disabled:opacity-50"
            >
              Apply Sale to {selected.size} selected
            </button>
            <button type="button" disabled={applying} onClick={removeSale} className="label-xs link-underline text-destructive disabled:opacity-50">
              Remove Sale from {selected.size} selected
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-end gap-4">
            <label className="flex items-center gap-2">
              <span className="label-xs text-muted-foreground">Price hike %</span>
              <input
                type="number"
                min="1"
                value={hikePercent}
                onChange={(e) => setHikePercent(e.target.value)}
                className="field label-xs w-20"
                placeholder="80"
              />
            </label>
            {!confirmingHike ? (
              <button
                type="button"
                disabled={applying || selected.size === 0}
                onClick={() => {
                  if (!hikePercent || Number(hikePercent) <= 0) {
                    notify("Enter a price hike percent greater than 0.", "error");
                    return;
                  }
                  setConfirmingHike(true);
                }}
                className="btn-solid disabled:opacity-50"
              >
                Apply Price Hike to {selected.size} selected
              </button>
            ) : (
              <div className="hairline-card flex flex-wrap items-center gap-3 border-destructive/40 p-3">
                <p className="label-xs text-destructive">
                  This raises the regular price of {selected.size} product(s) by {hikePercent}%. Confirm?
                </p>
                <button type="button" disabled={applying} onClick={applyHike} className="btn-solid">
                  Yes, apply
                </button>
                <button type="button" onClick={() => setConfirmingHike(false)} className="label-xs link-underline">
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="skeleton mt-8 h-80 w-full" />
      ) : (
        <div className="mt-6 flex flex-col gap-2">
          {rows.map((p) => {
            const isChecked = selected.has(p.id);
            const previewPercent = tab === "sale" && saleMode === "individual" ? individualPercents.get(p.id) ?? "" : null;
            return (
              <div
                key={p.id}
                className={`hairline-card flex flex-wrap items-center gap-4 p-3 transition-colors ${isChecked ? "border-accent" : ""}`}
              >
                <input type="checkbox" checked={isChecked} onChange={() => toggle(p.id)} className="h-4 w-4 shrink-0" />
                {p.thumbnailUrl ? (
                  <img src={p.thumbnailUrl} alt={p.name} className="h-14 w-11 shrink-0 object-cover" loading="lazy" />
                ) : (
                  <div className="h-14 w-11 shrink-0 bg-muted" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{p.name}</p>
                  <p className="label-xs mt-1 text-muted-foreground">
                    {p.categoryName} · {p.gender}
                  </p>
                </div>
                <div className="shrink-0 text-sm">
                  {formatPrice(p.discountPrice ?? p.price)}
                  {p.discountPrice && <span className="label-xs ml-2 text-muted-foreground line-through">{formatPrice(p.price)}</span>}
                </div>
                {isChecked && previewPercent !== null && (
                  <label className="flex shrink-0 items-center gap-2">
                    <span className="label-xs text-muted-foreground">% off</span>
                    <input
                      type="number"
                      min="1"
                      max="99"
                      value={previewPercent}
                      onChange={(e) =>
                        setIndividualPercents((prev) => {
                          const next = new Map(prev);
                          next.set(p.id, e.target.value);
                          return next;
                        })
                      }
                      className="field label-xs w-16"
                      placeholder="10"
                    />
                  </label>
                )}
                <Link to={`/admin/products/${p.slug ?? p.id}/edit`} className="label-xs link-underline shrink-0">
                  Edit
                </Link>
              </div>
            );
          })}
          {rows.length === 0 && <p className="py-8 text-sm text-muted-foreground">No products found.</p>}
        </div>
      )}
    </div>
  );
}
