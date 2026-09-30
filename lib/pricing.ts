/**
 * Normalizes price strings (e.g., "₹4.5 Cr", "85 Lakhs", "₹1.2 - 1.5 Cr", "3.5cr") to numeric Lakhs
 * Pure isomorphic function safe for both client and server bundles.
 */
export function parsePriceToLakhs(priceStr?: string): number {
  if (!priceStr) return 0;
  const lower = priceStr.toLowerCase().replace(/,/g, '').trim();

  // Match Cr/Crore
  const crMatch = lower.match(/([\d.]+)\s*(?:cr|crore)/);
  if (crMatch) {
    return parseFloat(crMatch[1]) * 100;
  }

  // Match Lakh/Lac/L
  const lakhMatch = lower.match(/([\d.]+)\s*(?:lakh|lacs|lac|l\b)/);
  if (lakhMatch) {
    return parseFloat(lakhMatch[1]);
  }

  // Pure number check (if >= 100000 assume INR, else assume Lakhs)
  const numMatch = lower.match(/([\d.]+)/);
  if (numMatch) {
    const val = parseFloat(numMatch[1]);
    if (val >= 100000) return val / 100000;
    return val;
  }

  return 0;
}
