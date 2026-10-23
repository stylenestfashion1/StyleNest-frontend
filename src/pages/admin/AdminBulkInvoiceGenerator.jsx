import React, { useState, useMemo, useRef } from "react";
import {
  FileText,
  Download,
  Plus,
  Trash2,
  RefreshCw,
  Building2,
  Globe2,
  CheckCircle2,
  User,
  MapPin,
  CreditCard,
  Package,
  Layers,
  Sparkles,
  Loader2,
  Check,
} from "lucide-react";
import { generateCustomInvoicePdf } from "../../utils/customInvoicePdf";
import { lookupPostalCode } from "../../api/addresses";
import { COUNTRY_OPTIONS } from "../QuickPay";

export default function AdminBulkInvoiceGenerator() {
  const [mode, setMode] = useState("international"); // "international" | "domestic"
  const [taxInclusive, setTaxInclusive] = useState(true);

  // 1. Invoice & Order Details
  const [invoiceNo, setInvoiceNo] = useState(
    () => `INV-BO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [invoiceDate, setInvoiceDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [orderNo, setOrderNo] = useState(
    () => `SN-BO-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [paymentMode, setPaymentMode] = useState("Online (PayGlocal Gateway)");
  const [paymentStatus, setPaymentStatus] = useState("PAID (Settled)");
  const [placeOfSupply, setPlaceOfSupply] = useState("Australia (Code 96 - Outside India)");

  // 2. Customer Details
  const [selectedCountryCode, setSelectedCountryCode] = useState("AU"); // "IN" for domestic, "AU" for international
  const [customerName, setCustomerName] = useState("Wallace Don Sempf");
  const [customerCompany, setCustomerCompany] = useState("Sempf Apparel & Boutique");
  const [customerPhone, setCustomerPhone] = useState("+61 417754030");
  const [customerEmail, setCustomerEmail] = useState("wallace.sempf0@bigpond.com");
  const [customerAddress, setCustomerAddress] = useState("896 Jondaryan-Saint Ruth Rd");
  const [customerCity, setCustomerCity] = useState("Bowenville");
  const [customerState, setCustomerState] = useState("QLD");
  const [customerPostalCode, setCustomerPostalCode] = useState("4404");
  const [customerCountry, setCustomerCountry] = useState("Australia");
  const [customerGstin, setCustomerGstin] = useState("");

  // Postal lookup state
  const [postalLookupLoading, setPostalLookupLoading] = useState(false);
  const [postalAutofilled, setPostalAutofilled] = useState(false);
  const lookupTimeoutRef = useRef(null);

  // 3. Line Items
  const [items, setItems] = useState([
    {
      id: "1",
      name: "Cotton Round Neck Export T-Shirts",
      desc: "Fabric: 100% Combed Cotton 180 GSM | Assorted Sizes",
      hsn: "6109",
      qty: 10,
      price: 8.0,
      gstRate: "0% (LUT)",
    },
    {
      id: "2",
      name: "Men's Stretch Lycra Trackpants / Lowers",
      desc: "Fabric: 4-Way Stretch Lycra, Export Quality",
      hsn: "6203",
      qty: 20,
      price: 6.5,
      gstRate: "0% (LUT)",
    },
    {
      id: "3",
      name: "Women's Rayon Flared Embroidered Plazos",
      desc: "Fabric: Heavy Rayon, Hand-Embroidered Hemline",
      hsn: "6204",
      qty: 20,
      price: 7.0,
      gstRate: "0% (LUT)",
    },
  ]);

  // 4. Shipping & Discounts
  const [shippingFee, setShippingFee] = useState(0);

  // Automatic Postal / PIN Code Lookup
  const triggerPostalLookup = (code, countryCode) => {
    if (lookupTimeoutRef.current) {
      clearTimeout(lookupTimeoutRef.current);
    }

    const clean = code.trim();
    if (!clean || clean.length < 2) {
      setPostalAutofilled(false);
      return;
    }

    // Fast check: India needs 6 digits, US needs 5 digits
    if (countryCode === "IN" && clean.length !== 6) return;
    if (countryCode === "US" && clean.length !== 5) return;

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
          if (res.city) setCustomerCity(res.city);
          if (res.state) {
            setCustomerState(res.state);
            if (countryCode === "IN") {
              setPlaceOfSupply(`${res.state} - Inter-State`);
            }
          }
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
    }, 350);
  };

  const handlePostalChange = (val) => {
    setCustomerPostalCode(val);
    const countryCodeToUse = mode === "domestic" ? "IN" : selectedCountryCode;
    triggerPostalLookup(val, countryCodeToUse);
  };

  const handleCountryDropdownChange = (cCode) => {
    setSelectedCountryCode(cCode);
    const opt = COUNTRY_OPTIONS.find((c) => c.code === cCode);
    if (opt) {
      setCustomerCountry(opt.name);
      setPlaceOfSupply(`${opt.name} (Code 96 - Outside India)`);
    }
    if (customerPostalCode) {
      triggerPostalLookup(customerPostalCode, cCode);
    }
  };

  // Switch between Domestic and International with pre-sets
  const handleModeSwitch = (newMode) => {
    setMode(newMode);
    setPostalAutofilled(false);

    if (newMode === "domestic") {
      setSelectedCountryCode("IN");
      setPaymentMode("Bank Transfer (NEFT/RTGS)");
      setPlaceOfSupply("Gujarat (State Code: 24)");
      setCustomerCountry("India");
      setCustomerCity("Surat");
      setCustomerState("Gujarat");
      setCustomerPostalCode("395002");
      setCustomerGstin("24AAACA1234B1Z5");
      setItems([
        {
          id: "1",
          name: "Bio-Wash Cotton Round Neck T-Shirts",
          desc: "Fabric: 100% Combed Cotton 180 GSM",
          hsn: "6109",
          qty: 10,
          price: 350,
          gstRate: "5% (IGST)",
        },
        {
          id: "2",
          name: "Men's Stretch Lycra Trackpants / Lowers",
          desc: "Fabric: 4-Way Stretch Lycra, Zipper Pockets",
          hsn: "6203",
          qty: 20,
          price: 450,
          gstRate: "5% (IGST)",
        },
        {
          id: "3",
          name: "Women's Rayon Flared Embroidered Plazos",
          desc: "Fabric: Heavy Rayon, Premium Stitching",
          hsn: "6204",
          qty: 20,
          price: 500,
          gstRate: "5% (IGST)",
        },
      ]);
    } else {
      setSelectedCountryCode("AU");
      setPaymentMode("Online (PayGlocal Gateway)");
      setPlaceOfSupply("Australia (Code 96 - Outside India)");
      setCustomerCountry("Australia");
      setCustomerCity("Bowenville");
      setCustomerState("QLD");
      setCustomerPostalCode("4404");
      setCustomerGstin("");
      setItems([
        {
          id: "1",
          name: "Cotton Round Neck Export T-Shirts",
          desc: "Fabric: 100% Combed Cotton 180 GSM | Export Quality",
          hsn: "6109",
          qty: 10,
          price: 8.0,
          gstRate: "0% (LUT)",
        },
        {
          id: "2",
          name: "Men's Stretch Lycra Trackpants / Lowers",
          desc: "Fabric: 4-Way Stretch Lycra, Export Quality",
          hsn: "6203",
          qty: 20,
          price: 6.5,
          gstRate: "0% (LUT)",
        },
        {
          id: "3",
          name: "Women's Rayon Flared Embroidered Plazos",
          desc: "Fabric: Heavy Rayon, Hand-Embroidered Hemline",
          hsn: "6204",
          qty: 20,
          price: 7.0,
          gstRate: "0% (LUT)",
        },
      ]);
    }
  };

  // Item Handlers
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        name: mode === "international" ? "Export Garment Item" : "Wholesale Apparel Item",
        desc: "Regular Fit | Export Quality Packaging",
        hsn: "6204",
        qty: 10,
        price: mode === "international" ? 10.0 : 400.0,
        gstRate: mode === "international" ? "0% (LUT)" : "5% (IGST)",
      },
    ]);
  };

  const handleRemoveItem = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateItem = (id, field, value) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  // Live Financial Computations
  const calculations = useMemo(() => {
    const totalQty = items.reduce((acc, it) => acc + (Number(it.qty) || 0), 0);
    const rawSubtotal = items.reduce(
      (acc, it) => acc + (Number(it.qty) || 0) * (Number(it.price) || 0),
      0
    );

    const isExp = mode === "international";
    const curSymbol = isExp ? "$" : "Rs. ";
    const cur = isExp ? "USD" : "INR";

    let taxable = rawSubtotal;
    let taxAmount = 0;
    let grandTotal = rawSubtotal + Number(shippingFee || 0);

    if (!isExp) {
      if (taxInclusive) {
        // Price includes 5% GST
        taxable = rawSubtotal / 1.05;
        taxAmount = rawSubtotal - taxable;
        grandTotal = rawSubtotal + Number(shippingFee || 0);
      } else {
        // Tax is added on top of price
        taxable = rawSubtotal;
        taxAmount = taxable * 0.05;
        grandTotal = taxable + taxAmount + Number(shippingFee || 0);
      }
    }

    return {
      totalQty,
      rawSubtotal,
      taxable,
      taxAmount,
      grandTotal,
      curSymbol,
      cur,
    };
  }, [items, mode, taxInclusive, shippingFee]);

  // Download Trigger
  const handleGeneratePdf = () => {
    const isExp = mode === "international";

    const formattedItems = items.map((it) => {
      const q = Number(it.qty) || 0;
      const p = Number(it.price) || 0;
      return {
        name: it.name || "Item",
        desc: it.desc || "",
        hsn: it.hsn || "6204",
        qty: q,
        price: p,
        gstRate: it.gstRate || (isExp ? "0% (LUT)" : "5%"),
        lineTotal: q * p,
      };
    });

    const isMP =
      customerState.toLowerCase().includes("madhya") ||
      customerState.toLowerCase() === "mp";

    const summaryLines = isExp
      ? [
          ["Total Quantity:", `${calculations.totalQty} Pieces`, false],
          ["Taxable Amount:", `$${calculations.taxable.toFixed(2)}`, false],
          ["IGST (Export LUT 0%):", "$0.00", false],
          ["International Freight:", `$${Number(shippingFee).toFixed(2)}`, false],
          ["Round Off:", "0.00", false],
          ["LINE", "", false],
          ["Grand Total:", `$${calculations.grandTotal.toFixed(2)} USD`, true],
          ["Payment Status:", paymentStatus, true],
          ["Balance Due:", "$0.00", false],
        ]
      : [
          ["Total Quantity:", `${calculations.totalQty} Pieces`, false],
          ["Taxable Amount:", `Rs. ${calculations.taxable.toFixed(2)}`, false],
          [
            isMP ? "CGST (2.5%) + SGST (2.5%):" : "IGST (5.00%):",
            `Rs. ${calculations.taxAmount.toFixed(2)}`,
            false,
          ],
          ["Freight / Shipping:", `Rs. ${Number(shippingFee).toFixed(2)}`, false],
          ["Round Off:", "Rs. 0.00", false],
          ["LINE", "", false],
          ["Grand Total:", `Rs. ${calculations.grandTotal.toFixed(2)} INR`, true],
          ["Payment Status:", paymentStatus, true],
          ["Balance Due:", "Rs. 0.00", false],
        ];

    const complianceNotes = isExp
      ? [
          "• Statutory Export Clause: Supply meant for export under Letter of Undertaking (LUT) without payment of integrated tax (Zero-Rated Supply as per Sec 16 of IGST Act, 2017).",
          "• Export IGST Rate: 0.00% ($0.00 USD) - No Indian GST charged to foreign recipient.",
          `• Authorized Payment Gateway: ${paymentMode} | Place of Supply: ${placeOfSupply}`,
          "• Export Classification: Ready-to-wear apparel under HSN Chapters 61 & 62.",
        ]
      : [
          `• Supply Type: ${isMP ? "Intra-State (Within MP - CGST+SGST)" : "Inter-State B2B Supply (IGST)"}.`,
          "• Tax Applicability: GST @ 5.00% under HSN Chapter 61 & 62.",
          customerGstin
            ? `• Input Tax Credit (ITC): Fully eligible for recipient under GSTIN ${customerGstin}.`
            : "• Consumer / Retail Wholesale Sale (No ITC claimed).",
          "• Reverse Charge: No (Tax payable under forward charge mechanism).",
        ];

    const payload = {
      isExport: isExp,
      currency: calculations.cur,
      currencySymbol: calculations.curSymbol,
      titleText: isExp
        ? "TAX INVOICE / EXPORT COMMERCIAL INVOICE"
        : "TAX INVOICE (DOMESTIC B2B WHOLESALE)",
      invoiceNo,
      invoiceDate: new Date(invoiceDate).toLocaleDateString("en-IN"),
      orderNo,
      paymentMode,
      placeOfSupply,
      customer: {
        name: customerName,
        company: customerCompany,
        address: customerAddress,
        city: customerCity,
        state: customerState,
        postalCode: customerPostalCode,
        country: customerCountry,
        phone: customerPhone,
        email: customerEmail,
        gstin: customerGstin,
      },
      items: formattedItems,
      summaryLines,
      complianceNotes,
      amountInWords: `${calculations.grandTotal.toFixed(2)} ${calculations.cur}`,
    };

    generateCustomInvoicePdf(payload);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div>
          <h2 className="display text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Manual Bulk Invoice Generator
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Create, customize, and download official StyleNest tax invoices with automated PIN/ZIP lookup for both domestic and global orders.
          </p>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={handleGeneratePdf}
          className="btn-solid flex items-center gap-2 px-5 py-2.5 text-sm font-semibold shadow-lg hover:shadow-xl transition"
        >
          <Download className="h-4 w-4" />
          Download Invoice (PDF)
        </button>
      </div>

      {/* Mode Selector (Domestic vs International) */}
      <div className="rounded-2xl border bg-muted/20 p-4">
        <label className="label-xs mb-2 block font-bold text-foreground uppercase tracking-wider">
          Select Invoice Type & Region:
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleModeSwitch("domestic")}
            className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${
              mode === "domestic"
                ? "border-primary bg-primary/10 shadow-sm"
                : "border-border bg-card hover:border-primary/50"
            }`}
          >
            <Building2 className={`h-6 w-6 mt-0.5 shrink-0 ${mode === "domestic" ? "text-primary" : "text-muted-foreground"}`} />
            <div>
              <div className="flex items-center gap-2 font-bold text-sm">
                <span>Domestic Wholesale (India - INR)</span>
                {mode === "domestic" && <CheckCircle2 className="h-4 w-4 text-primary" />}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Indian states, 6-digit PIN code auto-fetch (City/State), B2B Buyer GSTIN support, CGST/SGST/IGST breakdown (₹ INR).
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleModeSwitch("international")}
            className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${
              mode === "international"
                ? "border-primary bg-primary/10 shadow-sm"
                : "border-border bg-card hover:border-primary/50"
            }`}
          >
            <Globe2 className={`h-6 w-6 mt-0.5 shrink-0 ${mode === "international" ? "text-primary" : "text-muted-foreground"}`} />
            <div>
              <div className="flex items-center gap-2 font-bold text-sm">
                <span>International Export (USD / Global)</span>
                {mode === "international" && <CheckCircle2 className="h-4 w-4 text-primary" />}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Global country dropdown, Postal/ZIP code auto-fetch (Australia, US, UK, Canada etc.), 0% LUT Tax ($ USD).
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Pre-filled Company Information Banner */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <Sparkles className="h-5 w-5 text-primary shrink-0" />
          <div>
            <span className="font-bold text-foreground">Verified Company Details Pre-filled: </span>
            <span className="text-muted-foreground">
              Style Nest Fashion Private Limited | GSTIN: <strong>23ABUCS8160R1ZA</strong> | CIN: <strong>U14101MP2026PTC086429</strong> | Indore, MP
            </span>
          </div>
        </div>
        <span className="label-xs rounded-full bg-primary/15 px-2.5 py-1 font-semibold text-primary">
          Official Signature Purple Template
        </span>
      </div>

      {/* 2-Column Form Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
        {/* Left Column: Invoice Meta */}
        <div className="rounded-2xl border bg-card p-5 space-y-4">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2 border-b pb-2">
            <FileText className="h-4 w-4 text-primary" />
            Invoice & Order Metadata
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-xs mb-1 block text-muted-foreground">Invoice Number</label>
              <input
                type="text"
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="label-xs mb-1 block text-muted-foreground">Invoice Date</label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-xs mb-1 block text-muted-foreground">Order / Ref Number</label>
              <input
                type="text"
                value={orderNo}
                onChange={(e) => setOrderNo(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="label-xs mb-1 block text-muted-foreground">Payment Status</label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="PAID (Settled)">PAID (Settled)</option>
                <option value="PENDING">PENDING</option>
                <option value="PARTIALLY PAID">PARTIALLY PAID</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-xs mb-1 block text-muted-foreground">Payment Mode / Gateway</label>
              <input
                type="text"
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                placeholder="e.g. PayGlocal / Bank Transfer"
                className="w-full rounded-lg border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="label-xs mb-1 block text-muted-foreground">Place of Supply</label>
              <input
                type="text"
                value={placeOfSupply}
                onChange={(e) => setPlaceOfSupply(e.target.value)}
                placeholder="e.g. Australia (Code 96) or Gujarat (24)"
                className="w-full rounded-lg border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Customer Details (Bill To) */}
        <div className="rounded-2xl border bg-card p-5 space-y-4">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2 border-b pb-2">
            <User className="h-4 w-4 text-primary" />
            Customer / Buyer Details (Bill To & Ship To)
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-xs mb-1 block text-muted-foreground">Customer Full Name *</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Wallace Don Sempf"
                className="w-full rounded-lg border bg-background px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="label-xs mb-1 block text-muted-foreground">Company / Business Name</label>
              <input
                type="text"
                value={customerCompany}
                onChange={(e) => setCustomerCompany(e.target.value)}
                placeholder="e.g. Sempf Boutique"
                className="w-full rounded-lg border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-xs mb-1 block text-muted-foreground">Phone Number</label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="e.g. +61 417754030"
                className="w-full rounded-lg border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="label-xs mb-1 block text-muted-foreground">Email Address</label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="e.g. client@example.com"
                className="w-full rounded-lg border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="label-xs mb-1 block text-muted-foreground">Street Address</label>
            <input
              type="text"
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              placeholder="e.g. 896 Jondaryan-Saint Ruth Rd"
              className="w-full rounded-lg border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Destination Country (Dropdown in International, fixed in Domestic) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label-xs mb-1 block text-muted-foreground">Destination Country</label>
              {mode === "international" ? (
                <select
                  value={selectedCountryCode}
                  onChange={(e) => handleCountryDropdownChange(e.target.value)}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  {COUNTRY_OPTIONS.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.name} {c.code !== "OTHER" ? `(${c.dialCode})` : ""}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  readOnly
                  value="India 🇮🇳"
                  className="w-full rounded-lg border bg-muted/40 px-3 py-2 text-xs font-semibold cursor-not-allowed"
                />
              )}
            </div>

            {/* PIN / ZIP Code with Live Auto-Lookup */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="label-xs font-bold text-primary flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {mode === "domestic" ? "PIN Code (6 digits) *" : "Postal / ZIP Code *"}
                </label>
                {postalLookupLoading && (
                  <span className="text-[10px] text-primary flex items-center gap-1">
                    <Loader2 className="h-2.5 w-2.5 animate-spin" /> Fetching location...
                  </span>
                )}
                {postalAutofilled && !postalLookupLoading && (
                  <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                    <Check className="h-2.5 w-2.5" /> Auto-fetched
                  </span>
                )}
              </div>
              <input
                type="text"
                value={customerPostalCode}
                onChange={(e) => handlePostalChange(e.target.value)}
                placeholder={mode === "domestic" ? "e.g. 395002" : "e.g. 4404 or 90210"}
                className="w-full rounded-lg border border-primary/40 bg-background px-3 py-2 text-xs font-mono font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-xs mb-1 block text-muted-foreground">City</label>
              <input
                type="text"
                value={customerCity}
                onChange={(e) => setCustomerCity(e.target.value)}
                placeholder="City"
                className="w-full rounded-lg border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="label-xs mb-1 block text-muted-foreground">State / Region</label>
              <input
                type="text"
                value={customerState}
                onChange={(e) => setCustomerState(e.target.value)}
                placeholder="State / Region"
                className="w-full rounded-lg border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {mode === "domestic" && (
            <div>
              <label className="label-xs mb-1 block text-muted-foreground">Buyer GSTIN (Optional B2B for Tax Credit)</label>
              <input
                type="text"
                value={customerGstin}
                onChange={(e) => setCustomerGstin(e.target.value)}
                placeholder="e.g. 24AAACA1234B1Z5"
                className="w-full rounded-lg border bg-background px-3 py-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          )}
        </div>
      </div>

      {/* Itemized Line Items Table */}
      <div className="rounded-2xl border bg-card p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
          <div>
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              Itemized Products & Quantities ({items.length} items)
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Add individual garments, piece counts, per-unit rates, and HSN codes for exact customs and tax compliance.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {mode === "domestic" && (
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={taxInclusive}
                  onChange={(e) => setTaxInclusive(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-muted-foreground font-medium">Prices are GST-Inclusive</span>
              </label>
            )}

            <button
              type="button"
              onClick={handleAddItem}
              className="btn-outline flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Product Line
            </button>
          </div>
        </div>

        {/* Table Rows */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b bg-muted/30 text-muted-foreground">
                <th className="py-2.5 px-3 w-10">#</th>
                <th className="py-2.5 px-3 min-w-[220px]">Item Name & Description</th>
                <th className="py-2.5 px-3 w-28">HSN Code</th>
                <th className="py-2.5 px-3 w-24">Qty (Pcs)</th>
                <th className="py-2.5 px-3 w-32">Price / Unit ({calculations.curSymbol})</th>
                <th className="py-2.5 px-3 w-28">Tax Rate</th>
                <th className="py-2.5 px-3 w-32 text-right">Line Total</th>
                <th className="py-2.5 px-3 w-12 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((item, idx) => {
                const lineTotal = (Number(item.qty) || 0) * (Number(item.price) || 0);
                return (
                  <tr key={item.id} className="hover:bg-muted/10">
                    <td className="py-2.5 px-3 font-semibold text-muted-foreground">{idx + 1}</td>
                    <td className="py-2.5 px-3 space-y-1">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleUpdateItem(item.id, "name", e.target.value)}
                        placeholder="e.g. Cotton T-Shirts"
                        className="w-full rounded border bg-background px-2 py-1 text-xs font-semibold"
                      />
                      <input
                        type="text"
                        value={item.desc}
                        onChange={(e) => handleUpdateItem(item.id, "desc", e.target.value)}
                        placeholder="Fabric details, size, packaging"
                        className="w-full rounded border bg-background px-2 py-0.5 text-[11px] text-muted-foreground"
                      />
                    </td>
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        value={item.hsn}
                        onChange={(e) => handleUpdateItem(item.id, "hsn", e.target.value)}
                        placeholder="6204 / 6109"
                        className="w-full rounded border bg-background px-2 py-1 text-xs font-mono"
                      />
                    </td>
                    <td className="py-2.5 px-3">
                      <input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) => handleUpdateItem(item.id, "qty", e.target.value)}
                        className="w-full rounded border bg-background px-2 py-1 text-xs font-bold"
                      />
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="relative">
                        <span className="absolute left-2 top-1 text-muted-foreground text-xs">
                          {calculations.curSymbol}
                        </span>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={item.price}
                          onChange={(e) => handleUpdateItem(item.id, "price", e.target.value)}
                          className="w-full rounded border bg-background pl-6 pr-2 py-1 text-xs"
                        />
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        value={item.gstRate}
                        onChange={(e) => handleUpdateItem(item.id, "gstRate", e.target.value)}
                        placeholder="0% LUT"
                        className="w-full rounded border bg-background px-2 py-1 text-xs"
                      />
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold font-mono">
                      {calculations.curSymbol}
                      {lineTotal.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={items.length <= 1}
                        className="p-1 text-muted-foreground hover:text-destructive disabled:opacity-30 transition"
                        title="Delete line item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Live Calculation & Grand Total Breakdown */}
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4 border-t pt-4">
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• <strong>Total Pieces:</strong> {calculations.totalQty} Units</p>
            <p>• <strong>Tax Regime:</strong> {mode === "international" ? "Zero-Rated Export (LUT 0%)" : "Indian GST Act 2017 (5%)"}</p>
          </div>

          <div className="w-full sm:w-72 rounded-xl border bg-muted/20 p-4 space-y-2 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Taxable Value:</span>
              <span className="font-mono font-medium">{calculations.curSymbol}{calculations.taxable.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>{mode === "international" ? "IGST (Export 0%):" : "GST Amount (5%):"}</span>
              <span className="font-mono font-medium">
                {calculations.curSymbol}{calculations.taxAmount.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center text-muted-foreground">
              <span>Shipping Fee:</span>
              <div className="w-24">
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={shippingFee}
                  onChange={(e) => setShippingFee(Number(e.target.value) || 0)}
                  className="w-full text-right rounded border bg-background px-2 py-0.5 text-xs font-mono"
                />
              </div>
            </div>
            <div className="flex justify-between border-t pt-2 text-sm font-bold text-foreground">
              <span>Grand Total:</span>
              <span className="text-primary font-mono text-base">
                {calculations.curSymbol}{calculations.grandTotal.toFixed(2)} {calculations.cur}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex flex-wrap items-center justify-end gap-3 border-t pt-4">
        <button
          type="button"
          onClick={() => handleModeSwitch(mode)}
          className="btn-outline flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium rounded-xl"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Reset to Sample Data
        </button>

        <button
          type="button"
          onClick={handleGeneratePdf}
          className="btn-solid flex items-center gap-2 px-6 py-2.5 text-sm font-bold shadow-lg rounded-xl hover:opacity-95 transition"
        >
          <Download className="h-4 w-4" />
          Generate & Download Official Invoice (PDF)
        </button>
      </div>
    </div>
  );
}
