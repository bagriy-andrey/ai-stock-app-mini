-- CreateEnum
CREATE TYPE "PortfolioActivityType" AS ENUM ('CASH_DEPOSIT', 'CASH_WITHDRAWAL');

-- CreateTable
CREATE TABLE "PortfolioActivityLog" (
    "id" TEXT NOT NULL,
    "portfolioId" TEXT NOT NULL,
    "type" "PortfolioActivityType" NOT NULL,
    "platform" TEXT,
    "currency" TEXT,
    "amount" DECIMAL(24,8),
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PortfolioActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PortfolioActivityLog_portfolioId_createdAt_idx" ON "PortfolioActivityLog"("portfolioId", "createdAt");

-- CreateIndex
CREATE INDEX "PortfolioActivityLog_type_idx" ON "PortfolioActivityLog"("type");

-- AddForeignKey
ALTER TABLE "PortfolioActivityLog" ADD CONSTRAINT "PortfolioActivityLog_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
