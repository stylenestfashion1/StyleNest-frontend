import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as adminApi from "../../api/admin";
import { useToast } from "../../context/ToastContext";
import SingleImageUpload from "../../components/admin/SingleImageUpload";
import BackButton from "../../components/BackButton";

const EMPTY = { name: "", gender: "WOMEN", description: "", imageUrl: "", active: true };

export default function AdminBulkCategories() {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);

  const { data: categories, isLoading } = useQuery({
    queryKey: ["admin", "bulk-categories"],
    queryFn: adminApi.getAdminBulkCategories,
  });

  const save = useMutation({
    mutationFn: () => (editingId ? adminApi.updateAdminBulkCategory(editingId, form) : adminApi.createAdminBulkCategory(form)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "bulk-categories"] });
      notify(editingId ? "Bulk category updated" : "Bulk category created", "success");
      setForm(EMPTY);
      setEditingId(null);
    },
    onError: (err) => notify(err.message, "error"),
  });

  const remove = useMutation({
    mutationFn: (id) => adminApi.deleteAdminBulkCategory(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "bulk-categories"] }),
    onError: (err) => notify(err.message, "error"),
  });

  function startEdit(cat) {
    setEditingId(cat.id);
    setForm({
      name: cat.name,
      gender: cat.gender ?? (cat.slug?.startsWith("men-") ? "MEN" : "WOMEN"),
      description: cat.description ?? "",
      imageUrl: cat.imageUrl ?? "",
      active: cat.active,
    });
  }

  return (
    <div>
      <BackButton fallback="/admin" className="mb-3" />
      <h2 className="text-xl font-bold">Bulk Categories</h2>
      <p className="label-xs mt-2 text-muted-foreground">
        Separate from retail categories -- these appear exclusively inside the wholesale bulk-order portal grouped by Men and Women.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
        className="hairline-card mt-8 grid grid-cols-1 gap-6 p-6 sm:grid-cols-2"
      >
        <Field label="Category Name" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} required />

        <label className="block">
          <span className="label-xs text-muted-foreground">Gender Segment</span>
          <select
            value={form.gender}
            onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
            className="field mt-2"
            required
          >
            <option value="WOMEN">Women</option>
            <option value="MEN">Men</option>
          </select>
        </label>

        <SingleImageUpload
          label="Category Image"
          value={form.imageUrl}
          onChange={(v) => setForm((f) => ({ ...f, imageUrl: v }))}
          aspect={4 / 5}
          guidance="Recommended: 1200 × 1500 px (4:5 portrait). Minimum: 800 × 1000 px. Keep the main subject centered and safely inside the frame — this image fills a portrait category card in the homepage carousel, so avoid busy edges."
        />

        <label className="block sm:col-span-2">
          <span className="label-xs text-muted-foreground">Description</span>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={2}
            className="field mt-2"
          />
        </label>

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
            {editingId ? "Update category" : "Create category"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm(EMPTY);
              }}
              className="label-xs text-muted-foreground px-4 py-2 hover:underline"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {isLoading ? (
        <div className="skeleton mt-8 h-40 w-full" />
      ) : (
        <div className="mt-8 flex flex-col divide-y border-y">
          {categories?.map((cat) => (
            <div key={cat.id} className="flex items-center justify-between py-4 text-sm">
              <div className="flex items-center gap-3">
                <span className="font-medium">{cat.name}</span>
                <span
                  className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${
                    cat.gender === "MEN" || cat.slug?.startsWith("men-")
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : "bg-purple-50 text-purple-700 border-purple-200"
                  }`}
                >
                  {cat.gender ?? (cat.slug?.startsWith("men-") ? "MEN" : "WOMEN")}
                </span>
                {!cat.active && <span className="label-xs text-destructive">Inactive</span>}
              </div>
              <div className="flex gap-4">
                <button onClick={() => startEdit(cat)} className="label-xs link-underline">
                  Edit
                </button>
                <button onClick={() => remove.mutate(cat.id)} className="label-xs link-underline text-destructive">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, required }) {
  return (
    <label className="block">
      <span className="label-xs text-muted-foreground">{label}</span>
      <input value={value} required={required} onChange={(e) => onChange(e.target.value)} className="field mt-2" />
    </label>
  );
}
