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

export default function MenHome() {
  const { setGender } = useGender();
  const { categories, featured, trending } = useGenderStorefront("MEN");
  const { getImage } = useScrollExpandImages();
  const entryRef = useRef(null);
  const entryInView = useInView(entryRef, ENTRY_IN_VIEW_OPTIONS);
  const fluidCursorEnabled = useFluidCursorEnabled();

  useEffect(() => setGender("men"), [setGender]);

  const cats = categories.data ?? [];
  const trendingProducts = trending.data?.content ?? [];
  const bestSellers = featured.data?.content ?? [];

  return (
    <PageFade>
      {/* ============ SHOP MENSWEAR — particle-text intro ============ */}
      {/* SplashCursor is scoped to exactly this section's viewport visibility — mounted only
          while the entry section is in view, unmounted (with full cleanup) the moment it isn't.
          Responds to both mouse and touch (see useFluidCursorEnabled) — same simulation either way. */}
      {entryInView && fluidCursorEnabled && <SplashCursor color="#b7864f" />}
      <section ref={entryRef} className="relative h-[70vh] min-h-[460px] w-full bg-[#161512] md:h-[85vh]">
        <ParticleText
          text="SHOP MENSWEAR"
          color="#f3f2ef"
          highlightColor="#b7864f"
          fontFamily="'Playfair Display', Georgia, serif"
          fontWeight={500}
          fontSize="clamp(2.1rem, 9vw, 6.5rem)"
          density={2}
          className="h-full w-full"
        />
      </section>

      {/* ============ SCROLL-EXPAND #1 — campaign / identity ============ */}
      <ScrollExpand
        src={getImage("MEN", 1)}
        alt="Menswear campaign"
        title="THE MODERN MAN"
        scrollHint="Scroll to continue"
        useWindowScroll
        {...SCROLL_EXPAND_CONFIG}
      >
        <h2 className="display text-3xl text-white md:text-5xl">Considered, not decorated</h2>
        <p className="mt-4 max-w-md text-sm text-white/80 md:text-base">
          Tailoring built for structure and comfort in equal measure.
        </p>
      </ScrollExpand>

      {/* ============ CATEGORIES — ScrollStack, final and sole category presentation ============ */}
      <CategoryScrollStack categories={cats} gender="MEN" />

      {/* ============ SCROLL-EXPAND #2 — collection editorial ============ */}
      <ScrollExpand
        src={getImage("MEN", 2)}
        alt="Men's collection editorial"
        title="THE COLLECTION"
        scrollHint="Scroll to continue"
        useWindowScroll
        {...SCROLL_EXPAND_CONFIG}
      >
        <h2 className="display text-3xl text-white md:text-5xl">Layers that last</h2>
        <p className="mt-4 max-w-md text-sm text-white/80 md:text-base">Autumn / Winter, cut in limited runs.</p>
      </ScrollExpand>

      {/* ============ TRENDING — admin-curated, gender-scoped ============ */}
      {(trending.isLoading || trendingProducts.length > 0) && (
        <div className="mx-auto max-w-[1440px] px-5 md:px-10">
          <section className="py-16 md:py-20">
            <Reveal className="flex items-end justify-between gap-4">
              <h2 className="text-2xl md:text-3xl">Trending</h2>
              <Link to="/trending" className="label-xs link-underline hidden items-center gap-1 sm:flex">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </Reveal>
            <div className="mt-8">
              <ProductGrid products={trendingProducts} loading={trending.isLoading} />
            </div>
          </section>
        </div>
      )}

      {/* ============ SCROLL-EXPAND #3 — bestsellers editorial ============ */}
      <ScrollExpand
        src={getImage("MEN", 3)}
        alt="Men's bestsellers editorial"
        title="MADE TO LAST"
        scrollHint="Scroll to continue"
        useWindowScroll
        {...SCROLL_EXPAND_CONFIG}
      >
        <h2 className="display text-3xl text-white md:text-5xl">The pieces people return for</h2>
        <p className="mt-4 max-w-md text-sm text-white/80 md:text-base">Considered basics, worn on repeat.</p>
      </ScrollExpand>

      {/* ============ BESTSELLERS — only rendered when real featured data exists ============ */}
      {bestSellers.length > 0 && (
        <div className="mx-auto max-w-[1440px] px-5 md:px-10">
          <section className="border-y py-16 md:py-20">
            <Reveal className="text-center">
              <h2 className="text-2xl md:text-3xl">Bestsellers</h2>
            </Reveal>
            <div className="mt-8">
              <ProductGrid products={bestSellers} />
            </div>
          </section>
        </div>
      )}
    </PageFade>
  );
}
