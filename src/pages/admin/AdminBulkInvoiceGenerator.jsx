import React, { useState, useMemo, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import * as adminApi from "../../api/admin";
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
  Clock,
  Hash,
} from "lucide-react";
import { generateCustomInvoicePdf } from "../../utils/customInvoicePdf";
import { lookupPostalCode } from "../../api/addresses";
import { COUNTRY_OPTIONS } from "../QuickPay";

const APPAREL_THRESHOLD = 2500;

export default function AdminBulkInvoiceGenerator() {
  const [mode, setMode] = useState("domestic"); // "domestic" | "international"
  const [taxInclusive, setTaxInclusive] = useState(true);
  const [exportTaxRate, setExportTaxRate] = useState(5); // Default 5% as requested by client
  const [exportTaxLabel, setExportTaxLabel] = useState("Tax"); // "Tax" | "IGST" | "Sales Tax / VAT"

  // Fetch catalog bulk products to auto-fill items and prices
  const { data: bulkProductsData } = useQuery({
    queryKey: ["admin", "bulk-products"],
    queryFn: adminApi.getAdminBulkProducts,
    staleTime: 5 * 60 * 1000,
  });

  const bulkProducts = useMemo(() => {
    const list = bulkProductsData?.data || bulkProductsData;
    return Array.isArray(list) ? list : [];
  }, [bulkProductsData]);

  // Live exchange rate fetch with fallback
  useEffect(() => {
    fetch("https://open.er-api.com/v6/latest/USD")
      .then((r) => r.json())
      .then((d) => {
        if (d?.rates?.INR && typeof d.rates.INR === "number") {
          setExchangeRate(Number(d.rates.INR.toFixed(2)));
        }
      })
      .catch(() => {});
  }, []);

  // 1. Invoice & Order Details
  const [invoiceNo, setInvoiceNo] = useState(
    () => `INV-BO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [invoiceDate, setInvoiceDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [invoiceTime, setInvoiceTime] = useState(() => {
    const now = new Date();
    return now.toTimeString().substring(0, 5); // "HH:MM"
  });
  const [orderNo, setOrderNo] = useState(
    () => `SN-BO-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [paymentMode, setPaymentMode] = useState("Bank Transfer (NEFT/RTGS)");
  const [paymentStatus, setPaymentStatus] = useState("PAID (Settled)");
  const [transactionId, setTransactionId] = useState("UTR: HDFCN26298102391");
  const [placeOfSupply, setPlaceOfSupply] = useState("Gujarat");
  const [exchangeRate, setExchangeRate] = useState(86);

  // 2. Customer Details
  const [selectedCountryCode, setSelectedCountryCode] = useState("IN");
  const [dialCode, setDialCode] = useState("+91");
  const [customerPhone, setCustomerPhone] = useState("9825144321");
  const [customerName, setCustomerName] = useState("Rajesh Kumar Aggarwal");
  const [customerCompany, setCustomerCompany] = useState("Aggarwal Garments & Retail Hub");
  const [customerEmail, setCustomerEmail] = useState("rajesh.aggarwal@aggarwalretail.com");
  const [customerAddress, setCustomerAddress] = useState("Shop No. 42-44, Millennium Textile Market, Ring Road");
  const [customerCity, setCustomerCity] = useState("Surat");
  const [customerState, setCustomerState] = useState("Gujarat");
  const [customerPostalCode, setCustomerPostalCode] = useState("395002");
  const [customerCountry, setCustomerCountry] = useState("India");
  const [customerGstin, setCustomerGstin] = useState("24AAACA1234B1Z5");

  // Postal lookup state
  const [postalLookupLoading, setPostalLookupLoading] = useState(false);
  const [postalAutofilled, setPostalAutofilled] = useState(false);
  const lookupTimeoutRef = useRef(null);

  // 3. Line Items
  const [items, setItems] = useState([
    {
      id: "1",
      name: "Bio-Wash Cotton Round Neck T-Shirts",
      desc: "Fabric: 100% Combed Cotton 180 GSM",
      hsn: "6109",
      qty: 10,
      price: 350,
      taxPercent: 5,
    },
    {
      id: "2",
      name: "Men's Stretch Lycra Trackpants / Lowers",
      desc: "Fabric: 4-Way Stretch Lycra, Zipper Pockets",
      hsn: "6203",
      qty: 20,
      price: 450,
      taxPercent: 5,
    },
    {
      id: "3",
      name: "Women's Rayon Flared Embroidered Plazos",
      desc: "Fabric: Heavy Rayon, Premium Stitching",
      hsn: "6204",
      qty: 20,
      price: 500,
      taxPercent: 5,
    },
  ]);

  // 4. Shipping Fee
  const [shippingFee, setShippingFee] = useState(0);

  // Check if Customer State is Madhya Pradesh (Intra-State)
  const isMadhyaPradesh = useMemo(() => {
    if (mode === "international") return false;
    const s = (customerState || "").trim().toLowerCase();
    return s.includes("madhya") || s === "mp" || s === "m.p.";
  }, [customerState, mode]);

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

    if (countryCode === "IN" && clean.length !== 6) return;
    if (countryCode === "US" && clean.length !== 5) return;

    lookupTimeoutRef.current = setTimeout(async () => {
      setPostalLookupLoading(true);
      try {
        let res = await lookupPostalCode(clean, countryCode);

        if ((!res || !res.found) && countryCode === "CA" && clean.length >= 3) {
          const fsa = clean.replace(/\s+/g, "").slice(0, 3);
          res = await lookupPostalCode(fsa, "CA");
        }

        if (res && res.found) {
          if (res.city) setCustomerCity(res.city);
          if (res.state) {
            setCustomerState(res.state);
            if (countryCode === "IN") {
              const stateNorm = res.state.toLowerCase();
              setPlaceOfSupply(res.state);
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
      setDialCode(opt.dialCode);
      setCustomerCountry(opt.name);
      setPlaceOfSupply(`${opt.name} (Export)`);
    }
    if (customerPostalCode) {
      triggerPostalLookup(customerPostalCode, cCode);
    }
  };

  // Switch between Domestic and International
  const handleModeSwitch = (newMode) => {
    setMode(newMode);
    setPostalAutofilled(false);

    if (newMode === "domestic") {
      setSelectedCountryCode("IN");
      setDialCode("+91");
      setPaymentMode("Bank Transfer (NEFT/RTGS)");
      setTransactionId("UTR: HDFCN26298102391");
      setPlaceOfSupply("Gujarat");
      setCustomerCountry("India");
      setCustomerCity("Surat");
      setCustomerState("Gujarat");
      setCustomerPostalCode("395002");
      setCustomerPhone("9825144321");
      setCustomerGstin("24AAACA1234B1Z5");
      setCustomerName("Rajesh Kumar Aggarwal");
      setCustomerCompany("Aggarwal Garments & Retail Hub");
      setCustomerEmail("rajesh.aggarwal@aggarwalretail.com");
      setCustomerAddress("Shop No. 42-44, Millennium Textile Market, Ring Road");
      setItems([
        {
          id: "1",
          name: "Bio-Wash Cotton Round Neck T-Shirts",
          desc: "Fabric: 100% Combed Cotton 180 GSM",
          hsn: "6109",
          qty: 10,
          price: 350,
          taxPercent: 5,
        },
        {
          id: "2",
          name: "Men's Stretch Lycra Trackpants / Lowers",
          desc: "Fabric: 4-Way Stretch Lycra, Zipper Pockets",
          hsn: "6203",
          qty: 20,
          price: 450,
          taxPercent: 5,
        },
        {
          id: "3",
          name: "Women's Rayon Flared Embroidered Plazos",
          desc: "Fabric: Heavy Rayon, Premium Stitching",
          hsn: "6204",
          qty: 20,
          price: 500,
          taxPercent: 5,
        },
      ]);
    } else {
      setSelectedCountryCode("AU");
      setDialCode("+61");
      setPaymentMode("Online (PayGlocal Gateway)");
      setTransactionId("gl_o-a4ed1da62828d8eaa2xt0l5q8");
      setPlaceOfSupply("Australia (Export)");
      setCustomerCountry("Australia");
      setCustomerCity("Bowenville");
      setCustomerState("QLD");
      setCustomerPostalCode("4404");
      setCustomerPhone("417754030");
      setCustomerGstin("");
      setCustomerName("Wallace Don Sempf");
      setCustomerCompany("Sempf Apparel & Boutique");
      setCustomerEmail("wallace.sempf0@bigpond.com");
      setCustomerAddress("896 Jondaryan-Saint Ruth Rd");
      setItems([
        {
          id: "1",
          name: "Cotton Round Neck Export T-Shirts",
          desc: "Fabric: 100% Combed Cotton 180 GSM | Export Quality",
          hsn: "6109",
          qty: 10,
          price: 8.0,
          taxPercent: 0,
        },
        {
          id: "2",
          name: "Men's Stretch Lycra Trackpants / Lowers",
          desc: "Fabric: 4-Way Stretch Lycra, Export Quality",
          hsn: "6203",
          qty: 20,
          price: 6.5,
          taxPercent: 0,
        },
        {
          id: "3",
          name: "Women's Rayon Flared Embroidered Plazos",
          desc: "Fabric: Heavy Rayon, Hand-Embroidered Hemline",
          hsn: "6204",
          qty: 20,
          price: 7.0,
          taxPercent: 0,
        },
      ]);
    }
  };

  // Item Price Change with Automatic Apparel Slab Rate Resolution
  const handleItemPriceChange = (id, newPrice) => {
    const p = Number(newPrice) || 0;
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        let autoTax = item.taxPercent;
        if (mode === "domestic") {
          autoTax = p > APPAREL_THRESHOLD ? 18 : 5;
        } else {
          autoTax = 0;
        }

        return { ...item, price: newPrice, taxPercent: autoTax };
      })
    );
  };

  // Auto-fill from catalog product
  const handleSelectCatalogProduct = (itemId, prodId) => {
    if (!prodId) return;
    const prod = bulkProducts.find((p) => String(p.id) === String(prodId));
    if (!prod) return;

    const rawInrPrice = Number(prod.price || 0);
    const convertedPrice = mode === "international"
      ? Number((rawInrPrice / (exchangeRate || 86)).toFixed(2))
      : rawInrPrice;

    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== itemId) return it;
        return {
          ...it,
          name: prod.name || it.name,
          desc: prod.description ? `Fabric: ${prod.description}` : it.desc,
          hsn: prod.hsnCode || it.hsn || "6204",
          price: convertedPrice,
          taxPercent: mode === "international" ? (exportTaxRate || 0) : (convertedPrice > APPAREL_THRESHOLD ? 18 : 5),
        };
      })
    );
  };

  const handleAddItem = () => {
    const defaultPrice = mode === "international" ? 10.0 : 400.0;
    const defaultTax = mode === "international" ? 0 : (defaultPrice > APPAREL_THRESHOLD ? 18 : 5);

    setItems((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        name: mode === "international" ? "Export Garment Item" : "Wholesale Apparel Item",
        desc: "Regular Fit | Export Quality Packaging",
        hsn: "6204",
        qty: 10,
        price: defaultPrice,
        taxPercent: defaultTax,
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
    const isExp = mode === "international";
    const curSymbol = isExp ? "$" : "Rs. ";
    const cur = isExp ? "USD" : "INR";

    let totalTaxable = 0;
    let totalTaxAmount = 0;
    let totalGrossAmount = 0;

    const taxByRate = {};

    items.forEach((it) => {
      const q = Number(it.qty) || 0;
      const p = Number(it.price) || 0;
      const lineGross = q * p;
      const rate = isExp ? Number(exportTaxRate || 0) : Number(it.taxPercent || 0);

      let lineTaxable = 0;
      let lineTax = 0;

      if (rate === 0) {
        lineTaxable = lineGross;
        lineTax = 0;
      } else if (taxInclusive) {
        lineTaxable = lineGross / (1 + rate / 100);
        lineTax = lineGross - lineTaxable;
      } else {
        lineTaxable = lineGross;
        lineTax = lineTaxable * (rate / 100);
      }

      totalTaxable += lineTaxable;
      totalTaxAmount += lineTax;
      totalGrossAmount += taxInclusive ? lineGross : (lineTaxable + lineTax);

      if (rate > 0) {
        taxByRate[rate] = (taxByRate[rate] || 0) + lineTax;
      }
    });

    const grandTotal = totalGrossAmount + Number(shippingFee || 0);

    return {
      totalQty,
      totalTaxable,
      totalTaxAmount,
      totalGrossAmount,
      grandTotal,
      taxByRate,
      curSymbol,
      cur,
    };
  }, [items, mode, taxInclusive, shippingFee, exportTaxRate]);

  // Download Trigger
  const handleGeneratePdf = () => {
    const isExp = mode === "international";

    const formattedItems = items.map((it) => {
      const q = Number(it.qty) || 0;
      const p = Number(it.price) || 0;
      const r = isExp ? Number(exportTaxRate || 0) : Number(it.taxPercent || 0);

      let rateLabel = "0% (LUT)";
      if (isExp) {
        rateLabel = r === 0 ? "0% (LUT)" : `${r}% (${exportTaxLabel}${taxInclusive ? " Incl." : ""})`;
      } else {
        if (isMadhyaPradesh) {
          rateLabel = `${r}% (CGST ${(r / 2).toFixed(1)}% + SGST ${(r / 2).toFixed(1)}%)`;
        } else {
          rateLabel = `${r}% (IGST)`;
        }
      }

      return {
        name: it.name || "Item",
        desc: it.desc || "",
        hsn: it.hsn || "6204",
        qty: q,
        price: p,
        gstRate: rateLabel,
        lineTotal: q * p,
      };
    });

    const summaryLines = [
      ["Total Quantity:", `${calculations.totalQty} Pieces`, false],
      ["Taxable Amount:", `${calculations.curSymbol}${calculations.totalTaxable.toFixed(2)}`, false],
    ];

    if (isExp) {
      if (exportTaxRate === 0) {
        summaryLines.push(["IGST (Export LUT 0%):", `${calculations.curSymbol}0.00`, false]);
      } else {
        summaryLines.push([
          `${exportTaxLabel} (${exportTaxRate}%${taxInclusive ? " Incl." : ""}):`,
          `${calculations.curSymbol}${calculations.totalTaxAmount.toFixed(2)}`,
          false,
        ]);
      }
      summaryLines.push(["International Freight:", `${calculations.curSymbol}${Number(shippingFee).toFixed(2)}`, false]);
    } else {
      const rates = Object.keys(calculations.taxByRate).sort((a, b) => Number(a) - Number(b));
      if (rates.length === 0) {
        summaryLines.push(["GST (0%):", "Rs. 0.00", false]);
      } else {
        rates.forEach((r) => {
          const amt = calculations.taxByRate[r];
          if (isMadhyaPradesh) {
            const halfRate = (Number(r) / 2).toFixed(1);
            const halfAmt = amt / 2;
            summaryLines.push([`CGST (${halfRate}%):`, `Rs. ${halfAmt.toFixed(2)}`, false]);
            summaryLines.push([`SGST (${halfRate}%):`, `Rs. ${halfAmt.toFixed(2)}`, false]);
          } else {
            summaryLines.push([`IGST (${r}%):`, `Rs. ${amt.toFixed(2)}`, false]);
          }
        });
      }
      summaryLines.push(["Freight / Shipping:", `Rs. ${Number(shippingFee).toFixed(2)}`, false]);
    }

    summaryLines.push(["Round Off:", `${calculations.curSymbol}0.00`, false]);
    summaryLines.push(["LINE", "", false]);
    summaryLines.push([
      "Grand Total:",
      `${calculations.curSymbol}${calculations.grandTotal.toFixed(2)} ${calculations.cur}`,
      true,
    ]);
    summaryLines.push(["Payment Status:", paymentStatus, true]);
    summaryLines.push(["Balance Due:", `${calculations.curSymbol}0.00`, false]);

    const activeRates = Object.keys(calculations.taxByRate);
    const slabsText = activeRates.length > 0 ? activeRates.map((r) => `${r}%`).join(" & ") : "5%";

    const complianceNotes = isExp
      ? [
          "• Statutory Export Clause: Supply meant for export under Letter of Undertaking (LUT) without payment of integrated tax (Zero-Rated Supply as per Sec 16 of IGST Act, 2017).",
          "• Export IGST Rate: 0.00% ($0.00 USD) - No Indian GST charged to foreign recipient.",
          transactionId ? `• Gateway Settlement / GID: ${transactionId}` : "",
          `• Payment Mode: ${paymentMode} | Place of Supply: ${placeOfSupply}`,
          "• Export Classification: Ready-to-wear apparel under HSN Chapters 61 & 62.",
        ].filter(Boolean)
      : [
          `• Supply Nature: ${isMadhyaPradesh ? "Intra-State Supply (within MP - CGST + SGST)" : "Inter-State B2B Supply (IGST)"}.`,
          `• Applicable GST Slabs: ${slabsText} as per CBIC Apparel Threshold (<=Rs.2,500 @ 5%, >Rs.2,500 @ 18%).`,
          transactionId ? `• Bank UTR / Payment Ref: ${transactionId}` : "",
          customerGstin
            ? `• Input Tax Credit (ITC): Fully eligible for recipient under GSTIN ${customerGstin}.`
            : "• Consumer / Retail Wholesale Sale (No ITC claimed).",
          "• Reverse Charge: No (Tax payable under forward charge mechanism).",
        ].filter(Boolean);

    const fullPhone = `${dialCode} ${customerPhone}`.trim();
    const formattedDateTime = `${new Date(invoiceDate).toLocaleDateString("en-IN")}${invoiceTime ? `, ${invoiceTime}` : ""}`;

    const payload = {
      isExport: isExp,
      currency: calculations.cur,
      currencySymbol: calculations.curSymbol,
      titleText: isExp
        ? "TAX INVOICE / EXPORT COMMERCIAL INVOICE"
        : `TAX INVOICE (${isMadhyaPradesh ? "INTRA-STATE MP" : "INTER-STATE B2B"})`,
      invoiceNo,
      invoiceDate: new Date(invoiceDate).toLocaleDateString("en-IN"),
      invoiceTime,
      invoiceDateTime: formattedDateTime,
      orderNo,
      paymentMode,
      transactionId: transactionId.trim(),
      placeOfSupply,
      customer: {
        name: customerName,
        company: customerCompany,
        address: customerAddress,
        city: customerCity,
        state: customerState,
        postalCode: customerPostalCode,
        country: customerCountry,
        phone: fullPhone,
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
    <div className="space-y-6 w-full max-w-full min-w-0 overflow-x-hidden">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div>
          <h2 className="display text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Manual Bulk Invoice Generator
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Create, customize, and download official StyleNest tax invoices with exact timestamps, UTR/Gateway IDs, and smart GST slabs.
          </p>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={handleGeneratePdf}
          className="btn-solid flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold shadow-lg hover:shadow-xl transition w-full sm:w-auto"
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
                Indian states, +91 dial code, automated GST Slabs (5% for &le;₹2,500, 18% for &gt;₹2,500), Bank UTR / UPI Ref support.
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
                Global country dropdown, calling codes, PayGlocal GID / Txn Ref support, 0% LUT Zero-Rated Tax ($ USD).
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
              Style Nest Fashion Private Limited | GSTIN: <strong>23ABUCS8160R1ZA</strong> | CIN: <strong>U14101MP2026PTC086429</strong> | Indore, MP (Code 23)
            </span>
          </div>
        </div>
        <span className="label-xs rounded-full bg-primary/15 px-2.5 py-1 font-semibold text-primary">
          Official Signature Purple Template
        </span>
      </div>

      {/* 2-Column Form Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 text-xs w-full min-w-0">
        {/* Left Column: Invoice Meta */}
        <div className="rounded-2xl border bg-card p-4 sm:p-5 space-y-4 w-full min-w-0">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2 border-b pb-2">
            <FileText className="h-4 w-4 text-primary" />
            Invoice & Order Metadata
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-end">
            <div>
              <label className="label-xs mb-1.5 flex items-center h-4 text-muted-foreground ">Invoice Number</label>
              <input
                type="text"
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
                className="h-9 w-full min-w-0 rounded-lg border bg-background px-3 text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="label-xs mb-1.5 flex items-center h-4 text-muted-foreground ">Order / Ref Number</label>
              <input
                type="text"
                value={orderNo}
                onChange={(e) => setOrderNo(e.target.value)}
                className="h-9 w-full min-w-0 rounded-lg border bg-background px-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Date & Time Pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-end">
            <div>
              <label className="label-xs mb-1.5 flex items-center h-4 text-muted-foreground ">Invoice Date</label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="h-9 w-full min-w-0 rounded-lg border bg-background px-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="label-xs mb-1.5 flex items-center gap-1.5 h-4 text-muted-foreground ">
                <Clock className="h-3 w-3 text-primary shrink-0" />
                <span>Invoice Time</span>
              </label>
              <input
                type="time"
                value={invoiceTime}
                onChange={(e) => setInvoiceTime(e.target.value)}
                className="h-9 w-full min-w-0 rounded-lg border bg-background px-3 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-end">
            <div>
              <label className="label-xs mb-1.5 flex items-center h-4 text-muted-foreground ">Payment Mode / Gateway</label>
              <input
                type="text"
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                placeholder="e.g. Bank Transfer / UPI / PayGlocal"
                className="h-9 w-full min-w-0 rounded-lg border bg-background px-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="label-xs mb-1.5 flex items-center h-4 text-muted-foreground ">Payment Status</label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                className="h-9 w-full min-w-0 rounded-lg border bg-background px-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="PAID (Settled)">PAID (Settled)</option>
                <option value="PENDING">PENDING</option>
                <option value="PARTIALLY PAID">PARTIALLY PAID</option>
              </select>
            </div>
          </div>

          {/* Transaction ID / UTR Number */}
          <div>
            <label className="label-xs mb-1.5 flex items-center gap-1.5 h-4 font-semibold text-foreground ">
              <Hash className="h-3 w-3 text-primary shrink-0" />
              <span>{mode === "domestic" ? "Bank UTR / UPI Transaction Ref ID" : "PayGlocal GID / Gateway Txn Ref"}</span>
            </label>
            <input
              type="text"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder={
                mode === "domestic"
                  ? "e.g. UTR-HDFCN26298102391 / UPI: 429810482910"
                  : "e.g. gl_o-a4eef24e48e529f57n4q0ykq8"
              }
              className="h-9 w-full min-w-0 rounded-lg border bg-background px-3 text-xs font-mono font-medium focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              {mode === "domestic"
                ? "Unique Transaction Reference for Bank / GST ITC audit reconciliation."
                : "PayGlocal global gateway identifier for export remittance and bank FIRC."}
            </p>
          </div>
        </div>

        {/* Right Column: Customer Details (Bill To) */}
        <div className="rounded-2xl border bg-card p-4 sm:p-5 space-y-4 w-full min-w-0">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2 border-b pb-2">
            <User className="h-4 w-4 text-primary" />
            Customer / Buyer Details (Bill To & Ship To)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-end">
            <div>
              <label className="label-xs mb-1.5 flex items-center h-4 text-muted-foreground ">Customer Full Name *</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Rajesh Sharma"
                className="h-9 w-full min-w-0 rounded-lg border bg-background px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="label-xs mb-1.5 flex items-center h-4 text-muted-foreground ">Company / Business Name</label>
              <input
                type="text"
                value={customerCompany}
                onChange={(e) => setCustomerCompany(e.target.value)}
                placeholder="e.g. Retail Enterprises"
                className="h-9 w-full min-w-0 rounded-lg border bg-background px-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-end">
            {/* Phone with Country Dial Code Dropdown */}
            <div>
              <label className="label-xs mb-1.5 flex items-center h-4 text-muted-foreground ">Phone / WhatsApp Number</label>
              <div className="h-9 flex rounded-lg border bg-background overflow-hidden focus-within:ring-1 focus-within:ring-primary">
                {mode === "international" ? (
                  <select
                    value={dialCode}
                    onChange={(e) => setDialCode(e.target.value)}
                    className="h-full px-2 bg-muted/60 text-xs font-semibold text-foreground border-r focus:outline-none cursor-pointer max-w-[100px]"
                    title="Select Calling Code"
                  >
                    {COUNTRY_OPTIONS.map((c) => (
                      <option key={`${c.code}-${c.dialCode}`} value={c.dialCode}>
                        {c.flag} {c.dialCode}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="h-full px-2.5 bg-muted/60 text-xs font-bold text-foreground border-r flex items-center gap-1 select-none">
                    🇮🇳 +91
                  </span>
                )}
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="9825144321"
                  className="h-full flex-1 px-3 text-xs bg-transparent focus:outline-none min-w-0"
                />
              </div>
            </div>

            <div>
              <label className="label-xs mb-1.5 flex items-center h-4 text-muted-foreground ">Email Address</label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="e.g. client@example.com"
                className="h-9 w-full min-w-0 rounded-lg border bg-background px-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="label-xs mb-1.5 flex items-center h-4 text-muted-foreground ">Street Address</label>
            <input
              type="text"
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              placeholder="e.g. Shop 42, Market Complex"
              className="h-9 w-full min-w-0 rounded-lg border bg-background px-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Destination Country & PIN/ZIP with Live Lookup */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
            <div>
              <label className="label-xs mb-1.5 flex items-center h-4 text-muted-foreground ">Destination Country</label>
              {mode === "international" ? (
                <select
                  value={selectedCountryCode}
                  onChange={(e) => handleCountryDropdownChange(e.target.value)}
                  className="h-9 w-full min-w-0 rounded-lg border bg-background px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
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
                  className="h-9 w-full min-w-0 rounded-lg border bg-muted/40 px-3 text-xs font-semibold cursor-not-allowed"
                />
              )}
            </div>

            {/* PIN / ZIP Code with Live Auto-Lookup */}
            <div>
              <div className="h-4 flex items-center justify-between mb-1.5">
                <label className="label-xs font-bold text-primary flex items-center gap-1 ">
                  <MapPin className="h-3 w-3" />
                  <span>{mode === "domestic" ? "PIN Code (6 digits) *" : "Postal / ZIP Code *"}</span>
                </label>
                {postalLookupLoading && (
                  <span className="text-[10px] text-primary flex items-center gap-1">
                    <Loader2 className="h-2.5 w-2.5 animate-spin" /> Fetching...
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
                className="h-9 w-full min-w-0 rounded-lg border border-primary/40 bg-background px-3 text-xs font-mono font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-end">
            <div>
              <label className="label-xs mb-1.5 flex items-center h-4 text-muted-foreground ">City</label>
              <input
                type="text"
                value={customerCity}
                onChange={(e) => setCustomerCity(e.target.value)}
                placeholder="City"
                className="h-9 w-full min-w-0 rounded-lg border bg-background px-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="label-xs mb-1.5 flex items-center h-4 text-muted-foreground ">State / Region</label>
              <input
                type="text"
                value={customerState}
                onChange={(e) => {
                    const s = e.target.value;
                    setCustomerState(s);
                    if (mode === "domestic") setPlaceOfSupply(s);
                  }}
                placeholder="State / Region"
                className="h-9 w-full min-w-0 rounded-lg border bg-background px-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Place of Supply (Grouped with Customer Location & GSTIN) */}
          <div className={mode === "domestic" ? "grid grid-cols-1 sm:grid-cols-2 gap-3 items-end" : ""}>
            <div>
              <div className="h-4 flex items-center justify-between mb-1.5">
                <label className="label-xs text-muted-foreground ">Place of Supply</label>
                {mode === "domestic" && (
                  <span className="font-semibold text-[10px] text-primary ">
                    {isMadhyaPradesh ? "Intra-State MP" : "Inter-State"}
                  </span>
                )}
              </div>
              <input
                type="text"
                value={placeOfSupply}
                onChange={(e) => setPlaceOfSupply(e.target.value)}
                placeholder={mode === "domestic" ? "e.g. Gujarat" : "e.g. Australia (Export)"}
                className="h-9 w-full min-w-0 rounded-lg border bg-background px-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {mode === "domestic" && (
              <div>
                <label className="label-xs mb-1.5 flex items-center h-4 text-muted-foreground ">Buyer GSTIN (Optional B2B for ITC)</label>
                <input
                  type="text"
                  value={customerGstin}
                  onChange={(e) => setCustomerGstin(e.target.value)}
                  placeholder="e.g. 24AAACA1234B1Z5"
                  className="h-9 w-full min-w-0 rounded-lg border bg-background px-3 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Itemized Line Items Table */}
      <div className="rounded-2xl border bg-card p-4 sm:p-5 space-y-4 w-full min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
          <div>
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              Itemized Products & Quantities ({items.length} items)
            </h3>
            <p className="text-[11px] text-muted-foreground">
              {mode === "domestic" ? (
                <span>
                  Apparel Tax Slabs: <strong>5% GST</strong> for &le;₹2,500/piece | <strong>18% GST</strong> for &gt;₹2,500/piece (auto-resolved).
                  Tax applied as <strong>{isMadhyaPradesh ? "CGST + SGST (Intra-State MP)" : "IGST (Inter-State)"}</strong>.
                </span>
              ) : (
                <span>Zero-Rated Export (0% LUT) for all international shipments under Section 16 of IGST Act.</span>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {mode === "international" ? (
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 bg-muted/40 px-2.5 py-1.5 rounded-lg border text-xs">
                  <span className="text-muted-foreground font-medium">Export Tax:</span>
                  <select
                    value={exportTaxRate}
                    onChange={(e) => setExportTaxRate(Number(e.target.value))}
                    className="bg-transparent font-bold text-foreground focus:outline-none cursor-pointer"
                  >
                    <option value={5}>5% Tax (Client Standard)</option>
                    <option value={18}>18% Tax (High-Value Apparel)</option>
                    <option value={0}>0% (Zero-Rated LUT Export)</option>
                  </select>
                </div>

                {exportTaxRate > 0 && (
                  <div className="flex items-center gap-1.5 bg-muted/40 px-2.5 py-1.5 rounded-lg border text-xs">
                    <span className="text-muted-foreground font-medium">Invoice Label:</span>
                    <select
                      value={exportTaxLabel}
                      onChange={(e) => setExportTaxLabel(e.target.value)}
                      className="bg-transparent font-bold text-foreground focus:outline-none cursor-pointer"
                    >
                      <option value="Tax">Tax ({exportTaxRate}%) - Buyer Friendly</option>
                      <option value="IGST">IGST ({exportTaxRate}%) - Customs / CA</option>
                      <option value="Sales Tax / VAT">Sales Tax / VAT ({exportTaxRate}%)</option>
                    </select>
                  </div>
                )}

                <label className="flex items-center gap-2 cursor-pointer text-xs bg-muted/40 px-3 py-1.5 rounded-lg border">
                  <input
                    type="checkbox"
                    checked={taxInclusive}
                    onChange={(e) => setTaxInclusive(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary cursor-pointer"
                  />
                  <span className="text-foreground font-semibold">Prices are Tax-Inclusive</span>
                </label>
              </div>
            ) : (
              <label className="flex items-center gap-2 cursor-pointer text-xs bg-muted/40 px-3 py-1.5 rounded-lg border">
                <input
                  type="checkbox"
                  checked={taxInclusive}
                  onChange={(e) => setTaxInclusive(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary cursor-pointer"
                />
                <span className="text-foreground font-semibold">Prices are GST-Inclusive</span>
              </label>
            )}

            {mode === "international" && (
              <div className="flex items-center gap-1.5 bg-muted/40 px-2.5 py-1 rounded-lg border text-xs">
                <span className="text-muted-foreground font-medium">USD Rate:</span>
                <span className="font-semibold text-foreground">$1 = Rs.</span>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(Number(e.target.value) || 86)}
                  className="w-16 rounded border bg-background px-1.5 py-0.5 text-xs font-bold text-center"
                  title="Daily exchange rate for USD price auto-conversion"
                />
              </div>
            )}

            <button
              type="button"
              onClick={handleAddItem}
              className="btn-outline flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer"
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
                <th className="py-2.5 px-3 w-24">HSN Code</th>
                <th className="py-2.5 px-3 w-20">Qty (Pcs)</th>
                <th className="py-2.5 px-3 w-32">Price / Unit ({calculations.curSymbol})</th>
                <th className="py-2.5 px-3 w-32">{mode === "international" ? "Tax Rate" : "GST Slab"}</th>
                <th className="py-2.5 px-3 w-32 text-right">Line Total</th>
                <th className="py-2.5 px-3 w-12 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((item, idx) => {
                const lineTotal = (Number(item.qty) || 0) * (Number(item.price) || 0);
                const isHighSlab = mode === "domestic" && Number(item.price) > APPAREL_THRESHOLD;

                return (
                  <tr key={item.id} className="hover:bg-muted/10">
                    <td className="py-2.5 px-3 font-semibold text-muted-foreground">{idx + 1}</td>
                    <td className="py-2.5 px-3 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          list="bulk-catalog-list"
                          value={item.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            handleUpdateItem(item.id, "name", val);
                            const matched = bulkProducts.find(
                              (p) => (p.name || "").toLowerCase() === val.trim().toLowerCase()
                            );
                            if (matched) {
                              handleSelectCatalogProduct(item.id, matched.id);
                            }
                          }}
                          placeholder="Type or pick product..."
                          className="w-full rounded border bg-background px-2 py-1 text-xs font-semibold"
                        />
                        {bulkProducts.length > 0 && (
                          <select
                            onChange={(e) => {
                              handleSelectCatalogProduct(item.id, e.target.value);
                              e.target.value = "";
                            }}
                            className="w-36 shrink-0 rounded border bg-background px-1.5 py-1 text-[11px] text-muted-foreground truncate cursor-pointer hover:bg-muted/40"
                            title="Auto-fill from bulk catalog"
                          >
                            <option value="">⚡ Select Catalog...</option>
                            {bulkProducts.map((bp) => (
                              <option key={bp.id} value={bp.id}>
                                {bp.name} (Rs. {bp.price})
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
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
                          onChange={(e) => handleItemPriceChange(item.id, e.target.value)}
                          className="w-full rounded border bg-background pl-6 pr-2 py-1 text-xs font-semibold"
                        />
                      </div>
                    </td>

                    {/* GST Rate Selector / Indicator */}
                    <td className="py-2.5 px-3">
                      {mode === "international" ? (
                        <span className="inline-block rounded bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary">
                          {exportTaxRate === 0
                            ? "0% (LUT Export)"
                            : `${exportTaxRate}% (${exportTaxLabel}${taxInclusive ? " Incl." : ""})`}
                        </span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <select
                            value={item.taxPercent}
                            onChange={(e) => handleUpdateItem(item.id, "taxPercent", Number(e.target.value))}
                            className={`rounded border px-2 py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer ${
                              isHighSlab ? "border-amber-500 bg-amber-500/10 text-amber-700" : "bg-background"
                            }`}
                          >
                            <option value={5}>5% (Standard &le;₹2.5k)</option>
                            <option value={18}>18% (Luxury &gt;₹2.5k)</option>
                            <option value={12}>12% (Apparel/Other)</option>
                            <option value={28}>28%</option>
                            <option value={0}>0% (Exempt)</option>
                          </select>
                          <span className="text-[10px] text-muted-foreground">
                            {isMadhyaPradesh ? "(C+S)" : "(IGST)"}
                          </span>
                        </div>
                      )}
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
            <datalist id="bulk-catalog-list">
              {bulkProducts.map((bp) => (
                <option key={bp.id} value={bp.name}>
                  Rs. {bp.price} | HSN {bp.hsnCode || "6204"}
                </option>
              ))}
            </datalist>
        </div>

        {/* Live Calculation & Grand Total Breakdown */}
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4 border-t pt-4">
          <div className="text-xs text-muted-foreground space-y-1.5">
            <p>• <strong>Total Pieces:</strong> {calculations.totalQty} Units</p>
            <p>
              • <strong>Tax Regime:</strong>{" "}
              {mode === "international"
                ? (exportTaxRate === 0
                    ? "Zero-Rated Export (LUT 0%)"
                    : `Export Supply with Tax (${exportTaxRate}% ${exportTaxLabel} ${taxInclusive ? "Included in Price" : "Added Extra"})`)
                : isMadhyaPradesh
                ? "Intra-State Supply (Within MP - CGST + SGST)"
                : "Inter-State Supply (Outside MP - IGST)"}
            </p>
            {mode === "domestic" && (
              <p className="text-[11px] text-muted-foreground">
                • <strong>Active Slabs:</strong>{" "}
                {Object.keys(calculations.taxByRate).length > 0
                  ? Object.keys(calculations.taxByRate)
                      .map((r) => `${r}% (₹${calculations.taxByRate[r].toFixed(2)})`)
                      .join(", ")
                  : "5% Standard"}
              </p>
            )}
          </div>

          <div className="w-full sm:w-80 rounded-xl border bg-muted/20 p-4 space-y-2 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Taxable Value:</span>
              <span className="font-mono font-medium">{calculations.curSymbol}{calculations.totalTaxable.toFixed(2)}</span>
            </div>

            {/* Render taxes grouped by rate */}
            {mode === "international" ? (
              exportTaxRate === 0 ? (
                <div className="flex justify-between text-muted-foreground">
                  <span>IGST (Export LUT 0%):</span>
                  <span className="font-mono font-medium">$0.00</span>
                </div>
              ) : (
                <div className="flex justify-between text-muted-foreground">
                  <span>{exportTaxLabel} ({exportTaxRate}%{taxInclusive ? " Incl." : ""}):</span>
                  <span className="font-mono font-medium">
                    {calculations.curSymbol}{calculations.totalTaxAmount.toFixed(2)}
                  </span>
                </div>
              )
            ) : Object.keys(calculations.taxByRate).length === 0 ? (
              <div className="flex justify-between text-muted-foreground">
                <span>GST:</span>
                <span className="font-mono font-medium">Rs. 0.00</span>
              </div>
            ) : (
              Object.keys(calculations.taxByRate)
                .sort((a, b) => Number(a) - Number(b))
                .map((rate) => {
                  const amt = calculations.taxByRate[rate];
                  if (isMadhyaPradesh) {
                    const halfRate = (Number(rate) / 2).toFixed(1);
                    const halfAmt = amt / 2;
                    return (
                      <React.Fragment key={rate}>
                        <div className="flex justify-between text-muted-foreground">
                          <span>CGST ({halfRate}%):</span>
                          <span className="font-mono font-medium">Rs. {halfAmt.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>SGST ({halfRate}%):</span>
                          <span className="font-mono font-medium">Rs. {halfAmt.toFixed(2)}</span>
                        </div>
                      </React.Fragment>
                    );
                  }
                  return (
                    <div key={rate} className="flex justify-between text-muted-foreground">
                      <span>IGST ({rate}%):</span>
                      <span className="font-mono font-medium">Rs. {amt.toFixed(2)}</span>
                    </div>
                  );
                })
            )}

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
          className="btn-outline flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-medium rounded-xl w-full sm:w-auto"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Reset to Sample Data
        </button>

        <button
          type="button"
          onClick={handleGeneratePdf}
          className="btn-solid flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold shadow-lg rounded-xl hover:opacity-95 transition w-full sm:w-auto"
        >
          <Download className="h-4 w-4" />
          Generate & Download Official Invoice (PDF)
        </button>
      </div>
    </div>
  );
}
