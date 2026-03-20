# Feature: testing-status-and-vitetest

## Context

From github task:

```
Goal

Reduce risk during refactoring by documenting test coverage baseline.
Scope

Review current test suite and coverage signals
Document how to run tests locally and in CI
Acceptance criteria

Capture coverage and indicate within README

```

I think Vitetest should be used as we now use vite.

Migration order:

1. Add Vitest config to `vite.config.mjs`
2. Add Vitest dependencies
3. Migrate test files
4. Update scripts
5. Remove Jest dependencies
6. Update documentation

## Scope Check

[Answer these questions honestly before writing the rest of the spec.
If any answer suggests this is too large, split into multiple specs first.]

- How many new screens or views? [aim for 1-2 per spec] 0
- How many new components? [aim for 3-5 per spec] 0
- How many new API endpoints consumed? [aim for 1-2 per spec] 0
- How many existing files modified? [aim for under 10 per spec]
  The scope should explicitly include `package.json`, `vite.config.mjs`, `README.md`, and all `*.spec.ts` / `*.test.ts` files anywhere in `src/`.
- Could any part of this feature ship independently? [if yes, split it out] Yes, but it's just test writing.

## Dependencies

None — this feature is self-contained.

## User Story

As a developer, I want to observe the current test state for the repo, so that I can understand how well this repo is maintained.

## Acceptance Criteria

- [ ] Vitest is configured as the primary test runner. ALL existing Jest tests (regardless of current pass/fail status) are migrated. After migration, each test must have the same pass/fail status it had before migration. Jest dependencies are removed from `package.json`.
- [ ] Migrate all `*.spec.ts` and `*.test.ts` files found anywhere under `src/`, not just the directories listed in the file map.
- [ ] Add a 'Testing Status' section to `README.md` that includes:
  - Instructions: `yarn test`, `yarn test:coverage`, and `yarn test:watch`
  - Current coverage percentage (captured from first successful Vitest run)
  - Link to local coverage report (`coverage/index.html`) — note this path is for local development only
  - Common Vitest commands: run a single test file, update snapshots (`yarn test --update-snapshots`)
- [ ] Clean up all Jest-specific configuration:
  - [ ] Remove `jest` key from `package.json` if present
  - [ ] Remove or update `.babelrc` / `babel.config.*` Jest transforms
  - [ ] Replace `@types/jest` with `@types/vitest` in `tsconfig.json`
  - [ ] Remove any `jest.config.js` or `jest.config.ts` files
- [ ] Ensure the `test` script in `package.json` is updated to run Vitest in a non-watch, CI-friendly mode that returns a non-zero exit code on failure.
- [ ] Migration must be atomic — all tests migrate in a single PR.
- [ ] Expected `package.json` scripts: `test`, `test:coverage`, `test:watch`, `test:ui`.
- [ ] Coverage baseline is captured on the first successful Vitest CI run. Subsequent CI runs must fail if coverage drops below that baseline.
- [ ] Coverage provider: `v8` (default, no extra deps).
- [ ] For coverage output format, use mainstream/best practices (e.g., `text`, `html`, `lcov`).
- [ ] Test file patterns follow current `*.spec.ts` pattern.
- [ ] Vitest configuration MUST support Web Components via DOM environment jsdom.
- [ ] Globals: false. All Vitest APIs (`describe`, `it`, `expect`, `vi`, `beforeEach`, `afterEach`, etc.) must be explicitly imported from `'vitest'` in every test file. Example:
  ```typescript
  // ✅ DO: explicit imports
  import { describe, it, expect, vi, beforeEach } from 'vitest'

  // ❌ DON'T: rely on globals
  ```
- [ ] Replace all `jest.*` calls with `vi.*` equivalents.
- [ ] Review all `__mocks__` directories. Vitest resolves manual mocks via the same `__mocks__` convention as Jest, but verify each mock file works correctly and update any `jest.mock()` calls to `vi.mock()`.
- [ ] Verify custom Jest matchers (if any) have Vitest equivalents; document any that do not.
- [ ] Snapshot files: verify all existing snapshots load correctly under Vitest, run snapshot tests post-migration, and confirm no unexpected changes. (Vitest uses the same `__snapshots__` directory structure.)

