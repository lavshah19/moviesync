"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiErrorMessage } from "@/lib/apiError";
import { movieFormSchema, type MovieFormInput } from "../schema/movie.schema";

interface Props {
  id: string;
  label: string; // for screen readers; the placeholder shows the format
  placeholder?: string;
  defaultValue?: string;
  submitLabel: string;
  onSubmit: (text: string) => Promise<void>;
  onCancel?: () => void;
  resetOnSuccess?: boolean;
}

// One input + button, used both to suggest a movie and to edit one.
export function MovieForm({
  id,
  label,
  placeholder = "Titanic - 1997",
  defaultValue = "",
  submitLabel,
  onSubmit,
  onCancel,
  resetOnSuccess,
}: Props) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<MovieFormInput>({
    resolver: zodResolver(movieFormSchema),
    defaultValues: { movie: defaultValue },
  });

  const submit = handleSubmit(async ({ movie }) => {
    try {
      await onSubmit(movie);
      if (resetOnSuccess) {
        reset({ movie: "" });
        setFocus("movie"); // ready for the next suggestion
      }
    } catch (err) {
      setError("movie", { message: apiErrorMessage(err) });
    }
  });

  const errorId = `${id}-error`;
  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-1">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          id={id}
          autoComplete="off"
          placeholder={placeholder}
          aria-invalid={!!errors.movie}
          aria-describedby={errors.movie ? errorId : undefined}
          onKeyDown={(e) => e.key === "Escape" && onCancel?.()}
          className="min-w-0 flex-1 rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-900 aria-invalid:border-red-500 dark:border-zinc-700 dark:focus:border-zinc-100"
          {...register("movie")}
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="shrink-0 rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {isSubmitting ? "Saving…" : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="shrink-0 rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700"
          >
            Cancel
          </button>
        )}
      </div>
      {errors.movie && (
        <p id={errorId} role="alert" className="text-sm text-red-600 dark:text-red-400">
          {errors.movie.message}
        </p>
      )}
    </form>
  );
}
