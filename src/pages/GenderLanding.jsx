import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { PageFade, Reveal } from "../components/Reveal";
import { CategoryHeroTile, CategoryTile } from "../components/CategoryTile";
import ProductCard, { ProductCardSkeleton } from "../components/ProductCard";
import * as categoriesApi from "../api/categories";
import * as productsApi from "../api/products";
import { useGender } from "../context/GenderContext";

const COPY = {
  MEN: {
    label: "Menswear",
    heading: "Tailoring for the long run",
    sub: "Limited runs, natural fibres and a palette that stays. Choose a house to begin.",
    note: "A jacket should outlive the season that sold it.",
  },
  WOMEN: {
    label: "Womenswear",
    heading: "Ease, cut with intention",
    sub: "Limited runs, natural fibres and a palette that stays. Choose a house to begin.",
    note: "Colour, drawn from clay, sand and sage.",
  },
};

export default function GenderLanding({ gender }) {
  const { setGender } = useGender();
  const copy = COPY[gender];

  useEffect(() => setGender(gender.toLowerCase()), [gender, setGender]);

  const categoriesQuery = useQuery({
    queryKey: ["categories", gender],
    queryFn: () => categoriesApi.getCategories({ gender }),
  });

  const productsQuery = useQuery({
    queryKey: ["products", gender, "curated"],
    queryFn: () => productsApi.filterProducts({ gender, sizePerPage: 8, active: true, sortBy: "createdAt", direction: "desc" }),
  });

  const categories = categoriesQuery.data ?? [];
  const hero = categories[0];
  const rest = categories.slice(1, 4);
  const curated = productsQuery.data?.content ?? [];

  return (
    <PageFade>
      <div className="mx-auto max-w-[1440px] px-5 py-14 md:px-10">
        <Reveal>
          <p className="label-xs text-accent">{copy.label}</p>
          <h1 className="mt-4 max-w-3xl text-[clamp(2.2rem,4.6vw,3.6rem)] leading-[1.06]">{copy.heading}</h1>
          <p className="mt-4 max-w-xl text-sm text-muted-foreground">{copy.sub}</p>
        </Reveal>

        {categoriesQuery.isLoading ? (
          <div className="mt-12 grid gap-4 md:grid-cols-3 md:grid-rows-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={`skeleton min-h-[200px] ${i === 0 ? "md:col-span-2 md:row-span-2 md:min-h-[380px]" : ""}`} />
            ))}
          </div>
        ) : hero ? (
          <div className="mt-12 grid gap-4 md:grid-cols-3 md:grid-rows-2">
            <Reveal className="md:col-span-2 md:row-span-2">
              <CategoryHeroTile category={hero} gender={gender} blurb={hero.description || copy.label} />
            </Reveal>
            {/* Delay capped low (was up to 340ms) -- see ProductGrid.jsx
                for why a long stagger widens the window for a late
                IntersectionObserver callback to read as shake/jitter. */}
            {rest.map((cat, i) => (
              <Reveal key={cat.id} delay={60 + i * 50}>
                <CategoryTile category={cat} gender={gender} />
              </Reveal>
            ))}
          </div>
        ) : (
          <p className="mt-12 text-sm text-muted-foreground">Categories coming soon.</p>
        )}

        <Reveal className="mt-20">
          <div className="bg-accent-soft px-6 py-14 text-center md:px-16">
            <p className="label-xs text-accent">The House Note</p>
            <h2 className="mx-auto mt-4 max-w-2xl text-[clamp(1.6rem,3vw,2.4rem)] leading-tight">{copy.note}</h2>
            <Link to="/editorial" className="btn-outline mt-8">
              Read the editorial
            </Link>
          </div>
        </Reveal>

        <div className="mt-20">
          <Reveal className="flex items-end justify-between">
            <h2 className="text-2xl md:text-3xl">Curated For You</h2>
            <Link to={`/products?gender=${gender}`} className="label-xs link-underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </Reveal>
          <div className="mt-8 flex snap-x gap-4 overflow-x-auto pb-4">
            {productsQuery.isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="min-w-[240px] max-w-[240px] md:min-w-[280px]">
                    <ProductCardSkeleton />
                  </div>
                ))
              : curated.map((p, i) => (
                  <Reveal key={p.id} delay={i * 80} className="min-w-[240px] max-w-[240px] snap-start md:min-w-[280px]">
                    <ProductCard product={p} />
                  </Reveal>
                ))}
          </div>
        </div>
      </div>
    </PageFade>
  );
}
