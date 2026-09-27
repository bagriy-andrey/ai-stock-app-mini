-- CreateEnum
CREATE TYPE "AiCallStatus" AS ENUM ('SUCCESS', 'ERROR');

-- CreateTable
CREATE TABLE "AiUsageRecord" (
    "id" TEXT NOT NULL,
    "agent" TEXT NOT NULL,
    "ticker" TEXT,
    "model" TEXT NOT NULL,
    "modelTier" TEXT NOT NULL,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "cost" DECIMAL(12,6),
    "latencyMs" INTEGER,
    "status" "AiCallStatus" NOT NULL,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiUsageRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiUsageRecord_agent_idx" ON "AiUsageRecord"("agent");

-- CreateIndex
CREATE INDEX "AiUsageRecord_model_idx" ON "AiUsageRecord"("model");

-- CreateIndex
CREATE INDEX "AiUsageRecord_modelTier_idx" ON "AiUsageRecord"("modelTier");

-- CreateIndex
CREATE INDEX "AiUsageRecord_createdAt_idx" ON "AiUsageRecord"("createdAt");
