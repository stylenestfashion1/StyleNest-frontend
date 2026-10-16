import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { PageFade } from "../components/Reveal";
import { initiateQuickPayment } from "../api/quickPay";
import {
  ShieldCheck,
  CreditCard,
  Lock,
  ArrowRight,
  Globe2,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  HelpCircle,
  Building,
} from "lucide-react";

export default function QuickPay() {
  const [searchParams] = useSearchParams();

  // Form State
  const [currency, setCurrency] = useState("INR");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("India");

  const [isPrefilled, setIsPrefilled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Parse URL parameters on initial load
  useEffect(() => {
    const pAmount = searchParams.get("amount");
    const pCurrency = searchParams.get("currency") || searchParams.get("curr");
    const pNote = searchParams.get("note") || searchParams.get("desc") || searchParams.get("remarks");
    const pName = searchParams.get("name") || searchParams.get("customer");
    const pEmail = searchParams.get("email");
    const pPhone = searchParams.get("phone");
    const pCountry = searchParams.get("country");
    const pCity = searchParams.get("city");
    const pState = searchParams.get("state");
    const pAddress = searchParams.get("address");

    let hasPre = false;

    if (pAmount && !isNaN(pAmount) && Number(pAmount) > 0) {
      setAmount(pAmount);
      hasPre = true;
    }
    if (pCurrency) {
      const c = pCurrency.toUpperCase();
      if (c === "USD" || c === "INR") {
        setCurrency(c);
        if (c === "USD" && !pCountry) setCountry("United States");
      }
    }
    if (pNote) {
      setNote(decodeURIComponent(pNote));
      hasPre = true;
    }
    if (pName) {
      setCustomerName(decodeURIComponent(pName));
      hasPre = true;
    }
    if (pEmail) setCustomerEmail(decodeURIComponent(pEmail));
    if (pPhone) setCustomerPhone(decodeURIComponent(pPhone));
    if (pCountry) setCountry(decodeURIComponent(pCountry));
    if (pCity) setCity(decodeURIComponent(pCity));
    if (pState) setState(decodeURIComponent(pState));
    if (pAddress) setAddressLine1(decodeURIComponent(pAddress));

    if (hasPre) {
      setIsPrefilled(true);
    }
  }, [searchParams]);

  const handleCurrencyChange = (newCurr) => {
    setCurrency(newCurr);
    if (newCurr === "USD" && country === "India") {
      setCountry("United States");
    } else if (newCurr === "INR" && country === "United States") {
      setCountry("India");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 1) {
      setError("Please enter a valid payment amount (minimum 1.00).");
      return;
    }

    if (!customerName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!customerEmail.trim() || !customerEmail.includes("@")) {
      setError("Please enter a valid email address for your payment receipt.");
      return;
    }

    if (!customerPhone.trim() || customerPhone.length < 8) {
      setError("Please enter a valid contact phone number.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        amount: parsedAmount,
        currency,
        note: note.trim() || "StyleNest Direct Payment",
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim(),
        addressLine1: addressLine1.trim() || "Direct Settlement Address",
        addressLine2: addressLine2.trim() || "",
        city: city.trim() || (currency === "USD" ? "New York" : "Mumbai"),
        state: state.trim() || (currency === "USD" ? "NY" : "Maharashtra"),
        postalCode: postalCode.trim() || (currency === "USD" ? "10001" : "400001"),
        country: country.trim() || (currency === "USD" ? "United States" : "India"),
      };

      const res = await initiateQuickPayment(payload);

      if (res && res.redirectUrl) {
        window.location.href = res.redirectUrl;
      } else {
        throw new Error("Payment gateway did not provide a redirect URL. Please try again.");
      }
    } catch (err) {
      console.error("Payment initiation failed:", err);
      setError(err.message || "Failed to initiate payment. Please verify your details and try again.");
      setLoading(false);
    }
  };

  const currencySymbol = currency === "USD" ? "$" : "₹";

  return (
    <PageFade>
      <div className="min-h-screen bg-gradient-to-b from-background via-muted/30 to-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Header Banner */}
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider mb-4">
              <ShieldCheck className="h-4 w-4" />
              Verified Direct Payment Portal
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight font-serif">
              StyleNest Quick Pay
            </h1>
            <p className="mt-2 text-sm sm:text-base text-muted-foreground">
              Direct checkout for wholesale orders, custom batches, and negotiated settlements. Instant, seamless & secure.
            </p>

            {isPrefilled && (
              <div className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
                <Sparkles className="h-4 w-4 shrink-0" />
                Custom payment details pre-filled by StyleNest sales desk
              </div>
            )}
          </div>

          {error && (
            <div className="mb-8 p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive flex items-start gap-3">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold">Unable to proceed</p>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Main Grid: Form Left, Summary Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Form Section */}
            <div className="lg:col-span-7 bg-card rounded-2xl border border-border shadow-sm p-6 sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 1. Payment Details */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                        1
                      </span>
                      Payment Amount & Currency
                    </h2>

                    {/* Currency Selector */}
                    <div className="inline-flex p-1 rounded-xl bg-muted border border-border/80">
                      <button
                        type="button"
                        onClick={() => handleCurrencyChange("INR")}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                          currency === "INR"
                            ? "bg-card text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        ₹ INR (India)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCurrencyChange("USD")}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                          currency === "USD"
                            ? "bg-card text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        $ USD (Global)
                      </button>
                    </div>
                  </div>

                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-muted-foreground font-semibold text-xl">
                      {currencySymbol}
                    </div>
                    <input
                      type="number"
                      step="any"
                      min="1"
                      required
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-input bg-background text-2xl font-bold text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Enter the exact agreed settlement amount in {currency}.
                  </p>
                </div>

                {/* Purpose / Remarks */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Order Remarks / Purpose (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 20 Pcs T-Shirt Wholesale, Sample Order, Export Batch #12"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                  />
                </div>

                {/* 2. Customer Information */}
                <div className="pt-4 border-t border-border">
                  <h2 className="text-base font-bold text-foreground flex items-center gap-2 mb-4">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                      2
                    </span>
                    Customer & Billing Contact
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                        Full Name / Business Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="John Doe / Style Traders LLC"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                          Email Address * (For Receipt)
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="client@company.com"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                          Phone / WhatsApp Number *
                        </label>
                        <input
                          type="tel"
                          required
                          placeholder={currency === "USD" ? "+1 555 019 2834" : "+91 98765 43210"}
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Address Information */}
                <div className="pt-4 border-t border-border">
                  <h2 className="text-base font-bold text-foreground flex items-center gap-2 mb-4">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                      3
                    </span>
                    Shipping / Invoicing Address
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                        Street Address
                      </label>
                      <input
                        type="text"
                        placeholder="Plot / Street / Suite No."
                        value={addressLine1}
                        onChange={(e) => setAddressLine1(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                      />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                          City
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Mumbai / NY"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                          State / Region
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. MH / NY"
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                        />
                      </div>

                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                          Postal / ZIP
                        </label>
                        <input
                          type="text"
                          placeholder="Postal code"
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                        Country
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. India, United States, United Kingdom, Canada, UAE"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 px-6 rounded-xl bg-primary text-primary-foreground font-bold text-base shadow-lg hover:shadow-xl hover:bg-primary/95 transition duration-200 flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <div className="h-5 w-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                        Redirecting to PayGlocal Gateway...
                      </>
                    ) : (
                      <>
                        <Lock className="h-5 w-5" />
                        Pay Securely {amount ? `${currencySymbol}${parseFloat(amount || 0).toLocaleString()}` : ""}
                        <ArrowRight className="h-5 w-5" />
                      </>
                    )}
                  </button>

                  <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <span>256-Bit SSL Encrypted | PayGlocal Global Gateway</span>
                  </div>
                </div>
              </form>
            </div>

            {/* Right Summary Section */}
            <div className="lg:col-span-5 space-y-6">
              {/* Settlement Card */}
              <div className="bg-card rounded-2xl border border-border shadow-sm p-6 sticky top-24">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">
                  Payment Summary
                </h3>

                <div className="space-y-3 pb-4 border-b border-border">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Settlement Currency</span>
                    <span className="font-semibold text-foreground">{currency}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Remarks</span>
                    <span className="font-medium text-foreground truncate max-w-[180px]">
                      {note || "Direct Order Payment"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Gateway Surcharge</span>
                    <span className="text-emerald-600 font-medium">Free (Zero Fees)</span>
                  </div>
                </div>

                <div className="pt-4 pb-4 border-b border-border">
                  <div className="flex justify-between items-baseline">
                    <span className="text-base font-bold text-foreground">Total Payable</span>
                    <div className="text-right">
                      <span className="text-3xl font-extrabold text-foreground font-serif">
                        {currencySymbol}
                        {amount && !isNaN(amount)
                          ? parseFloat(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                          : "0.00"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Accepted Cards & Benefits */}
                <div className="pt-5 space-y-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Accepted International Payment Methods
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 border border-border/60">
                      <CreditCard className="h-4 w-4 text-primary" />
                      <span>Visa & Mastercard</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 border border-border/60">
                      <Globe2 className="h-4 w-4 text-primary" />
                      <span>Amex & RuPay</span>
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-2 text-xs text-muted-foreground">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Direct official confirmation & receipt emailed upon completion</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>PCI-DSS Level 1 compliant secure checkout powered by PayGlocal</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Real-time reconciliation with StyleNest dispatch desk</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border/60 text-center">
                    <p className="text-[11px] text-muted-foreground">
                      StyleNest Fashion Pvt. Ltd. | Exports & Wholesale Settlements
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageFade>
  );
}
