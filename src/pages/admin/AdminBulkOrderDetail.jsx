import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Send } from "lucide-react";
import * as adminApi from "../../api/admin";
import { formatDate, formatPrice } from "../../utils/format";
import { useToast } from "../../context/ToastContext";
import LoadingState from "../../components/LoadingState";
import ErrorState from "../../components/ErrorState";
import BackButton from "../../components/BackButton";
import { StatusPill } from "../../components/StatusPill";

const ORDER_STATUSES = ["PENDING", "CONFIRMED", "PROCESSING", "COMPLETED", "CANCELLED"];

export default function AdminBulkOrderDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const [resending, setResending] = useState(false);

  const { data: order, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "bulk-order", id],
    queryFn: () => adminApi.getAdminBulkOrder(id),
  });

  const updateStatus = useMutation({
    mutationFn: (orderStatus) => adminApi.updateAdminBulkOrderStatus(id, { orderStatus }),
    onSuccess: (data) => {
      queryClient.setQueryData(["admin", "bulk-order", id], data);
      queryClient.invalidateQueries({ queryKey: ["admin", "bulk-orders"] });
      notify("Bulk order status updated", "success");
    },
    onError: (err) => notify(err.message, "error"),
  });

  async function handleResendInvoice() {
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

  if (isLoading) return <LoadingState label="Loading bulk order" />;
  if (isError || !order) return <ErrorState message="Bulk order not found." onRetry={refetch} />;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <BackButton fallback="/admin/bulk/orders" className="mb-3" />
          <h2 className="text-xl">Bulk Order {order.bulkOrderNumber}</h2>
        </div>
        <span className="label-xs text-muted-foreground">{formatDate(order.createdAt)}</span>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section className="hairline-card p-6">
          <h3 className="label-xs text-muted-foreground">Items</h3>
          <ul className="mt-4 border-t">
            {order.items.map((item, idx) => (
              <li key={idx} className="flex justify-between border-b py-3 text-sm">
                <span>
                  {item.productName} × {item.quantity}
                </span>
                <span>{formatPrice(item.subtotal)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-between text-sm font-medium">
            <span>Total</span>
            <span>{formatPrice(order.totalAmount)}</span>
          </div>
          <p className="label-xs mt-4 text-muted-foreground">
            Payment: {order.paymentMethod} · {order.paymentStatus}
          </p>
          {order.invoiceAvailable && (
            <div className="mt-4 flex items-center gap-5">
              <Link to={`/admin/bulk/orders/${id}/invoice`} className="label-xs link-underline inline-flex items-center gap-2 text-accent">
                <FileText className="h-3.5 w-3.5" />
                View invoice
              </Link>
              <button onClick={handleResendInvoice} disabled={resending} className="label-xs link-underline inline-flex items-center gap-2 text-accent">
                <Send className="h-3.5 w-3.5" />
                {resending ? "Sending..." : "Resend invoice email"}
              </button>
            </div>
          )}
        </section>

        <section className="hairline-card p-6">
          <h3 className="label-xs text-muted-foreground">Customer</h3>
          <p className="mt-3 text-sm">{order.customerName}</p>
          <p className="mt-1 text-sm text-muted-foreground">{order.customerEmail}</p>
          <p className="text-sm text-muted-foreground">{order.customerPhone}</p>

          <h3 className="label-xs mt-6 text-muted-foreground">Shipping Address</h3>
          <p className="mt-3 text-sm">
            {order.shippingAddressLine1}
            {order.shippingAddressLine2 && `, ${order.shippingAddressLine2}`}
            <br />
            {order.shippingCity}, {order.shippingState} {order.shippingPostalCode}
            <br />
            {order.shippingCountry}
          </p>

          <h3 className="label-xs mt-6 text-muted-foreground">Order Status</h3>
          <div className="mt-3 flex items-center gap-3">
            <StatusPill status={order.orderStatus} />
            <select
              value={order.orderStatus}
              onChange={(e) => updateStatus.mutate(e.target.value)}
              className="field label-xs w-auto"
            >
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </section>
      </div>
    </div>
  );
}
