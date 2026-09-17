import { useRef, useState } from "react";
import * as adminApi from "../../api/admin";
import { useToast } from "../../context/ToastContext";
import { useScrollExpandImages } from "../../context/ScrollExpandImagesContext";
import BackButton from "../../components/BackButton";
import CropModal from "../../components/admin/CropModal";
import { RotateCcw, UploadCloud } from "lucide-react";

const SLOTS = [1, 2, 3];
const SLOT_LABEL = {
  1: "Campaign / identity",
  2: "Collection editorial",
  3: "Bestsellers editorial",
};

export default function AdminScrollImages() {
  const { notify } = useToast();
  const { getImage, setImage, resetImage } = useScrollExpandImages();

  return (
    <div>
      <BackButton fallback="/admin" className="mb-3" />
      <h2 className="text-xl">ScrollDown Images</h2>
      <p className="label-xs mt-2 max-w-2xl text-muted-foreground">
        Manages the three cinematic ScrollExpand transition images shown on the Men and Women storefronts.
      </p>

      <div className="mt-10 space-y-14">
        {["MEN", "WOMEN"].map((gender) => (
          <section key={gender}>
            <h3 className="label-xs text-accent">{gender}</h3>
            <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-3">
              {SLOTS.map((step) => (
                <SlotCard
                  key={step}
                  gender={gender}
                  step={step}
                  imageUrl={getImage(gender, step)}
                  onApply={async (url) => {
                    await setImage(gender, step, url);
                    notify(`ScrollExpand #${step} (${gender}) updated`, "success");
                  }}
                  onReset={async () => {
                    await resetImage(gender, step);
                    notify(`ScrollExpand #${step} (${gender}) reset to default`, "success");
                  }}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function SlotCard({ gender, step, imageUrl, onApply, onReset }) {
  const { notify } = useToast();
  const inputRef = useRef(null);
  const [staged, setStaged] = useState(null);
  const [applying, setApplying] = useState(false);
  const [resetting, setResetting] = useState(false);

  function handleSelect(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setStaged({ file, previewUrl: URL.createObjectURL(file) });
  }

  function cancelStaged() {
    if (staged) URL.revokeObjectURL(staged.previewUrl);
    setStaged(null);
  }

  async function confirmStaged(croppedFile) {
    setApplying(true);
    try {
      const formData = new FormData();
      formData.append("file", croppedFile);
      const uploaded = await adminApi.uploadAdminImage(formData);
      await onApply(uploaded.url);
      cancelStaged();
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setApplying(false);
    }
  }

  async function handleReset() {
    setResetting(true);
    try {
      await onReset();
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="hairline-card overflow-hidden">
      <div className="aspect-video w-full overflow-hidden bg-muted">
        {imageUrl && <img src={imageUrl} alt="" className="h-full w-full object-cover" />}
      </div>
      <div className="p-4">
        <p className="label-xs">ScrollExpand #{step}</p>
        <p className="mt-1 text-xs text-muted-foreground">{SLOT_LABEL[step]}</p>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <label className="btn-outline inline-flex cursor-pointer items-center gap-2 text-xs">
            <UploadCloud className="h-3.5 w-3.5" />
            Replace
            <input ref={inputRef} type="file" accept="image/*" onChange={handleSelect} className="hidden" />
          </label>
          <button
            type="button"
            onClick={handleReset}
            disabled={resetting}
            className="label-xs flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {resetting ? "Resetting..." : "Reset"}
          </button>
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
          Recommended: 1920 × 1080px (16:9). Minimum: 1280 × 720px.
        </p>
      </div>

      {staged && (
        <CropModal
          src={staged.previewUrl}
          fileName={staged.file.name}
          aspect={16 / 9}
          onCancel={cancelStaged}
          onConfirm={confirmStaged}
          applying={applying}
        />
      )}
    </div>
  );
}
