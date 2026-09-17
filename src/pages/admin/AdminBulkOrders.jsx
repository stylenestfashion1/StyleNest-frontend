import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import * as adminApi from "../../api/admin";
import { formatDate, formatPrice } from "../../utils/format";
import { StatusPill } from "../../components/StatusPill";
import BackButton from "../../components/BackButton";

export default function AdminBulkOrders() {
  const { data, isLoading } = useQuery({ queryKey: ["admin", "bulk-orders"], queryFn: adminApi.getAdminBulkOrders });

  const orders = data ?? [];

  return (
    <div>
      <BackButton fallback="/admin" className="mb-3" />
      <h2 className="text-xl">Bulk Orders</h2>
      <p className="label-xs mt-2 text-muted-foreground">Wholesale orders only -- kept separate from retail Orders.</p>

      {isLoading ? (
        <div className="skeleton mt-8 h-80 w-full" />
      ) : (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead>
              <tr className="border-y">
                {["Order", "Customer", "Placed", "Items", "Payment", "Status", "Total"].map((h) => (
                  <th key={h} className="label-xs py-3 font-normal text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b transition-colors hover:bg-muted/50">
                  <td className="py-4">
                    <Link to={`/admin/bulk/orders/${o.id}`} className="link-underline">
                      {o.bulkOrderNumber}
                    </Link>
                  </td>
                  <td className="py-4 text-muted-foreground">
                    {o.customerName}
                    <span className="label-xs ml-2 text-muted-foreground">{o.customerPhone}</span>
                  </td>
                  <td className="py-4 text-muted-foreground">{formatDate(o.createdAt)}</td>
                  <td className="py-4 text-muted-foreground">{o.itemCount}</td>
                  <td className="label-xs py-4 text-muted-foreground">
                    {o.paymentMethod} · {o.paymentStatus}
                  </td>
                  <td className="py-4">
                    <StatusPill status={o.orderStatus} />
                  </td>
                  <td className="py-4">{formatPrice(o.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {orders.length === 0 && <p className="py-8 text-sm text-muted-foreground">No bulk orders yet.</p>}
        </div>
      )}
    </div>
  );
}
