import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Truck,
  ShieldCheck,
  RotateCcw,
  MessageCircle,
  X,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useGender } from "../context/GenderContext";
import * as productsApi from "../api/products";
import ProductGrid from "../components/ProductGrid";
import { Reveal } from "../components/Reveal";

/**
 * Curated Category Chips matching Shopdeck (SD) style.
 * Uses real, authentic product photography from the live StyleNest catalog
 * rather than stock or AI-generated illustration placeholders.
 */
const CURATED_CATEGORY_CHIPS = [
  {
    id: "all",
    name: "All Styles",
    gender: null,
    categoryId: null,
    image: "https://api.stylenestfashion.com/uploads/products/335f5806-fe57-4387-a85c-020313c668e8.jpg",
  },
  {
    id: "kurti",
    name: "Kurtis",
    gender: "WOMEN",
    categoryId: 6,
    image: "https://api.stylenestfashion.com/uploads/products/335f5806-fe57-4387-a85c-020313c668e8.jpg", // White Paisley Print Kurti
  },
  {
    id: "suit",
    name: "Suits",
    gender: "WOMEN",
    categoryId: 7,
    image: "https://api.stylenestfashion.com/uploads/products/aa9fe998-189a-48dc-8f97-d7d10f5652b7.jpg", // Paisley Chevron Suit Set
  },
  {
    id: "dresses",
    name: "Dresses",
    gender: "WOMEN",
    categoryId: 12,
    image: "https://api.stylenestfashion.com/uploads/products/1f5ac2d9-76b1-49b0-8176-fa16c8daa36e.jpg", // Black Ruffle Strap Tiered Maxi Dress
  },
  {
    id: "coord-women",
    name: "Co-ord Sets",
    gender: "WOMEN",
    categoryId: 8,
    image: "https://api.stylenestfashion.com/uploads/products/d3ac4dda-bf7d-4863-86d8-2e4d6346cc1f.jpg", // Off White Wave Print Co-ord Set
  },
  {
    id: "tops",
    name: "Tops & Shirts",
    gender: "WOMEN",
    categoryId: 5,
    image: "https://api.stylenestfashion.com/uploads/products/09d59a39-349c-45fa-a6f3-91c90f7d10c4.jpg", // Floral Appliqué Collared Shirt
  },
  {
    id: "jeans",
    name: "Jeans",
    gender: "WOMEN",
    categoryId: 9,
    image: "https://api.stylenestfashion.com/uploads/products/88a808cd-3d28-49e9-a684-e8c93526adfc.jpg", // White High-Waist Wide-Leg Jeans
  },
  {
    id: "palazzo",
    name: "Palazzo & Skirts",
    gender: "WOMEN",
    categoryId: 10,
    image: "https://api.stylenestfashion.com/uploads/products/f90e0d71-21f9-4d8f-92ed-accfcfea8072.jpg", // Black Boho Medallion Print Flared Skirt
  },
  {
    id: "men-tshirts",
    name: "Men's Tees",
    gender: "MEN",
    categoryId: 2,
    image: "https://api.stylenestfashion.com/uploads/products/b91c61aa-839c-4619-b802-0a2afb8d6bbf.jpg", // Men's Ombre Dip-Dye Graphic T-Shirt
  },
  {
    id: "men-coords",
    name: "Men's Co-ords",
    gender: "MEN",
    categoryId: 3,
    image: "https://api.stylenestfashion.com/uploads/products/776dd8f5-3b3e-403b-a8a4-97fe90fb3394.jpg", // Men's Brown Graphic Co-ord Set
  },
  {
    id: "men-lower",
    name: "Men's Lowers",
    gender: "MEN",
    categoryId: 4,
    image: "https://api.stylenestfashion.com/uploads/products/041939f1-fc14-4026-a73b-01df06c854ea.jpg", // Men's Piped Track Pants
  },
  {
    id: "nightwear",
    name: "Nightwear",
    gender: "WOMEN",
    categoryId: 11,
    image: "https://api.stylenestfashion.com/uploads/products/676d8628-6e36-434a-b8f0-afb370f2dbef.jpg", // Light Pink Floral Print Nighty
  },
];