## UI Behaviour

[Step-by-step description of what the user sees and does.]

N/A

## Data Model

[TypeScript interfaces for all data involved.]

N/A

## API / State

[API endpoints consumed, state stores affected, storage mechanisms used.]

N/A

## Out of Scope

- Adding new tests — only migrate existing ones.
- Refactoring test logic — migrate as-is, do not improve.
- CI/CD pipeline configuration (e.g., GitHub Actions workflow files) — tracked separately.
- E2E tests with Playwright — separate concern.
- Setting up hosted coverage reports (Codecov, GitHub Pages, etc.) — tracked separately.

## Technical Constraints

- Vitest must be configured with a DOM environment (`jsdom`) to support testing of Web Components and DOM manipulation.
- Use latest stable Vitest version compatible with the project's current Node.js version.
- Coverage provider: `v8` (built-in, no additional packages required).
- `globals: false` — no implicit globals; all APIs must be imported explicitly.

## Pipeline Phases

[All phases are enabled by default. To skip a phase, add `skip` after the
dash. This is useful when a phase doesn't fit your task — for example,
skip "Test Generation" for a test-migration task, or skip "Spec Review"
for a well-established spec.]

- Phase 0: Spec Review
- Phase 1: Planning
- Phase 2: Test Generation skip
- Phase 3: Implementation
- Phase 4: Documentation

## Review Log

<!-- Auto-populated by the pipeline as reviewers analyze this spec and plan.
     Each round records what was flagged, what was changed, and what was declined. -->

