import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import * as adminApi from "../../api/admin";
import { formatDate, formatPrice } from "../../utils/format";
import { getSizeLabel } from "../../utils/sizeLabel";
import { Reveal } from "../../components/Reveal";
import { Stat, StatusPill } from "../../components/StatusPill";

export default function AdminDashboard() {
  const dashboard = useQuery({ queryKey: ["admin", "dashboard"], queryFn: adminApi.getDashboard });
  const latestOrders = useQuery({ queryKey: ["admin", "latest-orders"], queryFn: adminApi.getLatestOrders });
  const lowStock = useQuery({ queryKey: ["admin", "low-stock"], queryFn: adminApi.getLowStock });
  const topSelling = useQuery({ queryKey: ["admin", "top-selling"], queryFn: adminApi.getTopSelling });

  const stats = dashboard.data;
  const maxSold = Math.max(1, ...(topSelling.data ?? []).map((t) => t.totalSold));

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {dashboard.isLoading
          ? Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-[118px]" />)
          : stats && (
              <>
                <Reveal>
                  <Stat label="Revenue" value={formatPrice(stats.totalRevenue)} />
                </Reveal>
                <Reveal delay={70}>
                  <Stat label="Orders" value={stats.totalOrders.toLocaleString("en-IN")} />
                </Reveal>
                <Reveal delay={140}>
                  <Stat label="Customers" value={stats.totalCustomers.toLocaleString("en-IN")} />
                </Reveal>
                <Reveal delay={210}>
                  <Stat label="Products" value={String(stats.totalProducts)} />
                </Reveal>
                <Reveal delay={280}>
                  <Stat label="Categories" value={String(stats.totalCategories)} />
                </Reveal>
              </>
            )}
      </div>

      <div className="mt-12 grid gap-12 xl:grid-cols-[1.4fr_1fr]">
        <section className="min-w-0">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xl">Latest orders</h2>
            <Link to="/admin/orders" className="label-xs link-underline">
              All orders
            </Link>
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-y">
                  {["Order", "Customer", "Placed", "Status", "Total"].map((h) => (
                    <th key={h} className="label-xs py-3 font-normal text-muted-foreground">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(latestOrders.data ?? []).map((o) => (
                  <tr key={o.orderId} className="border-b transition-colors hover:bg-muted/50">
                    <td className="py-4">
                      <Link to={`/admin/orders/${o.orderId}`} className="link-underline">
                        {o.orderNumber}
                      </Link>
                    </td>
                    <td className="py-4 text-muted-foreground">{o.customerName}</td>
                    <td className="py-4 text-muted-foreground">{formatDate(o.createdAt)}</td>
                    <td className="py-4">
                      <StatusPill status={o.orderStatus} />
                    </td>
                    <td className="py-4">{formatPrice(o.totalAmount, o.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {latestOrders.data?.length === 0 && <p className="py-6 text-sm text-muted-foreground">No orders yet.</p>}
          </div>
        </section>

        <section className="space-y-12">
          <div>
            <h2 className="text-xl">Top selling</h2>
            <ul className="mt-5 space-y-4">
              {(topSelling.data ?? []).map((t, i) => (
                <Reveal as="li" key={t.productId} delay={i * 60}>
                  <div className="flex items-center justify-between gap-4">
                    <span className="truncate text-sm">{t.productName}</span>
                    <span className="label-xs text-muted-foreground">{t.totalSold}</span>
                  </div>
                  <div className="mt-2 h-px w-full bg-border">
                    <div className="h-px bg-accent transition-[width] duration-1000" style={{ width: `${(t.totalSold / maxSold) * 100}%` }} />
                  </div>
                </Reveal>
              ))}
              {topSelling.data?.length === 0 && <p className="text-sm text-muted-foreground">No sales data yet.</p>}
            </ul>
          </div>

          <div>
            <h2 className="text-xl">Low stock</h2>
            <ul className="mt-5 border-t">
              {(lowStock.data ?? []).map((l, i) => (
                <li key={`${l.productId}-${i}`} className="flex items-center justify-between gap-4 border-b py-4">
                  <div>
                    <p className="text-sm">{l.productName}</p>
                    <p className="label-xs mt-1 text-muted-foreground">
                      {l.color} — {getSizeLabel(l.size)}
                    </p>
                  </div>
                  <span className={`label-xs ${l.stock === 0 ? "text-destructive" : "text-accent"}`}>{l.stock === 0 ? "Out of stock" : `${l.stock} left`}</span>
                </li>
              ))}
              {lowStock.data?.length === 0 && <p className="py-4 text-sm text-muted-foreground">No low-stock items.</p>}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
