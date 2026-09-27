-- AlterTable
ALTER TABLE "CashBalance" ADD COLUMN "platform" TEXT NOT NULL DEFAULT 'Unassigned';

-- DropIndex
DROP INDEX "CashBalance_portfolioId_currency_key";

-- CreateIndex
CREATE UNIQUE INDEX "CashBalance_portfolioId_platform_currency_key" ON "CashBalance"("portfolioId", "platform", "currency");
