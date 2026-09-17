import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as adminApi from "../../api/admin";
import { useToast } from "../../context/ToastContext";
import LoadingState from "../../components/LoadingState";
import BackButton from "../../components/BackButton";
import SingleImageUpload from "../../components/admin/SingleImageUpload";

const EMPTY = {
  name: "",
  description: "",
  imageUrl: "",
  price: "",
  minOrderQuantity: "",
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

  const { data: categories } = useQuery({ queryKey: ["admin", "bulk-categories"], queryFn: adminApi.getAdminBulkCategories });

  const productQuery = useQuery({
    queryKey: ["admin", "bulk-product", id],
    queryFn: () => adminApi.getAdminBulkProduct(id),
    enabled: !isNew,
  });

  useEffect(() => {
    if (productQuery.data) {
      const p = productQuery.data;
      setForm({
        name: p.name ?? "",
        description: p.description ?? "",
        imageUrl: p.imageUrl ?? "",
        price: p.price ?? "",
        minOrderQuantity: p.minOrderQuantity ?? "",
        availableStock: p.availableStock ?? "",
        categoryId: p.categoryId ?? "",
        hsnCode: p.hsnCode ?? "",
        active: p.active ?? true,
      });
    }
  }, [productQuery.data]);

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        ...form,
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

  if (!isNew && productQuery.isLoading) return <LoadingState label="Loading product" />;

  return (
    <div>
      <BackButton fallback="/admin/bulk/products" className="mb-3" />
      <h2 className="text-xl">{isNew ? "New Bulk Product" : "Edit Bulk Product"}</h2>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
        className="hairline-card mt-8 grid grid-cols-1 gap-6 p-6 sm:grid-cols-2"
      >
        <Field label="Name" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} required />

        <label className="block">
          <span className="label-xs text-muted-foreground">Category</span>
          <select
            value={form.categoryId}
            onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
            required
            className="field mt-2"
          >
            <option value="" disabled>
              Select category
            </option>
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <SingleImageUpload
          label="Product Image"
          value={form.imageUrl}
          onChange={(v) => setForm((f) => ({ ...f, imageUrl: v }))}
          aspect={4 / 5}
          guidance="A single representative image for this wholesale item."
        />

        <label className="block sm:col-span-2">
          <span className="label-xs text-muted-foreground">Description</span>
          <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} className="field mt-2" />
        </label>

        <Field
          label="Price per piece (₹)"
          type="number"
          value={form.price}
          onChange={(v) => setForm((f) => ({ ...f, price: v }))}
          required
        />
        <Field
          label="Minimum order quantity"
          type="number"
          value={form.minOrderQuantity}
          onChange={(v) => setForm((f) => ({ ...f, minOrderQuantity: v }))}
          required
        />
        <Field
          label="Available stock (optional -- leave blank if not tracked)"
          type="number"
          value={form.availableStock}
          onChange={(v) => setForm((f) => ({ ...f, availableStock: v }))}
        />
        <Field label="HSN/SAC Code" value={form.hsnCode} onChange={(v) => setForm((f) => ({ ...f, hsnCode: v }))} />

        <label className="flex items-center gap-2 self-end text-sm">
          <input type="checkbox" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} />
          Active (visible in the wholesale catalog)
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
      <input type={type} value={value} required={required} onChange={(e) => onChange(e.target.value)} className="field mt-2" />
    </label>
  );
}
