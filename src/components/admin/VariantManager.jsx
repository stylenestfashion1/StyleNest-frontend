import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import * as adminApi from "../../api/admin";
import { useToast } from "../../context/ToastContext";
import { getSwatchColor, resolveKnownColorHex } from "../../utils/swatchColor";
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
  const [form, setForm] = useState({
    color: "",
    colorHex: "",
    size: sizes[0].value,
    stock: 0,
    shippingWeightGrams: "",
    packageLengthCm: "",
    packageWidthCm: "",
    packageHeightCm: "",
  });
  const [expandedImages, setExpandedImages] = useState(null);
  const [editing, setEditing] = useState(null);
  const [editingColor, setEditingColor] = useState(null);
  const [addingSizeFor, setAddingSizeFor] = useState(null);

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
    mutationFn: () =>
      adminApi.createVariant(productId, {
        color: form.color,
        colorHex: form.colorHex || null,
        size: form.size,
        stock: Number(form.stock),
        shippingWeightGrams: form.shippingWeightGrams !== "" ? Number(form.shippingWeightGrams) : null,
        packageLengthCm: form.packageLengthCm !== "" ? Number(form.packageLengthCm) : null,
        packageWidthCm: form.packageWidthCm !== "" ? Number(form.packageWidthCm) : null,
        packageHeightCm: form.packageHeightCm !== "" ? Number(form.packageHeightCm) : null,
      }),
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
          if (form.shippingWeightGrams !== "" && (Number(form.shippingWeightGrams) <= 0 || Number(form.shippingWeightGrams) > 100000)) {
            notify("Shipping weight must be between 0.01 and 100,000 grams.", "error");
            return;
          }
          if (form.packageLengthCm !== "" && (Number(form.packageLengthCm) <= 0 || Number(form.packageLengthCm) > 500)) {
            notify("Package length must be between 0.1 and 500 cm.", "error");
            return;
          }
          if (form.packageWidthCm !== "" && (Number(form.packageWidthCm) <= 0 || Number(form.packageWidthCm) > 500)) {
            notify("Package width must be between 0.1 and 500 cm.", "error");
            return;
          }
          if (form.packageHeightCm !== "" && (Number(form.packageHeightCm) <= 0 || Number(form.packageHeightCm) > 500)) {
            notify("Package height must be between 0.1 and 500 cm.", "error");
            return;
          }
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
        <div className="w-full border-t pt-3">
          <div className="text-xs font-medium text-foreground">Shipping / Package Details</div>
          <p className="label-xs text-muted-foreground">Used for automatic DTDC shipment booking.</p>
          <div className="mt-2 flex flex-wrap gap-3">
            <label className="block">
              <span className="label-xs text-muted-foreground">Shipping Weight (grams)</span>
              <input
                type="number"
                min="0.01"
                step="any"
                value={form.shippingWeightGrams}
                onChange={(e) => setForm((f) => ({ ...f, shippingWeightGrams: e.target.value }))}
                placeholder="e.g. 350"
                className="field mt-1 w-36"
              />
            </label>
            <label className="block">
              <span className="label-xs text-muted-foreground">Package Length (cm)</span>
              <input
                type="number"
                min="0.1"
                step="any"
                value={form.packageLengthCm}
                onChange={(e) => setForm((f) => ({ ...f, packageLengthCm: e.target.value }))}
                placeholder="e.g. 30"
                className="field mt-1 w-32"
              />
            </label>
            <label className="block">
              <span className="label-xs text-muted-foreground">Package Width (cm)</span>
              <input
                type="number"
                min="0.1"
                step="any"
                value={form.packageWidthCm}
                onChange={(e) => setForm((f) => ({ ...f, packageWidthCm: e.target.value }))}
                placeholder="e.g. 20"
                className="field mt-1 w-32"
              />
            </label>
            <label className="block">
              <span className="label-xs text-muted-foreground">Package Height (cm)</span>
              <input
                type="number"
                min="0.1"
                step="any"
                value={form.packageHeightCm}
                onChange={(e) => setForm((f) => ({ ...f, packageHeightCm: e.target.value }))}
                placeholder="e.g. 5"
                className="field mt-1 w-32"
              />
            </label>
          </div>
        </div>
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
                  onClick={() => setAddingSizeFor(addingSizeFor === group.color ? null : group.color)}
                  className="label-xs link-underline"
                >
                  {addingSizeFor === group.color ? "Close" : "Add Size"}
                </button>
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

            {addingSizeFor === group.color && (
              <AddSizeForm
                productId={productId}
                categoryName={categoryName}
                group={group}
                onSaved={() => { setAddingSizeFor(null); onChanged(); }}
                onCancel={() => setAddingSizeFor(null)}
              />
            )}

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
                        {(v.shippingWeightGrams != null || v.packageLengthCm != null) && (
                          <span className="text-muted-foreground">
                            {" · "}
                            {v.shippingWeightGrams != null ? `${v.shippingWeightGrams}g` : ""}
                            {v.packageLengthCm != null && v.packageWidthCm != null && v.packageHeightCm != null
                              ? ` (${v.packageLengthCm}×${v.packageWidthCm}×${v.packageHeightCm} cm)`
                              : ""}
                          </span>
                        )}
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
  const [form, setForm] = useState({
    size: variant.size,
    stock: variant.stock,
    shippingWeightGrams: variant.shippingWeightGrams ?? "",
    packageLengthCm: variant.packageLengthCm ?? "",
    packageWidthCm: variant.packageWidthCm ?? "",
    packageHeightCm: variant.packageHeightCm ?? "",
  });

  const update = useMutation({
    mutationFn: () =>
      adminApi.updateVariant(variant.id, {
        color: variant.color,
        colorHex: variant.colorHex ?? null,
        size: form.size,
        stock: Number(form.stock),
        shippingWeightGrams: form.shippingWeightGrams !== "" ? Number(form.shippingWeightGrams) : null,
        packageLengthCm: form.packageLengthCm !== "" ? Number(form.packageLengthCm) : null,
        packageWidthCm: form.packageWidthCm !== "" ? Number(form.packageWidthCm) : null,
        packageHeightCm: form.packageHeightCm !== "" ? Number(form.packageHeightCm) : null,
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
        if (form.shippingWeightGrams !== "" && (Number(form.shippingWeightGrams) <= 0 || Number(form.shippingWeightGrams) > 100000)) {
          notify("Shipping weight must be between 0.01 and 100,000 grams.", "error");
          return;
        }
        if (form.packageLengthCm !== "" && (Number(form.packageLengthCm) <= 0 || Number(form.packageLengthCm) > 500)) {
          notify("Package length must be between 0.1 and 500 cm.", "error");
          return;
        }
        if (form.packageWidthCm !== "" && (Number(form.packageWidthCm) <= 0 || Number(form.packageWidthCm) > 500)) {
          notify("Package width must be between 0.1 and 500 cm.", "error");
          return;
        }
        if (form.packageHeightCm !== "" && (Number(form.packageHeightCm) <= 0 || Number(form.packageHeightCm) > 500)) {
          notify("Package height must be between 0.1 and 500 cm.", "error");
          return;
        }
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
      <div className="w-full border-t pt-3">
        <div className="text-xs font-medium text-foreground">Shipping / Package Details</div>
        <p className="label-xs text-muted-foreground">Used for automatic DTDC shipment booking.</p>
        <div className="mt-2 flex flex-wrap gap-3">
          <label className="block">
            <span className="label-xs text-muted-foreground">Shipping Weight (grams)</span>
            <input
              type="number"
              min="0.01"
              step="any"
              value={form.shippingWeightGrams}
              onChange={(e) => setForm((f) => ({ ...f, shippingWeightGrams: e.target.value }))}
              placeholder="e.g. 350"
              className="field mt-1 w-36"
            />
          </label>
          <label className="block">
            <span className="label-xs text-muted-foreground">Package Length (cm)</span>
            <input
              type="number"
              min="0.1"
              step="any"
              value={form.packageLengthCm}
              onChange={(e) => setForm((f) => ({ ...f, packageLengthCm: e.target.value }))}
              placeholder="e.g. 30"
              className="field mt-1 w-32"
            />
          </label>
          <label className="block">
            <span className="label-xs text-muted-foreground">Package Width (cm)</span>
            <input
              type="number"
              min="0.1"
              step="any"
              value={form.packageWidthCm}
              onChange={(e) => setForm((f) => ({ ...f, packageWidthCm: e.target.value }))}
              placeholder="e.g. 20"
              className="field mt-1 w-32"
            />
          </label>
          <label className="block">
            <span className="label-xs text-muted-foreground">Package Height (cm)</span>
            <input
              type="number"
              min="0.1"
              step="any"
              value={form.packageHeightCm}
              onChange={(e) => setForm((f) => ({ ...f, packageHeightCm: e.target.value }))}
              placeholder="e.g. 5"
              className="field mt-1 w-32"
            />
          </label>
        </div>
      </div>
      <button disabled={update.isPending} className="btn-solid">
        {update.isPending ? "Saving..." : "Save"}
      </button>
      <button type="button" onClick={onCancel} className="label-xs text-muted-foreground">
        Cancel
      </button>
    </form>
  );
}

// Adds one new size to an EXISTING color group without retyping the color
// -- color/colorHex come straight from the group the admin already has
// open, not a free-text field, so there is no way this accidentally
// creates a second, mismatched color group for what was meant to be the
// same color (the risk ColorGroupEditForm's duplicate-color check exists
// to catch). Already-used sizes for this color are filtered out of the
// dropdown so the same size can't be added twice by mistake.
function AddSizeForm({ productId, categoryName, group, onSaved, onCancel }) {
  const { notify } = useToast();
  const allSizes = sizesForCategory(categoryName);
  const usedSizes = new Set(group.variants.map((v) => v.size));
  const availableSizes = allSizes.filter((s) => !usedSizes.has(s.value));
  const [size, setSize] = useState(availableSizes[0]?.value ?? "");
  const [stock, setStock] = useState(0);
  const [shippingWeightGrams, setShippingWeightGrams] = useState("");
  const [packageLengthCm, setPackageLengthCm] = useState("");
  const [packageWidthCm, setPackageWidthCm] = useState("");
  const [packageHeightCm, setPackageHeightCm] = useState("");

  // Same defensive resync as the top-level Add form above, in case
  // categoryName resolves after this form's first render.
  useEffect(() => {
    if (availableSizes.length && !availableSizes.some((s) => s.value === size)) {
      setSize(availableSizes[0].value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryName]);

  const addSize = useMutation({
    mutationFn: () =>
      adminApi.createVariant(productId, {
        color: group.color,
        colorHex: group.colorHex || null,
        size,
        stock: Number(stock),
        shippingWeightGrams: shippingWeightGrams !== "" ? Number(shippingWeightGrams) : null,
        packageLengthCm: packageLengthCm !== "" ? Number(packageLengthCm) : null,
        packageWidthCm: packageWidthCm !== "" ? Number(packageWidthCm) : null,
        packageHeightCm: packageHeightCm !== "" ? Number(packageHeightCm) : null,
      }),
    onSuccess: () => {
      notify(`${getSizeLabel(size)} added to ${group.color}`, "success");
      onSaved();
    },
    onError: (err) => notify(err.message, "error"),
  });

  if (availableSizes.length === 0) {
    return (
      <div className="hairline-card flex flex-wrap items-center justify-between gap-4 p-5 text-xs text-muted-foreground">
        Every available size is already added for {group.color}.
        <button type="button" onClick={onCancel} className="label-xs link-underline">
          Close
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (shippingWeightGrams !== "" && (Number(shippingWeightGrams) <= 0 || Number(shippingWeightGrams) > 100000)) {
          notify("Shipping weight must be between 0.01 and 100,000 grams.", "error");
          return;
        }
        if (packageLengthCm !== "" && (Number(packageLengthCm) <= 0 || Number(packageLengthCm) > 500)) {
          notify("Package length must be between 0.1 and 500 cm.", "error");
          return;
        }
        if (packageWidthCm !== "" && (Number(packageWidthCm) <= 0 || Number(packageWidthCm) > 500)) {
          notify("Package width must be between 0.1 and 500 cm.", "error");
          return;
        }
        if (packageHeightCm !== "" && (Number(packageHeightCm) <= 0 || Number(packageHeightCm) > 500)) {
          notify("Package height must be between 0.1 and 500 cm.", "error");
          return;
        }
        addSize.mutate();
      }}
      className="hairline-card flex flex-wrap items-end gap-4 p-5"
    >
      <div className="w-full text-xs text-muted-foreground">
        Adding a new size to <span className="font-semibold text-foreground">{group.color}</span> -- color and photos stay exactly as they are.
      </div>
      <label className="block">
        <span className="label-xs text-muted-foreground">Size</span>
        <select value={size} onChange={(e) => setSize(e.target.value)} className="field mt-2">
          {availableSizes.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="label-xs text-muted-foreground">Stock</span>
        <input type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} className="field mt-2 w-24" />
      </label>
      <div className="w-full border-t pt-3">
        <div className="text-xs font-medium text-foreground">Shipping / Package Details</div>
        <p className="label-xs text-muted-foreground">Used for automatic DTDC shipment booking.</p>
        <div className="mt-2 flex flex-wrap gap-3">
          <label className="block">
            <span className="label-xs text-muted-foreground">Shipping Weight (grams)</span>
            <input
              type="number"
              min="0.01"
              step="any"
              value={shippingWeightGrams}
              onChange={(e) => setShippingWeightGrams(e.target.value)}
              placeholder="e.g. 350"
              className="field mt-1 w-36"
            />
          </label>
          <label className="block">
            <span className="label-xs text-muted-foreground">Package Length (cm)</span>
            <input
              type="number"
              min="0.1"
              step="any"
              value={packageLengthCm}
              onChange={(e) => setPackageLengthCm(e.target.value)}
              placeholder="e.g. 30"
              className="field mt-1 w-32"
            />
          </label>
          <label className="block">
            <span className="label-xs text-muted-foreground">Package Width (cm)</span>
            <input
              type="number"
              min="0.1"
              step="any"
              value={packageWidthCm}
              onChange={(e) => setPackageWidthCm(e.target.value)}
              placeholder="e.g. 20"
              className="field mt-1 w-32"
            />
          </label>
          <label className="block">
            <span className="label-xs text-muted-foreground">Package Height (cm)</span>
            <input
              type="number"
              min="0.1"
              step="any"
              value={packageHeightCm}
              onChange={(e) => setPackageHeightCm(e.target.value)}
              placeholder="e.g. 5"
              className="field mt-1 w-32"
            />
          </label>
        </div>
      </div>
      <button disabled={addSize.isPending} className="btn-solid">
        {addSize.isPending ? "Adding..." : "Add size"}
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
  // Seeded from the group's own PERSISTED values -- never a generic/default shade. This is the
  // fix for "Edit Color doesn't show the actual saved shade": the old code always started
  // newColorHex at "", which silently threw away group.colorHex and showed a name-derived
  // (or previously-typed) shade instead of what's actually in the database.
  const [newColor, setNewColor] = useState(group.color);
  const [newColorHex, setNewColorHex] = useState(group.colorHex || "");

  // Auto-detects a recognized standard color name (NAVY, DARK BLUE, ...) as the admin retypes
  // the color field, and switches the shade to that color's predefined hex -- e.g. typing NAVY
  // while a custom "yellow" shade is currently selected replaces it with NAVY's predefined
  // shade, per spec. Fires ONLY on an actual change to the name (the ref starts at the
  // group's own color, so this never fires on mount and never clobbers the persisted shade
  // this form just loaded above). An unrecognized/custom name (resolveKnownColorHex returns
  // null) never touches the current shade, so a deliberately-picked custom shade for a custom
  // name is always preserved -- see utils/swatchColor.js.
  const previousColorRef = useRef(group.color);
  useEffect(() => {
    if (newColor === previousColorRef.current) return;
    previousColorRef.current = newColor;
    const known = resolveKnownColorHex(newColor);
    if (known) setNewColorHex(known);
  }, [newColor]);

  const isUnchanged =
    newColor.trim().toUpperCase() === group.color.trim().toUpperCase() &&
    (newColorHex || "").toUpperCase() === (group.colorHex || "").toUpperCase();

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
        // Nothing actually changed -- don't hit the API just to have it report back that
        // nothing changed, and never show a misleading "Updated N sizes" message for a save
        // that changed zero sizes.
        if (isUnchanged) {
          notify("No changes detected.", "default");
          return;
        }
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
      <button disabled={rename.isPending || !newColor.trim() || isUnchanged} className="btn-solid">
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
