import type { Asset, AssetType } from "@prisma/client";
import { normalizeMarketEvent } from "@/lib/scanners/events";
import type {
  ScannerDirection,
  ScannerSeverity,
} from "@/lib/scanners/ranking";

const FMP_NEWS_LIMIT = 40;

export type NewsAsset = Pick<
  Asset,
  "id" | "symbol" | "name" | "assetType" | "sector" | "region"
>;

export type FmpNewsItem = {
  symbol?: string;
  publishedDate?: string;
  date?: string;
  title?: string;
  site?: string;
  publisher?: string;
  url?: string;
  text?: string;
  image?: string;
};

export type ProviderNewsEvent = ReturnType<typeof normalizeMarketEvent>;

export async function fetchFmpNewsEvents(
  assets: NewsAsset[],
): Promise<ProviderNewsEvent[]> {
  const apiKey = process.env.FMP_API_KEY;

  if (!apiKey) {
    return [];
  }

  const symbols = assets
    .filter((asset) => asset.assetType !== "CRYPTO")
    .map((asset) => asset.symbol.toUpperCase());

  if (symbols.length === 0) {
    return [];
  }

  const items = await fetchFmpNews(symbols, apiKey);
  const assetsBySymbol = new Map(
    assets.map((asset) => [asset.symbol.toUpperCase(), asset]),
  );

  return items.flatMap((item) => {
    const symbol = item.symbol?.toUpperCase();
    const asset = symbol ? assetsBySymbol.get(symbol) : null;
    const title = item.title?.trim();
    const occurredAt = parseNewsDate(item.publishedDate ?? item.date);

    if (!asset || !title || !occurredAt) {
      return [];
    }

    const classification = classifyNewsTitle(title);

    return normalizeMarketEvent({
      eventType: classification.eventType,
      occurredAt,
      sourceProvider: "fmp",
      sourceUrl: item.url ?? null,
      sourceTitle: title,
      affectedAssetId: asset.id,
      affectedEntity: asset.name,
      assetClass: toAssetClass(asset.assetType),
      sector: asset.sector,
      country: asset.region,
      direction: classification.direction,
      severity: classification.severity,
      confidence: classification.confidence,
      summary: item.text?.trim() || title,
      rawPayload: item,
    });
  });
}

async function fetchFmpNews(
  symbols: string[],
  apiKey: string,
): Promise<FmpNewsItem[]> {
  const params = new URLSearchParams({
    tickers: symbols.slice(0, 25).join(","),
    limit: String(FMP_NEWS_LIMIT),
    apikey: apiKey,
  });
  const legacyUrl = `https://financialmodelingprep.com/api/v3/stock_news?${params.toString()}`;

  const legacyResponse = await fetch(legacyUrl, {
    next: {
      revalidate: 5 * 60,
    },
  });

  if (legacyResponse.ok) {
    return parseFmpNewsResponse(await legacyResponse.json());
  }

  const stableParams = new URLSearchParams({
    symbols: symbols.slice(0, 25).join(","),
    limit: String(FMP_NEWS_LIMIT),
    apikey: apiKey,
  });
  const stableUrl = `https://financialmodelingprep.com/stable/news/stock?${stableParams.toString()}`;
  const stableResponse = await fetch(stableUrl, {
    next: {
      revalidate: 5 * 60,
    },
  });

  if (!stableResponse.ok) {
    return [];
  }

  return parseFmpNewsResponse(await stableResponse.json());
}

function parseFmpNewsResponse(value: unknown): FmpNewsItem[] {
  return Array.isArray(value) ? (value as FmpNewsItem[]) : [];
}

function classifyNewsTitle(title: string): {
  eventType: string;
  direction: ScannerDirection;
  severity: ScannerSeverity;
  confidence: number;
} {
  const normalized = title.toLowerCase();

  if (hasAny(normalized, ["beats", "beat estimates", "tops estimates"])) {
    return positive("earnings_beat", "HIGH", 0.72);
  }

  if (hasAny(normalized, ["misses", "miss estimates", "falls short"])) {
    return negative("earnings_miss", "HIGH", 0.72);
  }

  if (hasAny(normalized, ["raises guidance", "guidance raise", "raises outlook"])) {
    return positive("guidance_raise", "HIGH", 0.74);
  }

  if (hasAny(normalized, ["cuts guidance", "guidance cut", "lowers outlook"])) {
    return negative("guidance_cut", "HIGH", 0.74);
  }

  if (hasAny(normalized, ["upgrade", "upgraded", "raises rating"])) {
    return positive("analyst_upgrade", "MEDIUM", 0.68);
  }

  if (hasAny(normalized, ["downgrade", "downgraded", "cuts rating"])) {
    return negative("analyst_downgrade", "MEDIUM", 0.68);
  }

  if (hasAny(normalized, ["lawsuit", "sues", "sued"])) {
    return negative("lawsuit", "MEDIUM", 0.66);
  }

  if (hasAny(normalized, ["regulator", "sec probes", "investigation"])) {
    return negative("regulatory_risk", "HIGH", 0.66);
  }

  if (hasAny(normalized, ["buyback", "repurchase"])) {
    return positive("share_buyback", "MEDIUM", 0.66);
  }

  if (hasAny(normalized, ["dividend increase", "raises dividend"])) {
    return positive("dividend_increase", "MEDIUM", 0.67);
  }

  if (hasAny(normalized, ["dividend cut", "cuts dividend", "suspends dividend"])) {
    return negative("dividend_cut", "HIGH", 0.7);
  }

  if (hasAny(normalized, ["launches", "product launch", "unveils"])) {
    return positive("product_launch", "LOW", 0.58);
  }

  return {
    eventType: "unknown_material_event",
    direction: "UNKNOWN",
    severity: "LOW",
    confidence: 0.45,
  };
}

function positive(
  eventType: string,
  severity: ScannerSeverity,
  confidence: number,
) {
  return {
    eventType,
    direction: "POSITIVE" as const,
    severity,
    confidence,
  };
}

function negative(
  eventType: string,
  severity: ScannerSeverity,
  confidence: number,
) {
  return {
    eventType,
    direction: "NEGATIVE" as const,
    severity,
    confidence,
  };
}

function hasAny(value: string, needles: string[]): boolean {
  return needles.some((needle) => value.includes(needle));
}

function parseNewsDate(value: string | undefined): Date | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function toAssetClass(assetType: AssetType): string {
  return assetType.toLowerCase();
}
