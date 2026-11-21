"use client";

import { useState } from "react";
import type { Role } from "@/modules/auth/types";
import { movieLabel, type Movie } from "../types";
import { MovieForm } from "./MovieForm";

const sameYear = (d: Date) => d.getFullYear() === new Date().getFullYear();
const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    ...(sameYear(d) ? {} : { year: "numeric" }),
  });
};
const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

interface Props {
  movie: Movie;
  isOwner: boolean; // it's in my column: I can tick it
  isRecommender: boolean; // I suggested it: I can edit (until watched) and delete it
  ownerName: Role;
  onToggleWatched: (movie: Movie) => void;
  onEdit: (movie: Movie, text: string) => Promise<void>;
  onRemove: (movie: Movie) => void;
}

export function MovieItem({
  movie,
  isOwner,
  isRecommender,
  ownerName,
  onToggleWatched,
  onEdit,
  onRemove,
}: Props) {
  const [editing, setEditing] = useState(false);
  const watched = !!movie.watchedAt;
  const label = movieLabel(movie);
  const checkboxId = `watched-${movie.id}`;

  if (editing) {
    return (
      <li className="py-3">
        <MovieForm
          id={`edit-${movie.id}`}
          label={`Edit ${label}`}
          defaultValue={label}
          submitLabel="Save"
          onSubmit={async (text) => {
            await onEdit(movie, text);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      </li>
    );
  }

  return (
    <li className="flex items-start gap-3 py-3.5">
      <input
        id={checkboxId}
        type="checkbox"
        checked={watched}
        disabled={!isOwner}
        onChange={() => onToggleWatched(movie)}
        title={isOwner ? undefined : `Only ${capitalize(ownerName)} can tick this`}
        className="mt-1 size-[18px] shrink-0 cursor-pointer accent-rose-600 disabled:cursor-not-allowed disabled:opacity-50 dark:accent-rose-500"
      />
      <div className="min-w-0 flex-1">
        <label
          htmlFor={checkboxId}
          className={`block break-words ${isOwner ? "cursor-pointer" : ""} ${watched ? "text-zinc-400 line-through decoration-rose-400/70 dark:text-zinc-500" : ""}`}
        >
          <span className="font-medium">{movie.title}</span>{" "}
          <span className="text-zinc-500 dark:text-zinc-400">· {movie.year}</span>
          <span className="sr-only">{watched ? " (watched)" : " (not watched)"}</span>
        </label>
        <p className="mt-0.5 text-xs text-zinc-500">
          Suggested{" "}
          <time dateTime={movie.createdAt} title={formatDateTime(movie.createdAt)}>
            {formatDate(movie.createdAt)}
          </time>
          {movie.editedAt && (
            <>
              {" · "}
              <span title={`Edited ${formatDateTime(movie.editedAt)}`}>edited</span>
            </>
          )}
          {movie.watchedAt && (
            <>
              {" · "}Watched{" "}
              <time dateTime={movie.watchedAt} title={formatDateTime(movie.watchedAt)}>
                {formatDate(movie.watchedAt)}
              </time>
            </>
          )}
        </p>
      </div>
      {isRecommender && (
        <div className="flex shrink-0 gap-1">
          {!watched && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              aria-label={`Edit ${label}`}
              className="rounded-md px-2 py-1 text-xs font-medium text-zinc-600 transition duration-150 hover:bg-rose-50 hover:text-rose-700 active:scale-[0.97] dark:text-zinc-400 dark:hover:bg-rose-950/50 dark:hover:text-rose-300"
            >
              Edit
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (window.confirm(`Remove "${label}" from ${capitalize(ownerName)}'s list?`))
                onRemove(movie);
            }}
            aria-label={`Remove ${label}`}
            className="rounded-md px-2 py-1 text-xs font-medium text-red-600 transition duration-150 hover:bg-red-50 active:scale-[0.97] dark:text-red-400 dark:hover:bg-red-950/50"
          >
            Remove
          </button>
        </div>
      )}
    </li>
  );
}
