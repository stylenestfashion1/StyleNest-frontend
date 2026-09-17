import { useState } from "react";
import Cropper from "react-easy-crop";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Minus, Plus, RotateCcw, X } from "lucide-react";
import { getCroppedImageFile } from "../../utils/cropImage";

const ZOOM_MIN = 1;
const ZOOM_MAX = 3;
const ZOOM_STEP = 0.1;
const NUDGE_STEP = 15;

export default function CropModal({
  src,
  fileName,
  aspect,
  onCancel,
  onConfirm,
  applying = false,
  cancelLabel = "Cancel",
  // The dark overlay outside the box makes the 4:5 guide look like a hard,
  // mandatory crop -- callers whose Cancel path keeps the full original
  // image (see ImageUploadManager) should override this to say so, since
  // that's easy to miss otherwise.
  helperText = "The box is a suggested 4:5 framing, not a requirement -- only the area inside it is saved if you apply a crop.",
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedPixels, setCroppedPixels] = useState(null);
  const [saving, setSaving] = useState(false);

  function nudge(dx, dy) {
    setCrop((c) => ({ x: c.x + dx, y: c.y + dy }));
  }

  function reset() {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  }

  async function handleConfirm() {
    if (!croppedPixels) return;
    setSaving(true);
    try {
      const file = await getCroppedImageFile(src, croppedPixels, fileName);
      onConfirm(file);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-foreground/60 p-4">
      <div className="hairline-card w-full max-w-lg bg-background">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <span className="label-xs">Adjust image</span>
          <button onClick={onCancel} aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        {helperText && <p className="border-b px-5 py-2.5 text-xs text-muted-foreground">{helperText}</p>}

        <div className="relative h-72 w-full bg-muted sm:h-80">
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_, pixels) => setCroppedPixels(pixels)}
            // Default objectFit is already "contain" (the full photo stays
            // visible, letterboxed) -- kept explicit since that's exactly
            // what makes the 4:5 box read as a guide over the whole image
            // rather than the image being pre-cropped to fill it.
            objectFit="contain"
            style={{ cropAreaStyle: { color: "rgba(0, 0, 0, 0.35)" } }}
          />
        </div>

        <div className="flex flex-col gap-5 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <span className="label-xs text-muted-foreground">Zoom</span>
            <div className="mt-2 flex items-center gap-3">
              <button
                type="button"
                aria-label="Zoom out"
                onClick={() => setZoom((z) => Math.max(ZOOM_MIN, +(z - ZOOM_STEP).toFixed(2)))}
                className="flex h-8 w-8 shrink-0 items-center justify-center border transition-colors hover:border-accent"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <input
                type="range"
                min={ZOOM_MIN}
                max={ZOOM_MAX}
                step={ZOOM_STEP}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-[var(--color-accent)]"
              />
              <button
                type="button"
                aria-label="Zoom in"
                onClick={() => setZoom((z) => Math.min(ZOOM_MAX, +(z + ZOOM_STEP).toFixed(2)))}
                className="flex h-8 w-8 shrink-0 items-center justify-center border transition-colors hover:border-accent"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 self-center">
            <div>
              <span className="label-xs block text-center text-muted-foreground">Move</span>
              <div className="mt-2 grid grid-cols-3 grid-rows-2 gap-1">
                <span />
                <button type="button" aria-label="Move up" onClick={() => nudge(0, -NUDGE_STEP)} className="flex h-8 w-8 items-center justify-center border transition-colors hover:border-accent">
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <span />
                <button type="button" aria-label="Move left" onClick={() => nudge(-NUDGE_STEP, 0)} className="flex h-8 w-8 items-center justify-center border transition-colors hover:border-accent">
                  <ArrowLeft className="h-3.5 w-3.5" />
                </button>
                <button type="button" aria-label="Move down" onClick={() => nudge(0, NUDGE_STEP)} className="flex h-8 w-8 items-center justify-center border transition-colors hover:border-accent">
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
                <button type="button" aria-label="Move right" onClick={() => nudge(NUDGE_STEP, 0)} className="flex h-8 w-8 items-center justify-center border transition-colors hover:border-accent">
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <button type="button" onClick={reset} className="label-xs flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground">
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t px-5 py-4">
          <button type="button" className="label-xs text-muted-foreground" onClick={onCancel} disabled={applying}>
            {cancelLabel}
          </button>
          <button type="button" className="btn-solid" onClick={handleConfirm} disabled={saving || applying}>
            {saving || applying ? "Applying..." : "Apply"}
          </button>
        </div>
      </div>
    </div>
  );
}
