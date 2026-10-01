import { useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as rentalApi from "../../api/rental";
import { formatDate, formatPrice } from "../../utils/format";
import { StatusPill } from "../../components/StatusPill";
import { useToast } from "../../context/ToastContext";
import BackButton from "../../components/BackButton";
import LoadingState from "../../components/LoadingState";
import ErrorState from "../../components/ErrorState";

export default function AdminRentalBookingDetail() {
  const { reference } = useParams();
  const queryClient = useQueryClient();
  const { notify } = useToast();

  const [cancelRange, setCancelRange] = useState({ startDate: "", endDate: "" });

  const { data: booking, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "rental-bookings", reference],
    queryFn: () => rentalApi.getAdminRentalBooking(reference),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "rental-bookings"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "rental-bookings", reference] });
  };

  const confirm = useMutation({
    mutationFn: () => rentalApi.confirmAdminRentalBooking(reference),
    onSuccess: () => {
      invalidate();
      notify("Booking confirmed", "success");
    },
    onError: (err) => notify(err.message, "error"),
  });

  const cancelFull = useMutation({
    mutationFn: () => rentalApi.cancelAdminRentalBooking(reference),
    onSuccess: () => {
      invalidate();
      notify("Booking cancelled", "success");
    },
    onError: (err) => notify(err.message, "error"),
  });

  const cancelPartial = useMutation({
    mutationFn: () =>
      rentalApi.cancelAdminRentalBooking(reference, {
        startDate: cancelRange.startDate,
        endDate: cancelRange.endDate,
      }),
    onSuccess: () => {
      invalidate();
      setCancelRange({ startDate: "", endDate: "" });
      notify("Selected dates cancelled", "success");
    },
    onError: (err) => notify(err.message, "error"),
  });

  const complete = useMutation({
    mutationFn: () => rentalApi.completeAdminRentalBooking(reference),
    onSuccess: () => {
      invalidate();
      notify("Booking marked completed", "success");
    },
    onError: (err) => notify(err.message, "error"),
  });

  if (isLoading) return <LoadingState label="Loading booking" />;
  if (isError || !booking) return <ErrorState message="Could not load this booking." onRetry={refetch} />;

  const isFinal = booking.status === "CANCELLED" || booking.status === "COMPLETED";

  return (
    <div>
      <BackButton fallback="/admin/rental/bookings" className="mb-3" />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl">{booking.bookingReference}</h2>
        <StatusPill status={booking.status} />
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div className="hairline-card p-6">
          <h3 className="label-xs text-accent">Lehenga</h3>
          <div className="mt-4 flex items-center gap-4">
            {booking.itemImageUrl && (
              <img src={booking.itemImageUrl} alt="" className="h-20 w-14 shrink-0 rounded object-cover" />
            )}
            <div>
              <p className="text-sm">{booking.itemName}</p>
              <p className="label-xs text-muted-foreground">{booking.itemColour}</p>
            </div>
          </div>
        </div>

        <div className="hairline-card p-6">
          <h3 className="label-xs text-accent">Customer</h3>
          <p className="mt-4 text-sm">{booking.customerName}</p>
          <p className="label-xs mt-1 text-muted-foreground">{booking.customerPhone}</p>
        </div>

        <div className="hairline-card p-6">
          <h3 className="label-xs text-accent">Rental</h3>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pickup</span>
              <span>{formatDate(booking.startDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Return</span>
              <span>{formatDate(booking.endDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Days</span>
              <span>{booking.rentalDays}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Daily rate</span>
              <span>{formatPrice(booking.dailyRate)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 text-base">
              <span>Total</span>
              <span>{formatPrice(booking.totalAmount)}</span>
            </div>
          </div>
        </div>

        <div className="hairline-card p-6">
          <h3 className="label-xs text-accent">Payment</h3>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Transaction ID</span>
              <span>{booking.transactionId ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Booked on</span>
              <span>{formatDate(booking.createdAt)}</span>
            </div>
          </div>
          {booking.paymentScreenshotUrl && (
            <a href={booking.paymentScreenshotUrl} target="_blank" rel="noopener noreferrer" className="mt-4 block">
              <img src={booking.paymentScreenshotUrl} alt="Payment screenshot" className="max-h-48 rounded object-contain" />
            </a>
          )}
        </div>
      </div>

      {!isFinal && (
        <div className="hairline-card mt-8 p-6">
          <h3 className="label-xs text-accent">Actions</h3>
          <div className="mt-4 flex flex-wrap gap-4">
            <button className="btn-solid" disabled={confirm.isPending} onClick={() => confirm.mutate()}>
              Confirm Booking
            </button>
            <button
              className="btn-outline text-destructive"
              disabled={cancelFull.isPending}
              onClick={() => {
                if (window.confirm("Cancel this entire booking? All its dates will be released.")) {
                  cancelFull.mutate();
                }
              }}
            >
              Cancel Entire Booking
            </button>
            {booking.status === "CONFIRMED" && (
              <button className="btn-outline" disabled={complete.isPending} onClick={() => complete.mutate()}>
                Mark Completed
              </button>
            )}
          </div>

          <div className="mt-6 border-t pt-6">
            <p className="label-xs text-muted-foreground">Cancel only part of this booking</p>
            <div className="mt-3 flex flex-wrap items-end gap-4">
              <label className="block">
                <span className="label-xs text-muted-foreground">From</span>
                <input
                  type="date"
                  value={cancelRange.startDate}
                  onChange={(e) => setCancelRange((r) => ({ ...r, startDate: e.target.value }))}
                  className="field mt-2"
                />
              </label>
              <label className="block">
                <span className="label-xs text-muted-foreground">To</span>
                <input
                  type="date"
                  value={cancelRange.endDate}
                  onChange={(e) => setCancelRange((r) => ({ ...r, endDate: e.target.value }))}
                  className="field mt-2"
                />
              </label>
              <button
                className="btn-outline text-destructive"
                disabled={!cancelRange.startDate || !cancelRange.endDate || cancelPartial.isPending}
                onClick={() => cancelPartial.mutate()}
              >
                Cancel These Dates
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
