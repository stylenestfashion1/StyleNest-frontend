import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import * as adminApi from "../../api/admin";
import { useToast } from "../../context/ToastContext";
import { getSwatchColor } from "../../utils/swatchColor";
import { getSizeLabel, sizesForCategory } from "../../utils/sizeLabel";
import ImageUploadManager from "./ImageUploadManager";

// Just suggestions for the color autocomplete (datalist) -- admins can
// type any color name, not only these. Colors already used on this
// product are added to the list too (see ColorPicker).
const COMMON_COLORS = ["BLACK", "WHITE", "BLUE", "RED", "GREEN", "BEIGE", "GREY", "BROWN", "PINK", "YELLOW", "ORANGE", "PURPLE"];
const LOW_STOCK_THRESHOLD = 5;

function stockStatus(stock) {
  if (stock <= 0) return { label: "Out of stock", className: "text-destructive" };
  if (stock <= LOW_STOCK_THRESHOLD) return { label: "Low stock", className: "text-accent" };
  return { label: "Available", className: "text-muted-foreground" };
}

// Every size of the same color shares one photo set (the garment
// photographed is identical regardless of size), so images are uploaded
// once per color here rather than once per size variant.
function groupByColor(variants) {
  const groups = new Map();
  for (const v of variants) {
    if (!groups.has(v.color)) {
      groups.set(v.color, { color: v.color, colorHex: v.colorHex, images: v.images ?? [], variants: [] });
    }
    groups.get(v.color).variants.push(v);
  }
  return [...groups.values()];
}

