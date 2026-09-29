"use client";

import { useEffect, useRef, useState } from "react";

type ToastVariant = "success" | "error" | "info";

type ToastMessage = {
  id: number;
  message: string;
  variant: ToastVariant;
};

const toastEventName = "app-toast";

export function showToast(message: string, variant: ToastVariant = "info") {
  window.dispatchEvent(
    new CustomEvent(toastEventName, {
      detail: {
        message,
        variant,
      },
    }),
  );
}

export function ToastViewport({
  initialToast,
}: {
  initialToast?: {
    message: string;
    variant: ToastVariant;
  } | null;
}) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const shownInitialToastKeyRef = useRef<string | null>(null);

  function addToast(message: string, variant: ToastVariant = "info") {
    const id = Date.now();
    setToasts((current) => [
      ...current,
      {
        id,
        message,
        variant,
      },
    ]);

    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 5000);
  }

  useEffect(() => {
    function handleToast(event: Event) {
      const detail = (event as CustomEvent).detail as
        | { message?: string; variant?: ToastVariant }
        | undefined;

      const message = detail?.message;

      if (!message) {
        return;
      }

      addToast(message, detail.variant ?? "info");
    }

    window.addEventListener(toastEventName, handleToast);

    return () => window.removeEventListener(toastEventName, handleToast);
  }, []);

  useEffect(() => {
    if (!initialToast) {
      return;
    }

    const key = `${initialToast.variant}:${initialToast.message}`;

    if (shownInitialToastKeyRef.current === key) {
      return;
    }

    shownInitialToastKeyRef.current = key;
    addToast(initialToast.message, initialToast.variant);
  }, [initialToast]);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="fixed right-4 top-4 z-[80] grid w-[min(360px,calc(100vw-2rem))] gap-2">
      {toasts.map((toast) => (
        <div
          className={`rounded border px-4 py-3 text-sm shadow-lg ${getToastClassName(
            toast.variant,
          )}`}
          key={toast.id}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}

function getToastClassName(variant: ToastVariant): string {
  if (variant === "success") {
    return "border-emerald-200 bg-emerald-50 text-emerald-900";
  }

  if (variant === "error") {
    return "border-red-200 bg-red-50 text-red-900";
  }

  return "border-zinc-200 bg-white text-zinc-900";
}
