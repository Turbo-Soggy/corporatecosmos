import { useCallback, useState } from 'react';
import { loadProfile, saveProfile } from '../lib/profileStore';

// Shared state for the Talent Scanner cockpit: the active candidate profile (persisted
// via profileStore) plus the last JD and résumé extractions, so Profile Builder,
// Readiness Scan, and Skill Match all read from one source of truth.
export function useTalentSession() {
  const [profile, setProfileState] = useState(() => loadProfile());
  const [jd, setJd] = useState(null); // last JD Analytics extraction result
  const [resumeExtract, setResumeExtract] = useState(null); // last résumé extraction

  const setProfile = useCallback((next) => setProfileState(next), []);

  // Normalize + persist to localStorage, and reflect the normalized profile in state.
  const persistProfile = useCallback((next) => {
    const saved = saveProfile(next);
    setProfileState(saved);
    return saved;
  }, []);

  return { profile, setProfile, persistProfile, jd, setJd, resumeExtract, setResumeExtract };
}
