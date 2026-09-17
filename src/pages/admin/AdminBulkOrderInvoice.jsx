import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Download, Send } from "lucide-react";
import * as adminApi from "../../api/admin";
import { useToast } from "../../context/ToastContext";
import LoadingState from "../../components/LoadingState";
import ErrorState from "../../components/ErrorState";
import BackButton from "../../components/BackButton";
import InvoiceView from "../../components/InvoiceView";

export default function AdminBulkOrderInvoice() {
  const { id } = useParams();
  const { notify } = useToast();
  const [downloading, setDownloading] = useState(false);
  const [resending, setResending] = useState(false);

  const { data: invoice, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "bulk-order", id, "invoice"],
    queryFn: () => adminApi.getAdminBulkOrderInvoice(id),
  });

  async function handleDownload() {
    setDownloading(true);
    try {
      const blob = await adminApi.getAdminBulkOrderInvoicePdfBlob(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Invoice-Bulk-${invoice?.invoiceNumber || id}.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setDownloading(false);
    }
  }

  async function handleResend() {
    setResending(true);
    try {
      await adminApi.resendAdminBulkOrderInvoiceEmail(id);
      notify("Invoice email resent", "success");
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setResending(false);
    }
  }

  if (isLoading) return <LoadingState label="Loading invoice" />;
  if (isError || !invoice) return <ErrorState message="Invoice not found." onRetry={refetch} />;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <BackButton fallback={`/admin/bulk/orders/${id}`} />
        <div className="flex items-center gap-3">
          <button onClick={handleResend} disabled={resending} className="btn-outline inline-flex items-center gap-2">
            <Send className="h-3.5 w-3.5" />
            {resending ? "Sending..." : "Resend Invoice Email"}
          </button>
          <button onClick={handleDownload} disabled={downloading} className="btn-solid inline-flex items-center gap-2">
            <Download className="h-3.5 w-3.5" />
            {downloading ? "Downloading..." : "Download Invoice"}
          </button>
        </div>
      </div>

      <div className="mt-8">
        <InvoiceView invoice={invoice} />
      </div>
    </div>
  );
}
