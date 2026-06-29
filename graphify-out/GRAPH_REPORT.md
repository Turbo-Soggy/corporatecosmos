# Graph Report - placement  (2026-06-24)

## Corpus Check
- 62 files · ~18,401 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 249 nodes · 389 edges · 17 communities (14 shown, 3 thin omitted)
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
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 17|Community 17]]

## God Nodes (most connected - your core abstractions)
1. `sectorColor()` - 9 edges
2. `phaseIndexFor()` - 8 edges
3. `Plan 01 — Cosmos nodes: InstancedMesh → 118 logo-textured meshes` - 8 edges
4. `formatCurrency()` - 7 edges
5. `formatValue()` - 7 edges
6. `App()` - 6 edges
7. `RemotionOverlayPlayer()` - 6 edges
8. `formatCompanyData()` - 6 edges
9. `formatPercent()` - 6 edges
10. `Phase 0 — Discovery (CONFIRMED, do not re-derive)` - 6 edges

## Surprising Connections (you probably didn't know these)
- `App()` --calls--> `phaseIndexFor()`  [EXTRACTED]
  portal/src/App.jsx → portal/src/lib/phases.js
- `App()` --calls--> `sectorColor()`  [EXTRACTED]
  portal/src/App.jsx → portal/src/lib/sectors.js
- `summary()` --calls--> `sectorColor()`  [EXTRACTED]
  portal/src/components/dashboard/CompanyComparison.jsx → portal/src/lib/sectors.js
- `ratioMetric()` --calls--> `parseFormattedMetric()`  [EXTRACTED]
  portal/src/lib/formatCompanyData.js → portal/src/lib/parseMetric.js
- `formatKnownMoney()` --calls--> `formatValue()`  [EXTRACTED]
  portal/src/lib/formatCompanyData.js → portal/src/lib/formatDisplay.js

## Import Cycles
- None detected.

## Communities (17 total, 3 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (27): dependencies, gsap, postprocessing, react, react-dom, @react-three/drei, @react-three/fiber, @react-three/postprocessing (+19 more)

### Community 1 - "Community 1"
Cohesion: 0.13
Nodes (16): buildLayers(), circle(), ConstellationGrid(), geoFrom(), phaseWeights(), ClusterCard(), CommandPalette(), HudOverlay() (+8 more)

### Community 2 - "Community 2"
Cohesion: 0.12
Nodes (12): COLUMNS, CompanyLeaderboard(), PROFIT_CLASS, DashboardView(), SECTOR_ORDER, compact, FinancialScatter(), TICK (+4 more)

### Community 3 - "Community 3"
Cohesion: 0.10
Nodes (17): CameraRig(), desiredLook, desiredPos, FOLLOW_OFFSET, followPos, nodePos, BLAZE_COLOR, CompanyNodes() (+9 more)

### Community 4 - "Community 4"
Cohesion: 0.14
Nodes (14): CompanyComparison(), summary(), NodeTooltip(), CLAMP, ComparisonComposition(), buildParticles(), CLAMP, IntroComposition() (+6 more)

### Community 5 - "Community 5"
Cohesion: 0.22
Nodes (17): cleanExistingMoney(), compact, COUNT_FIELDS, CURRENCY_FIELDS, DISPLAY_FIELDS, formatCount(), formatCurrency(), formatPercent() (+9 more)

### Community 6 - "Community 6"
Cohesion: 0.13
Nodes (14): Allowed APIs (verified present — `package.json`), Anti-patterns to AVOID (will break this refactor), Confirmed facts (checked against Supabase `company_json` + current source), Decisions locked (by user, this session), Known trade-offs (accepted), Performance budget (the user explicitly asked for this), Phase 0 — Discovery (CONFIRMED, do not re-derive), Phase 1 — Thread `logo_url` + derived `domain` into node metadata (+6 more)

### Community 7 - "Community 7"
Cohesion: 0.10
Nodes (17): useScrollProgress(), BodyTransitionComposition(), CLAMP, BodyTransitionPlayer(), CLAMP, DashboardStoryComposition(), STEPS, DashboardStoryPlayer() (+9 more)

### Community 9 - "Community 9"
Cohesion: 0.28
Nodes (6): CompanyPanel(), FIELD_GROUPS, FieldValue(), base, XIcon(), toTags()

### Community 10 - "Community 10"
Cohesion: 0.33
Nodes (5): Architecture in one breath, File map, Run, Scroll journey, The Corporate Cosmos

### Community 17 - "Community 17"
Cohesion: 0.09
Nodes (30): currencyCode(), explicitCurrencyCode(), formatCurrencyCompact(), rankWithinCurrency(), RULES, compact, estimatedDisplay(), fallbackEstimate() (+22 more)

## Knowledge Gaps
- **81 isolated node(s):** `supabase`, `name`, `private`, `version`, `type` (+76 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `sectorColor()` connect `Community 4` to `Community 2`, `Community 3`, `Community 7`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `phaseIndexFor()` connect `Community 1` to `Community 7`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Why does `formatValue()` connect `Community 5` to `Community 17`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **What connects `supabase`, `name`, `private` to the rest of the system?**
  _81 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.07142857142857142 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.13230769230769232 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.11904761904761904 - nodes in this community are weakly interconnected._