// On-device résumé → company matching. Pure functions, deterministic, no network.
// Two signals are combined per company:
//   1. skill/keyword OVERLAP with the company's text (idf-weighted so rare,
//      meaningful terms count more than boilerplate),
//   2. SECTOR AFFINITY — how strongly the résumé's detected skills point at the
//      sector the company sits in.
// Output is a ranked list with a friendly alignment %, the shared terms, and
// short human-readable reasons that the HUD renders verbatim.

import { SECTOR_COLORS } from './sectors';

// Highlight (constellation) + tour sizing.
export const TOP_N = 14; // companies that "ignite" as your constellation
export const TOUR_N = 7; // stops on the auto launch sequence

// --- Skill lexicon: which terms imply which sector ---------------------------
// Keys MUST match the sector buckets in sectors.js. Multi-word phrases are
// matched against the whole résumé text; single words against its token set.
const SKILL_LEXICON = {
  'SaaS, Cloud & Security': [
    'cloud', 'aws', 'azure', 'gcp', 'kubernetes', 'docker', 'devops', 'microservices',
    'react', 'javascript', 'typescript', 'node', 'frontend', 'backend', 'fullstack',
    'software', 'saas', 'api', 'golang', 'rust', 'cybersecurity', 'security', 'linux',
    'ci', 'cd', 'kubernetes', 'terraform', 'system design', 'distributed systems',
  ],
  'AI & Research': [
    'machine learning', 'deep learning', 'ai', 'ml', 'nlp', 'computer vision', 'llm',
    'pytorch', 'tensorflow', 'data science', 'neural networks', 'reinforcement learning',
    'research', 'generative ai', 'transformers', 'data scientist',
  ],
  'FinTech & Banking': [
    'finance', 'financial', 'fintech', 'payments', 'banking', 'trading', 'investment',
    'accounting', 'equity', 'risk', 'blockchain', 'underwriting', 'lending', 'wealth',
    'financial modeling', 'portfolio', 'quant', 'audit',
  ],
  'Healthcare & HealthTech': [
    'health', 'clinical', 'medical', 'pharma', 'biotech', 'patient', 'healthcare',
    'genomics', 'nursing', 'diagnostics', 'bioinformatics', 'life sciences',
  ],
  'IT Services & Consulting': [
    'consulting', 'sap', 'salesforce', 'erp', 'crm', 'implementation', 'agile', 'scrum',
    'project management', 'business analyst', 'stakeholder', 'pmp', 'delivery',
    'digital transformation', 'analytics', 'sql', 'data engineering', 'etl', 'powerbi',
    'tableau',
  ],
  'Logistics & Mobility': [
    'logistics', 'supply chain', 'fleet', 'mobility', 'automotive', 'transportation',
    'warehouse', 'operations', 'procurement', 'inventory', 'ev', 'manufacturing',
  ],
  'Retail & E-commerce': [
    'retail', 'ecommerce', 'merchandising', 'marketplace', 'consumer', 'brand',
    'marketing', 'shopify', 'growth', 'seo', 'category management', 'd2c',
  ],
  EdTech: [
    'teaching', 'curriculum', 'education', 'edtech', 'instructional', 'pedagogy',
    'e-learning', 'training', 'mentoring',
  ],
  'Aerospace & Defence': [
    'aerospace', 'aeronautical', 'mechanical', 'defence', 'defense', 'avionics',
    'satellite', 'propulsion', 'cad', 'embedded', 'robotics',
  ],
  'Telecom & Media': [
    'telecom', 'network', '5g', 'media', 'content', 'journalism', 'broadcast', 'video',
    'rf', 'wireless',
  ],
};

// Flat set of every single-word skill term (for marking "shared" terms as skills).
const SKILL_WORDS = new Set(
  Object.values(SKILL_LEXICON)
    .flat()
    .filter((t) => !t.includes(' '))
);

// Short tokens that are meaningful despite their length (won't be length-filtered).
const SHORT_OK = new Set([
  'ai', 'ml', 'ux', 'ui', 'qa', 'hr', 'js', 'sql', 'aws', 'gcp', 'sap', 'erp', 'crm',
  'etl', 'api', 'nlp', 'llm', 'ci', 'cd', 'k8s', 'css', 'php', 'ios', 'rf', '5g',
]);

const STOPWORDS = new Set(
  ('a an the and or for to of in on at by with from as is are was were be been being this ' +
    'that these those it its into over under out up down off above below not no nor so than ' +
    'too very can will just should now also their them they we our you your i me my he she his ' +
    'her work working worked experience experienced skills skill team teams project projects ' +
    'company companies role roles using used use new strong good great years year month months ' +
    'including include included across within while when where which who whom what how all any ' +
    'more most other some such only own same more about both each few have has had do does did ' +
    'responsible responsibilities led managed built developed designed created delivered ' +
    'name email phone address linkedin github summary objective education university college ' +
    'bachelor master degree gpa present current resume curriculum vitae').split(/\s+/)
);

const SECTOR_KEYS = Object.keys(SECTOR_COLORS).filter((k) => k !== 'Other');

// Company text fields concatenated into each company's matching "document".
const CORPUS_FIELDS = [
  'category', 'focus_sectors', 'offerings_description', 'overview_text', 'key_competitors',
  'top_customers', 'work_culture_summary', 'flexibility_level', 'operating_countries',
  'headquarters_address', 'profitability_status',
];

