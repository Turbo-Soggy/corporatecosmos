import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { checkOllamaHealth } from '../../agents/ollamaClient';
import { extractSkills } from '../../agents/skillExtractionAgent';
import { DEFAULT_OLLAMA_MODEL } from '../../agents/missionTypes';
import { useTalentSession } from '../../hooks/useTalentSession';
import { RADIX_CATEGORIES } from '../../lib/radix';
import { extractResumeText } from '../../lib/resumeParse';
import { ArrowUpRight, XIcon } from '../hud/Icon';
import ProfileBuilder from './ProfileBuilder';
import ReadinessScan from './ReadinessScan';
import SkillConstellation from './SkillConstellation';
import SkillMatch from './SkillMatch';

const ACCEPTED_FILES = '.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const TABS = [
  { key: 'match', label: 'JD + Resume Fit' },
  { key: 'scan', label: 'Scan' },
  { key: 'profile', label: 'Profile' },
  { key: 'readiness', label: 'Readiness' },
];
const STAGE_COPY = {
  reading: 'Reading document',
  extracting: 'Extracting RADIX skills',
};
const OTHER_CATEGORY = { code: 'OTHER', label: 'Named Technologies', color: '#94A3B8' };
const DOSSIER_SECTIONS = [
  {
    key: 'education',
    title: 'Education',
    primary: (item) => [item.qualification, item.institution].filter(Boolean).join(' at '),
    secondary: (item) => item.dates,
  },
  {
    key: 'projects',
    title: 'Projects',
    primary: (item) => item.name,
    secondary: (item) => item.summary,
  },
  {
    key: 'experience',
    title: 'Experience',
    primary: (item) => [item.role, item.organization].filter(Boolean).join(' at '),
    secondary: (item) => item.dates,
  },
];

function safeItems(value) {
  return Array.isArray(value) ? value.filter((item) => item && typeof item === 'object') : [];
}

function textValue(value) {
  if (typeof value !== 'string' && (typeof value !== 'number' || !Number.isFinite(value))) return '';
  return String(value).trim();
}

function stableItems(value, fields) {
  return safeItems(value).flatMap((item) => {
    const normalized = Object.fromEntries(fields.map((field) => [field, textValue(item[field])]));
    return Object.values(normalized).some(Boolean) ? [normalized] : [];
  });
}

export function toProfileDraft(result) {
  return {
    source_type: result?.source_type === 'jd' || result?.source_type === 'resume' ? result.source_type : null,
    source_file: textValue(result?.source_file),
    company: textValue(result?.company) || null,
    role: textValue(result?.role) || null,
    skills: safeItems(result?.skills).flatMap((skill) => {
      const normalized = {
        skill_name: textValue(skill.skill_name),
        category_code: textValue(skill.category_code) || 'OTHER',
        evidence: textValue(skill.evidence),
        confidence: textValue(skill.confidence) || 'low',
      };
      return normalized.skill_name ? [normalized] : [];
    }),
    education: stableItems(result?.education, ['qualification', 'institution', 'dates']),
    projects: stableItems(result?.projects, ['name', 'summary']),
    experience: stableItems(result?.experience, ['role', 'organization', 'dates']),
  };
}

function groupSkills(skills) {
  const list = Array.isArray(skills) ? skills : [];
  return [...RADIX_CATEGORIES, OTHER_CATEGORY].flatMap((category) => {
    const items = list.filter((skill) => skill?.category_code === category.code);
    return items.length ? [{ ...category, items }] : [];
  });
}

