"use client";

import { useState } from "react";
import type { AssetType, InvestmentIntent } from "@prisma/client";
import { PositionFormModal } from "@/components/portfolio/position-form-modal";

type PositionActionValue = {
  id: string;
  symbol: string;
  name: string;
  assetType: AssetType;
  assetCurrency: string;
  exchange: string | null;
  provider: string;
  providerSymbol: string;
  quantity: number;
  averageCost: number;
  costCurrency: string;
  investmentIntent: InvestmentIntent;
  openedAt: Date | null;
  notes: string | null;
};

export function PositionActionsMenu({
  position,
  baseCurrency,
  updateAction,
  deleteAction,
}: {
  position: PositionActionValue;
  baseCurrency: string;
  updateAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-flex">
      <button
        aria-label="Position actions"
        className="h-8 w-8 rounded border border-zinc-300 text-lg leading-none text-zinc-700 hover:bg-zinc-100"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        ...
      </button>
      {isOpen && (
        <div className="absolute right-0 top-9 z-20 grid min-w-32 gap-1 rounded border border-zinc-200 bg-white p-1 shadow-lg">
          <PositionFormModal
            action={updateAction}
            assetType={position.assetType}
            baseCurrency={baseCurrency}
            mode="edit"
            position={position}
          />
          <form action={deleteAction}>
            <input name="positionId" type="hidden" value={position.id} />
            <button
              className="h-9 w-full rounded px-3 text-left text-sm font-medium text-red-700 hover:bg-red-50"
              type="submit"
            >
              Delete
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
