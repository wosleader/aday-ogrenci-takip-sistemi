# Explicit Anne/Baba Phone Relation Pilot

Date: 2026-06-13

Branch: `sprint-9-2-multi-phone-architecture-plan`

Closed implementation commit: `8f744dd feat: import explicit guardian phone relations`

Previous checkpoint: `c491cb6 docs: close guardian parent names checkpoint`

## Why This Slice Exists

The names-only guardian pilot established Veli, Anne, and Baba records in the existing `guardians` table. This narrow follow-up adds phone relation metadata only when the Excel source explicitly identifies an Anne or Baba phone, without inferring parent ownership from generic phone columns.

## What Was Implemented

- Explicit Anne phone aliases such as `ANNE TEL`, `Anne Telefon`, `Anne GSM`, and `Anne Cep`.
- Explicit Baba phone aliases such as `BABA TEL`, `Baba Telefon`, `Baba GSM`, and `Baba Cep`.
- Import/simulation-only parent phone targets and typed relation metadata.
- Deterministic phone slot allocation based on Excel column order and the next available Telefon N slot.
- Parent guardian linking through the existing `guardians` and `phones` tables.
- Focused mapping, simulation, student-name safety, writer, and reader/display regression coverage.

## Parent Phone Mapping Behavior

- Explicit Anne headers produce `Anne` relation metadata.
- Explicit Baba headers produce `Baba` relation metadata.
- Generic columns such as `GSM`, `GSM2`, `Tel1`, and `Telefon 1` remain generic.
- Generic phone columns never infer Anne/Baba ownership.
- Risky `No1`, `No2`, and related `Numara N` aliases were not added.

## Slot Fidelity Behavior

Parent relation headers provide relation metadata only; they do not force a dedicated slot.

Example:

`GSM | BABA TEL | GSM2 | GSM3 | ANNE TEL | GSM4`

Produces:

1. Telefon 1 <- GSM
2. Telefon 2 <- BABA TEL, relation Baba
3. Telefon 3 <- GSM2
4. Telefon 4 <- GSM3
5. Telefon 5 <- ANNE TEL, relation Anne
6. Telefon 6 <- GSM4

Existing Telefon 1-10 regression behavior remains protected.

## Guardian / Phone Linking

- When Anne name exists, explicit Anne phone links to the `mother` guardian.
- When Baba name exists, explicit Baba phone links to the `father` guardian.
- When the matching parent name is absent, no fake guardian name or guardian row is created.
- Name-absent explicit parent phones retain their `Anne` / `Baba` relation label with `guardian_id: null`.
- Generic phones preserve the existing Veli/generic behavior.
- Existing `source_column`, `reference_label`, `priority`, normalized value, and validity metadata remain available.

## Student Name Safety

- Parent phone fields do not compose `student_full_name`.
- Anne, Baba, and Veli fields remain excluded from student-name composition.
- Rows without an approved student-name source remain blocked.
- Existing AD/SOYAD composition behavior remains unchanged.

## Implementation Files

- `src/features/imports/services/columnDefinitions.ts`
- `src/features/imports/services/importSimulation.ts`
- `src/features/imports/services/importWriter.ts`
- `src/features/imports/services/types.ts`
- `tests/imports/columnMatching.test.ts`
- `tests/imports/importNameComposition.test.ts`
- `tests/imports/importSimulation.test.ts`
- `tests/imports/importWriter.test.ts`

Implementation diff: 8 files changed, 316 insertions, 54 deletions.

## Tests And Validation

- Focused import tests: PASS, 4 test files / 61 tests.
- Full test suite: PASS, 45 test files / 311 tests.
- The normal parallel full-test run hit Node/Vitest OOM, not an assertion failure.
- Successful full-test validation used:

```powershell
set NODE_OPTIONS=--max-old-space-size=4096
npx.cmd vitest run --exclude e2e/** --maxWorkers=1
```

- `npm.cmd run build`: PASS.
- `npm.cmd run qa:import:e2e`: PASS, 4/4 Playwright tests.
- Known React `act(...)` test warnings only.
- Known Vite chunk-size warning only.

## Explicitly Not Implemented

- Export changes.
- Detailed export Anne/Baba phone columns.
- Summary export Telefon 1-10 expansion.
- Backup/restore behavior changes.
- Explicit Anne/Baba phone backup/restore roundtrip test.
- No-phone import setting.
- New schema version or new table.
- Large right-drawer redesign.
- Broad source-column display UI.
- Risky `No1/No2` alias family.
- New Playwright scenarios.

## Remaining Risks

- Export does not yet include Anne/Baba names or relation-aware phone guarantees.
- Summary export can lose future Telefon 3+ parent-phone context until widened.
- Full System Backup uses the existing tables, but explicit Anne/Baba phone roundtrip acceptance coverage is still missing.
- No-phone import behavior remains a separate product slice.
- Source-column UI remains pending.
- Future export changes must preserve Telefon 1-10 slot fidelity and must not compact parent phones into Telefon 1/2.

## Recommended Next Slice

`Export + Backup/Restore Guardian Guarantees`

The next slice should decide and test:

- Detailed export fields for Veli Ad Soyad, Anne Adi, Baba Adi, and Telefon 1-10.
- Summary export expansion to Telefon 1-10 plus Anne/Baba names without relationship-status columns.
- Full System Backup roundtrip coverage for guardian relation types and explicit parent phones.
- Preservation of `guardian_id`, `relation_label`, `source_column`, `reference_label`, and slot priority.
- Continued separation between Excel export and authoritative Full System Backup restore semantics.

No schema bump is expected if the existing tables and fields remain sufficient.

`dev-server.log` remains a local untracked runtime file and must not be staged, committed, deleted, or treated as a project artifact.
