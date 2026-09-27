"use client";

import { useEffect, useRef, useState } from "react";
import type { AssetType, InvestmentIntent } from "@prisma/client";
import { ConfirmDeleteButton } from "@/components/portfolio/confirm-delete-button";
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
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-flex" ref={menuRef}>
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
          <ConfirmDeleteButton
            action={deleteAction}
            description={`Delete ${position.symbol} from this portfolio? This cannot be undone.`}
            hiddenName="positionId"
            hiddenValue={position.id}
            title="Delete position"
          />
        </div>
      )}
    </div>
  );
}