export default function TalentScanner({
  open,
  canLaunch = true,
  companies = [],
  selected = null,
  result,
  onOpenChange,
  onResult,
  onClear,
}) {
  const {
    profile,
    setProfile,
    persistProfile,
    jd,
    setJd,
    resumeExtract,
    setResumeExtract,
  } = useTalentSession();
  const [tab, setTab] = useState('match');
  const [sourceType, setSourceType] = useState(result?.source_type === 'resume' ? 'resume' : 'jd');
  const [stage, setStage] = useState(result ? 'done' : 'idle');
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [health, setHealth] = useState({
    state: 'checking',
    online: null,
    model: DEFAULT_OLLAMA_MODEL,
  });
  const inputRef = useRef(null);
  const panelRef = useRef(null);

  const busy = stage === 'reading' || stage === 'extracting';
  const groupedSkills = useMemo(() => groupSkills(result?.skills), [result]);
  const dossier = useMemo(() => toProfileDraft(result), [result]);
  const dossierCount = DOSSIER_SECTIONS.reduce(
    (count, section) => count + dossier[section.key].length,
    0
  );

  useEffect(() => {
    let cancelled = false;
    checkOllamaHealth().then((nextHealth) => {
      if (!cancelled) setHealth({ ...nextHealth, state: 'ready' });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!result) return;
    setSourceType(result.source_type === 'resume' ? 'resume' : 'jd');
    setStage('done');
  }, [result]);

  useEffect(() => {
    if (open) requestAnimationFrame(() => panelRef.current?.focus());
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !busy) onOpenChange(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [busy, onOpenChange, open]);

  const clearResult = useCallback(() => {
    onClear();
    setStage('idle');
    setError('');
    setDragging(false);
    if (inputRef.current) inputRef.current.value = '';
  }, [onClear]);

  const publishResult = useCallback((nextResult, action) => {
    if (!action && nextResult?.source_type === 'resume') setResumeExtract(nextResult);
    if (!action && nextResult?.source_type === 'jd') setJd(nextResult);
    onResult(nextResult, action);
  }, [onResult, setJd, setResumeExtract]);

  const chooseSourceType = (nextType) => {
    if (busy || nextType === sourceType) return;
    if (result) clearResult();
    setSourceType(nextType);
  };

  const handleFile = useCallback(async (file) => {
    if (!file || busy) return;
    setError('');
    setDragging(false);
    try {
      setStage('reading');
      const text = await extractResumeText(file);
      setStage('extracting');
      const extractedResult = await extractSkills({
        text,
        sourceType,
        sourceFile: file.name,
        model: health.model || DEFAULT_OLLAMA_MODEL,
      });
      const nextResult = { ...extractedResult, source_text: text };
      setStage('done');
      publishResult(nextResult);
      setTab('match');
    } catch (nextError) {
      setStage('error');
      setError(nextError?.message || 'The document could not be scanned.');
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  }, [busy, health.model, publishResult, sourceType]);

  const onDrop = (event) => {
    event.preventDefault();
    if (!busy) handleFile(event.dataTransfer.files?.[0]);
  };
  const openFilePicker = () => {
    if (!busy) inputRef.current?.click();
  };
  const healthLabel = health.state === 'checking'
    ? 'Checking Gemma Core'
    : health.online ? `${health.model} online` : 'Offline fallback active';
  const modeLabel = sourceType === 'jd' ? 'job description' : 'resume';

  if (!open) {
    if (!canLaunch) return null;
    return (
      <button
        type="button"
        onClick={() => onOpenChange(true)}
        className="label-mono pointer-events-auto absolute left-6 top-[11.5rem] z-20 flex items-center gap-2 rounded-full border border-accent/30 bg-surface/70 px-3.5 py-2 !tracking-normal text-accent shadow-glass backdrop-blur-xl outline-none transition hover:border-accent/60 hover:text-ink focus-visible:ring-2 focus-visible:ring-accent"
        aria-label="Open Talent Scanner"
      >
        <ArrowUpRight className="-rotate-45" />
        Talent Scanner
        {result && <span className="h-1.5 w-1.5 rounded-full bg-pos" aria-hidden="true" />}
      </button>
    );
  }

  return (
    <aside
      ref={panelRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="false"
      aria-labelledby="talent-scanner-title"
      className="pointer-events-auto absolute bottom-3 left-3 right-3 top-16 z-30 flex flex-col overflow-hidden rounded-lg border border-white/10 bg-surface/80 shadow-glass backdrop-blur-2xl outline-none sm:bottom-6 sm:left-6 sm:right-auto sm:w-[30rem] lg:top-6"
    >
      <header className="shrink-0 border-b border-white/[0.08] px-4 py-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div id="talent-scanner-title" className="label-mono text-accent/80">TALENT SCANNER</div>
            <div className="mt-1 flex min-w-0 items-center gap-2">
              <h2 className="truncate text-sm font-semibold text-ink">Gemma Core</h2>
              <span role="status" aria-live="polite" className="flex min-w-0 items-center gap-1.5 text-[11px] text-ink-faint">
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                    health.state === 'checking'
                      ? 'animate-pulse bg-ink-faint'
                      : health.online ? 'bg-pos' : 'bg-amber-300'
                  }`}
                  aria-hidden="true"
                />
                <span className="truncate">{healthLabel}</span>
              </span>
            </div>
          </div>
          <div className="flex shrink-0 gap-1.5">
            <button
              type="button"
              onClick={clearResult}
              disabled={busy || (!result && stage === 'idle')}
              aria-label="Clear Talent Scanner result"
              title="Clear result"
              className="grid h-8 w-8 place-items-center rounded-md border border-white/10 text-ink-muted outline-none transition hover:bg-white/10 hover:text-ink disabled:cursor-not-allowed disabled:opacity-30 focus-visible:ring-2 focus-visible:ring-accent"
            >
              <XIcon />
            </button>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={busy}
              aria-label="Collapse Talent Scanner"
              title="Collapse"
              className="grid h-8 w-8 place-items-center rounded-md border border-white/10 text-ink-muted outline-none transition hover:bg-white/10 hover:text-ink disabled:cursor-wait disabled:opacity-30 focus-visible:ring-2 focus-visible:ring-accent"
            >
              <ArrowUpRight className="rotate-[135deg]" />
            </button>
          </div>
        </div>

        <nav className="mt-3 grid grid-cols-2 gap-1 rounded-lg border border-white/10 bg-canvas/35 p-1 sm:grid-cols-4" aria-label="Talent Scanner sections">
          {TABS.map((item) => (
            <button
              key={item.key}
              type="button"
              aria-current={tab === item.key ? 'page' : undefined}
              onClick={() => setTab(item.key)}
              className={`rounded-md px-2 py-1.5 text-[11px] font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-accent ${
                tab === item.key ? 'bg-accent/12 text-accent' : 'text-ink-faint hover:bg-white/[0.05] hover:text-ink-muted'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {tab === 'scan' && (
          <div className="mt-3 grid grid-cols-2 rounded-lg border border-white/10 bg-canvas/35 p-1" role="group" aria-label="Document type">
            {[
              ['jd', 'JD'],
              ['resume', 'Resume'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={sourceType === value}
                disabled={busy}
                onClick={() => chooseSourceType(value)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-accent ${
                  sourceType === value
                    ? value === 'jd' ? 'bg-amber-300/12 text-amber-200' : 'bg-accent/12 text-accent'
                    : 'text-ink-faint hover:bg-white/[0.05] hover:text-ink-muted'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </header>

      <div className="cosmos-scroll min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {tab === 'scan' && (
          <>
            <div
              role="button"
              tabIndex={busy ? -1 : 0}
              aria-disabled={busy}
              aria-label={`Upload a ${modeLabel} PDF or DOCX`}
              onClick={openFilePicker}
              onKeyDown={(event) => {
                if ((event.key === 'Enter' || event.key === ' ') && !busy) {
                  event.preventDefault();
                  openFilePicker();
                }
              }}
              onDragEnter={(event) => {
                event.preventDefault();
                if (!busy) setDragging(true);
              }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false);
              }}
              onDrop={onDrop}
              className={`grid min-h-28 place-items-center rounded-lg border border-dashed px-4 py-4 text-center outline-none transition focus-visible:ring-2 focus-visible:ring-accent ${
                busy ? 'cursor-wait border-accent/20 bg-accent/[0.03]' : 'cursor-pointer'
              } ${dragging ? 'border-accent bg-accent/[0.07]' : 'border-white/15 hover:border-white/30'}`}
            >
              {busy ? (
                <div role="status" aria-live="polite" className="flex flex-col items-center gap-2.5">
                  <div className="h-7 w-7 animate-spin rounded-full border-2 border-accent/25 border-t-accent" aria-hidden="true" />
                  <span className="label-mono animate-pulse text-accent/90">{STAGE_COPY[stage]}</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5">
                  <span className={sourceType === 'jd' ? 'text-amber-200' : 'text-accent'} aria-hidden="true">
                    <ArrowUpRight className="h-5 w-5 -rotate-45" />
                  </span>
                  <span className="text-sm font-medium text-ink">
                    Drop {sourceType === 'jd' ? 'JD' : 'resume'} or browse
                  </span>
                  <span className="label-mono !tracking-normal">PDF or DOCX</span>
                </div>
              )}
            </div>

            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED_FILES}
              className="hidden"
              onChange={(event) => handleFile(event.target.files?.[0])}
            />

            {stage === 'error' && (
              <div role="alert" className="mt-3 rounded-md border border-neg/25 bg-neg/10 px-3 py-2 text-xs leading-relaxed text-neg">
                {error}
              </div>
            )}

            {result && stage === 'done' && (
              <div className="mt-4 space-y-5">
            <section aria-labelledby="scan-spectrum-title">
              <div className="flex min-w-0 items-center justify-between gap-3">
                <div className="min-w-0">
                  <h3 id="scan-spectrum-title" className="label-mono">Skill Spectrum</h3>
                  <p className="mt-1 truncate text-xs text-ink-muted">{result.source_file || 'Scanned document'}</p>
                </div>
                <span className="flex shrink-0 items-center gap-2">
                  <span className={`rounded-full border px-2 py-1 font-mono text-[9px] uppercase ${
                    result.source === 'gemma'
                      ? 'border-pos/25 bg-pos/10 text-pos'
                      : 'border-amber-300/25 bg-amber-300/10 text-amber-200'
                  }`}>
                    {result.source === 'gemma' ? 'Gemma Core' : 'Offline fallback'}
                  </span>
                  <button
                    type="button"
                    onClick={() => publishResult(result, { type: result.projected ? 'reset-project' : 'project' })}
                    aria-label={result.projected ? 'Reset Cosmos projection' : 'Project onto the Cosmos'}
                    title={result.projected ? 'Reset Cosmos projection' : 'Project onto the Cosmos'}
                    className="inline-flex items-center gap-1 rounded-md border border-accent/25 px-2 py-1 text-[10px] font-medium text-accent outline-none transition hover:border-accent/60 hover:bg-accent/10 focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <ArrowUpRight className="h-3 w-3 -rotate-45" />
                    {result.projected ? 'Reset projection' : 'Project onto the Cosmos'}
                  </button>
                </span>
              </div>
              {(result.company || result.role) && (
                <p className="mt-2 text-xs text-ink-faint">{[result.role, result.company].filter(Boolean).join(' at ')}</p>
              )}
              <SkillConstellation result={result} mode={result.source_type} className="mx-auto mt-2 max-w-[17rem]" />
            </section>

            <section aria-labelledby="scan-skills-title">
              <div className="flex items-baseline justify-between gap-3">
                <h3 id="scan-skills-title" className="label-mono">Extracted Skills</h3>
                <span className="tnum font-mono text-[10px] text-ink-faint">{result.skills?.length || 0}</span>
              </div>
              {groupedSkills.length === 0 ? (
                <div className="mt-2 rounded-md border border-white/10 bg-white/[0.02] px-3 py-4 text-center text-sm text-ink-muted">
                  No RADIX skills were found in this document.
                </div>
              ) : (
                <div className="mt-2.5 space-y-4">
                  {groupedSkills.map((group, groupIndex) => (
                    <section
                      key={group.code}
                      className="animate-rowIn"
                      style={{ animationDelay: `${groupIndex * 35}ms` }}
                      aria-labelledby={`skill-group-${group.code}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: group.color, boxShadow: `0 0 7px ${group.color}` }} aria-hidden="true" />
                        <h4 id={`skill-group-${group.code}`} className="min-w-0 flex-1 truncate text-xs font-medium text-ink">{group.label}</h4>
                        <span className="font-mono text-[10px] text-ink-faint">{group.code} {group.items.length}</span>
                      </div>
                      <ul className="mt-1.5 divide-y divide-white/[0.06] rounded-md border border-white/[0.08] bg-white/[0.02] px-3">
                        {group.items.map((skill, index) => (
                          <li key={`${skill.skill_name}-${index}`} className="py-2.5">
                            <div className="flex items-start justify-between gap-3">
                              <span className="min-w-0 text-sm font-medium text-ink">{skill.skill_name}</span>
                            </div>
                            <p className="mt-1 break-words text-xs leading-relaxed text-ink-faint">{skill.evidence || 'No evidence returned.'}</p>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ))}
                </div>
              )}
            </section>

            {result.source_type === 'resume' && (
              <section aria-labelledby="scan-dossier-title">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 id="scan-dossier-title" className="label-mono">Dossier</h3>
                  <span className="tnum font-mono text-[10px] text-ink-faint">{dossierCount}</span>
                </div>
                {dossierCount === 0 ? (
                  <div className="mt-2 rounded-md border border-white/10 bg-white/[0.02] px-3 py-4 text-center text-sm text-ink-muted">
                    No structured dossier details were extracted.
                  </div>
                ) : (
                  <div className="mt-2.5 space-y-4">
                    {DOSSIER_SECTIONS.map((section) => {
                      const items = dossier[section.key];
                      if (!items.length) return null;
                      return (
                        <section key={section.key} aria-labelledby={`dossier-${section.key}`}>
                          <h4 id={`dossier-${section.key}`} className="label-mono text-ink-faint">{section.title}</h4>
                          <ul className="mt-1.5 space-y-1.5">
                            {items.map((item, index) => (
                              <li key={`${section.key}-${section.primary(item)}-${index}`} className="rounded-md border border-white/[0.08] bg-white/[0.025] px-3 py-2.5">
                                <p className="text-sm font-medium text-ink">{section.primary(item) || 'Untitled entry'}</p>
                                {section.secondary(item) && <p className="mt-1 text-xs leading-relaxed text-ink-faint">{section.secondary(item)}</p>}
                              </li>
                            ))}
                          </ul>
                        </section>
                      );
                    })}
                  </div>
                )}
              </section>
            )}
              </div>
            )}

            {!result && stage === 'idle' && (
              <p className="mt-3 text-center text-xs text-ink-faint">Ready for a {modeLabel} scan.</p>
            )}
          </>
        )}

        {tab === 'profile' && (
          <ProfileBuilder
            profile={profile}
            setProfile={setProfile}
            persistProfile={persistProfile}
            resumeExtract={resumeExtract}
            setResumeExtract={setResumeExtract}
          />
        )}
        {tab === 'readiness' && (
          <ReadinessScan profile={profile} resume={resumeExtract} jd={jd} />
        )}
        {tab === 'match' && (
          <SkillMatch
            profile={profile}
            jd={jd}
            setJd={setJd}
            resume={resumeExtract}
            setResume={setResumeExtract}
          />
        )}
      </div>
    </aside>
  );
}
