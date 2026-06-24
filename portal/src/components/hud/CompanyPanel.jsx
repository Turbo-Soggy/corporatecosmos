import { XIcon } from './Icon';
import { toTags } from '../../lib/formatDisplay';

// Full profile drawer that slides in when a node is clicked. Reads straight
// from the in-memory full_json record — zero extra queries.

const FIELD_GROUPS = [
  {
    title: 'Financials',
    fields: [
      ['Annual Revenue', 'annual_revenue', 'num'],
      ['Valuation', 'valuation', 'num'],
      ['YoY Growth', 'yoy_growth_rate', 'num'],
      ['Profitability', 'profitability_status', 'text'],
      ['Net Promoter Score', 'net_promoter_score', 'num'],
    ],
  },
  {
    title: 'People & Culture',
    fields: [
      ['CEO', 'ceo_name', 'text'],
      ['Employees', 'employee_size', 'num'],
      ['Work Culture', 'work_culture_summary', 'text'],
      ['Flexibility', 'flexibility_level', 'text'],
      ['Burnout Risk', 'burnout_risk', 'text'],
    ],
  },
  {
    title: 'Business',
    fields: [
      ['Focus Sectors', 'focus_sectors', 'tags'],
      ['Offerings', 'offerings_description', 'text'],
      ['Top Customers', 'top_customers', 'tags'],
      ['Key Competitors', 'key_competitors', 'tags'],
    ],
  },
  {
    title: 'Logistics',
    fields: [
      ['HQ', 'headquarters_address', 'text'],
      ['Offices', 'office_count', 'num'],
      ['Operating Countries', 'operating_countries', 'tags'],
    ],
  },
];

function FieldValue({ kind, value }) {
  if (kind === 'tags') {
    const tags = toTags(value);
    if (tags.length === 0) return <span className="text-ink">{String(value)}</span>;
    return (
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag, i) => (
          <span
            key={i}
            className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-xs text-ink-muted"
          >
            {tag}
          </span>
        ))}
      </div>
    );
  }
  if (kind === 'num') {
    // Pre-formatted upstream in formatCompanyData — the component never formats.
    return <span className="tnum font-medium text-ink">{value}</span>;
  }
  return <span className="font-medium leading-relaxed text-ink">{String(value)}</span>;
}

export default function CompanyPanel({ company, onClose }) {
  const open = Boolean(company);

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label={company ? `${company.name} profile` : undefined}
      aria-hidden={!open}
      className={`pointer-events-auto absolute right-0 top-0 h-full w-full max-w-md transform transition-transform duration-500 ease-out ${
        open ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="cosmos-scroll glass-strong relative h-full overflow-y-auto rounded-none border-l">
        {/* Scrim: darkens toward the content edge so text stays legible over a
            bright, glowing scene without making the glass fully opaque. */}
        <div className="pointer-events-none sticky top-0 -mb-[100vh] h-full w-full bg-gradient-to-l from-canvas/55 via-canvas/25 to-transparent" />
        {company && (
          <div className="relative p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="label-mono text-accent/80">{company.category || 'COMPANY'}</div>
                <h2 className="mt-1.5 font-display text-2xl font-semibold leading-tight text-ink">
                  {company.name}
                </h2>
                {company.headquarters_address && (
                  <p className="mt-1 text-sm text-ink-muted">{company.headquarters_address}</p>
                )}
              </div>
              <button
                onClick={onClose}
                aria-label="Close profile"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/15 text-ink-muted outline-none transition hover:bg-white/10 hover:text-ink focus-visible:ring-2 focus-visible:ring-accent"
              >
                <XIcon />
              </button>
            </div>

            {company.overview_text && (
              <p className="mt-5 text-sm leading-relaxed text-ink-muted">{company.overview_text}</p>
            )}

            <div className="mt-7 space-y-7">
              {FIELD_GROUPS.map((group, gi) => {
                const present = group.fields.filter(([, key]) => company[key]);
                if (present.length === 0) return null;
                return (
                  <section
                    key={group.title}
                    className="animate-rowIn"
                    style={{ animationDelay: `${gi * 60}ms` }}
                  >
                    <h3 className="label-mono">{group.title}</h3>
                    <dl className="mt-2.5 divide-y divide-white/[0.06]">
                      {present.map(([label, key, kind]) => (
                        <div key={key} className="flex gap-4 py-2.5 text-sm">
                          <dt className="w-32 shrink-0 pt-0.5 text-ink-faint">{label}</dt>
                          <dd className="min-w-0 flex-1">
                            <FieldValue
                              kind={kind}
                              value={kind === 'num' ? (company.display?.[key] ?? '—') : company[key]}
                            />
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </section>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
