import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as ordersApi from "../api/orders";
import * as addressesApi from "../api/addresses";
import * as paymentsApi from "../api/payments";
import { payWithCashfree } from "../utils/cashfreeCheckout";
import { formatPrice } from "../utils/format";
import { getSizeLabel } from "../utils/sizeLabel";
import { PageFade, Reveal } from "../components/Reveal";
import LoadingState from "../components/LoadingState";
import ErrorState from "../components/ErrorState";
import AddressForm from "../components/AddressForm";
import BackButton from "../components/BackButton";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { useCurrency } from "../context/CurrencyContext";
import { useGuestCart } from "../context/GuestCartContext";

const PAYMENT_METHODS = [
  { id: "COD", title: "Cash on delivery", note: "Pay in cash when your order arrives." },
  { id: "ONLINE", title: "Pay online", note: "Card, UPI, netbanking or wallet — secured by Cashfree." },
];

// Shown in place of the payment-method picker (and disables the final
// place-order/pay button) whenever the active cart/checkout currency is
// USD -- browsing/cart/checkout work fully in USD, but payment stays
// blocked until the merchant's Cashfree account is confirmed activated
// for international payments. This is a UX convenience only; the real,
// authoritative block lives server-side in OrderServiceImpl.reserveOrder,
// which rejects a USD order before it's ever persisted or Cashfree is
// contacted, independent of whatever this page does or doesn't disable.
function UsdPaymentBlockedNotice() {
  return (
    <div className="hairline-card border-accent p-5 text-sm">
      <p className="label-xs text-accent">International payments</p>
      <p className="mt-3 text-muted-foreground">
        International online payments will be available soon. Please try again once international payment support is enabled.
      </p>
    </div>
  );
}

export default function Checkout() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <RegisteredCheckout /> : <GuestCheckout />;
}

