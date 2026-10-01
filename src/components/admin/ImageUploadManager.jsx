import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, Crop, Pencil, RefreshCw, Trash2, UploadCloud } from "lucide-react";
import * as adminApi from "../../api/admin";
import CropModal from "./CropModal";
import { useToast } from "../../context/ToastContext";

let stagingId = 0;

/**
 * Multiple images can be selected at once, each gets its own preview and
 * can be individually cropped/removed before upload, and the batch can be
 * reordered — the first image becomes the primary image. Already-saved
 * images are reordered via a single onReorderImages call (a real backend
 * endpoint that persists the new order atomically), not by deleting and
 * re-adding them.
 */
export default function ImageUploadManager({ images, onAddImage, onDeleteImage, onReorderImages, onChanged, aspect = 3 / 4, guidance }) {
  const { notify } = useToast();
  const [staged, setStaged] = useState([]);
  const [cropping, setCropping] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(null);
  const [reordering, setReordering] = useState(false);
  const inputRef = useRef(null);
  const replaceInputRef = useRef(null);
  const [replaceTarget, setReplaceTarget] = useState(null);
  const [replaceStaged, setReplaceStaged] = useState(null);
  const [replacing, setReplacing] = useState(false);

  // Editing an EXISTING already-uploaded image, as opposed to Replace
  // (which requires picking a brand new file from disk). editSrc holds an
  // object URL created from the actual stored image's own bytes (fetched
  // once, up front) so CropModal opens on the real current image -- never
  // a stand-in or a fresh file picker.
  const [editTarget, setEditTarget] = useState(null);
  const [editSrc, setEditSrc] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editSaving, setEditSaving] = useState(false);

  async function startEdit(image) {
    setEditLoading(true);
    try {
      const res = await fetch(image.imageUrl, { mode: "cors" });
      if (!res.ok) throw new Error("Could not load the image to edit");
      const blob = await res.blob();
      setEditTarget(image);
      setEditSrc(URL.createObjectURL(blob));
    } catch (err) {
      notify(err.message || "Could not load the image to edit", "error");
    } finally {
      setEditLoading(false);
    }
  }

  function cancelEdit() {
    if (editSrc) URL.revokeObjectURL(editSrc);
    setEditSrc(null);
    setEditTarget(null);
  }

  // Same delete-old-then-add-new sequence as confirmReplace below (the
  // only way to change a saved image's pixels in the current backend --
  // there is no update-in-place endpoint). Reusing that exact, already
  // in-production pattern here -- rather than inventing a second one --
  // is what keeps this safe: same displayOrder preserved, same color
  // scope (onAddImage/onDeleteImage are already bound to this one color
  // group by the caller), no new duplicate-record or cross-color risk.
  async function confirmEdit(croppedFile) {
    setEditSaving(true);
    try {
      const formData = new FormData();
      formData.append("file", croppedFile);
      const uploaded = await adminApi.uploadAdminImage(formData);
      await onDeleteImage(editTarget.id);
      await onAddImage({ imageUrl: uploaded.url, displayOrder: editTarget.displayOrder });
      await onChanged?.();
      notify("Image updated", "success");
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setEditSaving(false);
      cancelEdit();
    }
  }

  function startReplace(image) {
    setReplaceTarget(image);
    replaceInputRef.current?.click();
  }

  function handleReplaceSelect(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) {
      setReplaceTarget(null);
      return;
    }
    setReplaceStaged({ file, previewUrl: URL.createObjectURL(file) });
  }

  function cancelReplace() {
    if (replaceStaged) URL.revokeObjectURL(replaceStaged.previewUrl);
    setReplaceStaged(null);
    setReplaceTarget(null);
  }

  async function confirmReplace(croppedFile) {
    setReplacing(true);
    try {
      const formData = new FormData();
      formData.append("file", croppedFile);
      const uploaded = await adminApi.uploadAdminImage(formData);
      await onDeleteImage(replaceTarget.id);
      await onAddImage({ imageUrl: uploaded.url, displayOrder: replaceTarget.displayOrder });
      await onChanged?.();
      notify("Image replaced", "success");
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setReplacing(false);
      cancelReplace();
    }
  }

  function handleSelect(e) {
    const files = Array.from(e.target.files ?? []);
    const next = files.map((file) => ({ id: ++stagingId, file, previewUrl: URL.createObjectURL(file) }));
    setStaged((prev) => [...prev, ...next]);
    e.target.value = "";
  }

  function removeStaged(id) {
    setStaged((prev) => prev.filter((s) => s.id !== id));
  }

  function moveStaged(id, dir) {
    setStaged((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      const swap = idx + dir;
      if (swap < 0 || swap >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
  }

  function applyCrop(croppedFile) {
    setStaged((prev) =>
      prev.map((s) => (s.id === cropping.id ? { ...s, file: croppedFile, previewUrl: URL.createObjectURL(croppedFile) } : s))
    );
    setCropping(null);
  }

  async function handleUpload() {
    if (staged.length === 0 || uploading) return;
    setUploading(true);
    let nextOrder = (images?.length ?? 0) + 1;
    try {
      for (let i = 0; i < staged.length; i++) {
        setProgress(`Uploading ${i + 1} of ${staged.length}...`);
        const formData = new FormData();
        formData.append("file", staged[i].file);
        const uploaded = await adminApi.uploadAdminImage(formData);
        // Adds this image without refetching the whole product -- doing
        // that per image in the loop below turned an N-image batch into N
        // full product+variant refetches. One refetch after the batch
        // (onChanged, below) is enough.
        await onAddImage({ imageUrl: uploaded.url, displayOrder: nextOrder });
        nextOrder += 1;
      }
      staged.forEach((s) => URL.revokeObjectURL(s.previewUrl));
      setStaged([]);
      await onChanged?.();
      notify(`${staged.length} image${staged.length > 1 ? "s" : ""} uploaded`, "success");
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setUploading(false);
      setProgress(null);
    }
  }

  async function moveSaved(image, dir) {
    const sorted = [...(images ?? [])].sort((a, b) => a.displayOrder - b.displayOrder);
    const idx = sorted.findIndex((i) => i.id === image.id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    setReordering(true);
    try {
      const next = [...sorted];
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      await onReorderImages(next.map((img) => img.id));
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setReordering(false);
    }
  }

  const savedSorted = [...(images ?? [])].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <div className="space-y-4">
      {guidance && <p className="label-xs text-muted-foreground">{guidance}</p>}

      {savedSorted.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {savedSorted.map((img, i) => (
            <div key={img.id} className="relative">
              <div className="h-24 w-20 overflow-hidden border" style={{ aspectRatio: aspect }}>
                <img src={img.imageUrl} alt="" className="h-full w-full object-cover" />
              </div>
              {i === 0 && <span className="absolute left-1 top-1 bg-accent px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-accent-foreground">Primary</span>}
              <div className="mt-1 flex items-center justify-center gap-1">
                <button disabled={reordering || i === 0} onClick={() => moveSaved(img, -1)} aria-label="Move earlier" title="Move earlier" className="disabled:opacity-30">
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button disabled={reordering || replacing || editLoading} onClick={() => startEdit(img)} aria-label="Edit image" title="Edit image">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button disabled={reordering || replacing || editLoading} onClick={() => startReplace(img)} aria-label="Replace image" title="Replace image">
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
                <button disabled={reordering || editLoading} onClick={() => onDeleteImage(img.id)} aria-label="Remove image" title="Remove image" className="text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <button disabled={reordering || i === savedSorted.length - 1} onClick={() => moveSaved(img, 1)} aria-label="Move later" title="Move later" className="disabled:opacity-30">
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editSrc && (
        <CropModal
          src={editSrc}
          fileName={editTarget?.imageUrl?.split("/").pop() || "image.jpg"}
          aspect={aspect}
          onCancel={cancelEdit}
          onConfirm={confirmEdit}
          applying={editSaving}
          cancelLabel="Cancel"
          helperText="This is the actual saved image, shown at its full framing by default -- Apply with no changes keeps it exactly as-is. Crop, zoom, or rotate only if you want to trim or adjust it. Only this one image for this color is affected."
        />
      )}

      <input ref={replaceInputRef} type="file" accept="image/*" onChange={handleReplaceSelect} className="hidden" />
      {replaceStaged && (
        <CropModal
          src={replaceStaged.previewUrl}
          fileName={replaceStaged.file.name}
          aspect={aspect}
          onCancel={cancelReplace}
          onConfirm={confirmReplace}
          applying={replacing}
          cancelLabel="Use full image"
          helperText="The crop box starts matching your full photo -- Apply with no changes uploads it exactly as selected, uncropped."
        />
      )}

      {staged.length > 0 && (
        <div className="flex flex-wrap gap-3 border-t pt-4">
          {staged.map((s, i) => (
            <div key={s.id} className="relative">
              <div className="h-24 w-20 overflow-hidden border border-accent" style={{ aspectRatio: aspect }}>
                <img src={s.previewUrl} alt="" className="h-full w-full object-cover" />
              </div>
              {i === 0 && savedSorted.length === 0 && (
                <span className="absolute left-1 top-1 bg-accent px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-accent-foreground">Primary</span>
              )}
              <div className="mt-1 flex items-center justify-center gap-1.5">
                <button onClick={() => moveStaged(s.id, -1)} disabled={i === 0} aria-label="Move earlier" className="disabled:opacity-30">
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setCropping(s)} aria-label="Crop">
                  <Crop className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => removeStaged(s.id)} aria-label="Remove" className="text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => moveStaged(s.id, 1)} disabled={i === staged.length - 1} aria-label="Move later" className="disabled:opacity-30">
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <label className="btn-outline inline-flex cursor-pointer items-center gap-2 text-xs">
          <UploadCloud className="h-4 w-4" />
          Select images
          <input ref={inputRef} type="file" accept="image/*" multiple onChange={handleSelect} className="hidden" />
        </label>
        {staged.length > 0 && (
          <button type="button" className="btn-solid text-xs" onClick={handleUpload} disabled={uploading}>
            {uploading ? progress : `Upload ${staged.length} image${staged.length > 1 ? "s" : ""}`}
          </button>
        )}
      </div>

      {cropping && (
        <CropModal
          src={cropping.previewUrl}
          fileName={cropping.file.name}
          aspect={aspect}
          onCancel={() => setCropping(null)}
          onConfirm={applyCrop}
          cancelLabel="Use full image"
          helperText="The crop box starts matching your full photo -- Apply with no changes uploads it exactly as selected, uncropped."
        />
      )}
    </div>
  );
}
