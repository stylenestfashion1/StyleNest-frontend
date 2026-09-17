import { useState } from "react";
import { UploadCloud, X } from "lucide-react";
import * as adminApi from "../../api/admin";
import CropModal from "./CropModal";
import { useToast } from "../../context/ToastContext";

/**
 * A single-image upload field (used for category/collection images, which
 * the backend models as one `imageUrl` string per category — unlike
 * products, there's no multi-image or ordering concept here).
 */
export default function SingleImageUpload({ label, value, onChange, aspect = 4 / 5, guidance }) {
  const { notify } = useToast();
  const [uploading, setUploading] = useState(false);
  const [cropSrc, setCropSrc] = useState(null);
  const [cropFileName, setCropFileName] = useState("image.jpg");

  function handleSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCropFileName(file.name);
    setCropSrc(URL.createObjectURL(file));
    e.target.value = "";
  }

  async function handleCropConfirm(croppedFile) {
    setCropSrc(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", croppedFile);
      const uploaded = await adminApi.uploadAdminImage(formData);
      onChange(uploaded.url);
      notify("Image uploaded", "success");
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="sm:col-span-2">
      <span className="label-xs text-muted-foreground">{label}</span>
      {guidance && <p className="mt-1 text-xs text-muted-foreground">{guidance}</p>}

      <div className="mt-3 flex flex-wrap items-start gap-4">
        {value && (
          <div className="relative h-28 w-24 overflow-hidden border" style={{ aspectRatio: aspect }}>
            <img src={value} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange("")}
              aria-label="Remove image"
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center bg-foreground/70 text-background"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label className="btn-outline inline-flex w-fit cursor-pointer items-center gap-2 text-xs">
            <UploadCloud className="h-4 w-4" />
            {uploading ? "Uploading..." : value ? "Replace image" : "Upload image"}
            <input type="file" accept="image/*" onChange={handleSelect} className="hidden" disabled={uploading} />
          </label>
          <input
            placeholder="or paste an image URL"
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            className="field text-xs"
          />
        </div>
      </div>

      {cropSrc && (
        <CropModal
          src={cropSrc}
          fileName={cropFileName}
          aspect={aspect}
          onCancel={() => setCropSrc(null)}
          onConfirm={handleCropConfirm}
        />
      )}
    </div>
  );
}

