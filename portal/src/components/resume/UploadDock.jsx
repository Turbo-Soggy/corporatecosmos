import { useCallback, useRef, useState } from 'react';
import { analyzeResume } from '../../lib/resumeMatch';
import { extractResumeText } from '../../lib/resumeParse';

// The résumé entry point, themed as a "docking bay": a launcher pill (bottom-left)
// opens a drop modal. Files are parsed and scored entirely on-device — the bytes
// never leave the browser. On success we hand the { profile, ranked } result up.

function TrajectoryIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 20c8 0 14-6 14-14" />
      <path d="M14 6h4v4" />
      <circle cx="5" cy="19" r="1.6" />
    </svg>
  );
}

const STAGE_LABEL = {
  reading: 'Reading your résumé…',
  scoring: 'Charting your trajectory…',
};

export default function UploadDock({ open, setOpen, hasResult, companies, onResult }) {
  const [stage, setStage] = useState('idle'); // idle | reading | scoring | error
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const handleFile = useCallback(
    async (file) => {
      if (!file) return;
      setError('');
      try {
        setStage('reading');
        const text = await extractResumeText(file);
        setStage('scoring');
        // Yield a frame so the "scoring" state paints before the sync scoring pass.
        await new Promise((r) => setTimeout(r, 30));
        const result = analyzeResume(text, companies);
        result.fileName = file.name;
        setStage('idle');
        setOpen(false);
        onResult(result);
      } catch (err) {
        setStage('error');
        setError(err?.message || 'Something went wrong reading that file.');
      }
    },
    [companies, onResult, setOpen]
  );

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const busy = stage === 'reading' || stage === 'scoring';

  return (
    <>
      {!hasResult && (
        <button
          onClick={() => setOpen(true)}
          className="label-mono pointer-events-auto absolute bottom-20 left-6 z-20 flex items-center gap-2 rounded-full border border-accent/30 bg-surface/60 px-3.5 py-2 !tracking-normal text-accent backdrop-blur-xl outline-none transition hover:border-accent/60 hover:text-ink focus-visible:ring-2 focus-visible:ring-accent"
        >
          <TrajectoryIcon />
          Chart your trajectory
        </button>
      )}

      {open && (
        <div className="pointer-events-auto fixed inset-0 z-40 flex items-center justify-center">
          <div className="absolute inset-0 bg-canvas/70 backdrop-blur-sm" onClick={() => !busy && setOpen(false)} />

          <div className="glass relative w-full max-w-lg overflow-hidden p-7">
            <div className="flex items-start justify-between">
              <div>
                <div className="label-mono text-accent/80">Docking Bay</div>
                <h2 className="mt-1.5 font-display text-xl font-semibold text-ink">
                  Chart your trajectory
                </h2>
                <p className="mt-1 text-sm text-ink-muted">
                  Drop your résumé and the cosmos reveals your aligned companies.
                </p>
              </div>
              {!busy && (
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/15 text-ink-muted outline-none transition hover:bg-white/10 hover:text-ink"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                </button>
              )}
            </div>

            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => !busy && inputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !busy) inputRef.current?.click(); }}
              className={`mt-6 grid cursor-pointer place-items-center rounded-2xl border border-dashed px-6 py-10 text-center transition ${
                dragging ? 'border-accent bg-accent/5' : 'border-white/15 hover:border-white/30'
              } ${busy ? 'cursor-wait' : ''}`}
            >
              {busy ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
                  <div className="label-mono animate-pulse text-accent/90">{STAGE_LABEL[stage]}</div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="grid h-12 w-12 place-items-center rounded-full border border-accent/30 text-accent">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16V4M7 9l5-5 5 5" /><path d="M5 20h14" /></svg>
                  </div>
                  <div className="text-sm font-medium text-ink">Drop résumé here or click to browse</div>
                  <div className="label-mono">PDF or Word · parsed on-device, never uploaded</div>
                </div>
              )}
            </div>

            {stage === 'error' && (
              <p className="mt-4 text-sm text-neg">{error}</p>
            )}

            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </div>
        </div>
      )}
    </>
  );
}
