"use client";

import { useState } from "react";
import { CashFormModal } from "@/components/portfolio/cash-form-modal";

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

  return (
    <div className="relative inline-flex">
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
          <form action={deleteAction}>
            <input
              name="cashBalanceId"
              type="hidden"
              value={cashBalance.id}
            />
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
