import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Send, Truck, Download, RefreshCw, XCircle } from "lucide-react";
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
  const [dtdcForm, setDtdcForm] = useState({ weightKg: "", lengthCm: "", widthCm: "", heightCm: "", numPieces: "1" });
  const [downloadingLabel, setDownloadingLabel] = useState(false);

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

  const bookDtdc = useMutation({
    mutationFn: () =>
      adminApi.bookDtdcShipment(id, {
        weightKg: Number(dtdcForm.weightKg),
        lengthCm: Number(dtdcForm.lengthCm),
        widthCm: Number(dtdcForm.widthCm),
        heightCm: Number(dtdcForm.heightCm),
        numPieces: Number(dtdcForm.numPieces) || 1,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "order", id] });
      notify("Shipment booked with DTDC", "success");
    },
    onError: (err) => notify(err.message, "error"),
  });

  const cancelDtdc = useMutation({
    mutationFn: () => adminApi.cancelDtdcShipment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "order", id] });
      notify("Shipment cancelled with DTDC", "success");
    },
    onError: (err) => notify(err.message, "error"),
  });

  const refreshTracking = useMutation({
    mutationFn: () => adminApi.refreshDtdcTracking(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "order", id] });
      notify("Tracking refreshed from DTDC", "success");
    },
    onError: (err) => notify(err.message, "error"),
  });

  async function handleDownloadLabel() {
    setDownloadingLabel(true);
    try {
      const blob = await adminApi.getDtdcLabelPdfBlob(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `DTDC-Label-${order.orderNumber}.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setDownloadingLabel(false);
    }
  }

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
                <span>{formatPrice(item.subtotal, order.currency)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-between border-t pt-4 text-sm">
            <span className="label-xs">Total</span>
            <span className="display text-lg">{formatPrice(order.totalAmount, order.currency)}</span>
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

          <h3 className="label-xs mt-8 flex items-center gap-2 text-muted-foreground">
            <Truck className="h-3.5 w-3.5" />
            DTDC Courier
          </h3>

          {!order.trackingNumber && (
            <div className="mt-3">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <ShipField label="Weight (kg)" type="number" value={dtdcForm.weightKg} onChange={(v) => setDtdcForm((s) => ({ ...s, weightKg: v }))} />
                <ShipField label="Length (cm)" type="number" value={dtdcForm.lengthCm} onChange={(v) => setDtdcForm((s) => ({ ...s, lengthCm: v }))} />
                <ShipField label="Width (cm)" type="number" value={dtdcForm.widthCm} onChange={(v) => setDtdcForm((s) => ({ ...s, widthCm: v }))} />
                <ShipField label="Height (cm)" type="number" value={dtdcForm.heightCm} onChange={(v) => setDtdcForm((s) => ({ ...s, heightCm: v }))} />
                <ShipField label="Pieces" type="number" value={dtdcForm.numPieces} onChange={(v) => setDtdcForm((s) => ({ ...s, numPieces: v }))} />
              </div>
              <button onClick={() => bookDtdc.mutate()} disabled={bookDtdc.isPending} className="btn-solid mt-4 inline-flex items-center gap-2">
                <Truck className="h-3.5 w-3.5" />
                {bookDtdc.isPending ? "Booking..." : "Book shipment with DTDC"}
              </button>
              <p className="label-xs mt-2 text-muted-foreground">
                Customer, address, COD/declared value and invoice reference are taken from the order itself -- only the packed
                weight/dimensions are entered here. Domestic (India) orders only.
              </p>
            </div>
          )}

          {order.courierName === "DTDC" && order.trackingNumber && (
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <p className="label-xs text-muted-foreground">
                AWB: <span className="text-foreground">{order.trackingNumber}</span>
              </p>
              <button onClick={() => refreshTracking.mutate()} disabled={refreshTracking.isPending} className="label-xs link-underline inline-flex items-center gap-2 text-accent">
                <RefreshCw className="h-3.5 w-3.5" />
                {refreshTracking.isPending ? "Refreshing..." : "Refresh tracking"}
              </button>
              <button onClick={handleDownloadLabel} disabled={downloadingLabel} className="label-xs link-underline inline-flex items-center gap-2 text-accent">
                <Download className="h-3.5 w-3.5" />
                {downloadingLabel ? "Downloading..." : "Download label"}
              </button>
              {order.shipmentStatus !== "DELIVERED" && order.shipmentStatus !== "CANCELLED" && order.shipmentStatus !== "RETURNED" && (
                <button onClick={() => cancelDtdc.mutate()} disabled={cancelDtdc.isPending} className="label-xs link-underline inline-flex items-center gap-2 text-destructive">
                  <XCircle className="h-3.5 w-3.5" />
                  {cancelDtdc.isPending ? "Cancelling..." : "Cancel DTDC shipment"}
                </button>
              )}
            </div>
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
