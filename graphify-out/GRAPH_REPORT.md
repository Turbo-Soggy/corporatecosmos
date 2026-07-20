# Graph Report - placementdash  (2026-07-20)

## Corpus Check
- 108 files · ~42,520 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 523 nodes · 1003 edges · 22 communities (21 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `34e67d2b`
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
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 24|Community 24]]

## God Nodes (most connected - your core abstractions)
1. `createAgentResult()` - 15 edges
2. `runMission()` - 15 edges
3. `sectorColor()` - 12 edges
4. `normalizeProfile()` - 11 edges
5. `companyName()` - 11 edges
6. `normalizeText()` - 11 edges
7. `extractSkills()` - 11 edges
8. `RADIX_CATEGORIES` - 11 edges
9. `confidenceWeight()` - 11 edges
10. `matchSkillsSmart()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `matchSkillsSmart()` --calls--> `confidenceWeight()`  [EXTRACTED]
  portal/src/agents/skillMatchAgent.js → portal/src/lib/radix.js
- `matchSkillsSmart()` --calls--> `normalizeSkillMatch()`  [EXTRACTED]
  portal/src/agents/skillMatchAgent.js → portal/src/lib/radixProfile.js
- `matchSkillsSmart()` --calls--> `matchSkills()`  [EXTRACTED]
  portal/src/agents/skillMatchAgent.js → portal/src/lib/skillMatch.js
- `App()` --calls--> `phaseIndexFor()`  [EXTRACTED]
  portal/src/App.jsx → portal/src/lib/phases.js
- `App()` --calls--> `sectorColor()`  [EXTRACTED]
  portal/src/App.jsx → portal/src/lib/sectors.js

## Import Cycles
- None detected.

## Communities (22 total, 1 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (29): dependencies, gsap, mammoth, pdfjs-dist, postprocessing, react, react-dom, @react-three/drei (+21 more)

### Community 1 - "Community 1"
Cohesion: 0.06
Nodes (36): CameraRig(), desiredLook, desiredPos, FOLLOW_OFFSET, followPos, nodePos, CompanyNodes(), HIT_GEOMETRY (+28 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (28): HoverCard(), NodeHoverCard(), CompanyComparison(), summary(), COLUMNS, CompanyLeaderboard(), PROFIT_CLASS, DashboardView() (+20 more)

### Community 3 - "Community 3"
Cohesion: 0.09
Nodes (40): runAnimationDirectorAgent(), FIELD_LABELS, runDataIntegrityAgent(), findOutliers(), rankCandidates(), runFinancialAgent(), runGeographicAgent(), emptyIntent() (+32 more)

### Community 4 - "Community 4"
Cohesion: 0.13
Nodes (18): analyzeResume(), buildCorpus(), buildProfile(), CORPUS_FIELDS, hasTerm(), normalize(), scoreCompanies(), SECTOR_KEYS (+10 more)

### Community 5 - "Community 5"
Cohesion: 0.07
Nodes (50): currencyCode(), detectCurrency(), explicitCurrencyCode(), formatCurrencyCompact(), formatMoney(), formatUsd(), isNonValue(), rankWithinCurrency() (+42 more)

### Community 6 - "Community 6"
Cohesion: 0.08
Nodes (21): useFlightTour(), useScrollProgress(), BodyTransitionComposition(), CLAMP, BodyTransitionPlayer(), CLAMP, DashboardStoryComposition(), STEPS (+13 more)

### Community 7 - "Community 7"
Cohesion: 0.11
Nodes (17): Anti-pattern guards (apply in every phase), Deterministic fallback material (adapt — do NOT reuse as-is), Gemma / Ollama (reuse verbatim — do NOT write a new client), On-device document text extraction (reuse verbatim), On-theme UI + wiring patterns to copy, Out of scope (later hackathon roles, but designed-for), Phase 0 — Documentation Discovery (Allowed APIs) — DONE, evidence below, Phase 1 — RADIX contract module (`src/lib/radix.js`) (+9 more)

### Community 8 - "Community 8"
Cohesion: 0.18
Nodes (23): INTENTS, fallbackBrief(), generateMissionBrief(), callOllama(), checkOllamaHealth(), fetchWithTimeout(), parseJsonObject(), parseIntent() (+15 more)

### Community 9 - "Community 9"
Cohesion: 0.13
Nodes (14): Allowed APIs (verified present — `package.json`), Anti-patterns to AVOID (will break this refactor), Confirmed facts (checked against Supabase `company_json` + current source), Decisions locked (by user, this session), Known trade-offs (accepted), Performance budget (the user explicitly asked for this), Phase 0 — Discovery (CONFIRMED, do not re-derive), Phase 1 — Thread `logo_url` + derived `domain` into node metadata (+6 more)

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
Nodes (49): ALIASES, clamp(), companiesWithBar(), hasCompanyBar(), loadCompanyBar(), resolveKey(), exportProfile(), importProfile() (+41 more)

### Community 24 - "Community 24"
Cohesion: 0.21
Nodes (6): axisLabelPosition(), buildSpectrum(), MODE_STYLES, orbitChipPosition(), pointAt(), skillsFrom()

## Knowledge Gaps
- **151 isolated node(s):** `TABS`, `STAGE_COPY`, `CONFIDENCE_STYLES`, `OTHER_CATEGORY`, `DOSSIER_SECTIONS` (+146 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `profitState()` connect `Community 3` to `Community 2`, `Community 5`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Why does `sectorColor()` connect `Community 2` to `Community 1`, `Community 6`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Why does `RADIX_CATEGORIES` connect `Community 21` to `Community 8`, `Community 24`, `Community 12`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **What connects `TABS`, `STAGE_COPY`, `CONFIDENCE_STYLES` to the rest of the system?**
  _151 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.05513784461152882 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.06280193236714976 - nodes in this community are weakly interconnected._