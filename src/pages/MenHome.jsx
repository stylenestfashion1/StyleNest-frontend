import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useGender } from "../context/GenderContext";
import { useGenderStorefront } from "../hooks/useGenderStorefront";
import { useScrollExpandImages } from "../context/ScrollExpandImagesContext";
import * as productsApi from "../api/products";
import ProductGrid from "../components/ProductGrid";
import CategoryDepthCarousel from "../components/CategoryDepthCarousel";
import ScrollExpand from "../components/ScrollExpand";
import ParticleText from "../components/ParticleText";
import { PageFade, Reveal } from "../components/Reveal";

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

/**
 * Curates 4 distinct signature products across distinct styles for menswear:
 * 1 Track Pants/Lower, 1 Co-ord Set, 1 Washed Polo, 1 Ombre Graphic Tee.
 */
function selectCuratedMenFour(products) {
  if (!products || products.length === 0) return [];

  const preferredIds = [
    260, // Men's Piped Track Pants (Lower / Track pants)
    259, // Men's Brown Graphic T-Shirt & Shorts Co-ord Set (Cordset)
    255, // Men's Acid Blue Washed Graphic Polo T-Shirt (Collared Polo)
    256, // Men's Ombre Dip-Dye Graphic T-Shirt (Ombre Crewneck Tee)
  ];

  const selected = [];
  const pickedIds = new Set();

  for (const id of preferredIds) {
    const match = products.find((p) => p.id === id);
    if (match && !pickedIds.has(match.id)) {
      selected.push(match);
      pickedIds.add(match.id);
    }
  }

  // Safety fallback if any specific ID is unavailable
  if (selected.length < 4) {
    for (const p of products) {
      if (selected.length >= 4) break;
      if (!pickedIds.has(p.id)) {
        selected.push(p);
        pickedIds.add(p.id);
      }
    }
  }

  return selected;
}

export default function MenHome() {
  const { setGender } = useGender();
  const { categories, featured, trending } = useGenderStorefront("MEN");
  const { getImage } = useScrollExpandImages();

  useEffect(() => setGender("men"), [setGender]);

  const cats = categories.data ?? [];
  const trendingProducts = trending.data?.content ?? [];
  const bestSellers = featured.data?.content ?? [];

  // Fetch complete catalog pool for curated showcase with diverse categories
  const catalogQuery = useQuery({
    queryKey: ["men-curated-showcase-pool"],
    queryFn: () =>
      productsApi.filterProducts({
        gender: "MEN",
        active: true,
        sizePerPage: 100,
      }),
    staleTime: 5 * 60 * 1000,
  });

  const diverseTopFour = useMemo(() => {
    const allProducts = catalogQuery.data?.content ?? [];
    return selectCuratedMenFour(allProducts);
  }, [catalogQuery.data?.content]);

  return (
    <PageFade>
      {/* ============ SHOP MENSWEAR — particle-text intro ============ */}
      <section className="relative h-[70vh] min-h-[460px] w-full bg-[#161512] md:h-[85vh]">
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

        {/* Animated Scroll Down Indicator */}
        <div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1.5 text-white/85 animate-bounce">
          <span className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.22em] text-white/90 drop-shadow-md">
            Scroll down to explore
          </span>
          <ChevronDown className="h-4 w-4 text-white/85 drop-shadow-md" />
        </div>
      </section>

      {/* ============ QUICK SHOWCASE — 4 DIVERSE SIGNATURE PRODUCTS ============ */}
      {(diverseTopFour.length > 0 || catalogQuery.isLoading) && (
        <section
          className="border-b border-border/40 bg-background py-12 md:py-16"
          aria-label="Featured menswear styles"
        >
          <div className="mx-auto max-w-[1440px] px-5 md:px-10">
            <Reveal>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-8 border-b border-border/30 pb-4">
                <div>
                  <p className="label-xs text-accent uppercase tracking-[0.2em]">SIGNATURE STYLES</p>
                  <h3 className="display text-2xl font-medium tracking-tight md:text-3xl text-foreground mt-1">
                    Trending in Menswear
                  </h3>
                </div>
                <span className="label-xs text-muted-foreground hidden sm:block">
                  Handpicked: Trackpants · Co-ord · Polo · Graphic Tee
                </span>
              </div>
            </Reveal>
            <ProductGrid
              products={diverseTopFour}
              loading={catalogQuery.isLoading && diverseTopFour.length === 0}
              skeletonCount={4}
            />
          </div>
        </section>
      )}

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

      {/* ============ CATEGORIES — DepthCarousel, final and sole category presentation ============ */}
      <CategoryDepthCarousel categories={cats} gender="MEN" />

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
