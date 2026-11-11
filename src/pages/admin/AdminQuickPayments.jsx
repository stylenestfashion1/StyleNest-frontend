import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { 
  Copy, 
  ExternalLink, 
  Share2, 
  Search, 
  Receipt, 
  Check, 
  RefreshCw, 
  DollarSign, 
  CreditCard,
  MessageCircle,
  HelpCircle,
  Eye,
  X,
  MapPin,
  Mail,
  Phone,
  Calendar,
  FileText,
  Download,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Package,
  Pencil,
  Save,
  RotateCcw
} from "lucide-react";
import { downloadQuickPayInvoicePdf } from "../../utils/quickPayInvoicePdf";
import { downloadShippingLabelPdf } from "../../utils/shippingLabelPdf";
import * as adminApi from "../../api/admin";
import { formatDate, formatPrice } from "../../utils/format";
import { StatusPill } from "../../components/StatusPill";
import BackButton from "../../components/BackButton";
import { useToast } from "../../context/ToastContext";

// A "FAILED" quick payment can mean three very different things to the
// customer-facing story: the bank actually declined the card, the customer
// backed out themselves on PayGlocal's page, or they never got that far at
// all before the 20-minute session expired. Only `failureReason` (the raw
// PayGlocal status, or "EXPIRED" from the abandon scheduler) distinguishes
// these -- treating them all as "declined by bank" tells the admin to chase
// a bank issue that was never actually contacted.
function getFailureDetails(reason) {
  if (!reason || reason === "EXPIRED") {
    return {
      title: "Customer Never Completed Payment",
      body: "The customer opened the checkout session but never finished entering card details, and it expired automatically after 20 minutes. No bank was ever contacted and nothing was attempted. Share a fresh payment link if they still want to pay.",
    };
  }
  if (reason === "CUSTOMER_CANCELLED") {
    return {
      title: "Cancelled by Customer",
      body: "The customer backed out of PayGlocal's payment page themselves before completing it. Customer was NOT charged.",
    };
  }
  return {
    title: `Payment Declined by Card Issuing Bank (${reason})`,
    body: "Customer was NOT charged. International cross-border transactions are often disabled by default in foreign banking apps. Share the retry link or contact them directly via WhatsApp below.",
  };
}

