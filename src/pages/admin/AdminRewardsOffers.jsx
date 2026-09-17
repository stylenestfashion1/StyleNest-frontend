import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import * as adminApi from "../../api/admin";
import BackButton from "../../components/BackButton";

function formatDateTime(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default function AdminRewardsOffers() {
  const [keyword, setKeyword] = useState("");
  const [discountPercentage, setDiscountPercentage] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const params = {
    ...(keyword ? { keyword } : {}),
    ...(discountPercentage ? { discountPercentage } : {}),
    ...(fromDate ? { fromDate } : {}),
    ...(toDate ? { toDate } : {}),
    size: 50,
  };

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "discount", "offers", params],
    queryFn: () => adminApi.getAdminDiscountOffers(params),
  });

  const offers = data?.content;

  return (
    <div>
      <BackButton fallback="/admin" className="mb-3" />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="text-xl">Redeemed Offers</h2>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="SEARCH NAME OR MOBILE" className="field label-xs w-56" />
        <select value={discountPercentage} onChange={(e) => setDiscountPercentage(e.target.value)} className="field label-xs w-auto">
          <option value="">All discounts</option>
          <option value="10">10%</option>
          <option value="15">15%</option>
          <option value="20">20%</option>
          <option value="25">25%</option>
          <option value="30">30%</option>
        </select>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          From
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="field label-xs w-auto" />
        </label>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          To
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="field label-xs w-auto" />
        </label>
      </div>

      {isLoading ? (
        <div className="skeleton mt-8 h-80 w-full" />
      ) : (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-y">
                {["Customer Name", "Mobile Number", "Discount", "Generated At", "Status"].map((h) => (
                  <th key={h} className="label-xs py-3 font-normal text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {offers?.map((o) => (
                <tr key={o.id} className="border-b transition-colors hover:bg-muted/50">
                  <td className="py-4">{o.customerName}</td>
                  <td className="py-4 text-muted-foreground">{o.mobileNumber}</td>
                  <td className="py-4">{o.discountPercentage}%</td>
                  <td className="py-4 text-muted-foreground">{formatDateTime(o.generatedAt)}</td>
                  <td className="label-xs py-4 text-accent">{o.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {offers?.length === 0 && <p className="py-8 text-sm text-muted-foreground">No redeemed offers found.</p>}
        </div>
      )}
    </div>
  );
}
