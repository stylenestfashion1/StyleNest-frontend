import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as adminApi from "../../api/admin";
import * as productsApi from "../../api/products";
import * as categoriesApi from "../../api/categories";
import { useToast } from "../../context/ToastContext";
import LoadingState from "../../components/LoadingState";
import ErrorState from "../../components/ErrorState";
import BackButton from "../../components/BackButton";
import VariantManager from "../../components/admin/VariantManager";

const EMPTY = {
  name: "",
  // Public URL slug. Blank on a new product -> backend auto-generates one
  // from the name. On an existing product, pre-filled with the current
  // value and left exactly as-is unless the admin deliberately edits it --
  // the backend never regenerates it just because the name changes (that
  // would break bookmarks/shared links/SEO). See ProductServiceImpl.
  slug: "",
  shortDescription: "",
  description: "",
  price: "",
  discountPrice: "",
  onSale: false,
  fabric: "",
  careInstructions: "",
  hsnCode: "",
  // Admin-only internal identification code. Never present on
  // productQuery's response (see getProductJeansCode below for why) --
  // loaded separately and merged in once it arrives.
  jeansCode: "",
  featured: false,
  trending: false,
  active: true,
  categoryId: "",
  // International (USD) pricing -- completely independent of the INR
  // fields above, never auto-derived from them. Absent/unconfigured until
  // the admin explicitly checks "Enable international pricing" and saves.
  internationalPricingEnabled: false,
  usdRegularPrice: "",
  usdDiscountPrice: "",
  usdOnSale: false,
};

