import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as rentalApi from "../../api/rental";
import { formatPrice } from "../../utils/format";
import { useToast } from "../../context/ToastContext";
import BackButton from "../../components/BackButton";
import LoadingState from "../../components/LoadingState";
import ErrorState from "../../components/ErrorState";

const EMPTY_ITEM_FORM = { name: "", colour: "", rentalPrice: "", imageUrls: [] };

export default function AdminRentalCatalogDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { notify } = useToast();

  const [itemForm, setItemForm] = useState(EMPTY_ITEM_FORM);
  const [editingItemId, setEditingItemId] = useState(null);
  const [uploading, setUploading] = useState(false);

  const { data: catalog, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "rental-catalogs", id],
    queryFn: () => rentalApi.getAdminRentalCatalog(id),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin", "rental-catalogs", id] });

  const saveItem = useMutation({
    mutationFn: () => {
      const payload = {
        name: itemForm.name.trim(),
        colour: itemForm.colour.trim(),
        rentalPrice: Number(itemForm.rentalPrice),
        imageUrls: itemForm.imageUrls,
      };
      return editingItemId
        ? rentalApi.updateAdminRentalItem(id, editingItemId, payload)
        : rentalApi.addAdminRentalItem(id, payload);
    },
    onSuccess: () => {
      invalidate();
      notify(editingItemId ? "Lehenga updated" : "Lehenga added", "success");
      setItemForm(EMPTY_ITEM_FORM);
      setEditingItemId(null);
    },
    onError: (err) => notify(err.message, "error"),
  });

  const deleteItem = useMutation({
    mutationFn: (itemId) => rentalApi.deleteAdminRentalItem(id, itemId),
    onSuccess: () => {
      invalidate();
      notify("Lehenga deleted", "success");
    },
    onError: (err) => notify(err.message, "error"),
  });

  const toggleStatus = useMutation({
    mutationFn: () =>
      catalog.status === "ACTIVE" ? rentalApi.deactivateAdminRentalCatalog(id) : rentalApi.activateAdminRentalCatalog(id),
    onSuccess: () => {
      invalidate();
      notify(catalog.status === "ACTIVE" ? "Catalog deactivated" : "Catalog activated", "success");
    },
    onError: (err) => notify(err.message, "error"),
  });

  const deleteCatalog = useMutation({
    mutationFn: () => rentalApi.deleteAdminRentalCatalog(id),
    onSuccess: () => {
      notify("Rental catalog deleted", "success");
      navigate("/admin/rental");
    },
    onError: (err) => notify(err.message, "error"),
  });

  async function handleFileSelect(e) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploaded = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await rentalApi.uploadAdminRentalImage(formData);
        uploaded.push(res.url);
      }
      setItemForm((f) => ({ ...f, imageUrls: [...f.imageUrls, ...uploaded] }));
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setUploading(false);
    }
  }

  function startEdit(item) {
    setEditingItemId(item.id);
    setItemForm({ name: item.name, colour: item.colour, rentalPrice: String(item.rentalPrice), imageUrls: item.imageUrls ?? [] });
  }

  function cancelEdit() {
    setEditingItemId(null);
    setItemForm(EMPTY_ITEM_FORM);
  }

  if (isLoading) return <LoadingState label="Loading catalog" />;
  if (isError || !catalog) return <ErrorState message="Could not load this rental catalog." onRetry={refetch} />;

  const shareUrl = `${window.location.origin}/rental/${catalog.shareToken}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${catalog.name} — view our rental lehengas: ${shareUrl}`)}`;
  const formValid = itemForm.name.trim() && itemForm.colour.trim() && Number(itemForm.rentalPrice) > 0;

  return (
    <div>
      <BackButton fallback="/admin/rental" className="mb-3" />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl">{catalog.name}</h2>
          <span className={`label-xs ${catalog.status === "ACTIVE" ? "text-accent" : "text-muted-foreground"}`}>
            {catalog.status === "ACTIVE" ? "Active" : "Inactive"}
          </span>
        </div>
        <div className="flex flex-wrap gap-4">
          <button
            className="label-xs link-underline"
            onClick={() => {
              if (window.confirm(catalog.status === "ACTIVE" ? "Deactivate this catalog? The public link will stop working." : "Reactivate this catalog?")) {
                toggleStatus.mutate();
              }
            }}
          >
            {catalog.status === "ACTIVE" ? "Deactivate Catalog" : "Activate Catalog"}
          </button>
          <button
            className="label-xs link-underline text-destructive"
            onClick={() => {
              if (window.confirm("Permanently delete this rental catalog, all its lehengas, and their photos? This cannot be undone.")) {
                deleteCatalog.mutate();
              }
            }}
          >
            Delete Catalog
          </button>
        </div>
      </div>

      <div className="hairline-card mt-8 p-6">
        <h3 className="label-xs text-accent">Share Link</h3>
        <p className="mt-2 break-all text-sm">{shareUrl}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          This link stays the same forever -- adding, editing, or removing lehengas never changes it.
        </p>
        <div className="mt-4 flex flex-wrap gap-4">
          <button
            className="btn-outline"
            onClick={() => {
              navigator.clipboard.writeText(shareUrl);
              notify("Link copied", "success");
            }}
          >
            Copy Link
          </button>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn-solid">
            Share on WhatsApp
          </a>
        </div>
      </div>

      <div className="hairline-card mt-8 p-6">
        <h3 className="label-xs text-accent">{editingItemId ? "Edit Lehenga" : "+ Add Lehenga"}</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="label-xs text-muted-foreground">Name</span>
            <input
              type="text"
              value={itemForm.name}
              onChange={(e) => setItemForm((f) => ({ ...f, name: e.target.value }))}
              className="field mt-2"
            />
          </label>
          <label className="block">
            <span className="label-xs text-muted-foreground">Colour</span>
            <input
              type="text"
              value={itemForm.colour}
              onChange={(e) => setItemForm((f) => ({ ...f, colour: e.target.value }))}
              className="field mt-2"
            />
          </label>
          <label className="block">
            <span className="label-xs text-muted-foreground">Rental Price (₹)</span>
            <input
              type="number"
              min="0"
              value={itemForm.rentalPrice}
              onChange={(e) => setItemForm((f) => ({ ...f, rentalPrice: e.target.value }))}
              className="field mt-2"
            />
          </label>
        </div>

        <div className="mt-4">
          <span className="label-xs text-muted-foreground">Photos</span>
          <div className="mt-2 flex flex-wrap gap-3">
            {itemForm.imageUrls.map((url) => (
              <div key={url} className="relative h-20 w-16 overflow-hidden rounded">
                <img src={url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setItemForm((f) => ({ ...f, imageUrls: f.imageUrls.filter((u) => u !== url) }))}
                  className="absolute right-0 top-0 bg-black/60 px-1 text-[10px] text-white"
                >
                  ✕
                </button>
              </div>
            ))}
            <label className="flex h-20 w-16 cursor-pointer items-center justify-center rounded border border-dashed text-[10px] text-muted-foreground">
              {uploading ? "..." : "+ Add"}
              <input type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={handleFileSelect} disabled={uploading} />
            </label>
          </div>
        </div>

        <div className="mt-4 flex gap-4">
          <button
            className="btn-solid disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!formValid || saveItem.isPending || uploading}
            onClick={() => saveItem.mutate()}
          >
            {saveItem.isPending ? "Saving..." : editingItemId ? "Save Changes" : "Add Lehenga"}
          </button>
          {editingItemId && (
            <button className="btn-outline" onClick={cancelEdit}>
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="mt-8">
        <h3 className="label-xs text-accent">Items ({catalog.items.length})</h3>
        {catalog.items.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No lehengas added yet.</p>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            {catalog.items.map((item) => (
              <div key={item.id} className="hairline-card flex items-center gap-4 p-4">
                <div className="h-16 w-12 shrink-0 overflow-hidden rounded bg-muted">
                  {item.imageUrls?.[0] && <img src={item.imageUrls[0]} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm">{item.name}</p>
                  <p className="label-xs text-muted-foreground">{item.colour}</p>
                </div>
                <p className="text-sm">{formatPrice(item.rentalPrice)}</p>
                <div className="flex gap-4">
                  <button className="label-xs link-underline" onClick={() => startEdit(item)}>
                    Edit
                  </button>
                  <button
                    className="label-xs link-underline text-destructive"
                    onClick={() => {
                      if (window.confirm(`Delete "${item.name}"? Its photos will also be removed.`)) {
                        deleteItem.mutate(item.id);
                      }
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
