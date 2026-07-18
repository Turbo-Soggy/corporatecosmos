const TWO_PI = Math.PI * 2;

export const RADIX_CATEGORIES = [
  { code: 'COD', label: 'Coding', blurb: 'Programming languages and implementation fluency.', color: '#5EEAD4' },
  { code: 'DSA', label: 'Data Structures & Algorithms', blurb: 'Algorithmic reasoning, complexity, and core data structures.', color: '#38BDF8' },
  { code: 'OOD', label: 'Object-Oriented Design', blurb: 'Object modeling, design principles, and reusable patterns.', color: '#A78BFA' },
  { code: 'APTI', label: 'Aptitude', blurb: 'Quantitative reasoning and structured problem solving.', color: '#FBBF24' },
  { code: 'COMM', label: 'Communication', blurb: 'Clear writing, presentation, and stakeholder collaboration.', color: '#F472B6' },
  { code: 'AI', label: 'AI & Machine Learning', blurb: 'Machine learning, language models, and intelligent systems.', color: '#E879F9' },
  { code: 'CLOUD', label: 'Cloud & DevOps', blurb: 'Cloud platforms, containers, infrastructure, and delivery.', color: '#34D399' },
  { code: 'SQL', label: 'SQL & Databases', blurb: 'Relational data modeling, querying, and database systems.', color: '#22D3EE' },
  { code: 'SWE', label: 'Software Engineering', blurb: 'Production software practices, APIs, testing, and tooling.', color: '#6366F1' },
  { code: 'SYSD', label: 'System Design', blurb: 'Scalable, reliable, and distributed system architecture.', color: '#A855F7' },
  { code: 'NETW', label: 'Networking', blurb: 'Network protocols, routing, and web communication.', color: '#60A5FA' },
  { code: 'OS', label: 'Operating Systems', blurb: 'Processes, concurrency, memory, and operating systems.', color: '#FB7185' },
].map((category, index) => ({
  ...category,
  angle: (index / 12) * TWO_PI,
}));

export const CATEGORY_CODES = new Set([
  ...RADIX_CATEGORIES.map(({ code }) => code),
  'OTHER',
]);

export const CONFIDENCE = ['high', 'medium', 'low'];

const CONFIDENCE_WEIGHTS = {
  high: 1,
  medium: 0.66,
  low: 0.33,
};

export function confidenceWeight(confidence) {
  return CONFIDENCE_WEIGHTS[confidence] ?? CONFIDENCE_WEIGHTS.low;
}

export function normalizeSkill(raw) {
  if (!raw || typeof raw !== 'object' || raw.skill_name == null) return null;

  const skillName = String(raw.skill_name).trim();
  if (!skillName) return null;

  const rawCode = typeof raw.category_code === 'string'
    ? raw.category_code.trim().toUpperCase()
    : '';
  const rawConfidence = typeof raw.confidence === 'string'
    ? raw.confidence.trim().toLowerCase()
    : '';

  return {
    skill_name: skillName,
    category_code: CATEGORY_CODES.has(rawCode) ? rawCode : 'OTHER',
    evidence: raw.evidence == null ? '' : String(raw.evidence).trim().slice(0, 160),
    confidence: CONFIDENCE.includes(rawConfidence) ? rawConfidence : 'low',
  };
}

function optionalText(value) {
  if (value == null) return null;
  const text = String(value).trim();
  return text || null;
}

export function normalizeSkillList(raw, { sourceType, sourceFile } = {}) {
  const validSourceTypes = ['jd', 'resume'];
  if (
    !raw
    || Array.isArray(raw)
    || typeof raw !== 'object'
    || !Array.isArray(raw.skills)
    || !validSourceTypes.includes(sourceType)
    || (raw.source_type != null && !validSourceTypes.includes(raw.source_type))
  ) {
    throw new TypeError('Expected a skill payload with a skills array and a valid sourceType');
  }

  const skillsByKey = new Map();

  for (const candidate of raw.skills) {
    const skill = normalizeSkill(candidate);
    if (!skill) continue;

    const key = `${skill.category_code}:${skill.skill_name.toLowerCase()}`;
    const current = skillsByKey.get(key);
    if (!current || confidenceWeight(skill.confidence) > confidenceWeight(current.confidence)) {
      skillsByKey.set(key, skill);
    }
  }

  const normalized = {
    source_type: sourceType,
    source_file: optionalText(sourceFile) || optionalText(raw.source_file) || '',
    company: optionalText(raw.company),
    role: optionalText(raw.role),
    skills: [...skillsByKey.values()],
  };

  if (sourceType === 'resume') {
    for (const field of ['education', 'projects', 'experience']) {
      if (Object.prototype.hasOwnProperty.call(raw, field)) normalized[field] = raw[field];
    }
  }

  return normalized;
}

// Literal lowercase surface forms for Phase 2's deterministic matcher. Match these
// against normalized full text with escaped, term-aware boundaries; do not tokenize
// them, because phrases and symbols such as "c#", "tcp/ip", and hyphens are significant.
export const RADIX_LEXICON = {
  COD: [
    'python', 'java', 'javascript', 'typescript', 'c++', 'c#', 'c sharp', 'go', 'golang',
    'rust', 'php', 'coding', 'programming',
  ],
  DSA: [
    'data structures', 'algorithms', 'sorting', 'searching', 'trees', 'graphs',
    'hashing', 'dynamic programming', 'complexity', 'big o',
  ],
  OOD: [
    'object oriented', 'object-oriented', 'design patterns', 'solid', 'inheritance',
    'encapsulation', 'polymorphism', 'abstraction',
  ],
  APTI: [
    'problem solving', 'quantitative', 'analytical reasoning', 'logical reasoning',
    'numerical ability', 'critical thinking',
  ],
  COMM: [
    'communication', 'stakeholder', 'presentation', 'writing', 'collaboration',
    'mentoring', 'leadership', 'cross-functional', 'cross functional',
  ],
  AI: [
    'artificial intelligence', 'machine learning', 'deep learning', 'ai', 'ml', 'nlp',
    'computer vision', 'llm', 'pytorch', 'tensorflow', 'neural networks', 'transformers',
    'generative ai', 'reinforcement learning', 'data science',
  ],
  CLOUD: [
    'cloud', 'aws', 'azure', 'gcp', 'kubernetes', 'k8s', 'docker', 'terraform',
    'devops', 'ci', 'cd', 'serverless',
  ],
  SQL: [
    'sql', 'postgres', 'postgresql', 'mysql', 'database', 'databases', 'query', 'queries',
    'joins', 'relational', 'data modeling', 'etl',
  ],
  SWE: [
    'software engineering', 'software development', 'react', 'node', 'node.js', 'api',
    'apis', 'microservices', 'frontend', 'backend', 'fullstack', 'git', 'testing', 'agile',
    'scrum',
  ],
  SYSD: [
    'system design', 'distributed systems', 'scalability', 'load balancing', 'caching',
    'high availability', 'fault tolerance', 'architecture',
  ],
  NETW: [
    'networking', 'network', 'tcp', 'ip', 'internet protocol', 'tcp/ip', 'tcp ip', 'http',
    'https', 'dns', 'routing', 'wireless', '5g', 'rf',
  ],
  OS: [
    'operating systems', 'linux', 'unix', 'process', 'processes', 'thread', 'threads',
    'concurrency', 'memory', 'memory management', 'virtual memory', 'scheduling',
  ],
};
