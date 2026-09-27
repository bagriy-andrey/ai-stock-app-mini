-- CreateEnum
CREATE TYPE "PortfolioExchangeType" AS ENUM ('CRYPTO', 'STOCK');

-- CreateTable
CREATE TABLE "PortfolioExchange" (
    "id" TEXT NOT NULL,
    "portfolioId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PortfolioExchangeType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortfolioExchange_pkey" PRIMARY KEY ("id")
);

-- Backfill user exchanges from existing portfolio records. Existing platform
-- strings did not store a canonical exchange type, so crypto positions infer
-- CRYPTO and every other existing platform defaults to STOCK.
INSERT INTO "PortfolioExchange" ("id", "portfolioId", "name", "type", "updatedAt")
SELECT
    md5(random()::text || clock_timestamp()::text),
    source."portfolioId",
    source."name",
    CASE
        WHEN BOOL_OR(source."type" = 'CRYPTO') THEN 'CRYPTO'::"PortfolioExchangeType"
        ELSE 'STOCK'::"PortfolioExchangeType"
    END,
    CURRENT_TIMESTAMP
FROM (
    SELECT cb."portfolioId", cb."platform" AS "name", 'STOCK' AS "type"
    FROM "CashBalance" cb
    WHERE btrim(cb."platform") <> ''

    UNION ALL

    SELECT p."portfolioId", a."exchange" AS "name", a."assetType"::text AS "type"
    FROM "Position" p
    INNER JOIN "Asset" a ON a."id" = p."assetId"
    WHERE a."exchange" IS NOT NULL AND btrim(a."exchange") <> ''

    UNION ALL

    SELECT p."portfolioId", pph."platform" AS "name", a."assetType"::text AS "type"
    FROM "PositionPlatformHolding" pph
    INNER JOIN "Position" p ON p."id" = pph."positionId"
    INNER JOIN "Asset" a ON a."id" = p."assetId"
    WHERE btrim(pph."platform") <> ''
) source
GROUP BY source."portfolioId", source."name"
;

-- CreateIndex
CREATE UNIQUE INDEX "PortfolioExchange_portfolioId_name_key" ON "PortfolioExchange"("portfolioId", "name");

-- CreateIndex
CREATE INDEX "PortfolioExchange_portfolioId_idx" ON "PortfolioExchange"("portfolioId");

-- CreateIndex
CREATE INDEX "PortfolioExchange_type_idx" ON "PortfolioExchange"("type");

-- AddForeignKey
ALTER TABLE "PortfolioExchange" ADD CONSTRAINT "PortfolioExchange_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
