export const INTENTS = [
  'focus_company',
  'compare_companies',
  'filter_companies',
  'find_similar',
  'explain_company',
  'explain_position',
  'dashboard_story',
  'show_outliers',
  'data_quality_scan',
  'switch_phase',
  'unknown',
];

export const DEFAULT_OLLAMA_MODEL = 'gemma4:12b';

export const AGENT_LABELS = {
  financial: 'Financial Analyst',
  geographic: 'Geographic Agent',
  sector: 'Sector Analyst',
  integrity: 'Data Integrity Agent',
  similarity: 'Similarity Agent',
  animation: 'Animation Director',
  narrative: 'Narrative Agent',
};

export function createAgentResult(key, finding, extra = {}) {
  return {
    key,
    name: AGENT_LABELS[key] || key,
    status: 'complete',
    finding,
    warnings: [],
    confidence: 0.75,
    ...extra,
  };
}
