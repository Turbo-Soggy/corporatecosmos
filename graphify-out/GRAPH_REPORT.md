# Graph Report - placement  (2026-06-30)

## Corpus Check
- 89 files · ~27,630 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 364 nodes · 676 edges · 19 communities (16 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `19953f9a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 18|Community 18]]

## God Nodes (most connected - your core abstractions)
1. `createAgentResult()` - 15 edges
2. `runMission()` - 15 edges
3. `sectorColor()` - 12 edges
4. `companyName()` - 11 edges
5. `normalizeText()` - 11 edges
6. `parseIntentLocally()` - 10 edges
7. `normalizeIntent()` - 9 edges
8. `uniqueIndices()` - 8 edges
9. `phaseIndexFor()` - 8 edges
10. `Plan 01 — Cosmos nodes: InstancedMesh → 118 logo-textured meshes` - 8 edges

## Surprising Connections (you probably didn't know these)
- `defaultSuggestions()` --calls--> `companyName()`  [EXTRACTED]
  portal/src/components/mission/MissionControl.jsx → portal/src/agents/missionActions.js
- `App()` --calls--> `phaseIndexFor()`  [EXTRACTED]
  portal/src/App.jsx → portal/src/lib/phases.js
- `App()` --calls--> `sectorColor()`  [EXTRACTED]
  portal/src/App.jsx → portal/src/lib/sectors.js
- `HoverCard()` --calls--> `sectorColor()`  [EXTRACTED]
  portal/src/components/NodeHoverCard.jsx → portal/src/lib/sectors.js
- `summary()` --calls--> `sectorColor()`  [EXTRACTED]
  portal/src/components/dashboard/CompanyComparison.jsx → portal/src/lib/sectors.js

## Import Cycles
- None detected.

## Communities (19 total, 3 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (29): dependencies, gsap, mammoth, pdfjs-dist, postprocessing, react, react-dom, @react-three/drei (+21 more)

### Community 1 - "Community 1"
Cohesion: 0.08
Nodes (20): CameraRig(), desiredLook, desiredPos, FOLLOW_OFFSET, followPos, nodePos, CompanyNodes(), HIT_GEOMETRY (+12 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (28): HoverCard(), NodeHoverCard(), CompanyComparison(), summary(), COLUMNS, CompanyLeaderboard(), PROFIT_CLASS, DashboardView() (+20 more)

### Community 3 - "Community 3"
Cohesion: 0.11
Nodes (42): runAnimationDirectorAgent(), FIELD_LABELS, runDataIntegrityAgent(), findOutliers(), rankCandidates(), runFinancialAgent(), runGeographicAgent(), emptyIntent() (+34 more)

### Community 4 - "Community 4"
Cohesion: 0.19
Nodes (13): analyzeResume(), buildCorpus(), buildProfile(), CORPUS_FIELDS, hasTerm(), normalize(), scoreCompanies(), SECTOR_KEYS (+5 more)

### Community 5 - "Community 5"
Cohesion: 0.08
Nodes (38): currencyCode(), detectCurrency(), explicitCurrencyCode(), formatCurrencyCompact(), formatMoney(), formatUsd(), isNonValue(), rankWithinCurrency() (+30 more)

### Community 6 - "Community 6"
Cohesion: 0.10
Nodes (18): useFlightTour(), useScrollProgress(), BodyTransitionComposition(), CLAMP, BodyTransitionPlayer(), CLAMP, DashboardStoryComposition(), STEPS (+10 more)

### Community 7 - "Community 7"
Cohesion: 0.14
Nodes (19): CompanyPanel(), FIELD_GROUPS, FieldValue(), base, XIcon(), compact, COUNT_FIELDS, CURRENCY_FIELDS (+11 more)

### Community 8 - "Community 8"
Cohesion: 0.12
Nodes (17): buildLayers(), circle(), ConstellationGrid(), geoFrom(), phaseWeights(), ClusterCard(), CommandPalette(), HudOverlay() (+9 more)

### Community 9 - "Community 9"
Cohesion: 0.13
Nodes (14): Allowed APIs (verified present — `package.json`), Anti-patterns to AVOID (will break this refactor), Confirmed facts (checked against Supabase `company_json` + current source), Decisions locked (by user, this session), Known trade-offs (accepted), Performance budget (the user explicitly asked for this), Phase 0 — Discovery (CONFIRMED, do not re-derive), Phase 1 — Thread `logo_url` + derived `domain` into node metadata (+6 more)

### Community 10 - "Community 10"
Cohesion: 0.16
Nodes (8): AgentActivityRow(), MissionBrief(), defaultSuggestions(), COMMANDS, MissionHelp(), MissionInput(), MissionSuggestions(), MissionTimeline()

### Community 11 - "Community 11"
Cohesion: 0.33
Nodes (5): Architecture in one breath, File map, Run, Scroll journey, The Corporate Cosmos

### Community 12 - "Community 12"
Cohesion: 0.70
Nodes (4): extractDocx(), extractPdf(), extractResumeText(), kindOf()

## Knowledge Gaps
- **94 isolated node(s):** `supabase`, `name`, `private`, `version`, `type` (+89 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `profitState()` connect `Community 3` to `Community 2`, `Community 5`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **Why does `sectorColor()` connect `Community 2` to `Community 8`, `Community 1`, `Community 6`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **What connects `supabase`, `name`, `private` to the rest of the system?**
  _94 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.0846774193548387 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.06280193236714976 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.108708357685564 - nodes in this community are weakly interconnected._