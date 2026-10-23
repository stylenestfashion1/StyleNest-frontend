import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Images, Palette, Upload, Loader2, Camera, Sparkles } from "lucide-react";
import { findClosestColorName } from "../../utils/swatchColor";
import * as adminApi from "../../api/admin";
import { useToast } from "../../context/ToastContext";
import LoadingState from "../../components/LoadingState";
import BackButton from "../../components/BackButton";
import SingleImageUpload from "../../components/admin/SingleImageUpload";

const PRESET_COLORS = [
  { name: "Black", hex: "#111827" },
  { name: "Olive Green", hex: "#556b2f" },
  { name: "Navy Blue", hex: "#1e3a8a" },
  { name: "Maroon", hex: "#800000" },
  { name: "Beige", hex: "#f5f5dc" },
  { name: "White", hex: "#ffffff" },
  { name: "Charcoal Grey", hex: "#4b5563" },
  { name: "Rust / Brown", hex: "#78350f" },
  { name: "Bottle Green", hex: "#064e3b" },
  { name: "Mustard Yellow", hex: "#ca8a04" },
];

const EMPTY = {
  name: "",
  description: "",
  imageUrl: "",
  imageUrls: [],
  colors: [],
  price: "500", // User requested: wholesale unit price default 500
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
  const [colorUrlInputs, setColorUrlInputs] = useState({});
  const [uploadingColorIdx, setUploadingColorIdx] = useState(null);

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
        colors: Array.isArray(p.colors)
          ? p.colors.map((c) => ({
              name: c.name || "",
              hex: c.hex || "#111827",
              images: Array.isArray(c.images) ? c.images : [],
            }))
          : [],
        price: p.price ?? "500",
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
      const sanitizedColors = (form.colors || [])
        .map((c) => ({
          name: (c.name || "").trim(),
          hex: (c.hex || "#111827").trim(),
          images: (c.images || []).filter(Boolean),
        }))
        .filter((c) => c.name.length > 0);

      let primaryImg = form.imageUrl;
      if (!primaryImg && sanitizedColors.length > 0 && sanitizedColors[0].images.length > 0) {
        primaryImg = sanitizedColors[0].images[0];
      }
      if (primaryImg && !finalImageUrls.includes(primaryImg)) {
        finalImageUrls.unshift(primaryImg);
      }

      const payload = {
        ...form,
        imageUrl: primaryImg || finalImageUrls[0] || "",
        imageUrls: finalImageUrls,
        colors: sanitizedColors,
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

  // Color management
  function addColorway() {
    setForm((f) => ({
      ...f,
      colors: [...(f.colors || []), { name: "", hex: "#111827", images: [] }],
    }));
  }

  function updateColorway(index, field, value) {
    setForm((f) => {
      const updated = [...(f.colors || [])];
      updated[index] = { ...updated[index], [field]: value };
      return { ...f, colors: updated };
    });
  }

  function removeColorway(index) {
    setForm((f) => {
      const updated = [...(f.colors || [])];
      updated.splice(index, 1);
      return { ...f, colors: updated };
    });
  }

  async function handleColorFileUpload(colorIndex, file) {
    if (!file) return;
    setUploadingColorIdx(colorIndex);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await adminApi.uploadAdminImage(formData);
      if (res?.url) {
        setForm((f) => {
          const updated = [...(f.colors || [])];
          const currentImages = updated[colorIndex]?.images || [];
          updated[colorIndex] = {
            ...updated[colorIndex],
            images: [...currentImages, res.url],
          };
          return { ...f, colors: updated };
        });
        notify("Photo uploaded for colorway", "success");
      }
    } catch (err) {
      notify(err.message || "Failed to upload image", "error");
    } finally {
      setUploadingColorIdx(null);
    }
  }

  function addColorImageUrl(colorIndex) {
    const url = (colorUrlInputs[colorIndex] || "").trim();
    if (!url) return;
    setForm((f) => {
      const updated = [...(f.colors || [])];
      const currentImages = updated[colorIndex]?.images || [];
      if (currentImages.includes(url)) return f;
      updated[colorIndex] = {
        ...updated[colorIndex],
        images: [...currentImages, url],
      };
      return { ...f, colors: updated };
    });
    setColorUrlInputs((prev) => ({ ...prev, [colorIndex]: "" }));
  }

  function removeColorImage(colorIndex, imageIndex) {
    setForm((f) => {
      const updated = [...(f.colors || [])];
      const currentImages = [...(updated[colorIndex]?.images || [])];
      currentImages.splice(imageIndex, 1);
      updated[colorIndex] = { ...updated[colorIndex], images: currentImages };
      return { ...f, colors: updated };
    });
  }

  if (!isNew && productQuery.isLoading) return <LoadingState label="Loading product" />;

  return (
    <div className="max-w-5xl">
      <BackButton fallback="/admin/bulk/products" className="mb-3" />
      <h2 className="text-xl font-bold">{isNew ? "New Bulk Product" : "Edit Bulk Product"}</h2>
      <p className="label-xs mt-2 text-muted-foreground">
        Products created here appear only in the wholesale portal. Each product can have multiple colorways with its own isolated photos so images never mix up.
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

        {/* COLORWAYS SECTION (STRICT COLOR-WISE PHOTO ISOLATION) */}
        <div className="sm:col-span-2 rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm p-6 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border/40">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
                  <Palette className="h-4 w-4" />
                </span>
                <h3 className="text-sm font-bold tracking-tight text-foreground uppercase">
                  Colorways &amp; Isolated Photos
                </h3>
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                  Strict Isolation · No Mix-Ups
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5 max-w-xl">
                Each colorway has its own isolated photo gallery. When wholesale buyers switch colors, only photos belonging strictly to that color appear.
              </p>
            </div>
            <button
              type="button"
              onClick={addColorway}
              className="btn-solid text-xs px-4 py-2.5 rounded-xl shadow-sm hover:shadow flex items-center gap-2 font-semibold transition-all duration-200 active:scale-95 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Add Colorway
            </button>
          </div>

          {/* Colorways List */}
          {form.colors && form.colors.length > 0 ? (
            <div className="space-y-5">
              {form.colors.map((col, cIdx) => (
                <div
                  key={cIdx}
                  className="group rounded-2xl border border-border/70 bg-background/80 hover:border-border transition-all duration-300 p-5 shadow-xs space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border/50">
                    <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
                      {/* Circular Color Swatch + Native Color Picker */}
                      <div className="relative group/picker shrink-0">
                        <input
                          type="color"
                          value={col.hex || "#111827"}
                          onChange={(e) => {
                            updateColorway(cIdx, "hex", e.target.value);
                            const detected = findClosestColorName(e.target.value);
                            if (detected && (!col.name || col.name.startsWith("Color #"))) {
                              updateColorway(cIdx, "name", detected);
                            }
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer h-full w-full z-10"
                          title="Click to pick exact shade"
                        />
                        <div
                          className="h-10 w-10 rounded-xl border border-white/20 shadow-sm flex items-center justify-center transition-transform group-hover/picker:scale-105 cursor-pointer ring-2 ring-black/10"
                          style={{ backgroundColor: col.hex || "#111827" }}
                        >
                          <span className="h-2.5 w-2.5 rounded-full bg-white/40 ring-1 ring-black/20" />
                        </div>
                      </div>

                      {/* Hex Code Input with # Prefix */}
                      <div className="relative flex items-center">
                        <span className="absolute left-2.5 text-xs font-mono text-muted-foreground select-none font-bold">#</span>
                        <input
                          type="text"
                          value={(col.hex || "").replace("#", "")}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/[^0-9A-Fa-f]/g, "").slice(0, 6);
                            const fullHex = raw ? `#${raw}` : "";
                            updateColorway(cIdx, "hex", fullHex);
                            if (raw.length === 6) {
                              const detected = findClosestColorName(fullHex);
                              if (detected && (!col.name || col.name.startsWith("Color #"))) {
                                updateColorway(cIdx, "name", detected);
                              }
                            }
                          }}
                          className="field text-xs font-mono w-24 py-2 pl-6 pr-2 bg-muted/20 border border-input rounded-xl focus:ring-1 focus:ring-primary uppercase shadow-2xs font-semibold"
                          placeholder="2563EB"
                        />
                      </div>

                      {/* Colorway Name */}
                      <div className="flex-1 min-w-[180px]">
                        <input
                          type="text"
                          placeholder="Color Name (e.g. Navy Blue, Dusty Rose)"
                          value={col.name}
                          onChange={(e) => updateColorway(cIdx, "name", e.target.value)}
                          className="field text-xs font-bold w-full py-2 px-3 bg-muted/20 border border-input rounded-xl focus:ring-1 focus:ring-primary shadow-2xs"
                          required
                        />
                      </div>

                      {/* Detected Shade Badge */}
                      {col.hex && (
                        <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-lg border border-border/60 bg-muted/30 text-foreground select-none">
                          <span
                            className="h-2 w-2 rounded-full border border-black/20 shrink-0"
                            style={{ backgroundColor: col.hex }}
                          />
                          <span className="text-[10px] text-muted-foreground">Shade:</span>
                          <span className="font-semibold text-primary">{findClosestColorName(col.hex) || "Custom"}</span>
                        </span>
                      )}
                    </div>

                    {/* Delete Colorway */}
                    <button
                      type="button"
                      onClick={() => removeColorway(cIdx)}
                      className="text-xs text-destructive hover:bg-destructive/15 border border-destructive/20 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all active:scale-95 font-medium shrink-0 cursor-pointer"
                      title="Remove this color"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove Color
                    </button>
                  </div>

                  {/* Preset Swatches Quick Selector */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mr-1">
                      Fast Presets:
                    </span>
                    {PRESET_COLORS.map((preset, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          updateColorway(cIdx, "name", preset.name);
                          updateColorway(cIdx, "hex", preset.hex);
                        }}
                        className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border border-border/60 bg-muted/30 hover:bg-muted text-foreground transition-all duration-150 hover:scale-105 active:scale-95 shadow-2xs cursor-pointer"
                      >
                        <span
                          className="h-2 w-2 rounded-full border border-black/20 shrink-0"
                          style={{ backgroundColor: preset.hex }}
                        />
                        {preset.name}
                      </button>
                    ))}
                  </div>

                  {/* Photos for this specific color */}
                  <div className="mt-4 pt-4 border-t border-border/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Camera className="h-3.5 w-3.5 text-primary" />
                        Photos for {col.name || `Color #${cIdx + 1}`}
                        <span className="text-[10px] font-mono text-muted-foreground bg-muted/40 border border-border/50 px-2 py-0.5 rounded-full ml-1">
                          {col.images?.length || 0} photo{col.images?.length === 1 ? "" : "s"}
                        </span>
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        Shown only when this color is picked
                      </span>
                    </div>

                    {/* Thumbnails of this color */}
                    {col.images && col.images.length > 0 && (
                      <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-8 gap-3">
                        {col.images.map((imgUrl, imgIdx) => (
                          <div
                            key={imgIdx}
                            className="relative aspect-[3/4] rounded-xl overflow-hidden border border-border/70 bg-muted/20 group/photo shadow-2xs transition-all hover:scale-[1.03] hover:shadow-sm"
                          >
                            <img src={imgUrl} alt="" className="h-full w-full object-cover object-top" />
                            <span className="absolute bottom-1.5 left-1.5 bg-black/75 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                              #{imgIdx + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeColorImage(cIdx, imgIdx)}
                              className="absolute top-1.5 right-1.5 h-6 w-6 bg-destructive/90 hover:bg-destructive text-white rounded-full flex items-center justify-center opacity-0 group-hover/photo:opacity-100 transition-opacity shadow-sm cursor-pointer"
                              title="Delete photo"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Upload File or Add URL for this color */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <label className="btn-outline text-xs px-3.5 py-2 rounded-xl flex items-center gap-2 cursor-pointer hover:bg-muted font-medium shadow-2xs transition-all active:scale-95">
                        {uploadingColorIdx === cIdx ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                        ) : (
                          <Upload className="h-3.5 w-3.5 text-primary" />
                        )}
                        Upload Device Photo
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploadingColorIdx === cIdx}
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleColorFileUpload(cIdx, e.target.files[0]);
                              e.target.value = "";
                            }
                          }}
                        />
                      </label>

                      <div className="flex items-center gap-1.5 flex-1 min-w-[240px]">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            placeholder="Or paste photo URL for this color"
                            value={colorUrlInputs[cIdx] || ""}
                            onChange={(e) =>
                              setColorUrlInputs((prev) => ({ ...prev, [cIdx]: e.target.value }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addColorImageUrl(cIdx);
                              }
                            }}
                            className="field text-xs py-2 px-3 bg-muted/20 border border-input rounded-xl w-full shadow-2xs"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => addColorImageUrl(cIdx)}
                          className="btn-outline text-xs px-3.5 py-2 rounded-xl font-medium shadow-2xs hover:bg-muted transition-all active:scale-95 cursor-pointer"
                        >
                          Add URL
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border/80 bg-background/50 p-8 text-center mt-3 space-y-2">
              <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
                <Palette className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-foreground">No colorways created yet</p>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Click <strong>&quot;Add Colorway&quot;</strong> above to create colors with isolated photo galleries (e.g. Olive Green, Jet Black).
              </p>
            </div>
          )}
        </div>

        {/* Primary Product Image Upload (Fallback if no colors or for thumbnail) */}
        <SingleImageUpload
          label="Catalog Thumbnail Image (Optional fallback)"
          value={form.imageUrl}
          onChange={(v) => {
            setForm((f) => {
              const list = f.imageUrls?.length > 0 ? [...f.imageUrls] : [];
              if (v && !list.includes(v)) list.unshift(v);
              return { ...f, imageUrl: v, imageUrls: list };
            });
          }}
          aspect={4 / 5}
          guidance="If left empty and colorways exist above, the first color's front photo will automatically be used."
        />

        {/* General Additional Angle Photos Section */}
        <div className="sm:col-span-2 rounded-xl border border-border/80 bg-muted/20 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <Images className="h-4 w-4" />
              General Gallery Photos (Used only if no colorways are added above)
            </span>
            <span className="text-xs text-muted-foreground">
              {form.imageUrls?.length || 0} Total Photo{form.imageUrls?.length === 1 ? "" : "s"}
            </span>
          </div>

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
              placeholder="Paste additional angle image URL"
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
          label="Wholesale Price per piece (₹) - Default ₹500"
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
