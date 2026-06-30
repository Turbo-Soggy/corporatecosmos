import { createAgentResult } from './missionTypes';

const FIELD_LABELS = {
  valuation: 'valuation',
  revenue: 'revenue',
  capital: 'capital raised',
  growth: 'growth',
  offices: 'office count',
  employees: 'employee count',
  nps: 'NPS',
  profitability_status: 'profitability status',
};

export function runDataIntegrityAgent({ companies, scopeIndices }) {
  const indices = scopeIndices.length ? scopeIndices : companies.map((_, index) => index);
  const fieldCounts = new Map();
  indices.forEach((index) => {
    Object.keys(companies[index]?.estimated || {}).forEach((field) => {
      fieldCounts.set(field, (fieldCounts.get(field) || 0) + 1);
    });
  });
  const estimatedFields = [...fieldCounts.values()].reduce((sum, count) => sum + count, 0);
  const confidence = indices.length ? Math.max(0.45, 1 - estimatedFields / Math.max(1, indices.length * 8)) : 0.5;
  const topFields = [...fieldCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  const warnings = topFields.map(([field, count]) => `${count} inferred ${FIELD_LABELS[field] || field} value${count === 1 ? '' : 's'}.`);
  const finding = estimatedFields
    ? `${estimatedFields} inferred telemetry fields across ${indices.length} companies.`
    : `All checked fields are confirmed telemetry across ${indices.length} companies.`;

  return createAgentResult('integrity', finding, {
    estimatedFields,
    fieldCounts: Object.fromEntries(fieldCounts),
    warnings,
    confidence: Number(confidence.toFixed(2)),
  });
}
