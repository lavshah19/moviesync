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
    <li className="flex items-start gap-3 py-3">
      <input
        id={checkboxId}
        type="checkbox"
        checked={watched}
        disabled={!isOwner}
        onChange={() => onToggleWatched(movie)}
        title={isOwner ? undefined : `Only ${capitalize(ownerName)} can tick this`}
        className="mt-1 size-4 shrink-0 accent-zinc-900 disabled:cursor-not-allowed disabled:opacity-60 dark:accent-zinc-100"
      />
      <div className="min-w-0 flex-1">
        <label
          htmlFor={checkboxId}
          className={`block break-words ${isOwner ? "cursor-pointer" : ""} ${watched ? "text-zinc-500 line-through" : ""}`}
        >
          <span className="font-medium">{movie.title}</span>{" "}
          <span className="text-zinc-500">· {movie.year}</span>
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
              className="rounded px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
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
            className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
          >
            Remove
          </button>
        </div>
      )}
    </li>
  );
}
