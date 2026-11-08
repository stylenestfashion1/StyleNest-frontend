import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { PageFade } from "../components/Reveal";
import { initiateQuickPayment } from "../api/quickPay";
import { lookupPostalCode } from "../api/addresses";
import {
  ShieldCheck,
  CreditCard,
  Lock,
  ArrowRight,
  Globe2,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  Loader2,
  Check,
} from "lucide-react";

export const COUNTRY_OPTIONS = [
  { code: "US", name: "United States", dialCode: "+1", flag: "🇺🇸", placeholder: "(555) 019-2834", postalLabel: "ZIP Code (5 digits)" },
  { code: "GB", name: "United Kingdom", dialCode: "+44", flag: "🇬🇧", placeholder: "7911 123456", postalLabel: "Postal Code (e.g. SW1A, EC1A 1BB)" },
  { code: "CA", name: "Canada", dialCode: "+1", flag: "🇨🇦", placeholder: "(416) 555-0199", postalLabel: "Postal Code (e.g. M5V 3L9)" },
  { code: "AE", name: "United Arab Emirates", dialCode: "+971", flag: "🇦🇪", placeholder: "50 123 4567", postalLabel: "PO Box / Area Code" },
  { code: "AU", name: "Australia", dialCode: "+61", flag: "🇦🇺", placeholder: "412 345 678", postalLabel: "Postal Code (4 digits)" },
  { code: "SG", name: "Singapore", dialCode: "+65", flag: "🇸🇬", placeholder: "8123 4567", postalLabel: "Postal Code (6 digits)" },
  { code: "DE", name: "Germany", dialCode: "+49", flag: "🇩🇪", placeholder: "151 23456789", postalLabel: "PLZ / Postal (5 digits)" },
  { code: "FR", name: "France", dialCode: "+33", flag: "🇫🇷", placeholder: "6 12 34 56 78", postalLabel: "Code Postal (5 digits)" },
  { code: "SA", name: "Saudi Arabia", dialCode: "+966", flag: "🇸🇦", placeholder: "50 123 4567", postalLabel: "Postal Code (5 digits)" },
  { code: "MY", name: "Malaysia", dialCode: "+60", flag: "🇲🇾", placeholder: "12-345 6789", postalLabel: "Postal Code (5 digits)" },
  { code: "NZ", name: "New Zealand", dialCode: "+64", flag: "🇳🇿", placeholder: "21 123 4567", postalLabel: "Postal Code (4 digits)" },
  { code: "ZA", name: "South Africa", dialCode: "+27", flag: "🇿🇦", placeholder: "71 123 4567", postalLabel: "Postal Code (4 digits)" },
  { code: "IE", name: "Ireland", dialCode: "+353", flag: "🇮🇪", placeholder: "85 123 4567", postalLabel: "Eircode" },
  { code: "NL", name: "Netherlands", dialCode: "+31", flag: "🇳🇱", placeholder: "6 12345678", postalLabel: "Postcode" },
  { code: "IT", name: "Italy", dialCode: "+39", flag: "🇮🇹", placeholder: "312 3456789", postalLabel: "CAP (5 digits)" },
  { code: "ES", name: "Spain", dialCode: "+34", flag: "🇪🇸", placeholder: "612 34 56 78", postalLabel: "Código Postal (5 digits)" },
  { code: "CH", name: "Switzerland", dialCode: "+41", flag: "🇨🇭", placeholder: "78 123 45 67", postalLabel: "PLZ (4 digits)" },
  { code: "KW", name: "Kuwait", dialCode: "+965", flag: "🇰🇼", placeholder: "9123 4567", postalLabel: "Postal Code" },
  { code: "QA", name: "Qatar", dialCode: "+974", flag: "🇶🇦", placeholder: "3312 3456", postalLabel: "Zone / PO Box" },
  { code: "OM", name: "Oman", dialCode: "+968", flag: "🇴🇲", placeholder: "9123 4567", postalLabel: "Postal Code" },
  { code: "BH", name: "Bahrain", dialCode: "+973", flag: "🇧🇭", placeholder: "3612 3456", postalLabel: "Block / Area" },
  { code: "JP", name: "Japan", dialCode: "+81", flag: "🇯🇵", placeholder: "90 1234 5678", postalLabel: "Postal Code (7 digits)" },
  { code: "KR", name: "South Korea", dialCode: "+82", flag: "🇰🇷", placeholder: "10 1234 5678", postalLabel: "Postal Code (5 digits)" },
  { code: "TH", name: "Thailand", dialCode: "+66", flag: "🇹🇭", placeholder: "81 234 5678", postalLabel: "Postal Code (5 digits)" },
  { code: "ID", name: "Indonesia", dialCode: "+62", flag: "🇮🇩", placeholder: "812-3456-7890", postalLabel: "Kode Pos (5 digits)" },
  { code: "PH", name: "Philippines", dialCode: "+63", flag: "🇵🇭", placeholder: "917 123 4567", postalLabel: "ZIP Code (4 digits)" },
  { code: "BD", name: "Bangladesh", dialCode: "+880", flag: "🇧🇩", placeholder: "1712-345678", postalLabel: "Postal Code (4 digits)" },
  { code: "LK", name: "Sri Lanka", dialCode: "+94", flag: "🇱🇰", placeholder: "71 234 5678", postalLabel: "Postal Code (5 digits)" },
  { code: "NP", name: "Nepal", dialCode: "+977", flag: "🇳🇵", placeholder: "984-1234567", postalLabel: "Postal Code (5 digits)" },
  { code: "IN", name: "India", dialCode: "+91", flag: "🇮🇳", placeholder: "98765 43210", postalLabel: "PIN Code (6 digits)" },
  { code: "OTHER", name: "Other Country", dialCode: "+1", flag: "🌐", placeholder: "Contact number", postalLabel: "Postal / ZIP Code" }
];

