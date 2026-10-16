import { PageFade } from "../../components/Reveal";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle2, XCircle, ArrowRight, PackageCheck } from "lucide-react";

export default function BulkOrderConfirmation() {
  const [searchParams] = useSearchParams();
  const orderNumber = searchParams.get("orderNumber");
  const status = searchParams.get("status");

  const isSuccess = status === "success";

  return (
    <PageFade><div className="mx-auto max-w-xl px-5 py-24 text-center">
      {isSuccess ? (
        <div>
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/50">
            <CheckCircle2 className="h-12 w-12" />
          </div>
          <p className="label-xs text-accent uppercase tracking-widest font-bold">Wholesale Payment Confirmed</p>
          <h1 className="mt-3 text-3xl md:text-4xl font-extrabold text-foreground font-serif">
            Thank you for your bulk order!
          </h1>
          <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
            Your wholesale payment via PayGlocal was successful.
            {orderNumber && (
              <>
                <br />
                Order Number: <strong className="text-foreground font-mono">{orderNumber}</strong>
              </>
            )}
          </p>

          <div className="mt-8 rounded-2xl border border-border/80 bg-card p-6 text-left shadow-sm">
            <div className="flex items-center gap-3">
              <PackageCheck className="h-6 w-6 text-primary shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-foreground">Order In Production / Dispatch</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Official GST/HSN invoice has been generated and sent to your registered email address.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/bulk-orders/catalog" className="btn-solid inline-flex items-center justify-center gap-2">
              Continue Wholesale Browsing <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/" className="btn-outline inline-flex items-center justify-center">
              Back to StyleNest Home
            </Link>
          </div>
        </div>
      ) : (
        <div>
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-rose-50 text-rose-600 ring-8 ring-rose-50/50">
            <XCircle className="h-12 w-12" />
          </div>
          <p className="label-xs text-destructive uppercase tracking-widest font-bold">Payment Failed / Cancelled</p>
          <h1 className="mt-3 text-3xl font-extrabold text-foreground font-serif">
            Payment was not completed
          </h1>
          <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
            The transaction could not be processed by PayGlocal.
            {orderNumber && (
              <>
                <br />
                Reference Order: <strong className="text-foreground font-mono">{orderNumber}</strong>
              </>
            )}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/bulk-orders/cart" className="btn-solid inline-flex items-center justify-center gap-2">
              Return to Bulk Cart & Retry
            </Link>
            <Link to="/bulk-orders/catalog" className="btn-outline inline-flex items-center justify-center">
              Wholesale Catalog
            </Link>
          </div>
        </div>
      )}
    </div></PageFade>
  );
}
