import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Download } from "lucide-react";
import * as ordersApi from "../api/orders";
import { PageFade } from "../components/Reveal";
import LoadingState from "../components/LoadingState";
import ErrorState from "../components/ErrorState";
import InvoiceView from "../components/InvoiceView";
import { useToast } from "../context/ToastContext";

export default function OrderInvoice() {
  const { id } = useParams();
  const { notify } = useToast();
  const [downloading, setDownloading] = useState(false);

  const { data: invoice, isLoading, isError, refetch } = useQuery({
    queryKey: ["order", id, "invoice"],
    queryFn: () => ordersApi.getOrderInvoice(id),
  });

  async function handleDownload() {
    setDownloading(true);
    try {
      const blob = await ordersApi.getOrderInvoicePdfBlob(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Invoice-${invoice?.invoiceNumber || id}.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setDownloading(false);
    }
  }

  if (isLoading) return <LoadingState label="Loading invoice" />;
  if (isError || !invoice) return <ErrorState message="Invoice not found." onRetry={refetch} />;

  return (
    <PageFade>
      <div className="mx-auto max-w-[1100px] px-5 py-12 md:px-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link to={`/orders/${id}`} className="label-xs link-underline">
            <ArrowLeft className="mr-2 inline h-3 w-3" />
            Back to order
          </Link>
          <button onClick={handleDownload} disabled={downloading} className="btn-outline sheen inline-flex items-center gap-2">
            <Download className="h-3.5 w-3.5" />
            {downloading ? "Downloading..." : "Download Invoice"}
          </button>
        </div>

        <div className="mt-8">
          <InvoiceView invoice={invoice} />
        </div>
      </div>
    </PageFade>
  );
}
