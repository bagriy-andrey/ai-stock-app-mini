import type { Asset, AssetType } from "@prisma/client";
import { normalizeMarketEvent } from "@/lib/scanners/events";
import type {
  ScannerDirection,
  ScannerSeverity,
} from "@/lib/scanners/ranking";

const FMP_NEWS_LIMIT = 40;
const TIINGO_NEWS_LIMIT = 50;

export type NewsAsset = Pick<
  Asset,
  | "id"
  | "symbol"
  | "name"
  | "assetType"
  | "sector"
  | "region"
  | "providerSymbol"
>;

export type ProviderNewsEvent = ReturnType<typeof normalizeMarketEvent>;

export type NewsProviderName = "tiingo" | "fmp";

export type NewsProviderDiagnostics = {
  provider: NewsProviderName;
  configured: boolean;
  requestedSymbols: string[];
  endpointAttempts: Array<{
    endpoint: string;
    ok: boolean;
    status: number | null;
    rawItemCount: number;
  }>;
  rawItemCount: number;
  normalizedEventCount: number;
  droppedItemCount: number;
};

export type NewsProviderResult = {
  events: ProviderNewsEvent[];
  diagnostics: NewsProviderDiagnostics[];
  selectedProvider: NewsProviderName | null;
};

export type TiingoNewsItem = {
  id?: number;
  title?: string;
  url?: string;
  source?: string;
  publishedDate?: string;
  crawlDate?: string;
  description?: string;
  tickers?: string[];
  tags?: string[];
};

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

export async function fetchProviderNewsEvents(
  assets: NewsAsset[],
): Promise<NewsProviderResult> {
  const diagnostics: NewsProviderDiagnostics[] = [];
  const tiingoResult = await fetchTiingoNewsEvents(assets);
  diagnostics.push(tiingoResult.diagnostics);

  if (tiingoResult.events.length > 0) {
    return {
      events: tiingoResult.events,
      diagnostics,
      selectedProvider: "tiingo",
    };
  }

  const fmpResult = await fetchFmpNewsEventsWithDiagnostics(assets);
  diagnostics.push(fmpResult.diagnostics);

  return {
    events: fmpResult.events,
    diagnostics,
    selectedProvider: fmpResult.events.length > 0 ? "fmp" : null,
  };
}

export async function fetchFmpNewsEvents(
  assets: NewsAsset[],
): Promise<ProviderNewsEvent[]> {
  return (await fetchFmpNewsEventsWithDiagnostics(assets)).events;
}

export async function fetchTiingoNewsEvents(
  assets: NewsAsset[],
): Promise<{
  events: ProviderNewsEvent[];
  diagnostics: NewsProviderDiagnostics;
}> {
  const token = process.env.TIINGO_API_KEY;
  const symbols = getStockSymbols(assets);

  if (!token || symbols.length === 0) {
    return {
      events: [],
      diagnostics: emptyDiagnostics("tiingo", symbols, Boolean(token)),
    };
  }

  const { items, endpointAttempt } = await fetchTiingoNews(symbols, token);
  const assetsBySymbol = buildAssetsBySymbol(assets);
  const events = items.flatMap((item) => {
    const title = item.title?.trim();
    const occurredAt = parseNewsDate(item.publishedDate ?? item.crawlDate);
    const matchedAsset = findFirstMatchedAsset(item.tickers ?? [], assetsBySymbol);

    if (!matchedAsset || !title || !occurredAt) {
      return [];
    }

    const classification = classifyNewsTitle(title);

    return normalizeMarketEvent({
      eventType: classification.eventType,
      occurredAt,
      sourceProvider: "tiingo",
      sourceUrl: item.url ?? null,
      sourceTitle: title,
      affectedAssetId: matchedAsset.id,
      affectedEntity: matchedAsset.name,
      assetClass: toAssetClass(matchedAsset.assetType),
      sector: matchedAsset.sector,
      country: matchedAsset.region,
      direction: classification.direction,
      severity: classification.severity,
      confidence: classification.confidence,
      summary: item.description?.trim() || title,
      rawPayload: item,
    });
  });

  return {
    events,
    diagnostics: {
      provider: "tiingo",
      configured: true,
      requestedSymbols: symbols,
      endpointAttempts: [endpointAttempt],
      rawItemCount: items.length,
      normalizedEventCount: events.length,
      droppedItemCount: Math.max(0, items.length - events.length),
    },
  };
}

