import { DEFAULT_OLLAMA_MODEL } from './missionTypes';

const OLLAMA_BASE_URL = 'http://localhost:11434';

async function fetchWithTimeout(url, options = {}, timeoutMs = 9000) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function checkOllamaHealth(model = DEFAULT_OLLAMA_MODEL) {
  try {
    const response = await fetchWithTimeout(`${OLLAMA_BASE_URL}/api/tags`, {}, 2500);
    if (!response.ok) throw new Error('Ollama tags request failed');
    const data = await response.json();
    const models = Array.isArray(data.models) ? data.models.map((item) => item.name).filter(Boolean) : [];
    const selectedModel = models.includes(model) ? model : models.find((name) => name.startsWith('gemma')) || model;
    return { online: true, model: selectedModel, models, error: null };
  } catch (error) {
    return { online: false, model, models: [], error: error.message || 'Ollama offline' };
  }
}

export async function callOllama(prompt, options = {}) {
  const response = await fetchWithTimeout(
    `${OLLAMA_BASE_URL}/api/generate`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: options.model || DEFAULT_OLLAMA_MODEL,
        prompt,
        stream: false,
        options: {
          temperature: options.temperature ?? 0.2,
          num_predict: options.numPredict ?? 700,
        },
      }),
    },
    options.timeoutMs ?? 12000
  );

  if (!response.ok) throw new Error('Ollama request failed');
  const data = await response.json();
  return data.response || '';
}

export function parseJsonObject(text) {
  const raw = String(text || '').trim();
  if (!raw) throw new Error('Empty model response');
  try {
    return JSON.parse(raw);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Model response did not contain JSON');
    return JSON.parse(match[0]);
  }
}