export default function Home() {
  const { setGender } = useGender();
  const [selectedGender, setSelectedGender] = useState("ALL");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [pageSize, setPageSize] = useState(24);

  // Keep global gender in sync
  useEffect(() => {
    if (selectedGender === "WOMEN") setGender("women");
    else if (selectedGender === "MEN") setGender("men");
    else setGender(null);
  }, [selectedGender, setGender]);

  // Handle category chip tap
  const handleCategorySelect = (chip) => {
    if (chip.id === "all" || selectedCategory?.id === chip.id) {
      setSelectedCategory(null);
      return;
    }
    setSelectedCategory(chip);
    if (chip.gender) {
      setSelectedGender(chip.gender);
    }
  };

  // Build query params
  const queryParams = {
    active: true,
    sizePerPage: pageSize,
    page: 0,
    sort: "createdAt,desc",
  };
  if (selectedGender === "WOMEN") queryParams.gender = "WOMEN";
  if (selectedGender === "MEN") queryParams.gender = "MEN";
  if (selectedCategory?.categoryId) {
    queryParams.categoryId = selectedCategory.categoryId;
  }

  const productsQuery = useQuery({
    queryKey: ["home-catalog-feed", selectedGender, selectedCategory?.id, pageSize],
    queryFn: () => productsApi.filterProducts(queryParams),
    staleTime: 5 * 60 * 1000,
  });

  const products = productsQuery.data?.content ?? [];
  const totalElements = productsQuery.data?.totalElements ?? 0;
  const hasMore = products.length < totalElements;

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* ===================== CATEGORY CIRCULAR CHIPS (SD STYLE) ===================== */}
      <section className="border-b border-border/40 bg-card/60 backdrop-blur-sm py-4 md:py-6">
        <div className="mx-auto max-w-[1440px] px-4 md:px-8">
          <div className="flex items-center justify-between mb-3">
            <span className="label-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-accent" /> Explore Categories
            </span>
            {selectedCategory && (
              <button
                onClick={() => setSelectedCategory(null)}
                className="label-xs text-accent hover:underline flex items-center gap-1"
              >
                Clear filter <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Horizontally scrollable chips */}
          <div className="flex items-start gap-4 sm:gap-6 overflow-x-auto pb-2 scrollbar-none pt-1">
            {CURATED_CATEGORY_CHIPS.map((chip) => {
              const isSelected =
                chip.id === "all" ? selectedCategory === null : selectedCategory?.id === chip.id;

              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => handleCategorySelect(chip)}
                  className="flex flex-col items-center gap-2 group shrink-0 transition-transform active:scale-95 focus:outline-none"
                  aria-pressed={isSelected}
                >
                  <div
                    className={`relative h-16 w-16 sm:h-20 sm:w-20 rounded-full overflow-hidden transition-all duration-300 ${
                      isSelected
                        ? "ring-2 ring-foreground ring-offset-2 ring-offset-background shadow-md scale-105"
                        : "border border-border/70 hover:border-foreground/60 opacity-90 group-hover:opacity-100"
                    }`}
                  >
                    <img
                      src={chip.image}
                      alt={chip.name}
                      loading="lazy"
                      className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-110"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-foreground/10" aria-hidden="true" />
                    )}
                  </div>
                  <span
                    className={`text-xs sm:text-[13px] text-center max-w-[76px] sm:max-w-[88px] truncate leading-tight transition-colors ${
                      isSelected
                        ? "font-semibold text-foreground"
                        : "font-normal text-muted-foreground group-hover:text-foreground"
                    }`}
                  >
                    {chip.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===================== FILTER TABS & PRODUCT COUNT ===================== */}
      <section className="mx-auto max-w-[1440px] px-4 md:px-8 pt-6 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/30 pb-4">
          {/* Gender Filter Tabs */}
          <div className="inline-flex rounded-full bg-secondary/80 p-1 border border-border/50">
            {[
              { id: "ALL", label: "All Products" },
              { id: "WOMEN", label: "Women" },
              { id: "MEN", label: "Men" },
            ].map((tab) => {
              const active = selectedGender === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setSelectedGender(tab.id);
                    // Clear category if gender no longer matches
                    if (selectedCategory && selectedCategory.gender && selectedCategory.gender !== tab.id && tab.id !== "ALL") {
                      setSelectedCategory(null);
                    }
                  }}
                  className={`rounded-full px-4 py-1.5 text-xs sm:text-sm font-medium transition-all ${
                    active
                      ? "bg-foreground text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Active selection info */}
          <div className="text-xs text-muted-foreground">
            {productsQuery.isLoading ? (
              <span>Loading styles...</span>
            ) : (
              <span>
                {selectedCategory ? (
                  <strong className="text-foreground">{selectedCategory.name}: </strong>
                ) : null}
                Showing <strong className="text-foreground">{products.length}</strong> of {totalElements} styles
              </span>
            )}
          </div>
        </div>
      </section>

      {/* ===================== DIRECT 2-COLUMN PRODUCT GRID ===================== */}
      <section className="mx-auto max-w-[1440px] px-4 md:px-8 py-4" aria-label="StyleNest Catalog">
        <ProductGrid
          products={products}
          loading={productsQuery.isLoading}
          skeletonCount={pageSize}
        />

        {/* Load More Button */}
        {!productsQuery.isLoading && hasMore && (
          <div className="mt-12 text-center">
            <button
              onClick={() => setPageSize((prev) => prev + 24)}
              className="btn-solid inline-flex items-center gap-2 px-8 py-3 text-sm font-medium shadow-sm hover:shadow transition-all"
            >
              Load More Styles ({totalElements - products.length} remaining)
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </section>

      {/* ===================== TRUST & REASSURANCE MARKERS ===================== */}
      <section className="mx-auto max-w-[1440px] px-4 md:px-8 mt-16 pt-10 border-t border-border/40">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center">
          <div className="p-4 rounded border border-border/40 bg-card flex flex-col items-center">
            <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center mb-2">
              <Truck className="h-5 w-5 text-foreground" />
            </div>
            <h4 className="text-xs sm:text-sm font-semibold text-foreground">Free Delivery</h4>
            <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">On all orders across India</p>
          </div>

          <div className="p-4 rounded border border-border/40 bg-card flex flex-col items-center">
            <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center mb-2">
              <ShieldCheck className="h-5 w-5 text-foreground" />
            </div>
            <h4 className="text-xs sm:text-sm font-semibold text-foreground">Cash on Delivery</h4>
            <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">Pay safely at your doorstep</p>
          </div>

          <div className="p-4 rounded border border-border/40 bg-card flex flex-col items-center">
            <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center mb-2">
              <RotateCcw className="h-5 w-5 text-foreground" />
            </div>
            <h4 className="text-xs sm:text-sm font-semibold text-foreground">7 Days Return</h4>
            <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">Hassle-free easy exchanges</p>
          </div>

          <div className="p-4 rounded border border-border/40 bg-card flex flex-col items-center">
            <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center mb-2">
              <MessageCircle className="h-5 w-5 text-foreground" />
            </div>
            <h4 className="text-xs sm:text-sm font-semibold text-foreground">WhatsApp Support</h4>
            <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">Direct help: +91 6269933231</p>
          </div>
        </div>
      </section>

      {/* ===================== FLOATING WHATSAPP BUTTON FOR MOBILE/OLDER USERS ===================== */}
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
