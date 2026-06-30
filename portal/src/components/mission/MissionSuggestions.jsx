export default function MissionSuggestions({ suggestions, onChoose }) {
  if (!suggestions?.length) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {suggestions.slice(0, 4).map((suggestion) => (
        <button
          key={suggestion}
          onClick={() => onChoose(suggestion)}
          className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[11px] leading-none text-ink-muted transition hover:border-accent/30 hover:text-accent"
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
}
