import type { InputHTMLAttributes } from "react";
import type { FieldError } from "react-hook-form";

type Props = InputHTMLAttributes<HTMLInputElement> & { label: string; error?: FieldError };

export function FormField({ label, error, id, ...input }: Props) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className="rounded-md border border-zinc-300 bg-transparent px-3 py-2 outline-none focus:border-zinc-900 aria-invalid:border-red-500 dark:border-zinc-700 dark:focus:border-zinc-100"
        {...input}
      />
      {error && (
        <p id={`${id}-error`} className="text-sm text-red-600 dark:text-red-400">
          {error.message}
        </p>
      )}
    </div>
  );
}
