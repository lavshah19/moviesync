// The form's main button, drawn as a ticket: the label is the ticket, the arrow is the stub,
// torn off along the dashed line. The notches take the page colour (form side = body bg).
interface Props {
  pending: boolean;
  pendingLabel?: string;
  children: string;
}

export function SubmitButton({ pending, pendingLabel = "Please wait…", children }: Props) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="group relative flex w-full items-stretch overflow-hidden rounded-xl bg-rose-600 text-white shadow-md shadow-rose-900/15 transition duration-150 ease-out hover:-translate-y-px hover:bg-rose-700 active:translate-y-0 active:scale-[0.98] disabled:translate-y-0 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
    >
      <span className="flex-1 py-3 text-center font-medium">
        {pending ? pendingLabel : children}
      </span>
      <span
        aria-hidden
        className="flex w-14 items-center justify-center border-l-2 border-dashed border-rose-300/70"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-transform duration-150 ease-out group-hover:translate-x-0.5"
        >
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </span>
      {/* notches where the stub tears off */}
      <span
        aria-hidden
        className="absolute -top-2 right-12 size-4 rounded-full bg-white dark:bg-zinc-950"
      />
      <span
        aria-hidden
        className="absolute -bottom-2 right-12 size-4 rounded-full bg-white dark:bg-zinc-950"
      />
    </button>
  );
}
