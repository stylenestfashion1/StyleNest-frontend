import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
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
  HelpCircle
} from "lucide-react";
import * as adminApi from "../../api/admin";
import { formatDate, formatPrice } from "../../utils/format";
import { StatusPill } from "../../components/StatusPill";
import BackButton from "../../components/BackButton";
import { useToast } from "../../context/ToastContext";

export default function AdminQuickPayments() {
  const { notify } = useToast();
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
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead>
                <tr className="border-b">
                  {["Payment ID & Date", "Customer Details", "Amount", "Note / Reference", "Gateway Txn", "Status", "Actions"].map((h) => (
                    <th key={h} className="label-xs py-3 font-normal text-muted-foreground">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((p) => (
                  <tr key={p.paymentNumber} className="border-b transition-colors hover:bg-muted/40">
                    {/* Payment ID & Date */}
                    <td className="py-4">
                      <p className="font-mono text-xs font-medium">{p.paymentNumber}</p>
                      <p className="label-xs mt-0.5 text-muted-foreground">
                        {p.createdAt ? formatDate(p.createdAt) : "—"}
                      </p>
                    </td>

                    {/* Customer Info */}
                    <td className="py-4">
                      <p className="font-medium">{p.customerName || "—"}</p>
                      <p className="label-xs text-muted-foreground">{p.customerEmail}</p>
                      <p className="label-xs text-muted-foreground">{p.customerPhone}</p>
                      {(p.city || p.country) && (
                        <p className="label-xs text-muted-foreground">
                          {[p.city, p.country].filter(Boolean).join(", ")}
                        </p>
                      )}
                    </td>

                    {/* Amount & Currency */}
                    <td className="py-4">
                      <span className="font-medium">
                        {p.currency === "USD" ? `$${Number(p.amount).toFixed(2)}` : `₹${Number(p.amount).toLocaleString("en-IN")}`}
                      </span>
                      <span className="label-xs ml-1.5 border px-1.5 py-0.5 text-muted-foreground">
                        {p.currency}
                      </span>
                    </td>

                    {/* Note / Purpose */}
                    <td className="py-4 max-w-[200px]">
                      <p className="truncate text-xs text-muted-foreground" title={p.note}>
                        {p.note || "Direct Payment"}
                      </p>
                    </td>

                    {/* Gateway Ref */}
                    <td className="py-4">
                      {p.payglocalTxnId ? (
                        <span className="font-mono text-xs text-muted-foreground" title={p.payglocalTxnId}>
                          {p.payglocalTxnId.length > 14 ? `${p.payglocalTxnId.substring(0, 14)}...` : p.payglocalTxnId}
                        </span>
                      ) : (
                        <span className="label-xs text-muted-foreground">—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-4">
                      <StatusPill status={p.paymentStatus} />
                    </td>

                    {/* Actions */}
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopyPaymentLink(p.paymentNumber)}
                          className="label-xs flex items-center gap-1 border px-2.5 py-1 text-xs transition-colors hover:bg-muted"
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
                          className="label-xs flex items-center gap-1 border px-2.5 py-1 text-xs transition-colors hover:bg-muted"
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
    </div>
  );
}
