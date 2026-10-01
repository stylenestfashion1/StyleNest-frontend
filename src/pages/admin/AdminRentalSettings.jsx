import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as rentalApi from "../../api/rental";
import { useToast } from "../../context/ToastContext";
import BackButton from "../../components/BackButton";
import LoadingState from "../../components/LoadingState";
import ErrorState from "../../components/ErrorState";

const EMPTY = {
  seasonStartDate: "",
  seasonEndDate: "",
  whatsappNumber: "",
  pickupInstructions: "",
  returnInstructions: "",
  lateReturnMessage: "",
  paymentInstructions: "",
  termsAndConditions: "",
  pendingPaymentExpiryMinutes: 30,
};

export default function AdminRentalSettings() {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const [form, setForm] = useState(EMPTY);
  const [uploadingQr, setUploadingQr] = useState(false);

  const { data: settings, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "rental-settings"],
    queryFn: () => rentalApi.getAdminRentalSettings(),
  });

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  const save = useMutation({
    mutationFn: () =>
      rentalApi.updateAdminRentalSettings({
        ...form,
        pendingPaymentExpiryMinutes: Number(form.pendingPaymentExpiryMinutes),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "rental-settings"] });
      notify("Rental settings saved", "success");
    },
    onError: (err) => notify(err.message, "error"),
  });

  async function handleQrSelect(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploadingQr(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const updated = await rentalApi.uploadAdminRentalPaymentQr(formData);
      setForm((f) => ({ ...f, paymentQrImageUrl: updated.paymentQrImageUrl }));
      queryClient.invalidateQueries({ queryKey: ["admin", "rental-settings"] });
      notify("Payment QR updated", "success");
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setUploadingQr(false);
    }
  }

  if (isLoading) return <LoadingState label="Loading rental settings" />;
  if (isError || !settings) return <ErrorState message="Could not load rental settings." onRetry={refetch} />;

  return (
    <div>
      <BackButton fallback="/admin/rental" className="mb-3" />
      <h2 className="text-xl">Rental Settings</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Controls the whole Navratri rental booking flow -- season dates, payment QR, WhatsApp number, and the terms
        customers must accept before paying.
      </p>

      <div className="hairline-card mt-8 grid gap-6 p-6 sm:grid-cols-2">
        <label className="block">
          <span className="label-xs text-muted-foreground">Rental Season — Start</span>
          <input
            type="date"
            value={form.seasonStartDate}
            onChange={(e) => setForm((f) => ({ ...f, seasonStartDate: e.target.value }))}
            className="field mt-2"
          />
        </label>
        <label className="block">
          <span className="label-xs text-muted-foreground">Rental Season — End</span>
          <input
            type="date"
            value={form.seasonEndDate}
            onChange={(e) => setForm((f) => ({ ...f, seasonEndDate: e.target.value }))}
            className="field mt-2"
          />
        </label>

        <label className="block">
          <span className="label-xs text-muted-foreground">Shop WhatsApp Number</span>
          <input
            type="text"
            value={form.whatsappNumber}
            onChange={(e) => setForm((f) => ({ ...f, whatsappNumber: e.target.value }))}
            className="field mt-2"
          />
        </label>
        <label className="block">
          <span className="label-xs text-muted-foreground">Unpaid Hold Expiry (minutes)</span>
          <input
            type="number"
            min="1"
            value={form.pendingPaymentExpiryMinutes}
            onChange={(e) => setForm((f) => ({ ...f, pendingPaymentExpiryMinutes: e.target.value }))}
            className="field mt-2"
          />
          <p className="label-xs mt-1.5 text-muted-foreground">
            How long a booking holds its dates before payment is submitted -- released automatically after this.
          </p>
        </label>

        <div className="sm:col-span-2">
          <span className="label-xs text-muted-foreground">Payment QR</span>
          <div className="mt-3 flex flex-wrap items-center gap-4">
            {form.paymentQrImageUrl && (
              <img src={form.paymentQrImageUrl} alt="Payment QR" className="h-32 w-32 rounded border object-contain" />
            )}
            <label className="btn-outline cursor-pointer">
              {uploadingQr ? "Uploading..." : form.paymentQrImageUrl ? "Replace QR" : "Upload QR"}
              <input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={handleQrSelect} disabled={uploadingQr} />
            </label>
          </div>
        </div>

        <label className="block sm:col-span-2">
          <span className="label-xs text-muted-foreground">Pickup Instructions</span>
          <textarea
            rows={2}
            value={form.pickupInstructions}
            onChange={(e) => setForm((f) => ({ ...f, pickupInstructions: e.target.value }))}
            className="field mt-2"
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="label-xs text-muted-foreground">Return Instructions</span>
          <textarea
            rows={2}
            value={form.returnInstructions}
            onChange={(e) => setForm((f) => ({ ...f, returnInstructions: e.target.value }))}
            className="field mt-2"
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="label-xs text-muted-foreground">Late Return Message</span>
          <textarea
            rows={2}
            value={form.lateReturnMessage}
            onChange={(e) => setForm((f) => ({ ...f, lateReturnMessage: e.target.value }))}
            className="field mt-2"
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="label-xs text-muted-foreground">Payment Instructions (shown on the payment screen)</span>
          <textarea
            rows={3}
            value={form.paymentInstructions}
            onChange={(e) => setForm((f) => ({ ...f, paymentInstructions: e.target.value }))}
            className="field mt-2"
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="label-xs text-muted-foreground">Terms & Conditions (customer must agree before paying)</span>
          <textarea
            rows={8}
            value={form.termsAndConditions}
            onChange={(e) => setForm((f) => ({ ...f, termsAndConditions: e.target.value }))}
            className="field mt-2"
          />
        </label>

        <div className="sm:col-span-2">
          <button className="btn-solid" disabled={save.isPending} onClick={() => save.mutate()}>
            {save.isPending ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}
