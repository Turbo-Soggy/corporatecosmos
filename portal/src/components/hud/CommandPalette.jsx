import { useEffect, useMemo, useRef, useState } from 'react';

// Global directory + fly-to launcher. Opens with ⌘K / Ctrl+K (or the trigger
// pill). Selecting a company sets `selected` upstream, which the CameraRig turns
// into a cinematic fly-to — the scroll timeline briefly hands off to the camera.
export default function CommandPalette({ companies, onSelect }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);

  // Global keyboard shortcut.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const indexed = companies.map((c, index) => ({ c, index }));
    const filtered = q
      ? indexed.filter(({ c }) =>
          `${c.name} ${c.short_name ?? ''} ${c.category ?? ''}`.toLowerCase().includes(q)
        )
      : indexed;
    return filtered.slice(0, 8);
  }, [companies, query]);

  const choose = (index) => {
    onSelect(index);
    setOpen(false);
  };

  const onInputKey = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter' && results[active]) {
      choose(results[active].index);
    }
  };

  return (
    <>
      {/* Trigger pill (top-right). */}
      <button
        onClick={() => setOpen(true)}
        className="pointer-events-auto absolute right-40 top-6 flex items-center gap-2 rounded-full border border-white/10 bg-surface/60 px-3.5 py-2 text-sm text-ink-muted backdrop-blur-xl outline-none transition hover:text-ink focus-visible:ring-2 focus-visible:ring-accent"
        aria-label="Open company search"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        Search
        <kbd className="ml-1 rounded border border-white/15 px-1.5 py-0.5 font-mono text-[10px] text-ink-faint">
          ⌘K
        </kbd>
      </button>

      {/* Modal. */}
      {open && (
        <div className="pointer-events-auto fixed inset-0 z-30 flex items-start justify-center pt-[18vh]">
          <div
            className="absolute inset-0 bg-canvas/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="glass relative w-full max-w-lg overflow-hidden">
            <div className="flex items-center gap-3 border-b border-white/10 px-4">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="text-ink-faint" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                onKeyDown={onInputKey}
                placeholder="Fly to a company…"
                className="w-full bg-transparent py-4 text-base text-ink outline-none placeholder:text-ink-faint"
              />
            </div>

            <ul className="max-h-[46vh] overflow-y-auto py-2">
              {results.length === 0 && (
                <li className="px-4 py-6 text-center text-sm text-ink-faint">No companies match.</li>
              )}
              {results.map(({ c, index }, i) => (
                <li key={index}>
                  <button
                    onMouseEnter={() => setActive(i)}
                    onClick={() => choose(index)}
                    className={`flex w-full items-center justify-between gap-4 px-4 py-2.5 text-left transition ${
                      i === active ? 'bg-white/[0.07]' : ''
                    }`}
                  >
                    <span className="truncate text-sm text-ink">{c.name}</span>
                    <span className="label-mono shrink-0">{c.category || ''}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
