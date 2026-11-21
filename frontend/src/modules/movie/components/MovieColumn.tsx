"use client";

import type { CSSProperties } from "react";
import { ROLES, type Role } from "@/modules/auth/types";
import type { Movie } from "../types";
import { MovieForm } from "./MovieForm";
import { MovieItem } from "./MovieItem";

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// Each person keeps the same seat on every screen (matches the tickets on the auth page).
const SEAT: Record<Role, number> = { jyotsan: 7, dipika: 8 };

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
  style?: CSSProperties;
  onAdd: (text: string) => Promise<void>;
  onToggleWatched: (movie: Movie) => void;
  onEdit: (movie: Movie, text: string) => Promise<void>;
  onRemove: (movie: Movie) => void;
}

// A column drawn as a ticket: the header is the stub, torn off along the dashed line.
export function MovieColumn({ owner, movies, isMine, myUserId, style, onAdd, ...actions }: Props) {
  const name = capitalize(owner);
  // your column holds what the other person picked for you
  const otherName = capitalize(ROLES.find((r) => r !== owner) ?? "");
  const toWatch = movies.filter((m) => !m.watchedAt).length;
  const headingId = `column-${owner}`;

  return (
    <section
      aria-labelledby={headingId}
      style={style}
      className="enter flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm md:max-h-full ring-1 ring-rose-200/70 dark:bg-zinc-900 dark:ring-rose-900/40"
    >
      <header
        className={`px-6 pt-6 pb-7 ${isMine ? "bg-rose-600 text-white" : "bg-rose-50 text-zinc-900 dark:bg-[#1c1114] dark:text-zinc-100"}`}
      >
        <p
          className={`text-xs font-medium ${isMine ? "text-rose-100" : "text-rose-700 dark:text-rose-300"}`}
        >
          Row J · Seat {SEAT[owner]}
        </p>
        <h2 id={headingId} className="mt-2 font-display text-3xl leading-tight sm:text-4xl">
          {isMine ? `Picked by ${otherName}` : `Your picks for ${name}`}
        </h2>
        <p
          className={`mt-1 text-sm ${isMine ? "text-rose-100" : "text-zinc-600 dark:text-zinc-400"}`}
        >
          {toWatch} to watch · {movies.length - toWatch} watched
        </p>
      </header>

      {/* the tear line: half-circle notches cut from both edges (they take the page colour) */}
      <div className="relative">
        <div
          className={`border-t-2 border-dashed ${isMine ? "border-rose-300" : "border-rose-200 dark:border-rose-900/60"}`}
        />
        <span className="absolute -top-3 -left-3 size-6 rounded-full bg-white dark:bg-zinc-950" />
        <span className="absolute -top-3 -right-3 size-6 rounded-full bg-white dark:bg-zinc-950" />
      </div>

      <div className="flex min-h-0 flex-col gap-4 px-6 pt-5 pb-6">
        {/* you can only suggest into the other person's column */}
        {!isMine && (
          <MovieForm
            id={`add-${owner}`}
            label={`Suggest a movie for ${name}`}
            placeholder={`A film for ${name}, e.g. Titanic - 1997`}
            submitLabel="Suggest"
            onSubmit={onAdd}
            resetOnSuccess
          />
        )}

        {movies.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
            {isMine
              ? `Nothing picked for you yet. ${otherName} gets the first pick.`
              : `Pick ${name}'s first film.`}
          </p>
        ) : (
          // Scrolls inside the ticket: md+ fills the column's share of the screen; on a phone it's
          // capped so one long list doesn't push the other column far down. min-h-40 lets a very
          // short window fall back to page scroll instead of squashing the list to nothing.
          // `relative` keeps the rows' absolutely-positioned sr-only text inside the scroll box;
          // without it they escape the clip and stretch the whole page.
          <ul className="relative -mr-3 max-h-[60dvh] min-h-0 divide-y divide-zinc-100 overflow-y-auto overscroll-contain pr-3 [scrollbar-color:var(--color-rose-300)_transparent] [scrollbar-width:thin] md:max-h-none md:min-h-40 dark:divide-zinc-800 dark:[scrollbar-color:var(--color-rose-900)_transparent]">
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
      </div>
    </section>
  );
}
