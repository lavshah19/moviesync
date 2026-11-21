"use client";

import { ROLES } from "@/modules/auth/types";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { useMovies } from "../hooks/useMovies";
import { MovieColumn } from "./MovieColumn";

// The two columns. Must render inside AuthGuard (needs the logged-in user).
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

  if (!columns) {
    return loadError ? (
      <div role="alert" className="flex flex-col items-center gap-3 py-12 text-center">
        <p>{loadError}</p>
        <button
          type="button"
          onClick={() => void reload()}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700"
        >
          Try again
        </button>
      </div>
    ) : (
      <p className="py-12 text-center text-sm text-zinc-500" aria-live="polite">
        Loading movies…
      </p>
    );
  }

  // your own column first
  const order = [user.role, ...ROLES.filter((r) => r !== user.role)];

  return (
    <div className="flex flex-col gap-4">
      {actionError && (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
        >
          <span>{actionError}</span>
          <button
            type="button"
            onClick={dismissActionError}
            aria-label="Dismiss"
            className="font-medium"
          >
            ✕
          </button>
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {order.map((role) => (
          <MovieColumn
            key={role}
            owner={role}
            movies={columns[role]}
            isMine={role === user.role}
            myUserId={user.id}
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
