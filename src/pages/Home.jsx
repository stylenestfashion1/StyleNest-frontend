import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Truck,
  ShieldCheck,
  RotateCcw,
  MessageCircle,
  Sparkles,
  LayoutGrid,
} from "lucide-react";
import { useGender } from "../context/GenderContext";
import stylenestLogo from "../assets/stylenest-logo.jpeg";
import * as categoriesApi from "../api/categories";
import * as productsApi from "../api/products";
import HomeCategoryDiscovery from "../components/HomeCategoryDiscovery";
import ProductGrid from "../components/ProductGrid";
import { Reveal } from "../components/Reveal";

/**
 * SD-Style Circular Category Chips.
 * Uses authentic, real product photography from the live StyleNest catalog.
 */
const CATEGORY_CHIPS = [
  {
    name: "Kurtis",
    to: "/women/kurti",
    image: "https://d1311wbk6unapo.cloudfront.net/NushopCatalogue/tr:f-webp,w-1200,fo-auto/6acf6ff6d488cd0ea435cb10/cat_img/wAyZV8jS_9ADDPQX4P0_2026-10-14_2.jpg",
    position: "50% 10%",
  },
  {
    name: "Suits",
    to: "/women/suit",
    image: "https://d1311wbk6unapo.cloudfront.net/NushopCatalogue/tr:f-webp,w-1200,fo-auto/6acf6ff6d488cd0ea435cb10/cat_img/SJKsbhvE_LYOSGPPSDZ_2026-10-14_1.jpg",
    position: "50% 10%",
  },
  {
    name: "Dresses",
    to: "/women/one-piece",
    image: "https://api.stylenestfashion.com/uploads/products/1f5ac2d9-76b1-49b0-8176-fa16c8daa36e.jpg",
    position: "50% 18%",
  },
  {
    name: "Co-ord Sets",
    to: "/women/cordset",
    image: "https://api.stylenestfashion.com/uploads/products/d3ac4dda-bf7d-4863-86d8-2e4d6346cc1f.jpg",
    position: "50% 20%",
  },
  {
    name: "Tops & Shirts",
    to: "/women/tops",
    image: "https://d1311wbk6unapo.cloudfront.net/NushopCatalogue/tr:f-webp,w-1200,fo-auto/6acf6ff6d488cd0ea435cb10/cat_img/4CAcrYeY_YMXCJ3X4QV_2026-10-14_2.jpg",
    position: "50% 10%",
  },
  {
    name: "Jeans",
    to: "/women/jeans",
    image: "https://api.stylenestfashion.com/uploads/products/88a808cd-3d28-49e9-a684-e8c93526adfc.jpg",
    position: "50% 74%", // Perfectly shows the white wide-leg jeans!
  },
  {
    name: "Palazzo & Skirts",
    to: "/women/palazzo",
    image: "https://api.stylenestfashion.com/uploads/products/f90e0d71-21f9-4d8f-92ed-accfcfea8072.jpg",
    position: "50% 72%", // Perfectly shows the flared boho skirt!
  },
  {
    name: "Men's Tees",
    to: "/men/t-shirts",
    image: "https://d1311wbk6unapo.cloudfront.net/NushopCatalogue/tr:f-webp,w-1200,fo-auto/6acf6ff6d488cd0ea435cb10/cat_img/uS8q3TcH_1H1L6VE3FY_2026-10-14_2.jpg",
    position: "50% 10%",
  },
  {
    name: "Men's Co-ords",
    to: "/men/cordset",
    image: "https://d1311wbk6unapo.cloudfront.net/NushopCatalogue/tr:f-webp,w-1200,fo-auto/6acf6ff6d488cd0ea435cb10/cat_img/9ZYSTgxv_37UYG1ZF6J_2026-10-14_2.jpg",
    position: "50% 12%",
  },
  {
    name: "Men's Lowers",
    to: "/men/lower",
    image: "https://d1311wbk6unapo.cloudfront.net/NushopCatalogue/tr:f-webp,w-1200,fo-auto/6acf6ff6d488cd0ea435cb10/cat_img/T77o7hEv_L6N04YKQUC_2026-10-14_2.jpg",
    position: "50% 68%", // Perfectly shows the piped track pants!
  },
  {
    name: "Nightwear",
    to: "/women/gown",
    image: "https://api.stylenestfashion.com/uploads/products/676d8628-6e36-434a-b8f0-afb370f2dbef.jpg",
    position: "50% 18%",
  },
  {
    name: "Explore More",
    to: "/products",
    isExplore: true,
  },
];

