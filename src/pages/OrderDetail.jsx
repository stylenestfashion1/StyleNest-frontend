import { useParams, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, FileText, Package } from "lucide-react";
import * as ordersApi from "../api/orders";
import { formatDate, formatPrice } from "../utils/format";
import { getSizeLabel } from "../utils/sizeLabel";
import { PageFade, Reveal } from "../components/Reveal";
import { StatusPill } from "../components/StatusPill";
import ErrorState from "../components/ErrorState";
import { useToast } from "../context/ToastContext";

const CANCELLABLE = ["PENDING", "CONFIRMED", "PROCESSING"];

export default function OrderDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { notify } = useToast();

  const { data: order, isLoading, isError, refetch } = useQuery({ queryKey: ["order", id], queryFn: () => ordersApi.getOrder(id) });

  const cancelOrder = useMutation({
    mutationFn: () => ordersApi.cancelOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", id] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      notify("Order cancelled", "success");
    },
    onError: (err) => notify(err.message, "error"),
  });

  if (isLoading)
    return (
      <div className="mx-auto max-w-[1100px] px-5 py-16 md:px-10">
        <div className="skeleton h-8 w-60" />
        <div className="skeleton mt-8 h-64 w-full" />
      </div>
    );
  if (isError || !order) return <ErrorState message="Order not found." onRetry={refetch} />;

  return (
    <PageFade>
      <div className="mx-auto max-w-[1100px] px-5 py-12 md:px-10">
        <Link to="/account?tab=orders" className="label-xs link-underline">
          <ArrowLeft className="mr-2 inline h-3 w-3" />
          Orders
        </Link>

        <div className="mt-6 flex flex-wrap items-end justify-between gap-4 border-b pb-8">
          <div>
            <p className="label-xs text-accent">
              {order.paymentStatus} — {order.paymentMethod}
            </p>
            <h1 className="mt-3 text-[clamp(1.8rem,3.4vw,2.6rem)] leading-none">{order.orderNumber}</h1>
            <p className="mt-3 text-xs text-muted-foreground">Placed {formatDate(order.createdAt)}</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusPill status={order.orderStatus} />
            {order.invoiceAvailable && (
              <Link to={`/orders/${id}/invoice`} className="btn-outline sheen inline-flex items-center gap-2">
                <FileText className="h-3.5 w-3.5" />
                Invoice
              </Link>
            )}
          </div>
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <h2 className="label-xs text-muted-foreground">Items</h2>
            <ul className="mt-4 border-t">
              {order.items.map((item, i) => (
                <Reveal as="li" key={i} delay={i * 70}>
                  <div className="flex items-center justify-between gap-4 border-b py-5">
                    <div>
                      <p className="text-sm">{item.productName}</p>
                      <p className="label-xs mt-2 text-muted-foreground">
                        {item.color} — {getSizeLabel(item.size)} — Qty {item.quantity}
                      </p>
                    </div>
                    <span className="text-sm">{formatPrice(item.subtotal)}</span>
                  </div>
                </Reveal>
              ))}
            </ul>
            <div className="mt-6 flex items-center justify-between border-t pt-6">
              <span className="label-xs">Total paid</span>
              <span className="display text-xl">{formatPrice(order.totalAmount)}</span>
            </div>

            {CANCELLABLE.includes(order.orderStatus) && (
              <button onClick={() => cancelOrder.mutate()} disabled={cancelOrder.isPending} className="btn-outline mt-8 text-destructive">
                {cancelOrder.isPending ? "Cancelling..." : "Cancel order"}
              </button>
            )}
          </div>

          <aside className="space-y-6">
            {order.shippingAddress && (
              <Reveal>
                <div className="hairline-card p-6">
                  <p className="label-xs text-accent">Shipping to</p>
                  <address className="mt-4 space-y-1 text-sm not-italic text-muted-foreground">
                    <p className="text-foreground">{order.shippingAddress.fullName}</p>
                    <p>{order.shippingAddress.addressLine1}</p>
                    {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                    <p>
                      {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                    </p>
                    <p>{order.shippingAddress.country}</p>
                    <p className="pt-2">
                      {order.shippingAddress.phoneCountryCode} {order.shippingAddress.phone}
                    </p>
                  </address>
                </div>
              </Reveal>
            )}
            {order.shipmentStatus && (
              <Reveal delay={90}>
                <div className="hairline-card p-6">
                  <p className="label-xs flex items-center gap-2 text-accent">
                    <Package className="h-3.5 w-3.5" /> Tracking
                  </p>
                  <dl className="mt-4 space-y-3 text-sm">
                    {order.courierName && (
                      <div className="flex justify-between gap-4">
                        <dt className="label-xs text-muted-foreground">Courier</dt>
                        <dd>{order.courierName}</dd>
                      </div>
                    )}
                    {order.trackingNumber && (
                      <div className="flex justify-between gap-4">
                        <dt className="label-xs text-muted-foreground">AWB</dt>
                        <dd>{order.trackingNumber}</dd>
                      </div>
                    )}
                    <div className="flex justify-between gap-4">
                      <dt className="label-xs text-muted-foreground">Status</dt>
                      <dd>
                        <StatusPill status={order.shipmentStatus} />
                      </dd>
                    </div>
                    {order.estimatedDeliveryDate && (
                      <div className="flex justify-between gap-4">
                        <dt className="label-xs text-muted-foreground">Est. delivery</dt>
                        <dd>{formatDate(order.estimatedDeliveryDate)}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              </Reveal>
            )}
          </aside>
        </div>
      </div>
    </PageFade>
  );
}