export async function fetchFmpNewsEventsWithDiagnostics(
  assets: NewsAsset[],
): Promise<{
  events: ProviderNewsEvent[];
  diagnostics: NewsProviderDiagnostics;
}> {
  const apiKey = process.env.FMP_API_KEY;
  const symbols = getStockSymbols(assets);

  if (!apiKey || symbols.length === 0) {
    return {
      events: [],
      diagnostics: emptyDiagnostics("fmp", symbols, Boolean(apiKey)),
    };
  }

  const { items, endpointAttempts } = await fetchFmpNews(symbols, apiKey);
  const assetsBySymbol = buildAssetsBySymbol(assets);
  const events = items.flatMap((item) => {
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

  return {
    events,
    diagnostics: {
      provider: "fmp",
      configured: true,
      requestedSymbols: symbols,
      endpointAttempts,
      rawItemCount: items.length,
      normalizedEventCount: events.length,
      droppedItemCount: Math.max(0, items.length - events.length),
    },
  };
}

async function fetchTiingoNews(
  symbols: string[],
  token: string,
): Promise<{
  items: TiingoNewsItem[];
  endpointAttempt: NewsProviderDiagnostics["endpointAttempts"][number];
}> {
  const params = new URLSearchParams({
    tickers: symbols.slice(0, 50).join(",").toLowerCase(),
    limit: String(TIINGO_NEWS_LIMIT),
    sortBy: "publishedDate",
    onlyWithTickers: "true",
    token,
  });
  const response = await fetch(
    `https://api.tiingo.com/tiingo/news?${params.toString()}`,
    {
      next: {
        revalidate: 5 * 60,
      },
    },
  );
  const items = response.ok
    ? parseArrayResponse<TiingoNewsItem>(await response.json())
    : [];

  return {
    items,
    endpointAttempt: {
      endpoint: "tiingo/news",
      ok: response.ok,
      status: response.status,
      rawItemCount: items.length,
    },
  };
}

async function fetchFmpNews(
  symbols: string[],
  apiKey: string,
): Promise<{
  items: FmpNewsItem[];
  endpointAttempts: NewsProviderDiagnostics["endpointAttempts"];
}> {
  const endpointAttempts: NewsProviderDiagnostics["endpointAttempts"] = [];
  const params = new URLSearchParams({
    tickers: symbols.slice(0, 25).join(","),
    limit: String(FMP_NEWS_LIMIT),
    apikey: apiKey,
  });
  const legacyResponse = await fetch(
    `https://financialmodelingprep.com/api/v3/stock_news?${params.toString()}`,
    {
      next: {
        revalidate: 5 * 60,
      },
    },
  );
  const legacyItems = legacyResponse.ok
    ? parseArrayResponse<FmpNewsItem>(await legacyResponse.json())
    : [];
  endpointAttempts.push({
    endpoint: "api/v3/stock_news",
    ok: legacyResponse.ok,
    status: legacyResponse.status,
    rawItemCount: legacyItems.length,
  });

  const stableParams = new URLSearchParams({
    symbols: symbols.slice(0, 25).join(","),
    limit: String(FMP_NEWS_LIMIT),
    apikey: apiKey,
  });
  const stableResponse = await fetch(
    `https://financialmodelingprep.com/stable/news/stock?${stableParams.toString()}`,
    {
      next: {
        revalidate: 5 * 60,
      },
    },
  );

  if (!stableResponse.ok) {
    endpointAttempts.push({
      endpoint: "stable/news/stock",
      ok: false,
      status: stableResponse.status,
      rawItemCount: 0,
    });

    return {
      items: legacyItems,
      endpointAttempts,
    };
  }

  const stableItems = parseArrayResponse<FmpNewsItem>(
    await stableResponse.json(),
  );
  endpointAttempts.push({
    endpoint: "stable/news/stock",
    ok: true,
    status: stableResponse.status,
    rawItemCount: stableItems.length,
  });

  return {
    items: dedupeFmpNewsItems([...legacyItems, ...stableItems]),
    endpointAttempts,
  };
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

function getStockSymbols(assets: NewsAsset[]): string[] {
  return [
    ...new Set(
      assets
        .filter((asset) => asset.assetType !== "CRYPTO")
        .map((asset) => (asset.providerSymbol || asset.symbol).toUpperCase())
        .filter(Boolean),
    ),
  ];
}

function buildAssetsBySymbol(assets: NewsAsset[]) {
  return new Map(
    assets.flatMap((asset) =>
      [asset.symbol, asset.providerSymbol]
        .filter(Boolean)
        .map((symbol) => [symbol.toUpperCase(), asset] as const),
    ),
  );
}

function findFirstMatchedAsset(
  symbols: string[],
  assetsBySymbol: Map<string, NewsAsset>,
): NewsAsset | null {
  for (const symbol of symbols) {
    const asset = assetsBySymbol.get(symbol.toUpperCase());

    if (asset) {
      return asset;
    }
  }

  return null;
}

function dedupeFmpNewsItems(items: FmpNewsItem[]): FmpNewsItem[] {
  return [
    ...new Map(
      items.map((item) => [
        [item.symbol, item.publishedDate ?? item.date, item.url ?? item.title]
          .filter(Boolean)
          .join(":"),
        item,
      ]),
    ).values(),
  ];
}

function parseArrayResponse<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
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

function emptyDiagnostics(
  provider: NewsProviderName,
  symbols: string[],
  configured: boolean,
): NewsProviderDiagnostics {
  return {
    provider,
    configured,
    requestedSymbols: symbols,
    endpointAttempts: [],
    rawItemCount: 0,
    normalizedEventCount: 0,
    droppedItemCount: 0,
  };
}