export default function QuickPay() {
  const [searchParams] = useSearchParams();

  // Fixed International Currency: USD only
  const currency = "USD";
  const currencySymbol = "$";

  // Form State
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");

  // Country & Dial Code (defaults to US)
  const [selectedCountryCode, setSelectedCountryCode] = useState("US");
  const [dialCode, setDialCode] = useState("+1");
  const [customerPhone, setCustomerPhone] = useState("");

  // Address
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");

  // Postal lookup feedback
  const [postalLookupLoading, setPostalLookupLoading] = useState(false);
  const [postalAutofilled, setPostalAutofilled] = useState(false);
  const lookupTimeoutRef = useRef(null);

  const [isPrefilled, setIsPrefilled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Current country metadata
  const currentCountryConfig =
    COUNTRY_OPTIONS.find((c) => c.code === selectedCountryCode) || COUNTRY_OPTIONS[0];

  // Helper to match country name/code to our dataset
  const findCountryOption = (str) => {
    if (!str) return null;
    const s = str.trim().toLowerCase();
    return COUNTRY_OPTIONS.find(
      (c) =>
        c.code.toLowerCase() === s ||
        c.name.toLowerCase() === s ||
        (s === "uk" && c.code === "GB") ||
        (s === "usa" && c.code === "US") ||
        (s === "uae" && c.code === "AE")
    );
  };

  // Helper to extract dial code from phone string
  const splitPhoneAndDialCode = (rawPhone) => {
    if (!rawPhone) return { dial: null, num: "" };
    const cleaned = rawPhone.trim();
    if (cleaned.startsWith("+")) {
      const sortedCodes = [...COUNTRY_OPTIONS].sort(
        (a, b) => b.dialCode.length - a.dialCode.length
      );
      for (const opt of sortedCodes) {
        if (cleaned.startsWith(opt.dialCode)) {
          return {
            dial: opt.dialCode,
            num: cleaned.slice(opt.dialCode.length).trim(),
            countryCode: opt.code,
          };
        }
      }
    }
    return { dial: null, num: cleaned };
  };

  // Parse URL parameters on initial load
  useEffect(() => {
    const pAmount = searchParams.get("amount");
    const pNote = searchParams.get("note") || searchParams.get("desc") || searchParams.get("remarks");
    const pName = searchParams.get("name") || searchParams.get("customer");
    const pEmail = searchParams.get("email");
    const pPhone = searchParams.get("phone");
    const pCountry = searchParams.get("country");
    const pCity = searchParams.get("city");
    const pState = searchParams.get("state");
    const pPostal = searchParams.get("postal") || searchParams.get("zip") || searchParams.get("pin");
    const pAddress = searchParams.get("address");

    let hasPre = false;

    if (pAmount && !isNaN(pAmount) && Number(pAmount) > 0) {
      setAmount(pAmount);
      hasPre = true;
    }

    let detectedCountry = null;
    if (pCountry) {
      detectedCountry = findCountryOption(pCountry);
      if (detectedCountry) {
        setSelectedCountryCode(detectedCountry.code);
        setDialCode(detectedCountry.dialCode);
        if (detectedCountry.code === "SG") {
          if (!pCity) setCity("Singapore");
          if (!pState) setState("Singapore");
        }
        hasPre = true;
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

    if (pPhone) {
      const { dial, num, countryCode } = splitPhoneAndDialCode(decodeURIComponent(pPhone));
      if (dial) setDialCode(dial);
      if (countryCode && !detectedCountry) setSelectedCountryCode(countryCode);
      setCustomerPhone(num);
      hasPre = true;
    }

    if (pCity) setCity(decodeURIComponent(pCity));
    if (pState) setState(decodeURIComponent(pState));
    if (pPostal) setPostalCode(decodeURIComponent(pPostal));
    if (pAddress) setAddressLine1(decodeURIComponent(pAddress));

    if (hasPre) {
      setIsPrefilled(true);
    }
  }, [searchParams]);

  // Phone Handler
  const handlePhoneChange = (val) => {
    setCustomerPhone(val);
  };

  // Country Selection Change
  const handleCountryChange = (newCode) => {
    setSelectedCountryCode(newCode);
    setPostalAutofilled(false);

    const match = COUNTRY_OPTIONS.find((c) => c.code === newCode);
    if (match && match.code !== "OTHER") {
      setDialCode(match.dialCode);
    }

    if (postalCode.trim().length >= 2) {
      triggerPostalLookup(postalCode.trim(), newCode);
    }
  };

  // Debounced Postal / PIN Code Lookup
  const triggerPostalLookup = (code, countryCode) => {
    if (lookupTimeoutRef.current) {
      clearTimeout(lookupTimeoutRef.current);
    }

    const clean = code.trim();
    if (!clean || clean.length < 2) {
      setPostalAutofilled(false);
      return;
    }

    if (countryCode === "OTHER") {
      return;
    }

    // Fast check: length requirements before triggering network lookup
    if (countryCode === "US" && clean.length !== 5) return;
    if (countryCode === "IN" && clean.length !== 6) return;
    if (countryCode === "SG" && clean.length !== 6) return;
    if (countryCode === "AU" && clean.length !== 4) return;

    lookupTimeoutRef.current = setTimeout(async () => {
      setPostalLookupLoading(true);
      try {
        let res = await lookupPostalCode(clean, countryCode);

        // Fallback for Canada FSA (zippopotam expects 3 chars like M5V)
        if ((!res || !res.found) && countryCode === "CA" && clean.length >= 3) {
          const fsa = clean.replace(/\s+/g, "").slice(0, 3);
          res = await lookupPostalCode(fsa, "CA");
        }

        if (res && res.found) {
          if (res.city) setCity(res.city);
          if (res.state) setState(res.state);
          setPostalAutofilled(true);
        } else {
          setPostalAutofilled(false);
        }
      } catch (err) {
        console.warn("Postal lookup warning:", err?.message || err);
        setPostalAutofilled(false);
      } finally {
        setPostalLookupLoading(false);
      }
    }, 380);
  };

  const handlePostalChange = (e) => {
    const val = e.target.value;
    setPostalCode(val);
    triggerPostalLookup(val, selectedCountryCode);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 1) {
      setError("Please enter a valid payment amount (minimum $1.00 USD).");
      return;
    }

    if (!customerName.trim()) {
      setError("Please enter your full customer or business name.");
      return;
    }

    if (!customerEmail.trim() || !customerEmail.includes("@")) {
      setError("Please enter a valid email address for your official receipt.");
      return;
    }

    const cleanPhone = customerPhone.trim();
    if (!cleanPhone || cleanPhone.length < 5) {
      setError("Please enter a valid contact phone or WhatsApp number.");
      return;
    }

    if (!addressLine1.trim()) {
      setError("Please enter your delivery street address.");
      return;
    }

    if (!city.trim()) {
      setError("Please enter your city or suburb.");
      return;
    }

    if (!postalCode.trim()) {
      setError("Please enter your postal / ZIP code.");
      return;
    }

    const AU_STATES = ["nsw", "vic", "qld", "wa", "sa", "tas", "act", "nt", "new south wales", "victoria", "queensland", "western australia", "south australia", "tasmania", "australian capital territory", "northern territory"];
    const CA_PROVINCES = ["on", "bc", "qc", "ab", "mb", "sk", "ns", "nb", "nl", "pe", "ontario", "quebec", "british columbia", "alberta", "manitoba", "saskatchewan"];
    const US_STATES = ["al","ak","az","ar","ca","co","ct","de","fl","ga","hi","id","il","in","ia","ks","ky","la","me","md","ma","mi","mn","ms","mo","mt","ne","nv","nh","nj","nm","ny","nc","nd","oh","ok","or","pa","ri","sc","sd","tn","tx","ut","vt","va","wa","wv","wi","wy"];

    const cityLower = city.trim().toLowerCase();
    if (
      (selectedCountryCode === "AU" && AU_STATES.includes(cityLower)) ||
      (selectedCountryCode === "CA" && CA_PROVINCES.includes(cityLower)) ||
      (selectedCountryCode === "US" && US_STATES.includes(cityLower))
    ) {
      setError(`"${city.trim()}" is a state / province abbreviation. Please enter your actual town, city, or suburb name.`);
      return;
    }

    // Auto-clean Australian city typos where state is appended like 'High WycombeWA'
    let cleanedCity = city.trim();
    if (selectedCountryCode === "AU") {
      cleanedCity = cleanedCity.replace(/(wa|vic|nsw|qld|sa|tas|act|nt)$/i, "").trim() || cleanedCity;
    }

    const fullPhoneNumber = `${dialCode} ${cleanPhone}`.trim();
    const countryName = currentCountryConfig.name;

    setLoading(true);

    try {
      const payload = {
        amount: parsedAmount,
        currency: "USD",
        note: note.trim() || "StyleNest Fashion International Wholesale Settlement",
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: fullPhoneNumber,
        addressLine1: addressLine1.trim(),
        addressLine2: addressLine2.trim() || "",
        city: cleanedCity,
        state: state.trim() || "",
        postalCode: postalCode.trim(),
        country: countryName,
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

  return (
    <PageFade>
      <div className="py-5 sm:py-12 px-2.5 sm:px-6 lg:px-8 w-full max-w-full">
        <div className="max-w-5xl mx-auto w-full">
          {/* Header Banner */}
          <div className="text-center max-w-2xl mx-auto mb-5 sm:mb-10 px-1 w-full">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-2.5 sm:mb-4 max-w-full">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Verified B2B Settlement Portal</span>
            </div>
            <h1 className="text-xl sm:text-3xl font-extrabold text-foreground tracking-tight font-serif leading-tight">
              StyleNest Fashion Quick Pay
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Direct checkout for international wholesale orders, custom export batches, and global settlements.
            </p>

            {isPrefilled && (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium text-left">
                <Sparkles className="h-4 w-4 shrink-0" />
                <span>Custom export invoice details pre-filled by StyleNest Fashion sales desk</span>
              </div>
            )}
          </div>

          {error && (
            <div className="mb-5 sm:mb-8 p-3 sm:p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive flex items-start gap-2.5 sm:gap-3">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm">
                <p className="font-semibold">Unable to proceed</p>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Main Grid: Form Left, Summary Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 items-start w-full">
            {/* Form Section */}
            <div className="lg:col-span-7 bg-card rounded-xl sm:rounded-2xl border border-border shadow-sm p-3.5 sm:p-6 lg:p-8 w-full">
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                {/* 1. Payment Details (Fixed USD) */}
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between items-start gap-2 mb-3">
                    <h2 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                      <span className="flex h-5 w-5 sm:h-6 sm:w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] sm:text-xs font-bold">
                        1
                      </span>
                      Payment Amount (USD)
                    </h2>

                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary text-[10px] sm:text-xs font-bold tracking-wide">
                      <Globe2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                      <span>USD (Global Settlement)</span>
                    </div>
                  </div>

                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 sm:pl-4 text-muted-foreground font-semibold text-lg sm:text-xl">
                      $
                    </div>
                    <input
                      type="number"
                      step="any"
                      min="1"
                      required
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 rounded-xl border border-input bg-background text-lg sm:text-2xl font-bold text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                    />
                  </div>
                  <p className="mt-1 text-[11px] sm:text-xs text-muted-foreground">
                    Enter the agreed settlement amount in USD ($).
                  </p>
                </div>

                {/* Purpose / Remarks */}
                <div>
                  <label className="block text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Order Remarks / Export Invoice Note (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 50 Pcs Wholesale Kurti / Dress Batch #12"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-input bg-background text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                  />
                </div>

                {/* 2. Customer Information */}
                <div className="pt-3.5 sm:pt-4 border-t border-border">
                  <h2 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2 mb-3">
                    <span className="flex h-5 w-5 sm:h-6 sm:w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] sm:text-xs font-bold">
                      2
                    </span>
                    Customer & Billing Contact
                  </h2>

                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <label className="block text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                        Full Name / Business Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. John Doe / Style Traders LLC"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-input bg-background text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                          Email Address * (For Receipt)
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="client@company.com"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-input bg-background text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                        />
                      </div>

                      {/* Phone with International Calling Code Dropdown */}
                      <div>
                        <label className="block text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                          Phone / WhatsApp Number *
                        </label>
                        <div className="flex rounded-xl border border-input bg-background focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition overflow-hidden">
                          <select
                            value={selectedCountryCode}
                            onChange={(e) => handleCountryChange(e.target.value)}
                            className="px-2 sm:px-3 py-2 sm:py-2.5 bg-muted/60 text-xs sm:text-sm font-semibold text-foreground border-r border-input focus:outline-none cursor-pointer w-[90px] sm:w-[125px] shrink-0"
                            title="Select Country Calling Code"
                          >
                            {COUNTRY_OPTIONS.map((c) => (
                              <option key={c.code} value={c.code}>
                                {c.flag} {c.dialCode} ({c.name})
                              </option>
                            ))}
                          </select>

                          <input
                            type="tel"
                            required
                            placeholder={currentCountryConfig.placeholder}
                            value={customerPhone}
                            onChange={(e) => handlePhoneChange(e.target.value)}
                            className="flex-1 px-2.5 sm:px-3 py-2 sm:py-2.5 bg-transparent text-xs sm:text-sm text-foreground focus:outline-none placeholder:text-muted-foreground/60 min-w-0"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Address Information */}
                <div className="pt-3.5 sm:pt-4 border-t border-border">
                  <h2 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2 mb-3">
                    <span className="flex h-5 w-5 sm:h-6 sm:w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] sm:text-xs font-bold">
                      3
                    </span>
                    Shipping / Billing Address
                  </h2>

                  <div className="space-y-3 sm:space-y-4">
                    {/* Country Selector Dropdown */}
                    <div>
                      <label className="block text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                        Destination Country / Territory *
                      </label>
                      <div className="relative">
                        <select
                          value={selectedCountryCode}
                          onChange={(e) => handleCountryChange(e.target.value)}
                          className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-input bg-background text-xs sm:text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition cursor-pointer appearance-none truncate pr-9"
                        >
                          {COUNTRY_OPTIONS.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.flag} {c.name} {c.code !== "OTHER" ? `(${c.dialCode})` : ""}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 sm:px-4 text-muted-foreground">
                          <Globe2 className="h-4 w-4" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                        Street Address *
                      </label>
                      <input
                        type="text"
                        placeholder="Plot / Street / Suite No."
                        value={addressLine1}
                        onChange={(e) => setAddressLine1(e.target.value)}
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-input bg-background text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                      />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                      {/* PIN / ZIP with instant autofetch indicator */}
                      <div className="col-span-2 sm:col-span-1">
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            {selectedCountryCode === "IN"
                              ? "PIN Code"
                              : selectedCountryCode === "US"
                              ? "ZIP Code"
                              : "Postal / ZIP"}
                          </label>
                          {postalAutofilled && (
                            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                              <Check className="h-3 w-3" /> Autofilled
                            </span>
                          )}
                        </div>

                        <div className="relative">
                          <input
                            type="text"
                            placeholder={
                              selectedCountryCode === "US"
                                ? "5-digit ZIP"
                                : selectedCountryCode === "GB"
                                ? "e.g. SW1A, EC1A"
                                : "Postal code"
                            }
                            value={postalCode}
                            onChange={handlePostalChange}
                            className={`w-full px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl border ${
                              postalAutofilled ? "border-emerald-500/60 bg-emerald-500/5" : "border-input bg-background"
                            } text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition pr-7 sm:pr-8`}
                          />
                          {postalLookupLoading && (
                            <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 sm:pr-3 pointer-events-none text-muted-foreground">
                              <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin text-primary" />
                            </div>
                          )}
                        </div>
                        <p className="mt-1 text-[10px] sm:text-[11px] text-muted-foreground truncate">
                          {currentCountryConfig.postalLabel}
                        </p>
                      </div>

                      <div>
                        <label className="block text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                          City / Suburb *
                        </label>
                        <input
                          type="text"
                          placeholder="City / District"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl border border-input bg-background text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                          State / Region
                        </label>
                        <input
                          type="text"
                          placeholder="State / Province"
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          className="w-full px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl border border-input bg-background text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 sm:py-4 px-4 sm:px-6 rounded-xl bg-primary text-primary-foreground font-bold text-sm sm:text-base shadow-lg hover:shadow-xl hover:bg-primary/95 transition duration-200 flex items-center justify-center gap-2 sm:gap-3 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <div className="h-4 w-4 sm:h-5 sm:w-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin shrink-0" />
                        <span>Redirecting to PayGlocal Gateway...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                        <span className="truncate">
                          Pay Securely {amount ? `$${parseFloat(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD` : "USD"}
                        </span>
                        <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                      </>
                    )}
                  </button>

                  <div className="mt-3 flex items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground text-center">
                    <ShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600 shrink-0" />
                    <span>256-Bit SSL Encrypted | PayGlocal Global Gateway</span>
                  </div>
                </div>
              </form>
            </div>

            {/* Right Summary Section */}
            <div className="lg:col-span-5 space-y-4 sm:space-y-6 w-full">
              {/* Settlement Card */}
              <div className="bg-card rounded-xl sm:rounded-2xl border border-border shadow-sm p-3.5 sm:p-6 sticky top-20 sm:top-24 w-full">
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 sm:mb-4">
                  Export Invoice & Settlement Summary
                </h3>

                <div className="space-y-2.5 sm:space-y-3 pb-3 sm:pb-4 border-b border-border">
                  <div className="flex justify-between items-center text-xs sm:text-sm">
                    <span className="text-muted-foreground">Settlement Currency</span>
                    <span className="font-semibold text-foreground">USD ($)</span>
                  </div>
                  <div className="flex justify-between items-center text-xs sm:text-sm">
                    <span className="text-muted-foreground">Destination</span>
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <span>{currentCountryConfig.flag}</span>
                      <span>{currentCountryConfig.name}</span>
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs sm:text-sm">
                    <span className="text-muted-foreground">Remarks</span>
                    <span className="font-medium text-foreground truncate max-w-[150px] sm:max-w-[180px]">
                      {note || "International Wholesale Settlement"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs sm:text-sm">
                    <span className="text-muted-foreground">Gateway Surcharge</span>
                    <span className="text-emerald-600 font-medium">Free (Zero Fees)</span>
                  </div>
                </div>

                <div className="pt-3 sm:pt-4 pb-3 sm:pb-4 border-b border-border">
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm sm:text-base font-bold text-foreground">Total Payable</span>
                    <div className="text-right">
                      <span className="text-2xl sm:text-3xl font-extrabold text-foreground font-serif">
                        $
                        {amount && !isNaN(amount)
                          ? parseFloat(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                          : "0.00"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Accepted Cards & Benefits */}
                <div className="pt-4 sm:pt-5 space-y-3.5 sm:space-y-4">
                  <p className="text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Accepted Global Payment Methods
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-[11px] sm:text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-lg bg-muted/50 border border-border/60">
                      <CreditCard className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0" />
                      <span className="truncate">Visa & Mastercard</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-lg bg-muted/50 border border-border/60">
                      <Globe2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0" />
                      <span className="truncate">Amex & Diners</span>
                    </div>
                  </div>

                  <div className="space-y-2 sm:space-y-2.5 pt-1 sm:pt-2 text-[11px] sm:text-xs text-muted-foreground">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Official export payment receipt automatically dispatched to your email</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>PCI-DSS Level 1 compliant secure checkout powered by PayGlocal</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Immediate batch reconciliation with StyleNest Fashion export desk</span>
                    </div>
                  </div>

                  <div className="pt-3 sm:pt-4 border-t border-border/60 text-center">
                    <p className="text-[10px] sm:text-[11px] text-muted-foreground">
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
