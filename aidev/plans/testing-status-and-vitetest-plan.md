# Implementation Plan: testing-status-and-vitetest

## Complexity Assessment

| Threshold | Limit | Actual |
|-----------|-------|--------|
| Screens | 4 | 0 |
| New components | 5 | 0 |
| API endpoints | 3 | 0 |
| Modified files | 10 | 8 |
| New code lines | 500 | ~80 |
| New tests | 50 | 0 (migration only) |

**Result: within limits — proceed.**

---

## Files to Create or Modify

| File | Action | Description |
|------|--------|-------------|
| `vite.config.mjs` | Modify | Add `test` block with Vitest config (environment, coverage, include pattern); update with baseline thresholds after first run |
| `package.json` | Modify | Replace Jest deps with Vitest; rewrite `scripts`; remove `jest` config key |
| `eslint.config.mjs` | Modify | Remove `...globals.jest` from `languageOptions.globals` — no longer applicable once Jest is removed |
| `.babelrc` | Delete | Babel is only used by `babel-jest`; no longer needed once Jest is removed |
| `README.md` | Modify | Add "Testing Status" section with commands, coverage baseline, local report link |
| `src/__spec__/filter-config.spec.ts` | Modify | Add explicit `import { describe, test, expect } from 'vitest'` at top |
| `src/adapters/__tests__/structure-adapter.spec.ts` | Modify | Add explicit `import { describe, it, expect } from 'vitest'` at top |

`tsconfig.json` — **do not modify**. The `@types/vitest` package provides type declarations; explicit imports in test files are sufficient for both runtime and type-check correctness. Adding `"types": ["vitest/globals"]` would enable global types, which contradicts `globals: false`. Only modify tsconfig if `tsc --noEmit` fails after migration despite explicit imports, and in that case, add `@types/vitest` to the `types` array — never `vitest/globals`.

No new files are created. No snapshot files need modification (Vitest uses the same `__snapshots__` directory and format as Jest — verified by spec).

---

## Component Hierarchy

N/A — no UI components involved.

---

## State Management

N/A — no stores involved.

---

## New Types or Interfaces

None. The `@types/vitest` package provides all necessary type declarations for Vitest APIs. Explicit imports in test files handle both runtime and TypeScript resolution without any tsconfig changes.

---

## Integration Points with Existing Code

- **`vite.config.mjs`** — Vitest config is co-located inside the existing `defineConfig` call using the `test` property. This is the standard Vitest pattern for Vite projects and requires no structural change to the file beyond adding the `test` block.
- **`eslint.config.mjs`** — Currently includes `...globals.jest` in `languageOptions.globals`. This must be removed; leaving it would suppress ESLint warnings about accidental Jest global usage and is technically incorrect once Jest is removed.
- **`babel-jest` / `.babelrc`** — Babel is currently invoked only by Jest (via `babel-jest` in devDependencies). Vitest uses esbuild/Vite's own transform pipeline, so Babel is no longer needed for tests. The `.babelrc` is deleted. The Babel devDependencies (`@babel/core`, `@babel/preset-env`, `@babel/preset-typescript`, `@babel/plugin-*`, `@babel/runtime-corejs3`, `babel-jest`) are all removed from `package.json`. ESLint uses `@typescript-eslint/parser` (not Babel), so no other tooling depends on `.babelrc`.
- **`npm-run-all`** — currently used in `"test"` script to run lint + types + unit tests together. Preserved but the `test:unit` entry is repointed from `jest` to `vitest run`.
- **Snapshots** — `src/adapters/__tests__/__snapshots__/structure-adapter.spec.ts.snap` already exists. Vitest will pick it up automatically; no changes needed.
- **Mock file** — `src/adapters/__tests__/__mocks__/uniprotkb-entry-data.ts` is a plain data export, not a `jest.mock()` factory. No migration needed.

---

## Implementation Order

Execute in this sequence to avoid broken intermediate states:

1. **Install Vitest, update `package.json`**
   - Add `vitest`, `@vitest/coverage-v8`, `jsdom` to devDependencies.
   - Remove Jest deps: `jest`, `babel-jest`, `@types/jest`, `@babel/core`, `@babel/preset-env`, `@babel/preset-typescript`, `@babel/plugin-proposal-decorators`, `@babel/plugin-transform-runtime`, `@babel/runtime-corejs3`.
   - Rewrite scripts:
     - `"test"`: `npm-run-all --continue-on-error test:lint test:types test:unit`
     - `"test:unit"`: `vitest run`
     - `"test:coverage"`: `vitest run --coverage`
     - `"test:watch"`: `vitest`
     - `"test:ui"`: `vitest --ui`
   - Remove `"jest"` config key entirely.
   - Run `yarn install` to update lockfile.
   - Run `yarn audit` — review any high/critical severity findings and document accepted risks before proceeding.

