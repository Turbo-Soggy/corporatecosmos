# Plan — RADIX Talent Match: Profile Builder + Talent Check + Skill Matching (on-theme)

**Depends on** `plans/radix-skill-spectrum.md` (Roles 1–2). That plan delivers the shared infra this one consumes:
`lib/radix.js` (12 categories, contract validators, RADIX lexicon), `agents/skillExtractionAgent.js` (Gemma + deterministic fallback → skill lists), `components/spectrum/SkillConstellation.jsx` (12-point star-map, supports an overlay prop), `components/spectrum/TalentScanner.jsx`, and `toProfileDraft(result)`. **Build Roles 1–2 first, or at minimum land `lib/radix.js` + the contract shapes.**

**Goal.** Add the last three RADIX Talent Match missions to the Corporate Cosmos portal:
3. **Profile Builder** — a candidate builds/saves a full profile (details, skills, hackathons/internships, certifications, preferred roles, CV), pre-filled from Résumé Parsing.
4. **Talent Check** — one action compares a saved profile against a selected company's expected bar across all 12 RADIX skillsets → readiness score + per-skillset gap.
5. **Skill Matching** — compares a profile/résumé against **one specific JD's** extracted skill list → match score + matched/missing lists.

**Constraints (unchanged):** LLM = onboard **`gemma4:12b`** via local Ollama, used **only where it genuinely helps** (Skill Matching's fuzzy aliasing) with a deterministic fallback — never LangChain/Python/cloud. Everything client-side. Stay on-theme (glass HUD, teal `#5EEAD4`, constellation motifs).

**Creative through-line.** These three become the "back half" of the **Talent Scanner** cockpit:
- Profile Builder = a glass **"Candidate Dossier"** with the candidate's own 12-point constellation.
- Talent Check = **"Readiness Scan"** — the candidate constellation (teal) overlaid on the company's required bar (amber), a per-skillset gap ladder, and a readiness dial. Binds to a **selected cosmos company node** (Google / Microsoft / OFSS all exist in the scene).
- Skill Matching = **"Skill Match"** — the JD constellation with matched spokes lit and missing spokes dimmed, a match score, and a gap list foregrounded (per the brief: the gap list matters more than the number).

---

## Phase 0 — Documentation Discovery (Allowed APIs)

### Reused from the Roles 1–2 plan (cite, don't rebuild)
- `lib/radix.js` — `RADIX_CATEGORIES` (code/label/color/angle ×12), `CATEGORY_CODES`, `CONFIDENCE`, `confidenceWeight`, `normalizeSkill`, `normalizeSkillList`, `RADIX_LEXICON`.
- `agents/skillExtractionAgent.js` — `extractSkills({text,sourceType,sourceFile}) → { source_type, source_file, company, role, skills[], source }`.
- `agents/ollamaClient.js` — `checkOllamaHealth`, `callOllama(prompt,{model,temperature,numPredict,timeoutMs})`, `parseJsonObject` (model `gemma4:12b`, `/api/generate`, `stream:false`). Same LLM+fallback pattern as `orchestrator.js`/`narrativeAgent.js`.
- `components/spectrum/SkillConstellation.jsx` — 12-point SVG star-map with a second-polygon **overlay** prop (Talent Check & Skill Match use it).
- `resumeParse.extractResumeText` (PDF/DOCX, on-device); `resumeMatch` tokenizer helpers.

### The contract shapes for these roles (from `RADIX_Talent_Match_Hackathon.pdf` p.6 — lock these)
```jsonc
// Profile Builder output
{ "name":"...", "email":"...", "education":"...", "skills":[ /*skill*/ ],
  "hackathons":[...], "internships":[...], "certifications":[...],
  "preferred_roles":[...], "cv_file":"..." }
// Talent Check output
{ "company":"...", "skillset_gap":[ { "category_code":"...", "required_level":1-10,
  "candidate_level":1-10, "gap":true|false } ], "readiness_score":0-100 }
// Skill Matching output
{ "jd_source_file":"...", "match_score":0-100, "matched_skills":[...], "missing_skills":[...] }
```

### New findings that shape the plan
- **NO `talent_check_company_skillsets.json` exists** in the repo (searched whole tree). The brief says request it from the facilitator. → Phase 1 **seeds a placeholder** `src/data/talent_check_company_skillsets.json` (Google / Microsoft / Oracle FSS × 12 required levels 1–10), clearly commented as swappable. Design the loader so dropping in the real file needs no code change.
- **NO client-side persistence exists** in the portal (`grep localStorage|indexedDB|persist` → 0 hits). → Profile Builder introduces a small `lib/profileStore.js` using **localStorage** (`radix.profile.v1`) + **JSON export/import** (download/`<input type=file>`), matching the brief's "save/load mechanism (JSON)".
- **Company binding:** Talent Check's 3 companies map to existing cosmos nodes by name (`Microsoft`, `Google`, `OFSS` appear in the leaderboard). Bind Talent Check to the currently-`selected` company node; enable only when the selected company has a skillset bar.
- **Theme tokens / HUD patterns:** `MissionControl.jsx` (panel chrome), `AlignedStars.jsx` (rows/pills/`animate-rowIn`), `CompanyPanel.jsx` (right-drawer), `tailwind.config.js` (`accent`, `data.*`, `pos`/`neg`, `.glass`, `.label-mono`).

### The two design decisions to lock BEFORE coding (brief calls these out)
1. **Level derivation (skills → 1–10).** The contract skills carry `confidence` (high/med/low), not levels. Define one transparent formula in `lib/radix.js`:
   `candidate_level(category) = clamp(round( 2·Σ confidenceWeight(skill) + bonus ), 0, 10)` where `bonus` adds for certifications/hackathons/internships/preferred_roles that hit that category's lexicon. Document it; make it tunable in one place.
2. **"Ready" numerically (readiness score).** Define in one place:
   per category `met = clamp(candidate_level / required_level, 0, 1)`; `readiness_score = round(100 · Σ(w_c · met_c) / Σ w_c)` with weights `w_c = required_level` (a company that demands more of a skill weights that skill more). `gap = candidate_level < required_level`. This makes scores **visibly differ per candidate** (the brief's "not a constant" bar).

### Anti-pattern guards
- ❌ Don't fabricate a "real" company skillset source — use the seeded JSON, clearly marked placeholder; loader must accept the facilitator file drop-in.
- ❌ Don't reach for the LLM in Profile Builder or Talent Check (plain code). Only Skill Matching may use Gemma for fuzzy aliasing, and only with a deterministic fallback + `source` tag.
- ❌ No backend / no Supabase writes — localStorage + JSON files only.
- ❌ Don't fork `SkillConstellation`/`TalentScanner`/`skillExtractionAgent` — extend/consume them.
- ⚠️ Clamp everything: levels 1–10, scores 0–100. Never emit a category_code outside the 12+OTHER enum.
- ⚠️ Scoring must not be constant — verify different sample candidates yield different scores (Phase 6).

---

## Phase 1 — Contract extensions, level model, company-bar data (`lib/radix.js` + `src/data/…`)

**What to implement (copy shapes from Phase 0 contract):**
- Add to `lib/radix.js`:
  - `normalizeProfile(raw) → profile` — validates/dedupes the Profile Builder shape; each `skills[]` item through `normalizeSkill`; arrays coerced; strings trimmed.
  - `categoryLevels(profile) → { [CODE]: 0-10 }` — the documented level formula (design decision #1). Pure, unit-testable.
  - `normalizeTalentCheck({company, skillset_gap, readiness_score})` and `normalizeSkillMatch({jd_source_file, match_score, matched_skills, missing_skills})` — clamp/validate.
- Seed `src/data/talent_check_company_skillsets.json`:
  ```jsonc
  // PLACEHOLDER — swap for facilitator's real snapshot; same shape.
  { "Google": { "SWE":8, "DSA":9, "COD":9, "SYSD":8, "AI":7, "SQL":6, "OOD":7, "APTI":7, "COMM":7, "CLOUD":6, "NETW":5, "OS":6 },
    "Microsoft": { ... }, "OFSS": { ... } }
  ```
- `lib/companyBar.js` — `loadCompanyBar(companyName) → { [CODE]: 1-10 } | null` (case/alias-insensitive lookup; alias map e.g. `Oracle FSS/Oracle Financial → OFSS`).

**Doc refs:** Phase 0 contract; `lib/radix.js` validators; `sectors.js` (alias/ordered-rules idiom).

**Verification checklist (node harness):** `categoryLevels` returns 12 clamped values; two different profiles yield different level maps; `loadCompanyBar('Google')` returns 12 codes; unknown company → `null`; `normalize*` reject bad codes/out-of-range.

**Anti-pattern guards:** level/score formulas live in ONE place; no magic constants scattered; JSON marked placeholder.

---

## Phase 2 — Profile Builder (`lib/profileStore.js` + `components/spectrum/ProfileBuilder.jsx`)

**What to implement (plain code + copy HUD chrome):**
- `lib/profileStore.js`: `loadProfile()`, `saveProfile(profile)` (localStorage `radix.profile.v1`, JSON), `exportProfile(profile)` (Blob download), `importProfile(file)` (parse + `normalizeProfile`), `emptyProfile()`. **Get the save/load loop working first with dummy data** (brief tip — unblocks Roles 4/5).
- `components/spectrum/ProfileBuilder.jsx`: glass "Candidate Dossier" panel (mirror `CompanyPanel.jsx` drawer + `AlignedStars.jsx` sections/rows). Fields: name, email, education, skills (chips w/ category color + confidence, add/remove/edit), hackathons, internships, certifications, preferred_roles (tag inputs), cv_file (reuse `UploadDock` dropzone → store filename; optionally auto-run `extractSkills` to pre-fill).
- **Pre-fill from Résumé Parsing:** accept a `draft` from `toProfileDraft(resumeResult)` (Role 2 seam) to populate skills/education/etc.; user edits then Save.
- Live mini `<SkillConstellation mode="resume">` of the candidate's own spectrum from `categoryLevels(profile)`.

**Doc refs:** `CompanyPanel.jsx` (drawer), `AlignedStars.jsx` (rows/pills/chips), `UploadDock.jsx` (CV upload), `resumeParse`/`skillExtractionAgent` (pre-fill).

**Verification checklist:** create → Save → reload page → profile persists; Export → Import round-trips identically; pre-fill from a sample résumé populates ≥5 skills; output validates via `normalizeProfile`.

**Anti-pattern guards:** no LLM required here; don't block Save on Ollama; keep CV bytes on-device (store only filename).

---

## Phase 3 — Talent Check (`lib/talentCheck.js` + `components/spectrum/ReadinessScan.jsx`)

**What to implement (plain scoring + overlay viz):**
- `lib/talentCheck.js`: `runTalentCheck(profile, companyName) → { company, skillset_gap[12], readiness_score }` using `categoryLevels(profile)` vs `loadCompanyBar(companyName)` and the documented readiness formula (design decision #2). Pure function.
- `components/spectrum/ReadinessScan.jsx`: triggered by a **"Talent Check"** button, enabled when a company with a bar is `selected`. Renders:
  - `<SkillConstellation>` with the **overlay** prop: candidate polygon (teal) over required polygon (amber).
  - A per-skillset **gap ladder** (12 rows: category dot, `candidate_level`/`required_level` mini-bars, `pos`/`neg` tint on met/gap) — copy `ClusterCard.jsx`/`RegionBar.jsx` bar idiom.
  - A **readiness dial** (big number + ring) using `pos`/`accent`/`neg` by threshold.
- Bind company via the existing `selected` node; label with `companyName`.

**Doc refs:** `ClusterCard.jsx`/`dashboard/RegionBar.jsx` (ranked bars), `SkillConstellation.jsx` (overlay), `App.jsx` (`selected`), `tailwind.config.js` (`pos`/`neg`).

**Verification checklist:** run for 2 sample candidates × Google → **different** readiness scores + gap sets; every `skillset_gap` has 12 entries with clamped 1–10 and correct `gap` boolean; unknown company disables the button.

**Anti-pattern guards:** no LLM; scoring not constant; all values clamped; don't hardcode a single company.

---

## Phase 4 — Skill Matching (`lib/skillMatch.js` + optional Gemma alias pass + `components/spectrum/SkillMatch.jsx`)

**What to implement:**
- `lib/skillMatch.js`: `matchSkills(candidateSkills, jdSkillList) → { jd_source_file, match_score, matched_skills, missing_skills }`.
  - Deterministic core: index candidate skills by `category_code` + normalized name + an **alias map** (e.g. `js↔javascript`, `k8s↔kubernetes`, `postgres↔sql`); a JD skill is **matched** if a candidate skill shares its category_code AND (name/alias overlap OR the candidate has ≥1 skill in that category for broad categories like DSA/OS). `match_score = round(100 · Σ matched·weight / Σ jd·weight)`, `weight = confidenceWeight(jd skill)` so missing a "high" JD requirement costs more.
  - **Optional Gemma pass** (`agents/skillMatchAgent.js`, mirrors `narrativeAgent.js`): prompt Gemma to align two skill lists into matched/missing when online; **fallback to deterministic** on offline/parse-fail; tag `source`. Default remains deterministic.
- `components/spectrum/SkillMatch.jsx`: pick a JD (from a prior JD Analytics extraction or fresh upload via `TalentScanner`), run against the active profile/résumé. Render JD constellation with matched spokes lit / missing dimmed, the score, and a **prominent missing-skills gap list** (brief tip). Copy `AlignedStars.jsx` row styling.

**Doc refs:** `narrativeAgent.js` (LLM+fallback+`source`), `skillExtractionAgent.js` (JD skill list input), `resumeMatch.js` (tokenize/alias idioms), `AlignedStars.jsx`.

**Verification checklist:** match a systems-leaning résumé vs Google SWE JD vs Data Scientist JD → **different** scores + missing lists; offline → `source:'local'` still returns matched/missing; score clamped 0–100; gap list non-empty when JD has unmet skills.

**Anti-pattern guards:** deterministic path is the default and must stand alone; don't let a Gemma failure throw; prioritize/render `missing_skills` over the number.

---

## Phase 5 — Integration: one Talent Scanner flow

**What to implement:**
- Unify Roles 1–5 into the **TalentScanner** module as tabs/steps: **Scan JD → Scan Résumé → Build Profile → Readiness Scan → Skill Match** (the brief's end-to-end flow). Carry state in a small `useTalentSession` hook (last JD extraction, last résumé extraction, active profile).
- Wire launcher + gating in `HudOverlay.jsx`; lift session state in `App.jsx` next to `resume`/mission state. Reuse the cosmos highlight (`matchSet`/`linkOrder`) so a profile or JD can still ignite compatible company nodes.
- Ensure Talent Check reads the `selected` cosmos company; if the user selects Google/Microsoft/OFSS, the button lights up.

**Doc refs:** `App.jsx` (state lift, `selected`, `matchSet`/`linkOrder`, `onMissionComplete`), `HudOverlay.jsx` (launcher/gating), prior plan's `TalentScanner.jsx`.

**Verification checklist:** end-to-end for one combo — pick Google SWE JD → parse a résumé → build/save profile → Talent Check vs Google → Skill Match vs the JD — all render, no console errors, all outputs contract-valid.

**Anti-pattern guards:** don't duplicate upload/extract/constellation code across tabs — share via the module; one source of session truth.

---

## Phase 6 — Final verification

1. **Contract conformance harness:** every output (profile, talent check, skill match) validates against Phase 0 shapes; run profiles for all **4 sample résumés** and Talent Check against all **3 companies**, Skill Match against ≥3 of the **6 JDs**.
2. **"Not a constant" bar (brief's Done criteria):** assert readiness scores and match scores **differ across the 4 candidates**; snapshot the numbers in the harness output.
3. **Persistence:** Save → reload → Export → Import round-trip is lossless.
4. **Offline fallback:** stop Ollama → Skill Match still returns via deterministic path (`source:'local'`); Profile/Talent Check unaffected (no LLM).
5. **Build:** `npm run build` clean (only the known chunk-size warning).
6. **Runtime:** `preview_start`; walk the full flow; `read_console_messages`; screenshot Readiness Scan (dual constellation + dial) and Skill Match (gap list) in light + dark.
7. **Anti-pattern grep:** `grep -rn "langchain\|openai\|anthropic\|supabase.*insert\|/api/chat" src` → no hits; confirm Talent Check/Profile contain no LLM calls.
8. `graphify update .`.

---

## Suggested new files (all under `portal/src`)
- `data/talent_check_company_skillsets.json` — seeded placeholder bar (swap for facilitator's).
- `lib/companyBar.js` — company-bar loader + alias map.
- `lib/profileStore.js` — localStorage + JSON import/export.
- `lib/talentCheck.js` — readiness scoring.
- `lib/skillMatch.js` — deterministic matcher + alias map.
- `agents/skillMatchAgent.js` — optional Gemma alias pass (fallback to `skillMatch.js`).
- `components/spectrum/ProfileBuilder.jsx`, `ReadinessScan.jsx`, `SkillMatch.jsx`.
- `hooks/useTalentSession.js` — shared session state.
- **Edits:** `lib/radix.js` (profile/talentcheck/skillmatch validators + `categoryLevels`), `HudOverlay.jsx` (launcher/tabs), `App.jsx` (session state).

## Design decisions surfaced for the user (lock before executing)
- **Level formula** (skills+confidence+profile signals → 1–10) and **readiness formula** (required-level-weighted coverage → 0–100) — both proposed above, both tunable in one place. Swap in your own definition of "ready" if you prefer a hard threshold.
- **Company skillset bar** is a **placeholder** until the facilitator's `talent_check_company_skillsets.json` arrives — same shape, drop-in.
- **Persistence** = localStorage + JSON file export/import (no backend). Say the word if you'd rather persist candidate profiles to Supabase.