function RegisteredCheckout() {
  const STEPS = ["Shipping", "Payment", "Review"];
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const [step, setStep] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [placing, setPlacing] = useState(false);

  const checkoutQuery = useQuery({ queryKey: ["checkout"], queryFn: ordersApi.getCheckout });
  const addressesQuery = useQuery({ queryKey: ["addresses"], queryFn: addressesApi.getAddresses });

  const setDefault = useMutation({
    mutationFn: (id) => addressesApi.setDefaultAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checkout"] });
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
    },
  });

  const checkout = checkoutQuery.data;
  const isUsd = checkout?.currency === "USD";

  async function handlePlaceOrder() {
    if (placing || isUsd) return;
    setPlacing(true);
    try {
      if (paymentMethod === "COD") {
        const order = await ordersApi.placeOrder({ paymentMethod });
        queryClient.invalidateQueries({ queryKey: ["cart"] });
        notify("Order placed", "success");
        navigate(`/orders/${order.id}`, { replace: true });
        return;
      }

      const initiation = await paymentsApi.initiatePayment();
      queryClient.invalidateQueries({ queryKey: ["cart"] });

      const result = await payWithCashfree(initiation);

      if (result.outcome === "success") {
        notify("Payment successful", "success");
        navigate(`/orders/${initiation.orderId}`, { replace: true });
      } else if (result.outcome === "pending") {
        notify("Payment was not completed. You can try again.");
      } else if (result.outcome === "redirected") {
        notify("Completing your payment...");
      } else {
        notify(result.error?.message || "Could not verify the payment. Please check your orders.", "error");
      }
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setPlacing(false);
    }
  }

  if (checkoutQuery.isLoading || addressesQuery.isLoading) return <LoadingState label="Loading checkout" />;

  const addresses = addressesQuery.data ?? [];
  const needsAddress = checkoutQuery.isError && /address/i.test(checkoutQuery.error.message);

  // checkoutQuery.isLoading is false past this point, but a paused retry
  // (e.g. after a transient network hiccup) can leave the query neither
  // errored nor successful yet -- never guess "empty cart" in that
  // ambiguous state, offer a retry instead of a false "nothing to check
  // out".
  if (!needsAddress && !checkoutQuery.isError && !checkoutQuery.isSuccess) {
    return <ErrorState message="Could not load checkout." onRetry={checkoutQuery.refetch} />;
  }

  if (checkoutQuery.isError && !needsAddress) {
    return <ErrorState message="Could not load checkout." onRetry={checkoutQuery.refetch} />;
  }

  if (!needsAddress && !checkout?.items?.length) {
    return (
      <PageFade>
        <div className="mx-auto max-w-xl px-5 py-28 text-center">
          <h1 className="text-3xl">Nothing to check out</h1>
          <p className="mt-4 text-sm text-muted-foreground">Add a piece to your bag first.</p>
          <Link to="/women" className="btn-solid mt-8">
            Shop the collection
          </Link>
        </div>
      </PageFade>
    );
  }

  return (
    <PageFade>
      <div className="mx-auto max-w-[1200px] px-5 py-12 md:px-10">
        <BackButton fallback="/cart" className="mb-6" />
        <h1 className="text-[clamp(1.9rem,3.6vw,2.8rem)]">Checkout</h1>

        <StepBar steps={STEPS} step={step} />

        <div className="mt-10 grid gap-12 lg:grid-cols-[1.3fr_1fr]">
          <Reveal>
            {step === 0 &&
              (needsAddress || addresses.length === 0 ? (
                <div>
                  <p className="label-xs mb-6 text-accent">Add a shipping address</p>
                  <AddressForm
                    forceDefault
                    onSaved={() => {
                      queryClient.invalidateQueries({ queryKey: ["checkout"] });
                      queryClient.invalidateQueries({ queryKey: ["addresses"] });
                    }}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  {addresses.map((addr) => (
                    <button
                      key={addr.id}
                      onClick={() => setDefault.mutate(addr.id)}
                      className={`hairline-card flex w-full items-start gap-4 p-5 text-left ${addr.isDefault ? "border-accent" : ""}`}
                    >
                      <span className="mt-1 h-3 w-3 rounded-full border" style={{ background: addr.isDefault ? "var(--color-accent)" : "transparent" }} />
                      <span>
                        <span className="label-xs block">
                          {addr.fullName} · {addr.addressType}
                        </span>
                        <span className="mt-2 block text-xs text-muted-foreground">
                          {addr.addressLine1}, {addr.city}, {addr.state} {addr.postalCode}
                        </span>
                      </span>
                    </button>
                  ))}
                  <Link to="/account?tab=addresses" className="label-xs link-underline block w-fit">
                    Manage addresses
                  </Link>
                </div>
              ))}

            {step === 1 &&
              (isUsd ? (
                <UsdPaymentBlockedNotice />
              ) : (
                <PaymentMethodPicker paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} />
              ))}

            {step === 2 && checkout && (
              <div className="space-y-8">
                <div className="hairline-card p-5">
                  <p className="label-xs">Shipping to</p>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {checkout.shippingAddress?.fullName} · {checkout.shippingAddress?.addressLine1}, {checkout.shippingAddress?.city}{" "}
                    {checkout.shippingAddress?.postalCode}
                  </p>
                </div>
                <div className="hairline-card p-5">
                  <p className="label-xs">Payment</p>
                  {isUsd ? (
                    <UsdPaymentBlockedNotice />
                  ) : (
                    <p className="mt-3 text-sm text-muted-foreground">{PAYMENT_METHODS.find((m) => m.id === paymentMethod)?.title}</p>
                  )}
                </div>
                <ul className="border-t">
                  {checkout.items.map((item) => (
                    <li key={item.variantId} className="flex items-center justify-between border-b py-4 text-sm">
                      <span>
                        {item.productName} ({item.color}/{getSizeLabel(item.size)}) <span className="text-muted-foreground">× {item.quantity}</span>
                      </span>
                      <span>{formatPrice(item.subtotal, checkout.currency)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-10 flex gap-3">
              {step > 0 && (
                <button className="btn-outline" onClick={() => setStep((s) => s - 1)}>
                  Back
                </button>
              )}
              {step < 2 ? (
                <button className="btn-solid" disabled={step === 0 && (needsAddress || addresses.length === 0)} onClick={() => setStep((s) => s + 1)}>
                  Continue
                </button>
              ) : (
                <button className="btn-solid" disabled={placing || isUsd} onClick={handlePlaceOrder}>
                  {placing ? "Placing order..." : paymentMethod === "COD" ? "Place order" : "Proceed to pay"}
                </button>
              )}
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="hairline-card p-6">
              <h2 className="text-xl">Summary</h2>
              {checkout ? (
                <>
                  <dl className="mt-6 space-y-3 text-sm">
                    {checkout.items.map((item) => (
                      <div key={item.variantId} className="flex justify-between gap-4">
                        <dt className="text-muted-foreground">
                          {item.productName} × {item.quantity}
                        </dt>
                        <dd>{formatPrice(item.subtotal, checkout.currency)}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className="mt-6 flex items-baseline justify-between border-t pt-5">
                    <span className="label-xs">Total</span>
                    <span className="display text-xl">{formatPrice(checkout.totalAmount, checkout.currency)}</span>
                  </div>
                </>
              ) : (
                <p className="mt-6 text-sm text-muted-foreground">Add a shipping address to see your order total.</p>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </PageFade>
  );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidPhone(phone, isIndia) {
  const digits = (phone || "").replace(/\D/g, "");
  if (isIndia) {
    // Only strip a "91" country-code prefix when the total length matches
    // "91" + a 10-digit number -- a bare 10-digit number that merely
    // happens to start with "91" (e.g. 9123456780) must not be truncated.
    const local = digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;
    return /^[6-9]\d{9}$/.test(local);
  }
  return digits.length >= 7 && digits.length <= 15;
}

function isValidPostalCode(postalCode, isIndia) {
  if (!postalCode) return false;
  if (isIndia) return /^[1-9]\d{5}$/.test(postalCode.trim());
  return postalCode.trim().length >= 3;
}

const EMPTY_CONTACT = { fullName: "", email: "", phone: "" };
const EMPTY_ADDRESS = { addressLine1: "", addressLine2: "", city: "", state: "", postalCode: "", country: "India", countryCode: "IN" };

function GuestCheckout() {
  const STEPS = ["Contact", "Shipping", "Payment", "Review"];
  const navigate = useNavigate();
  const guestCart = useGuestCart();
  const { currency } = useCurrency();
  const { notify } = useToast();
  const [step, setStep] = useState(0);
  const [contact, setContact] = useState(EMPTY_CONTACT);
  const [address, setAddress] = useState(EMPTY_ADDRESS);
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [errors, setErrors] = useState({});
  const [placing, setPlacing] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);
  const [looking, setLooking] = useState(false);

  const isIndia = address.countryCode === "IN";
  const isUsd = currency === "USD";

  function setContactField(key, value) {
    setContact((c) => ({ ...c, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function setAddressField(key, value) {
    setAddress((a) => ({ ...a, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  async function handlePostalBlur() {
    if (!address.postalCode || !address.countryCode) return;
    setLooking(true);
    try {
      const data = await addressesApi.lookupPostalCode(address.postalCode, address.countryCode);
      if (data?.found) {
        setAddress((a) => ({ ...a, city: data.city || a.city, state: data.state || a.state, country: data.country || a.country }));
      }
    } catch {
      // silent — optional convenience lookup
    } finally {
      setLooking(false);
    }
  }

  function validateContactStep() {
    const next = {};
    if (!contact.fullName.trim()) next.fullName = "Full name is required.";
    if (!contact.email.trim()) next.email = "Email is required.";
    else if (!EMAIL_RE.test(contact.email.trim())) next.email = "Enter a valid email address.";
    if (!contact.phone.trim()) next.phone = "Phone number is required.";
    else if (!isValidPhone(contact.phone, true)) next.phone = "Enter a valid 10-digit phone number.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function validateAddressStep() {
    const next = {};
    if (!address.addressLine1.trim()) next.addressLine1 = "Address line 1 is required.";
    if (!address.city.trim()) next.city = "City is required.";
    if (!address.state.trim()) next.state = "State is required.";
    if (!address.country.trim()) next.country = "Country is required.";
    if (!isValidPostalCode(address.postalCode, isIndia)) next.postalCode = isIndia ? "Enter a valid 6-digit PIN code." : "Postal code is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleContinue() {
    if (step === 0 && !validateContactStep()) return;
    if (step === 1 && !validateAddressStep()) return;
    setStep((s) => s + 1);
  }

  // Shared by both the COD placement payload and the Cashfree guest
  // initiate payload -- the latter has no paymentMethod field (Cashfree
  // Checkout itself is where the customer picks the sub-method).
  function buildGuestOrderBase() {
    return {
      guestEmail: contact.email.trim(),
      shippingAddress: {
        fullName: contact.fullName.trim(),
        phone: contact.phone.trim(),
        phoneCountryCode: isIndia ? "+91" : "",
        addressLine1: address.addressLine1.trim(),
        addressLine2: address.addressLine2.trim(),
        city: address.city.trim(),
        state: address.state.trim(),
        postalCode: address.postalCode.trim(),
        country: address.country.trim(),
        countryCode: address.countryCode,
      },
      items: guestCart.items.map((i) => ({ productVariantId: i.productVariantId, quantity: i.quantity })),
      currency,
    };
  }

  async function handlePlaceOrder() {
    if (placing || isUsd) return;
    setPlacing(true);
    try {
      if (paymentMethod === "COD") {
        const order = await ordersApi.createGuestOrder({ ...buildGuestOrderBase(), paymentMethod: "COD" });
        guestCart.clear();
        setPlacedOrder(order);
        notify("Order placed", "success");
        return;
      }

      const initiation = await paymentsApi.initiateGuestPayment(buildGuestOrderBase());

      const result = await payWithCashfree(initiation);

      if (result.outcome === "success") {
        // Only clear the guest's local cart once payment is genuinely
        // confirmed -- clearing it any earlier would leave a dismissed/
        // failed retry with no items to resubmit.
        guestCart.clear();
        navigate(`/track-order?orderNumber=${encodeURIComponent(initiation.orderNumber)}&payment=success`);
      } else if (result.outcome === "pending") {
        notify("Payment was not completed. You can try again.");
      } else if (result.outcome === "redirected") {
        notify("Completing your payment...");
      } else {
        notify(result.error?.message || "Could not verify the payment. Please check your order via Track Order.", "error");
      }
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setPlacing(false);
    }
  }

  if (placedOrder) {
    return <GuestOrderConfirmation order={placedOrder} contact={contact} />;
  }

  if (guestCart.items.length === 0) {
    return (
      <PageFade>
        <div className="mx-auto max-w-xl px-5 py-28 text-center">
          <h1 className="text-3xl">Nothing to check out</h1>
          <p className="mt-4 text-sm text-muted-foreground">Add a piece to your bag first.</p>
          <Link to="/women" className="btn-solid mt-8">
            Shop the collection
          </Link>
        </div>
      </PageFade>
    );
  }

  const totalPrice = guestCart.totalPrice;

  return (
    <PageFade>
      <div className="mx-auto max-w-[1200px] px-5 py-12 md:px-10">
        <BackButton fallback="/cart" className="mb-6" />
        <h1 className="text-[clamp(1.9rem,3.6vw,2.8rem)]">Checkout</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Checking out as a guest.{" "}
          <Link to="/login" state={{ from: { pathname: "/checkout" } }} className="link-underline text-accent">
            Log in
          </Link>{" "}
          instead?
        </p>

        <StepBar steps={STEPS} step={step} />

        <div className="mt-10 grid gap-12 lg:grid-cols-[1.3fr_1fr]">
          <Reveal>
            {step === 0 && (
              <div className="space-y-6">
                <GuestField label="Full name" value={contact.fullName} onChange={(v) => setContactField("fullName", v)} error={errors.fullName} required />
                <GuestField label="Email address" type="email" value={contact.email} onChange={(v) => setContactField("email", v)} error={errors.email} required />
                <GuestField label="Phone number" value={contact.phone} onChange={(v) => setContactField("phone", v)} error={errors.phone} required />
              </div>
            )}

            {step === 1 && (
              <div className="space-y-6">
                <GuestField label="Address line 1" value={address.addressLine1} onChange={(v) => setAddressField("addressLine1", v)} error={errors.addressLine1} required />
                <GuestField
                  label="Address line 2 / Apartment / Landmark (optional)"
                  value={address.addressLine2}
                  onChange={(v) => setAddressField("addressLine2", v)}
                />
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                  <GuestField
                    label={isIndia ? "PIN code" : "Postal code"}
                    value={address.postalCode}
                    onChange={(v) => setAddressField("postalCode", v)}
                    onBlur={handlePostalBlur}
                    error={errors.postalCode}
                    required
                  />
                  <GuestField label="City" value={address.city} onChange={(v) => setAddressField("city", v)} error={errors.city} required />
                  <GuestField label="State" value={address.state} onChange={(v) => setAddressField("state", v)} error={errors.state} required />
                </div>
                <GuestField label="Country" value={address.country} onChange={(v) => setAddressField("country", v)} error={errors.country} required />
                {looking && <span className="label-xs text-muted-foreground">Looking up postal code...</span>}
              </div>
            )}

            {step === 2 &&
              (isUsd ? (
                <UsdPaymentBlockedNotice />
              ) : (
                <PaymentMethodPicker paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} />
              ))}

            {step === 3 && (
              <div className="space-y-8">
                <div className="hairline-card p-5">
                  <p className="label-xs">Contact</p>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {contact.fullName} · {contact.email} · {contact.phone}
                  </p>
                </div>
                <div className="hairline-card p-5">
                  <p className="label-xs">Shipping to</p>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {address.addressLine1}
                    {address.addressLine2 ? `, ${address.addressLine2}` : ""}, {address.city}, {address.state} {address.postalCode}, {address.country}
                  </p>
                </div>
                <div className="hairline-card p-5">
                  <p className="label-xs">Payment</p>
                  {isUsd ? (
                    <UsdPaymentBlockedNotice />
                  ) : (
                    <p className="mt-3 text-sm text-muted-foreground">{PAYMENT_METHODS.find((m) => m.id === paymentMethod)?.title}</p>
                  )}
                </div>
                <ul className="border-t">
                  {guestCart.items.map((item) => (
                    <li key={item.productVariantId} className="flex items-center justify-between border-b py-4 text-sm">
                      <span>
                        {item.productName} ({item.color}/{getSizeLabel(item.size)}) <span className="text-muted-foreground">× {item.quantity}</span>
                      </span>
                      <span>{formatPrice(item.price * item.quantity, currency)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-10 flex gap-3">
              {step > 0 && (
                <button className="btn-outline" onClick={() => setStep((s) => s - 1)}>
                  Back
                </button>
              )}
              {step < 3 ? (
                <button className="btn-solid" onClick={handleContinue}>
                  Continue
                </button>
              ) : (
                <button className="btn-solid" disabled={placing || isUsd} onClick={handlePlaceOrder}>
                  {placing ? "Placing order..." : paymentMethod === "COD" ? "Place order" : "Proceed to pay"}
                </button>
              )}
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="hairline-card p-6">
              <h2 className="text-xl">Summary</h2>
              <dl className="mt-6 space-y-3 text-sm">
                {guestCart.items.map((item) => (
                  <div key={item.productVariantId} className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">
                      {item.productName} × {item.quantity}
                    </dt>
                    <dd>{formatPrice(item.price * item.quantity, currency)}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-6 flex items-baseline justify-between border-t pt-5">
                <span className="label-xs">Total</span>
                <span className="display text-xl">{formatPrice(totalPrice, currency)}</span>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </PageFade>
  );
}

function GuestOrderConfirmation({ order, contact }) {
  return (
    <PageFade>
      <div className="mx-auto max-w-2xl px-5 py-20 md:px-10">
        <div className="hairline-card p-8 text-center md:p-10">
          <p className="label-xs text-accent">Order placed successfully</p>
          <h1 className="mt-4 text-3xl">Thank you, {contact.fullName.split(" ")[0]}</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Order <span className="text-foreground">#{order.orderNumber}</span> has been placed and a confirmation has been sent to {contact.email}.
          </p>

          <div className="mt-8 space-y-3 border-t pt-8 text-left">
            <Row label="Payment method" value={order.paymentMethod} />
            <Row label="Payment status" value={order.paymentStatus} />
            <Row label="Order status" value={order.orderStatus} />
          </div>

          <ul className="mt-6 border-t text-left">
            {order.items.map((item, idx) => (
              <li key={idx} className="flex justify-between border-b py-3 text-sm">
                <span>
                  {item.productName} ({item.color}/{getSizeLabel(item.size)}) × {item.quantity}
                </span>
                <span>{formatPrice(item.subtotal, order.currency)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-baseline justify-between border-t pt-4">
            <span className="label-xs">Total</span>
            <span className="display text-xl">{formatPrice(order.totalAmount, order.currency)}</span>
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link to={`/track-order?orderNumber=${encodeURIComponent(order.orderNumber)}`} className="btn-solid">
              Track your order
            </Link>
            <Link to="/" className="btn-outline">
              Continue shopping
            </Link>
          </div>
        </div>
      </div>
    </PageFade>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-baseline justify-between">
      <dt className="label-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm">{value}</dd>
    </div>
  );
}

// 4 steps (guest checkout: Contact/Shipping/Payment/Review) with labels did not fit a narrow
// phone screen as a plain flex row -- no wrap, no shrink, so the row itself pushed the page
// wider than the viewport (a real horizontal-scroll bug, not just a "could be tighter" -- see
// 2026-09 mobile QA). overflow-x-auto contains any remaining overflow to this one bar (a
// standard, discoverable pattern for a step indicator) instead of the whole page; the smaller
// gap/padding below is enough that it fits without scrolling on every common phone width anyway.
function StepBar({ steps, step }) {
  return (
    <div className="mt-10 overflow-x-auto border-y">
      <ol className="flex w-max min-w-full items-center gap-3 px-1 py-5 sm:gap-6">
        {steps.map((s, i) => (
          <li key={s} className="flex shrink-0 items-center gap-2 sm:gap-3">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center border text-xs transition-colors duration-500"
              style={{
                background: i <= step ? "var(--color-foreground)" : "transparent",
                color: i <= step ? "var(--color-primary-foreground)" : "inherit",
              }}
            >
              {i + 1}
            </span>
            <span className={`label-xs whitespace-nowrap ${i === step ? "text-accent" : "text-muted-foreground"}`}>{s}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function PaymentMethodPicker({ paymentMethod, setPaymentMethod }) {
  return (
    <div className="space-y-4">
      {PAYMENT_METHODS.map((opt) => (
        <button
          key={opt.id}
          onClick={() => setPaymentMethod(opt.id)}
          className={`hairline-card flex w-full items-start gap-4 p-5 text-left ${paymentMethod === opt.id ? "border-accent" : ""}`}
        >
          <span className="mt-1 h-3 w-3 rounded-full border" style={{ background: paymentMethod === opt.id ? "var(--color-accent)" : "transparent" }} />
          <span>
            <span className="label-xs block">{opt.title}</span>
            <span className="mt-2 block text-xs text-muted-foreground">{opt.note}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

function GuestField({ label, value, onChange, onBlur, error, required, type = "text" }) {
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
        className={`field mt-2 ${error ? "border-destructive" : ""}`}
        aria-invalid={Boolean(error)}
      />
      {error && <span className="mt-1 block text-xs text-destructive">{error}</span>}
    </label>
  );
}
