"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

interface Props {
  label: string; // the movie, for the accessible names
  canEdit: boolean;
  onEdit: () => void;
  onRemove: () => void;
}

const MENU_WIDTH = 160;

/**
 * ⋯ menu on the native Popover API: it renders in the top layer (never clipped by the
 * scrolling list), and click-outside / Escape close it with focus back on the button.
 * Placed next to its button on open; closes if the list scrolls, since it's positioned fixed.
 */
export function MovieActionsMenu({ label, canEdit, onEdit, onRemove }: Props) {
  const menuId = `menu-${useId()}`;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const place = () => {
    const button = buttonRef.current;
    const menu = menuRef.current;
    if (!button || !menu) return;
    const b = button.getBoundingClientRect();
    const height = menu.offsetHeight || 96;
    const below = b.bottom + 4;
    menu.style.left = `${Math.max(8, b.right - MENU_WIDTH)}px`;
    menu.style.top = `${below + height > window.innerHeight - 8 ? b.top - height - 4 : below}px`;
  };

  useEffect(() => {
    if (!open) return;
    const close = () => menuRef.current?.hidePopover();
    window.addEventListener("scroll", close, { capture: true, once: true });
    window.addEventListener("resize", close, { once: true });
    return () => {
      window.removeEventListener("scroll", close, { capture: true });
      window.removeEventListener("resize", close);
    };
  }, [open]);

  const choose = (action: () => void) => {
    menuRef.current?.hidePopover();
    action();
  };

  // ↑/↓ move between items, like a native menu
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const items = [
      ...(menuRef.current?.querySelectorAll<HTMLButtonElement>("[role=menuitem]") ?? []),
    ];
    const i = items.indexOf(document.activeElement as HTMLButtonElement);
    items[(i + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length]?.focus();
  };

  const item =
    "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors duration-150 focus-visible:outline-none";

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        popoverTarget={menuId}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Options for ${label}`}
        className="-mr-1 flex size-8 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition duration-150 hover:bg-rose-50 hover:text-rose-700 active:scale-95 dark:text-zinc-400 dark:hover:bg-rose-950/50 dark:hover:text-rose-300"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <circle cx="5" cy="12" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="19" cy="12" r="1.8" />
        </svg>
      </button>
      <div
        ref={menuRef}
        id={menuId}
        popover="auto"
        role="menu"
        aria-label={`Options for ${label}`}
        onBeforeToggle={(e) => e.newState === "open" && place()}
        onToggle={(e) => {
          const isOpen = e.newState === "open";
          setOpen(isOpen);
          if (isOpen) {
            place(); // re-measure now that it has a real height
            menuRef.current?.querySelector<HTMLButtonElement>("[role=menuitem]")?.focus();
          }
        }}
        onKeyDown={onKeyDown}
        style={{ width: MENU_WIDTH }}
        className="fixed inset-auto m-0 rounded-xl border border-zinc-200 bg-white p-1 text-zinc-900 shadow-lg dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
      >
        {canEdit && (
          <button
            type="button"
            role="menuitem"
            onClick={() => choose(onEdit)}
            className={`${item} hover:bg-rose-50 hover:text-rose-700 focus-visible:bg-rose-50 focus-visible:text-rose-700 dark:hover:bg-rose-950/50 dark:hover:text-rose-300 dark:focus-visible:bg-rose-950/50 dark:focus-visible:text-rose-300`}
          >
            Edit
          </button>
        )}
        <button
          type="button"
          role="menuitem"
          onClick={() => choose(onRemove)}
          className={`${item} text-red-600 hover:bg-red-50 focus-visible:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50 dark:focus-visible:bg-red-950/50`}
        >
          Remove
        </button>
      </div>
    </>
  );
}