export default function VariantManager({ productId, categoryName, variants, onChanged }) {
  const { notify } = useToast();
  const sizes = sizesForCategory(categoryName);
  const [form, setForm] = useState({ color: "", colorHex: "", size: sizes[0].value, stock: 0 });
  const [expandedImages, setExpandedImages] = useState(null);
  const [editing, setEditing] = useState(null);
  const [editingColor, setEditingColor] = useState(null);

  // Root cause of the "Jeans 28 -> XS" bug: this component can mount
  // before `categoryName` has resolved (the parent's category list is a
  // separate, independently-loading query), so the useState initializer
  // above sometimes locks in "XS" from the apparel list before Jeans'
  // numeric list is known. The <select> then visually shows "28" (the
  // browser falls back to displaying the first option once the real
  // options list no longer contains "XS"), but the underlying form.size
  // state stayed "XS" the whole time -- that's what actually got
  // submitted. This keeps form.size in sync whenever the valid size list
  // for this category changes and the current value isn't one of them,
  // instead of trusting a value fixed once at mount.
  useEffect(() => {
    if (!sizes.some((s) => s.value === form.size)) {
      setForm((f) => ({ ...f, size: sizes[0]?.value ?? f.size }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryName]);

  const addVariant = useMutation({
    mutationFn: () => adminApi.createVariant(productId, { ...form, colorHex: form.colorHex || null, stock: Number(form.stock) }),
    onSuccess: () => {
      onChanged();
      notify("Variant added", "success");
    },
    onError: (err) => notify(err.message, "error"),
  });

  const deleteVariant = useMutation({
    mutationFn: (variantId) => adminApi.deleteVariant(variantId),
    onSuccess: onChanged,
    onError: (err) => notify(err.message, "error"),
  });

  const colorGroups = groupByColor(variants);

  return (
    <div>
      <h3 className="label-xs text-muted-foreground">Variants</h3>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          addVariant.mutate();
        }}
        className="hairline-card mt-4 flex flex-wrap items-end gap-4 p-5"
      >
        <ColorInput
          value={form.color}
          onChange={(color) => setForm((f) => ({ ...f, color }))}
          suggestions={colorGroups.map((g) => g.color)}
        />
        <ColorHexPicker
          color={form.color}
          colorHex={form.colorHex}
          onChange={(hex) => setForm((f) => ({ ...f, colorHex: hex }))}
        />
        <label className="block">
          <span className="label-xs text-muted-foreground">Size</span>
          <select value={form.size} onChange={(e) => setForm((f) => ({ ...f, size: e.target.value }))} className="field mt-2">
            {sizes.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="label-xs text-muted-foreground">Stock</span>
          <input type="number" min="0" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} className="field mt-2 w-24" />
        </label>
        <button disabled={addVariant.isPending || !form.color.trim()} className="btn-solid">
          Add variant
        </button>
      </form>

      <div className="mt-4 flex flex-col divide-y border-y">
        {colorGroups.length === 0 && <p className="py-4 text-sm text-muted-foreground">No variants yet.</p>}
        {colorGroups.map((group) => (
          <div key={group.color}>
            <div className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
              <span className="flex items-center gap-2">
                <span
                  className="h-4 w-4 shrink-0 rounded-full ring-1 ring-inset ring-black/10"
                  style={{ backgroundColor: getSwatchColor(group.color, group.colorHex) }}
                />
                {group.color} — {group.images.length} image(s)
                {group.images.length === 0 && (
                  <span className="label-xs rounded bg-destructive/10 px-2 py-0.5 font-semibold text-destructive">
                    NO IMAGES UPLOADED
                  </span>
                )}
              </span>
              <span className="flex gap-4">
                <button
                  onClick={() => setEditingColor(editingColor === group.color ? null : group.color)}
                  className="label-xs link-underline"
                >
                  {editingColor === group.color ? "Close" : "Edit Color"}
                </button>
                <button
                  onClick={() => setExpandedImages(expandedImages === group.color ? null : group.color)}
                  className="label-xs link-underline"
                >
                  {expandedImages === group.color ? "Close images" : "Images"}
                </button>
              </span>
            </div>

            {editingColor === group.color && (
              <ColorGroupEditForm
                productId={productId}
                group={group}
                onSaved={() => { setEditingColor(null); onChanged(); }}
                onCancel={() => setEditingColor(null)}
              />
            )}

            {expandedImages === group.color && (
              <div className="bg-muted/40 p-4">
                <ImageUploadManager
                  images={group.images}
                  aspect={4 / 5}
                  guidance="Recommended: portrait 4:5 ratio, 1200×1500px or higher. Keep the full garment visible — avoid cutting off sleeves, hems or shoes. Uploaded once per color, shown for every size."
                  // Adding does NOT refetch itself -- a multi-image batch
                  // would otherwise trigger a full product+variants refetch
                  // after every single image (see ImageUploadManager,
                  // which now refetches once after the whole batch
                  // finishes, via the onChanged prop below).
                  onAddImage={(data) => adminApi.addImageToColor(productId, group.color, data)}
                  onDeleteImage={(imageId) => adminApi.deleteImage(imageId).then(onChanged)}
                  onChanged={onChanged}
                  onReorderImages={(orderedImageIds) =>
                    adminApi.reorderColorImages(productId, group.color, orderedImageIds).then(onChanged)
                  }
                />
              </div>
            )}

            <div className="divide-y">
              {group.variants.map((v) => {
                const status = stockStatus(v.stock);
                return (
                  <div key={v.id}>
                    <div className="flex flex-wrap items-center justify-between gap-3 py-3 pl-6 text-sm">
                      <span>
                        {getSizeLabel(v.size)} — {v.stock} in stock <span className={`label-xs ${status.className}`}>· {status.label}</span>
                        {v.sku && <span className="text-muted-foreground"> · SKU: {v.sku}</span>}
                      </span>
                      <div className="flex gap-4">
                        <button onClick={() => setEditing(editing === v.id ? null : v.id)} className="label-xs link-underline">
                          {editing === v.id ? "Close" : "Edit"}
                        </button>
                        <button onClick={() => deleteVariant.mutate(v.id)} className="label-xs link-underline text-destructive">
                          Delete
                        </button>
                      </div>
                    </div>
                    {editing === v.id && (
                      <VariantEditForm
                        variant={v}
                        categoryName={categoryName}
                        onSaved={() => { setEditing(null); onChanged(); }}
                        onCancel={() => setEditing(null)}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Size and stock only -- color is deliberately NOT editable here. Changing a single size's
// color independently of its siblings is exactly the old workflow this replaces (see
// ColorGroupEditForm below, which is the only supported way to change a color: it updates
// every size in the group in one operation so they can never end up mismatched).
function VariantEditForm({ variant, categoryName, onSaved, onCancel }) {
  const { notify } = useToast();
  const sizes = sizesForCategory(categoryName);
  const [form, setForm] = useState({ size: variant.size, stock: variant.stock });

  const update = useMutation({
    mutationFn: () =>
      adminApi.updateVariant(variant.id, {
        color: variant.color,
        colorHex: variant.colorHex ?? null,
        size: form.size,
        stock: Number(form.stock),
      }),
    onSuccess: () => {
      notify("Variant updated", "success");
      onSaved();
    },
    onError: (err) => notify(err.message, "error"),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        update.mutate();
      }}
      className="hairline-card flex flex-wrap items-end gap-4 p-5"
    >
      <label className="block">
        <span className="label-xs text-muted-foreground">Size</span>
        <select value={form.size} onChange={(e) => setForm((f) => ({ ...f, size: e.target.value }))} className="field mt-2">
          {sizes.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="label-xs text-muted-foreground">Stock</span>
        <input type="number" min="0" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} className="field mt-2 w-24" />
      </label>
      <button disabled={update.isPending} className="btn-solid">
        {update.isPending ? "Saving..." : "Save"}
      </button>
      <button type="button" onClick={onCancel} className="label-xs text-muted-foreground">
        Cancel
      </button>
    </form>
  );
}

// Color-GROUP level edit: renames every existing size of this color in one operation. This is
// the ONLY place a color can be changed -- individual variant rows no longer expose a color
// field (see VariantEditForm above). Typing a color that already exists on this product as a
// DIFFERENT group is rejected with a clear error rather than silently merging the two groups.
function ColorGroupEditForm({ productId, group, onSaved, onCancel }) {
  const { notify } = useToast();
  const [newColor, setNewColor] = useState(group.color);
  const [newColorHex, setNewColorHex] = useState("");

  const rename = useMutation({
    mutationFn: () =>
      adminApi.renameColorGroup(productId, group.color, {
        newColor,
        newColorHex: newColorHex || null,
      }),
    onSuccess: () => {
      notify(`Updated ${group.variants.length} size${group.variants.length > 1 ? "s" : ""} to ${newColor.trim().toUpperCase()}`, "success");
      onSaved();
    },
    onError: (err) => notify(err.message, "error"),
  });

  const sizeLabels = group.variants.map((v) => getSizeLabel(v.size)).join(", ");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        rename.mutate();
      }}
      className="hairline-card flex flex-wrap items-end gap-4 p-5"
    >
      <div className="w-full text-xs text-muted-foreground">
        Changes ALL {group.variants.length} existing size{group.variants.length > 1 ? "s" : ""} ({sizeLabels}) from{" "}
        <span className="font-semibold text-foreground">{group.color}</span> to the new color below. No sizes are added or removed.
      </div>
      <ColorInput value={newColor} onChange={setNewColor} />
      <ColorHexPicker color={newColor} colorHex={newColorHex} onChange={setNewColorHex} />
      <button disabled={rename.isPending || !newColor.trim()} className="btn-solid">
        {rename.isPending ? "Saving..." : "Save color"}
      </button>
      <button type="button" onClick={onCancel} className="label-xs text-muted-foreground">
        Cancel
      </button>
    </form>
  );
}

// Free-text color name -- any value is valid, not just a fixed list. The
// datalist merges common colors with whatever's already used on this
// product, purely as typing convenience/autocomplete; it never restricts
// input. The backend normalizes (trim + uppercase) on save, so casing
// typed here doesn't matter.
function ColorInput({ value, onChange, suggestions = [] }) {
  const options = [...new Set([...COMMON_COLORS, ...suggestions])];
  return (
    <label className="block">
      <span className="label-xs text-muted-foreground">Color</span>
      <div className="mt-2 flex items-center gap-2">
        <span
          className="h-5 w-5 shrink-0 rounded-full ring-1 ring-inset ring-black/10"
          style={{ backgroundColor: getSwatchColor(value) }}
          aria-hidden="true"
        />
        <input
          list="color-suggestions"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. BLACK, Dusty Rose"
          autoComplete="off"
          className="field no-list-indicator min-w-0 flex-1"
        />
      </div>
      <datalist id="color-suggestions">
        {options.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
    </label>
  );
}

// Lets the admin sample the *exact* shade of the actual garment (e.g. a
// light-blue wash, not just "Blue") so the storefront swatch matches the
// product photo instead of a generic per-family color -- see
// utils/swatchColor.js for how this overrides the fallback.
function ColorHexPicker({ color, colorHex, onChange }) {
  return (
    <label className="block">
      <span className="label-xs text-muted-foreground">Exact shade (optional)</span>
      <div className="mt-2 flex items-center gap-2">
        <input
          type="color"
          value={colorHex || getSwatchColor(color)}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-10 cursor-pointer rounded border p-0"
          aria-label="Pick exact shade"
        />
        {colorHex && (
          <button type="button" onClick={() => onChange("")} className="label-xs link-underline text-muted-foreground">
            Reset
          </button>
        )}
      </div>
    </label>
  );
}
