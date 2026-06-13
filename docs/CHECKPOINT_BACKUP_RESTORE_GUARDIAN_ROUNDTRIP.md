# Backup/Restore Guardian Roundtrip Guarantee

Date: 2026-06-14

Branch: `sprint-9-2-multi-phone-architecture-plan`

Closed implementation/test commit: `c6876de test: guarantee guardian backup restore roundtrip`

Previous checkpoint: `b48ce74 docs: close detailed export guardian names checkpoint`

## Why This Slice Exists

Guardian and explicit parent-phone support now relies on relation metadata stored across the existing `guardians` and `phones` tables. Full System Backup is the authoritative restore format, so these relations need an explicit regression guarantee before future model or export work continues.

## What Was Implemented

- Added one realistic backup/restore roundtrip regression test.
- The slice was test-only.
- Only `tests/settings/backupRestore.test.ts` changed.
- Existing backup implementation passed without modification.
- `src/db/backup.ts` did not require a fix.

## Backup/Restore Behavior Confirmed

The test creates a source database, produces a Full System Backup snapshot, restores that snapshot into a separate target database, then reads the restored guardian and phone records directly from the target tables.

The existing raw-table snapshot/restore behavior preserves the tested records and metadata losslessly.

## Guardian Preservation Assertions

The test seeds and restores:

- A Veli guardian with `relation_type: "guardian"`.
- An Anne guardian with `relation_type: "mother"`.
- A Baba guardian with `relation_type: "father"`.
- A legacy Veli guardian with `relation_type: null`.

Assertions confirm:

- All four guardian records survive.
- Guardian names survive.
- Relation types survive.
- Record counts remain correct.
- Restore does not create fake or extra guardian records.

## Phone Metadata Preservation Assertions

The test seeds and restores:

- A generic/Veli phone linked to the Veli guardian.
- An Anne phone linked to the Anne guardian.
- A Baba phone linked to the Baba guardian.
- A relation-labeled Anne phone without a guardian link.

Assertions confirm preservation of:

- `guardian_id`
- `relation_label`
- `source_column`
- `reference_label`
- `priority`

Phone slot/order intent remains represented by the preserved `priority` and reference-label values.

## Null Guardian Relation Assertion

A parent phone with:

- `guardian_id: null`
- `relation_label: "Anne"`
- source/reference/priority metadata

survives backup and restore unchanged. Restore does not invent a guardian record or link for this phone.

## Changed Test File

- `tests/settings/backupRestore.test.ts`

Implementation/test diff: 1 file changed, 200 insertions.

## Tests And Validation

- Focused backup/restore test: PASS, 1 test file / 8 tests.
- OOM-safe full unit test: PASS, 45 test files / 316 tests.
- Full validation command:

```powershell
$env:NODE_OPTIONS='--max-old-space-size=4096'
npx.cmd vitest run --exclude e2e/** --maxWorkers=1
```

- `npm.cmd run build`: PASS.
- Known Vite chunk-size warning only.
- Playwright was not run because import and E2E scope were not changed.
- `dev-server.log` remained local/untracked and untouched.

## Explicitly Not Implemented

- Backup implementation changes.
- Changes to `src/db/backup.ts`.
- Schema migration or a new table.
- Import behavior changes.
- Export or summary-export changes.
- UI/right drawer/card label changes.
- `Veli Bilgisi` UI group label.
- E2E/Playwright scenarios.
- Package changes.
- Documentation changes inside the implementation/test commit.

## Known Warnings

- The production build retains the known Vite chunk-size warning.
- No functional backup/restore warning was exposed by the new roundtrip test.

## Remaining Risks

- Summary export still has limited phone scope and may omit Telefon 3-10 until an explicit product decision is made.
- The `Veli Bilgisi` UI group label remains deferred.
- Future summary export changes must preserve Telefon 1-10 slot fidelity and must not compact parent phones.
- Future import/export work must continue preserving relation labels and source-column metadata.
- Any future guardian/phone table-shape or backup-format change must update and rerun this roundtrip test.

## Recommended Next Slice

`Summary Export Phone Compatibility Discovery`

Before implementation, decide:

- Whether summary export should become lossless with Telefon 1-10.
- Whether Telefon 3-10 should include status columns.
- Whether the report should remain compact or become a broader export.
- Where Anne/Baba names belong if summary export is expanded.

No summary implementation should begin until these product decisions are explicit. Parent phones must remain in their existing Telefon N slots, and separate Anne/Baba phone columns should not be introduced without a new explicit decision.

## Deferred Decisions

- Summary export compact versus lossless behavior.
- Telefon 3-10 status columns in summary export.
- `Veli Bilgisi` UI group label.
- Any future backup format/version change prompted by a real schema change.
