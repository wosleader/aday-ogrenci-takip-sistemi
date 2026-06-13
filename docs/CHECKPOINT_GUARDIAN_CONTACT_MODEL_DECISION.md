# Anne/Baba Guardian/Contact Model Decision

Date: 2026-06-13

Branch: `sprint-9-2-multi-phone-architecture-plan`

Current safe HEAD: `5727050 docs: close import e2e regression checkpoint`

## Scope

This docs-only checkpoint records the product and technical direction for importing and displaying Veli, Anne, and Baba information before implementation begins.

No application code, tests, E2E specs, schema, import writer, export, backup/restore, package, or runtime behavior changed in this checkpoint.

## Discovery Summary

The project already has the core structures needed for a future-safe parent/contact model:

- `guardians` table and `GuardianRecord`
- `student_id`, `guardian_full_name`, and optional `relation_type`
- separate `phones` table
- `guardian_id`, `relation_label`, `source_column`, `reference_label`, and `priority`
- `PhoneRelationLabel` values for Anne, Baba, and Veli

Because these structures already exist, the next phase does not need a new `guardian_contacts` table or duplicated parent fields on `StudentRecord`.

Current limitations that implementation must address deliberately:

- Import currently creates at most one Veli guardian record.
- Import writer currently links every imported phone to that Veli guardian when present.
- Student reader and export reader currently select the first guardian record as the visible Veli.
- Summary export currently carries only Telefon 1/2, so Telefon 3+ parent numbers would be lost unless the format is widened.

## Human Decisions

### Guardian Model

- Reuse the existing `guardians` table.
- Do not create `guardian_contacts`.
- Do not add duplicate Anne/Baba/Veli fields to `StudentRecord`.
- Standard relation keys are:
  - `guardian` = Veli
  - `mother` = Anne
  - `father` = Baba
- Legacy `relation_type: null` records are treated as Veli for backward compatibility.
- If the same name appears in Veli and Anne/Baba columns, do not infer, merge, or overwrite based on name equality. Preserve source semantics.

### Student Name Safety

- `Anne Adı`, `Baba Adı`, and `Veli Ad Soyad` are never student-name sources.
- Student name composition remains limited to approved student-name columns such as `AD + SOYAD`, `Ad Soyad`, and `Öğrenci Ad Soyad`.
- A row without a student name must remain blocked even when Veli/Anne/Baba values exist.

### UI Wording

The right drawer uses only simple labels:

- `Veli Ad Soyad`
- `Anne Adı`
- `Baba Adı`

Only non-empty rows are rendered. The UI must not show technical or empty-state wording such as `ilişki bilinmiyor`, `unknown relation`, `ilişkilendirilmiş telefon yok`, or `telefon yok`.

## Mapping Decisions

### Parent Names

Later names-only implementation should recognize narrowly defined parent-name aliases:

- `Anne Adı`
- `Anne Ad Soyad`
- `Anne Adı Soyadı`
- `Baba Adı`
- `Baba Ad Soyad`
- `Baba Adı Soyadı`

Normalization may cover casing and Turkish-character variants. These mappings must remain distinct from student `AD` / `SOYAD`.

### General Phone Aliases

Safe phone alias families may be expanded through Telefon 10:

- `Telefon`, `Telefon 1`, `Telefon1` ... `Telefon10`
- `Tel`, `Tel 1`, `Tel1` ... `Tel10`
- `GSM`, `GSM 1`, `GSM1` ... `GSM10`
- `Cep`, `Cep Tel`, `Cep Telefonu`

Bare `No` must not be a phone alias. `No1`, `No 1`, `No2`, `Numara 1`, and similar variants are risky because they may mean student number. They require narrow matching and explicit regression tests before acceptance.

### Explicit Parent Phones

Later implementation may recognize explicit headers such as:

- `Anne Tel`, `Anne Telefon`, `Anne GSM`, `Anne Cep`
- `Baba Tel`, `Baba Telefon`, `Baba GSM`, `Baba Cep`

Only explicit relation headers may create Anne/Baba relation labels. Generic `GSM`, `GSM2`, `Tel1`, `Telefon 3`, or `No3` must never be inferred as belonging to a parent.

## Parent Phone Slot Rule

- Explicit numbered generic phone columns keep their declared slot when reasonable: `Tel3`, `GSM3`, and `Telefon 3` declare Telefon 3.
- Numberless columns and relation-specific phone columns are assigned in Excel column order to the next available Telefon N slot.
- `ANNE TEL` / `BABA TEL` supply relation metadata but do not force a special slot.
- Parent phones must not be compacted into Telefon 1/2 merely for UI or summary export compatibility.

Example source order:

`GSM | BABA TEL | GSM2 | GSM3 | ANNE TEL | GSM4`

Expected stored order:

1. Telefon 1 <- GSM
2. Telefon 2 <- BABA TEL, relation Baba
3. Telefon 3 <- GSM2
4. Telefon 4 <- GSM3
5. Telefon 5 <- ANNE TEL, relation Anne
6. Telefon 6 <- GSM4

