"use client";

import { useState } from "react";

export function ConfirmDeleteButton({
  action,
  hiddenName,
  hiddenValue,
  title,
  description,
}: {
  action: (formData: FormData) => Promise<void>;
  hiddenName: string;
  hiddenValue: string;
  title: string;
  description: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        className="h-9 w-full rounded px-3 text-left text-sm font-medium text-red-700 hover:bg-red-50"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        Delete
      </button>
      {isOpen && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-zinc-950/40 px-4 py-6">
          <div className="w-full max-w-md rounded border border-zinc-200 bg-white shadow-xl">
            <div className="border-b border-zinc-200 px-5 py-4">
              <h2 className="text-base font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                {description}
              </p>
            </div>
            <form action={action} className="flex justify-end gap-2 px-5 py-4">
              <input name={hiddenName} type="hidden" value={hiddenValue} />
              <button
                className="h-9 rounded border border-zinc-300 px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="h-9 rounded bg-red-700 px-3 text-sm font-medium text-white hover:bg-red-800"
                type="submit"
              >
                Delete
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
