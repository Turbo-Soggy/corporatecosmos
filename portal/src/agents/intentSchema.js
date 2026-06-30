import { INTENTS } from './missionTypes';
import {
  findCompaniesInCommand,
  findCompanyIndices,
  inferMetric,
  inferRegionFilter,
  inferSectorFilter,
  normalizeText,
  uniqueIndices,
} from './missionActions';

function emptyIntent() {
  return {
    intent: 'unknown',
    companyNames: [],
    companyIndices: [],
    filters: {
      country: null,
      region: null,
      sector: null,
      currency: null,
      metric: null,
    },
    sort: {
      metric: null,
      direction: 'desc',
    },
    phase: null,
    needsClarification: false,
    clarifyingQuestion: null,
    source: 'local',
  };
}

export function normalizeIntent(raw, companies, command, selectedIndex = null) {
  const base = emptyIntent();
  const incoming = raw && typeof raw === 'object' ? raw : {};
  const intent = INTENTS.includes(incoming.intent) ? incoming.intent : base.intent;
  const companyNames = Array.isArray(incoming.companyNames) ? incoming.companyNames.filter(Boolean) : [];
  const commandHits = findCompaniesInCommand(companies, command);
  const namedHits = findCompanyIndices(companies, companyNames);
  const companyIndices = uniqueIndices([...namedHits, ...commandHits], companies.length);
  const filters = { ...base.filters, ...(incoming.filters || {}) };
  const sort = { ...base.sort, ...(incoming.sort || {}) };

  if (!filters.metric) filters.metric = inferMetric(command);
  if (!sort.metric) sort.metric = filters.metric;

  if ((intent === 'explain_company' || intent === 'explain_position' || intent === 'find_similar') && !companyIndices.length && typeof selectedIndex === 'number') {
    companyIndices.push(selectedIndex);
  }

  return {
    ...base,
    ...incoming,
    intent,
    companyNames,
    companyIndices,
    filters,
    sort,
    source: incoming.source || 'gemma',
  };
}

export function parseIntentLocally(command, companies, selectedIndex = null) {
  const q = normalizeText(command);
  const intent = emptyIntent();
  intent.companyIndices = findCompaniesInCommand(companies, command);
  intent.filters = { ...intent.filters, ...inferRegionFilter(command) };
  intent.filters.sector = inferSectorFilter(companies, command);
  intent.filters.metric = inferMetric(command);
  intent.sort.metric = intent.filters.metric;

  if (/data quality|quality scan|estimated|missing|confidence|telemetry/.test(q)) {
    intent.intent = 'data_quality_scan';
  } else if (/similar|peer|like /.test(q)) {
    intent.intent = 'find_similar';
  } else if (/compare| versus | vs /.test(q)) {
    intent.intent = 'compare_companies';
  } else if (/why|position|here/.test(q)) {
    intent.intent = 'explain_position';
  } else if (/explain|scan this|this company/.test(q)) {
    intent.intent = 'explain_company';
  } else if (/story|summarize|overview/.test(q)) {
    intent.intent = 'dashboard_story';
  } else if (/outlier|unusual|extreme/.test(q)) {
    intent.intent = 'show_outliers';
  } else if (/financial/.test(q)) {
    intent.intent = 'switch_phase';
    intent.phase = 'financial';
  } else if (/geographic|geography|region|country/.test(q)) {
    intent.intent = 'switch_phase';
    intent.phase = 'geographic';
  } else if (/take me to|focus|open|go to|fly to/.test(q) || intent.companyIndices.length === 1) {
    intent.intent = 'focus_company';
  } else if (/show|find|list|filter|highest|top|leader/.test(q)) {
    intent.intent = 'filter_companies';
  }

  if ((intent.intent === 'find_similar' || intent.intent === 'explain_company' || intent.intent === 'explain_position') && !intent.companyIndices.length && typeof selectedIndex === 'number') {
    intent.companyIndices = [selectedIndex];
  }

  return normalizeIntent({ ...intent, source: 'local' }, companies, command, selectedIndex);
}
