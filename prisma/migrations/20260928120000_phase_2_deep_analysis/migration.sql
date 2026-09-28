-- CreateEnum
CREATE TYPE "AgentRunStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED', 'PARTIAL');

-- CreateEnum
CREATE TYPE "AgentStance" AS ENUM ('BULLISH', 'BEARISH', 'NEUTRAL', 'MIXED');

-- AlterTable
ALTER TABLE "AiUsageRecord" ADD COLUMN "agentRunId" TEXT;

-- CreateTable
CREATE TABLE "AgentRun" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "portfolioId" TEXT,
    "positionId" TEXT,
    "watchlistItemId" TEXT,
    "requestedIntent" "InvestmentIntent" NOT NULL,
    "status" "AgentRunStatus" NOT NULL DEFAULT 'PENDING',
    "inputSnapshot" JSONB NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalysisReport" (
    "id" TEXT NOT NULL,
    "agentRunId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "recommendationLabel" TEXT NOT NULL,
    "confidence" DECIMAL(5,4) NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "timeHorizon" TEXT NOT NULL,
    "thesis" JSONB NOT NULL,
    "opportunities" JSONB NOT NULL,
    "risks" JSONB NOT NULL,
    "portfolioFit" TEXT NOT NULL,
    "missingDataWarnings" JSONB NOT NULL,
    "rawOutput" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalysisReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentReasoningSummary" (
    "id" TEXT NOT NULL,
    "agentRunId" TEXT NOT NULL,
    "agentName" TEXT NOT NULL,
    "agentRole" TEXT NOT NULL,
    "modelTier" TEXT NOT NULL,
    "model" TEXT,
    "promptVersion" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "stance" "AgentStance" NOT NULL,
    "confidence" DECIMAL(5,4),
    "rawOutput" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentReasoningSummary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiUsageRecord_agentRunId_idx" ON "AiUsageRecord"("agentRunId");

-- CreateIndex
CREATE INDEX "AgentRun_assetId_idx" ON "AgentRun"("assetId");

-- CreateIndex
CREATE INDEX "AgentRun_portfolioId_idx" ON "AgentRun"("portfolioId");

-- CreateIndex
CREATE INDEX "AgentRun_positionId_idx" ON "AgentRun"("positionId");

-- CreateIndex
CREATE INDEX "AgentRun_watchlistItemId_idx" ON "AgentRun"("watchlistItemId");

-- CreateIndex
CREATE INDEX "AgentRun_requestedIntent_idx" ON "AgentRun"("requestedIntent");

-- CreateIndex
CREATE INDEX "AgentRun_status_idx" ON "AgentRun"("status");

-- CreateIndex
CREATE INDEX "AgentRun_createdAt_idx" ON "AgentRun"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AnalysisReport_agentRunId_key" ON "AnalysisReport"("agentRunId");

-- CreateIndex
CREATE INDEX "AnalysisReport_assetId_idx" ON "AnalysisReport"("assetId");

-- CreateIndex
CREATE INDEX "AnalysisReport_createdAt_idx" ON "AnalysisReport"("createdAt");

-- CreateIndex
CREATE INDEX "AnalysisReport_recommendationLabel_idx" ON "AnalysisReport"("recommendationLabel");

-- CreateIndex
CREATE INDEX "AnalysisReport_riskLevel_idx" ON "AnalysisReport"("riskLevel");

-- CreateIndex
CREATE INDEX "AgentReasoningSummary_agentRunId_idx" ON "AgentReasoningSummary"("agentRunId");

-- CreateIndex
CREATE INDEX "AgentReasoningSummary_agentName_idx" ON "AgentReasoningSummary"("agentName");

-- CreateIndex
CREATE INDEX "AgentReasoningSummary_stance_idx" ON "AgentReasoningSummary"("stance");

-- CreateIndex
CREATE INDEX "AgentReasoningSummary_createdAt_idx" ON "AgentReasoningSummary"("createdAt");

-- AddForeignKey
ALTER TABLE "AiUsageRecord" ADD CONSTRAINT "AiUsageRecord_agentRunId_fkey" FOREIGN KEY ("agentRunId") REFERENCES "AgentRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentRun" ADD CONSTRAINT "AgentRun_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentRun" ADD CONSTRAINT "AgentRun_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentRun" ADD CONSTRAINT "AgentRun_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentRun" ADD CONSTRAINT "AgentRun_watchlistItemId_fkey" FOREIGN KEY ("watchlistItemId") REFERENCES "WatchlistItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalysisReport" ADD CONSTRAINT "AnalysisReport_agentRunId_fkey" FOREIGN KEY ("agentRunId") REFERENCES "AgentRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalysisReport" ADD CONSTRAINT "AnalysisReport_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentReasoningSummary" ADD CONSTRAINT "AgentReasoningSummary_agentRunId_fkey" FOREIGN KEY ("agentRunId") REFERENCES "AgentRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
