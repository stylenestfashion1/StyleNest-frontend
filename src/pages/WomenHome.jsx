import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useGender } from "../context/GenderContext";
import { useGenderStorefront } from "../hooks/useGenderStorefront";
import { useScrollExpandImages } from "../context/ScrollExpandImagesContext";
import { useInView } from "../hooks/useInView";
import { useFluidCursorEnabled } from "../hooks/useFluidCursorEnabled";
import ProductGrid from "../components/ProductGrid";
import CategoryScrollStack from "../components/CategoryScrollStack";
import ScrollExpand from "../components/ScrollExpand";
import ParticleText from "../components/ParticleText";
import SplashCursor from "../components/SplashCursor";
import { PageFade, Reveal } from "../components/Reveal";

const ENTRY_IN_VIEW_OPTIONS = { threshold: 0 };

const SCROLL_EXPAND_CONFIG = {
  mediaZoom: 1.35,
  startWidth: 42,
  startHeight: 58,
  startRadius: 24,
  endRadius: 0,
  scrollDistance: 0.9,
  holdDistance: 0.2,
  smoothing: 0.1,
  overlayScrim: 0.45,
};

export default function WomenHome() {
  const { setGender } = useGender();
  const { categories, featured, trending } = useGenderStorefront("WOMEN");
  const { getImage } = useScrollExpandImages();
  const entryRef = useRef(null);
  const entryInView = useInView(entryRef, ENTRY_IN_VIEW_OPTIONS);
  const fluidCursorEnabled = useFluidCursorEnabled();

  useEffect(() => setGender("women"), [setGender]);

  const cats = categories.data ?? [];
  const trendingProducts = trending.data?.content ?? [];
  const curated = featured.data?.content ?? [];

  return (
    <PageFade>
      {/* ============ SHOP WOMENSWEAR — particle-text intro ============ */}
      {/* SplashCursor is scoped to exactly this section's viewport visibility — mounted only
          while the entry section is in view, unmounted (with full cleanup) the moment it isn't.
          Responds to both mouse and touch (see useFluidCursorEnabled) — same simulation either way. */}
      {entryInView && fluidCursorEnabled && <SplashCursor color="#e0c793" />}
      <section ref={entryRef} className="relative h-[70vh] min-h-[460px] w-full bg-[#161512] md:h-[85vh]">
        <ParticleText
          text="SHOP WOMENSWEAR"
          color="#f3f2ef"
          highlightColor="#dd9c85"
          fontFamily="'Playfair Display', Georgia, serif"
          fontWeight={500}
          fontSize="clamp(1.8rem, 8vw, 5.8rem)"
          density={2}
          className="h-full w-full"
        />
      </section>

      {/* ============ SCROLL-EXPAND #1 — campaign / identity ============ */}
      <ScrollExpand
        src={getImage("WOMEN", 1)}
        alt="Womenswear campaign"
        title="THE MODERN WOMAN"
        scrollHint="Scroll to continue"
        useWindowScroll
        {...SCROLL_EXPAND_CONFIG}
      >
        <h2 className="display text-3xl italic text-white md:text-5xl">Ease, cut with intention</h2>
        <p className="mt-4 max-w-md text-sm text-white/80 md:text-base">
          Silk and considered layers, for every day.
        </p>
      </ScrollExpand>

      {/* ============ CATEGORIES — ScrollStack, final and sole category presentation ============ */}
      <CategoryScrollStack categories={cats} gender="WOMEN" />

      {/* ============ SCROLL-EXPAND #2 — collection editorial ============ */}
      <ScrollExpand
        src={getImage("WOMEN", 2)}
        alt="Women's collection editorial"
        title="THE EDIT"
        scrollHint="Scroll to continue"
        useWindowScroll
        {...SCROLL_EXPAND_CONFIG}
      >
        <h2 className="display text-3xl italic text-white md:text-5xl">Fluid, by design</h2>
        <p className="mt-4 max-w-md text-sm text-white/80 md:text-base">Colour, drawn from clay, sand and sage.</p>
      </ScrollExpand>

      {/* ============ TRENDING — admin-curated, gender-scoped ============ */}
      {(trending.isLoading || trendingProducts.length > 0) && (
        <div className="mx-auto max-w-[1440px] px-5 md:px-10">
          <section className="py-16 md:py-24">
            <Reveal className="flex items-end justify-between gap-4">
              <div>
                <p className="label-xs text-accent">Right Now</p>
                <h2 className="display mt-3 text-2xl italic md:text-3xl">Trending</h2>
              </div>
              <Link to="/trending" className="label-xs link-underline hidden items-center gap-1 sm:flex">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </Reveal>
            <div className="mt-10">
              <ProductGrid products={trendingProducts} loading={trending.isLoading} />
            </div>
          </section>
        </div>
      )}

      {/* ============ SCROLL-EXPAND #3 — bestsellers editorial ============ */}
      <ScrollExpand
        src={getImage("WOMEN", 3)}
        alt="Women's bestsellers editorial"
        title="QUIETLY ICONIC"
        scrollHint="Scroll to continue"
        useWindowScroll
        {...SCROLL_EXPAND_CONFIG}
      >
        <h2 className="display text-3xl italic text-white md:text-5xl">Pieces worth returning to</h2>
        <p className="mt-4 max-w-md text-sm text-white/80 md:text-base">
          The considered basics of a modern wardrobe.
        </p>
      </ScrollExpand>

      {/* ============ BESTSELLERS — only rendered when real featured data exists ============ */}
      {curated.length > 0 && (
        <div className="mx-auto max-w-[1440px] px-5 md:px-10">
          <section className="border-y py-16 md:py-24">
            <div className="text-center">
              <p className="label-xs text-accent">Handpicked</p>
              <h2 className="display mt-3 text-2xl italic md:text-3xl">Bestsellers</h2>
            </div>
            <div className="mt-10">
              <ProductGrid products={curated} />
            </div>
          </section>
        </div>
      )}
    </PageFade>
  );
}
