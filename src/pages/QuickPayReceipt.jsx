import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { PageFade } from "../components/Reveal";
import { getQuickPaymentStatus } from "../api/quickPay";
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  Printer,
  ShieldCheck,
  Mail,
  RotateCcw,
  ExternalLink,
} from "lucide-react";

export default function QuickPayReceipt() {
  const [searchParams] = useSearchParams();
  const paymentNumber = searchParams.get("paymentNumber");
  const urlStatus = searchParams.get("status");

  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (paymentNumber) {
      getQuickPaymentStatus(paymentNumber)
        .then((data) => {
          setPayment(data);
        })
        .catch((err) => {
          console.error("Failed to fetch payment status:", err);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [paymentNumber]);

  const isSuccess =
    urlStatus === "success" || (payment && payment.paymentStatus === "PAID");

  const currencySymbol =
    payment?.currency === "USD" ? "$" : "₹";

  return (
    <PageFade>
      <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {isSuccess ? (
            <div className="bg-card rounded-3xl border border-border/80 shadow-lg overflow-hidden">
              {/* Top Success Banner */}
              <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-6 py-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <span className="text-xs font-bold tracking-widest uppercase text-emerald-600 dark:text-emerald-400">
                  Payment Confirmed
                </span>
                <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-foreground font-serif">
                  Payment Received Successfully!
                </h1>
                <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
                  Your settlement has been authorized and confirmed via PayGlocal Gateway.
                </p>
              </div>

              {/* Receipt Details Card */}
              <div className="p-6 sm:p-8 space-y-6">
                {/* Amount Highlight */}
                <div className="text-center py-4 bg-muted/40 rounded-2xl border border-border/60">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                    Total Amount Paid
                  </p>
                  <p className="mt-1 text-3xl sm:text-4xl font-extrabold text-foreground font-serif">
                    {payment?.amount
                      ? `${currencySymbol}${parseFloat(payment.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${payment.currency}`
                      : `${currencySymbol} Payment Completed`}
                  </p>
                  <p className="mt-1 text-xs text-emerald-600 font-medium flex items-center justify-center gap-1.5">
                    <ShieldCheck className="h-4 w-4" /> Zero Gateway Fee Charged
                  </p>
                </div>

                {/* Key-Value Breakdown */}
                <div className="divide-y divide-border text-sm">
                  <div className="py-3 flex justify-between">
                    <span className="text-muted-foreground">Payment Reference</span>
                    <span className="font-mono font-bold text-foreground">
                      {paymentNumber || payment?.paymentNumber || "N/A"}
                    </span>
                  </div>

                  {payment?.customerName && (
                    <div className="py-3 flex justify-between">
                      <span className="text-muted-foreground">Paid By</span>
                      <span className="font-medium text-foreground">{payment.customerName}</span>
                    </div>
                  )}

                  {payment?.customerEmail && (
                    <div className="py-3 flex justify-between">
                      <span className="text-muted-foreground">Customer Email</span>
                      <span className="font-medium text-foreground">{payment.customerEmail}</span>
                    </div>
                  )}

                  {payment?.customerPhone && (
                    <div className="py-3 flex justify-between">
                      <span className="text-muted-foreground">Customer Phone</span>
                      <span className="font-medium text-foreground">{payment.customerPhone}</span>
                    </div>
                  )}

                  {payment?.note && (
                    <div className="py-3 flex justify-between">
                      <span className="text-muted-foreground">Order Purpose / Note</span>
                      <span className="font-medium text-foreground text-right max-w-[240px]">
                        {payment.note}
                      </span>
                    </div>
                  )}

                  <div className="py-3 flex justify-between">
                    <span className="text-muted-foreground">Payment Method</span>
                    <span className="font-medium text-foreground">PayGlocal International</span>
                  </div>
                </div>

                {/* Email Receipt Note */}
                <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 flex items-start gap-3">
                  <Mail className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div className="text-xs text-muted-foreground">
                    <strong className="text-foreground block mb-0.5">Official Receipt Dispatched</strong>
                    An official payment confirmation receipt with transaction details has been sent to your email address.
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    onClick={() => window.print()}
                    className="flex-1 py-3 px-4 rounded-xl border border-input bg-background hover:bg-muted font-semibold text-sm text-foreground transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Printer className="h-4 w-4" />
                    Print Receipt
                  </button>

                  <Link
                    to="/"
                    className="flex-1 py-3 px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow hover:bg-primary/95 transition flex items-center justify-center gap-2"
                  >
                    Back to StyleNest Home
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            /* Payment Failed or Cancelled */
            <div className="bg-card rounded-3xl border border-border/80 shadow-lg overflow-hidden text-center p-8 sm:p-12">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive shadow-sm">
                <XCircle className="h-10 w-10" />
              </div>
              <span className="text-xs font-bold tracking-widest uppercase text-destructive">
                Transaction Incomplete
              </span>
              <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-foreground font-serif">
                Payment Cancelled or Unsuccessful
              </h1>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
                The payment session was cancelled or could not be completed by your bank. Your card was not charged. If any money was deducted, it will be refunded by your bank within 3 to 5 business days.
              </p>

              {paymentNumber && (
                <div className="mt-6 inline-block px-4 py-2 rounded-xl bg-muted text-xs font-mono text-muted-foreground">
                  Reference: {paymentNumber}
                </div>
              )}

              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
                <Link
                  to="/pay"
                  className="flex-1 py-3 px-6 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow hover:bg-primary/95 transition flex items-center justify-center gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Try Again
                </Link>

                <a
                  href="https://wa.me/919999999999?text=Hello%20StyleNest,%20I%20need%20help%20with%20payment%20reference%20"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3 px-6 rounded-xl border border-input bg-background hover:bg-muted font-semibold text-sm text-foreground transition flex items-center justify-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  WhatsApp Helpdesk
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageFade>
  );
}
