export const marketEventTypes = [
  "earnings_beat",
  "earnings_miss",
  "guidance_raise",
  "guidance_cut",
  "analyst_upgrade",
  "analyst_downgrade",
  "management_change",
  "product_launch",
  "product_delay",
  "regulatory_risk",
  "lawsuit",
  "share_buyback",
  "share_dilution",
  "dividend_increase",
  "dividend_cut",
  "ETF_inflow",
  "ETF_outflow",
  "whale_buy",
  "whale_sell",
  "exchange_hack",
  "rate_cut",
  "rate_hike",
  "major_macro_surprise",
  "geopolitical_escalation",
  "geopolitical_deescalation",
  "unknown_material_event",
] as const;

export type MarketEventType = (typeof marketEventTypes)[number];

const eventTypeSet = new Set<string>(marketEventTypes);

export function isMarketEventType(value: string): value is MarketEventType {
  return eventTypeSet.has(value);
}

export function normalizeEventType(value: string): MarketEventType {
  const normalized = value.trim();

  return isMarketEventType(normalized)
    ? normalized
    : "unknown_material_event";
}