### Spec Review — Round 1
- **Accepted:**
  - Removed reference to non-existent `pipeline.config.json`; replaced with actual files in scope (Gemini #1)
  - Clarified `coverage/index.html` link is for local development only (Gemini #3)
  - Added explicit import example showing all Vitest APIs (`describe`, `it`, `expect`, `vi`, etc.) must be imported from `'vitest'` — not just `vi` (Gemini #5, Qwen #9)
  - Resolved contradiction between "no coverage threshold" and "fail if drops": baseline is captured on first successful CI run; subsequent runs fail if below baseline (Gemini #4)
  - Expanded test file scope to "all `*.spec.ts` and `*.test.ts` files anywhere under `src/`" (Qwen #1)
  - Clarified "passing tests" definition: migrate ALL tests regardless of current status; preserve pass/fail parity (Qwen #2)
  - Added snapshot verification acceptance criteria: load check, post-migration run, update command documented (Qwen #3)
  - Added mock files migration note: verify `__mocks__` compatibility and `jest.mock()` → `vi.mock()` (Qwen #4)
  - Added explicit config file cleanup checklist: `jest` key in `package.json`, `.babelrc`, `@types/jest` → `@types/vitest`, `jest.config.*` removal (Qwen #5)
  - Marked CI/CD pipeline configuration (workflow files, hosted reports) explicitly out of scope (Qwen #6)
  - Added `test:watch` script to expected scripts (Qwen #12)
  - Added coverage provider specification (`v8`) to Technical Constraints (Qwen recommended addition)
  - Expanded Out of Scope section with explicit items (Qwen recommended addition)
  - Fixed malformed Dependencies section (stale template text removed)
- **Declined:**
  - Gemini #2 (specify CI service and hosting platform): CI/CD config is explicitly out of scope; naming a specific service (GitHub Actions, Codecov) is premature and would over-constrain implementation.
  - Gemini #6 (file count observation): Not actionable — just a "keep an eye on it" note; no spec change warranted.
  - Qwen #7 (parallel test execution): Vitest handles parallelisation by default; no evidence of issues with this codebase. Too speculative to add as a constraint.
  - Qwen #8 (specific jsdom `environmentOptions` config snippet): Too prescriptive for a spec; implementation should determine exact jsdom options needed.
  - Qwen #10 (add `@testing-library/jest-dom` setup): No evidence this project uses Testing Library. The existing criterion "verify custom Jest matchers have Vitest equivalents" is sufficient.
  - Qwen #11 (rollback procedure / broken-state safeguard): The "atomic migration in a single PR" criterion already covers this. Documenting a rollback procedure adds noise without value.
  - Qwen "User Story addition": Existing user story is adequate; the additional story is implied by the README acceptance criteria already present.
- **Timestamp:** 2026-03-20 23:23

### Plan Review — Round 1
- **Accepted:**
  - Added `eslint.config.mjs` to files table with step to remove `...globals.jest` from `languageOptions.globals` (Gemini #1)
  - Removed `tsconfig.json` from files table; added explicit note: do NOT add `vitest/globals` as it contradicts `globals: false`; `@types/vitest` + explicit imports are sufficient (Gemini #2, Qwen #1)
  - Added Step 6b to write captured baseline values into `vite.config.mjs` `coverage.thresholds` immediately after the first successful run, enforcing the "fail on drop" requirement in CI (Gemini #3, Qwen #5)
  - Added snapshot inspection decision tree to Risk Areas: inspect diffs before accepting — serialisation-only → update; logic change → fix or document; do not blindly run `--update-snapshots` (Qwen #2)
  - Added rollback procedure to Risk Areas: revert PR, restore Jest deps, `.babelrc`, `vite.config.mjs` test block, and test file imports (Qwen #3)
  - Added `yarn audit` sub-step after `yarn install` in Step 1 (Qwen #7)
  - Clarified Babel mitigation in Risk Areas: ESLint confirmed to use `@typescript-eslint/parser`, not Babel; safe to delete `.babelrc` without a fallback (Qwen #6)
- **Declined:**
  - Qwen #4 (`npm-run-all --continue-on-error` removal / `test:ci` script): The spec explicitly requires `test:unit` (not the top-level `test`) to return non-zero on failure; `vitest run` already satisfies this. Removing the flag or adding a `test:ci` script is beyond the migration scope and risks breaking existing workflows.
  - Qwen #8 (remove `test:ui` script): The spec acceptance criteria explicitly lists `test:ui` as a required script. Cannot remove it.
  - Qwen #9 (performance baseline — measure test duration before/after): Overkill for a 2-test-file project. The benefit does not justify the overhead.
  - Qwen missing test scenarios (empty data, network failures, race conditions, rapid UI interaction): The spec and Out of Scope section explicitly prohibit adding new tests during this migration. These are valid future concerns but belong in a separate spec.
  - Qwen browser compatibility check (run existing tests in Playwright as sanity check): Out of scope per spec; E2E tests are a separate concern.
  - Qwen supply chain / CI sandboxing note: Out of scope; CI/CD configuration is explicitly excluded from this feature.
- **Timestamp:** 2026-03-20 23:36

## Pipeline Log
_Auto-generated by aidev. Do not edit above the log entries._

### Phase 2 — Test Generation
- **Status:** ⏭ skipped (per spec)

### Phase 3 — Implementation
### Phase 0 — Spec Review
- **Status:** ✗ failed
- **Agents:** Claude Code
- **Duration:** 53s
- **Timestamp:** 2026-03-20 21:47
- **Summary:** Spec merge failed (exit 1)

### Phase 0 — Spec Review
- **Status:** ✗ failed
- **Agents:** Claude Code
- **Duration:** 50s
- **Timestamp:** 2026-03-20 21:48
- **Summary:** Spec merge failed (exit 1)

### Phase 0 — Spec Review
- **Status:** ✓ done
- **Agents:** Gemini CLI, Qwen Code, Claude Code
- **Duration:** 2m 41s
- **Timestamp:** 2026-03-20 23:33
- **Summary:** Spec reviewed (1 round(s)), changes merged and committed

