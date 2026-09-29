-- CreateEnum
CREATE TYPE "ScannerType" AS ENUM ('PORTFOLIO', 'WATCHLIST', 'OPPORTUNITY', 'CRYPTO', 'NEWS_EVENT');

-- CreateEnum
CREATE TYPE "ScannerRunStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED', 'PARTIAL');

-- CreateEnum
CREATE TYPE "ScannerRunTrigger" AS ENUM ('MANUAL', 'SCHEDULED', 'SYSTEM');

-- CreateEnum
CREATE TYPE "SignalSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "SignalDirection" AS ENUM ('POSITIVE', 'NEGATIVE', 'MIXED', 'NEUTRAL', 'UNKNOWN');

-- CreateTable
CREATE TABLE "DiscoveryUniverse" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscoveryUniverse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscoveryUniverseAsset" (
    "id" TEXT NOT NULL,
    "discoveryUniverseId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 50,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscoveryUniverseAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScannerRun" (
    "id" TEXT NOT NULL,
    "scannerType" "ScannerType" NOT NULL,
    "status" "ScannerRunStatus" NOT NULL DEFAULT 'PENDING',
    "trigger" "ScannerRunTrigger" NOT NULL,
    "configurationVersion" TEXT NOT NULL,
    "inputScope" JSONB NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScannerRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScannerSignal" (
    "id" TEXT NOT NULL,
    "scannerRunId" TEXT NOT NULL,
    "assetId" TEXT,
    "signalType" TEXT NOT NULL,
    "severity" "SignalSeverity" NOT NULL,
    "direction" "SignalDirection" NOT NULL,
    "score" DECIMAL(8,4) NOT NULL,
    "confidence" DECIMAL(5,4) NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "reasons" JSONB NOT NULL,
    "risks" JSONB NOT NULL,
    "sourceRefs" JSONB NOT NULL,
    "dataFreshness" JSONB NOT NULL,
    "isDeepAnalysisCandidate" BOOLEAN NOT NULL DEFAULT false,
    "suggestedAction" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScannerSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketEvent" (
    "id" TEXT NOT NULL,
    "dedupeKey" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sourceProvider" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "sourceTitle" TEXT NOT NULL,
    "affectedAssetId" TEXT,
    "affectedEntity" TEXT,
    "assetClass" TEXT,
    "sector" TEXT,
    "country" TEXT,
    "direction" "SignalDirection" NOT NULL,
    "severity" "SignalSeverity" NOT NULL,
    "confidence" DECIMAL(5,4) NOT NULL,
    "summary" TEXT NOT NULL,
    "rawPayload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScannerEventLink" (
    "id" TEXT NOT NULL,
    "scannerSignalId" TEXT NOT NULL,
    "marketEventId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScannerEventLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DiscoveryUniverse_name_key" ON "DiscoveryUniverse"("name");

-- CreateIndex
CREATE INDEX "DiscoveryUniverse_isActive_idx" ON "DiscoveryUniverse"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "DiscoveryUniverseAsset_discoveryUniverseId_assetId_key" ON "DiscoveryUniverseAsset"("discoveryUniverseId", "assetId");

-- CreateIndex
CREATE INDEX "DiscoveryUniverseAsset_assetId_idx" ON "DiscoveryUniverseAsset"("assetId");

-- CreateIndex
CREATE INDEX "DiscoveryUniverseAsset_priority_idx" ON "DiscoveryUniverseAsset"("priority");

-- CreateIndex
CREATE INDEX "ScannerRun_scannerType_createdAt_idx" ON "ScannerRun"("scannerType", "createdAt");

-- CreateIndex
CREATE INDEX "ScannerRun_status_idx" ON "ScannerRun"("status");

-- CreateIndex
CREATE INDEX "ScannerRun_trigger_idx" ON "ScannerRun"("trigger");

-- CreateIndex
CREATE INDEX "ScannerSignal_scannerRunId_idx" ON "ScannerSignal"("scannerRunId");

-- CreateIndex
CREATE INDEX "ScannerSignal_assetId_idx" ON "ScannerSignal"("assetId");

-- CreateIndex
CREATE INDEX "ScannerSignal_severity_idx" ON "ScannerSignal"("severity");

-- CreateIndex
CREATE INDEX "ScannerSignal_isDeepAnalysisCandidate_idx" ON "ScannerSignal"("isDeepAnalysisCandidate");

-- CreateIndex
CREATE INDEX "ScannerSignal_score_idx" ON "ScannerSignal"("score");

-- CreateIndex
CREATE UNIQUE INDEX "MarketEvent_dedupeKey_key" ON "MarketEvent"("dedupeKey");

-- CreateIndex
CREATE INDEX "MarketEvent_eventType_idx" ON "MarketEvent"("eventType");

-- CreateIndex
CREATE INDEX "MarketEvent_occurredAt_idx" ON "MarketEvent"("occurredAt");

-- CreateIndex
CREATE INDEX "MarketEvent_detectedAt_idx" ON "MarketEvent"("detectedAt");

-- CreateIndex
CREATE INDEX "MarketEvent_affectedAssetId_idx" ON "MarketEvent"("affectedAssetId");

-- CreateIndex
CREATE INDEX "MarketEvent_sourceProvider_idx" ON "MarketEvent"("sourceProvider");

-- CreateIndex
CREATE UNIQUE INDEX "ScannerEventLink_scannerSignalId_marketEventId_key" ON "ScannerEventLink"("scannerSignalId", "marketEventId");

-- CreateIndex
CREATE INDEX "ScannerEventLink_marketEventId_idx" ON "ScannerEventLink"("marketEventId");

-- AddForeignKey
ALTER TABLE "DiscoveryUniverseAsset" ADD CONSTRAINT "DiscoveryUniverseAsset_discoveryUniverseId_fkey" FOREIGN KEY ("discoveryUniverseId") REFERENCES "DiscoveryUniverse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscoveryUniverseAsset" ADD CONSTRAINT "DiscoveryUniverseAsset_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScannerSignal" ADD CONSTRAINT "ScannerSignal_scannerRunId_fkey" FOREIGN KEY ("scannerRunId") REFERENCES "ScannerRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScannerSignal" ADD CONSTRAINT "ScannerSignal_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketEvent" ADD CONSTRAINT "MarketEvent_affectedAssetId_fkey" FOREIGN KEY ("affectedAssetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScannerEventLink" ADD CONSTRAINT "ScannerEventLink_scannerSignalId_fkey" FOREIGN KEY ("scannerSignalId") REFERENCES "ScannerSignal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScannerEventLink" ADD CONSTRAINT "ScannerEventLink_marketEventId_fkey" FOREIGN KEY ("marketEventId") REFERENCES "MarketEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
