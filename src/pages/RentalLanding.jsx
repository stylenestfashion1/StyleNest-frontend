import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import * as rentalApi from "../api/rental";
import LoadingState from "../components/LoadingState";

// The main-site "Rentals" nav link (see Header.jsx) has no share token of
// its own -- unlike every other rental route, which is only ever reached
// via an admin-generated /rental/<token> link. This page's only job is to
// resolve "whichever catalog is currently ACTIVE" and hand off into that
// same existing route, so RentalCatalog/RentalItemDetail/RentalBookingFlow
// stay the single, unduplicated implementation either way. Outside
// <Layout> like every other /rental/* route (see App.jsx) -- headerless
// on purpose, matching the rest of this module.
export default function RentalLanding() {
  const navigate = useNavigate();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["rental-active-catalog"],
    queryFn: () => rentalApi.getActiveRentalCatalog(),
  });

  useEffect(() => {
    if (data?.available && data.shareToken) {
      navigate(`/rental/${data.shareToken}`, { replace: true });
    }
  }, [data, navigate]);

  if (isLoading || data?.available) {
    return (
      <div className="min-h-screen bg-background">
        <LoadingState label="Loading rentals" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <h1 className="text-xl">No rentals available right now</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        {isError
          ? "Could not load rentals. Please try again shortly."
          : "Please check back soon, or contact the shop directly."}
      </p>
    </div>
  );
}