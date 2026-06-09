# Parent / Location Import Product Decision

Date: 2026-06-09

Branch: `sprint-9-2-multi-phone-architecture-plan`

Current base commit: `92dfb4e docs: close import ad soyad composition checkpoint`

## Scope

This checkpoint records the product and technical decision after the Anne/Baba/Mahalle/Ilce import discovery.

This is a docs-only decision checkpoint. No application code, tests, schema, import writer, export, backup/restore, or runtime behavior changed in this checkpoint.

## Discovery Summary

AD/SOYAD import composition is complete and closed. `student_first_name` and `student_last_name` are import/simulation-only fields, and the persistent student name remains `student_full_name`.

The follow-up discovery checked whether `Anne adi`, `Baba adi`, `Mahalle`, and `Ilce` can be safely supported in import.

Findings:

- `StudentRecord` does not currently have persistent Anne/Baba/Mahalle/Ilce fields.
- `GuardianRecord` exists and has `guardian_full_name`, optional `relation_type`, and optional `note`.
- Current UI, export, and list readers effectively treat `guardian_full_name` as the primary "Veli" display value.
- `PhoneRecord` already has relation-oriented metadata such as `relation_label`, but that does not solve parent/person name modeling.
- Mahalle/Ilce does not currently exist as explicit student location data.
- Storing Mahalle/Ilce in `general_note` would be a data-quality shortcut and is not accepted as the model direction.

## Human Decision

The discovery result is accepted as `NEEDS HUMAN DECISION` before implementation.

Decision:

1. Anne/Baba will not be implemented in the next small import slice.
2. Anne/Baba must not be used as a student name source.
3. Anne/Baba must not overwrite `Veli Ad Soyad` / `guardian_full_name`.
4. Anne/Baba requires a later guardian/contact model decision.
5. Mahalle/Ilce will be considered as the next smaller implementation candidate.
6. Mahalle/Ilce must not be stored in `general_note` as a note-prefix hack.
7. If implemented, Mahalle/Ilce likely need explicit optional student fields.
8. Export/search/backup/restore impact must be decided before implementation.
9. AD/SOYAD composition and Telefon 1-10 mapping/import/export behavior must remain untouched.
10. `dev-server.log` is an untracked local runtime file and must not be staged, committed, deleted, or treated as a product artifact.

## Accepted Next Direction

The next possible implementation direction is a small Mahalle/Ilce import slice, not Anne/Baba.

Before implementation, decide:

- Exact persistent field names for Mahalle and Ilce.
- Whether these fields appear only in detail view or also in list/search.
- Whether detailed export should include them.
- Whether backup/restore expectations need explicit tests.
- Whether schema/index changes are necessary or whether optional non-indexed student fields are enough.

## Deferred Items

Anne/Baba is deferred because it is not only an import mapping problem. It affects the guardian/contact model and visible product semantics.

Deferred decisions:

- Whether Anne/Baba become separate guardian/contact records.
- Whether relation values should be standardized as mother/father/guardian or Turkish equivalents.
- Whether Anne/Baba without phone should be imported and displayed.
- How Anne/Baba should appear in the right card, list, export, reports, and search.
- Whether Anne/Baba should be part of backup/restore acceptance tests beyond raw table preservation.

## Risks

- Writing Anne/Baba into `guardian_full_name` can overwrite or confuse Veli data.
- Using Anne/Baba as student name source can corrupt `student_full_name`.
- Adding multiple guardian records without UI/export/list decisions can create invisible or misleading data.
- Storing Mahalle/Ilce in `general_note` makes data hard to search, export, filter, and later migrate.
- Adding Mahalle/Ilce fields without export/search/backup decision can make users think data disappeared.
- Any parent/location work must not regress AD/SOYAD composition or Telefon 1-10 slot fidelity.

## Recommended Next Implementation Slice

Sprint candidate: `Mahalle Ilce Import Pilot`

Recommended boundaries:

- Decide explicit optional student fields first.
- Keep Anne/Baba completely out of this sprint.
- Do not use `general_note` prefix hacks.
- Do not change export/report/backup unless explicitly accepted.
- Preserve AD/SOYAD composition behavior.
- Preserve Telefon 1-10 mapping, writer, slot fidelity, detailed export, and phone-card behavior.

Potential files for a future Mahalle/Ilce implementation:

- `src/domain/models/student.ts`
- `src/features/imports/services/types.ts`
- `src/features/imports/services/columnDefinitions.ts`
- `src/features/imports/services/importSimulation.ts`
- `src/features/imports/services/importWriter.ts`
- `src/features/students/services/studentListReader.ts` if list/search/detail uses the fields
- `src/features/students/StudentsPage.tsx` if the right card displays the fields
- `src/features/exports/services/exportDataReader.ts` and `src/features/exports/services/exportMapper.ts` only if export support is approved
- `src/db/schema.ts` only if indexed fields or schema version changes are required
- Relevant import/student/export/backup tests

## Explicit Out Of Scope

- Anne/Baba import implementation.
- Anne/Baba as student name source.
- Anne/Baba overwriting `Veli Ad Soyad`.
- Guardian/contact model redesign.
- Phone-level parent outcome tracking.
- Mahalle/Ilce stored in `general_note`.
- Export/report/backup changes without explicit approval.
- Schema/db migration without explicit approval.
- AD/SOYAD behavior changes.
- Telefon 1-10 behavior changes.
- Import writer changes in this docs checkpoint.
- Any changes to `dev-server.log`.

## Decision Status

Final recommendation: `NEEDS HUMAN DECISION` before parent/person implementation.

Accepted narrow direction: Mahalle/Ilce may be considered next as a separate, small implementation slice after field/export/search/backup decisions are made.