This assignment rule must be implemented and tested as a deliberate allocator; it must not regress existing Telefon 1-10 slot fidelity.

## Source Column Display

Showing phone source metadata is accepted for a later UI slice. Examples:

- `Telefon 3` with `Kaynak: GSM3`
- `Telefon 5 · Anne` with `Kaynak: ANNE TEL`

It is not part of the first names-only implementation unless it is independently approved as trivial and safe. The first drawer change should remain compact.

## First Right Drawer Direction

The first implementation is names-only:

- Show Veli Ad Soyad when present.
- Show Anne Adı when present.
- Show Baba Adı when present.
- Hide empty rows.
- Do not show phone placeholders or technical relation text.
- Keep parent phones in a later slice.

## Export Decision

Detailed export should later include:

- Veli Ad Soyad
- Anne Adı
- Baba Adı
- Telefon 1 through Telefon 10

Summary export should later include Anne Adı, Baba Adı, and Telefon 1 through Telefon 10 so explicitly related parent phones stored in Telefon 3+ are not lost.

Do not add `Anne ilişki durumu`, `Baba ilişki durumu`, `İlişki bilinmiyor`, or similar columns. Do not shift parent phones into Telefon 1/2 to preserve an old summary shape.

## Backup / Restore Decision

- Reuse the existing `guardians` and `phones` tables already included in Full System Backup.
- No new table is planned for this phase.
- Using existing non-indexed fields and table rows is expected not to require a Dexie schema-version bump.
- A later implementation slice must add an explicit backup/restore roundtrip test for `relation_type`, `guardian_id`, `relation_label`, and `source_column`.
- Excel export is not a backup. Full System Backup remains the authoritative complete restore source.

## No-Phone Import Setting Decision

Future setting label: `Telefonsuz adayları içe aktar`

- Location: import page session settings area.
- Scope: session-only in the first version.
- Default: off.

Behavior matrix:

1. Student name and at least one phone: import normally.
2. Student name and no phone, setting off: block the row and write a clear error.
3. Student name and no phone, setting on: import the row and write a warning.
4. No student name but Veli/Anne/Baba exists: block regardless of setting.

Suggested error:

`Telefon bilgisi bulunamadı. Telefonsuz adayları içe aktarmak için İçe Aktarma Ayarları'ndaki seçeneği açın.`

Suggested warning:

`Telefon bilgisi bulunamadı; ayar açık olduğu için aday telefonsuz içe aktarıldı.`

This setting is not part of the first names-only implementation.

## Implementation Slicing

### Slice 1 - Decision Checkpoint

This docs-only checkpoint.

### Slice 2 - Anne/Baba Names-Only

- Add parent-name import targets and aliases.
- Carry names through simulation.
- Create separate guardian rows for Veli/Anne/Baba.
- Separate the three relations in the student reader.
- Render only non-empty name rows in the right drawer.
- Do not add parent phone mapping, export changes, backup changes, or no-phone setting.

### Slice 3 - Explicit Parent Phones

- Add explicit ANNE TEL/BABA TEL aliases.
- Implement deterministic phone slot allocation.
- Persist `relation_label` and correct `guardian_id` only for explicit relation columns.
- Consider source-column display if separately accepted.

### Slice 4 - No-Phone Import Setting

- Add session-only checkbox.
- Apply simulation validation matrix and warning/error logs.
- Preserve student-name safety.

### Slice 5 - Export And Backup Guarantees

- Add Anne/Baba names to detailed and summary export.
- Widen summary export to Telefon 1-10.
- Add explicit full-backup roundtrip coverage.

### Slice 6 - Playwright Regression

- Anne/Baba names import.
- No-student-name safety.
- Explicit parent-phone relation labels and slots.
- No-phone setting matrix.

## Risks

- Wrong phone-to-parent inference from generic headers.
- Summary export losing Telefon 3+ if not widened.
- Right drawer clutter from empty or technical rows.
- Duplicate or ambiguous guardian names being incorrectly merged.
- Legacy `relation_type: null` records being misclassified.
- `No1/No2/Numara N` false positives.
- Current writer linking every imported phone to the Veli guardian.
- Current reader/export assumption that the first guardian is the visible Veli.
- No-phone records polluting the calling workflow when enabled without clear warnings.
- E2E selector brittleness as the drawer gains compact parent rows.

## Next Recommended Implementation Slice

Proceed with `Anne/Baba Names-Only Import And Drawer Pilot` after Strategy AI review.

Likely files:

- `src/domain/models/guardian.ts`
- `src/features/imports/services/types.ts`
- `src/features/imports/services/columnDefinitions.ts`
- `src/features/imports/services/importSimulation.ts`
- `src/features/imports/services/importWriter.ts`
- `src/features/students/services/studentListReader.ts`
- `src/features/students/StudentsPage.tsx`
- focused import, reader, and student UI tests

Not expected in the first names-only slice:

- `src/db/schema.ts`
- `src/db/db.ts`
- export services
- backup services
- Playwright specs

`dev-server.log` remains a local untracked runtime file and must not be staged, committed, deleted, or treated as a product artifact.
