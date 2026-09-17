import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageFade, Reveal } from "../../components/Reveal";
import BackButton from "../../components/BackButton";
import { useBulkCart } from "../../context/BulkCartContext";
import { useToast } from "../../context/ToastContext";
import { placeBulkOrder } from "../../api/bulk";
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
  const [errors, setErrors] = useState({});
  const [placing, setPlacing] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);

  function setField(field, value) {
    setContact((c) => ({ ...c, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function validate() {
    const required = ["customerName", "customerEmail", "customerPhone", "addressLine1", "city", "state", "postalCode", "country"];
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
        paymentMethod: "COD",
        items: bulkCart.items.map((i) => ({ bulkProductId: i.bulkProductId, quantity: i.quantity })),
      });

      bulkCart.clear();
      setPlacedOrder(order);
    } catch (err) {
      // "Already assigned" means the CODE is fine but bound to a different
      // customer -- this tab's session is still otherwise valid, so don't
      // clear it or send them back to the gate; just surface the message
      // (they need to contact the shop, not retry the same code). Only a
      // genuinely revoked/invalid token warrants resetting the session.
      const sessionInvalid = /no longer active|check your access code/i.test(err.message);
      notify(err.message, "error");
      if (sessionInvalid) {
        clearBulkToken();
        navigate("/bulk-orders");
      }
    } finally {
      setPlacing(false);
    }
  }

  if (placedOrder) {
    return (
      <PageFade>
        <div className="mx-auto max-w-xl px-5 py-24 text-center">
          <p className="label-xs text-accent">Bulk order placed</p>
          <h1 className="mt-4 text-[clamp(1.9rem,3.6vw,2.6rem)]">Thank you, {placedOrder.customerName.split(" ")[0]}</h1>
          <p className="mt-4 text-sm text-muted-foreground">
            Order <span className="text-foreground">{placedOrder.bulkOrderNumber}</span> has been received. The shop
            will reach out to confirm details and delivery.
          </p>
          <div className="hairline-card mt-8 p-6 text-left">
            <dl className="space-y-2 text-sm">
              {placedOrder.items.map((item) => (
                <div key={item.bulkProductId} className="flex justify-between">
                  <dt>
                    {item.productName} × {item.quantity}
                  </dt>
                  <dd>{formatPrice(item.subtotal)}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-4 flex justify-between border-t pt-4 text-sm font-medium">
              <span>Total</span>
              <span>{formatPrice(placedOrder.totalAmount)}</span>
            </div>
          </div>
          <Link to="/" className="btn-solid mt-8 inline-block">
            Back to home
          </Link>
        </div>
      </PageFade>
    );
  }

  if (bulkCart.items.length === 0) {
    return (
      <PageFade>
        <div className="mx-auto max-w-xl px-5 py-24 text-center">
          <h1 className="text-3xl">Nothing to check out</h1>
          <p className="mt-4 text-sm text-muted-foreground">Add a wholesale product to your bulk cart first.</p>
          <Link to="/bulk-orders/catalog" className="btn-solid mt-8 inline-block">
            Browse bulk catalog
          </Link>
        </div>
      </PageFade>
    );
  }

  return (
    <PageFade>
      <div className="mx-auto max-w-[1200px] px-5 py-12 md:px-10">
        <BackButton fallback="/bulk-orders/cart" className="mb-6" />
        <p className="label-xs text-accent">Wholesale</p>
        <h1 className="mt-3 text-[clamp(1.9rem,3.6vw,2.6rem)]">Bulk Checkout</h1>

        <form onSubmit={handleSubmit} className="mt-10 grid gap-12 lg:grid-cols-[1.3fr_1fr]">
          <Reveal>
            <div className="space-y-6">
              <h2 className="text-lg">Contact information</h2>
              <Field label="Full name" value={contact.customerName} onChange={(v) => setField("customerName", v)} error={errors.customerName} required />
              <Field label="Email address" type="email" value={contact.customerEmail} onChange={(v) => setField("customerEmail", v)} error={errors.customerEmail} required />
              <Field label="Phone number" value={contact.customerPhone} onChange={(v) => setField("customerPhone", v)} error={errors.customerPhone} required />

              <h2 className="pt-4 text-lg">Shipping address</h2>
              <Field label="Address line 1" value={contact.addressLine1} onChange={(v) => setField("addressLine1", v)} error={errors.addressLine1} required />
              <Field label="Address line 2 / Landmark (optional)" value={contact.addressLine2} onChange={(v) => setField("addressLine2", v)} />
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <Field label="PIN/postal code" value={contact.postalCode} onChange={(v) => setField("postalCode", v)} error={errors.postalCode} required />
                <Field label="City" value={contact.city} onChange={(v) => setField("city", v)} error={errors.city} required />
                <Field label="State" value={contact.state} onChange={(v) => setField("state", v)} error={errors.state} required />
              </div>
              <Field label="Country" value={contact.country} onChange={(v) => setField("country", v)} error={errors.country} required />

              <p className="label-xs text-muted-foreground">
                Payment: Cash on Delivery. For other payment arrangements, please contact the shop directly.
              </p>
            </div>
          </Reveal>

          <Reveal>
            <div className="hairline-card p-6">
              <h2 className="text-xl">Order Summary</h2>
              <ul className="mt-6 space-y-3 text-sm">
                {bulkCart.items.map((item) => (
                  <li key={item.bulkProductId} className="flex justify-between">
                    <span>
                      {item.name} × {item.quantity}
                    </span>
                    <span>{formatPrice(item.price * item.quantity)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex items-baseline justify-between border-t pt-5">
                <span className="label-xs">Total</span>
                <span className="display text-xl">{formatPrice(bulkCart.totalPrice)}</span>
              </div>
              <button type="submit" disabled={placing} className="btn-solid mt-8 w-full disabled:opacity-60">
                {placing ? "Placing order..." : "Place Bulk Order"}
              </button>
            </div>
          </Reveal>
        </form>
      </div>
    </PageFade>
  );
}

function Field({ label, value, onChange, error, required, type = "text" }) {
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
        className={`field mt-2 ${error ? "border-destructive" : ""}`}
        aria-invalid={Boolean(error)}
      />
      {error && <span className="mt-1 block text-xs text-destructive">{error}</span>}
    </label>
  );
}
