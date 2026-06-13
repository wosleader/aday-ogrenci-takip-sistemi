# Anne/Baba Names-Only Import And Drawer Pilot

Date: 2026-06-13

Branch: `sprint-9-2-multi-phone-architecture-plan`

Closed implementation commit: `a83c235 feat: import guardian parent names`

Previous decision checkpoint: `9d22745 docs: record guardian contact model decisions`

## Why This Slice Exists

The guardian/contact discovery selected the existing `guardians` table as the source of truth for Veli, Anne, and Baba. This first implementation slice adds parent names without mixing in parent-phone inference, export changes, backup changes, schema work, or a larger guardian UI redesign.

## What Was Implemented

- Anne/Baba name import targets and aliases.
- Simulation fields for `mother_full_name` and `father_full_name`.
- Separate guardian rows with `guardian`, `mother`, and `father` relation types.
- Relation-aware student reader fields for Veli, Anne, and Baba.
- Compact right-drawer display for non-empty parent names.
- Focused unit, integration, reader, and UI regression tests.

## Guardian Behavior

- Existing `guardians` table and `GuardianRecord` are reused.
- No `guardian_contacts` table was added.
- No duplicate Anne/Baba fields were added to `StudentRecord`.
- `guardian` represents Veli, `mother` represents Anne, and `father` represents Baba.
- Legacy `relation_type: null` records remain readable as Veli.
- Veli/Anne/Baba records are not merged merely because their normalized names match.
- Generic imported phones continue to use the existing Veli guardian context when one exists; they are not assigned to mother/father records.

## Import Behavior

Supported parent-name aliases include normalized forms of:

- `Anne Adı`
- `Anne Ad Soyad`
- `Anne Adı Soyadı`
- `Baba Adı`
- `Baba Ad Soyad`
- `Baba Adı Soyadı`

Simulation preview carries Anne/Baba values independently from the student-name fields.

## Student Name Safety

- Anne Adı, Baba Adı, and Veli Ad Soyad are not student-name sources.
- Existing AD/SOYAD and full-name composition rules remain unchanged.
- A row with parent values but no approved student-name source remains blocked and cannot create a student.

## Reader Behavior

- The reader no longer treats the first guardian row as Veli when multiple relations exist.
- Veli is selected from `guardian` or legacy `null` records.
- Anne is selected from `mother` records.
- Baba is selected from `father` records.
- Parent names are included in the student search read model.

## Right Drawer Behavior

The existing compact contact card shows only non-empty lines:

- `Veli Ad Soyad: ...`
- `Anne Adı: ...`
- `Baba Adı: ...`

Empty parent rows are hidden. No `ilişki bilinmiyor`, `unknown relation`, `ilişkilendirilmiş telefon yok`, or parent-specific `telefon yok` placeholder was introduced. No large guardian card redesign was added.

## Implementation Files

- `src/domain/models/guardian.ts`
- `src/features/imports/services/columnDefinitions.ts`
- `src/features/imports/services/importSimulation.ts`
- `src/features/imports/services/importWriter.ts`
- `src/features/imports/services/types.ts`
- `src/features/students/StudentsPage.tsx`
- `src/features/students/services/studentListReader.ts`
- `tests/imports/columnMatching.test.ts`
- `tests/imports/importNameComposition.test.ts`
- `tests/imports/importWriter.test.ts`
- `tests/students/StudentsPageMultiPhone.test.tsx`
- `tests/students/studentListReader.test.ts`

Implementation diff: 12 files changed, 222 insertions, 18 deletions.

## Validation Results

- `npm.cmd test -- --run`: PASS, 45 test files / 306 tests.
- `npm.cmd run build`: PASS.
- `npm.cmd run qa:import:e2e`: PASS, 4/4 Playwright tests.
- Known Vite chunk-size warning only.
- `dev-server.log` remained local/untracked and untouched.

## Explicitly Not Implemented

- ANNE TEL / BABA TEL phone mapping.
- Parent phone relation labels or parent `guardian_id` assignment.
- Phone source-column display.
- Detailed or summary export changes.
- Backup/restore behavior changes or explicit Anne/Baba roundtrip test.
- No-phone import setting.
- Schema migration or new table.
- Broad guardian UI redesign.
- New Playwright scenarios.

## Remaining Risks

- Parent-phone relation is not yet represented during import.
- Export does not yet include Anne/Baba names.
- Summary export still carries only Telefon 1/2 and may lose future Telefon 3+ parent phones until widened.
- Backup/restore has not yet received an explicit Anne/Baba relation roundtrip acceptance test.
- No-phone import setting remains pending.
- Source-column display remains pending.
- Future ANNE TEL/BABA TEL slot allocation must preserve Telefon 1-10 fidelity.

## Recommended Next Slice

`Explicit Anne/Baba Phone Relation Pilot`

The next slice should cover:

- Explicit aliases: Anne Tel, Anne Telefon, Anne GSM, Anne Cep, Baba Tel, Baba Telefon, Baba GSM, Baba Cep.
- Relation-labeled phone records for Anne/Baba only when the source header is explicit.
- Correct parent `guardian_id` assignment.
- Explicit numbered columns retaining declared slots.
- Numberless/relation columns filling the next available Telefon N slot in Excel column order.
- Generic GSM/Tel columns never being inferred as Anne/Baba.
- Optional source-column display only if it remains compact and separately accepted.

Export, backup/restore guarantees, and the no-phone setting should remain separate later slices.