2. **Add Vitest config to `vite.config.mjs`**
   - Add `test` property to `defineConfig`:
     ```js
     test: {
       globals: false,
       environment: 'jsdom',
       include: ['src/**/*.spec.ts', 'src/**/*.test.ts'],
       coverage: {
         provider: 'v8',
         reporter: ['text', 'html', 'lcov'],
         reportsDirectory: 'coverage',
       },
     }
     ```

3. **Update `eslint.config.mjs`**
   - Remove `...globals.jest` from the `languageOptions.globals` section.

4. **Migrate test files** (add explicit Vitest imports)
   - `src/__spec__/filter-config.spec.ts`: add `import { describe, test, expect } from 'vitest'`
   - `src/adapters/__tests__/structure-adapter.spec.ts`: add `import { describe, it, expect } from 'vitest'`

5. **Delete `.babelrc`** — no longer needed.

6. **Run tests and capture coverage baseline**
   - `yarn test:coverage` — record the overall coverage percentages (lines, functions, branches, statements) from the text output.
   - Update `vite.config.mjs` `test.coverage` block with `thresholds` set to the captured values:
     ```js
     coverage: {
       provider: 'v8',
       reporter: ['text', 'html', 'lcov'],
       reportsDirectory: 'coverage',
       thresholds: {
         lines: <captured-value>,
         functions: <captured-value>,
         branches: <captured-value>,
         statements: <captured-value>,
       },
     }
     ```
   - This ensures subsequent runs fail if coverage drops below the established baseline.

7. **Update `README.md`**
   - Add "Testing Status" section after the existing content, including:
     - Commands: `yarn test`, `yarn test:coverage`, `yarn test:watch`
     - Current coverage percentage (from step 6)
     - Local coverage report path: `coverage/index.html`
     - Common commands: run single file (`vitest run src/path/to/file.spec.ts`), update snapshots (`yarn test --update-snapshots`)

8. **Add `coverage/` to `.gitignore`** — generated artefact, should not be committed.

---

## Risk Areas

| Area | Risk | Mitigation |
|------|------|------------|
| `.babelrc` / build pipeline | Babel may be used by other tools beyond Jest | ESLint uses `@typescript-eslint/parser` (confirmed in `package.json`), not Babel; no other tooling depends on `.babelrc`. Safe to delete. |
| `eslint.config.mjs` globals | `globals.jest` left in place after Jest removal | Step 3 explicitly removes it; ESLint will then correctly flag any accidental Jest global usage. |
| `jsdom` version | `jsdom` must be compatible with the installed Vitest version | Install `jsdom` as a dev dependency explicitly; Vitest docs specify the compatible range. |
| Snapshot compatibility | Vitest snapshot serialiser is slightly different from Jest's in edge cases | Run snapshot tests post-migration and inspect any diffs before accepting: (1) if diff is serialisation-only (same data, different format) → update snapshot; (2) if diff indicates a logic change → fix the test or document as a pre-existing issue. Do **not** blindly run `--update-snapshots` without inspecting the diff first. |
| `tsconfig.json` `types` field | Currently commented out — adding `vitest/globals` would contradict `globals: false` | Do not modify `tsconfig.json`. Explicit imports in test files handle both runtime and TS type resolution. Only add `@types/vitest` to the `types` array (not `vitest/globals`) if `tsc --noEmit` fails after migration. |
| `npm-run-all` `--continue-on-error` | Existing `test` script uses this flag; a failing unit test will not propagate non-zero exit via the top-level `test` command | The spec requires `test:unit` script (not the top-level `test` script) to return non-zero on failure; `vitest run` satisfies this for direct invocation. CI should invoke `yarn test:unit` directly rather than `yarn test` if a hard failure is required. |
| Coverage threshold enforcement | Spec requires CI to fail if coverage drops below baseline | Baseline values are captured in step 6 and immediately written into `vite.config.mjs` `coverage.thresholds`. Subsequent `vitest run --coverage` calls will fail if any metric drops. |
| Rollback | Migration may break CI before it can be verified | The migration is a single atomic PR. If CI fails, revert the PR (`git revert`) to restore Jest. The steps are: restore Jest deps in `package.json`, restore `.babelrc`, revert `vite.config.mjs` `test` block, revert test file imports. No data is lost. |
