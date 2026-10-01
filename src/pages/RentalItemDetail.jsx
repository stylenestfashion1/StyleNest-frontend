import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Heart } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import * as rentalApi from "../api/rental";
import { formatPrice, titleCase } from "../utils/format";
import { useRentalWishlist } from "../hooks/useRentalWishlist";
import LoadingState from "../components/LoadingState";
import BackButton from "../components/BackButton";

// "Click a lehenga, see all its photos" -- the catalog grid only ever
// showed the first uploaded image per card (see RentalCatalog.jsx); this
// is the missing detail view, matching the same thumbnail-strip +
// main-image pattern as the real ProductDetails page. Same query key as
// RentalCatalog ("rental-catalog", shareToken) so navigating here from the
// grid is instant (React Query cache hit), not a fresh fetch.
export default function RentalItemDetail() {
  const { shareToken, itemId } = useParams();
  const { isFavourite, toggleFavourite } = useRentalWishlist(shareToken);
  const [activeImage, setActiveImage] = useState(0);

  const { data: catalog, isLoading, isError } = useQuery({
    queryKey: ["rental-catalog", shareToken],
    queryFn: () => rentalApi.getRentalCatalogByShareToken(shareToken),
  });

  const item = catalog?.items?.find((i) => String(i.id) === itemId);

  useEffect(() => {
    setActiveImage(0);
  }, [itemId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <LoadingState label="Loading lehenga" />
      </div>
    );
  }

  if (isError || !item) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <h1 className="text-xl">Lehenga not found</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          This item may have been removed from the catalog. Please go back and check the current selection.
        </p>
        <BackButton fallback={`/rental/${shareToken}`} label="Back to catalog" />
      </div>
    );
  }

  const images = item.imageUrls ?? [];
  const saved = isFavourite(item.id);

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="mx-auto max-w-6xl px-5 pt-10">
        <BackButton fallback={`/rental/${shareToken}`} label="Back to catalog" className="mb-6" />

        <div className="grid gap-8 sm:grid-cols-[1.3fr_1fr]">
          <div className="flex gap-3">
            {images.length > 1 && (
              <div className="flex flex-col gap-2">
                {images.map((url, i) => (
                  <button
                    key={url}
                    onClick={() => setActiveImage(i)}
                    className={`h-20 w-14 overflow-hidden border ${activeImage === i ? "border-accent" : "border-transparent"}`}
                    aria-label={`View photo ${i + 1}`}
                  >
                    <img src={url} alt="" loading="lazy" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            {/* aspect-[2/3] matches the uploaded photos' actual pixel ratio
                (1024x1536) exactly -- see RentalCatalog.jsx's comment on
                the same fix for why this eliminates both the earlier
                cropping bug and the letterbox/bezel look. */}
            <div className="aspect-[2/3] max-w-xl flex-1 overflow-hidden bg-muted">
              {images[activeImage] ? (
                <img src={images[activeImage]} alt={item.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No photo</div>
              )}
            </div>
          </div>

          <div>
            <h1 className="text-[clamp(1.5rem,4vw,2.1rem)] leading-tight">{item.name}</h1>
            <p className="label-xs mt-2 text-muted-foreground">{titleCase(item.colour)}</p>
            <p className="mt-4 text-lg">{formatPrice(item.rentalPrice)} / day</p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link to={`/rental/${shareToken}/${itemId}/book`} className="btn-solid">
                Book Now
              </Link>
              <button
                type="button"
                onClick={() => toggleFavourite(item.id)}
                aria-pressed={saved}
                className="btn-outline inline-flex items-center gap-2"
              >
                <Heart className={`h-4 w-4 ${saved ? "fill-destructive text-destructive" : ""}`} />
                {saved ? "Saved to favourites" : "Add to favourites"}
              </button>
            </div>

            <p className="mt-10 text-sm leading-relaxed text-muted-foreground">
              Booking holds your dates while you complete payment by QR -- your booking is confirmed only once the
              shop verifies your payment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
