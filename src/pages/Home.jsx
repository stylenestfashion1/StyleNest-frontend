import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import heroMen from "../assets/hero-men.jpg";
import heroWomen from "../assets/hero-women.jpg";
import { useGender } from "../context/GenderContext";
import * as categoriesApi from "../api/categories";
import * as productsApi from "../api/products";
import HomeCategoryDiscovery from "../components/HomeCategoryDiscovery";
import ProductGrid from "../components/ProductGrid";
import { Reveal } from "../components/Reveal";

const COPY = {
  men: { label: "Men", head: "WELL TAILORED", tag: "Structure, softened by wear." },
  women: { label: "Women", head: "AT EASE", tag: "Silk that moves before you do." },
};

/**
 * These photos were shot to spec (1152x1536, exactly 3:4) specifically to
 * match this panel's box shape and to match each other in framing: both
 * models are full-length, centered, comparable camera distance, and land at
 * a similar scale — head to shoe with a small even margin, not the
 * mismatched crops of the earlier placeholder photography. Because the
 * source ratio equals the panel's aspect-ratio, `cover` + centered position
 * needs no per-image zoom or offset compensation for the women's shot.
 */
const PANEL_ASPECT = "0.75";
const PANEL_IMAGE = {
  // Even the matched reshoot left his figure reading a touch smaller than
  // hers — a small corrective zoom (tuned by comparing rendered crops, not
  // just the source measurements) equalizes how tall each figure reads.
  men: { src: heroMen, size: "auto 102%", position: "50% 70%" },
  women: { src: heroWomen, size: "cover", position: "50% 50%" },
};

function HeroPanel({ gender, className = "", children, ...props }) {
  const img = PANEL_IMAGE[gender];
  return (
    <button type="button" className={`group relative overflow-hidden ${className}`} style={{ aspectRatio: PANEL_ASPECT }} {...props}>
      <div
        className="absolute inset-0 bg-no-repeat transition-transform duration-[1400ms] ease-out group-hover:scale-105"
        style={{ backgroundImage: `url(${img.src})`, backgroundSize: img.size, backgroundPosition: img.position }}
        role="img"
        aria-label={gender === "men" ? "Menswear lookbook" : "Womenswear lookbook"}
      />
      {children}
    </button>
  );
}

/**
 * Round-robin picker across categories so the 6 featured products
 * represent different categories (e.g. Shirts, Kurtas, T-shirts, Lower).
 */
function selectDiverseProducts(products, maxCount = 6) {
  if (!products || products.length === 0) return [];
  const byCategory = new Map();
  for (const p of products) {
    const cat = p.categoryName || p.categoryId || "default";
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat).push(p);
  }
  const result = [];
  const categoryArrays = Array.from(byCategory.values());
  let idx = 0;
  while (result.length < maxCount && categoryArrays.some((arr) => idx < arr.length)) {
    for (const arr of categoryArrays) {
      if (idx < arr.length && result.length < maxCount) {
        result.push(arr[idx]);
      }
    }
    idx++;
  }
  return result;
}

