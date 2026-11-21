"use client";

import { useState, type InputHTMLAttributes } from "react";
import type { FieldError } from "react-hook-form";

type Props = InputHTMLAttributes<HTMLInputElement> & { label: string; error?: FieldError };

// A password field gets a show/hide toggle; every other type renders a plain input.
export function FormField({ label, error, id, type, ...input }: Props) {
  const isPassword = type === "password";
  const [visible, setVisible] = useState(false);

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2.5 outline-none transition-colors duration-150 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 aria-invalid:border-red-500 dark:border-zinc-700 dark:focus:border-rose-400 ${isPassword ? "pr-12" : ""}`}
          {...input}
          type={isPassword && visible ? "text" : type}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Hide password" : "Show password"}
            aria-controls={id}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-zinc-500 transition-colors duration-150 hover:text-rose-600 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-rose-500 dark:text-zinc-400 dark:hover:text-rose-400"
          >
            {visible ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className="text-sm text-red-600 dark:text-red-400">
          {error.message}
        </p>
      )}
    </div>
  );
}

const iconProps = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

function EyeIcon() {
  return (
    <svg {...iconProps}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg {...iconProps}>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 19c-6.5 0-10-7-10-7a18.5 18.5 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c6.5 0 10 7 10 7a18.5 18.5 0 0 1-2.16 3.19" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <path d="M1 1l22 22" />
    </svg>
  );
}
