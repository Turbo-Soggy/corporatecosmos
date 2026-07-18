// Candidate profile persistence. The portal has no backend for candidate data, so
// profiles live in localStorage (JSON) with file export/import for portability —
// matching the hackathon brief's "save/load mechanism (JSON)". All reads/writes go
// through normalizeProfile so stored data always conforms to the shared contract.

import { normalizeProfile, emptyProfile } from './radixProfile';

const STORAGE_KEY = 'radix.profile.v1';

/** Load the saved profile (contract-normalized), or an empty profile. */
export function loadProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyProfile();
    return normalizeProfile(JSON.parse(raw));
  } catch {
    return emptyProfile();
  }
}

/** Normalize + persist a profile. Returns the normalized profile. */
export function saveProfile(profile) {
  const normalized = normalizeProfile(profile);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  } catch {
    /* storage full / unavailable — keep the in-memory profile */
  }
  return normalized;
}

export function clearProfile() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* no-op */
  }
}

/** Download the profile as a JSON file. */
export function exportProfile(profile) {
  const normalized = normalizeProfile(profile);
  const blob = new Blob([JSON.stringify(normalized, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  const slug = (normalized.name || 'candidate').trim().replace(/\s+/g, '_').toLowerCase() || 'candidate';
  anchor.download = `${slug}_profile.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/** Parse an uploaded JSON profile file into a contract-normalized profile. */
export async function importProfile(file) {
  const text = await file.text();
  return normalizeProfile(JSON.parse(text));
}
