import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import * as adminApi from "../../api/admin";
import { formatDate, formatPrice } from "../../utils/format";
import { StatusPill } from "../../components/StatusPill";
import BackButton from "../../components/BackButton";

export default function AdminOrders() {
  const [keyword, setKeyword] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "orders", keyword],
    queryFn: () => adminApi.searchAdminOrders(keyword ? { keyword } : undefined),
  });

  const orders = data?.content;

  return (
    <div>
      <BackButton fallback="/admin" className="mb-3" />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="text-xl">Orders</h2>
        <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="SEARCH ORDERS" className="field label-xs w-56" />
      </div>

      {isLoading ? (
        <div className="skeleton mt-8 h-80 w-full" />
      ) : (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead>
              <tr className="border-y">
                {["Order", "Customer", "Placed", "Payment", "Status", "Total"].map((h) => (
                  <th key={h} className="label-xs py-3 font-normal text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders?.map((o) => (
                <tr key={o.id} className="border-b transition-colors hover:bg-muted/50">
                  <td className="py-4">
                    <Link to={`/admin/orders/${o.id}`} className="link-underline">
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td className="py-4 text-muted-foreground">
                    {o.customerName}
                    {o.isGuest && <span className="label-xs ml-2 text-accent">Guest</span>}
                  </td>
                  <td className="py-4 text-muted-foreground">{formatDate(o.createdAt)}</td>
                  <td className="label-xs py-4 text-muted-foreground">
                    {o.paymentMethod} · {o.paymentStatus}
                  </td>
                  <td className="py-4">
                    <StatusPill status={o.orderStatus} />
                  </td>
                  <td className="py-4">{formatPrice(o.totalAmount, o.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {orders?.length === 0 && <p className="py-8 text-sm text-muted-foreground">No orders found.</p>}
        </div>
      )}
    </div>
  );
}
