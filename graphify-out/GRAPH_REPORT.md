# Graph Report - zealous-blackburn-690eaf  (2026-06-26)

## Corpus Check
- 56 files · ~19,709 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 236 nodes · 353 edges · 19 communities (17 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ef46c7ae`
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
1. `sectorColor()` - 8 edges
2. `Plan 01 — Cosmos nodes: InstancedMesh → 118 logo-textured meshes` - 8 edges
3. `usdValue()` - 6 edges
4. `formatPercent()` - 6 edges
5. `formatValue()` - 6 edges
6. `phaseIndexFor()` - 6 edges
7. `Phase 0 — Discovery (CONFIRMED, do not re-derive)` - 6 edges
8. `App()` - 5 edges
9. `formatMoney()` - 5 edges
10. `formatCount()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `HoverCard()` --calls--> `sectorColor()`  [EXTRACTED]
  portal/src/components/NodeHoverCard.jsx → portal/src/lib/sectors.js
- `ratioMetric()` --calls--> `parseFormattedMetric()`  [EXTRACTED]
  portal/src/lib/formatCompanyData.js → portal/src/lib/parseMetric.js
- `App()` --calls--> `useFlightTour()`  [EXTRACTED]
  portal/src/App.jsx → portal/src/hooks/useFlightTour.js
- `App()` --calls--> `useScrollProgress()`  [EXTRACTED]
  portal/src/App.jsx → portal/src/hooks/useScrollProgress.js
- `App()` --calls--> `useCompanies()`  [EXTRACTED]
  portal/src/App.jsx → portal/src/lib/useCompanies.js

## Import Cycles
- None detected.

## Communities (19 total, 2 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (29): dependencies, gsap, mammoth, pdfjs-dist, postprocessing, react, react-dom, @react-three/drei (+21 more)

### Community 1 - "Community 1"
Cohesion: 0.19
Nodes (10): CompanyNodes(), LogoNode(), NODE_GEOMETRY, tmpColor, SearchSpotlight(), disposeLogoCache(), domainFromUrl(), useLogoTexture() (+2 more)

### Community 2 - "Community 2"
Cohesion: 0.11
Nodes (13): COLUMNS, CompanyLeaderboard(), PROFIT_CLASS, DashboardView(), SECTOR_ORDER, compact, FinancialScatter(), TICK (+5 more)

### Community 3 - "Community 3"
Cohesion: 0.23
Nodes (9): buildParticles(), CLAMP, COLORS, IntroComposition(), rng(), IntroPlayer(), deriveSector(), RULES (+1 more)

### Community 4 - "Community 4"
Cohesion: 0.15
Nodes (15): analyzeResume(), buildCorpus(), buildProfile(), CORPUS_FIELDS, hasTerm(), normalize(), scoreCompanies(), SECTOR_KEYS (+7 more)

### Community 5 - "Community 5"
Cohesion: 0.23
Nodes (9): formatCompanyData(), ratioMetric(), DISPLAY_FIELDS, firstFinite(), parseFormattedMetric(), SUFFIX, WORD_SCALE, wordScale() (+1 more)

### Community 6 - "Community 6"
Cohesion: 0.18
Nodes (9): useFlightTour(), useScrollProgress(), buildLayouts(), mulberry(), REGION_KEYWORDS, REGION_ORDER, normalize(), useCompanies() (+1 more)

### Community 7 - "Community 7"
Cohesion: 0.17
Nodes (20): detectCurrency(), formatMoney(), formatUsd(), isNonValue(), SUFFIX, trim(), USD_PER, usdValue() (+12 more)

### Community 8 - "Community 8"
Cohesion: 0.24
Nodes (11): buildLayers(), circle(), ConstellationGrid(), geoFrom(), phaseWeights(), ClusterCard(), PhaseIndicator(), layoutBlend() (+3 more)

### Community 9 - "Community 9"
Cohesion: 0.13
Nodes (14): Allowed APIs (verified present — `package.json`), Anti-patterns to AVOID (will break this refactor), Confirmed facts (checked against Supabase `company_json` + current source), Decisions locked (by user, this session), Known trade-offs (accepted), Performance budget (the user explicitly asked for this), Phase 0 — Discovery (CONFIRMED, do not re-derive), Phase 1 — Thread `logo_url` + derived `domain` into node metadata (+6 more)

### Community 10 - "Community 10"
Cohesion: 0.14
Nodes (11): CommandPalette(), CompanyPanel(), FIELD_GROUPS, FieldValue(), HudOverlay(), base, XIcon(), toTags() (+3 more)

### Community 11 - "Community 11"
Cohesion: 0.33
Nodes (5): Architecture in one breath, File map, Run, Scroll journey, The Corporate Cosmos

### Community 12 - "Community 12"
Cohesion: 0.70
Nodes (4): extractDocx(), extractPdf(), extractResumeText(), kindOf()

### Community 18 - "Community 18"
Cohesion: 0.15
Nodes (9): CameraRig(), desiredLook, desiredPos, nodePos, ConstellationLinks(), CosmosCanvas(), HoverCard(), NodeHoverCard() (+1 more)

## Knowledge Gaps
- **77 isolated node(s):** `supabase`, `name`, `private`, `version`, `type` (+72 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `sectorColor()` connect `Community 10` to `Community 3`, `Community 1`, `Community 18`, `Community 2`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Why does `SECTOR_COLORS` connect `Community 3` to `Community 2`, `Community 4`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **What connects `supabase`, `name`, `private` to the rest of the system?**
  _77 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.11067193675889328 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.14619883040935672 - nodes in this community are weakly interconnected._
- **Should `Community 9` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._