export default function AdminProductForm() {
  const { id: idOrSlug } = useParams();
  const location = useLocation();
  const isNew = idOrSlug === "new";
  const isNumericId = !isNew && /^\d+$/.test(idOrSlug);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const [form, setForm] = useState(EMPTY);

  const { data: categories } = useQuery({ queryKey: ["admin", "categories"], queryFn: () => categoriesApi.getCategories() });

  // The canonical route (/admin/products/{slug}/edit) arrives here with a
  // slug, not a numeric ID -- resolved via the same PUBLIC slug lookup the
  // customer product page uses (it already returns the numeric id, and
  // nothing admin-sensitive is needed just to resolve which product this
  // is), then every admin-only call below uses that resolved numeric ID
  // exactly as it always did. The legacy bare /admin/products/{id} route
  // skips this step entirely.
  const slugResolveQuery = useQuery({
    queryKey: ["admin", "product-slug-resolve", idOrSlug],
    queryFn: () => productsApi.getProductBySlug(idOrSlug),
    enabled: !isNew && !isNumericId,
  });

  const resolvedId = isNew ? null : isNumericId ? idOrSlug : slugResolveQuery.data?.id;

  const productQuery = useQuery({
    queryKey: ["admin", "product", resolvedId],
    queryFn: () => adminApi.getAdminProduct(resolvedId),
    enabled: !isNew && Boolean(resolvedId),
  });
  const variantsQuery = useQuery({
    queryKey: ["admin", "variants", resolvedId],
    queryFn: () => productsApi.getProductVariants(resolvedId),
    enabled: !isNew && Boolean(resolvedId),
  });
  // Separate call: jeansCode deliberately isn't on getAdminProduct's
  // response (see api/admin.js) since that DTO is shared with the public
  // storefront API.
  const jeansCodeQuery = useQuery({
    queryKey: ["admin", "product", resolvedId, "jeansCode"],
    queryFn: () => adminApi.getProductJeansCode(resolvedId),
    enabled: !isNew && Boolean(resolvedId),
  });

  // Canonicalize the legacy bare /admin/products/{id} URL to
  // /admin/products/{slug}/edit once the product resolves -- client-side
  // only (this is a static SPA with no server-side slug awareness), never
  // claimed as a true 301. Never fires for the new-product route or for a
  // request already on its own canonical URL.
  useEffect(() => {
    if (isNew || !productQuery.data?.slug) return;
    const canonical = `/admin/products/${productQuery.data.slug}/edit`;
    if (location.pathname !== canonical) {
      navigate(canonical, { replace: true });
    }
  }, [isNew, productQuery.data, location.pathname, navigate]);

  const [loadedForm, setLoadedForm] = useState(null);

  useEffect(() => {
    if (productQuery.data) {
      const p = productQuery.data;
      const usdEntry = p.prices?.find((pr) => pr.currency === "USD") ?? null;
      const next = {
        name: p.name ?? "",
        slug: p.slug ?? "",
        shortDescription: p.shortDescription ?? "",
        description: p.description ?? "",
        price: p.price ?? "",
        discountPrice: p.discountPrice ?? "",
        onSale: p.discountPrice != null,
        fabric: p.fabric ?? "",
        careInstructions: p.careInstructions ?? "",
        hsnCode: p.hsnCode ?? "",
        jeansCode: "",
        featured: p.featured ?? false,
        trending: p.trending ?? false,
        active: p.active ?? true,
        categoryId: categories?.find((c) => c.name === p.categoryName)?.id ?? "",
        internationalPricingEnabled: usdEntry != null,
        usdRegularPrice: usdEntry?.regularPrice ?? "",
        usdDiscountPrice: usdEntry?.discountPrice ?? "",
        usdOnSale: usdEntry?.discountPrice != null,
      };
      setForm(next);
      setLoadedForm(next);
    }
  }, [productQuery.data, categories]);

  // Merged in once it arrives, into both form and loadedForm so isDirty
  // doesn't false-positive on a field the admin never touched.
  useEffect(() => {
    if (jeansCodeQuery.data) {
      const code = jeansCodeQuery.data.jeansCode ?? "";
      setForm((f) => ({ ...f, jeansCode: code }));
      setLoadedForm((f) => (f ? { ...f, jeansCode: code } : f));
    }
  }, [jeansCodeQuery.data]);

  const isDirty = loadedForm !== null && JSON.stringify(form) !== JSON.stringify(loadedForm);

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const save = useMutation({
    mutationFn: () => {
      const { onSale, internationalPricingEnabled, usdRegularPrice, usdDiscountPrice, usdOnSale, ...rest } = form;
      const payload = {
        ...rest,
        price: Number(form.price),
        discountPrice: onSale && form.discountPrice !== "" ? Number(form.discountPrice) : null,
        categoryId: Number(form.categoryId),
        slug: form.slug.trim() !== "" ? form.slug.trim() : null,
        hsnCode: form.hsnCode !== "" ? form.hsnCode : null,
        jeansCode: form.jeansCode.trim() !== "" ? form.jeansCode.trim() : null,
      };
      if (internationalPricingEnabled) {
        payload.internationalPrice = {
          regularPrice: Number(usdRegularPrice),
          discountPrice: usdOnSale && usdDiscountPrice !== "" ? Number(usdDiscountPrice) : null,
        };
        payload.clearInternationalPricing = false;
      } else {
        payload.clearInternationalPricing = true;
      }
      return isNew ? adminApi.createProduct(payload) : adminApi.updateProduct(resolvedId, payload);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      notify(isNew ? "Product created" : "Product updated", "success");
      setLoadedForm(form);
      if (isNew) navigate(`/admin/products/${data.slug}/edit`, { replace: true });
    },
    onError: (err) => notify(err.message, "error"),
  });

  if (!isNew && slugResolveQuery.isError) return <ErrorState message="Product not found." />;
  if (!isNew && (!resolvedId || productQuery.isLoading)) return <LoadingState label="Loading product" />;

  return (
    <div>
      <BackButton fallback="/admin/products" className="mb-3" />
      <h2 className="text-xl">{isNew ? "New product" : "Edit product"}</h2>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (form.onSale && form.discountPrice !== "" && Number(form.discountPrice) >= Number(form.price)) {
            notify("Sale price must be lower than the regular price.", "error");
            return;
          }
          if (form.internationalPricingEnabled && form.usdRegularPrice === "") {
            notify("Enter an international regular price, or disable international pricing.", "error");
            return;
          }
          if (
            form.internationalPricingEnabled &&
            form.usdOnSale &&
            form.usdDiscountPrice !== "" &&
            Number(form.usdDiscountPrice) >= Number(form.usdRegularPrice)
          ) {
            notify("International sale price must be lower than the international regular price.", "error");
            return;
          }
          save.mutate();
        }}
        className="hairline-card mt-8 grid grid-cols-1 gap-6 p-6 sm:grid-cols-2"
      >
        <Field label="Name" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} required />
        <div className="block">
          <Field
            label="Product URL Slug"
            value={form.slug}
            onChange={(v) => setForm((f) => ({ ...f, slug: v }))}
            placeholder={isNew ? "Leave blank to auto-generate from name" : undefined}
          />
          <p className="label-xs mt-1.5 text-muted-foreground">
            stylenestfashion.com/products/{form.slug.trim() || "..."} — changing this on an existing product breaks
            its old link, so it never changes automatically.
          </p>
        </div>
        <label className="block">
          <span className="label-xs text-muted-foreground">Category</span>
          <select required value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))} className="field mt-2">
            <option value="">Select category</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.gender})
              </option>
            ))}
          </select>
        </label>

        <div className="sm:col-span-2">
          <p className="label-xs text-accent">India pricing (INR)</p>
        </div>
        <Field label="Price" type="number" value={form.price} onChange={(v) => setForm((f) => ({ ...f, price: v }))} required />
        <div className="block">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.onSale}
              onChange={(e) => setForm((f) => ({ ...f, onSale: e.target.checked, discountPrice: e.target.checked ? f.discountPrice : "" }))}
            />
            On Sale
          </label>
          {form.onSale && (
            <div className="mt-3">
              <span className="label-xs text-muted-foreground">Sale price</span>
              <input
                type="number"
                min="0"
                value={form.discountPrice}
                onChange={(e) => setForm((f) => ({ ...f, discountPrice: e.target.value }))}
                className="field mt-2"
                placeholder="Must be lower than price"
              />
              {form.price && form.discountPrice && Number(form.discountPrice) >= Number(form.price) && (
                <p className="mt-1.5 text-xs text-destructive">Sale price should be lower than the regular price.</p>
              )}
              {form.price && form.discountPrice && Number(form.discountPrice) < Number(form.price) && (
                <p className="mt-1.5 text-xs text-accent">
                  {Math.round((1 - Number(form.discountPrice) / Number(form.price)) * 100)}% off
                </p>
              )}
            </div>
          )}
        </div>

        <div className="sm:col-span-2 border-t pt-6">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.internationalPricingEnabled}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  internationalPricingEnabled: e.target.checked,
                  usdRegularPrice: e.target.checked ? f.usdRegularPrice : "",
                  usdDiscountPrice: e.target.checked ? f.usdDiscountPrice : "",
                  usdOnSale: e.target.checked ? f.usdOnSale : false,
                }))
              }
            />
            <span className="label-xs text-accent">Enable international pricing (USD)</span>
          </label>
          <p className="label-xs mt-1.5 text-muted-foreground">
            Set independently of the India price above -- never derived from it. Uncheck and save to remove international pricing.
          </p>

          {form.internationalPricingEnabled && (
            <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Field
                label="International price (USD)"
                type="number"
                value={form.usdRegularPrice}
                onChange={(v) => setForm((f) => ({ ...f, usdRegularPrice: v }))}
                required
              />
              <div className="block">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.usdOnSale}
                    onChange={(e) => setForm((f) => ({ ...f, usdOnSale: e.target.checked, usdDiscountPrice: e.target.checked ? f.usdDiscountPrice : "" }))}
                  />
                  On Sale (USD)
                </label>
                {form.usdOnSale && (
                  <div className="mt-3">
                    <span className="label-xs text-muted-foreground">International sale price</span>
                    <input
                      type="number"
                      min="0"
                      value={form.usdDiscountPrice}
                      onChange={(e) => setForm((f) => ({ ...f, usdDiscountPrice: e.target.value }))}
                      className="field mt-2"
                      placeholder="Must be lower than international price"
                    />
                    {form.usdRegularPrice && form.usdDiscountPrice && Number(form.usdDiscountPrice) >= Number(form.usdRegularPrice) && (
                      <p className="mt-1.5 text-xs text-destructive">Sale price should be lower than the international regular price.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <Field label="Fabric" value={form.fabric} onChange={(v) => setForm((f) => ({ ...f, fabric: v }))} />
        <Field label="HSN/SAC Code" value={form.hsnCode} onChange={(v) => setForm((f) => ({ ...f, hsnCode: v }))} />
        <div className="block">
          <Field
            label="Jeans Code"
            value={form.jeansCode}
            onChange={(v) => setForm((f) => ({ ...f, jeansCode: v }))}
            placeholder="Enter internal jeans code (optional)"
          />
          <p className="label-xs mt-1.5 text-muted-foreground">
            Internal only -- admin search, never shown to customers.
          </p>
        </div>
        <Field label="Short description" value={form.shortDescription} onChange={(v) => setForm((f) => ({ ...f, shortDescription: v }))} />
        <TextArea label="Description" value={form.description} onChange={(v) => setForm((f) => ({ ...f, description: v }))} className="sm:col-span-2" />
        <TextArea label="Care instructions" value={form.careInstructions} onChange={(v) => setForm((f) => ({ ...f, careInstructions: v }))} className="sm:col-span-2" />

        <div className="flex flex-wrap gap-6 sm:col-span-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.featured} onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))} />
            Featured
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.trending} onChange={(e) => setForm((f) => ({ ...f, trending: e.target.checked }))} />
            Trending
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} />
            Active
          </label>
        </div>
        <p className="label-xs text-muted-foreground sm:col-span-2">
          {form.trending ? "✓ Trending" : "Not Trending"} — shows in the gender-matched Trending section once the
          backend stores this flag (see project notes; not yet persisted by the current API).
        </p>

        <div className="flex items-center gap-4 sm:col-span-2">
          <button disabled={save.isPending} className="btn-solid w-fit">
            {save.isPending ? "Saving..." : isNew ? "Create product" : "Save changes"}
          </button>
          <button
            type="button"
            className="label-xs text-muted-foreground transition-colors hover:text-foreground"
            onClick={() => (isNew ? navigate("/admin/products") : loadedForm && setForm(loadedForm))}
          >
            Cancel
          </button>
        </div>
      </form>

      {!isNew && (
        <div className="mt-10">
          <VariantManager
            productId={resolvedId}
            categoryName={categories?.find((c) => String(c.id) === String(form.categoryId))?.name}
            variants={variantsQuery.data ?? []}
            onChanged={() => variantsQuery.refetch()}
          />
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required, placeholder }) {
  return (
    <label className="block">
      <span className="label-xs text-muted-foreground">{label}</span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="field mt-2"
      />
    </label>
  );
}

function TextArea({ label, value, onChange, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="label-xs text-muted-foreground">{label}</span>
      <textarea rows={3} value={value} onChange={(e) => onChange(e.target.value)} className="field mt-2" />
    </label>
  );
}
