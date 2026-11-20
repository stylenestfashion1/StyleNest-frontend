import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as categoriesApi from "../../api/categories";
import * as adminApi from "../../api/admin";
import { useToast } from "../../context/ToastContext";
import SingleImageUpload from "../../components/admin/SingleImageUpload";
import BackButton from "../../components/BackButton";

const EMPTY = { name: "", description: "", imageUrl: "", gender: "MEN", parentId: "", active: true };

export default function AdminCategories() {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);

  const { data: categories, isLoading } = useQuery({ queryKey: ["admin", "categories"], queryFn: () => categoriesApi.getCategories() });

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        ...form,
        parentId: form.parentId ? Number(form.parentId) : null,
      };
      return editingId ? adminApi.updateCategory(editingId, payload) : adminApi.createCategory(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      notify(editingId ? "Category updated" : "Category created", "success");
      setForm(EMPTY);
      setEditingId(null);
    },
    onError: (err) => notify(err.message, "error"),
  });

  const remove = useMutation({
    mutationFn: (id) => adminApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (err) => notify(err.message, "error"),
  });

  function startEdit(cat) {
    setEditingId(cat.id);
    setForm({
      name: cat.name,
      description: cat.description ?? "",
      imageUrl: cat.imageUrl ?? "",
      gender: cat.gender,
      parentId: cat.parentId ? String(cat.parentId) : "",
      active: cat.active,
    });
  }

  return (
    <div>
      <BackButton fallback="/admin" className="mb-3" />
      <h2 className="text-xl">Categories</h2>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
        className="hairline-card mt-8 grid grid-cols-1 gap-6 p-6 sm:grid-cols-2"
      >
        <Field label="Name" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} required />
        <SingleImageUpload
          label="Category Image"
          value={form.imageUrl}
          onChange={(v) => setForm((f) => ({ ...f, imageUrl: v }))}
          aspect={4 / 5}
          guidance="Recommended: 1200 × 1500 px (4:5 portrait). Minimum: 800 × 1000 px. Keep the main subject centered and safely inside the frame — this image fills a portrait category card in the homepage carousel, so avoid busy edges."
        />
        <label className="block sm:col-span-2">
          <span className="label-xs text-muted-foreground">Description</span>
          <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} className="field mt-2" />
        </label>
        <div>
          <span className="label-xs text-muted-foreground">Gender</span>
          <div className="mt-3 flex gap-2">
            {["MEN", "WOMEN"].map((g) => (
              <button
                type="button"
                key={g}
                onClick={() => setForm((f) => ({ ...f, gender: g, parentId: "" }))}
                className={`label-xs border px-4 py-2 transition-colors ${form.gender === g ? "bg-foreground text-primary-foreground" : "hover:border-accent"}`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
        <div>
          <span className="label-xs text-muted-foreground">Parent Category (Optional)</span>
          <select
            value={form.parentId}
            onChange={(e) => setForm((f) => ({ ...f, parentId: e.target.value }))}
            className="field mt-2"
          >
            <option value="">None (Top-Level Category)</option>
            {categories
              ?.filter((c) => c.gender === form.gender && !c.parentId && c.id !== editingId)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </select>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Optional. Select a parent to make this a subcategory (e.g. Sweatshirts under Winter).
          </p>
        </div>
        <label className="flex items-center gap-2 self-end text-sm">
          <input type="checkbox" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} />
          Active
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
              className="label-xs text-muted-foreground"
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
            <div key={cat.id} className={`flex items-center justify-between py-4 text-sm ${cat.parentId ? "pl-6 bg-muted/20" : ""}`}>
              <div className="flex items-center flex-wrap gap-2">
                {cat.parentId && <span className="text-muted-foreground font-mono">↳</span>}
                <span className={cat.parentId ? "font-normal" : "font-medium"}>{cat.name}</span>
                <span className="label-xs text-muted-foreground">{cat.gender}</span>
                {cat.parentName && (
                  <span className="label-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">
                    under {cat.parentName}
                  </span>
                )}
                {cat.subcategories?.length > 0 && (
                  <span className="label-xs bg-accent/10 text-accent px-2 py-0.5 rounded">
                    {cat.subcategories.length} subcategories
                  </span>
                )}
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
