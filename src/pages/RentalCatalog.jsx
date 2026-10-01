import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import * as rentalApi from "../api/rental";
import { formatPrice, titleCase } from "../utils/format";
import { useRentalWishlist } from "../hooks/useRentalWishlist";
import LoadingState from "../components/LoadingState";

// Hidden, temporary route -- reachable ONLY via the shop's WhatsApp share
// link (/rental/<share-token>), never linked from site navigation. Not
// wrapped in the normal <Layout> (see App.jsx), so it never shows the
// header, cart icon, or footer -- this is a browse-only rental catalog,
// not part of the ecommerce flow. No login, no cart, no checkout, no
// payment: the customer favourites lehengas locally, then visits the shop.
//
// Each card links to RentalItemDetail (/rental/:shareToken/:itemId) to see
// EVERY uploaded photo -- a card here only ever shows the first one as a
// thumbnail, same as a product grid vs. its own product detail page. Same
// React Query key ("rental-catalog", shareToken) as the detail page, so
// clicking into a lehenga is instant (cache hit), not a fresh fetch.
export default function RentalCatalog() {
  const { shareToken } = useParams();
  const { isFavourite, toggleFavourite } = useRentalWishlist(shareToken);

  const { data: catalog, isLoading, isError } = useQuery({
    queryKey: ["rental-catalog", shareToken],
    queryFn: () => rentalApi.getRentalCatalogByShareToken(shareToken),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <LoadingState label="Loading catalog" />
      </div>
    );
  }

  if (isError || !catalog) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <h1 className="text-xl">Catalog unavailable</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          This rental catalog link is no longer active. Please contact the shop directly for the latest availability.
        </p>
      </div>
    );
  }

  const items = catalog.items ?? [];

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="mx-auto max-w-6xl px-5 pt-10">
        <p className="label-xs text-accent">StyleNest Fashion</p>
        <h1 className="mt-3 text-[clamp(1.6rem,5vw,2.4rem)] leading-tight">{catalog.name}</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Tap a lehenga to see all its photos, browse and favourite the ones you'd like to see, then visit us
          in-store to try them on and discuss rental details.
        </p>

        {items.length === 0 ? (
          <p className="mt-16 text-center text-sm text-muted-foreground">
            No lehengas have been added to this catalog yet -- check back soon.
          </p>
        ) : (
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((item) => (
              <div key={item.id} className="hairline-card relative overflow-hidden">
                <Link to={`/rental/${shareToken}/${item.id}`} className="block">
                  {/* aspect-[2/3] matches the uploaded photos' actual pixel
                      ratio (1024x1536) exactly -- any other ratio here
                      forces object-contain to letterbox with visible bg-muted
                      bars on the sides (the "border/bezel" look), or forces
                      object-cover to crop the lehenga (the original "cut off
                      at the top" bug). Matching the real ratio is what lets
                      the photo fill the box completely with nothing cropped
                      and nothing letterboxed. */}
                  <div className="relative aspect-[2/3] w-full bg-muted">
                    {item.imageUrls?.[0] ? (
                      <img src={item.imageUrls[0]} alt={item.name} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">No photo</div>
                    )}
                    {item.imageUrls?.length > 1 && (
                      <span className="label-xs absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-white">
                        1/{item.imageUrls.length}
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-sm leading-tight">{item.name}</p>
                    <p className="label-xs mt-1 text-muted-foreground">{titleCase(item.colour)}</p>
                    <p className="mt-2 text-sm">{formatPrice(item.rentalPrice)} / rental</p>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={() => toggleFavourite(item.id)}
                  aria-label={isFavourite(item.id) ? "Remove from favourites" : "Add to favourites"}
                  aria-pressed={isFavourite(item.id)}
                  className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm"
                >
                  <Heart
                    className={`h-4 w-4 ${isFavourite(item.id) ? "fill-destructive text-destructive" : "text-foreground"}`}
                  />
                </button>
              </div>
            ))}
          </div>
        )}

        <p className="mt-14 text-center text-xs text-muted-foreground">
          Rental discussion and availability are confirmed in-store only -- this page does not take payments or
          bookings.
        </p>
      </div>
    </div>
  );
}
