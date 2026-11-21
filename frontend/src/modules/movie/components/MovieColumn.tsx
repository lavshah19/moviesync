"use client";

import { ROLES, type Role } from "@/modules/auth/types";
import type { Movie } from "../types";
import { MovieForm } from "./MovieForm";
import { MovieItem } from "./MovieItem";

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// To watch first (newest suggestion on top), then watched (most recently watched on top).
const byStatus = (a: Movie, b: Movie) => {
  if (!!a.watchedAt !== !!b.watchedAt) return a.watchedAt ? 1 : -1;
  return a.watchedAt && b.watchedAt
    ? b.watchedAt.localeCompare(a.watchedAt)
    : b.createdAt.localeCompare(a.createdAt);
};

interface Props {
  owner: Role;
  movies: Movie[];
  isMine: boolean;
  myUserId: string;
  onAdd: (text: string) => Promise<void>;
  onToggleWatched: (movie: Movie) => void;
  onEdit: (movie: Movie, text: string) => Promise<void>;
  onRemove: (movie: Movie) => void;
}

export function MovieColumn({ owner, movies, isMine, myUserId, onAdd, ...actions }: Props) {
  const name = capitalize(owner);
  // your column holds what the other person suggested to you
  const otherName = capitalize(ROLES.find((r) => r !== owner) ?? "");
  const toWatch = movies.filter((m) => !m.watchedAt).length;
  const headingId = `column-${owner}`;

  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col gap-4 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
    >
      <header>
        <h2 id={headingId} className="text-lg font-semibold">
          {isMine ? `Picked by ${otherName}` : `Your picks for ${name}`}
        </h2>
        <p className="text-sm text-zinc-500">
          {toWatch} to watch · {movies.length - toWatch} watched
        </p>
      </header>

      {/* you can only suggest into the other person's column */}
      {!isMine && (
        <MovieForm
          id={`add-${owner}`}
          label={`Suggest a movie for ${name}`}
          placeholder={`Suggest for ${name}: Titanic - 1997`}
          submitLabel="Suggest"
          onSubmit={onAdd}
          resetOnSuccess
        />
      )}

      {movies.length === 0 ? (
        <p className="py-6 text-center text-sm text-zinc-500">
          {isMine ? "Nothing suggested for you yet." : `Suggest ${name}'s first movie.`}
        </p>
      ) : (
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {[...movies].sort(byStatus).map((movie) => (
            <MovieItem
              key={movie.id}
              movie={movie}
              isOwner={isMine}
              isRecommender={movie.addedBy === myUserId}
              ownerName={owner}
              {...actions}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
