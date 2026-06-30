import { createAgentResult } from './missionTypes';

export function runSectorAgent({ companies, intent, scopeIndices }) {
  const indices = scopeIndices.length ? scopeIndices : companies.map((_, index) => index);
  const counts = new Map();
  indices.forEach((index) => {
    const sector = companies[index]?.sector || 'Unknown';
    counts.set(sector, (counts.get(sector) || 0) + 1);
  });
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const requested = intent.filters?.sector;
  const matchedIndices = requested
    ? indices.filter((index) => companies[index]?.sector === requested)
    : indices;
  const finding = requested
    ? `${matchedIndices.length} companies match the ${requested} sector.`
    : `Largest sector in scope: ${sorted[0]?.[0] || 'Unknown'} (${sorted[0]?.[1] || 0} companies).`;

  return createAgentResult('sector', finding, {
    sectorCounts: sorted.map(([sector, count]) => ({ sector, count })),
    matchedIndices,
    confidence: 0.86,
  });
}
