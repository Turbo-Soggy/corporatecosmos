import { callOllama, parseJsonObject } from './ollamaClient';
import { buildNarrativePrompt } from './prompts';
import { companyName } from './missionActions';

function fallbackBrief({ intent, facts, companies }) {
  const highlighted = facts.highlightedIndices?.map((index) => companyName(companies[index])).filter(Boolean) || [];
  const integrity = facts.agents?.find((agent) => agent.key === 'integrity');
  const titleByIntent = {
    focus_company: highlighted[0] ? `Focus: ${highlighted[0]}` : 'Company Focus',
    compare_companies: highlighted.length ? `Comparison: ${highlighted.join(' vs ')}` : 'Company Comparison',
    filter_companies: 'Filtered Company Scan',
    find_similar: highlighted[0] ? `Peer Constellation: ${highlighted[0]}` : 'Peer Constellation',
    explain_company: highlighted[0] ? `Mission Scan: ${highlighted[0]}` : 'Mission Scan',
    explain_position: 'Position Explanation',
    dashboard_story: 'Dataset Story',
    show_outliers: 'Outlier Scan',
    data_quality_scan: 'Telemetry Confidence Scan',
    switch_phase: 'Phase Route',
  };
  const bullets = facts.agents?.map((agent) => agent.finding).filter(Boolean).slice(0, 4) || [];
  return {
    title: titleByIntent[intent.intent] || 'Mission Brief',
    summary: bullets[0] || 'Mission Control completed a deterministic local scan.',
    bullets,
    nextQuestions: [
      highlighted[0] ? `Find companies like ${highlighted[0]}` : 'Show top valuation bodies',
      integrity?.estimatedFields ? 'Explain estimated values' : 'Run data quality scan',
      'Tell me the dashboard story',
    ].slice(0, 3),
    source: 'local',
  };
}

export async function generateMissionBrief({ command, intent, facts, companies, ollama }) {
  if (!ollama?.online) return fallbackBrief({ intent, facts, companies });
  try {
    const prompt = buildNarrativePrompt({ command, intent, facts });
    const text = await callOllama(prompt, {
      model: ollama.model,
      temperature: 0.35,
      numPredict: 600,
      timeoutMs: 30000,
    });
    const parsed = parseJsonObject(text);
    return {
      title: String(parsed.title || '').slice(0, 90) || 'Mission Brief',
      summary: String(parsed.summary || '').slice(0, 360) || fallbackBrief({ intent, facts, companies }).summary,
      bullets: Array.isArray(parsed.bullets) ? parsed.bullets.map(String).slice(0, 4) : [],
      nextQuestions: Array.isArray(parsed.nextQuestions) ? parsed.nextQuestions.map(String).slice(0, 4) : [],
      source: 'gemma',
    };
  } catch {
    return fallbackBrief({ intent, facts, companies });
  }
}
