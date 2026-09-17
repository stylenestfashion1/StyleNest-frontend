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
                onClick={() => navigate(`/products?gender=${gender}&categoryId=${cat.id}`)}
                aria-label={cat.name}
                className="group relative block h-full w-full cursor-pointer"
              >
                <img src={image} alt="" draggable={false} className="h-full w-full object-cover" loading="lazy" />
                <span
                  className="absolute inset-0 flex items-end justify-center pb-6 text-center"
                  style={{ background: "linear-gradient(to top, rgba(0,0,0,0.65), transparent 55%)" }}
                >
                  <span className="px-2 text-sm font-medium uppercase tracking-[0.16em] text-white sm:text-base">
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
