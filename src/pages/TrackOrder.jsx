import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Download, FileText } from "lucide-react";
import * as ordersApi from "../api/orders";
import { formatDate, formatPrice } from "../utils/format";
import { StatusPill } from "../components/StatusPill";
import { PageFade } from "../components/Reveal";
import InvoiceView from "../components/InvoiceView";

export default function TrackOrder() {
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ orderNumber: searchParams.get("orderNumber") || "", phone: "" });
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [invoice, setInvoice] = useState(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceError, setInvoiceError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const paymentOutcome = searchParams.get("payment");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setOrder(null);
    setInvoice(null);
    setInvoiceError("");
    setLoading(true);
    try {
      const result = await ordersApi.trackGuestOrder(form);
      setOrder(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleViewInvoice() {
    if (invoice) {
      setInvoice(null);
      return;
    }
    setInvoiceLoading(true);
    setInvoiceError("");
    try {
      const result = await ordersApi.getGuestOrderInvoiceView({ orderNumber: form.orderNumber, phone: form.phone });
      setInvoice(result);
    } catch (err) {
      setInvoiceError(err.message);
    } finally {
      setInvoiceLoading(false);
    }
  }

  async function handleDownloadInvoice() {
    setDownloading(true);
    try {
      const blob = await ordersApi.getGuestOrderInvoicePdfBlob({ orderNumber: form.orderNumber, phone: form.phone });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Invoice-${form.orderNumber}.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      setInvoiceError(err.message);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <PageFade>
      <div className="mx-auto flex min-h-[72vh] max-w-[1440px] flex-col items-center justify-center px-5 py-16 md:px-10">
        <div className="hairline-card w-full max-w-md p-8 md:p-10">
          <p className="label-xs text-center text-accent">StyleNest Fashion</p>
          <h1 className="mt-6 text-center text-3xl">Track Your Order</h1>
          <p className="mt-3 text-center text-sm text-muted-foreground">Enter your order number and the phone number used at checkout.</p>

          {paymentOutcome && (
            <p className={`mt-6 text-center text-sm ${paymentOutcome === "success" ? "text-accent" : "text-destructive"}`}>
              {paymentOutcome === "success"
                ? "Payment successful — enter your phone number below to view your order."
                : "Payment was not completed. Enter your phone number below to check your order's status."}
            </p>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <label className="block">
              <span className="label-xs text-muted-foreground">Order Number</span>
              <input required value={form.orderNumber} onChange={(e) => setForm((f) => ({ ...f, orderNumber: e.target.value }))} className="field mt-2" />
            </label>
            <label className="block">
              <span className="label-xs text-muted-foreground">Phone Number</span>
              <input required value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="field mt-2" />
            </label>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <button disabled={loading} className="btn-solid w-full">
              {loading ? "Searching..." : "Track Order"}
            </button>
          </form>

          {order && (
            <div className="mt-10 border-t pt-8">
              <div className="flex items-center justify-between">
                <span className="text-sm">Order #{order.orderNumber}</span>
                <StatusPill status={order.orderStatus} />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
              <div className="mt-4 flex flex-col divide-y">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between py-2 text-sm">
                    <span>
                      {item.productName} × {item.quantity}
                    </span>
                    <span>{formatPrice(item.subtotal, order.currency)}</span>
                  </div>
                ))}
              </div>
              {order.shipmentStatus && <p className="label-xs mt-4 text-muted-foreground">Shipment: {order.shipmentStatus}</p>}

              {order.invoiceAvailable && (
                <div className="mt-6 flex flex-wrap items-center gap-5 border-t pt-6">
                  <button onClick={handleViewInvoice} disabled={invoiceLoading} className="label-xs link-underline inline-flex items-center gap-2 text-accent">
                    <FileText className="h-3.5 w-3.5" />
                    {invoiceLoading ? "Loading..." : invoice ? "Hide invoice" : "View invoice"}
                  </button>
                  <button onClick={handleDownloadInvoice} disabled={downloading} className="label-xs link-underline inline-flex items-center gap-2 text-accent">
                    <Download className="h-3.5 w-3.5" />
                    {downloading ? "Downloading..." : "Download invoice"}
                  </button>
                </div>
              )}
              {invoiceError && <p className="mt-3 text-sm text-destructive">{invoiceError}</p>}
            </div>
          )}
        </div>

        {invoice && (
          <div className="mt-10 w-full max-w-[1100px]">
            <InvoiceView invoice={invoice} />
          </div>
        )}
      </div>
    </PageFade>
  );
}
