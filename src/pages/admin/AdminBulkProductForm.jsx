import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Images } from "lucide-react";
import * as adminApi from "../../api/admin";
import { useToast } from "../../context/ToastContext";
import LoadingState from "../../components/LoadingState";
import BackButton from "../../components/BackButton";
import SingleImageUpload from "../../components/admin/SingleImageUpload";

const EMPTY = {
  name: "",
  description: "",
  imageUrl: "",
  imageUrls: [],
  price: "",
  minOrderQuantity: "10",
  availableStock: "",
  categoryId: "",
  hsnCode: "",
  active: true,
};

export default function AdminBulkProductForm() {
  const { id } = useParams();
  const isNew = id === "new";
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const [form, setForm] = useState(EMPTY);
  const [newAngleUrl, setNewAngleUrl] = useState("");

  const { data: categories } = useQuery({
    queryKey: ["admin", "bulk-categories"],
    queryFn: adminApi.getAdminBulkCategories,
  });

  const productQuery = useQuery({
    queryKey: ["admin", "bulk-product", id],
    queryFn: () => adminApi.getAdminBulkProduct(id),
    enabled: !isNew,
  });

  useEffect(() => {
    if (productQuery.data) {
      const p = productQuery.data;
      const initialImages = p.imageUrls?.length > 0 ? p.imageUrls : p.imageUrl ? [p.imageUrl] : [];
      setForm({
        name: p.name ?? "",
        description: p.description ?? "",
        imageUrl: p.imageUrl ?? (initialImages[0] ?? ""),
        imageUrls: initialImages,
        price: p.price ?? "",
        minOrderQuantity: p.minOrderQuantity ?? "10",
        availableStock: p.availableStock ?? "",
        categoryId: p.categoryId ?? "",
        hsnCode: p.hsnCode ?? "",
        active: p.active ?? true,
      });
    }
  }, [productQuery.data]);

  const save = useMutation({
    mutationFn: () => {
      const finalImageUrls = (form.imageUrls || []).filter(Boolean);
      if (form.imageUrl && !finalImageUrls.includes(form.imageUrl)) {
        finalImageUrls.unshift(form.imageUrl);
      }
      const payload = {
        ...form,
        imageUrl: form.imageUrl || finalImageUrls[0] || "",
        imageUrls: finalImageUrls,
        price: Number(form.price),
        minOrderQuantity: Number(form.minOrderQuantity),
        availableStock: form.availableStock === "" ? null : Number(form.availableStock),
        categoryId: Number(form.categoryId),
        hsnCode: form.hsnCode !== "" ? form.hsnCode : null,
      };
      return isNew ? adminApi.createAdminBulkProduct(payload) : adminApi.updateAdminBulkProduct(id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "bulk-products"] });
      notify(isNew ? "Bulk product created" : "Bulk product updated", "success");
      navigate("/admin/bulk/products");
    },
    onError: (err) => notify(err.message, "error"),
  });

  function addAnglePhoto(url) {
    if (!url) return;
    setForm((f) => {
      const current = f.imageUrls || [];
      if (current.includes(url)) return f;
      return { ...f, imageUrls: [...current, url] };
    });
    setNewAngleUrl("");
  }

  function removeAnglePhoto(index) {
    setForm((f) => {
      const updated = [...(f.imageUrls || [])];
      updated.splice(index, 1);
      return { ...f, imageUrls: updated, imageUrl: updated[0] || "" };
    });
  }

  if (!isNew && productQuery.isLoading) return <LoadingState label="Loading product" />;

  return (
    <div>
      <BackButton fallback="/admin/bulk/products" className="mb-3" />
      <h2 className="text-xl font-bold">{isNew ? "New Bulk Product" : "Edit Bulk Product"}</h2>
      <p className="label-xs mt-2 text-muted-foreground">
        Products created here appear only in the wholesale portal with a fixed bulk pack lot size and multi-angle photo gallery.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
        className="hairline-card mt-8 grid grid-cols-1 gap-6 p-6 sm:grid-cols-2"
      >
        <Field label="Product Name" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} required />

        <label className="block">
          <span className="label-xs text-muted-foreground">Wholesale Category</span>
          <select
            value={form.categoryId}
            onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
            required
            className="field mt-2"
          >
            <option value="" disabled>
              Select category
            </option>
            {categories?.map((c) => {
              const seg = c.gender ?? (c.slug?.startsWith("men-") ? "MEN" : "WOMEN");
              return (
                <option key={c.id} value={c.id}>
                  [{seg}] {c.name}
                </option>
              );
            })}
          </select>
        </label>

        {/* Primary Image Upload with Explicit Recommended Sizing Guidance */}
        <SingleImageUpload
          label="Primary Product Image (Front View)"
          value={form.imageUrl}
          onChange={(v) => {
            setForm((f) => {
              const list = f.imageUrls?.length > 0 ? [...f.imageUrls] : [];
              if (v && !list.includes(v)) list.unshift(v);
              return { ...f, imageUrl: v, imageUrls: list };
            });
          }}
          aspect={4 / 5}
          guidance="Recommended: 1200 × 1500 px (4:5 portrait). Minimum: 800 × 1000 px. Keep the main subject centered and safely inside the frame — this image fills a portrait category card in the homepage carousel, so avoid busy edges."
        />

        {/* Additional Multi-Angle Photos Section */}
        <div className="sm:col-span-2 rounded-xl border border-border/80 bg-muted/20 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <Images className="h-4 w-4" />
              Additional Angle Photos (Side, Back, Detail Views)
            </span>
            <span className="text-xs text-muted-foreground">
              {form.imageUrls?.length || 0} Total Photo{form.imageUrls?.length === 1 ? "" : "s"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Recommended: 1200 × 1500 px (4:5 portrait). These photos appear in the product detail multi-view thumbnail gallery.
          </p>

          {/* Current Gallery Photos Grid */}
          {form.imageUrls?.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-4">
              {form.imageUrls.map((url, idx) => (
                <div key={idx} className="relative h-28 w-24 rounded-lg overflow-hidden border bg-background group">
                  <img src={url} alt={`View ${idx + 1}`} className="h-full w-full object-cover object-top" />
                  <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">
                    {idx === 0 ? "Primary" : `View ${idx + 1}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeAnglePhoto(idx)}
                    className="absolute top-1 right-1 h-5 w-5 bg-destructive text-white rounded-full flex items-center justify-center opacity-80 hover:opacity-100"
                    title="Remove angle photo"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Quick Add Photo URL Input */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Paste additional angle image URL (e.g. side view, back view)"
              value={newAngleUrl}
              onChange={(e) => setNewAngleUrl(e.target.value)}
              className="field text-xs flex-1"
            />
            <button
              type="button"
              onClick={() => addAnglePhoto(newAngleUrl)}
              disabled={!newAngleUrl.trim()}
              className="btn-outline text-xs px-4 py-2 flex items-center gap-1 disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" />
              Add View
            </button>
          </div>
        </div>

        <label className="block sm:col-span-2">
          <span className="label-xs text-muted-foreground">Description</span>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={3}
            className="field mt-2"
          />
        </label>

        <Field
          label="Wholesale Price per piece (₹)"
          type="number"
          value={form.price}
          onChange={(v) => setForm((f) => ({ ...f, price: v }))}
          required
        />

        <Field
          label="Minimum Order Quantity (MOQ >= 10 pcs, e.g. 10)"
          type="number"
          value={form.minOrderQuantity}
          onChange={(v) => setForm((f) => ({ ...f, minOrderQuantity: v }))}
          required
        />

        <Field
          label="Available wholesale stock (optional -- leave blank if not tracked)"
          type="number"
          value={form.availableStock}
          onChange={(v) => setForm((f) => ({ ...f, availableStock: v }))}
        />

        <Field
          label="HSN / SAC Code"
          value={form.hsnCode}
          onChange={(v) => setForm((f) => ({ ...f, hsnCode: v }))}
        />

        <label className="flex items-center gap-2 self-end text-sm">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
          />
          Active in wholesale catalog
        </label>

        <div className="flex gap-3 sm:col-span-2">
          <button disabled={save.isPending} className="btn-solid">
            {isNew ? "Create product" : "Update product"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, required, type = "text" }) {
  return (
    <label className="block">
      <span className="label-xs text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="field mt-2"
      />
    </label>
  );
}
