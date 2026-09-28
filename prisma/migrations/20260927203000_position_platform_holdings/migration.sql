-- CreateTable
CREATE TABLE "PositionPlatformHolding" (
    "id" TEXT NOT NULL,
    "positionId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "quantity" DECIMAL(24,8) NOT NULL,
    "averageCost" DECIMAL(24,8) NOT NULL,
    "costCurrency" TEXT NOT NULL,
    "openedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PositionPlatformHolding_pkey" PRIMARY KEY ("id")
);

-- Backfill existing aggregated positions into one platform row.
INSERT INTO "PositionPlatformHolding" (
    "id",
    "positionId",
    "platform",
    "quantity",
    "averageCost",
    "costCurrency",
    "openedAt",
    "notes",
    "createdAt",
    "updatedAt"
)
SELECT
    'cmig' || substr(md5(random()::text || clock_timestamp()::text), 1, 20),
    "Position"."id",
    COALESCE(NULLIF("Asset"."exchange", ''), 'Unassigned'),
    "Position"."quantity",
    "Position"."averageCost",
    "Position"."costCurrency",
    "Position"."openedAt",
    "Position"."notes",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "Position"
JOIN "Asset" ON "Asset"."id" = "Position"."assetId";

-- CreateIndex
CREATE UNIQUE INDEX "PositionPlatformHolding_positionId_platform_key" ON "PositionPlatformHolding"("positionId", "platform");

-- CreateIndex
CREATE INDEX "PositionPlatformHolding_positionId_idx" ON "PositionPlatformHolding"("positionId");

-- CreateIndex
CREATE INDEX "PositionPlatformHolding_platform_idx" ON "PositionPlatformHolding"("platform");

-- AddCheckConstraint
ALTER TABLE "PositionPlatformHolding" ADD CONSTRAINT "PositionPlatformHolding_quantity_nonnegative_check" CHECK ("quantity" >= 0);

-- AddCheckConstraint
ALTER TABLE "PositionPlatformHolding" ADD CONSTRAINT "PositionPlatformHolding_averageCost_nonnegative_check" CHECK ("averageCost" >= 0);

-- AddForeignKey
ALTER TABLE "PositionPlatformHolding" ADD CONSTRAINT "PositionPlatformHolding_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE CASCADE ON UPDATE CASCADE;
