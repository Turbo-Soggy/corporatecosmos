import { runAnimationDirectorAgent } from './animationDirectorAgent';
import { runDataIntegrityAgent } from './dataIntegrityAgent';
import { runFinancialAgent, findOutliers } from './financialAgent';
import { runGeographicAgent } from './geographicAgent';
import { normalizeIntent, parseIntentLocally } from './intentSchema';
import { checkOllamaHealth, callOllama, parseJsonObject } from './ollamaClient';
import { buildIntentPrompt } from './prompts';
import { runSectorAgent } from './sectorAgent';
import { runSimilarityAgent } from './similarityAgent';
import { createAgentResult, DEFAULT_OLLAMA_MODEL } from './missionTypes';
import { selectedOrFirst, uniqueIndices } from './missionActions';
import { generateMissionBrief } from './narrativeAgent';

async function parseIntent({ command, companies, selectedIndex, ollama }) {
  if (ollama.online) {
    try {
      const prompt = buildIntentPrompt({ command, companies });
      const text = await callOllama(prompt, {
        model: ollama.model,
        temperature: 0.1,
        numPredict: 450,
        timeoutMs: 9000,
      });
      return normalizeIntent({ ...parseJsonObject(text), source: 'gemma' }, companies, command, selectedIndex);
    } catch {
      return parseIntentLocally(command, companies, selectedIndex);
    }
  }
  return parseIntentLocally(command, companies, selectedIndex);
}

function scopeForIntent({ companies, layouts, intent }) {
  let indices = intent.companyIndices || [];
  if (intent.filters?.country || intent.filters?.region) {
    const geographic = runGeographicAgent({ companies, layouts, intent });
    indices = geographic.matchedIndices || [];
  }
  if (intent.filters?.sector) {
    const source = indices.length ? indices : companies.map((_, index) => index);
    indices = source.filter((index) => companies[index]?.sector === intent.filters.sector);
  }
  return uniqueIndices(indices, companies.length);
}

function highlightedForIntent({ companies, intent, scopeIndices, agents, primaryIndex }) {
  if (intent.intent === 'find_similar') {
    const similarity = agents.find((agent) => agent.key === 'similarity');
    return uniqueIndices([primaryIndex, ...(similarity?.matches || []).map((match) => match.companyIndex)], companies.length);
  }
  if (intent.intent === 'show_outliers') {
    return uniqueIndices(findOutliers(companies).map((item) => item.companyIndex), companies.length);
  }
  if (scopeIndices.length) return scopeIndices.slice(0, 16);
  if (typeof primaryIndex === 'number') return [primaryIndex];
  return [];
}

export async function runMission({ command, companies, layouts, selectedIndex = null, phase = null, model = DEFAULT_OLLAMA_MODEL }) {
  const startedAt = Date.now();
  const ollama = await checkOllamaHealth(model);
  const intent = await parseIntent({ command, companies, selectedIndex, ollama });
  const scopeIndices = scopeForIntent({ companies, layouts, intent });
  const primaryIndex = selectedOrFirst(intent.companyIndices, selectedIndex);
  const agents = [];
  const unresolvedComparison = intent.intent === 'compare_companies' && intent.companyIndices.length < 2;

  if (['compare_companies', 'filter_companies', 'dashboard_story', 'show_outliers', 'explain_company', 'explain_position'].includes(intent.intent)) {
    agents.push(runFinancialAgent({ companies, intent, scopeIndices: scopeIndices.length ? scopeIndices : intent.companyIndices }));
  }
  if (unresolvedComparison) {
    const foundCount = intent.companyIndices.length;
    agents.unshift(createAgentResult(
      'financial',
      foundCount
        ? 'Only one requested company was found in this dataset. Add another known company to run a comparison.'
        : 'No requested companies were found in this dataset. Try names from the company search.',
      {
        warnings: ['One or more requested comparison targets are not present in the loaded company data.'],
        confidence: 0.5,
      }
    ));
  }
  if (intent.filters?.country || intent.filters?.region || intent.intent === 'dashboard_story') {
    agents.push(runGeographicAgent({ companies, layouts, intent }));
  }
  if (intent.filters?.sector || intent.intent === 'dashboard_story') {
    agents.push(runSectorAgent({ companies, intent, scopeIndices }));
  }
  if (intent.intent === 'find_similar') {
    agents.push(runSimilarityAgent({ companies, sourceIndex: primaryIndex }));
  }
  agents.push(runDataIntegrityAgent({ companies, scopeIndices: scopeIndices.length ? scopeIndices : intent.companyIndices }));

  if (intent.intent === 'unknown') {
    agents.unshift(createAgentResult('financial', 'Mission Control could not classify the command, so it ran a general telemetry scan.', { confidence: 0.45 }));
  }

  const highlightedIndices = highlightedForIntent({ companies, intent, scopeIndices, agents, primaryIndex });
  const animation = runAnimationDirectorAgent({ intent, primaryIndex, highlightedIndices });
  agents.push(animation);

  const facts = {
    intent,
    highlightedIndices,
    primaryIndex,
    agents: agents.map(({ key, name, finding, warnings, confidence, rankings, matches, estimatedFields }) => ({
      key,
      name,
      finding,
      warnings,
      confidence,
      rankings,
      matches,
      estimatedFields,
    })),
  };
  const brief = await generateMissionBrief({ command, intent, facts, companies, ollama });

  return {
    id: `mission_${Date.now()}`,
    status: 'complete',
    command,
    intent: intent.intent,
    parsedIntent: intent,
    title: brief.title,
    summary: brief.summary,
    bullets: brief.bullets,
    nextQuestions: brief.nextQuestions,
    agents,
    companies: {
      primaryIndex,
      highlightedIndices,
      dimmedIndices: highlightedIndices.length ? companies.map((_, index) => index).filter((index) => !highlightedIndices.includes(index)) : [],
    },
    dashboard: animation.dashboard,
    cosmos: {
      ...animation.cosmos,
      linkOrder: highlightedIndices,
      phase: animation.cosmos.phase || phase,
    },
    remotion: animation.remotion,
    confidence: {
      overall: Number((agents.reduce((sum, agent) => sum + (agent.confidence || 0), 0) / Math.max(1, agents.length)).toFixed(2)),
      estimatedFields: agents.find((agent) => agent.key === 'integrity')?.estimatedFields || 0,
      warnings: agents.flatMap((agent) => agent.warnings || []),
    },
    ollama,
    durationMs: Date.now() - startedAt,
    narrativeSource: brief.source,
  };
}
