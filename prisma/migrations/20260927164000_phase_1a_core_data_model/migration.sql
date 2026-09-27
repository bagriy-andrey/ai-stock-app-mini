-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('STOCK', 'ETF', 'CRYPTO');

-- CreateEnum
CREATE TYPE "InvestmentIntent" AS ENUM ('LONG_TERM', 'TACTICAL');

-- CreateEnum
CREATE TYPE "WatchlistPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "assetType" "AssetType" NOT NULL,
    "currency" TEXT NOT NULL,
    "exchange" TEXT,
    "provider" TEXT NOT NULL,
    "providerSymbol" TEXT NOT NULL,
    "sector" TEXT,
    "region" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Portfolio" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "baseCurrency" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Portfolio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Position" (
    "id" TEXT NOT NULL,
    "portfolioId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "quantity" DECIMAL(24,8) NOT NULL,
    "averageCost" DECIMAL(24,8) NOT NULL,
    "costCurrency" TEXT NOT NULL,
    "investmentIntent" "InvestmentIntent" NOT NULL,
    "notes" TEXT,
    "openedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Position_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CashBalance" (
    "id" TEXT NOT NULL,
    "portfolioId" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "amount" DECIMAL(24,8) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CashBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WatchlistItem" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "investmentIntent" "InvestmentIntent" NOT NULL,
    "notes" TEXT,
    "targetEntryPrice" DECIMAL(24,8),
    "priority" "WatchlistPriority" NOT NULL DEFAULT 'MEDIUM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WatchlistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketPrice" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "price" DECIMAL(24,8) NOT NULL,
    "currency" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerSymbol" TEXT NOT NULL,
    "observedAt" TIMESTAMP(3) NOT NULL,
    "ingestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketPrice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Asset_provider_providerSymbol_key" ON "Asset"("provider", "providerSymbol");

-- CreateIndex
CREATE INDEX "Asset_symbol_idx" ON "Asset"("symbol");

-- CreateIndex
CREATE INDEX "Asset_assetType_idx" ON "Asset"("assetType");

-- CreateIndex
CREATE UNIQUE INDEX "Position_portfolioId_assetId_key" ON "Position"("portfolioId", "assetId");

-- CreateIndex
CREATE INDEX "Position_portfolioId_idx" ON "Position"("portfolioId");

-- CreateIndex
CREATE INDEX "Position_assetId_idx" ON "Position"("assetId");

-- CreateIndex
CREATE INDEX "Position_investmentIntent_idx" ON "Position"("investmentIntent");

-- CreateIndex
CREATE UNIQUE INDEX "CashBalance_portfolioId_currency_key" ON "CashBalance"("portfolioId", "currency");

-- CreateIndex
CREATE INDEX "CashBalance_portfolioId_idx" ON "CashBalance"("portfolioId");

-- CreateIndex
CREATE UNIQUE INDEX "WatchlistItem_assetId_key" ON "WatchlistItem"("assetId");

-- CreateIndex
CREATE INDEX "WatchlistItem_investmentIntent_idx" ON "WatchlistItem"("investmentIntent");

-- CreateIndex
CREATE INDEX "WatchlistItem_priority_idx" ON "WatchlistItem"("priority");

-- CreateIndex
CREATE INDEX "MarketPrice_assetId_observedAt_idx" ON "MarketPrice"("assetId", "observedAt");

-- CreateIndex
CREATE INDEX "MarketPrice_provider_providerSymbol_idx" ON "MarketPrice"("provider", "providerSymbol");

-- CreateIndex
CREATE INDEX "MarketPrice_ingestedAt_idx" ON "MarketPrice"("ingestedAt");

-- AddCheckConstraint
ALTER TABLE "Position" ADD CONSTRAINT "Position_quantity_nonnegative_check" CHECK ("quantity" >= 0);

-- AddCheckConstraint
ALTER TABLE "Position" ADD CONSTRAINT "Position_averageCost_nonnegative_check" CHECK ("averageCost" >= 0);

-- AddCheckConstraint
ALTER TABLE "CashBalance" ADD CONSTRAINT "CashBalance_amount_nonnegative_check" CHECK ("amount" >= 0);

-- AddCheckConstraint
ALTER TABLE "WatchlistItem" ADD CONSTRAINT "WatchlistItem_targetEntryPrice_nonnegative_check" CHECK ("targetEntryPrice" IS NULL OR "targetEntryPrice" >= 0);

-- AddCheckConstraint
ALTER TABLE "MarketPrice" ADD CONSTRAINT "MarketPrice_price_nonnegative_check" CHECK ("price" >= 0);

-- AddForeignKey
ALTER TABLE "Position" ADD CONSTRAINT "Position_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Position" ADD CONSTRAINT "Position_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashBalance" ADD CONSTRAINT "CashBalance_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchlistItem" ADD CONSTRAINT "WatchlistItem_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketPrice" ADD CONSTRAINT "MarketPrice_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
