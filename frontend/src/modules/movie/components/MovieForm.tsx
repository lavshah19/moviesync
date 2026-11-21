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
          className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-transparent px-3 py-2.5 text-sm outline-none transition-colors duration-150 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 aria-invalid:border-red-500 dark:border-zinc-700 dark:focus:border-rose-400"
          {...register("movie")}
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="shrink-0 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition duration-150 ease-out hover:-translate-y-px hover:bg-rose-700 active:translate-y-0 active:scale-[0.98] disabled:translate-y-0 disabled:opacity-60"
        >
          {isSubmitting ? "Saving…" : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="shrink-0 rounded-lg border border-zinc-300 px-3 py-2.5 text-sm font-medium transition duration-150 hover:border-rose-300 active:scale-[0.98] dark:border-zinc-700 dark:hover:border-rose-800"
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
