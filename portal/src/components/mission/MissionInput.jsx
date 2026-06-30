export default function MissionInput({ value, onChange, onSubmit, disabled }) {
  return (
    <form onSubmit={onSubmit} className="mt-3 flex gap-2">
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Ask Mission Control..."
        disabled={disabled}
        className="min-w-0 flex-1 rounded-lg border border-white/10 bg-surface-light px-3 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-faint focus:border-accent/50 disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        aria-label="Run mission"
        className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-accent/30 bg-accent/10 text-accent outline-none transition hover:bg-accent/15 focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-40"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 12h14" />
          <path d="m13 6 6 6-6 6" />
        </svg>
      </button>
    </form>
  );
}
