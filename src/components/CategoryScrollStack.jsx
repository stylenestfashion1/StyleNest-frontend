import { useNavigate } from "react-router-dom";
import ScrollStack, { ScrollStackItem } from "./ScrollStack";
import { categoryImageFallback } from "../utils/categoryImage";

// The exact, curated storefront category lists — matched against real
// backend category names (not hardcoded category data). Order here is the
// display order.
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

// Squarish/portrait premium card shape (4:5, matching the admin upload
// guidance exactly) — overrides ScrollStack's default wide h-80 rectangle
// via !important utilities so the shared component itself stays untouched.
const CARD_ITEM_CLASS =
  "!h-auto !p-0 !rounded-[28px] !shadow-[0_20px_50px_rgba(0,0,0,0.18)] aspect-[4/5] w-full max-w-[380px] mx-auto overflow-hidden border border-white/5";

export default function CategoryScrollStack({ categories, gender }) {
  const navigate = useNavigate();
  const selected = selectStorefrontCategories(categories, gender);

  if (selected.length === 0) return null;

  return (
    <section className="bg-[#161512] py-16 md:py-24">
      <ScrollStack
        useWindowScroll
        itemDistance={90}
        itemScale={0.035}
        itemStackDistance={28}
        baseScale={0.86}
        stackPosition="18%"
        scaleEndPosition="10%"
      >
        <ScrollStackItem
          itemClassName={`${CARD_ITEM_CLASS} flex flex-col items-center justify-center gap-3 bg-[#201f1c] border-white/10`}
        >
          <p className="display text-3xl italic text-white md:text-4xl">Explore Categories</p>
          <p className="label-xs text-white/50">(Scroll down)</p>
        </ScrollStackItem>

        {selected.map((cat) => {
          const image = cat.imageUrl || categoryImageFallback(cat.name, gender);
          return (
            <ScrollStackItem key={cat.id} itemClassName={CARD_ITEM_CLASS}>
              <button
                type="button"
                onClick={() => navigate(categoryPath(cat, gender))}
                aria-label={cat.name}
                className="group relative block h-full w-full cursor-pointer"
              >
                <img src={image} alt="" draggable={false} className="h-full w-full object-cover" loading="lazy" />
                {/* Name sits in the vertical center rather than the bottom
                    edge -- ScrollStack's cascading cards slide up from
                    below and cover the bottom of the card beneath them
                    first, so a bottom-anchored caption was the first thing
                    to disappear under the next card while scrolling.
                    Centering it gives far more clearance before any
                    overlap reaches it. The radial scrim (darkest right
                    behind the text, fading out toward the edges) keeps it
                    legible against any photo without flattening the whole
                    image the way a uniform dark wash would. */}
                <span
                  className="pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center"
                  style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.28) 45%, transparent 72%)" }}
                >
                  <span
                    className="text-base font-medium uppercase tracking-[0.2em] text-white sm:text-lg"
                    style={{ textShadow: "0 2px 12px rgba(0,0,0,0.55)" }}
                  >
                    {cat.name}
                  </span>
                </span>
              </button>
            </ScrollStackItem>
          );
        })}
      </ScrollStack>
    </section>
  );
}
