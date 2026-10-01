import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import DepthCarousel from "./DepthCarousel";
import { categoryImageFallback } from "../utils/categoryImage";

// The exact, curated storefront category lists — matched against real
// backend category names (not hardcoded category data). Order here is the
// display order. Carried over unchanged from the ScrollStack-based
// presentation this component replaces.
const MEN_CATEGORY_NAMES = ["T-shirts", "Cordset", "Lower"];
// "Plazzo" (missing the 'a') previously here silently dropped the real
// "Palazzo" category from this list — normalizeCategoryName strips
// non-letters and a trailing 's', but "plazzo" vs "palazzo" never matched,
// so the card never rendered even though the category was real and active.
const WOMEN_CATEGORY_NAMES = ["Tops", "Kurti", "Suit", "Cordset", "Jeans", "Palazzo"];

// The category's own slug is already gender-prefixed by the backend (e.g.
// "women-kurti" -- see CategoryServiceImpl.buildSlug), so the clean public
// path only needs the bare segment after that prefix: /women/kurti, not
// /women/women-kurti. Falls back to the old query-param route if a
// category is ever missing a slug (defensive -- shouldn't happen, the
// column is NOT NULL).
function categoryPath(cat, gender) {
  if (!cat.slug) return `/products?gender=${gender}&categoryId=${cat.id}`;
  const prefix = `${gender.toLowerCase()}-`;
  const bareSlug = cat.slug.startsWith(prefix) ? cat.slug.slice(prefix.length) : cat.slug;
  return `/${gender.toLowerCase()}/${bareSlug}`;
}

function normalizeCategoryName(name) {
  return (name ?? "").toLowerCase().replace(/[^a-z]/g, "").replace(/s$/, "");
}

/** Filters + orders the real fetched categories down to the curated list for this gender. */
function selectStorefrontCategories(categories, gender) {
  const desired = gender === "WOMEN" ? WOMEN_CATEGORY_NAMES : MEN_CATEGORY_NAMES;
  const byName = new Map();
  for (const cat of categories ?? []) {
    if (cat.active === false) continue;
    byName.set(normalizeCategoryName(cat.name), cat);
  }
  return desired.map((name) => byName.get(normalizeCategoryName(name))).filter(Boolean);
}

// DepthCarousel's dimensions are plain numeric props, not CSS -- they need
// real breakpoint-aware values rather than relying solely on the
// component's own built-in width-based auto-scale (which only shrinks
// everything uniformly, it doesn't reduce how many cards are visible or
// how much 3D depth/spread is used). Desktop keeps the exact values from
// the original usage example; tablet/mobile scale the whole concept down
// rather than cropping it.
const BREAKPOINTS = [
  { minWidth: 1024, name: "desktop", cardWidth: 300, cardHeight: 380, radius: 18, depth: 220, spread: 90, tilt: 22, perspective: 1400, visibleCards: 4, stageHeight: 520 },
  { minWidth: 640, name: "tablet", cardWidth: 240, cardHeight: 300, radius: 16, depth: 160, spread: 66, tilt: 20, perspective: 1100, visibleCards: 3, stageHeight: 420 },
  { minWidth: 0, name: "mobile", cardWidth: 230, cardHeight: 288, radius: 16, depth: 130, spread: 40, tilt: 16, perspective: 950, visibleCards: 2, stageHeight: 400 },
];

function dimsForWidth(width) {
  return BREAKPOINTS.find((bp) => width >= bp.minWidth) ?? BREAKPOINTS[BREAKPOINTS.length - 1];
}

function useCarouselDims() {
  const [dims, setDims] = useState(() =>
    dimsForWidth(typeof window === "undefined" ? 1024 : window.innerWidth)
  );

  useEffect(() => {
    let frame = null;
    const onResize = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        setDims(dimsForWidth(window.innerWidth));
      });
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return dims;
}

export default function CategoryDepthCarousel({ categories, gender }) {
  const navigate = useNavigate();
  const dims = useCarouselDims();
  const selected = selectStorefrontCategories(categories, gender);

  if (selected.length === 0) return null;

  const items = selected.map((cat) => ({
    image: cat.imageUrl || categoryImageFallback(cat.name, gender),
    alt: cat.name,
    category: cat,
  }));

  return (
    <section className="relative overflow-hidden bg-[#161512] py-16 md:py-24">
      <div className="mx-auto max-w-[1440px] px-5 text-center md:px-10">
        <p className="display text-3xl italic text-white md:text-4xl">Explore Categories</p>
      </div>

      <div className="relative mt-10" style={{ height: dims.stageHeight }}>
        <DepthCarousel
          items={items}
          cardWidth={dims.cardWidth}
          cardHeight={dims.cardHeight}
          radius={dims.radius}
          depth={dims.depth}
          spread={dims.spread}
          tilt={dims.tilt}
          perspective={dims.perspective}
          visibleCards={dims.visibleCards}
          tint="#05060a"
          loop
          showControls
          showIndicators
          onActivate={(_, item) => navigate(categoryPath(item.category, gender))}
        />
      </div>

      {/* Premium, minimal "scroll down" hint -- pointer-events-none so it
          never competes with the carousel's own drag/swipe/tap handling
          beneath it, purely a visual cue. */}
      <div className="pointer-events-none relative mt-6 flex flex-col items-center gap-1.5 text-white/50">
        <span className="label-xs tracking-[0.2em]">Scroll Down</span>
        <ChevronDown className="float-soft h-4 w-4" aria-hidden="true" />
      </div>
    </section>
  );
}
