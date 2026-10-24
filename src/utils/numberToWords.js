const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen"
];

const TENS = [
  "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
];

function convertIndian(num) {
  if (num === 0) return "";
  if (num < 20) return ONES[num];
  if (num < 100) return (TENS[Math.floor(num / 10)] + " " + ONES[num % 10]).trim();
  if (num < 1000) return (ONES[Math.floor(num / 100)] + " Hundred " + convertIndian(num % 100)).trim();
  if (num < 100000) return (convertIndian(Math.floor(num / 1000)) + " Thousand " + convertIndian(num % 1000)).trim();
  if (num < 10000000) return (convertIndian(Math.floor(num / 100000)) + " Lakh " + convertIndian(num % 100000)).trim();
  return (convertIndian(Math.floor(num / 10000000)) + " Crore " + convertIndian(num % 10000000)).trim();
}

function convertInternational(num) {
  if (num === 0) return "";
  if (num < 20) return ONES[num];
  if (num < 100) return (TENS[Math.floor(num / 10)] + " " + ONES[num % 10]).trim();
  if (num < 1000) return (ONES[Math.floor(num / 100)] + " Hundred " + convertInternational(num % 100)).trim();
  if (num < 1000000) return (convertInternational(Math.floor(num / 1000)) + " Thousand " + convertInternational(num % 1000)).trim();
  if (num < 1000000000) return (convertInternational(Math.floor(num / 1000000)) + " Million " + convertInternational(num % 1000000)).trim();
  return (convertInternational(Math.floor(num / 1000000000)) + " Billion " + convertInternational(num % 1000000000)).trim();
}

export function amountToWords(amount, currency = "INR") {
  const num = Math.abs(Number(amount) || 0);
  const curUpper = String(currency || "INR").toUpperCase();
  const isUsd = curUpper === "USD" || curUpper === "$" || curUpper.includes("DOLLAR");

  if (num === 0) return `Zero ${isUsd ? "US Dollars" : "Rupees"} Only`;

  const whole = Math.floor(num);
  const decimal = Math.round((num - whole) * 100);

  if (isUsd) {
    const dollarsWord = whole === 0 ? "Zero US Dollars" : `${convertInternational(whole)} US Dollar${whole === 1 ? "" : "s"}`;
    const centsWord = decimal > 0 ? ` and ${convertInternational(decimal)} Cent${decimal === 1 ? "" : "s"}` : "";
    return `${dollarsWord}${centsWord} Only`;
  } else {
    const rupeesWord = whole === 0 ? "Zero Rupees" : `${convertIndian(whole)} Rupees`;
    const paiseWord = decimal > 0 ? ` and ${convertIndian(decimal)} Paise` : "";
    return `${rupeesWord}${paiseWord} Only`;
  }
}
