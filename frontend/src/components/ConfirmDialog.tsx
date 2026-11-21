"use client";

import { useEffect, useId, useRef } from "react";

interface Props {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/**
 * "Are you sure?" on the native <dialog>: showModal() gives the backdrop, Escape to close,
 * focus kept inside, and focus returned to the opener on close, with no library.
 * Mount it only while needed ({open && <ConfirmDialog open … />}) so long lists don't carry
 * one hidden dialog per row. Focus lands on Cancel first: the safe choice for a destructive ask.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger,
  onConfirm,
  onClose,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      // a click on the dialog element itself (not its content) is a click on the backdrop
      onClick={(e) => e.target === e.currentTarget && onClose()}
      aria-labelledby={`${id}-title`}
      aria-describedby={description ? `${id}-desc` : undefined}
      className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl bg-white p-0 text-zinc-900 shadow-2xl ring-1 ring-rose-200/70 backdrop:bg-zinc-950/50 backdrop:backdrop-blur-[2px] dark:bg-zinc-900 dark:text-zinc-100 dark:ring-rose-900/40"
    >
      <div className="p-6">
        <h2 id={`${id}-title`} className="font-display text-2xl leading-tight">
          {title}
        </h2>
        {description && (
          <p id={`${id}-desc`} className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            {description}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium transition duration-150 hover:-translate-y-px hover:border-rose-300 active:translate-y-0 active:scale-[0.98] dark:border-zinc-700 dark:hover:border-rose-800"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm transition duration-150 hover:-translate-y-px active:translate-y-0 active:scale-[0.98] ${danger ? "bg-red-600 hover:bg-red-700" : "bg-rose-600 hover:bg-rose-700"}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
