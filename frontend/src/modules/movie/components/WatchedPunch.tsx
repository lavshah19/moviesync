// The watched toggle, drawn as a ticket punch-hole: a dashed ring when not watched, punched
// (filled rose with a check) when watched. Still a real checkbox underneath, so Space,
// screen readers and the title's <label> all work. Read-only in the other person's column.
export function WatchedPunch({
  id,
  checked,
  readOnlyTitle,
  onChange,
}: {
  id: string;
  checked: boolean;
  readOnlyTitle?: string; // set when this user can't tick it
  onChange: () => void;
}) {
  return (
    <span
      title={readOnlyTitle}
      className="relative mt-0.5 flex size-6 shrink-0 items-center justify-center"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={!!readOnlyTitle}
        onChange={onChange}
        className="peer size-6 cursor-pointer appearance-none rounded-full border-2 border-dashed border-rose-300 bg-transparent transition duration-150 checked:border-solid checked:border-rose-600 checked:bg-rose-600 enabled:hover:border-rose-500 enabled:active:scale-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500 disabled:cursor-default dark:border-rose-800 dark:checked:border-rose-500 dark:checked:bg-rose-500 dark:enabled:hover:border-rose-500"
      />
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
        className="pointer-events-none absolute scale-50 text-white opacity-0 transition duration-150 peer-checked:scale-100 peer-checked:opacity-100"
      >
        <path d="M5 12.5l4.5 4.5L19 7.5" />
      </svg>
    </span>
  );
}
