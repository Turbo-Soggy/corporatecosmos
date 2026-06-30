import { createAgentResult } from './missionTypes';

export function runAnimationDirectorAgent({ intent, primaryIndex, highlightedIndices }) {
  const sequenceByIntent = {
    compare_companies: 'company_comparison',
    find_similar: 'peer_constellation',
    dashboard_story: 'dashboard_story',
    data_quality_scan: 'data_quality_scan',
    explain_company: 'mission_scan',
    explain_position: 'mission_scan',
    filter_companies: 'mission_scan',
    focus_company: 'portal_transition',
    switch_phase: 'phase_transition',
  };
  const sequence = sequenceByIntent[intent.intent] || 'mission_briefing';
  const dashboardOpen =
    (intent.intent === 'compare_companies' && highlightedIndices.length > 1) ||
    ['dashboard_story', 'show_outliers', 'data_quality_scan'].includes(intent.intent);
  const cameraMode = intent.intent === 'compare_companies' ? 'comparison' : intent.intent === 'find_similar' ? 'peer_constellation' : 'focus';

  return createAgentResult('animation', `Route plotted: ${sequence.replace(/_/g, ' ')}.`, {
    cosmos: {
      focusCompanyIndex: primaryIndex,
      highlightedIndices,
      cameraMode,
      phase: intent.phase || null,
    },
    dashboard: {
      open: dashboardOpen,
      section: intent.intent === 'compare_companies' ? 'comparison' : intent.intent === 'data_quality_scan' ? 'quality' : 'overview',
    },
    remotion: {
      sequence,
      props: { companyIndices: highlightedIndices },
    },
    confidence: 0.88,
  });
}
