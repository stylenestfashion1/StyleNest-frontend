// Size enum values (the actual wire/filter value, matching the backend
// Size enum's name exactly) paired with their clean display label. Jeans
// waist sizes are stored as SIZE_26..SIZE_40 (a bare "26" isn't a legal
// Java enum identifier) but should always be DISPLAYED as "26".."40" --
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

// Extended apparel sizes -- available in the system for any product (one
// shared backend enum), offered in the size selector for every category
// except Jeans (see sizesForCategory). An admin picks which of these, if
// any, a given product actually needs; none of these are ever
// auto-created except FREE_SIZE, which the 2026-09 rollout added once to
// every existing Palazzo color group -- that was a one-time Palazzo
// backfill, not a rule that FREE_SIZE is Palazzo-only going forward.
export const EXTENDED_SIZES = [
  { value: "SIZE_3XL", label: "3XL" },
  { value: "SIZE_4XL", label: "4XL" },
  { value: "SIZE_5XL", label: "5XL" },
  { value: "SIZE_6XL", label: "6XL" },
  { value: "SIZE_7XL", label: "7XL" },
  { value: "FREE_SIZE", label: "Free Size" },
];

// Full size range offered for every category except Jeans: standard
// apparel sizes plus the extended range above.
export const STANDARD_SIZES = [...APPAREL_SIZES, ...EXTENDED_SIZES];

export const JEANS_SIZES = [
  { value: "SIZE_26", label: "26" },
  { value: "SIZE_28", label: "28" },
  { value: "SIZE_30", label: "30" },
  { value: "SIZE_32", label: "32" },
  { value: "SIZE_34", label: "34" },
  { value: "SIZE_36", label: "36" },
  { value: "SIZE_38", label: "38" },
  { value: "SIZE_40", label: "40" },
];

export const ALL_SIZES = [...APPAREL_SIZES, ...EXTENDED_SIZES, ...JEANS_SIZES];

const LABEL_BY_VALUE = Object.fromEntries(ALL_SIZES.map((s) => [s.value, s.label]));

export function getSizeLabel(value) {
  return LABEL_BY_VALUE[value] ?? value;
}

// Which size list a product's variant form/filter should offer, based on
// its category name. Jeans uses numeric waist sizes -- a structured
// waistband needs an exact waist measurement, so it keeps its own list
// and is never mixed with alphabetical sizing. Every other category gets
// the full standard range (XS-7XL + Free Size): the client asked for the
// complete option list to be available admin-wide, not just for Palazzo,
// so an admin can select whatever size a given product/color actually
// needs -- nothing here auto-creates a variant, it only widens what's
// selectable.
export function sizesForCategory(categoryName) {
  if (categoryName === "Jeans") return JEANS_SIZES;
  return STANDARD_SIZES;
}
