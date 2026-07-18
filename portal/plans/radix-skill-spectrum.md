# Plan — RADIX Skill Spectrum: JD Analytics + Résumé Parsing (Gemma-powered, on-theme)

**Goal.** Add two RADIX Talent Match missions to the Corporate Cosmos portal:
1. **JD Analytics** — upload a JD (PDF/DOCX) → structured skill list mapped to the 12 RADIX categories.
2. **Résumé Parsing** — upload a résumé (PDF/DOCX) → structured skill list + structured fields (education, projects, experience).

**Two hard constraints from the user:**
- **LLM = the onboard Gemma (`gemma4:12b`) already wired into Mission Control via local Ollama — NOT LangChain / a Python service.** Everything runs in the React portal + browser → `http://localhost:11434`.
- **Stay on-theme** with the Corporate Cosmos (glassmorphic HUD, teal `#5EEAD4` glow, radial/constellation motifs, "Gemma Core" mission language).

**Creative concept (the theme hook).** Both missions feed one visual: a **12-point Skill Constellation** — a radial star-map where each of the 12 RADIX skillsets is a spoke; spoke length/glow = strength, opacity = confidence; named technologies orbit as satellite chips. A JD lights the constellation in amber ("what the role demands"); a résumé lights it in teal ("what you bring"); overlaying both previews the gap (sets up the hackathon's later Talent Check / Skill Match without being in scope here). A "Project onto the Cosmos" action reuses the existing résumé→company matcher so an extracted skill profile can still ignite compatible company nodes in the 3D scene.

**Shared engine.** JD and résumé extraction differ only by prompt + a few output fields, so they share one Gemma agent and one deterministic fallback — exactly what the hackathon brief encourages ("share real code, not just a data format").

---

## Phase 0 — Documentation Discovery (Allowed APIs) — DONE, evidence below

All citations are real files in `D:/placement/placementdash/portal` (the canonical `main` checkout). Copy these patterns; do not invent APIs.

### Gemma / Ollama (reuse verbatim — do NOT write a new client)
- `src/agents/ollamaClient.js`
  - `checkOllamaHealth(model?) → { online, model, models, error }` — GETs `/api/tags`, auto-selects the first `gemma*` model if the requested one is absent (lines 15–26).
  - `callOllama(prompt, { model, temperature, numPredict, timeoutMs }) → string` — POSTs `/api/generate` with body `{ model, prompt, stream: false, options: { temperature, num_predict } }`, returns `data.response` (lines 28–50). **These four options are the ONLY ones supported — do not add others.**
  - `parseJsonObject(text)` — tolerant JSON extraction: `JSON.parse`, else first `{…}` match (lines 52–62).
  - Base URL constant `http://localhost:11434` (line 3); default model `gemma4:12b` (`src/agents/missionTypes.js:15`).
- **Prompt style** — `src/agents/prompts.js`: system-ish role line + `Return only valid JSON. Do not explain.` + an explicit JSON template the model fills. Extraction uses **temperature 0.1**, narrative 0.35 (`orchestrator.js:14–30`, `narrativeAgent.js:34–55`).
- **The load-bearing pattern (COPY THIS):** every LLM call is wrapped in `try/catch`; on offline **or** parse failure it falls back to a deterministic local function and tags `source: 'local'` vs `'gemma'` (`orchestrator.js:14–30`, `narrativeAgent.js:5–55`, `intentSchema.js:normalizeIntent/parseIntentLocally`).

### On-device document text extraction (reuse verbatim)
- `src/lib/resumeParse.js` → `extractResumeText(file) → Promise<string>` already handles **PDF (pdfjs-dist) and DOCX (mammoth)** on-device, strips whitespace, and throws friendly errors for legacy `.doc` / scanned PDFs / empty text. It is document-agnostic → **works for JDs unchanged.** (Deps `pdfjs-dist@^4`, `mammoth@^1` are already installed.)

### Deterministic fallback material (adapt — do NOT reuse as-is)
- `src/lib/resumeMatch.js` — `SKILL_LEXICON`, `tokenize`, `hasTerm`, `buildProfile`. **Caveat:** this lexicon maps keywords → *sector buckets* (SaaS, FinTech…), NOT the 12 RADIX codes. Phase 1 builds a NEW keyword→RADIX-code lexicon; the tokenizer/`hasTerm` helpers are directly reusable.

### On-theme UI + wiring patterns to copy
- Mission panel shell + Gemma health dot + `/help`/`/clear` + suggestions: `src/components/mission/MissionControl.jsx` (glass panel bottom-left, `label-mono` "MISSION CONTROL", "Gemma Core", online/offline dot lines 125–192).
- Upload "docking bay" (drag/drop, on-device parse, stage machine): `src/components/resume/UploadDock.jsx`.
- Results drawer (ranked rows, confidence-style pills, sector dots, animate-rowIn): `src/components/resume/AlignedStars.jsx`.
- Constellation-highlight infra to reuse for "Project onto the Cosmos": `matchSet` + `linkOrder` props threaded `App.jsx → CosmosCanvas → CompanyNodes` + `ConstellationLinks.jsx`; company matcher `resumeMatch.analyzeResume(text, companies)`.
- Mission result → app wiring point: `App.jsx:144 onMissionComplete`, mount at `App.jsx:295`.
- Theme tokens (`tailwind.config.js`): `accent #5EEAD4`, `canvas #020617`, `surface`, `ink/-muted/-faint`, `data.*` categorical palette, `.glass`, `.label-mono`, `animate-rowIn`.

### The contract (lock this shape — from `RADIX_Talent_Match_Hackathon.pdf` p.6)
```jsonc
// one skill
{ "skill_name": "...", "category_code": "DSA|COD|OOD|APTI|COMM|AI|CLOUD|SQL|SWE|SYSD|NETW|OS|OTHER",
  "evidence": "short quote or reason", "confidence": "high|medium|low" }
// extraction output (JD Analytics OR Résumé Parsing)
{ "source_type": "jd|resume", "source_file": "...", "company": "...", "role": "...", "skills": [ /* skill */ ] }
// résumé additionally: "education", "projects", "experience"
```
12 categories: **COD** Coding · **DSA** · **OOD** · **APTI** Aptitude · **COMM** Communication · **AI** · **CLOUD** · **SQL** · **SWE** · **SYSD** System Design · **NETW** Networking · **OS**; plus **OTHER** for named technologies.

### Sample / test data (read-only; for verification)
`D:/placement/randomsaturdayhackathon/isaac/RADIX Talent Match Hackathon/`
- `JDs/PDF/` + `JDs/Word/` — 6 JDs (Google SWE/Data Scientist, Microsoft SWE/Data Analyst, Oracle Assoc. SWE/App Support Analyst).
- `Resumes/PDF/` + `Resumes/Word/` — 4 résumés (Ananya Rao, Karthik Subramaniam, Priya Menon, Rohan Verma — deliberately different profiles).

### Anti-pattern guards (apply in every phase)
- ❌ No LangChain, no Python service, no cloud LLM. Only the onboard Ollama via `callOllama`.
- ❌ Don't add Ollama request params beyond `{ model, prompt, stream:false, options:{ temperature, num_predict } }`. Keep `stream:false` (existing code does not stream).
- ❌ Never trust raw model output — validate `category_code` against the 12-code enum and `confidence` against `high|medium|low`; drop/junk-bucket invalid entries.
- ❌ No blocking on the model — every extraction MUST degrade to the deterministic lexicon path when Gemma is offline or returns non-JSON, tagged `source:'local'`.
- ⚠️ Browser→`localhost:11434` CORS: Mission Control already does this successfully in this environment. If a new origin/port trips CORS, the fix is `OLLAMA_ORIGINS` on the Ollama host, not code. Note in the panel via the existing health dot.
- ⚠️ Keep document bytes on-device (reuse `extractResumeText`); only extracted **text** is sent to the local model.

---

## Phase 1 — RADIX contract module (`src/lib/radix.js`)

**What to implement (copy shapes from the contract above):**
- `RADIX_CATEGORIES`: ordered array of `{ code, label, blurb, color, angle }` for all 12 (angles evenly spaced `i/12*2π` for the constellation; colors from the `data.*` palette + accent, distinct per axis). Include a `CATEGORY_CODES` Set incl. `OTHER`.
- `CONFIDENCE = ['high','medium','low']`; `confidenceWeight('high'→1, 'medium'→0.66, 'low'→0.33)`.
- `normalizeSkill(raw) → skill|null` — coerces `skill_name` (string, trimmed), validates `category_code` (uppercase; unknown → `OTHER`), clamps `confidence` (default `low`), truncates `evidence` (≤160 chars).
- `normalizeSkillList(raw, { sourceType, sourceFile }) → { source_type, source_file, company, role, skills }` — validates `source_type ∈ {jd,resume}`, maps/dedupes skills by `(category_code, skill_name.toLowerCase())`, keeping the highest confidence.
- `RADIX_LEXICON`: `{ [CODE]: [keyword,…] }` mapping surface terms → RADIX codes (seed from `resumeMatch.SKILL_LEXICON`, but **re-bucketed to RADIX**: e.g. `kubernetes/aws/azure/gcp/docker/terraform → CLOUD`; `react/node/api/microservices/git → SWE`; `sorting/trees/graphs/complexity → DSA`; `sql/postgres/query/joins → SQL`; `pytorch/nlp/ml/llm → AI`; `system design/scalability/load balancing → SYSD`; `tcp/http/dns/routing → NETW`; `linux/process/threads/memory → OS`; `design patterns/solid/inheritance → OOD`; `stakeholder/presentation/writing → COMM`; `problem solving/quantitative → APTI`; `python/java/c++/go → COD`).

**Doc refs:** contract (Phase 0), `resumeMatch.js:19–66` (lexicon shape), `sectors.js` (ordered-rules + color-map idiom).

**Verification checklist:**
- Node harness: `normalizeSkillList` rejects `source_type:'foo'`, coerces bad `category_code`→`OTHER`, dedupes, clamps confidence. Assert every output skill passes a JSON-schema-style check.
- `RADIX_CATEGORIES.length === 12`; all `code` unique and ∈ enum.

**Anti-pattern guards:** don't silently keep unknown category codes; don't let the lexicon reference sector buckets.

---

## Phase 2 — Gemma skill-extraction agent (`src/agents/skillExtractionAgent.js` + prompt)

**What to implement (copy the orchestrator/narrative fallback pattern):**
- In `src/agents/prompts.js`, add `buildSkillExtractionPrompt({ text, sourceType })`:
  - Reuse the exact style of `buildIntentPrompt`/`buildNarrativePrompt` (role line, "Return only valid JSON. Do not explain.", explicit JSON template).
  - List the 12 codes + one-line definitions; instruct: map each requirement/skill to exactly one code (named tech/tools → `OTHER` with the tool as `skill_name`), quote a short `evidence` span, rate `confidence`.
  - JD variant: "Focus on **Key Responsibilities** and **What We're Looking For**." Résumé variant: "Also extract `education`, `projects` (name + 1-line), `experience` (role @ org, dates if present); tolerate messy layouts." (per brief p.4 tips.)
  - Truncate `text` to a safe budget (~6–8k chars) before embedding.
- `extractSkills({ text, sourceType, sourceFile, model }) → Promise<contractObject & { source:'gemma'|'local' }>`:
  1. `const ollama = await checkOllamaHealth(model)`.
  2. If `ollama.online`: `callOllama(buildSkillExtractionPrompt(...), { model: ollama.model, temperature: 0.1, numPredict: 900, timeoutMs: 12000 })` → `parseJsonObject` → `normalizeSkillList(..., { sourceType, sourceFile })` → tag `source:'gemma'`. On any throw → fallback.
  3. Fallback `extractSkillsLocally(text, …)`: tokenize (reuse `resumeMatch` helpers) → for each RADIX code, if any lexicon term hits, emit a skill `{ skill_name: <matched term>, category_code, evidence: '<surrounding snippet>', confidence:'low' }`; tag `source:'local'`.
- Return the contract object (`source_type/source_file/company/role/skills`), where `company`/`role` come from the model when present else `null`.

**Doc refs:** `orchestrator.js:14–30` (health→LLM→parse→normalize→catch→local), `narrativeAgent.js:34–55` (try/catch + slice guards), `ollamaClient.js`, `prompts.js`.

**Verification checklist (node harness against real text):**
- Extract text with `extractResumeText` from ≥2 sample JDs and ≥2 résumés (PDF+DOCX); run `extractSkills`; assert output validates against the contract and `skills.length ≥ 3`.
- Kill Ollama (or point health offline) → assert `source:'local'` and still contract-valid.
- Google SWE JD should surface COD/DSA/SWE/SYSD; Data Scientist JD should surface AI/SQL/DSA — results should visibly differ (brief's "not a constant" bar).

**Anti-pattern guards:** no second LLM round-trip for parsing (use `parseJsonObject`); never return unvalidated model JSON; always set `source`.

---

## Phase 3 — On-theme visualization (`src/components/spectrum/SkillConstellation.jsx`)

**What to implement:**
- Pure SVG radial "skill star-map": 12 spokes at `RADIX_CATEGORIES[i].angle`; per-axis node at radius `= f(count × confidenceWeight)`; connect nodes into a translucent polygon with additive-teal stroke (mirror `ConstellationGrid.jsx` line styling — `lineBasicMaterial`-equivalent via SVG `stroke` + low opacity + glow filter). Axis labels in `label-mono`; empty axes render as faint stubs.
- Color mode prop: `jd` → amber spectrum, `resume` → teal; support an optional second overlaid polygon for future gap view (kept behind a prop, not wired now).
- Named-tech (`OTHER`) skills render as small orbiting chips around the rim.

**Doc refs:** `ConstellationGrid.jsx` (radial geometry + additive glow idiom), `tailwind.config.js` (colors), `index.css` (`.glass`, `.label-mono`, `animate-rowIn`).

**Verification checklist:** Storybook-free — render inside the panel (Phase 4) with a mock contract object; confirm 12 axes, correct rotation, teal/amber modes, dark+light legible (`resize_window` colorScheme).

**Anti-pattern guards:** no external chart lib (build SVG by hand to match the bespoke aesthetic); no per-frame work (static SVG, CSS transitions only).

---

## Phase 4 — "Talent Scanner" HUD module (`src/components/spectrum/TalentScanner.jsx`)

**What to implement (copy MissionControl + UploadDock + AlignedStars shells):**
- Glass panel (mirror `MissionControl.jsx` chrome: `label-mono` header "TALENT SCANNER", subtitle "Gemma Core", online/offline dot from `checkOllamaHealth`, collapse/clear buttons).
- Source-type segmented toggle **JD ↔ Résumé**.
- Drop/browse "docking bay" (copy `UploadDock.jsx` drag/drop + stage machine `idle→reading→extracting→done|error`); on file → `extractResumeText(file)` → `extractSkills({ text, sourceType, sourceFile:file.name })`.
- Result render: `<SkillConstellation>` + a by-category skill list (copy `AlignedStars.jsx` rows: category dot color, `skill_name`, confidence pill, `evidence` sub-line, `animate-rowIn` stagger). Show a `source:'gemma'|'local'` badge (reuse the health-dot language: "Gemma Core" vs "Offline fallback").
- Résumé mode also renders a **Dossier** card group (education / projects / experience) as glass cards.
- Entry point: a launcher pill + a toggle in `HudOverlay.jsx`, cosmos-view only, positioned to not collide with Mission Control (bottom-left) or the résumé launcher — e.g. top-left cluster; gate other HUD chrome like the résumé drawer already does.

**Doc refs:** `MissionControl.jsx:125–192`, `UploadDock.jsx`, `AlignedStars.jsx`, `HudOverlay.jsx` (gating + launcher pattern), `App.jsx:70–135, 295` (state lift + mount).

**Verification checklist:** `preview_start` → upload a sample JD PDF and a résumé DOCX → constellation + list render, no console errors, `source` badge correct; offline → fallback badge + still renders.

**Anti-pattern guards:** don't duplicate the Ollama client or the parser; reuse. Keep the panel `pointer-events-auto` island over the `pointer-events-none` HUD (existing convention).

---

## Phase 5 — Cosmos tie-in + résumé structured fields

**What to implement:**
- "**Project onto the Cosmos**" button on a result: map the extracted skill list back to text and call the existing `analyzeResume(skillText, companies)` → set `matchSet`/`linkOrder` (App state already supports these) so aligned company nodes ignite — connecting the new missions to the 3D scene and reusing the constellation/launch-sequence infra with zero new 3D code.
- Résumé structured fields (`education/projects/experience`) already come from Phase 2's résumé prompt; render in the Dossier and shape them so a future **Profile Builder** (hackathon Role 3) can pre-fill — expose `toProfileDraft(result)`.

**Doc refs:** `App.jsx` (`matchSet`, `linkOrder`, `RESUME_BLAZE`), `resumeMatch.analyzeResume`, `AlignedStars.jsx`.

**Verification checklist:** clicking "Project onto the Cosmos" ignites nodes; clearing resets; résumé Dossier populates for ≥2 sample résumés.

**Anti-pattern guards:** don't fork the highlight system — feed the existing `matchSet`/`linkOrder`.

---

## Phase 6 — Final verification

1. **Contract conformance:** node harness asserts every extraction (JD + résumé, PDF + DOCX, Gemma + offline) validates against the Phase 0 JSON schema; run over **all 6 JDs + all 4 résumés**.
2. **"Not a constant" check:** confirm the 4 résumés and the 6 JDs produce visibly different constellations (per brief's "Done" bar).
3. **Build:** `npm run build` clean (watch the known pre-existing chunk-size warning only).
4. **Runtime:** `preview_start`, exercise JD + résumé uploads in the browser; check `read_console_messages`; screenshot the constellation for both modes (light + dark).
5. **Fallback:** stop Ollama; confirm graceful `source:'local'` path end-to-end.
6. **Anti-pattern grep:** `grep -rn "langchain\|openai\|anthropic\|/api/chat\|stream: *true" src` → expect no hits; confirm only `callOllama`/`checkOllamaHealth` reach the model.
7. `graphify update .` to refresh the code graph.

---

## Suggested new files (all under `portal/src`)
- `lib/radix.js` — categories, contract validators, RADIX lexicon.
- `agents/skillExtractionAgent.js` — `extractSkills` (Gemma + fallback).
- `agents/prompts.js` — **add** `buildSkillExtractionPrompt` (don't fork the file).
- `components/spectrum/SkillConstellation.jsx` — the 12-point star-map.
- `components/spectrum/TalentScanner.jsx` — the HUD module (upload → extract → render).
- Small edits: `HudOverlay.jsx` (launcher + toggle), `App.jsx` (lift `scan` state; optional cosmos projection).

## Out of scope (later hackathon roles, but designed-for)
Profile Builder (Role 3), Talent Check (Role 4 — needs `talent_check_company_skillsets.json`), Skill Matching (Role 5). The Phase 3 overlay prop + Phase 5 `toProfileDraft` leave clean seams for these.
