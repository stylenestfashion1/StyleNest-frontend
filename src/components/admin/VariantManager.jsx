import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import * as adminApi from "../../api/admin";
import { useToast } from "../../context/ToastContext";
import { Package, Sparkles } from "lucide-react";
import { getSwatchColor, resolveKnownColorHex, findClosestColorName } from "../../utils/swatchColor";
import { getSizeLabel, sizesForCategory } from "../../utils/sizeLabel";
import { defaultShippingForCategory } from "../../utils/categoryShipping";
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
  const [form, setForm] = useState(() => {
    const defaults = defaultShippingForCategory(categoryName);
    return {
      color: "",
      colorHex: "",
      size: sizes[0]?.value ?? "XS",
      stock: 0,
      shippingWeightGrams: defaults.shippingWeightGrams,
      packageLengthCm: defaults.packageLengthCm,
      packageWidthCm: defaults.packageWidthCm,
      packageHeightCm: defaults.packageHeightCm,
    };
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
    const defaults = defaultShippingForCategory(categoryName);
    setForm((f) => ({
      ...f,
      size: sizes.some((s) => s.value === f.size) ? f.size : (sizes[0]?.value ?? f.size),
      shippingWeightGrams: defaults.shippingWeightGrams,
      packageLengthCm: defaults.packageLengthCm,
      packageWidthCm: defaults.packageWidthCm,
      packageHeightCm: defaults.packageHeightCm,
    }));
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
      const defaults = defaultShippingForCategory(categoryName);
      setForm((f) => ({
        ...f,
        stock: 0,
        shippingWeightGrams: defaults.shippingWeightGrams,
        packageLengthCm: defaults.packageLengthCm,
        packageWidthCm: defaults.packageWidthCm,
        packageHeightCm: defaults.packageHeightCm,
      }));
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
          onAutoFillName={(name) => {
            if (!form.color || form.color.trim() === "") {
              setForm((f) => ({ ...f, color: name }));
            }
          }}
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
        <ShippingPackageFields
          values={form}
          onChange={(field, val) => setForm((f) => ({ ...f, [field]: val }))}
        />
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
      <ShippingPackageFields
        values={form}
        onChange={(field, val) => setForm((f) => ({ ...f, [field]: val }))}
      />
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
  const sibling = group.variants.find((v) => v.shippingWeightGrams != null);
  const defaults = sibling
    ? {
        shippingWeightGrams: sibling.shippingWeightGrams,
        packageLengthCm: sibling.packageLengthCm,
        packageWidthCm: sibling.packageWidthCm,
        packageHeightCm: sibling.packageHeightCm,
      }
    : defaultShippingForCategory(categoryName);
  const [size, setSize] = useState(availableSizes[0]?.value ?? "");
  const [stock, setStock] = useState(0);
  const [shippingWeightGrams, setShippingWeightGrams] = useState(defaults.shippingWeightGrams ?? "");
  const [packageLengthCm, setPackageLengthCm] = useState(defaults.packageLengthCm ?? "");
  const [packageWidthCm, setPackageWidthCm] = useState(defaults.packageWidthCm ?? "");
  const [packageHeightCm, setPackageHeightCm] = useState(defaults.packageHeightCm ?? "");

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
      <ShippingPackageFields
        values={{ shippingWeightGrams, packageLengthCm, packageWidthCm, packageHeightCm }}
        onChange={(field, val) => {
          if (field === 'shippingWeightGrams') setShippingWeightGrams(val);
          if (field === 'packageLengthCm') setPackageLengthCm(val);
          if (field === 'packageWidthCm') setPackageWidthCm(val);
          if (field === 'packageHeightCm') setPackageHeightCm(val);
        }}
      />
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
      <ColorHexPicker
        color={newColor}
        colorHex={newColorHex}
        onChange={setNewColorHex}
        onAutoFillName={(name) => {
          if (!newColor || newColor.trim() === "") {
            setNewColor(name);
          }
        }}
      />
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


function ShippingPackageFields({ values, onChange }) {
  return (
    <div className="w-full mt-3 rounded-xl border border-border/60 bg-muted/20 p-4 space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <Package className="h-3.5 w-3.5 text-primary" />
          Shipping / Package Details
        </div>
        <span className="text-[10px] text-muted-foreground bg-background/80 border border-border/50 px-2 py-0.5 rounded font-mono">
          DTDC Shipment Ready
        </span>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Used for automatic DTDC shipment booking & courier volumetric rate.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
        <div>
          <label className="text-[11px] font-medium text-muted-foreground flex items-center justify-between mb-1">
            <span>Shipping Weight</span>
            <span className="text-[10px] text-muted-foreground font-mono">(grams)</span>
          </label>
          <input
            type="number"
            min="0.01"
            step="any"
            value={values.shippingWeightGrams ?? ""}
            onChange={(e) => onChange("shippingWeightGrams", e.target.value)}
            placeholder="e.g. 300"
            className="w-full field text-xs bg-background border rounded-lg px-2.5 py-2 font-mono shadow-2xs"
          />
        </div>

        <div>
          <label className="text-[11px] font-medium text-muted-foreground flex items-center justify-between mb-1">
            <span>Package Length</span>
            <span className="text-[10px] text-muted-foreground font-mono">(cm)</span>
          </label>
          <input
            type="number"
            min="0.1"
            step="any"
            value={values.packageLengthCm ?? ""}
            onChange={(e) => onChange("packageLengthCm", e.target.value)}
            placeholder="e.g. 30"
            className="w-full field text-xs bg-background border rounded-lg px-2.5 py-2 font-mono shadow-2xs"
          />
        </div>

        <div>
          <label className="text-[11px] font-medium text-muted-foreground flex items-center justify-between mb-1">
            <span>Package Width</span>
            <span className="text-[10px] text-muted-foreground font-mono">(cm)</span>
          </label>
          <input
            type="number"
            min="0.1"
            step="any"
            value={values.packageWidthCm ?? ""}
            onChange={(e) => onChange("packageWidthCm", e.target.value)}
            placeholder="e.g. 20"
            className="w-full field text-xs bg-background border rounded-lg px-2.5 py-2 font-mono shadow-2xs"
          />
        </div>

        <div>
          <label className="text-[11px] font-medium text-muted-foreground flex items-center justify-between mb-1">
            <span>Package Height</span>
            <span className="text-[10px] text-muted-foreground font-mono">(cm)</span>
          </label>
          <input
            type="number"
            min="0.1"
            step="any"
            value={values.packageHeightCm ?? ""}
            onChange={(e) => onChange("packageHeightCm", e.target.value)}
            placeholder="e.g. 3"
            className="w-full field text-xs bg-background border rounded-lg px-2.5 py-2 font-mono shadow-2xs"
          />
        </div>
      </div>
    </div>
  );
}


// Lets the admin sample or enter the *exact* shade of the actual garment (with #hex code or color picker)
// and automatically detects the recognized shade name for optimal storefront swatches.
function ColorHexPicker({ color, colorHex, onChange, onAutoFillName }) {
  const effectiveHex = colorHex || (color ? resolveKnownColorHex(color) : "") || "";
  const [typedHex, setTypedHex] = useState(colorHex || "");

  useEffect(() => {
    setTypedHex(colorHex || "");
  }, [colorHex]);

  const detectedShade = effectiveHex ? findClosestColorName(effectiveHex) : null;

  const handleTextChange = (val) => {
    let clean = val.trim();
    if (clean && !clean.startsWith("#")) clean = "#" + clean;
    setTypedHex(clean);
    if (/^#[0-9A-Fa-f]{6}$/.test(clean)) {
      onChange(clean);
      const shade = findClosestColorName(clean);
      if (shade && onAutoFillName) {
        onAutoFillName(shade);
      }
    } else if (clean === "") {
      onChange("");
    }
  };

  const handlePickerChange = (hex) => {
    setTypedHex(hex);
    onChange(hex);
    const shade = findClosestColorName(hex);
    if (shade && onAutoFillName) {
      onAutoFillName(shade);
    }
  };

  return (
    <div className="block min-w-[240px]">
      <div className="flex items-center justify-between mb-1.5">
        <span className="label-xs text-muted-foreground font-semibold">Exact Shade (Optional)</span>
        {colorHex && (
          <button
            type="button"
            onClick={() => {
              setTypedHex("");
              onChange("");
            }}
            className="text-[10px] text-muted-foreground hover:text-foreground underline transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Color picker square with preview */}
        <div className="relative group shrink-0">
          <input
            type="color"
            value={effectiveHex && effectiveHex.length === 7 ? effectiveHex : "#808080"}
            onChange={(e) => handlePickerChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer h-full w-full z-10"
            title="Click to pick exact shade"
          />
          <div
            className="h-9 w-9 rounded-lg border border-border/80 shadow-xs flex items-center justify-center transition-transform group-hover:scale-105 cursor-pointer"
            style={{ backgroundColor: effectiveHex || getSwatchColor(color) }}
          >
            <span className="h-2 w-2 rounded-full bg-white/40 ring-1 ring-black/20" />
          </div>
        </div>

        {/* Text Input for #HEX */}
        <div className="relative flex items-center">
          <input
            type="text"
            value={typedHex}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="#2563EB"
            maxLength={7}
            className="field text-xs font-mono w-24 py-1.5 px-2 bg-background border rounded-lg focus:ring-1 focus:ring-primary shadow-2xs uppercase"
          />
        </div>

        {/* Detected Shade Badge */}
        {detectedShade && (
          <button
            type="button"
            onClick={() => onAutoFillName && onAutoFillName(detectedShade)}
            title="Click to use this detected color name"
            className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-lg border border-border/60 bg-muted/40 hover:bg-muted text-foreground transition-colors cursor-pointer"
          >
            <span
              className="h-2 w-2 rounded-full border border-black/20 shrink-0"
              style={{ backgroundColor: effectiveHex || "#000" }}
            />
            <span className="text-muted-foreground text-[10px]">Shade:</span>
            <span className="font-semibold text-primary">{detectedShade}</span>
          </button>
        )}
      </div>
    </div>
  );
}