export function isAddressIncomplete(p) {
  if (!p) return false;
  const line1 = String(p.addressLine1 || p.address_line1 || "").trim();
  if (!line1 || line1.length < 5) return true;

  const ROAD_TYPES = new Set([
    "rd", "road", "st", "street", "ave", "avenue", "dr", "drive", "ln", "lane",
    "blvd", "boulevard", "ct", "court", "cir", "circle", "way", "hwy", "highway",
    "pkwy", "parkway", "pl", "place", "sq", "square", "loop", "ter", "terrace"
  ]);

  const tokens = line1.replace(/[,\.#]/g, " ").split(/\s+/).filter(Boolean);
  if (tokens.length <= 2) {
    const isFirstNum = /^\d+[\w-]*$/.test(tokens[0]);
    const isSecondRoad = tokens[1] && ROAD_TYPES.has(tokens[1].toLowerCase());
    if (isFirstNum && isSecondRoad) return true;
  }
  const city = String(p.city || "").trim();
  const postalCode = String(p.postalCode || p.postal_code || "").trim();
  const country = String(p.country || "").trim();
  if (!city || !postalCode || !country) return true;
  return false;
}

export default function AdminQuickPayments() {
  const { notify } = useToast();
  const queryClient = useQueryClient();
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin", "quick-payments"],
    queryFn: adminApi.getAdminQuickPayments,
  });

  const payments = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (data.data && Array.isArray(data.data)) return data.data;
    return [];
  }, [data]);

  // Link Generator State
  const [genAmount, setGenAmount] = useState("");
  const [genCurrency, setGenCurrency] = useState("INR");
  const [genNote, setGenNote] = useState("");
  const [genCustomerName, setGenCustomerName] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currencyFilter, setCurrencyFilter] = useState("ALL");

  // Selected Payment Detail Modal State
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  const [downloadingLabel, setDownloadingLabel] = useState(false);

  // Edit Address State inside Modal
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [editAddressForm, setEditAddressForm] = useState({
    customerName: "",
    customerPhone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
  });

  const handleStartEditAddress = (p) => {
    setEditAddressForm({
      customerName: p.customerName || "",
      customerPhone: p.customerPhone || "",
      addressLine1: p.addressLine1 || "",
      addressLine2: p.addressLine2 || "",
      city: p.city || "",
      state: p.state || "",
      postalCode: p.postalCode || "",
      country: p.country || "UNITED STATES",
    });
    setIsEditingAddress(true);
  };

  const handleSaveAddress = async (e) => {
    if (e) e.preventDefault();
    if (!editAddressForm.addressLine1.trim()) {
      notify("Street Address Line 1 is required");
      return;
    }
    if (!editAddressForm.city.trim()) {
      notify("City is required");
      return;
    }
    if (!editAddressForm.postalCode.trim()) {
      notify("Postal / ZIP code is required");
      return;
    }
    if (!editAddressForm.country.trim()) {
      notify("Country is required");
      return;
    }

    try {
      setSavingAddress(true);
      const res = await adminApi.updateAdminQuickPaymentAddress(selectedPayment.paymentNumber, editAddressForm);
      const updatedData = res?.data?.data || res?.data || editAddressForm;
      setSelectedPayment((prev) => ({
        ...prev,
        ...updatedData,
      }));
      queryClient.invalidateQueries({ queryKey: ["admin", "quick-payments"] });
      setIsEditingAddress(false);
      notify("Shipping address updated successfully! You can now download the updated label.");
    } catch (err) {
      console.error("Failed to update address", err);
      notify("Failed to update address: " + (err.response?.data?.message || err.message));
    } finally {
      setSavingAddress(false);
    }
  };

  const handleCopyAddress = (p) => {
    if (!p) return;
    const parts = [
      p.customerName,
      p.customerPhone ? `Phone: ${p.customerPhone}` : "",
      [p.addressLine1, p.addressLine2].filter(Boolean).join(", "),
      `${[p.city, p.state].filter(Boolean).join(", ")} ${p.postalCode || ""}`.trim(),
      p.country
    ].filter(Boolean);
    navigator.clipboard.writeText(parts.join("\n"));
    setCopiedAddress(true);
    notify("Full shipping address copied to clipboard!");
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handleDownloadInvoice = async (p) => {
    try {
      setDownloadingInvoice(true);
      await downloadQuickPayInvoicePdf(p);
      notify("Official Invoice PDF downloaded successfully!");
    } catch (err) {
      console.error("Failed to generate invoice", err);
      notify("Failed to generate invoice PDF");
    } finally {
      setDownloadingInvoice(false);
    }
  };

  const handleDownloadShippingLabel = async (p) => {
    try {
      setDownloadingLabel(true);
      downloadShippingLabelPdf(p);
      notify("Official 4x6 Shipping Label PDF downloaded!");
    } catch (err) {
      console.error("Failed to generate shipping label", err);
      notify("Failed to generate shipping label PDF");
    } finally {
      setDownloadingLabel(false);
    }
  };

  // Computed Generated URL
  const generatedUrl = useMemo(() => {
    const base = "https://pay.stylenestfashion.com";
    const params = new URLSearchParams();
    if (genAmount && Number(genAmount) > 0) {
      params.append("amount", genAmount.trim());
    }
    if (genCurrency) {
      params.append("currency", genCurrency);
    }
    if (genNote && genNote.trim()) {
      params.append("note", genNote.trim());
    }
    const qs = params.toString();
    return qs ? `${base}/?${qs}` : base;
  }, [genAmount, genCurrency, genNote]);

  const handleCopyGeneratedLink = () => {
    navigator.clipboard.writeText(generatedUrl);
    setCopiedLink(true);
    notify("Direct Payment link copied to clipboard!", "success");
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const greeting = genCustomerName.trim() ? `Dear ${genCustomerName.trim()},` : "Hello,";
    const amountText = genAmount ? `${genCurrency === "USD" ? "$" : "₹"}${genAmount}` : "";
    const noteText = genNote.trim() ? `\n• For: ${genNote.trim()}` : "";
    const text = `${greeting}
Please find your secure direct payment link from StyleNest Fashion:${noteText}${amountText ? `\n• Amount: ${amountText}` : ""}

Pay here: ${generatedUrl}

Instant payment confirmation and invoice receipt will be sent upon completion. Thank you!`;

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleCopyPaymentLink = (paymentNumber) => {
    const url = `https://pay.stylenestfashion.com/receipt?paymentNumber=${paymentNumber}`;
    navigator.clipboard.writeText(url);
    setCopiedId(paymentNumber);
    notify(`Receipt link for ${paymentNumber} copied!`, "success");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Metrics calculation
  const metrics = useMemo(() => {
    let inrTotal = 0;
    let usdTotal = 0;
    let paidCount = 0;
    let pendingCount = 0;
    let failedCount = 0;

    payments.forEach((p) => {
      const amt = Number(p.amount) || 0;
      if (p.paymentStatus === "PAID") {
        paidCount++;
        if (p.currency === "USD") {
          usdTotal += amt;
        } else {
          inrTotal += amt;
        }
      } else if (p.paymentStatus === "PENDING") {
        pendingCount++;
      } else {
        failedCount++;
      }
    });

    return { inrTotal, usdTotal, paidCount, pendingCount, failedCount, total: payments.length };
  }, [payments]);

  // Filtered List
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      // Status filter
      if (statusFilter !== "ALL" && p.paymentStatus !== statusFilter) {
        return false;
      }
      // Currency filter
      if (currencyFilter !== "ALL" && p.currency !== currencyFilter) {
        return false;
      }
      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const num = (p.paymentNumber || "").toLowerCase();
        const name = (p.customerName || "").toLowerCase();
        const email = (p.customerEmail || "").toLowerCase();
        const phone = (p.customerPhone || "").toLowerCase();
        const note = (p.note || "").toLowerCase();
        const txn = (p.payglocalTxnId || "").toLowerCase();
        return num.includes(q) || name.includes(q) || email.includes(q) || phone.includes(q) || note.includes(q) || txn.includes(q);
      }
      return true;
    });
  }, [payments, statusFilter, currencyFilter, searchTerm]);

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div>
        <BackButton fallback="/admin" className="mb-3" />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl">Quick Payments & Direct Settlements</h2>
            <p className="label-xs mt-1 text-muted-foreground">
              Direct B2B payments generated for WhatsApp/call deals without catalog or cart restrictions.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="label-xs flex items-center gap-1.5 border px-3 py-2 transition-colors hover:bg-muted"
              title="Refresh list"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <a
              href="https://pay.stylenestfashion.com"
              target="_blank"
              rel="noopener noreferrer"
              className="label-xs flex items-center gap-1.5 bg-accent px-4 py-2 text-white transition-opacity hover:opacity-90"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open Customer Portal
            </a>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="border bg-card p-5">
          <p className="label-xs text-muted-foreground">Settled Revenue (INR)</p>
          <p className="display mt-2 text-2xl">₹{metrics.inrTotal.toLocaleString("en-IN")}</p>
          <p className="label-xs mt-2 text-accent">{metrics.paidCount} paid settlements</p>
        </div>

        <div className="border bg-card p-5">
          <p className="label-xs text-muted-foreground">Settled Revenue (USD)</p>
          <p className="display mt-2 text-2xl">${metrics.usdTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
          <p className="label-xs mt-2 text-accent">International PayGlocal</p>
        </div>

        <div className="border bg-card p-5">
          <p className="label-xs text-muted-foreground">Pending / Initiated</p>
          <p className="display mt-2 text-2xl">{metrics.pendingCount}</p>
          <p className="label-xs mt-2 text-muted-foreground">Awaiting payment</p>
        </div>

        <div className="border bg-card p-5">
          <p className="label-xs text-muted-foreground">Total Transactions</p>
          <p className="display mt-2 text-2xl">{metrics.total}</p>
          <p className="label-xs mt-2 text-muted-foreground">{metrics.failedCount} expired / failed</p>
        </div>
      </div>

      {/* WhatsApp 1-Click Link Generator Tool */}
      <div className="border bg-muted/20 p-6 md:p-8">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-accent" />
          <h3 className="text-base font-medium">Instant WhatsApp Payment Link Generator</h3>
        </div>
        <p className="label-xs mt-1 text-muted-foreground">
          Negotiating with a buyer on WhatsApp or phone? Enter the negotiated amount & note below to generate an instant pre-filled link.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="label-xs mb-1 block text-muted-foreground">Currency</label>
            <div className="flex border">
              <button
                type="button"
                onClick={() => setGenCurrency("INR")}
                className={`flex-1 py-2 text-xs font-medium transition-colors ${
                  genCurrency === "INR" ? "bg-accent text-white" : "hover:bg-muted"
                }`}
              >
                ₹ INR (Domestic)
              </button>
              <button
                type="button"
                onClick={() => setGenCurrency("USD")}
                className={`flex-1 py-2 text-xs font-medium transition-colors ${
                  genCurrency === "USD" ? "bg-accent text-white" : "hover:bg-muted"
                }`}
              >
                $ USD (Export)
              </button>
            </div>
          </div>

          <div>
            <label className="label-xs mb-1 block text-muted-foreground">Amount ({genCurrency})</label>
            <input
              type="number"
              min="1"
              step="any"
              placeholder={genCurrency === "INR" ? "e.g. 25000" : "e.g. 500"}
              value={genAmount}
              onChange={(e) => setGenAmount(e.target.value)}
              className="w-full border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          <div>
            <label className="label-xs mb-1 block text-muted-foreground">Order Note / Reference</label>
            <input
              type="text"
              placeholder="e.g. Wholesale 200pcs Denim #884"
              value={genNote}
              onChange={(e) => setGenNote(e.target.value)}
              className="w-full border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          <div>
            <label className="label-xs mb-1 block text-muted-foreground">Customer Name (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Rahul Sharma"
              value={genCustomerName}
              onChange={(e) => setGenCustomerName(e.target.value)}
              className="w-full border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        </div>

        {/* Generated Link Preview Bar */}
        <div className="mt-5 flex flex-wrap items-center gap-3 border bg-background p-3">
          <div className="min-w-0 flex-1">
            <p className="label-xs text-muted-foreground">Generated Shareable Link:</p>
            <p className="truncate font-mono text-xs text-accent">{generatedUrl}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyGeneratedLink}
              className="label-xs flex items-center gap-1.5 border px-3 py-2 transition-colors hover:bg-muted"
            >
              {copiedLink ? <Check className="h-3.5 w-3.5 text-accent" /> : <Copy className="h-3.5 w-3.5" />}
              {copiedLink ? "Copied!" : "Copy Link"}
            </button>
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="label-xs flex items-center gap-1.5 bg-[#25D366] px-3.5 py-2 text-white transition-opacity hover:opacity-90"
            >
              <Share2 className="h-3.5 w-3.5" />
              Share on WhatsApp
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Section */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
          <h3 className="text-base font-medium">All Direct Transactions</h3>

          {/* Filters & Search */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search payment, name, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-60 border bg-background py-1.5 pl-8 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>

            {/* Currency Filter */}
            <select
              value={currencyFilter}
              onChange={(e) => setCurrencyFilter(e.target.value)}
              className="border bg-background px-2.5 py-1.5 text-xs focus:outline-none"
            >
              <option value="ALL">All Currencies</option>
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border bg-background px-2.5 py-1.5 text-xs focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="PAID">PAID</option>
              <option value="PENDING">PENDING</option>
              <option value="FAILED">FAILED</option>
            </select>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="skeleton mt-6 h-80 w-full" />
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b">
                  <th className="label-xs py-3 font-normal text-muted-foreground whitespace-nowrap">Payment ID & Date</th>
                  <th className="label-xs py-3 font-normal text-muted-foreground">Customer</th>
                  <th className="label-xs py-3 font-normal text-muted-foreground whitespace-nowrap">Amount</th>
                  <th className="label-xs py-3 font-normal text-muted-foreground">Note / Reference</th>
                  <th className="label-xs py-3 font-normal text-muted-foreground whitespace-nowrap">Status</th>
                  <th className="label-xs py-3 font-normal text-muted-foreground text-right pr-4 whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((p) => (
                  <tr 
                    key={p.paymentNumber} 
                    onClick={() => setSelectedPayment(p)}
                    className="border-b transition-colors hover:bg-muted/60 cursor-pointer"
                  >
                    {/* Payment ID & Date */}
                    <td className="py-3.5 whitespace-nowrap">
                      <p className="font-mono text-xs font-semibold text-foreground">{p.paymentNumber}</p>
                      <p className="label-xs mt-0.5 text-muted-foreground">
                        {p.createdAt ? formatDate(p.createdAt) : "—"}
                      </p>
                    </td>

                    {/* Customer Info (Clean: Name + Location; Full details in View modal) */}
                    <td className="py-3.5">
                      <p className="font-semibold text-xs text-foreground">{p.customerName || "Wholesale Buyer"}</p>
                      <p className="label-xs text-muted-foreground mt-0.5">
                        {[p.city, p.country].filter(Boolean).join(", ") || p.customerEmail || "—"}
                      </p>
                      {isAddressIncomplete(p) && (
                        <span className="inline-flex items-center gap-1 mt-1 rounded bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400" title="Street address appears incomplete (missing road name)">
                          ⚠️ Incomplete Address
                        </span>
                      )}
                    </td>

                    {/* Amount & Currency */}
                    <td className="py-3.5 whitespace-nowrap">
                      <span className="font-semibold text-xs text-foreground">
                        {p.currency === "USD" ? `$${Number(p.amount).toFixed(2)}` : `₹${Number(p.amount).toLocaleString("en-IN")}`}
                      </span>
                      <span className="label-xs ml-1.5 border px-1.5 py-0.5 text-muted-foreground">
                        {p.currency}
                      </span>
                    </td>

                    {/* Note / Purpose */}
                    <td className="py-3.5 max-w-[200px]">
                      <p className="truncate text-xs text-muted-foreground" title={p.note}>
                        {p.note || "Direct Wholesale Payment"}
                      </p>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 whitespace-nowrap">
                      <StatusPill status={p.paymentStatus} />
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 text-right pr-4 whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {(p.paymentStatus === "PAID" || p.paymentStatus === "SUCCESS") && (
                          <button
                            type="button"
                            onClick={() => handleDownloadShippingLabel(p)}
                            disabled={downloadingLabel}
                            className="label-xs flex items-center gap-1 border border-[#9A4D16]/40 bg-[#9A4D16]/10 px-2.5 py-1 text-xs text-[#9A4D16] font-semibold transition-colors hover:bg-[#9A4D16] hover:text-white rounded cursor-pointer"
                            title="Download 4x6 Shipping Label PDF for this paid order"
                          >
                            <Package className="h-3 w-3" />
                            Label
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setSelectedPayment(p)}
                          className="label-xs flex items-center gap-1 border border-accent/40 bg-accent/5 px-2.5 py-1 text-xs text-accent transition-colors hover:bg-accent hover:text-white rounded"
                          title="View complete customer & shipping details"
                        >
                          <Eye className="h-3 w-3" />
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyPaymentLink(p.paymentNumber)}
                          className="label-xs flex items-center gap-1 border px-2.5 py-1 text-xs transition-colors hover:bg-muted rounded"
                          title="Copy receipt link"
                        >
                          {copiedId === p.paymentNumber ? (
                            <Check className="h-3 w-3 text-accent" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                          Link
                        </button>
                        <a
                          href={`https://pay.stylenestfashion.com/receipt?paymentNumber=${p.paymentNumber}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="label-xs flex items-center gap-1 border px-2.5 py-1 text-xs transition-colors hover:bg-muted rounded"
                          title="View receipt"
                        >
                          <Receipt className="h-3 w-3" />
                          Receipt
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredPayments.length === 0 && (
              <div className="py-12 text-center">
                <Receipt className="mx-auto h-8 w-8 text-muted-foreground/50" />
                <p className="mt-3 text-sm text-muted-foreground">
                  {searchTerm || statusFilter !== "ALL" || currencyFilter !== "ALL"
                    ? "No quick payments match the selected filters."
                    : "No quick payments initiated yet."}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* CUSTOMER PAYMENT & SHIPPING DETAIL MODAL                 */}
      {/* ======================================================== */}
      {selectedPayment && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in"
          onClick={() => setSelectedPayment(null)}
        >
          <div 
            className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border bg-card p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b pb-4">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold font-serif">
                    {selectedPayment.customerName || "Customer Record"}
                  </h2>
                  <StatusPill status={selectedPayment.paymentStatus} />
                </div>
                <p className="mt-1 font-mono text-xs text-muted-foreground flex items-center gap-2">
                  <span>Ref: {selectedPayment.paymentNumber}</span>
                  <span>•</span>
                  <span>{selectedPayment.createdAt ? formatDate(selectedPayment.createdAt) : "—"}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPayment(null)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Status Context Alert Banner */}
            {selectedPayment.paymentStatus === "PAID" && (
              <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-semibold text-emerald-700 dark:text-emerald-400">Payment Successfully Settled</p>
                  <p className="text-muted-foreground mt-0.5">
                    Verified by PayGlocal. Order is confirmed and ready for dispatch. Commercial invoice can be downloaded below.
                  </p>
                </div>
              </div>
            )}

            {selectedPayment.paymentStatus === "FAILED" && (() => {
              const { title, body } = getFailureDetails(selectedPayment.failureReason);
              return (
                <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-semibold text-destructive">{title}</p>
                    <p className="text-muted-foreground mt-0.5">{body}</p>
                  </div>
                </div>
              );
            })()}

            {selectedPayment.paymentStatus === "PENDING" && (
              <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 flex items-start gap-3">
                <Clock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-semibold text-amber-700 dark:text-amber-400">Payment Session Pending</p>
                  <p className="text-muted-foreground mt-0.5">
                    The customer initiated the checkout session but has not completed payment yet. You can send them a reminder link.
                  </p>
                </div>
              </div>
            )}

            {/* 2-Column Information Grid */}
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
              
              {/* 1. Customer Contact Details */}
              <div className="rounded-xl border bg-muted/20 p-4 flex flex-col justify-between">
                <div>
                  <h4 className="font-semibold text-foreground flex items-center gap-1.5 border-b pb-2 text-sm">
                    <Mail className="h-4 w-4 text-accent" />
                    Customer Information
                  </h4>
                  <div className="mt-3 space-y-2">
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Full Name</span>
                      <span className="font-medium text-foreground text-sm">{selectedPayment.customerName || "—"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Email Address</span>
                      <a href={`mailto:${selectedPayment.customerEmail}`} className="font-medium text-accent hover:underline">
                        {selectedPayment.customerEmail || "—"}
                      </a>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Contact Phone</span>
                      <div className="flex items-center gap-2">
                        <a href={`tel:${selectedPayment.customerPhone}`} className="font-medium hover:underline">
                          {selectedPayment.customerPhone || "—"}
                        </a>
                        {selectedPayment.customerPhone && (
                          <a
                            href={`https://wa.me/${selectedPayment.customerPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                              `Hello ${selectedPayment.customerName || ""}, regarding your StyleNest Fashion wholesale payment ref ${selectedPayment.paymentNumber}: `
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded bg-[#25D366]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#25D366] hover:bg-[#25D366]/20"
                            title="Chat on WhatsApp"
                          >
                            <MessageCircle className="h-3 w-3" /> WhatsApp
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Complete Shipping & Postal Address */}
              <div className="rounded-xl border bg-muted/20 p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b pb-2">
                    <h4 className="font-semibold text-foreground flex items-center gap-1.5 text-sm">
                      <MapPin className="h-4 w-4 text-accent" />
                      Shipping Address
                    </h4>
                    <div className="flex items-center gap-2">
                      {!isEditingAddress ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleStartEditAddress(selectedPayment)}
                            className="label-xs flex items-center gap-1 text-accent hover:underline cursor-pointer"
                            title="Edit customer shipping address"
                          >
                            <Pencil className="h-3 w-3" />
                            Edit
                          </button>
                          <span className="text-muted-foreground">•</span>
                          <button
                            type="button"
                            onClick={() => handleCopyAddress(selectedPayment)}
                            className="label-xs flex items-center gap-1 text-accent hover:underline cursor-pointer"
                            title="Copy formatted address for courier"
                          >
                            {copiedAddress ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                            {copiedAddress ? "Copied!" : "Copy"}
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsEditingAddress(false)}
                          className="label-xs text-muted-foreground hover:underline cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Warning banner for incomplete address */}
                  {!isEditingAddress && isAddressIncomplete(selectedPayment) && (
                    <div className="mt-3 rounded-lg bg-amber-500/10 border border-amber-500/30 p-2.5 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                      <div>
                        <p className="font-semibold">Incomplete Delivery Address</p>
                        <p className="text-[11px] mt-0.5">
                          The street address <code className="bg-amber-500/20 px-1 py-0.5 rounded font-mono font-bold">{selectedPayment.addressLine1 || "empty"}</code> appears incomplete (missing road name). Please click <strong>Edit</strong> to correct before generating dispatch labels.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Edit Form or Read-only Display */}
                  {isEditingAddress ? (
                    <form onSubmit={handleSaveAddress} className="mt-3 space-y-2.5 text-xs">
                      <div>
                        <label className="block text-[11px] font-semibold text-muted-foreground mb-0.5">
                          Street Address Line 1 *
                        </label>
                        <input
                          type="text"
                          required
                          value={editAddressForm.addressLine1}
                          onChange={(e) => setEditAddressForm({ ...editAddressForm, addressLine1: e.target.value })}
                          placeholder="e.g. 6680 Old Pascagoula Rd"
                          className="w-full px-2.5 py-1.5 rounded-lg border bg-background text-xs font-medium focus:ring-1 focus:ring-accent focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-muted-foreground mb-0.5">
                          Address Line 2 (Apt / Suite / Unit)
                        </label>
                        <input
                          type="text"
                          value={editAddressForm.addressLine2}
                          onChange={(e) => setEditAddressForm({ ...editAddressForm, addressLine2: e.target.value })}
                          placeholder="e.g. Apt 4B (Optional)"
                          className="w-full px-2.5 py-1.5 rounded-lg border bg-background text-xs font-medium focus:ring-1 focus:ring-accent focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-muted-foreground mb-0.5">City *</label>
                          <input
                            type="text"
                            required
                            value={editAddressForm.city}
                            onChange={(e) => setEditAddressForm({ ...editAddressForm, city: e.target.value })}
                            className="w-full px-2.5 py-1.5 rounded-lg border bg-background text-xs font-medium focus:ring-1 focus:ring-accent focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-muted-foreground mb-0.5">State / Region</label>
                          <input
                            type="text"
                            value={editAddressForm.state}
                            onChange={(e) => setEditAddressForm({ ...editAddressForm, state: e.target.value })}
                            className="w-full px-2.5 py-1.5 rounded-lg border bg-background text-xs font-medium focus:ring-1 focus:ring-accent focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-muted-foreground mb-0.5">Postal / ZIP Code *</label>
                          <input
                            type="text"
                            required
                            value={editAddressForm.postalCode}
                            onChange={(e) => setEditAddressForm({ ...editAddressForm, postalCode: e.target.value })}
                            className="w-full px-2.5 py-1.5 rounded-lg border bg-background text-xs font-medium focus:ring-1 focus:ring-accent focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-muted-foreground mb-0.5">Country *</label>
                          <input
                            type="text"
                            required
                            value={editAddressForm.country}
                            onChange={(e) => setEditAddressForm({ ...editAddressForm, country: e.target.value.toUpperCase() })}
                            className="w-full px-2.5 py-1.5 rounded-lg border bg-background text-xs font-medium focus:ring-1 focus:ring-accent focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="pt-2 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setIsEditingAddress(false)}
                          disabled={savingAddress}
                          className="px-3 py-1.5 text-xs rounded border hover:bg-muted transition"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={savingAddress}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded bg-accent text-white font-semibold shadow hover:opacity-95 transition cursor-pointer"
                        >
                          <Save className="h-3 w-3" />
                          {savingAddress ? "Saving..." : "Save Address"}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="mt-3 space-y-2">
                      <div>
                        <span className="text-muted-foreground block text-[11px]">Street Address</span>
                        <span className="font-medium text-foreground">
                          {[selectedPayment.addressLine1, selectedPayment.addressLine2].filter(Boolean).join(", ") || "—"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-muted-foreground block text-[11px]">City</span>
                          <span className="font-medium">{selectedPayment.city || "—"}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[11px]">State / Region</span>
                          <span className="font-medium">{selectedPayment.state || "—"}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-muted-foreground block text-[11px]">Postal / ZIP Code</span>
                          <span className="inline-block rounded bg-accent/15 px-2 py-0.5 font-mono text-xs font-bold text-accent">
                            {selectedPayment.postalCode || "—"}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[11px]">Country</span>
                          <span className="font-medium">{selectedPayment.country || "—"}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Payment & Settlement Breakdown */}
              <div className="rounded-xl border bg-muted/20 p-4">
                <h4 className="font-semibold text-foreground flex items-center gap-1.5 border-b pb-2 text-sm">
                  <CreditCard className="h-4 w-4 text-accent" />
                  Financial Summary
                </h4>
                <div className="mt-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="font-bold text-base text-foreground">
                      {selectedPayment.currency === "USD" ? `${Number(selectedPayment.amount).toFixed(2)}` : `₹${Number(selectedPayment.amount).toLocaleString("en-IN")}`} ${selectedPayment.currency}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Payment Status:</span>
                    <StatusPill status={selectedPayment.paymentStatus} />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Purpose / Note:</span>
                    <span className="font-medium text-right max-w-[180px] truncate" title={selectedPayment.note}>
                      {selectedPayment.note || "Direct Payment"}
                    </span>
                  </div>
                </div>
              </div>

              {/* 4. Gateway Audit Details */}
              <div className="rounded-xl border bg-muted/20 p-4">
                <h4 className="font-semibold text-foreground flex items-center gap-1.5 border-b pb-2 text-sm">
                  <Receipt className="h-4 w-4 text-accent" />
                  Gateway Audit Trail
                </h4>
                <div className="mt-3 space-y-2 font-mono text-[11px]">
                  <div>
                    <span className="text-muted-foreground font-sans block text-[10px]">Payment Reference Number</span>
                    <span className="font-bold">{selectedPayment.paymentNumber}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-sans block text-[10px]">PayGlocal GID</span>
                    <span className="truncate block" title={selectedPayment.payglocalGid || "N/A"}>
                      {selectedPayment.payglocalGid || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-sans block text-[10px]">PayGlocal Txn ID</span>
                    <span className="truncate block" title={selectedPayment.payglocalTxnId || "N/A"}>
                      {selectedPayment.payglocalTxnId || "—"}
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Action Footer */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
              <div className="flex items-center gap-2">
                {(selectedPayment.paymentStatus === "PAID" || selectedPayment.paymentStatus === "SUCCESS") && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleDownloadInvoice(selectedPayment)}
                      disabled={downloadingInvoice}
                      className="label-xs flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-white font-medium shadow hover:opacity-95 transition cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5" />
                      {downloadingInvoice ? "Generating..." : "Download Invoice (PDF)"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadShippingLabel(selectedPayment)}
                      disabled={downloadingLabel}
                      className="label-xs flex items-center gap-1.5 rounded-lg bg-[#9A4D16] px-4 py-2 text-white font-medium shadow hover:opacity-95 transition cursor-pointer"
                    >
                      <Package className="h-3.5 w-3.5" />
                      {downloadingLabel ? "Generating..." : "Shipping Label (4×6)"}
                    </button>
                  </>
                )}

                <a
                  href={`https://pay.stylenestfashion.com/receipt?paymentNumber=${selectedPayment.paymentNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="label-xs flex items-center gap-1.5 rounded-lg border px-3.5 py-2 hover:bg-muted transition"
                >
                  <Receipt className="h-3.5 w-3.5" />
                  View Public Receipt
                </a>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyPaymentLink(selectedPayment.paymentNumber)}
                  className="label-xs flex items-center gap-1.5 rounded-lg border px-3.5 py-2 hover:bg-muted transition"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy Payment Link
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPayment(null)}
                  className="label-xs rounded-lg border bg-muted/60 px-4 py-2 text-muted-foreground hover:bg-muted hover:text-foreground transition"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

