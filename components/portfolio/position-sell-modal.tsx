"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { AssetType, InvestmentIntent } from "@prisma/client";

type PositionSellValue = {
  id: string;
  symbol: string;
  name: string;
  assetType: AssetType;
  assetCurrency: string;
  exchange: string | null;
  provider: string;
  providerSymbol: string;
  platformHoldings: PositionPlatformHolding[];
  quantity: number;
  averageCost: number;
  costCurrency: string;
  investmentIntent: InvestmentIntent;
  openedAt: Date | null;
  notes: string | null;
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

export function PositionSellModal({
  position,
  action,
  isOpen: controlledIsOpen,
  onOpenChange,
  showTrigger = true,
}: {
  position: PositionSellValue;
  action: (formData: FormData) => Promise<void>;
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  showTrigger?: boolean;
}) {
  const router = useRouter();
  const sellableHoldings = useMemo(
    () =>
      position.platformHoldings.filter((holding) => holding.quantity > 0),
    [position.platformHoldings],
  );
  const defaultHolding = sellableHoldings[0] ?? null;
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedHoldingId, setSelectedHoldingId] = useState(
    defaultHolding?.id ?? "",
  );
  const [quantity, setQuantity] = useState(0);
  const [unitPrice, setUnitPrice] = useState(
    position.latestPrice?.price ?? position.averageCost,
  );
  const [amount, setAmount] = useState(0);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const isOpen = controlledIsOpen ?? internalIsOpen;
  const selectedHolding =
    sellableHoldings.find((holding) => holding.id === selectedHoldingId) ??
    defaultHolding;
  const proceeds = quantity * unitPrice;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let isActive = true;

    fetchCurrentPrice(position)
      .then((price) => {
        if (!isActive || price === null) {
          return;
        }

        setUnitPrice(price);
        setAmount(0);
      })
      .catch(() => undefined);

    return () => {
      isActive = false;
    };
  }, [isOpen, position]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedHolding) {
      showToast("No exchange holding is available to sell.", "error");
      return;
    }

    if (quantity > selectedHolding.quantity) {
      showToast(
        `Cannot sell more than ${formatNumber(selectedHolding.quantity)} ${position.symbol} from ${selectedHolding.platform}.`,
        "error",
      );
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    setIsSubmitting(true);

    try {
      await action(formData);
      form.reset();
      setQuantity(0);
      setAmount(0);
      setUnitPrice(position.latestPrice?.price ?? position.averageCost);
      setOpen(false);
      showToast("Asset sold successfully.", "success");
      router.refresh();
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  function openModal() {
    const nextDefaultHolding = sellableHoldings[0] ?? null;

    setSelectedHoldingId(nextDefaultHolding?.id ?? "");
    setQuantity(0);
    setAmount(0);
    setUnitPrice(position.latestPrice?.price ?? position.averageCost);
    setOpen(true);
  }

  function setOpen(nextIsOpen: boolean) {
    if (controlledIsOpen === undefined) {
      setInternalIsOpen(nextIsOpen);
    }

    onOpenChange?.(nextIsOpen);
  }

  function showToast(message: string, type: "success" | "error") {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), type === "success" ? 3500 : 5000);
  }

  return (
    <>
      {showTrigger ? (
        <button className={secondaryButtonClassName} onClick={openModal} type="button">
          Sell
        </button>
      ) : null}

      {toast ? <Toast message={toast.message} type={toast.type} /> : null}

      {isOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-zinc-950/40 px-4 py-6">
          <div className="w-full max-w-md rounded border border-zinc-200 bg-white shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-zinc-200 px-5 py-4">
              <div>
                <h2 className="text-base font-semibold">Sell {position.symbol}</h2>
                <p className="mt-1 text-sm text-zinc-600">{position.name}</p>
              </div>
              <button
                className="rounded border border-zinc-300 px-2 py-1 text-sm text-zinc-600 hover:bg-zinc-100"
                onClick={() => setOpen(false)}
                type="button"
              >
                Close
              </button>
            </div>

            <form className="grid gap-4 px-5 py-5" onSubmit={handleSubmit}>
              <input name="positionId" type="hidden" value={position.id} />
              {selectedHolding ? (
                <>
                  <input name="holdingId" type="hidden" value={selectedHolding.id} />
                  <input name="platform" type="hidden" value={selectedHolding.platform} />
                  <input name="currency" type="hidden" value={selectedHolding.costCurrency} />
                </>
              ) : null}

              <Field label="Exchange">
                <select
                  className={inputClassName}
                  disabled={sellableHoldings.length === 0}
                  onChange={(event) => {
                    setSelectedHoldingId(event.target.value);
                    setQuantity(0);
                    setAmount(0);
                  }}
                  value={selectedHolding?.id ?? ""}
                >
                  {sellableHoldings.length === 0 ? (
                    <option value="">No holdings available</option>
                  ) : (
                    sellableHoldings.map((holding) => (
                      <option key={holding.id} value={holding.id}>
                        {holding.platform} / {formatNumber(holding.quantity)} {position.symbol}
                      </option>
                    ))
                  )}
                </select>
              </Field>

              <div className="rounded border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
                <div className="flex items-center justify-between gap-3">
                  <span>Available</span>
                  <span className="font-medium text-zinc-950">
                    {selectedHolding
                      ? `${formatNumber(selectedHolding.quantity)} ${position.symbol}`
                      : "N/A"}
                  </span>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Quantity">
                  <input
                    className={inputClassName}
                    max={selectedHolding?.quantity ?? 0}
                    min="0"
                    name="quantity"
                    onChange={(event) => {
                      const maxQuantity = selectedHolding?.quantity ?? 0;
                      const nextQuantity = Math.min(
                        event.target.valueAsNumber || 0,
                        maxQuantity,
                      );

                      setQuantity(nextQuantity);
                      setAmount(nextQuantity * unitPrice);
                    }}
                    required
                    step="any"
                    type="number"
                    value={quantity || ""}
                  />
                </Field>
                <Field label={`Amount in ${selectedHolding?.costCurrency ?? position.costCurrency}`}>
                  <div className="flex gap-2">
                    <input
                      className={inputClassName}
                      min="0"
                      onChange={(event) => {
                        const maxQuantity = selectedHolding?.quantity ?? 0;
                        const maxAmount = maxQuantity * unitPrice;
                        const nextAmount = Math.min(
                          event.target.valueAsNumber || 0,
                          maxAmount,
                        );

                        setAmount(nextAmount);
                        setQuantity(
                          unitPrice > 0 ? nextAmount / unitPrice : 0,
                        );
                      }}
                      step="any"
                      type="number"
                      value={amount || ""}
                    />
                    <button
                      className={secondaryButtonClassName}
                      disabled={!selectedHolding || unitPrice <= 0}
                      onClick={() => {
                        const nextQuantity = selectedHolding?.quantity ?? 0;
                        const nextAmount = nextQuantity * unitPrice;

                        setQuantity(nextQuantity);
                        setAmount(nextAmount);
                      }}
                      type="button"
                    >
                      Max
                    </button>
                  </div>
                </Field>
                <Field label={`Price (${selectedHolding?.costCurrency ?? position.costCurrency})`}>
                  <input
                    className={inputClassName}
                    min="0"
                    name="unitPrice"
                    onChange={(event) => {
                      const nextUnitPrice = event.target.valueAsNumber || 0;

                      setUnitPrice(nextUnitPrice);
                      setAmount(quantity * nextUnitPrice);
                    }}
                    required
                    step="any"
                    type="number"
                    value={unitPrice || ""}
                  />
                </Field>
              </div>

              <Field label="Operation date">
                <input
                  className={inputClassName}
                  defaultValue={new Date().toISOString().slice(0, 10)}
                  name="soldAt"
                  required
                  type="date"
                />
              </Field>

              <div className="rounded border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
                <div className="flex items-center justify-between gap-3">
                  <span>Cash after sale will increase by</span>
                  <span className="font-medium text-zinc-950">
                    {formatMoney(
                      proceeds,
                      selectedHolding?.costCurrency ?? position.costCurrency,
                    )}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-zinc-200 pt-4">
                <button
                  className={secondaryButtonClassName}
                  disabled={isSubmitting}
                  onClick={() => setOpen(false)}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className={primaryButtonClassName}
                  disabled={
                    isSubmitting ||
                    !selectedHolding ||
                    quantity <= 0 ||
                    quantity > selectedHolding.quantity
                  }
                  type="submit"
                >
                  {isSubmitting ? "Selling..." : "Sell asset"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

function Toast({
  message,
  type,
}: {
  message: string;
  type: "success" | "error";
}) {
  return (
    <div
      className={`fixed right-5 top-5 z-[60] rounded border px-4 py-3 text-sm font-medium shadow-lg ${
        type === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
          : "border-red-200 bg-red-50 text-red-900"
      }`}
    >
      {message}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1 text-xs font-medium text-zinc-500">
      {label}
      {children}
    </label>
  );
}

function formatMoney(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      currency,
      maximumFractionDigits: 2,
      style: "currency",
    }).format(value);
  } catch {
    return `${formatNumber(value)} ${currency}`;
  }
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 8,
  }).format(value);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to sell asset.";
}

async function fetchCurrentPrice(position: PositionSellValue): Promise<number | null> {
  const params = new URLSearchParams({
    name: position.name,
    provider: position.provider,
    providerSymbol: position.providerSymbol || position.symbol,
    symbol: position.symbol,
    type: position.assetType,
  });
  const response = await fetch(`/api/assets/profile?${params}`);

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as {
    profile?: {
      currentPrice?: number | null;
    } | null;
  };
  const price = data.profile?.currentPrice;

  return typeof price === "number" && Number.isFinite(price) ? price : null;
}

const inputClassName =
  "h-9 w-full rounded border border-zinc-300 bg-white px-2 text-sm text-zinc-950 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600";

const primaryButtonClassName =
  "h-9 rounded bg-zinc-950 px-3 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400";

const secondaryButtonClassName =
  "h-9 rounded border border-zinc-300 px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60";
