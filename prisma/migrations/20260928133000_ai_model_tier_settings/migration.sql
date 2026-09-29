-- CreateTable
CREATE TABLE "AiModelTierSetting" (
    "tier" TEXT NOT NULL,
    "primaryModel" TEXT NOT NULL,
    "modelName" TEXT,
    "promptPrice" DECIMAL(18,12),
    "completionPrice" DECIMAL(18,12),
    "requestPrice" DECIMAL(18,12),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiModelTierSetting_pkey" PRIMARY KEY ("tier")
);