function normalize(text) {
  return ` ${String(text || '').toLowerCase().replace(/[^a-z0-9+#\s]/g, ' ').replace(/\s+/g, ' ').trim()} `;
}

function tokenize(normText) {
  const set = new Set();
  for (const raw of normText.split(' ')) {
    const t = raw.trim();
    if (!t || STOPWORDS.has(t)) continue;
    if (t.length >= 3 || SHORT_OK.has(t)) set.add(t);
  }
  return set;
}

// Does a (possibly multi-word) lexicon term appear in the résumé?
function hasTerm(term, normText, tokens) {
  return term.includes(' ') ? normText.includes(` ${term} `) : tokens.has(term);
}

function titleish(t) {
  if (t === t.toUpperCase()) return t; // already an acronym
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/** Parse the résumé text into a skill/sector signature. */
export function buildProfile(text) {
  const normText = normalize(text);
  const tokens = tokenize(normText);

  const detectedSkills = [];
  const sectorRaw = {};
  for (const sector of SECTOR_KEYS) {
    let count = 0;
    for (const term of SKILL_LEXICON[sector]) {
      if (hasTerm(term, normText, tokens)) {
        count += 1;
        if (!detectedSkills.includes(term)) detectedSkills.push(term);
      }
    }
    sectorRaw[sector] = count;
  }

  const maxSector = Math.max(0, ...Object.values(sectorRaw));
  const sectorWeights = {};
  for (const sector of SECTOR_KEYS) {
    sectorWeights[sector] = maxSector > 0 ? sectorRaw[sector] / maxSector : 0;
  }

  const topSectors = [...SECTOR_KEYS]
    .filter((s) => sectorRaw[s] > 0)
    .sort((a, b) => sectorRaw[b] - sectorRaw[a])
    .slice(0, 4);

  return {
    tokens,
    sectorWeights,
    topSectors,
    detectedSkills: detectedSkills.slice(0, 18),
    weak: detectedSkills.length < 2,
  };
}

// Build the company corpus (token sets + idf) once per analysis.
function buildCorpus(companies) {
  const df = new Map();
  const docs = companies.map((c) => {
    const text = CORPUS_FIELDS.map((f) => c[f]).filter(Boolean).join(' ') +
      ' ' + (c.sector || '');
    const tokens = tokenize(normalize(text));
    for (const t of tokens) df.set(t, (df.get(t) || 0) + 1);
    return tokens;
  });
  const N = companies.length || 1;
  const idf = new Map();
  for (const [t, freq] of df) idf.set(t, Math.log(1 + N / freq));
  return { docs, idf };
}

/**
 * Score every company against a parsed profile. Returns a ranked array (best
 * first) of { index, name, sector, alignment, fit, sharedTerms, reasons,
 * compatible }, plus a small summary.
 */
export function scoreCompanies(profile, companies) {
  const { docs, idf } = buildCorpus(companies);

  const rows = companies.map((c, index) => {
    const tokens = docs[index];
    const shared = [];
    let overlapRaw = 0;
    for (const t of profile.tokens) {
      if (tokens.has(t)) {
        const w = idf.get(t) || 0;
        overlapRaw += w;
        shared.push({ term: t, w, skill: SKILL_WORDS.has(t) });
      }
    }
    const sectorAffinity = profile.sectorWeights[c.sector] || 0;
    return { index, name: c.short_name || c.name, sector: c.sector, overlapRaw, sectorAffinity, shared };
  });

  const maxOverlap = Math.max(1e-6, ...rows.map((r) => r.overlapRaw));

  for (const r of rows) {
    const overlapNorm = r.overlapRaw / maxOverlap; // 0..1
    r.fit = 0.5 * r.sectorAffinity + 0.5 * overlapNorm;
  }

  const maxFit = Math.max(1e-6, ...rows.map((r) => r.fit));
  const ranked = rows
    .map((r) => {
      // Friendly alignment %: scaled relative to the strongest match (tops near
      // 96), with a gentle curve so strong secondary matches don't read too low.
      const alignment = Math.round(Math.min(96, Math.pow(r.fit / maxFit, 0.65) * 96));

      // Shared terms for display: skills first, then by idf weight.
      const sharedTerms = r.shared
        .sort((a, b) => (b.skill - a.skill) || (b.w - a.w))
        .slice(0, 4)
        .map((s) => titleish(s.term));

      const reasons = [];
      if (r.sectorAffinity >= 0.5) reasons.push(`Strong fit for your ${r.sector} focus`);
      else if (r.sectorAffinity > 0) reasons.push(`Overlaps your ${r.sector} interest`);
      if (sharedTerms.length) reasons.push(`Shared: ${sharedTerms.slice(0, 3).join(', ')}`);
      if (!reasons.length) reasons.push('Adjacent to your profile');

      return {
        index: r.index,
        name: r.name,
        sector: r.sector,
        fit: r.fit,
        alignment,
        sharedTerms,
        reasons,
      };
    })
    .sort((a, b) => b.fit - a.fit || a.index - b.index);

  ranked.forEach((r, rank) => {
    r.rank = rank;
    r.compatible = rank < TOP_N && r.fit > 0;
  });

  return ranked;
}

/** One-shot: text → { profile, ranked }. */
export function analyzeResume(text, companies) {
  const profile = buildProfile(text);
  const ranked = scoreCompanies(profile, companies);
  return { profile, ranked };
}
