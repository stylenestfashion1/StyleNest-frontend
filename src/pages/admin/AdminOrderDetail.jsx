import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Send } from "lucide-react";
import * as adminApi from "../../api/admin";
import { formatDate, formatPrice } from "../../utils/format";
import { getSizeLabel } from "../../utils/sizeLabel";
import { useToast } from "../../context/ToastContext";
import LoadingState from "../../components/LoadingState";
import ErrorState from "../../components/ErrorState";
import BackButton from "../../components/BackButton";

const ORDER_STATUSES = ["PENDING", "CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "DELIVERED", "COMPLETED", "CANCELLED"];
const SHIPMENT_STATUSES = ["PROCESSING", "PACKED", "SHIPPED", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "RETURNED"];

export default function AdminOrderDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const [shipment, setShipment] = useState({ shipmentStatus: "PROCESSING", trackingNumber: "", courierName: "", estimatedDeliveryDate: "", description: "", location: "" });
  const [resending, setResending] = useState(false);

  const { data: order, isLoading, isError, refetch } = useQuery({ queryKey: ["admin", "order", id], queryFn: () => adminApi.getAdminOrder(id) });

  const updateStatus = useMutation({
    mutationFn: (orderStatus) => adminApi.updateOrderStatus(id, { orderStatus }),
    onSuccess: (data) => {
      queryClient.setQueryData(["admin", "order", id], data);
      notify("Order status updated", "success");
    },
    onError: (err) => notify(err.message, "error"),
  });

  const updateShipment = useMutation({
    mutationFn: () => adminApi.updateOrderShipment(id, shipment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "order", id] });
      notify("Shipment updated", "success");
    },
    onError: (err) => notify(err.message, "error"),
  });

  async function handleResendInvoice() {
    setResending(true);
    try {
      await adminApi.resendAdminOrderInvoiceEmail(id);
      notify("Invoice email resent", "success");
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setResending(false);
    }
  }

  if (isLoading) return <LoadingState label="Loading order" />;
  if (isError || !order) return <ErrorState message="Order not found." onRetry={refetch} />;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <BackButton fallback="/admin/orders" className="mb-3" />
          <h2 className="flex items-center gap-3 text-xl">
            Order {order.orderNumber}
            {order.isGuest && <span className="label-xs rounded-full border border-accent px-2.5 py-1 text-accent">Guest</span>}
          </h2>
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
                  {item.productName} ({item.color}/{getSizeLabel(item.size)}) × {item.quantity}
                </span>
                <span>{formatPrice(item.subtotal)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-between border-t pt-4 text-sm">
            <span className="label-xs">Total</span>
            <span className="display text-lg">{formatPrice(order.totalAmount)}</span>
          </div>
          {order.shippingAddress && (
            <div className="mt-4 space-y-1 text-sm text-muted-foreground">
              <p>
                {order.shippingAddress.fullName} — {order.shippingAddress.addressLine1}, {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                {order.shippingAddress.postalCode}
              </p>
              <p className="label-xs">
                {order.email}
                {order.shippingAddress.phone && ` · ${order.shippingAddress.phoneCountryCode || ""}${order.shippingAddress.phone}`}
              </p>
            </div>
          )}
          {order.invoiceAvailable && (
            <div className="mt-4 flex items-center gap-5">
              <Link to={`/admin/orders/${id}/invoice`} className="label-xs link-underline inline-flex items-center gap-2 text-accent">
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
          <h3 className="label-xs text-muted-foreground">Order status</h3>
          <select value={order.orderStatus} onChange={(e) => updateStatus.mutate(e.target.value)} className="field mt-3">
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <h3 className="label-xs mt-8 text-muted-foreground">Shipment</h3>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <span className="label-xs text-muted-foreground">Status</span>
              <select value={shipment.shipmentStatus} onChange={(e) => setShipment((s) => ({ ...s, shipmentStatus: e.target.value }))} className="field mt-2">
                {SHIPMENT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <ShipField label="Tracking number" value={shipment.trackingNumber} onChange={(v) => setShipment((s) => ({ ...s, trackingNumber: v }))} />
            <ShipField label="Courier" value={shipment.courierName} onChange={(v) => setShipment((s) => ({ ...s, courierName: v }))} />
            <ShipField label="Est. delivery" type="date" value={shipment.estimatedDeliveryDate} onChange={(v) => setShipment((s) => ({ ...s, estimatedDeliveryDate: v }))} />
            <ShipField label="Location" value={shipment.location} onChange={(v) => setShipment((s) => ({ ...s, location: v }))} />
            <div className="sm:col-span-2">
              <ShipField label="Description" value={shipment.description} onChange={(v) => setShipment((s) => ({ ...s, description: v }))} />
            </div>
          </div>
          <button onClick={() => updateShipment.mutate()} disabled={updateShipment.isPending} className="btn-solid mt-6">
            {updateShipment.isPending ? "Saving..." : "Update shipment"}
          </button>

          {order.shipmentStatus && (
            <p className="label-xs mt-4 text-muted-foreground">
              Current: {order.shipmentStatus} {order.trackingNumber && `· ${order.trackingNumber}`}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

function ShipField({ label, value, onChange, type = "text" }) {
  return (
    <label className="block">
      <span className="label-xs text-muted-foreground">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="field mt-2" />
    </label>
  );
}
