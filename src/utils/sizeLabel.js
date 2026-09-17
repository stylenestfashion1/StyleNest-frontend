// Size enum values (the actual wire/filter value, matching the backend
// Size enum's name exactly) paired with their clean display label. Jeans
// waist sizes are stored as SIZE_28..SIZE_40 (a bare "28" isn't a legal
// Java enum identifier) but should always be DISPLAYED as "28".."40" --
// this is the single place that mapping lives, so admin and customer UI
// never drift out of sync.
export const APPAREL_SIZES = [
  { value: "XS", label: "XS" },
  { value: "S", label: "S" },
  { value: "M", label: "M" },
  { value: "L", label: "L" },
  { value: "XL", label: "XL" },
  { value: "XXL", label: "XXL" },
];

// Palazzo-only extras (see sizesForCategory) -- available in the system for
// any product (one shared backend enum), but only offered in the size
// selector for Palazzo. An admin picks which of these, if any, a given
// product actually needs; none of these are ever auto-created except
// FREE_SIZE, which the 2026-09 rollout added once to every existing
// Palazzo color group.
export const PALAZZO_EXTRA_SIZES = [
  { value: "SIZE_3XL", label: "3XL" },
  { value: "SIZE_4XL", label: "4XL" },
  { value: "SIZE_5XL", label: "5XL" },
  { value: "SIZE_6XL", label: "6XL" },
  { value: "SIZE_7XL", label: "7XL" },
  { value: "FREE_SIZE", label: "Free Size" },
];

export const PALAZZO_SIZES = [...APPAREL_SIZES, ...PALAZZO_EXTRA_SIZES];

export const JEANS_SIZES = [
  { value: "SIZE_28", label: "28" },
  { value: "SIZE_30", label: "30" },
  { value: "SIZE_32", label: "32" },
  { value: "SIZE_34", label: "34" },
  { value: "SIZE_36", label: "36" },
  { value: "SIZE_38", label: "38" },
  { value: "SIZE_40", label: "40" },
];

export const ALL_SIZES = [...APPAREL_SIZES, ...PALAZZO_EXTRA_SIZES, ...JEANS_SIZES];

const LABEL_BY_VALUE = Object.fromEntries(ALL_SIZES.map((s) => [s.value, s.label]));

export function getSizeLabel(value) {
  return LABEL_BY_VALUE[value] ?? value;
}

// Which size list a product's variant form/filter should offer, based on
// its category name. Jeans uses waist sizes; Palazzo gets the extended
// XS-7XL + Free Size range (flowy/elastic-waist pants suit a wider size
// spread); every other category keeps standard apparel sizing (XS-XXL) --
// only a structured jeans waistband needs an exact waist measurement, and
// only Palazzo asked for the extended range, so neither list leaks into
// unrelated categories.
export function sizesForCategory(categoryName) {
  if (categoryName === "Jeans") return JEANS_SIZES;
  if (categoryName === "Palazzo") return PALAZZO_SIZES;
  return APPAREL_SIZES;
}
