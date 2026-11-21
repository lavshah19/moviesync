import type { CSSProperties } from "react";

// Two tickets for neighbouring seats: the app is two people, side by side, picking films.
// Purely decorative (aria-hidden); the page reads the same without it.
const PANEL = "bg-rose-50 dark:bg-[#1c1114]"; // must match the auth panel so the notches read as cut-outs

function Ticket({ seat, filled }: { seat: number; filled?: boolean }) {
  const face = filled
    ? "bg-rose-600 text-white shadow-rose-900/20"
    : "bg-white text-zinc-900 ring-1 ring-rose-200 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-rose-900/60";
  return (
    <div
      className={`relative flex w-60 rounded-2xl shadow-xl transition-transform duration-150 ease-out hover:-translate-y-0.5 sm:w-72 xl:w-80 ${face}`}
    >
      <div className="flex-1 p-5">
        <p className={`text-xs font-medium ${filled ? "text-rose-100" : "text-rose-700 dark:text-rose-300"}`}>
          moviesync
        </p>
        <p className="mt-5 font-display text-3xl leading-none sm:text-4xl xl:text-5xl">Seat {seat}</p>
        <p className={`mt-2 text-xs ${filled ? "text-rose-100" : "text-zinc-500 dark:text-zinc-400"}`}>
          Row J · Admit one
        </p>
      </div>
      <div
        className={`flex w-16 items-center justify-center border-l-2 border-dashed ${filled ? "border-rose-300/60" : "border-rose-200 dark:border-rose-900/60"}`}
      >
        <span className="font-display text-3xl">{seat}</span>
      </div>
      {/* notches where the stub tears off */}
      <span className={`absolute -top-2.5 right-14 size-5 rounded-full ${PANEL}`} />
      <span className={`absolute -bottom-2.5 right-14 size-5 rounded-full ${PANEL}`} />
    </div>
  );
}

export function TicketPair({ style }: { style?: CSSProperties }) {
  return (
    <div aria-hidden className="enter flex flex-col" style={style}>
      <Ticket seat={7} filled />
      <div className="-mt-8 ml-10 sm:-mt-10 sm:ml-16 xl:ml-24">
        <Ticket seat={8} />
      </div>
    </div>
  );
}

export const AUTH_PANEL_BG = PANEL;
