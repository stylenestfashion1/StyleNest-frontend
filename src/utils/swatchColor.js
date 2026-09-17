// Color is free-form text (see ColorNormalizer on the backend) -- admins can type literally
// anything ("Baby Pink", "Dusty Brown", "Charcoal Grey"...), not a fixed enum. Swatches used to
// render `backgroundColor: color.toLowerCase()` directly, which (a) only worked for names that
// happen to also be valid CSS color keywords, and (b) renders harsh, saturated browser defaults
// (pure #0000FF blue) that rarely resemble the actual garment. This module is the ONE place that
// turns a color name into a swatch hex -- every component imports getSwatchColor from here
// rather than deriving its own, so there is exactly one mapping to keep correct and extend.
//
// Resolution order for a name with no explicit colorHex:
//   1. Exact match (after normalizing) against BASE_COLOR_HEX / COMPOUND_COLOR_HEX / aliases --
//      covers every color explicitly named anywhere in the admin's palette guidance.
//   2. Token-based derivation: split the name into words, find a recognized base hue among them
//      (preferring the last word, since English color names put the base noun last: "light
//      BLUE", "baby PINK", "dusty BROWN"), then apply any recognized modifier word (light/dark/
//      baby/dusty/bright/deep/pale) as an HSL lightness/saturation adjustment. This is what makes
//      the system handle names nobody hardcoded in advance, system-wide, not just a curated list.
//   3. Only if NO word in the name matches any known hue does this fall back to a fixed neutral
//      grey -- never randomized, and never applied to a name that actually names a real color
//      (see step 2), only to genuinely unrecognizable input.

const BASE_COLOR_HEX = {
  BLACK: "#1a1a1a",
  WHITE: "#f5f3ee",
  BLUE: "#4a6fa5",
  RED: "#a3453f",
  GREEN: "#5c7a5c",
  BEIGE: "#d8c4a0",
  GREY: "#8c8c8c",
  BROWN: "#6b4a35",
  PINK: "#cf9aa3",
  YELLOW: "#c9a83f",
  ORANGE: "#bd7a42",
  PURPLE: "#7a5c8a",
  NAVY: "#263349",
  MAROON: "#5c2a2a",
  OLIVE: "#6b6b3a",
  TAN: "#c9a877",
  CREAM: "#f0e6d2",
  GOLD: "#b8963f",
  SILVER: "#b0b0b0",
  LAVENDER: "#a89ac2",
  MUSTARD: "#c9a227",
  RUST: "#a45c3a",
  CHARCOAL: "#3a3a3a",
  KHAKI: "#a9976a",
  TAUPE: "#a68a72",
  PEACH: "#e8b89b",
  MINT: "#a8cbb7",
  TEAL: "#3f7d7d",
  CORAL: "#d98a72",
  PLUM: "#6b4060",
  INDIGO: "#3b3f6b",
  BURGUNDY: "#5c2a2a",
  WINE: "#5c2a2a",
  BRONZE: "#8a5a34",
  DENIM: "#4a6fa5",
};

// Compound names common enough to deserve their own curated tone rather than a derived one --
// e.g. "Baby Pink" is a genuinely lighter/more pastel look than plain PINK + a generic lighten.
const COMPOUND_COLOR_HEX = {
  "BABY PINK": "#f2c9d1",
  "DUSTY PINK": "#c99aa0",
  "DUSTY BROWN": "#8a6a54",
  "DUSTY ROSE": "#c48f92",
  "LIGHT BLUE": "#93b3d6",
  "DARK BLUE": "#2c4870",
  "NAVY BLUE": "#263349",
  "DARK NAVY": "#1c2636",
  "OLIVE GREEN": "#6b6b3a",
  "DARK GREEN": "#3d5240",
  "LIGHT GREEN": "#a3c2a8",
  "CHARCOAL GREY": "#4a4a4a",
  "CHARCOAL GRAY": "#4a4a4a",
  "LIGHT GREY": "#bdbdbd",
  "LIGHT GRAY": "#bdbdbd",
  "DARK GREY": "#555555",
  "DARK GRAY": "#555555",
  "OFF WHITE": "#f5f3ee",
  "LIGHT PINK": "#e3b8c0",
  "HOT PINK": "#c9587a",
  "LIGHT YELLOW": "#e0cf8f",
  "MUSTARD YELLOW": "#c9a227",
  "SKY BLUE": "#8fb8d9",
  "ROYAL BLUE": "#33538a",
  "DARK BROWN": "#4a3325",
  "LIGHT BROWN": "#8f6b4d",
};

