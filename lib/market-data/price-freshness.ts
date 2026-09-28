export const PRICE_STALE_AFTER_HOURS = 24;

export type PriceFreshness = "missing" | "fresh" | "stale";

export type LatestPriceLike = {
  observedAt: Date;
} | null;

export function getPriceFreshness(
  latestPrice: LatestPriceLike,
  now = new Date(),
): PriceFreshness {
  if (!latestPrice) {
    return "missing";
  }

  const staleAfterMs = PRICE_STALE_AFTER_HOURS * 60 * 60 * 1000;
  const ageMs = now.getTime() - latestPrice.observedAt.getTime();

  return ageMs > staleAfterMs ? "stale" : "fresh";
}
