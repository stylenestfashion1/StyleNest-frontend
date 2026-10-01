import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import * as rentalApi from "../../api/rental";
import { formatDate, formatPrice } from "../../utils/format";
import { StatusPill } from "../../components/StatusPill";
import BackButton from "../../components/BackButton";

export default function AdminRentalBookings() {
  const { data: bookings, isLoading } = useQuery({
    queryKey: ["admin", "rental-bookings"],
    queryFn: () => rentalApi.getAdminRentalBookings(),
  });

  return (
    <div>
      <BackButton fallback="/admin/rental" className="mb-3" />
      <h2 className="text-xl">Rental Bookings</h2>

      {isLoading ? (
        <div className="skeleton mt-8 h-80 w-full" />
      ) : !bookings?.length ? (
        <p className="mt-8 text-sm text-muted-foreground">No rental bookings yet.</p>
      ) : (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-y">
                {["Booking Ref", "Lehenga", "Customer", "Phone", "Dates", "Days", "Amount", "Status"].map((h) => (
                  <th key={h} className="label-xs py-3 font-normal text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.bookingReference} className="border-b transition-colors hover:bg-muted/50">
                  <td className="py-4">
                    <Link to={`/admin/rental/bookings/${b.bookingReference}`} className="link-underline">
                      {b.bookingReference}
                    </Link>
                  </td>
                  <td className="py-4 text-muted-foreground">{b.itemName}</td>
                  <td className="py-4 text-muted-foreground">{b.customerName}</td>
                  <td className="py-4 text-muted-foreground">{b.customerPhone}</td>
                  <td className="label-xs py-4 text-muted-foreground">
                    {formatDate(b.startDate)} → {formatDate(b.endDate)}
                  </td>
                  <td className="py-4 text-muted-foreground">{b.rentalDays}</td>
                  <td className="py-4">{formatPrice(b.totalAmount)}</td>
                  <td className="py-4">
                    <StatusPill status={b.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
