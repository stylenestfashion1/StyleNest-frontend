import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { categoryImageFallback } from "../utils/categoryImage";
import { Reveal } from "./Reveal";

// Prioritized list of common shopping category names per gender.
// Matches against real active categories fetched from backend.
const CURATED_MEN_CATEGORIES = ["Shirts", "T-shirts", "Jeans", "Cordset", "Lower"];
const CURATED_WOMEN_CATEGORIES = ["Kurti", "Suit", "Tops", "Dresses", "Sarees", "Cordset", "Jeans", "Palazzo"];

function normalizeName(name) {
  return (name ?? "").toLowerCase().replace(/[^a-z]/g, "").replace(/s$/, "");
}

/**
 * Strips gender prefix from backend category slug (e.g. "women-kurti" -> "kurti")
 * to form the canonical public route: /women/kurti or /men/t-shirts.
 */
export function getCategoryCanonicalPath(category, gender) {
  if (!category?.slug) return `/${gender.toLowerCase()}`;
  const prefix = `${gender.toLowerCase()}-`;
  const bareSlug = category.slug.startsWith(prefix)
    ? category.slug.slice(prefix.length)
    : category.slug;
  return `/${gender.toLowerCase()}/${bareSlug}`;
}

/**
 * Selects up to 3 active, popular categories for the specified gender.
 */
export function selectTopThreeCategories(allCategories, gender) {
  const targetGender = gender.toUpperCase();
  const activeGenderCats = (allCategories ?? []).filter(
    (c) => c.gender === targetGender && c.active !== false
  );

  const desiredList = targetGender === "WOMEN" ? CURATED_WOMEN_CATEGORIES : CURATED_MEN_CATEGORIES;
  const byNormalized = new Map();
  for (const cat of activeGenderCats) {
    byNormalized.set(normalizeName(cat.name), cat);
  }

  const selected = [];
  const addedIds = new Set();

  // 1. First pick matches from the curated priority list
  for (const desired of desiredList) {
    const match = byNormalized.get(normalizeName(desired));
    if (match && !addedIds.has(match.id)) {
      selected.push(match);
      addedIds.add(match.id);
      if (selected.length === 3) break;
    }
  }

  // 2. If fewer than 3 matched, backfill with any remaining active categories for this gender
  if (selected.length < 3) {
    for (const cat of activeGenderCats) {
      if (!addedIds.has(cat.id)) {
        selected.push(cat);
        addedIds.add(cat.id);
        if (selected.length === 3) break;
      }
    }
  }

  return selected;
}

export default function HomeCategoryDiscovery({
  gender,
  title,
  subtitle = "Discover the signature silhouettes.",
  categories = [],
  isLoading = false,
}) {
  const selectedCategories = selectTopThreeCategories(categories, gender);

  if (!isLoading && selectedCategories.length === 0) {
    return null;
  }

  const genderPath = gender.toLowerCase() === "men" ? "/men" : "/women";

  return (
    <section className="border-t border-border/50 py-16 md:py-24" aria-labelledby={`category-discovery-${gender.toLowerCase()}`}>
      <div className="mx-auto max-w-[1440px] px-5 md:px-10">
        {/* Section Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="label-xs text-accent uppercase tracking-[0.2em]">
              {gender.toUpperCase()} COLLECTION
            </p>
            <h2
              id={`category-discovery-${gender.toLowerCase()}`}
              className="display mt-2 text-3xl font-medium tracking-tight md:text-4xl text-foreground"
            >
              {title}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          </div>
          <Link
            to={genderPath}
            className="label-xs link-underline inline-flex w-fit items-center gap-1.5 text-foreground hover:text-accent"
          >
            Explore all {gender.toLowerCase()} <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* 3-Category Responsive Grid */}
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 md:gap-8">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="skeleton aspect-[4/5] min-h-[340px] w-full"
                  aria-hidden="true"
                />
              ))
            : selectedCategories.map((cat, idx) => {
                const imgUrl = cat.imageUrl || categoryImageFallback(cat.name, gender.toUpperCase());
                const targetUrl = getCategoryCanonicalPath(cat, gender);

                return (
                  <Reveal key={cat.id} delay={idx * 70}>
                    <Link
                      to={targetUrl}
                      aria-label={`Shop ${cat.name} for ${gender}`}
                      className="group hairline-card relative block aspect-[4/5] min-h-[340px] w-full overflow-hidden bg-secondary transition-all duration-500 hover:border-accent/50 hover:shadow-xl"
                    >
                      {/* Category Photograph */}
                      <img
                        src={imgUrl}
                        alt={`${cat.name} collection`}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />

                      {/* Editorial Scrim Overlay */}
                      <div
                        className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent transition-opacity duration-300 group-hover:from-black/85"
                        aria-hidden="true"
                      />

                      {/* Card Content Pin */}
                      <div className="absolute inset-x-0 bottom-0 p-6 text-white md:p-8">
                        <span className="label-xs block text-white/70 uppercase tracking-[0.16em]">
                          {cat.description || `${gender} Essentials`}
                        </span>
                        <h3 className="display mt-1 text-2xl font-medium tracking-tight text-white md:text-3xl">
                          {cat.name}
                        </h3>
                        <span className="label-xs mt-4 inline-flex items-center gap-2 font-medium tracking-[0.18em] text-white/90 group-hover:text-white transition-colors">
                          SHOP NOW{" "}
                          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1.5" />
                        </span>
                      </div>
                    </Link>
                  </Reveal>
                );
              })}
        </div>
      </div>
    </section>
  );
}
