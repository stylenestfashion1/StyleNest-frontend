import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CreditCard, Banknote, ShieldCheck, Lock, ExternalLink } from "lucide-react";
import { Reveal, PageFade } from "../../components/Reveal";
import BackButton from "../../components/BackButton";
import { placeBulkOrder, initiatePayGlocalPayment } from "../../api/bulk";
import { lookupPostalCode } from "../../api/addresses";
import { useBulkCart } from "../../context/BulkCartContext";
import { useToast } from "../../context/ToastContext";
import { clearBulkToken } from "../../api/bulkClient";
import { formatPrice } from "../../utils/format";

const EMPTY_CONTACT = {
  customerName: "",
  customerEmail: "",
  customerPhone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India",
};

export default function BulkCheckout() {
  const bulkCart = useBulkCart();
  const navigate = useNavigate();
  const { notify } = useToast();

  const [contact, setContact] = useState(EMPTY_CONTACT);
  const [paymentMethod, setPaymentMethod] = useState("ONLINE");
  const [errors, setErrors] = useState({});
  const [placing, setPlacing] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);
  const [lookingPostal, setLookingPostal] = useState(false);

  async function handlePostalLookup(pin) {
    const cleanPin = (pin || contact.postalCode || "").trim();
    if (cleanPin.length !== 6 || !/^\d{6}$/.test(cleanPin)) return;
    setLookingPostal(true);
    try {
      const res = await lookupPostalCode(cleanPin, "IN");
      const data = res?.data || res;
      if (data?.found) {
        setContact((c) => ({
          ...c,
          city: data.city || c.city,
          state: data.state || c.state,
          country: data.country || c.country || "India",
        }));
        setErrors((e) => ({ ...e, city: undefined, state: undefined }));
      }
    } catch (err) {
      console.error("Postal lookup error:", err);
    } finally {
      setLookingPostal(false);
    }
  }

  function setField(field, value) {
    setContact((c) => ({ ...c, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
    if (field === "postalCode") {
      const clean = value.trim();
      if (clean.length === 6 && /^\d{6}$/.test(clean)) {
        handlePostalLookup(clean);
      }
    }
  }

  function validate() {
    const required = [
      "customerName",
      "customerEmail",
      "customerPhone",
      "addressLine1",
      "city",
      "state",
      "postalCode",
      "country",
    ];
    const next = {};
    for (const field of required) {
      if (!contact[field]?.trim()) next[field] = "Required";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!validate()) return;

    setPlacing(true);

    try {
      const order = await placeBulkOrder({
        ...contact,
        paymentMethod: paymentMethod,
        items: bulkCart.items.map((i) => ({
          bulkProductId: i.bulkProductId,
          quantity: i.quantity,
        })),
      });

      if (paymentMethod === "ONLINE") {
        notify("Initiating PayGlocal secure payment...", "info");
        const payRes = await initiatePayGlocalPayment(order.bulkOrderNumber);
        const redirectUrl = payRes?.redirectUrl || payRes?.data?.redirectUrl;

        if (redirectUrl) {
          bulkCart.clear();
          window.location.href = redirectUrl;
          return;
        } else {
          throw new Error("Unable to obtain PayGlocal checkout URL. Please try again.");
        }
      } else {
        bulkCart.clear();
        setPlacedOrder(order);
      }
    } catch (err) {
      const sessionInvalid = /no longer active|check your access code/i.test(err.message);
      notify(err.message, "error");
      if (sessionInvalid) {
        clearBulkToken();
        navigate("/bulk-orders", { replace: true });
      }
    } finally {
      setPlacing(false);
    }
  }

  if (placedOrder) {
    return (
      <div>
        <div className="mx-auto max-w-xl px-5 py-24 text-center">
          <p className="label-xs text-accent uppercase font-bold tracking-wider">Bulk order placed</p>
          <h1 className="mt-4 text-[clamp(1.9rem,3.6vw,2.6rem)] font-serif font-bold">
            Thank you, {placedOrder.customerName.split(" ")[0]}
          </h1>
          <p className="mt-4 text-sm text-muted-foreground">
            Order <span className="text-foreground font-mono font-bold">{placedOrder.bulkOrderNumber}</span> has been received. The shop
            will reach out to confirm dispatch and delivery schedule.
          </p>
          <div className="hairline-card mt-8 p-6 text-left">
            <dl className="space-y-2 text-sm">
              {placedOrder.items.map((item) => (
                <div key={item.bulkProductId} className="flex justify-between">
                  <dt>
                    {item.productName} × {item.quantity} pcs
                  </dt>
                  <dd className="font-semibold">{formatPrice(item.subtotal)}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-4 flex justify-between border-t pt-4 text-base font-bold">
              <span>Grand Total</span>
              <span className="text-primary font-serif">{formatPrice(placedOrder.totalAmount)}</span>
            </div>
          </div>
          <Link to="/" className="btn-solid mt-8 inline-block">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  if (bulkCart.items.length === 0) {
    return (
      <div>
        <div className="mx-auto max-w-xl px-5 py-24 text-center">
          <h1 className="text-3xl font-bold">Nothing to check out</h1>
          <p className="mt-4 text-sm text-muted-foreground">Add wholesale products to your bulk cart first.</p>
          <Link to="/bulk-orders/catalog" className="btn-solid mt-8 inline-block">
            Browse bulk catalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mx-auto max-w-[1200px] px-5 py-12 md:px-10">
        <BackButton fallback="/bulk-orders/cart" className="mb-6" />
        <p className="label-xs text-accent uppercase font-bold tracking-wider">Wholesale Checkout</p>
        <h1 className="mt-3 text-[clamp(1.9rem,3.6vw,2.6rem)] font-serif font-bold">B2B Bulk Checkout</h1>

        <form onSubmit={handleSubmit} className="mt-10 grid gap-12 lg:grid-cols-[1.3fr_1fr]">
          <Reveal>
            <div className="space-y-6">
              <h2 className="text-lg font-bold">Contact information</h2>
              <Field label="Full name / Business contact" value={contact.customerName} onChange={(v) => setField("customerName", v)} error={errors.customerName} required />
              <Field label="Email address" type="email" value={contact.customerEmail} onChange={(v) => setField("customerEmail", v)} error={errors.customerEmail} required />
              <Field label="Phone number" value={contact.customerPhone} onChange={(v) => setField("customerPhone", v)} error={errors.customerPhone} required />

              <h2 className="pt-4 text-lg font-bold">Delivery / Warehouse address</h2>
              <Field label="Address line 1" value={contact.addressLine1} onChange={(v) => setField("addressLine1", v)} error={errors.addressLine1} required />
              <Field label="Address line 2 / Landmark (optional)" value={contact.addressLine2} onChange={(v) => setField("addressLine2", v)} />
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <div>
                  <Field
                    label="PIN code"
                    value={contact.postalCode}
                    onChange={(v) => setField("postalCode", v)}
                    onBlur={() => handlePostalLookup(contact.postalCode)}
                    placeholder="e.g. 302001"
                    error={errors.postalCode}
                    required
                  />
                  {lookingPostal && (
                    <span className="mt-1 block text-xs text-primary font-medium animate-pulse">
                      Detecting city & state...
                    </span>
                  )}
                </div>
                <Field label="City" value={contact.city} onChange={(v) => setField("city", v)} error={errors.city} required />
                <Field label="State" value={contact.state} onChange={(v) => setField("state", v)} error={errors.state} required />
              </div>
              <Field label="Country" value={contact.country} onChange={(v) => setField("country", v)} error={errors.country} required />

              {/* PAYMENT METHOD SELECTION */}
              <div className="pt-6 border-t">
                <h2 className="text-lg font-bold text-foreground mb-3">Wholesale Payment Method</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {/* PayGlocal Option */}
                  <label
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      paymentMethod === "ONLINE"
                        ? "border-primary bg-primary/5 shadow-xs"
                        : "border-border/70 hover:border-foreground/30 bg-card"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="ONLINE"
                      checked={paymentMethod === "ONLINE"}
                      onChange={() => setPaymentMethod("ONLINE")}
                      className="mt-1 accent-primary"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 font-bold text-sm text-foreground">
                        <CreditCard className="h-4 w-4 text-primary" />
                        Pay Online (PayGlocal)
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        Cards, Netbanking & Corporate B2B Checkout.
                      </p>
                      <span className="inline-block mt-2 text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Official B2B Gateway
                      </span>
                    </div>
                  </label>

                  {/* COD Option */}
                  <label
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      paymentMethod === "COD"
                        ? "border-primary bg-primary/5 shadow-xs"
                        : "border-border/70 hover:border-foreground/30 bg-card"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="COD"
                      checked={paymentMethod === "COD"}
                      onChange={() => setPaymentMethod("COD")}
                      className="mt-1 accent-primary"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 font-bold text-sm text-foreground">
                        <Banknote className="h-4 w-4 text-muted-foreground" />
                        Cash on Delivery
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        Pay upon delivery or direct shop arrangement.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal>
            <div className="hairline-card p-6 sticky top-24">
              <h2 className="text-xl font-bold">Wholesale Order Summary</h2>
              <ul className="mt-6 space-y-3 text-sm divide-y">
                {bulkCart.items.map((item) => (
                  <li key={item.bulkProductId} className="pt-3 first:pt-0 flex justify-between gap-4">
                    <div>
                      <span className="font-semibold text-foreground block">{item.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {item.quantity} pieces × {formatPrice(item.price)}
                      </span>
                    </div>
                    <span className="font-bold text-foreground shrink-0">{formatPrice(item.price * item.quantity)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex items-baseline justify-between border-t pt-5">
                <span className="label-xs uppercase font-bold">Total Payable</span>
                <span className="text-2xl font-black text-primary font-serif">{formatPrice(bulkCart.totalPrice)}</span>
              </div>

              <button
                type="submit"
                disabled={placing}
                className="btn-solid mt-8 w-full py-3.5 text-sm font-bold flex items-center justify-center gap-2 rounded-xl shadow-md disabled:opacity-60"
              >
                {placing ? (
                  "Processing..."
                ) : paymentMethod === "ONLINE" ? (
                  <>
                    Pay with PayGlocal ({formatPrice(bulkCart.totalPrice)})
                    <ExternalLink className="h-4 w-4" />
                  </>
                ) : (
                  `Place Bulk Order (${formatPrice(bulkCart.totalPrice)})`
                )}
              </button>

              <div className="mt-4 flex items-center gap-2 text-[11px] text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>GST Tax Invoice will be issued immediately upon confirmation.</span>
              </div>
            </div>
          </Reveal>
        </form>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, onBlur, placeholder, error, required, type = "text" }) {
  return (
    <label className="block">
      <span className="label-xs text-muted-foreground">
        {label}
        {required && <span className="text-accent"> *</span>}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        className={`field mt-2 ${error ? "border-destructive" : ""}`}
        aria-invalid={Boolean(error)}
      />
      {error && <span className="mt-1 block text-xs text-destructive">{error}</span>}
    </label>
  );
}
