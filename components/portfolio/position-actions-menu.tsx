"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { AssetType, InvestmentIntent } from "@prisma/client";
import { ConfirmDeleteButton } from "@/components/portfolio/confirm-delete-button";
import { PositionFormModal } from "@/components/portfolio/position-form-modal";
import { PositionSellModal } from "@/components/portfolio/position-sell-modal";

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
  platformHoldings: PositionPlatformHolding[];
  latestPrice: {
    price: number;
    currency: string;
    observedAt: Date;
  } | null;
};

type PositionPlatformHolding = {
  id: string;
  platform: string;
  quantity: number;
  averageCost: number;
  costCurrency: string;
  openedAt: Date | null;
  notes: string | null;
};

type CashBalance = {
  id: string;
  platform: string;
  currency: string;
  amount: number;
};

export function PositionActionsMenu({
  position,
  baseCurrency,
  cashBalances,
  exchangeOptions,
  updateAction,
  createAction,
  deleteAction,
  sellAction,
}: {
  position: PositionActionValue;
  baseCurrency: string;
  cashBalances: CashBalance[];
  exchangeOptions: string[];
  updateAction: (formData: FormData) => Promise<void>;
  createAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
  sellAction: (formData: FormData) => Promise<void>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isBuyOpen, setIsBuyOpen] = useState(false);
  const [isSellOpen, setIsSellOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{
    right: number;
    top: number;
  } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function updateMenuPosition() {
      const buttonRect = buttonRef.current?.getBoundingClientRect();

      if (!buttonRect) {
        return;
      }

      setMenuPosition({
        right: window.innerWidth - buttonRect.right,
        top: buttonRect.bottom + 8,
      });
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;

      if (
        !buttonRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    updateMenuPosition();
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [isOpen]);

  return (
    <div className="inline-flex">
      <button
        aria-label="Position actions"
        className={`grid size-8 place-items-center rounded border border-zinc-300 text-zinc-700 transition hover:bg-zinc-100 focus:opacity-100 group-hover:opacity-100 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={() => setIsOpen((current) => !current)}
        ref={buttonRef}
        title="Edit"
        type="button"
      >
        <PencilIcon />
      </button>
      {isOpen && menuPosition
        ? createPortal(
        <div
          className="fixed z-50 grid min-w-32 gap-1 rounded border border-zinc-200 bg-white p-1 shadow-lg"
          ref={menuRef}
          style={{
            right: menuPosition.right,
            top: menuPosition.top,
          }}
        >
          <button
            className="h-9 w-full rounded px-3 text-left text-sm font-medium text-zinc-700 hover:bg-zinc-100"
            onClick={() => {
              setIsEditOpen(true);
              setIsOpen(false);
            }}
            type="button"
          >
            Edit
          </button>
          <button
            className="h-9 w-full rounded px-3 text-left text-sm font-medium text-zinc-700 hover:bg-zinc-100"
            onClick={() => {
              setIsSellOpen(true);
              setIsOpen(false);
            }}
            type="button"
          >
            Sell
          </button>
          <button
            className="h-9 w-full rounded px-3 text-left text-sm font-medium text-zinc-700 hover:bg-zinc-100"
            onClick={() => {
              setIsBuyOpen(true);
              setIsOpen(false);
            }}
            type="button"
          >
            Buy
          </button>
          <button
            className="h-9 w-full rounded px-3 text-left text-sm font-medium text-red-700 hover:bg-red-50"
            onClick={() => {
              setIsDeleteOpen(true);
              setIsOpen(false);
            }}
            type="button"
          >
            Delete
          </button>
        </div>,
        document.body,
      )
        : null}
      <PositionFormModal
        action={updateAction}
        assetType={position.assetType}
        baseCurrency={baseCurrency}
        cashBalances={cashBalances}
        exchangeOptions={exchangeOptions}
        isOpen={isEditOpen}
        mode="edit"
        onOpenChange={setIsEditOpen}
        position={position}
        showTrigger={false}
      />
      <PositionSellModal
        action={sellAction}
        isOpen={isSellOpen}
        onOpenChange={setIsSellOpen}
        position={position}
        showTrigger={false}
      />
      <PositionFormModal
        action={createAction}
        assetType={position.assetType}
        baseCurrency={baseCurrency}
        cashBalances={cashBalances}
        exchangeOptions={exchangeOptions}
        initialAsset={position}
        isOpen={isBuyOpen}
        mode="create"
        onOpenChange={setIsBuyOpen}
        showTrigger={false}
      />
      <ConfirmDeleteButton
        action={deleteAction}
        description={`Delete ${position.symbol} from this portfolio? This cannot be undone.`}
        hiddenName="positionId"
        hiddenValue={position.id}
        isOpen={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        showTrigger={false}
        title="Delete position"
      />
    </div>
  );
}

function PencilIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}
