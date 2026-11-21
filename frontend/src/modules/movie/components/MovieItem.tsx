"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import type { Role } from "@/modules/auth/types";
import { useSwipe } from "../hooks/useSwipe";
import { movieLabel, type Movie } from "../types";
import { MovieActionsMenu } from "./MovieActionsMenu";
import { MovieForm } from "./MovieForm";
import { WatchedPunch } from "./WatchedPunch";

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

// What a swipe does depends on who you are (PROJECT.md rules):
//   owner        -> swipe right: watched / not watched
//   recommender  -> swipe right: edit (until watched), swipe left: remove (asks first)
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
  const [confirming, setConfirming] = useState(false);
  const watched = !!movie.watchedAt;
  const canEdit = isRecommender && !watched;
  const label = movieLabel(movie);
  const owner = capitalize(ownerName);
  const checkboxId = `watched-${movie.id}`;

  const rightAction = isOwner
    ? { label: watched ? "Not watched" : "Watched", run: () => onToggleWatched(movie) }
    : canEdit
      ? { label: "Edit", run: () => setEditing(true) }
      : undefined;
  const leftAction = isRecommender
    ? { label: "Remove", run: () => setConfirming(true) }
    : undefined;

  const swipe = useSwipe({ onSwipeRight: rightAction?.run, onSwipeLeft: leftAction?.run });

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
    <li className="relative overflow-hidden">
      {/* revealed under the row while swiping (touch only) */}
      {swipe.dragging && (
        <div aria-hidden className="absolute inset-0 flex text-sm font-medium text-white">
          <div
            className={`flex flex-1 items-center pl-4 transition-colors duration-150 ${swipe.dx > 0 && rightAction ? (swipe.passed ? "bg-rose-600" : "bg-rose-400") : "bg-transparent"}`}
          >
            {swipe.dx > 0 && rightAction?.label}
          </div>
          <div
            className={`flex flex-1 items-center justify-end pr-4 transition-colors duration-150 ${swipe.dx < 0 && leftAction ? (swipe.passed ? "bg-red-600" : "bg-red-400") : "bg-transparent"}`}
          >
            {swipe.dx < 0 && leftAction?.label}
          </div>
        </div>
      )}

      <div
        {...swipe.handlers}
        style={{ transform: swipe.dx ? `translateX(${swipe.dx}px)` : undefined }}
        className={`relative flex touch-pan-y items-start gap-3 bg-white py-3.5 dark:bg-zinc-900 ${swipe.dragging ? "select-none" : "transition-transform duration-200 ease-out"}`}
      >
        <WatchedPunch
          id={checkboxId}
          checked={watched}
          readOnlyTitle={isOwner ? undefined : `Only ${owner} can tick this`}
          onChange={() => onToggleWatched(movie)}
        />
        <div className="min-w-0 flex-1">
          <label
            htmlFor={checkboxId}
            className={`block break-words ${isOwner ? "cursor-pointer" : ""} ${watched ? "text-zinc-400 line-through decoration-rose-400/70 dark:text-zinc-500" : ""}`}
          >
            <span className="font-medium">{movie.title}</span>{" "}
            <span className="text-zinc-500 dark:text-zinc-400">· {movie.year}</span>
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
              <span className="text-rose-600 dark:text-rose-400">
                {" · "}Watched{" "}
                <time dateTime={movie.watchedAt} title={formatDateTime(movie.watchedAt)}>
                  {formatDate(movie.watchedAt)}
                </time>
              </span>
            )}
          </p>
        </div>
        {isRecommender && (
          <MovieActionsMenu
            label={label}
            canEdit={canEdit}
            onEdit={() => setEditing(true)}
            onRemove={() => setConfirming(true)}
          />
        )}
      </div>

      {confirming && (
        <ConfirmDialog
          open
          title="Remove this pick?"
          description={`"${label}" will be taken off ${owner}'s list.`}
          confirmLabel="Remove"
          cancelLabel="Keep it"
          danger
          onConfirm={() => onRemove(movie)}
          onClose={() => setConfirming(false)}
        />
      )}
    </li>
  );
}
