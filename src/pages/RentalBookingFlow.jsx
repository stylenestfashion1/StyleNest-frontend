import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import * as rentalApi from "../api/rental";
import { formatPrice, formatDate, titleCase } from "../utils/format";
import LoadingState from "../components/LoadingState";
import ErrorState from "../components/ErrorState";
import BackButton from "../components/BackButton";
import { useToast } from "../context/ToastContext";

// "Click a lehenga, pick dates, agree to terms, pay, tell us on WhatsApp" --
// see the backend RentalBooking* classes for the full lifecycle. Entirely
// separate from the normal StyleNest checkout: no login, no cart, no
// Cashfree, no StyleNest Order row (see spec section 24). Every number
// shown here (days, total) is provisional -- the booking response coming
// back from the server is the only one ever trusted for the actual amount.
export default function RentalBookingFlow() {
  const { shareToken, itemId } = useParams();
  const { notify } = useToast();

  const [step, setStep] = useState(0); // 0 = dates, 1 = details + terms, 2 = payment
  const [range, setRange] = useState({ start: null, end: null });
  const [form, setForm] = useState({ customerName: "", customerPhone: "" });
  const [termsChecked, setTermsChecked] = useState(false);
  const [booking, setBooking] = useState(null);
  const [transactionId, setTransactionId] = useState("");
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);

  const catalogQuery = useQuery({
    queryKey: ["rental-catalog", shareToken],
    queryFn: () => rentalApi.getRentalCatalogByShareToken(shareToken),
  });

  const settingsQuery = useQuery({
    queryKey: ["rental-settings", shareToken],
    queryFn: () => rentalApi.getPublicRentalSettings(shareToken),
  });

  const unavailableQuery = useQuery({
    queryKey: ["rental-unavailable-dates", shareToken, itemId],
    queryFn: () => rentalApi.getUnavailableDates(shareToken, itemId),
  });

  const item = catalogQuery.data?.items?.find((i) => String(i.id) === itemId);

  const createBooking = useMutation({
    mutationFn: () =>
      rentalApi.createRentalBooking(shareToken, itemId, {
        startDate: range.start,
        endDate: range.end,
        customerName: form.customerName.trim(),
        customerPhone: form.customerPhone.trim(),
        termsAccepted: termsChecked,
      }),
    onSuccess: (data) => {
      setBooking(data);
      setStep(2);
    },
    onError: (err) => notify(err.message, "error"),
  });

  const submitPayment = useMutation({
    mutationFn: () => {
      const formData = new FormData();
      formData.append("transactionId", transactionId.trim());
      if (screenshotFile) formData.append("screenshot", screenshotFile);
      return rentalApi.submitRentalPayment(shareToken, booking.bookingReference, formData);
    },
    onSuccess: () => {
      setPaymentSubmitted(true);
      notify("Payment details submitted", "success");
    },
    onError: (err) => notify(err.message, "error"),
  });

  const seasonDays = useMemo(() => {
    if (!settingsQuery.data) return [];
    const days = [];
    let day = settingsQuery.data.seasonStartDate;
    while (day <= settingsQuery.data.seasonEndDate) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [settingsQuery.data]);

  const unavailableSet = useMemo(
    () => new Set(unavailableQuery.data?.unavailableDates ?? []),
    [unavailableQuery.data]
  );

  const rentalDays = range.start && range.end ? inclusiveDays(range.start, range.end) : 0;
  const provisionalTotal = item && rentalDays > 0 ? Number(item.rentalPrice) * rentalDays : 0;

  function handleDayClick(day) {
    if (unavailableSet.has(day)) return;

    if (!range.start || (range.start && range.end)) {
      setRange({ start: day, end: null });
      return;
    }

    // Second click: reject if it would create a range that swallows an
    // unavailable date in between -- the frontend disabling individual
    // chips isn't enough on its own (see spec section 20), so re-validate
    // the whole span here too. The server re-validates again regardless.
    const [lo, hi] = day < range.start ? [day, range.start] : [range.start, day];
    const spansUnavailable = seasonDays.some((d) => d >= lo && d <= hi && unavailableSet.has(d));
    if (spansUnavailable) {
      notify("That range includes dates that are already booked. Please pick a different range.", "error");
      setRange({ start: day, end: null });
      return;
    }

    setRange({ start: lo, end: hi });
  }

  if (catalogQuery.isLoading || settingsQuery.isLoading || unavailableQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <LoadingState label="Loading" />
      </div>
    );
  }

  if (catalogQuery.isError || !item || settingsQuery.isError || unavailableQuery.isError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <ErrorState message="Could not load this booking." />
        <BackButton fallback={`/rental/${shareToken}/${itemId}`} label="Back" />
      </div>
    );
  }

  const settings = settingsQuery.data;

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="mx-auto max-w-xl px-5 pt-10">
        <BackButton
          fallback={`/rental/${shareToken}/${itemId}`}
          label={step === 0 ? "Back to lehenga" : "Back"}
          className="mb-6"
          {...(step > 0 ? { onClick: () => setStep((s) => s - 1) } : {})}
        />

        <h1 className="text-[clamp(1.4rem,4vw,1.9rem)] leading-tight">{item.name}</h1>
        <p className="label-xs mt-2 text-muted-foreground">{titleCase(item.colour)}</p>

        {step === 0 && (
          <div className="mt-8">
            <p className="label-xs text-accent">Step 1 of 3 — Select dates</p>
            <p className="mt-3 text-sm text-muted-foreground">
              Rental season: {formatDate(settings.seasonStartDate)} – {formatDate(settings.seasonEndDate)}. Tap a
              start date, then an end date (or the same date twice for a single day).
            </p>

            <div className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-5">
              {seasonDays.map((day) => {
                const blocked = unavailableSet.has(day);
                const inRange = range.start && (range.end ? day >= range.start && day <= range.end : day === range.start);
                // The single tapped date (no end yet) or either edge of a
                // confirmed range gets the strongest treatment -- for a
                // same-day range (start === end) this is the only date, so
                // it correctly reads as fully selected rather than "just
                // the start of something."
                const isBoundary = inRange && (day === range.start || day === range.end);
                return (
                  <button
                    key={day}
                    type="button"
                    disabled={blocked}
                    onClick={() => handleDayClick(day)}
                    aria-pressed={Boolean(inRange)}
                    className={`hairline-card p-3 text-center text-sm transition-colors ${
                      blocked
                        ? "cursor-not-allowed text-muted-foreground opacity-40 line-through"
                        : isBoundary
                        ? // hairline-card's own `background`/`border` shorthand can
                          // otherwise win the cascade over bg-accent/border-accent
                          // depending on Tailwind's utility ordering -- ! forces
                          // the selected state to always render correctly.
                          "!border-accent !bg-accent font-medium !text-accent-foreground"
                        : inRange
                        ? "!border-accent !bg-accent/25 font-medium !text-foreground"
                        : "hover:border-accent"
                    }`}
                  >
                    {shortDay(day)}
                  </button>
                );
              })}
            </div>

            <p className="mt-4 text-xs text-muted-foreground">
              Struck-through dates are already booked. Gold dates mark your selected range.
            </p>

            {rentalDays > 0 && (
              <div className="hairline-card mt-6 p-5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Selected dates</span>
                  <span>
                    {formatDate(range.start)} → {formatDate(range.end)}
                  </span>
                </div>
                <div className="mt-2 flex justify-between">
                  <span className="text-muted-foreground">Number of days</span>
                  <span>{rentalDays}</span>
                </div>
                <div className="mt-2 flex justify-between">
                  <span className="text-muted-foreground">Rental price</span>
                  <span>{formatPrice(item.rentalPrice)} / day</span>
                </div>
                <div className="mt-3 flex justify-between border-t pt-3 text-base">
                  <span>Total</span>
                  <span>{formatPrice(provisionalTotal)}</span>
                </div>
              </div>
            )}

            <button
              type="button"
              disabled={rentalDays === 0}
              onClick={() => setStep(1)}
              className="btn-solid mt-6 w-full disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="mt-8">
            <p className="label-xs text-accent">Step 2 of 3 — Your details & terms</p>

            <div className="mt-6 grid gap-4">
              <label className="block">
                <span className="label-xs text-muted-foreground">Your name</span>
                <input
                  type="text"
                  value={form.customerName}
                  onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
                  className="field mt-2"
                />
              </label>
              <label className="block">
                <span className="label-xs text-muted-foreground">WhatsApp / mobile number</span>
                <input
                  type="tel"
                  value={form.customerPhone}
                  onChange={(e) => setForm((f) => ({ ...f, customerPhone: e.target.value }))}
                  className="field mt-2"
                />
              </label>
            </div>

            <div className="hairline-card mt-6 max-h-64 overflow-y-auto p-5 text-sm leading-relaxed text-muted-foreground">
              <p className="label-xs mb-3 text-accent">Important Rental Terms & Conditions</p>
              <pre className="whitespace-pre-wrap font-sans">{settings.termsAndConditions}</pre>
            </div>

            <label className="mt-4 flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={termsChecked}
                onChange={(e) => setTermsChecked(e.target.checked)}
                className="mt-0.5"
              />
              I have read and agree to the rental terms & conditions above.
            </label>

            <button
              type="button"
              disabled={!termsChecked || !form.customerName.trim() || !form.customerPhone.trim() || createBooking.isPending}
              onClick={() => createBooking.mutate()}
              className="btn-solid mt-6 w-full disabled:cursor-not-allowed disabled:opacity-50"
            >
              {createBooking.isPending ? "Booking..." : "I Agree & Continue"}
            </button>
          </div>
        )}

        {step === 2 && booking && (
          <div className="mt-8">
            <p className="label-xs text-accent">Step 3 of 3 — Payment</p>

            <div className="hairline-card mt-6 p-5 text-sm">
              <p className="label-xs text-muted-foreground">Booking reference</p>
              <p className="mt-1">{booking.bookingReference}</p>
              <div className="mt-4 flex justify-between">
                <span className="text-muted-foreground">Dates</span>
                <span>
                  {formatDate(booking.startDate)} → {formatDate(booking.endDate)}
                </span>
              </div>
              <div className="mt-2 flex justify-between">
                <span className="text-muted-foreground">Days</span>
                <span>{booking.rentalDays}</span>
              </div>
              <div className="mt-3 flex justify-between border-t pt-3 text-base">
                <span>Total</span>
                <span>{formatPrice(booking.totalAmount)}</span>
              </div>
            </div>

            {settings.paymentQrImageUrl && (
              <div className="mt-6 flex justify-center">
                <img src={settings.paymentQrImageUrl} alt="Payment QR code" className="h-64 w-64 object-contain" />
              </div>
            )}

            <p className="mt-4 text-center text-sm text-muted-foreground">Scan the QR and complete payment.</p>

            <div className="hairline-card border-accent mt-6 p-5 text-sm">
              <p className="label-xs text-accent">Important Instructions</p>
              <p className="mt-2 whitespace-pre-wrap text-muted-foreground">{settings.paymentInstructions}</p>
              <p className="mt-3 text-muted-foreground">
                Your booking is NOT confirmed until the shop verifies the payment and confirms it.
              </p>
            </div>

            {!paymentSubmitted ? (
              <div className="mt-6 grid gap-4">
                <label className="block">
                  <span className="label-xs text-muted-foreground">Transaction ID</span>
                  <input
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    className="field mt-2"
                    placeholder="Enter the UPI/bank transaction ID"
                  />
                </label>
                <label className="block">
                  <span className="label-xs text-muted-foreground">Payment screenshot (optional)</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => setScreenshotFile(e.target.files?.[0] ?? null)}
                    className="field mt-2"
                  />
                </label>

                <button
                  type="button"
                  disabled={!transactionId.trim() || submitPayment.isPending}
                  onClick={() => submitPayment.mutate()}
                  className="btn-outline w-full disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitPayment.isPending ? "Submitting..." : "Save Payment Details"}
                </button>

                <a
                  href={whatsappUrl(settings.whatsappNumber, booking, item)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-solid w-full text-center"
                >
                  Send Payment Details on WhatsApp
                </a>
              </div>
            ) : (
              <div className="hairline-card mt-6 p-5 text-center text-sm">
                <p>Payment details saved. Please also send them on WhatsApp so the shop can confirm your booking.</p>
                <a
                  href={whatsappUrl(settings.whatsappNumber, booking, item)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-solid mt-4 inline-block"
                >
                  Send Payment Details on WhatsApp
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Every date here is a plain calendar date with no time-of-day meaning --
// parsing/arithmetic is done entirely in UTC (explicit "Z" suffix, UTC
// getters/setters) specifically so a positive-UTC-offset browser (IST,
// this shop's own timezone, is UTC+5:30) can never silently roll a date
// backward via local-time-to-UTC conversion. That exact bug turned
// addDays into a no-op in IST and hung the season-day-list loop below.
function addDays(isoDate, n) {
  const d = new Date(isoDate + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function inclusiveDays(startIso, endIso) {
  const start = new Date(startIso + "T00:00:00Z");
  const end = new Date(endIso + "T00:00:00Z");
  return Math.round((end - start) / 86400000) + 1;
}

function shortDay(isoDate) {
  const d = new Date(isoDate + "T00:00:00Z");
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });
}

// Free wa.me click-to-chat only -- no WhatsApp Business API, per spec
// section 12. The customer still has to press send themselves; nothing
// here is sent automatically.
function whatsappUrl(whatsappNumber, booking, item) {
  const message = [
    "Hi, I have made the rental payment.",
    "",
    `Booking Reference: ${booking.bookingReference}`,
    `Lehenga: ${item.name}`,
    `Colour: ${item.colour}`,
    `Pickup Date: ${formatDate(booking.startDate)}`,
    `Return Date: ${formatDate(booking.endDate)}`,
    `Rental Days: ${booking.rentalDays}`,
    `Total Amount: ${formatPrice(booking.totalAmount)}`,
    "Transaction ID: [please fill in]",
    "",
    "Please verify my payment and confirm my booking.",
  ].join("\n");

  return `https://wa.me/${whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
}
