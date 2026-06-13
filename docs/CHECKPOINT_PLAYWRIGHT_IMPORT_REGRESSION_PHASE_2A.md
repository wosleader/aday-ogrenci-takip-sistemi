# Playwright Import Regression Matrix Phase 2A

Date: 2026-06-13

Branch: `sprint-9-2-multi-phone-architecture-plan`

Implementation commit: `0980cdb feat: add import e2e regression matrix`

Previous checkpoint: `90f70e3 docs: close import e2e smoke checkpoint`

## Why This Phase Exists

The first Playwright import smoke pilot proved that the real browser import path can be automated. Phase 2A adds a deliberately small regression matrix for three high-value cases that previously required repeated manual Excel QA, without turning the suite into a slow full-product E2E system.

## What Was Added

- New regression spec: `e2e/import-regression.spec.ts`.
- Shared runtime workbook generation through `e2e/helpers/importFixtures.ts`.
- The existing `qa:import:e2e` script now runs both the smoke and regression specs.
- Playwright import E2E runs with one worker for local stability.
- Existing Chromium, Vite web server, trace-on-failure, and screenshot-on-failure behavior remains in place.

## How To Run

```powershell
npm.cmd run qa:import:e2e
```

On a new machine Chromium may require a one-time install:

```powershell
npx.cmd playwright install chromium
```

## Scenario Coverage

### 1. Telefon 1-10 Preservation

- A runtime workbook contains distinct values from Telefon 1 through Telefon 10.
- Browser import completes successfully.
- The imported student is opened from Aday Listesi.
- The right drawer expands the additional phone list.
- All ten normalized phone values are verified as visible, including Telefon 1, Telefon 2, Telefon 3, and Telefon 10.

### 2. Empty Mahalle / Ilce

- A valid student row contains empty Mahalle and Ilce cells.
- The row remains readable and imports successfully.
- Student name and phone are visible in the right drawer.
- No empty `Mahalle / Ilce` line is rendered.

### 3. Anne / Baba Student-Name Safety

- A row contains Anne adi, Baba adi, Mahalle, Ilce, and Telefon but no student name source.
- Simulation reports zero readable rows and one skipped row.
- The missing `Ad Soyad` error is shown.
- The Import button remains disabled.
- Anne/Baba fields are not used to create a student record.

## Implementation Files

- `e2e/import-regression.spec.ts`
- `e2e/helpers/importFixtures.ts`
- `package.json`
- `playwright.config.ts`

No production `src/` file changed.

## Fixture Strategy

- Workbooks are generated at runtime with the existing `xlsx` dependency.
- Generated files are written under each Playwright test output directory.
- Binary `.xlsx` fixture files are not committed.
- `test-results/` remains generated output and stays ignored.

## Validation Results

- `npm.cmd run qa:import:e2e`: PASS, 4/4 Playwright tests.
- `npm.cmd test -- --run`: PASS, 45 test files / 299 tests.
- `npm.cmd run build`: PASS.
- Known Vite chunk-size warning only.

## Explicitly Out Of Scope

- Separate Telefon 10-only E2E.
- Only Mahalle scenario.
- Only Ilce scenario.
- Invalid phone E2E.
- Duplicate phone E2E.
- Duplicate import warning E2E.
- Export E2E.
- Backup/restore E2E.
- CI integration.
- Broad `data-testid` coverage.
- Production UI or import logic changes.
- Schema, export, backup, or restore behavior changes.

## Runtime Notes

- Import E2E runs with one Playwright worker.
- IndexedDB is reset before each browser scenario using the established smoke-test pattern.
- Dexie may emit a benign development warning while an existing connection closes for IndexedDB deletion; the tests still pass and unexpected `console.error` / `pageerror` events remain guarded.
- `dev-server.log` is a local untracked runtime file and must not be staged, committed, deleted, or treated as a product artifact.

## Risks

- Browser assertions depend on current user-facing import summary and drawer text. Minimal test IDs should be added only if real selector flakiness appears.
- The matrix is intentionally incomplete and does not replace unit/integration coverage or all manual pilot checks.
- New scenarios should remain small to keep local runtime and maintenance cost controlled.

## Recommended Next Phase

Phase 2B may evaluate, in order:

1. Telefon 10-only survival.
2. Only Mahalle / only Ilce acceptance.
3. Invalid and duplicate phone variants.
4. Duplicate import warning flow.
5. Minimal selector hardening only where actual flakiness proves it necessary.

Export E2E, backup/restore E2E, and CI integration should remain separate discoveries.