const HOME_CURATED_WOMEN_IDS = [
  270, // White Paisley Print Kurti (Kurti)
  290, // Off White Wave Print Co-ord Set (Co-ord Set)
  31,  // Medium Wash Wide-Leg Jeans with Bow Embroidery (Jeans)
  272, // Black Boho Medallion Print Flared Skirt (Palazzo / Skirt)
  56,  // Floral Appliqué Collared Shirt (Tops / Designer Shirt)
  100, // Paisley Chevron Suit Set (Suit Set)
  279, // Magenta Geometric Patchwork Sleeveless Dress (Sleeveless Dress)
  20,  // Navy Denim Shirt with White Crochet Trim (Denim Top)
];

const HOME_CURATED_MEN_IDS = [
  260, // Men's Piped Track Pants (Lower)
  259, // Men's Brown Graphic T-Shirt & Shorts Co-ord Set (Co-ord Shorts)
  226, // Men's Polo Graphic T-Shirt & Trackpants Co-Ord Set (Co-ord Trackpants)
  220, // Men's Chicago V Graphic Sweatshirt (Sweatshirt)
  206, // Men's 03 Lightning Mesh Jersey T-Shirt (Mesh Jersey)
  255, // Men's Acid Blue Washed Graphic Polo T-Shirt (Acid Polo)
  256, // Men's Ombre Dip-Dye Graphic T-Shirt (Ombre Crewneck Tee)
  237, // Men's White Colorblock Striped Polo T-Shirt (Striped Polo)
];

function selectCurated(products, curatedIds, count = 8) {
  if (!products || products.length === 0) return [];
  const map = new Map(products.map((p) => [p.id, p]));
  const picked = [];
  for (const id of curatedIds) {
    const item = map.get(id);
    if (item) picked.push(item);
  }
  if (picked.length < count) {
    const seenIds = new Set(picked.map((p) => p.id));
    for (const p of products) {
      if (!seenIds.has(p.id)) {
        picked.push(p);
        seenIds.add(p.id);
        if (picked.length === count) break;
      }
    }
  }
  return picked.slice(0, count);
}

