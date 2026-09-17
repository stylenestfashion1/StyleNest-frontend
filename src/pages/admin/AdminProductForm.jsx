import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as adminApi from "../../api/admin";
import * as productsApi from "../../api/products";
import * as categoriesApi from "../../api/categories";
import { useToast } from "../../context/ToastContext";
import LoadingState from "../../components/LoadingState";
import BackButton from "../../components/BackButton";
import VariantManager from "../../components/admin/VariantManager";

const EMPTY = {
  name: "",
  shortDescription: "",
  description: "",
  price: "",
  discountPrice: "",
  onSale: false,
  fabric: "",
  careInstructions: "",
  hsnCode: "",
  featured: false,
  trending: false,
  active: true,
  categoryId: "",
};

export default function AdminProductForm() {
  const { id } = useParams();
  const isNew = id === "new";
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const [form, setForm] = useState(EMPTY);

  const { data: categories } = useQuery({ queryKey: ["admin", "categories"], queryFn: () => categoriesApi.getCategories() });

  const productQuery = useQuery({ queryKey: ["admin", "product", id], queryFn: () => adminApi.getAdminProduct(id), enabled: !isNew });
  const variantsQuery = useQuery({ queryKey: ["admin", "variants", id], queryFn: () => productsApi.getProductVariants(id), enabled: !isNew });

  const [loadedForm, setLoadedForm] = useState(null);

  useEffect(() => {
    if (productQuery.data) {
      const p = productQuery.data;
      const next = {
        name: p.name ?? "",
        shortDescription: p.shortDescription ?? "",
        description: p.description ?? "",
        price: p.price ?? "",
        discountPrice: p.discountPrice ?? "",
        onSale: p.discountPrice != null,
        fabric: p.fabric ?? "",
        careInstructions: p.careInstructions ?? "",
        hsnCode: p.hsnCode ?? "",
        featured: p.featured ?? false,
        trending: p.trending ?? false,
        active: p.active ?? true,
        categoryId: categories?.find((c) => c.name === p.categoryName)?.id ?? "",
      };
      setForm(next);
      setLoadedForm(next);
    }
  }, [productQuery.data, categories]);

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
      const { onSale, ...rest } = form;
      const payload = {
        ...rest,
        price: Number(form.price),
        discountPrice: onSale && form.discountPrice !== "" ? Number(form.discountPrice) : null,
        categoryId: Number(form.categoryId),
        hsnCode: form.hsnCode !== "" ? form.hsnCode : null,
      };
      return isNew ? adminApi.createProduct(payload) : adminApi.updateProduct(id, payload);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      notify(isNew ? "Product created" : "Product updated", "success");
      setLoadedForm(form);
      if (isNew) navigate(`/admin/products/${data.id}`, { replace: true });
    },
    onError: (err) => notify(err.message, "error"),
  });

  if (!isNew && productQuery.isLoading) return <LoadingState label="Loading product" />;

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
          save.mutate();
        }}
        className="hairline-card mt-8 grid grid-cols-1 gap-6 p-6 sm:grid-cols-2"
      >
        <Field label="Name" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} required />
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
        <Field label="Fabric" value={form.fabric} onChange={(v) => setForm((f) => ({ ...f, fabric: v }))} />
        <Field label="HSN/SAC Code" value={form.hsnCode} onChange={(v) => setForm((f) => ({ ...f, hsnCode: v }))} />
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
            productId={id}
            categoryName={categories?.find((c) => String(c.id) === String(form.categoryId))?.name}
            variants={variantsQuery.data ?? []}
            onChanged={() => variantsQuery.refetch()}
          />
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required }) {
  return (
    <label className="block">
      <span className="label-xs text-muted-foreground">{label}</span>
      <input type={type} required={required} value={value} onChange={(e) => onChange(e.target.value)} className="field mt-2" />
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
