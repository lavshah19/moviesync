"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiErrorMessage, apiErrorStatus } from "@/lib/apiError";
import { movieApi } from "../api/movie.api";
import type { Movie, MovieColumns } from "../types";

// Replace (or insert) one movie in its column, keeping the rest untouched.
const upsert = (columns: MovieColumns, movie: Movie): MovieColumns => {
  const list = columns[movie.forRole];
  const exists = list.some((m) => m.id === movie.id);
  return {
    ...columns,
    [movie.forRole]: exists ? list.map((m) => (m.id === movie.id ? movie : m)) : [movie, ...list],
  };
};

const without = (columns: MovieColumns, movie: Movie): MovieColumns => ({
  ...columns,
  [movie.forRole]: columns[movie.forRole].filter((m) => m.id !== movie.id),
});

/**
 * Both columns plus every action on them. The server's reply is the source of truth: each
 * action swaps in the movie it returns. Ticking is optimistic so the checkbox feels instant.
 * ponytail: reloads on page load and when the tab becomes visible; sockets later (PROJECT.md).
 */
export function useMovies() {
  const [columns, setColumns] = useState<MovieColumns | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const loadController = useRef<AbortController | null>(null);

  const reload = useCallback(async () => {
    loadController.current?.abort(); // a newer load wins over an older one still in flight
    const controller = (loadController.current = new AbortController());
    try {
      setColumns(await movieApi.list(controller.signal));
      setLoadError(null);
    } catch (err) {
      if (controller.signal.aborted) return;
      setLoadError(apiErrorMessage(err, "Couldn't load the movies."));
    }
  }, []);

  useEffect(() => {
    void reload();
    // the other person may have added/ticked something while this tab was in the background
    const onVisible = () => document.visibilityState === "visible" && void reload();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      loadController.current?.abort();
    };
  }, [reload]);

  // A 404/409 means our copy is stale (the other person deleted or ticked it): resync.
  const handleStale = useCallback(
    (err: unknown) => {
      const status = apiErrorStatus(err);
      if (status === 404 || status === 409) void reload();
    },
    [reload],
  );

  // add/edit throw so the form can show the message under its input
  const add = useCallback(async (text: string) => {
    const movie = await movieApi.create(text);
    setColumns((c) => c && upsert(c, movie));
  }, []);

  const edit = useCallback(
    async (movie: Movie, text: string) => {
      try {
        const updated = await movieApi.update(movie.id, text);
        setColumns((c) => c && upsert(c, updated));
      } catch (err) {
        handleStale(err);
        throw err;
      }
    },
    [handleStale],
  );

  const toggleWatched = useCallback(
    async (movie: Movie) => {
      const watched = !movie.watchedAt;
      setActionError(null);
      setColumns(
        (c) => c && upsert(c, { ...movie, watchedAt: watched ? new Date().toISOString() : null }),
      );
      try {
        const updated = await movieApi.setWatched(movie.id, watched);
        setColumns((c) => c && upsert(c, updated));
      } catch (err) {
        setColumns((c) => c && upsert(c, movie)); // roll back the optimistic tick
        setActionError(apiErrorMessage(err));
        handleStale(err);
      }
    },
    [handleStale],
  );

  const remove = useCallback(async (movie: Movie) => {
    setActionError(null);
    try {
      await movieApi.remove(movie.id);
      setColumns((c) => c && without(c, movie));
    } catch (err) {
      // already gone is what the user wanted anyway
      if (apiErrorStatus(err) === 404) {
        setColumns((c) => c && without(c, movie));
        return;
      }
      setActionError(apiErrorMessage(err));
    }
  }, []);

  return {
    columns,
    loadError,
    actionError,
    dismissActionError: () => setActionError(null),
    reload,
    add,
    edit,
    toggleWatched,
    remove,
  };
}