export default function Home() {
  const { setGender } = useGender();
  const [active, setActive] = useState("women");
  const navigate = useNavigate();
  const copy = COPY[active];

  // Neutral accent on the gateway itself — gender-specific theming should
  // only kick in once the visitor actually enters that section.
  useEffect(() => setGender(null), [setGender]);

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoriesApi.getCategories(),
    staleTime: 5 * 60 * 1000,
  });

  const menProductsQuery = useQuery({
    queryKey: ["home-products", "MEN"],
    queryFn: () => productsApi.filterProducts({ gender: "MEN", active: true, sizePerPage: 100 }),
    staleTime: 5 * 60 * 1000,
  });

  const womenProductsQuery = useQuery({
    queryKey: ["home-products", "WOMEN"],
    queryFn: () => productsApi.filterProducts({ gender: "WOMEN", active: true, sizePerPage: 200 }),
    staleTime: 5 * 60 * 1000,
  });

  const menFeatured = selectDiverseProducts(menProductsQuery.data?.content ?? [], 8);
  const womenFeatured = selectDiverseProducts(womenProductsQuery.data?.content ?? [], 8);

  const choose = (g) => {
    setGender(g);
    navigate(g === "men" ? "/men" : "/women");
  };

  return (
    <>
      {/* Mobile: stacked tappable panels, no hover-dependent interaction */}
      <section className="md:hidden">
        {["men", "women"].map((g) => (
          <HeroPanel key={g} gender={g} className="block w-full" onClick={() => choose(g)} aria-label={`Explore ${g}`}>
            <span className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/10 to-transparent" />
            <span className="absolute bottom-8 left-6 text-left text-primary-foreground">
              <span className="label-xs text-primary-foreground/80">{COPY[g].label}</span>
              <span className="display mt-2 block text-3xl">{COPY[g].head}</span>
              <span className="label-xs mt-4 inline-flex items-center gap-2">
                Enter {COPY[g].label} <ArrowRight className="h-3 w-3" />
              </span>
            </span>
          </HeroPanel>
        ))}
      </section>

      {/* Desktop: hover-preview split screen */}
      <section className="relative hidden w-full overflow-hidden md:block">
        <div className="pointer-events-none absolute inset-0 z-20 opacity-[0.08]">
          <div
            className="drift-layer h-full w-full"
            style={{
              background:
                "radial-gradient(60% 60% at 30% 30%, var(--color-accent) 0%, transparent 60%), radial-gradient(50% 50% at 75% 65%, var(--color-accent-2) 0%, transparent 65%)",
            }}
          />
        </div>

        <div className="grid grid-cols-2">
          {["men", "women"].map((g) => (
            <HeroPanel key={g} gender={g} onMouseEnter={() => setActive(g)} onClick={() => choose(g)} aria-label={`Explore ${g}`}>
              <span className="absolute inset-0 bg-foreground transition-opacity duration-700" style={{ opacity: active === g ? 0.08 : 0.42 }} />
              <span className="label-xs absolute bottom-10 left-1/2 -translate-x-1/2 text-primary-foreground">{g}</span>
            </HeroPanel>
          ))}
        </div>

        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center px-5">
          <div className="grain pointer-events-auto w-full max-w-md border border-card/40 bg-card/72 px-8 py-12 text-center shadow-[0_30px_80px_rgba(0,0,0,0.18)] backdrop-blur-md">
            <p key={`${copy.label}-l`} className="label-xs rise-in text-accent">
              {copy.label}
            </p>
            <h1 key={`${copy.label}-h`} className="rise-in mt-5 text-[clamp(2.4rem,5vw,3.6rem)] leading-[1.05] tracking-[0.02em]" style={{ animationDelay: "80ms" }}>
              {copy.head}
            </h1>
            <span className="hairline-grow mx-auto mt-6 block h-px w-16 bg-accent" />
            <p key={`${copy.label}-t`} className="display rise-in mt-4 text-base italic text-muted-foreground" style={{ animationDelay: "160ms" }}>
              {copy.tag}
            </p>
            <button className="btn-solid sheen mt-8" onClick={() => choose(active)}>
              Enter {copy.label}
            </button>
          </div>
        </div>

        <button
          onMouseEnter={() => setActive("men")}
          onClick={() => choose("men")}
          className={`label-xs sheen absolute left-0 top-1/2 z-30 -translate-y-1/2 rounded-r-full border border-l-0 px-5 py-3 backdrop-blur transition-all duration-500 hover:pl-7 ${
            active === "men" ? "bg-foreground text-primary-foreground" : "bg-card/80 text-foreground"
          }`}
        >
          <ChevronLeft className="mr-1 inline h-3 w-3" />
          Men
        </button>
        <button
          onMouseEnter={() => setActive("women")}
          onClick={() => choose("women")}
          className={`label-xs sheen absolute right-0 top-1/2 z-30 -translate-y-1/2 rounded-l-full border border-r-0 px-5 py-3 backdrop-blur transition-all duration-500 hover:pr-7 ${
            active === "women" ? "bg-foreground text-primary-foreground" : "bg-card/80 text-foreground"
          }`}
        >
          Women
          <ChevronRight className="ml-1 inline h-3 w-3" />
        </button>

        <div className="absolute bottom-8 left-6 z-30 flex gap-2 md:left-10">
          {["bg-accent", "bg-accent-2", "bg-accent-3"].map((c, i) => (
            <span key={c} className={`float-soft h-5 w-5 border border-card/50 ${c}`} style={{ animationDelay: `${i * 400}ms` }} />
          ))}
        </div>

        <Link
          to={active === "men" ? "/men" : "/women"}
          onClick={() => setGender(active)}
          className="label-xs sheen absolute bottom-8 right-6 z-30 flex h-24 w-24 items-center justify-center rounded-full bg-foreground text-center text-primary-foreground transition-transform duration-700 hover:scale-110 md:right-10"
        >
          View
          <br />
          All
        </Link>
      </section>

      {/* ===================== WOMEN SECTION (FIRST PRIORITY) ===================== */}
      {/* Scroll-down Category Discovery: WOMEN */}
      <HomeCategoryDiscovery
        gender="WOMEN"
        title="SHOP WOMEN"
        subtitle="Flowing silhouettes, festive wear, and modern essentials."
        categories={categoriesQuery.data}
        isLoading={categoriesQuery.isLoading}
      />

      {/* Featured 8 Products: WOMEN (Across Different Categories) */}
      <section className="border-b border-border/40 pb-16 md:pb-24" aria-label="Featured womenswear">
        <div className="mx-auto max-w-[1440px] px-5 md:px-10">
          <Reveal>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-8 border-b border-border/30 pb-4">
              <div>
                <p className="label-xs text-accent uppercase tracking-[0.2em]">CURATED FOR HER</p>
                <h3 className="display text-2xl font-medium tracking-tight md:text-3xl text-foreground mt-1">
                  Featured in Womenswear
                </h3>
              </div>
              <Link to="/women" className="label-xs link-underline inline-flex items-center gap-1.5 text-foreground hover:text-accent">
                View all Women's products <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </Reveal>
          <ProductGrid products={womenFeatured} loading={womenProductsQuery.isLoading} skeletonCount={8} />
        </div>
      </section>

      {/* ===================== MEN SECTION ===================== */}
      {/* Scroll-down Category Discovery: MEN */}
      <HomeCategoryDiscovery
        gender="MEN"
        title="SHOP MEN"
        subtitle="Essential tailoring, casual staples, and everyday layers."
        categories={categoriesQuery.data}
        isLoading={categoriesQuery.isLoading}
      />

      {/* Featured 8 Products: MEN (Across Different Categories) */}
      <section className="pb-16 md:pb-24" aria-label="Featured menswear">
        <div className="mx-auto max-w-[1440px] px-5 md:px-10">
          <Reveal>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-8 border-b border-border/30 pb-4">
              <div>
                <p className="label-xs text-accent uppercase tracking-[0.2em]">CURATED FOR HIM</p>
                <h3 className="display text-2xl font-medium tracking-tight md:text-3xl text-foreground mt-1">
                  Featured in Menswear
                </h3>
              </div>
              <Link to="/men" className="label-xs link-underline inline-flex items-center gap-1.5 text-foreground hover:text-accent">
                View all Men's products <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </Reveal>
          <ProductGrid products={menFeatured} loading={menProductsQuery.isLoading} skeletonCount={8} />
        </div>
      </section>
    </>
  );
}
