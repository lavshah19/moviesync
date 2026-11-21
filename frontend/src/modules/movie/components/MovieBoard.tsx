"use client";

import type { CSSProperties } from "react";
import { ROLES } from "@/modules/auth/types";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { useMovies } from "../hooks/useMovies";
import { MovieColumn } from "./MovieColumn";

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const delay = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

// The greeting and the two columns. Must render inside AuthGuard (needs the logged-in user).
export function MovieBoard() {
  const user = useAuthStore((s) => s.user);
  const {
    columns,
    loadError,
    actionError,
    dismissActionError,
    reload,
    add,
    edit,
    toggleWatched,
    remove,
  } = useMovies();

  if (!user) return null;

  // "jyotsan hamal" -> "Jyotsan" (the h1 capitalises)
  const firstName = user.username.split(" ")[0];
  const other = ROLES.find((r) => r !== user.role) ?? user.role;
  const otherName = capitalize(other);

  if (!columns) {
    return loadError ? (
      <div role="alert" className="flex flex-col items-center gap-3 py-16 text-center">
        <p>{loadError}</p>
        <button
          type="button"
          onClick={() => void reload()}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium transition duration-150 hover:-translate-y-px hover:border-rose-300 active:translate-y-0 active:scale-[0.98] dark:border-zinc-700 dark:hover:border-rose-800"
        >
          Try again
        </button>
      </div>
    ) : (
      <p className="py-16 text-center text-sm text-zinc-500" aria-live="polite">
        Loading your picks…
      </p>
    );
  }

  const forMe = columns[user.role].filter((m) => !m.watchedAt).length;
  const waiting = columns[other].filter((m) => !m.watchedAt).length;

  return (
    <div className="flex flex-col gap-8 md:min-h-0 md:flex-1">
      <div>
        <h1 className="enter font-display text-5xl leading-tight capitalize sm:text-6xl">
          Hi, {firstName}
        </h1>
        <p className="enter mt-2 text-zinc-600 dark:text-zinc-400" style={delay(80)}>
          {plural(forMe, "film")} picked for you to watch ·{" "}
          {columns[other].length === 0
            ? `nothing picked for ${otherName} yet`
            : waiting === 0
              ? `${otherName} is all caught up`
              : `${plural(waiting, "pick")} waiting for ${otherName}`}
        </p>
      </div>

      {actionError && (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/60 dark:text-red-300"
        >
          <span>{actionError}</span>
          <button
            type="button"
            onClick={dismissActionError}
            aria-label="Dismiss"
            className="-m-1 rounded p-1 font-medium hover:bg-red-100 dark:hover:bg-red-900/50"
          >
            ✕
          </button>
        </div>
      )}

      {/* one row that takes the remaining height; columns shrink to fit it (minmax(0,1fr)) */}
      <div className="grid items-start gap-6 md:min-h-0 md:flex-1 md:grid-cols-2 md:grid-rows-[minmax(0,1fr)]">
        {/* your own column first */}
        {[user.role, other].map((role, i) => (
          <MovieColumn
            key={role}
            owner={role}
            movies={columns[role]}
            isMine={role === user.role}
            myUserId={user.id}
            style={delay(160 + i * 80)}
            onAdd={add}
            onEdit={edit}
            onToggleWatched={(m) => void toggleWatched(m)}
            onRemove={(m) => void remove(m)}
          />
        ))}
      </div>
    </div>
  );
}
