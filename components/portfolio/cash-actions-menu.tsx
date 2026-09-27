"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CashFormModal } from "@/components/portfolio/cash-form-modal";
import { CashWithdrawalModal } from "@/components/portfolio/cash-withdrawal-modal";
import { ConfirmDeleteButton } from "@/components/portfolio/confirm-delete-button";

type CashValue = {
  id: string;
  platform: string;
  currency: string;
  amount: number;
};

export function CashActionsMenu({
  cashBalance,
  cashBalances,
  baseCurrency,
  exchangeOptions,
  updateAction,
  withdrawAction,
  deleteAction,
}: {
  cashBalance: CashValue;
  cashBalances: CashValue[];
  baseCurrency: string;
  exchangeOptions: string[];
  updateAction: (formData: FormData) => Promise<void>;
  withdrawAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
}) {
  const [isOpen, setIsOpen] = useState(false);
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
        aria-label="Cash actions"
        className="h-8 w-8 rounded border border-zinc-300 text-lg leading-none text-zinc-700 hover:bg-zinc-100"
        onClick={() => setIsOpen((current) => !current)}
        ref={buttonRef}
        type="button"
      >
        ...
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
          <CashFormModal
            action={updateAction}
            baseCurrency={baseCurrency}
            cashBalance={cashBalance}
            exchangeOptions={exchangeOptions}
            mode="edit"
          />
          <CashWithdrawalModal
            action={withdrawAction}
            cashBalances={cashBalances}
            defaultCashBalance={cashBalance}
          />
          <ConfirmDeleteButton
            action={deleteAction}
            description={`Delete ${cashBalance.currency} cash on ${cashBalance.platform}? This cannot be undone.`}
            hiddenName="cashBalanceId"
            hiddenValue={cashBalance.id}
            title="Delete cash balance"
          />
        </div>,
        document.body,
      )
        : null}
    </div>
  );
}
