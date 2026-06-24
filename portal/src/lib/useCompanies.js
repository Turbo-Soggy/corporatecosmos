import { useEffect, useState } from 'react';
import { supabase, isConfigured } from './supabaseClient';
import { formatCompanyData } from './formatCompanyData';

// The entire dataset is ~750 KB (118 rows x ~6.4 KB full_json), so we pull it
// all in ONE query at load and keep it in memory. No per-node fetches ever.
export function useCompanies() {
  const [state, setState] = useState({
    companies: [],
    loading: true,
    error: isConfigured ? null : 'Supabase environment variables are not set.',
  });

  useEffect(() => {
    if (!isConfigured) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }

    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('company_json')
        .select('company_id, full_json')
        .order('company_id', { ascending: true });

      if (cancelled) return;
      if (error) {
        setState({ companies: [], loading: false, error: error.message });
        return;
      }

      // Flatten: each row's full_json IS the company record.
      const raw = (data ?? [])
        .map((row) => ({ company_id: row.company_id, ...(row.full_json ?? {}) }))
        .filter((c) => c && c.name);

      // Format ONCE here; every component downstream reads the formatted shape.
      const companies = formatCompanyData(raw);

      setState({ companies, loading: false, error: null });
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
