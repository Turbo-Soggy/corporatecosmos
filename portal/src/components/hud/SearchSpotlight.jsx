import { useMemo } from 'react';
import { matchIndices } from '../../lib/search';

// Always-visible, top-center filter. Typing dims non-matching nodes and blazes the matches
// (handled in CompanyNodes via the shared `query`); Enter flies the camera to the first match.
export default function SearchSpotlight({ query, onQuery, layouts, onSelect }) {
  const matches = useMemo(() => matchIndices(layouts.meta, query), [layouts, query]);
  const count = matches ? matches.size : 0;
  const first = matches && matches.size ? matches.values().next().value : null;
  const active = query.trim().length > 0;

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && first != null) onSelect(first);
    else if (e.key === 'Escape') onQuery('');
  };

  return (
    <div className="pointer-events-none absolute left-1/2 top-6 z-20 -translate-x-1/2">
      <div
        className={`pointer-events-auto flex items-center gap-2 rounded-full border bg-surface/60 px-3.5 py-2 backdrop-blur-xl transition ${
          active ? 'border-accent/40' : 'border-white/10'
        }`}
      >
        <svg
          width="15" height="15" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"
          className="text-ink-faint" aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Filter the cosmos…"
          aria-label="Filter companies"
          className="w-44 bg-transparent text-sm text-ink outline-none placeholder:text-ink-faint sm:w-64"
        />
        {active && (
          <span className="label-mono shrink-0 whitespace-nowrap pl-1 text-ink-faint">
            {count ? `${count} match${count === 1 ? '' : 'es'}` : 'no match'}
          </span>
        )}
      </div>
      {active && count > 0 && (
        <div className="label-mono mt-1.5 text-center text-ink-faint">↵ fly to first</div>
      )}
    </div>
  );
}
