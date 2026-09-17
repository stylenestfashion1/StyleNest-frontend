import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import * as ordersApi from "../api/orders";
import { formatDate, formatPrice } from "../utils/format";
import { PageFade, Reveal } from "../components/Reveal";
import { StatusPill } from "../components/StatusPill";
import LoadingState from "../components/LoadingState";
import ErrorState from "../components/ErrorState";

export default function Orders() {
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ["orders"], queryFn: ordersApi.getMyOrders });

  if (isLoading) return <LoadingState label="Loading orders" />;
  if (isError) return <ErrorState message="Could not load orders." onRetry={refetch} />;

  if (!data || data.length === 0) {
    return (
      <PageFade>
        <div className="mx-auto max-w-[1440px] px-5 py-24 text-center md:px-10">
          <h1 className="text-[clamp(1.9rem,3.6vw,2.8rem)]">No orders yet</h1>
          <p className="mx-auto mt-4 max-w-sm text-sm text-muted-foreground">Once you place an order, it will show up here.</p>
          <Link to="/women" className="btn-solid mt-8 inline-block">
            Start shopping
          </Link>
        </div>
      </PageFade>
    );
  }

  return (
    <PageFade>
      <div className="mx-auto max-w-[1000px] px-5 py-12 md:px-10">
        <h1 className="text-[clamp(1.9rem,3.6vw,2.8rem)]">Order History</h1>
        <ul className="mt-10 border-t">
          {data.map((order, i) => (
            <Reveal as="li" key={order.id} delay={i * 70}>
              <Link to={`/orders/${order.id}`} className="flex flex-wrap items-center justify-between gap-3 border-b py-5 transition-colors hover:bg-muted/50">
                <div>
                  <p className="label-xs">{order.orderNumber}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
                </div>
                <StatusPill status={order.orderStatus} />
                <span className="text-sm">{formatPrice(order.totalAmount)}</span>
              </Link>
            </Reveal>
          ))}
        </ul>
      </div>
    </PageFade>
  );
}
