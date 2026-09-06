# Unified Context Plan Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the category-based demo with one persistent, multi-horizon plan that adapts task suggestions to health and simulated weather while retaining voice and MiMo AI generation.

**Architecture:** Keep the existing single-page Vela quick app and split pure planning decisions from UI state. `planner.js` will produce a normalized plan from goal, period, profile, health, weather, importance, and mood; `plan-store.js` will persist JSON through `@system.storage`; the page will expose today-first execution with weekly progress and monthly/quarterly milestones. Reminders are represented by a local in-app timer and a clear fallback message because the installed simulator has no verified notification/alarm feature.

**Tech Stack:** openvela quick app UX, JavaScript, `@service.health`, `@system.storage`, existing `@system.record`/`@system.fetch`/`@system.velaclaw`, Node test scripts.

## Global Constraints

- Keep voice input and MiMo AI as optional primary inputs; retain local rule fallback.
- Do not claim medical diagnosis or treat a single heart-rate sample as a universal threshold.
- Use内置天气场景 `clear`, `rain`, `hot`, `wind`; no location, third-party weather key, music account, or cloud sync.
- Persist only plan data and user-selected demo settings locally; never persist API keys.
- Preserve the current `npm test` command and the official watch simulator target.
- Important tasks may be deferred or adjusted, but never silently deleted.

### Task 1: Define unified planning rules

**Files:**
- Modify: `quickapp/hello_quickapp/src/pages/index/planner.js`
- Test: `backend/test/planner.test.js`

**Interfaces:**
- `createPlan({ text, period, important, reminderTime, weather, mood, profile, vitals, now })` returns `{ id, title, period, goal, tasks, important, reminderTime, weather, context, vitals, reviewQuestion, nextAdvice }`.
- Each task contains `{ id, dayOffset, time, type, name, duration, tip, priority, reminderTime, status, adjustmentReason }`.
- Export `PERIODS`, `WEATHER_SCENARIOS`, `healthStatus`, `weatherAdjustment`, `createPlan`, `completeNextTask`.

- [ ] Add tests for a unified plan with no category field, week tasks carrying `dayOffset`, important-task reminder metadata, rainy-weather outdoor-task adjustment, and a high-heart-rate relative-to-profile adjustment.
- [ ] Run `npm test`; confirm the new tests fail because the period/context interfaces do not exist.
- [ ] Replace category branches with one goal-driven task generator. Use `maxHeartRate = 208 - 0.7 * age`, `heartRateReserve = maxHeartRate - restingHeartRate`, and a three-sample average when samples are supplied. For pre-task caution, use `averageHeartRate >= max(100, restingHeartRate + 20)` as a demo heuristic, explicitly labeled non-medical.
- [ ] Generate today detail, seven-day `dayOffset` tasks for week, and milestone summaries for month/quarter. Mark the first goal task important when `important` is true and carry `reminderTime` onto it.
- [ ] Apply weather rules: rain/wind changes outdoor exercise to indoor movement or defers it; hot weather shortens outdoor activity and adds hydration; clear weather leaves the plan unchanged.
- [ ] Add `context` and `adjustmentReason` strings for every automatic change, and keep `completeNextTask` compatible with the new task shape.
- [ ] Run `npm test`; confirm all planner and existing tests pass.
- [ ] Commit with `feat: add unified context-aware planning rules`.

### Task 2: Add local persistence and reminder state

**Files:**
- Create: `quickapp/hello_quickapp/src/pages/index/plan-store.js`
- Test: `backend/test/plan-store.test.js`
- Modify: `quickapp/hello_quickapp/src/manifest.json`

**Interfaces:**
- `savePlan(storage, plan, callbacks)` writes one JSON value under `velaplan.plan.v2`.
- `loadPlan(storage, callbacks)` returns the parsed plan or `null` for missing/invalid data.
- `clearPlan(storage, callbacks)` removes the saved plan when the platform exposes `delete`; otherwise overwrites with an empty value.

- [ ] Add a Node-compatible storage adapter test covering save serialization, load parsing, invalid JSON fallback, and missing data.
- [ ] Run the focused test and confirm it fails before the module exists.
- [ ] Implement the adapter with dependency injection so unit tests do not require a device; use `@system.storage` only from the page.
- [ ] Add `@system.storage` to the app manifest feature list.
- [ ] Run `npm test`; confirm persistence tests and existing tests pass.
- [ ] Commit with `feat: persist plans locally`.

### Task 3: Replace category UI with unified plan controls

**Files:**
- Modify: `quickapp/hello_quickapp/src/pages/index/index.ux`
- Modify: `quickapp/hello_quickapp/src/pages/index/health.js` only if the page needs sample averaging support.
- Test: `backend/test/watch-layout.test.js` and `backend/test/watch-voice-page.test.js`

**Interfaces:**
- Page state exposes `period`, `important`, `reminderTime`, `weatherScenario`, `moodLow`, `profile`, `plan`, `reviewText`, and `reminderMessage`.
- Page actions are `setPeriodToday`, `setPeriodWeek`, `setPeriodMonth`, `setPeriodQuarter`, `toggleImportant`, `setWeatherClear`, `setWeatherRain`, `setWeatherHot`, `setWeatherWind`, `toggleMood`, `generatePlan`, `finishOne`.

- [ ] Add layout assertions requiring period controls, weather controls, important/reminder controls, context explanation, and removal of category labels.
- [ ] Run the focused layout tests and confirm they fail against the category UI.
- [ ] Replace category chips with period controls; add a goal field, important toggle, reminder time input, weather scenario control, and optional mood check-in.
- [ ] Render today task detail first, show weekly progress or month/quarter milestones, and show `context` plus each task's `adjustmentReason`.
- [ ] Load the saved plan on page show, save after generation and completion, schedule an in-app reminder timer for the configured time, and show `继续 / 调整 / 延期` actions without deleting important tasks.
- [ ] Keep voice transcription confirmation and `@system.velaclaw` plan generation; pass the new payload and fall back to local planning on failure.
- [ ] Run the full test suite and a release build; confirm the page compiles and existing voice tests pass.
- [ ] Commit with `feat: add unified plan watch workflow`.

### Task 4: Update demo and submission documentation

**Files:**
- Modify: `docs/03-demo-script.md`
- Modify: `docs/04-submission-checklist.md`
- Modify: `submission/work-description-draft.md`
- Modify: `README.md`

- [ ] Replace category-based demo steps with unified goal, period, important reminder, weather adjustment, health adjustment, execution, and review steps.
- [ ] Document that weather is an internal simulator scenario and reminders are in-app unless a verified system API is available.
- [ ] Document the heart-rate formula and non-medical heuristic without presenting it as a clinical rule.
- [ ] Run `npm test` and `npm run release`, then update the submission RPK checksum and rebuild `submission/VelaPlan-source.zip`.
- [ ] Verify the final package contains no API key, private key, build cache, or placeholder log/video.
- [ ] Commit with `docs: update unified plan submission materials`.

## Acceptance Criteria

- A user can create one plan from voice or text without selecting a life-domain category.
- The plan supports today/week/month/quarter, with today-first watch execution and weekly progress.
- An important task carries a reminder time and remains visible when context changes.
- At least one health and one weather scenario visibly produce an explained adjustment.
- Plans and completion state survive page reload through local storage.
- Existing voice, AI fallback, health, completion, and review flows remain functional.
- `npm test` passes, `npm run release` exits successfully, and the generated RPK matches the source version.
