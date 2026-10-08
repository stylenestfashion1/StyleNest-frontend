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
 * Curates 4 distinct signature products across 4 key women categories:
 * 1 Kurti, 1 Cordset, 1 Top, and 1 Jeans.
 */
function selectCuratedWomenFour(products) {
  if (!products || products.length === 0) return [];

  const targetCategories = ["Kurti", "Cordset", "Tops", "Jeans"];
  const preferredIds = {
    Kurti: 270,   // White Paisley Print Kurti
    Cordset: 290, // Off White Wave Print Co-ord Set
    Tops: 56,     // Floral Appliqué Collared Shirt
    Jeans: 31,    // Medium Wash Wide-Leg Jeans with Bow Embroidery
  };

  const selected = [];
  const pickedIds = new Set();
  const pickedCats = new Set();

  for (const cat of targetCategories) {
    const prefId = preferredIds[cat];
    const match =
      products.find((p) => p.id === prefId) ||
      products.find(
        (p) =>
          p.categoryName?.toLowerCase() === cat.toLowerCase() &&
          !pickedIds.has(p.id)
      );
    if (match) {
      selected.push(match);
      pickedIds.add(match.id);
      pickedCats.add(match.categoryName?.toLowerCase());
    }
  }

  // Safety fill with any remaining distinct categories (Suit, Palazzo, etc.)
  if (selected.length < 4) {
    for (const p of products) {
      if (selected.length >= 4) break;
      const catKey = p.categoryName?.toLowerCase();
      if (!pickedIds.has(p.id) && !pickedCats.has(catKey)) {
        selected.push(p);
        pickedIds.add(p.id);
        pickedCats.add(catKey);
      }
    }
  }

  // Final fallback to reach 4 items if database has fewer distinct categories
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

export default function WomenHome() {
  const { setGender } = useGender();
  const { categories, featured, trending } = useGenderStorefront("WOMEN");
  const { getImage } = useScrollExpandImages();

  useEffect(() => setGender("women"), [setGender]);

  const cats = categories.data ?? [];
  const trendingProducts = trending.data?.content ?? [];
  const curated = featured.data?.content ?? [];

  // Fetch complete catalog pool for curated showcase with diverse categories
  const catalogQuery = useQuery({
    queryKey: ["women-curated-showcase-pool"],
    queryFn: () =>
      productsApi.filterProducts({
        gender: "WOMEN",
        active: true,
        sizePerPage: 200,
      }),
    staleTime: 5 * 60 * 1000,
  });

  const diverseTopFour = useMemo(() => {
    const allProducts = catalogQuery.data?.content ?? [];
    return selectCuratedWomenFour(allProducts);
  }, [catalogQuery.data?.content]);

  return (
    <PageFade>
      {/* ============ SHOP WOMENSWEAR — particle-text intro ============ */}
      <section className="relative h-[70vh] min-h-[460px] w-full bg-[#161512] md:h-[85vh]">
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

        {/* Animated Scroll Down Indicator */}
        <div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1.5 text-white/85 animate-bounce">
          <span className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.22em] text-white/90 drop-shadow-md">
            Scroll down to explore
          </span>
          <ChevronDown className="h-4 w-4 text-white/85 drop-shadow-md" />
        </div>
      </section>

      {/* ============ QUICK SHOWCASE — 4 DIVERSE SIGNATURE PRODUCTS (1 KURTI, 1 CORDSET, 1 TOP, 1 JEANS) ============ */}
      {(diverseTopFour.length > 0 || catalogQuery.isLoading) && (
        <section
          className="border-b border-border/40 bg-background py-12 md:py-16"
          aria-label="Featured womenswear styles"
        >
          <div className="mx-auto max-w-[1440px] px-5 md:px-10">
            <Reveal>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-8 border-b border-border/30 pb-4">
                <div>
                  <p className="label-xs text-accent uppercase tracking-[0.2em]">SIGNATURE STYLES</p>
                  <h3 className="display text-2xl font-medium tracking-tight md:text-3xl text-foreground mt-1">
                    Trending in Womenswear
                  </h3>
                </div>
                <span className="label-xs text-muted-foreground hidden sm:block">
                  Handpicked: Kurti · Co-ord · Top · Denim
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

      {/* ============ CATEGORIES — DepthCarousel, final and sole category presentation ============ */}
      <CategoryDepthCarousel categories={cats} gender="WOMEN" />

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
