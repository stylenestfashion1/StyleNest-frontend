import { useState } from "react";
import * as addressesApi from "../api/addresses";

const ADDRESS_TYPES = ["HOME", "OFFICE", "OTHER"];
const EMPTY = {
  fullName: "",
  phone: "",
  phoneCountryCode: "+91",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  country: "India",
  countryCode: "IN",
  postalCode: "",
  addressType: "HOME",
  isDefault: false,
};

export default function AddressForm({ initial, onSaved, onCancel, forceDefault }) {
  const [form, setForm] = useState(initial ?? (forceDefault ? { ...EMPTY, isDefault: true } : EMPTY));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [looking, setLooking] = useState(false);

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handlePostalBlur() {
    if (!form.postalCode || !form.countryCode) return;
    setLooking(true);
    try {
      const data = await addressesApi.lookupPostalCode(form.postalCode, form.countryCode);
      if (data?.found) {
        setForm((f) => ({ ...f, city: data.city || f.city, state: data.state || f.state, country: data.country || f.country }));
      }
    } catch {
      // silent — optional convenience lookup
    } finally {
      setLooking(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const saved = initial?.id ? await addressesApi.updateAddress(initial.id, form) : await addressesApi.createAddress(form);
      onSaved(saved);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Field label="Full name" value={form.fullName} onChange={(v) => set("fullName", v)} required />
        <Field label="Phone" value={form.phone} onChange={(v) => set("phone", v)} required />
      </div>
      <Field label="Address line 1" value={form.addressLine1} onChange={(v) => set("addressLine1", v)} required />
      <Field label="Address line 2 (optional)" value={form.addressLine2} onChange={(v) => set("addressLine2", v)} />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <Field label="Postal code" value={form.postalCode} onChange={(v) => set("postalCode", v)} onBlur={handlePostalBlur} required />
        <Field label="City" value={form.city} onChange={(v) => set("city", v)} required />
        <Field label="State" value={form.state} onChange={(v) => set("state", v)} required />
      </div>
      <Field label="Country" value={form.country} onChange={(v) => set("country", v)} required />
      {looking && <span className="label-xs text-muted-foreground">Looking up postal code...</span>}

      <div>
        <span className="label-xs text-muted-foreground">Address type</span>
        <div className="mt-3 flex gap-2">
          {ADDRESS_TYPES.map((type) => (
            <button
              type="button"
              key={type}
              onClick={() => set("addressType", type)}
              className={`label-xs border px-4 py-2 transition-colors ${form.addressType === type ? "bg-foreground text-primary-foreground" : "hover:border-accent"}`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={form.isDefault} onChange={(e) => set("isDefault", e.target.checked)} />
        Set as default address
      </label>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={submitting} className="btn-solid">
          {submitting ? "Saving..." : "Save address"}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="label-xs text-muted-foreground">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

function Field({ label, value, onChange, onBlur, required }) {
  return (
    <label className="block">
      <span className="label-xs text-muted-foreground">{label}</span>
      <input value={value} required={required} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} className="field mt-2" />
    </label>
  );
}
