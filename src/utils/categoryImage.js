import catShirts from "../assets/cat-shirts.jpg";
import catJeans from "../assets/cat-jeans.jpg";
import catJackets from "../assets/cat-jackets.jpg";
import catShoes from "../assets/cat-shoes.jpg";
import catDresses from "../assets/cat-dresses.jpg";
import catTops from "../assets/cat-tops.jpg";
import catKurtis from "../assets/cat-kurtis.jpg";
import catSarees from "../assets/cat-sarees.jpg";

const KEYWORDS = [
  { test: /shirt/i, image: catShirts },
  { test: /jean|denim/i, image: catJeans },
  { test: /jacket|coat|outerwear/i, image: catJackets },
  { test: /shoe|footwear|boot/i, image: catShoes },
  { test: /dress|gown/i, image: catDresses },
  { test: /top|blouse|shirt/i, image: catTops },
  { test: /kurti/i, image: catKurtis },
  { test: /saree/i, image: catSarees },
  { test: /lower|trouser|\bpant/i, image: catJeans },
  { test: /\bsuit\b/i, image: catSarees },
  { test: /plazzo|palazzo/i, image: catJackets },
];

/**
 * Backend categories may not have an imageUrl set yet. Fall back to a
 * representative placeholder keyed off the category name so the storefront
 * still reads as a finished catalog rather than empty grey boxes.
 */
export function categoryImageFallback(name, gender) {
  // Cordset reads differently per gender (men's co-ord vs. women's), so it's
  // checked ahead of the shared keyword list rather than folded into it.
  if (/cordset|co-?ord/i.test(name ?? "")) {
    return gender === "WOMEN" ? catDresses : catTops;
  }
  const match = KEYWORDS.find((k) => k.test.test(name ?? ""));
  if (match) return match.image;
  return gender === "WOMEN" ? catDresses : catShirts;
}
