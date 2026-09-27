"use client";

import { useEffect, useRef, useState } from "react";
import { CashFormModal } from "@/components/portfolio/cash-form-modal";
import { ConfirmDeleteButton } from "@/components/portfolio/confirm-delete-button";

type CashValue = {
  id: string;
  platform: string;
  currency: string;
  amount: number;
};

export function CashActionsMenu({
  cashBalance,
  updateAction,
  deleteAction,
}: {
  cashBalance: CashValue;
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
        aria-label="Cash actions"
        className="h-8 w-8 rounded border border-zinc-300 text-lg leading-none text-zinc-700 hover:bg-zinc-100"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        ...
      </button>
      {isOpen && (
        <div className="absolute right-0 top-9 z-20 grid min-w-32 gap-1 rounded border border-zinc-200 bg-white p-1 shadow-lg">
          <CashFormModal
            action={updateAction}
            cashBalance={cashBalance}
            mode="edit"
          />
          <ConfirmDeleteButton
            action={deleteAction}
            description={`Delete ${cashBalance.currency} cash on ${cashBalance.platform}? This cannot be undone.`}
            hiddenName="cashBalanceId"
            hiddenValue={cashBalance.id}
            title="Delete cash balance"
          />
        </div>
      )}
    </div>
  );
}
