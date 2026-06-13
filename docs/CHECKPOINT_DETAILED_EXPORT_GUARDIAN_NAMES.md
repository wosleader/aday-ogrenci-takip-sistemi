# Detailed Export Guardian Names

Date: 2026-06-14

Branch: `sprint-9-2-multi-phone-architecture-plan`

Closed implementation commit: `9b030a8 feat: export guardian parent names`

Previous checkpoint: `eca0fe9 docs: close explicit guardian phone relations checkpoint`

## Why This Slice Exists

The guardian import model already stores Veli, Anne, and Baba as separate relation-aware records, but detailed Excel export previously exposed only one guardian name and selected it by creation order. This slice makes the detailed export consistent with the existing guardian model without changing import, schema, backup, UI, or summary-report behavior.

## What Was Implemented

- Detailed Excel export now includes:
  - `Veli Ad Soyad`
  - `Anne Adı`
  - `Baba Adı`
- `Anne Adı` and `Baba Adı` are placed immediately after `Veli Ad Soyad`.
- The existing `Veli Ad Soyad` column name remains unchanged.
- Missing Anne or Baba values produce blank cells.
- The export bundle carries separate Veli, Anne, and Baba guardian records.

## Guardian Selection Behavior

- `relation_type: "guardian"` populates `Veli Ad Soyad`.
- Legacy `relation_type: null` also populates `Veli Ad Soyad`.
- `relation_type: "mother"` populates `Anne Adı`.
- `relation_type: "father"` populates `Baba Adı`.
- Export no longer assumes that the first created guardian is Veli.
- When multiple active records share the same relation type, selection remains deterministic:
  1. `created_at`
  2. `id`

## Export Column Behavior

The detailed export begins its person/contact columns in this order:

1. `Öğrenci Ad Soyad`
2. `Veli Ad Soyad`
3. `Anne Adı`
4. `Baba Adı`
5. `Telefon 1`
6. `Telefon 1 Durumu`
7. Remaining Telefon 2-10 fields in the existing order

The UI/group label idea `Veli Bilgisi` was not implemented. It remains a separate UI decision.

## Phone Slot Behavior

- Telefon 1 through Telefon 10 export behavior is unchanged.
- Slot fidelity remains protected.
- Parent relation phones remain in their existing Telefon N slots.
- Parent phone metadata does not create extra export columns.
- No `Anne Telefonu` or `Baba Telefonu` columns were added.

## Implementation Files

- `src/features/exports/services/exportTypes.ts`
- `src/features/exports/services/exportDataReader.ts`
- `src/features/exports/services/exportMapper.ts`
- `tests/exports/exportDataReader.test.ts`
- `tests/exports/exportMapper.test.ts`

Implementation diff: 5 files changed, 170 insertions, 4 deletions.

## Tests And Validation

- Focused export tests: PASS, 3 test files / 24 tests.
- OOM-safe full unit test: PASS, 45 test files / 315 tests.
- Full validation command used:

```powershell
$env:NODE_OPTIONS='--max-old-space-size=4096'
npx.cmd vitest run --exclude e2e/** --maxWorkers=1
```

- `npm.cmd run build`: PASS.
- Known Vite chunk-size warning only.
- Playwright was not run because import and E2E scope were not changed.
- `dev-server.log` remained local/untracked and untouched.

## Explicitly Not Implemented

- Summary export Telefon 1-10 widening.
- Backup/restore guardian roundtrip guarantee.
- Import behavior changes.
- UI/right drawer/card label changes.
- `Veli Bilgisi` UI group label.
- Separate Anne/Baba phone export columns.
- Schema migration or a new table.
- E2E/Playwright scenarios.
- Package changes.

## Remaining Risks

- Summary export still has limited phone scope and may omit Telefon 3-10 until an explicit product decision is made.
- Full System Backup still lacks a focused guardian and phone-relation roundtrip guarantee test.
- Export consumers may notice the new Anne/Baba columns inserted immediately after `Veli Ad Soyad`.
- Future summary export work must preserve Telefon 1-10 slot fidelity.
- Future backup tests must cover relation-labeled phones both with and without `guardian_id`.
- The `Veli Bilgisi` UI label decision remains deferred.

## Recommended Next Slice

`Backup/Restore Guardian Roundtrip Guarantee`

Start with a test-only update in `tests/settings/backupRestore.test.ts` and verify that Full System Backup preserves:

- Veli, Anne, and Baba guardian records.
- Guardian `relation_type`.
- Phone `guardian_id`.
- Phone `relation_label`.
- Phone `source_column`.
- Phone `reference_label`.
- Phone `priority`.
- Relation-labeled parent phones with `guardian_id: null`, where applicable.

Only change `src/db/backup.ts` if the roundtrip test exposes a real gap. No schema bump is expected because backup currently serializes the existing tables and record fields.

## Deferred Decisions

- Whether summary export should become lossless by including Telefon 1-10.
- Whether Telefon 3-10 status columns should also be added to summary export.
- Whether summary export should remain intentionally compact.
- Whether the staff UI should group Veli/Anne/Baba under a visible `Veli Bilgisi` label.