// Alternate spellings that resolve to an existing entry rather than falling through -- e.g. a US
// "GRAY" spelling must swatch identically to "GREY".
const COLOR_ALIASES = {
  GRAY: "GREY",
  OFFWHITE: "WHITE",
  IVORY: "WHITE",
};

const MODIFIER_ADJUST = {
  LIGHT: { lighten: 22 },
  PALE: { lighten: 30, desaturate: 15 },
  BABY: { lighten: 26, desaturate: 10 },
  PASTEL: { lighten: 26, desaturate: 15 },
  BRIGHT: { lighten: 4, desaturate: -15 },
  DEEP: { lighten: -16 },
  DARK: { lighten: -16 },
  DUSKY: { lighten: -10, desaturate: 20 },
  DUSTY: { lighten: 6, desaturate: 28 },
  MUTED: { desaturate: 25 },
  DEEPEST: { lighten: -26 },
};

function normalizeToken(word) {
  return word?.trim().toUpperCase();
}

function hexToHsl(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  const d = max - min;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case r:
        h = ((g - b) / d) % 6;
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: s * 100, l: l * 100 };
}

function hslToHex(h, s, l) {
  const sN = Math.min(100, Math.max(0, s)) / 100;
  const lN = Math.min(100, Math.max(0, l)) / 100;
  const c = (1 - Math.abs(2 * lN - 1)) * sN;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lN - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const toHex = (v) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** Applies a named modifier (light/dark/baby/dusty/...) to a base hex via HSL adjustment. */
function applyModifier(baseHex, modifierKey) {
  const adjust = MODIFIER_ADJUST[modifierKey];
  if (!adjust) return baseHex;
  const { h, s, l } = hexToHsl(baseHex);
  const newL = l + (adjust.lighten ?? 0);
  const newS = s - (adjust.desaturate ?? 0);
  return hslToHex(h, newS, newL);
}

/**
 * Derives a swatch for a color name with no exact/compound/alias match by finding a recognized
 * base hue word among its tokens (preferring the last, since English color names put the base
 * noun last) and applying any recognized modifier word found alongside it. Returns null if no
 * word in the name is a recognized hue at all -- that's the only case the caller should fall
 * back to the flat neutral placeholder.
 */
function deriveFromTokens(upperName) {
  const tokens = upperName.split(/[\s-]+/).filter(Boolean);
  if (tokens.length < 2) return null;

  let baseHex = null;
  let baseIndex = -1;
  for (let i = tokens.length - 1; i >= 0; i--) {
    if (BASE_COLOR_HEX[tokens[i]]) {
      baseHex = BASE_COLOR_HEX[tokens[i]];
      baseIndex = i;
      break;
    }
  }
  if (!baseHex) return null;

  let result = baseHex;
  tokens.forEach((token, i) => {
    if (i !== baseIndex && MODIFIER_ADJUST[token]) {
      result = applyModifier(result, token);
    }
  });
  return result;
}

// Deliberately a single flat neutral, never randomized -- a name with no recognizable color word
// at all (e.g. a typo, or a brand-new made-up name) must render a consistent, predictable
// placeholder swatch rather than a different color every time the page loads. This is NEVER
// reached for a name that contains any real color word -- see deriveFromTokens above.
const FALLBACK_HEX = "#999999";

function resolveSwatchHex(color) {
  const trimmed = color?.trim().toUpperCase();
  if (!trimmed) return FALLBACK_HEX;

  const aliased = COLOR_ALIASES[trimmed] ?? trimmed;

  if (BASE_COLOR_HEX[aliased]) return BASE_COLOR_HEX[aliased];
  if (COMPOUND_COLOR_HEX[aliased]) return COMPOUND_COLOR_HEX[aliased];

  return deriveFromTokens(aliased) ?? FALLBACK_HEX;
}

/** variant.colorHex (an exact, admin-set shade) wins when present; otherwise resolves the color name to a swatch (see module doc above). */
export function getSwatchColor(color, colorHex) {
  if (colorHex) return colorHex;
  return resolveSwatchHex(color);
}
