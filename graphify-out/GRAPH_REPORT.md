# Graph Report - placementdash  (2026-07-18)

## Corpus Check
- 108 files · ~41,822 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 522 nodes · 1001 edges · 28 communities (27 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a147ea03`
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
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]

## God Nodes (most connected - your core abstractions)
1. `createAgentResult()` - 15 edges
2. `runMission()` - 15 edges
3. `sectorColor()` - 12 edges
4. `companyName()` - 11 edges
5. `normalizeText()` - 11 edges
6. `extractSkills()` - 11 edges
7. `RADIX_CATEGORIES` - 11 edges
8. `confidenceWeight()` - 11 edges
9. `normalizeProfile()` - 11 edges
10. `parseIntentLocally()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `defaultSuggestions()` --calls--> `companyName()`  [EXTRACTED]
  portal/src/components/mission/MissionControl.jsx → portal/src/agents/missionActions.js
- `App()` --calls--> `phaseIndexFor()`  [EXTRACTED]
  portal/src/App.jsx → portal/src/lib/phases.js
- `App()` --calls--> `sectorColor()`  [EXTRACTED]
  portal/src/App.jsx → portal/src/lib/sectors.js
- `generateMissionBrief()` --calls--> `callOllama()`  [EXTRACTED]
  portal/src/agents/narrativeAgent.js → portal/src/agents/ollamaClient.js
- `generateMissionBrief()` --calls--> `parseJsonObject()`  [EXTRACTED]
  portal/src/agents/narrativeAgent.js → portal/src/agents/ollamaClient.js

## Import Cycles
- None detected.

## Communities (28 total, 1 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (29): dependencies, gsap, mammoth, pdfjs-dist, postprocessing, react, react-dom, @react-three/drei (+21 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (27): CameraRig(), desiredLook, desiredPos, FOLLOW_OFFSET, followPos, nodePos, CompanyNodes(), HIT_GEOMETRY (+19 more)

### Community 2 - "Community 2"
Cohesion: 0.11
Nodes (12): COLUMNS, CompanyLeaderboard(), PROFIT_CLASS, DashboardView(), SECTOR_ORDER, compact, FinancialScatter(), TICK (+4 more)

### Community 3 - "Community 3"
Cohesion: 0.12
Nodes (38): runAnimationDirectorAgent(), FIELD_LABELS, runDataIntegrityAgent(), findOutliers(), rankCandidates(), runFinancialAgent(), runGeographicAgent(), emptyIntent() (+30 more)

### Community 4 - "Community 4"
Cohesion: 0.12
Nodes (19): analyzeResume(), buildCorpus(), buildProfile(), CORPUS_FIELDS, hasTerm(), normalize(), scoreCompanies(), SECTOR_KEYS (+11 more)

### Community 5 - "Community 5"
Cohesion: 0.07
Nodes (50): currencyCode(), detectCurrency(), explicitCurrencyCode(), formatCurrencyCompact(), formatMoney(), formatUsd(), isNonValue(), rankWithinCurrency() (+42 more)

### Community 6 - "Community 6"
Cohesion: 0.22
Nodes (7): useFlightTour(), useScrollProgress(), isConfigured, useCompanies(), App(), appendScannerText(), scannerResultText()

### Community 7 - "Community 7"
Cohesion: 0.11
Nodes (17): Anti-pattern guards (apply in every phase), Deterministic fallback material (adapt — do NOT reuse as-is), Gemma / Ollama (reuse verbatim — do NOT write a new client), On-device document text extraction (reuse verbatim), On-theme UI + wiring patterns to copy, Out of scope (later hackathon roles, but designed-for), Phase 0 — Documentation Discovery (Allowed APIs) — DONE, evidence below, Phase 1 — RADIX contract module (`src/lib/radix.js`) (+9 more)

### Community 8 - "Community 8"
Cohesion: 0.23
Nodes (7): ClusterCard(), CommandPalette(), HudOverlay(), PhaseIndicator(), phaseIndexFor(), PHASES, AlignedStars()

### Community 9 - "Community 9"
Cohesion: 0.13
Nodes (14): Allowed APIs (verified present — `package.json`), Anti-patterns to AVOID (will break this refactor), Confirmed facts (checked against Supabase `company_json` + current source), Decisions locked (by user, this session), Known trade-offs (accepted), Performance budget (the user explicitly asked for this), Phase 0 — Discovery (CONFIRMED, do not re-derive), Phase 1 — Thread `logo_url` + derived `domain` into node metadata (+6 more)

### Community 10 - "Community 10"
Cohesion: 0.15
Nodes (9): AgentActivityRow(), MissionBrief(), defaultSuggestions(), MissionControl(), COMMANDS, MissionHelp(), MissionInput(), MissionSuggestions() (+1 more)

### Community 11 - "Community 11"
Cohesion: 0.33
Nodes (5): Architecture in one breath, File map, Run, Scroll journey, The Corporate Cosmos

### Community 12 - "Community 12"
Cohesion: 0.12
Nodes (19): useTalentSession(), CompanyPanel(), FIELD_GROUPS, FieldValue(), ArrowUpRight(), base, XIcon(), toTags() (+11 more)

### Community 13 - "Community 13"
Cohesion: 0.29
Nodes (6): 1. Think Before Coding, 2. Simplicity First, 3. Surgical Changes, 4. Goal-Driven Execution, 5. graphify, Karpathy AI Coding Rules

### Community 14 - "Community 14"
Cohesion: 0.12
Nodes (15): Anti-pattern guards, Design decisions surfaced for the user (lock before executing), New findings that shape the plan, Phase 0 — Documentation Discovery (Allowed APIs), Phase 1 — Contract extensions, level model, company-bar data (`lib/radix.js` + `src/data/…`), Phase 2 — Profile Builder (`lib/profileStore.js` + `components/spectrum/ProfileBuilder.jsx`), Phase 3 — Talent Check (`lib/talentCheck.js` + `components/spectrum/ReadinessScan.jsx`), Phase 4 — Skill Matching (`lib/skillMatch.js` + optional Gemma alias pass + `components/spectrum/SkillMatch.jsx`) (+7 more)

### Community 18 - "Community 18"
Cohesion: 0.29
Nodes (6): 1. Think Before Coding, 2. Simplicity First, 3. Surgical Changes, 4. Goal-Driven Execution, 5. graphify, Karpathy AI Coding Rules

### Community 19 - "Community 19"
Cohesion: 0.40
Nodes (4): graphify First, Keeping The Map Current, Local Checks, Runtime Toolkit

### Community 21 - "Community 21"
Cohesion: 0.06
Nodes (65): callOllama(), checkOllamaHealth(), fetchWithTimeout(), parseJsonObject(), buildSkillExtractionPrompt(), evidenceSnippet(), extractSkills(), extractSkillsLocally() (+57 more)

### Community 22 - "Community 22"
Cohesion: 0.17
Nodes (11): HoverCard(), NodeHoverCard(), CompanyComparison(), summary(), CLAMP, ComparisonComposition(), deriveSector(), RULES (+3 more)

### Community 23 - "Community 23"
Cohesion: 0.23
Nodes (7): CLAMP, PhaseTransitionComposition(), PhaseTransitionPlayer(), CLAMP, PortalTransitionComposition(), PortalTransitionPlayer(), RemotionOverlayPlayer()

### Community 24 - "Community 24"
Cohesion: 0.21
Nodes (6): axisLabelPosition(), buildSpectrum(), MODE_STYLES, orbitChipPosition(), pointAt(), skillsFrom()

### Community 25 - "Community 25"
Cohesion: 0.33
Nodes (4): CLAMP, DashboardStoryComposition(), STEPS, DashboardStoryPlayer()

### Community 26 - "Community 26"
Cohesion: 0.43
Nodes (5): buildParticles(), CLAMP, IntroComposition(), rng(), IntroPlayer()

### Community 27 - "Community 27"
Cohesion: 0.50
Nodes (3): BodyTransitionComposition(), CLAMP, BodyTransitionPlayer()

## Knowledge Gaps
- **151 isolated node(s):** `supabase`, `name`, `private`, `version`, `type` (+146 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `profitState()` connect `Community 3` to `Community 2`, `Community 5`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Why does `sectorColor()` connect `Community 22` to `Community 8`, `Community 1`, `Community 2`, `Community 6`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Why does `RADIX_CATEGORIES` connect `Community 21` to `Community 24`, `Community 3`, `Community 12`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **What connects `supabase`, `name`, `private` to the rest of the system?**
  _151 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.07051282051282051 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.11255411255411256 - nodes in this community are weakly interconnected._