export default function Home() {
  const { setGender } = useGender();

  // Neutral gender accent on main home page
  useEffect(() => setGender(null), [setGender]);

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoriesApi.getCategories(),
    staleTime: 5 * 60 * 1000,
  });

  const womenProductsQuery = useQuery({
    queryKey: ["home-products", "WOMEN"],
    queryFn: () => productsApi.filterProducts({ gender: "WOMEN", active: true, sizePerPage: 200 }),
    staleTime: 5 * 60 * 1000,
  });

  const menProductsQuery = useQuery({
    queryKey: ["home-products", "MEN"],
    queryFn: () => productsApi.filterProducts({ gender: "MEN", active: true, sizePerPage: 100 }),
    staleTime: 5 * 60 * 1000,
  });

  const womenFeatured = selectCurated(womenProductsQuery.data?.content ?? [], HOME_CURATED_WOMEN_IDS, 8);
  const menFeatured = selectCurated(menProductsQuery.data?.content ?? [], HOME_CURATED_MEN_IDS, 8);

  // Trending picks: mix 4 women + 4 men signature pieces
  const trendingPicks = [
    ...womenFeatured.slice(0, 4),
    ...menFeatured.slice(0, 4),
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* ===================== TOP CATEGORY CIRCULAR CHIPS (SD STYLE) ===================== */}
      <section className="border-b border-border/40 bg-card/70 backdrop-blur-sm py-4">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 md:px-8">
          {/* Centered on wider screens, smoothly scrollable on mobile with balanced padding */}
          <div className="flex items-center justify-start 2xl:justify-center gap-4 sm:gap-6 md:gap-7 overflow-x-auto px-1 pb-1 scrollbar-none">
            {CATEGORY_CHIPS.map((chip) => (
              <Link
                key={chip.name}
                to={chip.to}
                className="flex flex-col items-center gap-1.5 group shrink-0 focus:outline-none"
              >
                <div className={`relative h-16 w-16 sm:h-20 sm:w-20 rounded-full overflow-hidden border shadow-xs transition-all duration-300 ${
                  chip.isExplore
                    ? "border-accent bg-accent/10 group-hover:bg-accent/20 group-hover:scale-108"
                    : "border-border/80 group-hover:border-foreground/80 group-hover:scale-108 group-hover:shadow-md"
                }`}>
                  {chip.isExplore ? (
                    <div className="flex h-full w-full flex-col items-center justify-center bg-card text-accent">
                      <LayoutGrid className="h-6 w-6 sm:h-7 sm:w-7 transition-transform group-hover:rotate-12" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider mt-0.5">All</span>
                    </div>
                  ) : (
                    <img
                      src={chip.image}
                      alt={chip.name}
                      loading="lazy"
                      style={{ objectPosition: chip.position || "50% 20%" }}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  )}
                </div>
                <span className={`text-xs sm:text-[13px] font-medium text-center max-w-[76px] sm:max-w-[88px] truncate leading-tight transition-colors ${
                  chip.isExplore ? "text-accent font-semibold group-hover:text-foreground" : "text-foreground/85 group-hover:text-foreground"
                }`}>
                  {chip.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== COMPACT EDITORIAL SPOTLIGHT HERO ===================== */}
      <section className="relative overflow-hidden border-b border-border/40 bg-gradient-to-b from-secondary/60 via-background to-background py-10 md:py-16">
        <div className="mx-auto max-w-[1440px] px-5 md:px-10 text-center">
          <Reveal>
            <div className="flex flex-col items-center justify-center">
              {/* StyleNest Brand Logo */}
              <div className="mb-4 flex items-center justify-center">
                <img
                  src={stylenestLogo}
                  alt="StyleNest Fashion"
                  className="h-14 sm:h-16 w-auto object-contain rounded-2xl shadow-sm border border-border/60 bg-card p-1.5 transition-transform hover:scale-105"
                />
              </div>

              <span className="label-xs text-accent uppercase tracking-[0.25em] inline-flex items-center gap-1.5 justify-center">
                <Sparkles className="h-3 w-3" /> STYLE NEST FASHION
              </span>

              <h1 className="display mt-2 text-2xl sm:text-4xl md:text-5xl font-medium tracking-tight text-foreground px-2">
                Fashion For Every Lifestyle
              </h1>

              <p className="mx-auto mt-3 max-w-xl text-sm sm:text-base text-muted-foreground">
                From festive ethnic wear and trending Kurtis to relaxed casuals and daily essentials.
              </p>

              {/* Both Buttons with identical, pristine styling */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 px-2">
                <Link
                  to="/women"
                  className="btn-solid inline-flex items-center gap-1.5 px-5 py-2 sm:px-6 sm:py-2.5 text-xs sm:text-sm font-medium shadow-xs hover:shadow transition-all"
                >
                  Shop Women <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  to="/men"
                  className="btn-solid inline-flex items-center gap-1.5 px-5 py-2 sm:px-6 sm:py-2.5 text-xs sm:text-sm font-medium shadow-xs hover:shadow transition-all"
                >
                  Shop Men <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===================== SECTION 1: TRENDING PICKS (BEST SELLERS) ===================== */}
      <section className="py-12 md:py-16 border-b border-border/30" aria-label="Trending styles">
        <div className="mx-auto max-w-[1440px] px-5 md:px-10">
          <Reveal>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-8 border-b border-border/30 pb-4">
              <div>
                <p className="label-xs text-accent uppercase tracking-[0.2em]">POPULAR PICKS</p>
                <h2 className="display text-2xl font-medium tracking-tight md:text-3xl text-foreground mt-1">
                  Trending Styles
                </h2>
              </div>
              <Link
                to="/products"
                className="label-xs link-underline inline-flex items-center gap-1.5 text-foreground hover:text-accent"
              >
                View all styles <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </Reveal>
          <ProductGrid
            products={trendingPicks}
            loading={womenProductsQuery.isLoading || menProductsQuery.isLoading}
            skeletonCount={8}
          />
        </div>
      </section>

      {/* ===================== SECTION 2: CURATED FOR HER (WOMENSWEAR) ===================== */}
      <HomeCategoryDiscovery
        gender="WOMEN"
        title="SHOP WOMEN"
        subtitle="Flowing silhouettes, festive wear, and modern essentials."
        categories={categoriesQuery.data}
        isLoading={categoriesQuery.isLoading}
      />

      <section className="border-b border-border/30 pb-16 md:pb-20" aria-label="Featured womenswear">
        <div className="mx-auto max-w-[1440px] px-5 md:px-10">
          <Reveal>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-8 border-b border-border/30 pb-4">
              <div>
                <p className="label-xs text-accent uppercase tracking-[0.2em]">CURATED FOR HER</p>
                <h3 className="display text-2xl font-medium tracking-tight md:text-3xl text-foreground mt-1">
                  Featured in Womenswear
                </h3>
              </div>
              <Link
                to="/women"
                className="label-xs link-underline inline-flex items-center gap-1.5 text-foreground hover:text-accent"
              >
                View all Women's products <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </Reveal>
          <ProductGrid
            products={womenFeatured}
            loading={womenProductsQuery.isLoading}
            skeletonCount={8}
          />
        </div>
      </section>

      {/* ===================== SECTION 3: CURATED FOR HIM (MENSWEAR) ===================== */}
      <HomeCategoryDiscovery
        gender="MEN"
        title="SHOP MEN"
        subtitle="Essential tailoring, casual staples, and everyday layers."
        categories={categoriesQuery.data}
        isLoading={categoriesQuery.isLoading}
      />

      <section className="pb-16 md:pb-20 border-b border-border/30" aria-label="Featured menswear">
        <div className="mx-auto max-w-[1440px] px-5 md:px-10">
          <Reveal>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-8 border-b border-border/30 pb-4">
              <div>
                <p className="label-xs text-accent uppercase tracking-[0.2em]">CURATED FOR HIM</p>
                <h3 className="display text-2xl font-medium tracking-tight md:text-3xl text-foreground mt-1">
                  Featured in Menswear
                </h3>
              </div>
              <Link
                to="/men"
                className="label-xs link-underline inline-flex items-center gap-1.5 text-foreground hover:text-accent"
              >
                View all Men's products <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </Reveal>
          <ProductGrid
            products={menFeatured}
            loading={menProductsQuery.isLoading}
            skeletonCount={8}
          />
        </div>
      </section>

      {/* ===================== SECTION 4: TRUST & QUALITY MARKERS ===================== */}
      <section className="py-12 bg-secondary/30 border-t border-border/40">
        <div className="mx-auto max-w-[1440px] px-5 md:px-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center">
            <div className="p-4 rounded border border-border/40 bg-card/80 flex flex-col items-center shadow-2xs">
              <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center mb-2 text-foreground">
                <Truck className="h-5 w-5" />
              </div>
              <h4 className="text-xs sm:text-sm font-semibold text-foreground">Free Delivery</h4>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">On orders across India</p>
            </div>

            <div className="p-4 rounded border border-border/40 bg-card/80 flex flex-col items-center shadow-2xs">
              <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center mb-2 text-foreground">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h4 className="text-xs sm:text-sm font-semibold text-foreground">Cash on Delivery</h4>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">Pay safely at doorstep</p>
            </div>

            <div className="p-4 rounded border border-border/40 bg-card/80 flex flex-col items-center shadow-2xs">
              <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center mb-2 text-foreground">
                <RotateCcw className="h-5 w-5" />
              </div>
              <h4 className="text-xs sm:text-sm font-semibold text-foreground">7 Days Return</h4>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">Easy hassle-free exchange</p>
            </div>

            <div className="p-4 rounded border border-border/40 bg-card/80 flex flex-col items-center shadow-2xs">
              <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center mb-2 text-foreground">
                <MessageCircle className="h-5 w-5" />
              </div>
              <h4 className="text-xs sm:text-sm font-semibold text-foreground">WhatsApp Support</h4>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">Order on +91 6269933231</p>
            </div>
          </div>
        </div>
      </section>

      {/* Floating WhatsApp Quick Action Button */}
      <a
        href="https://wa.me/916269933231?text=Hi%20StyleNest,%20I%20need%20help%20with%20an%20order"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="fixed bottom-6 right-5 z-40 flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-white shadow-lg transition-transform hover:scale-105 active:scale-95 focus:outline-none"
      >
        <MessageCircle className="h-5 w-5 fill-current" />
        <span className="text-xs sm:text-sm font-semibold tracking-wide">WhatsApp Order</span>
      </a>
    </div>
  );
}
