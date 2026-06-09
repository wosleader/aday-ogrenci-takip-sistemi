# Import AD/SOYAD Composition Pilot

Date: 2026-06-09

Branch: `sprint-9-2-multi-phone-architecture-plan`

Implementation commit: `ee7b12f feat: compose student names from ad soyad import`

## Scope

This checkpoint closes the narrow import-only AD/SOYAD composition pilot.

The sprint supports Excel imports where the student name arrives as separate `AD` and `SOYAD` columns, without changing the persistent student data model.

## Product Decision

- Import now supports student name composition from separate `AD` and `SOYAD` columns.
- `student_first_name` and `student_last_name` are import/simulation-only fields.
- Persistent student model remains `student_full_name`.
- No DB/schema migration was added.
- The writer persists only the composed `student_full_name`.
- If a full-name column is present, it wins over `AD` / `SOYAD`.
- `Veli Adi`, `Anne adi`, and `Baba Adi` are not treated as student `AD` / `SOYAD`.
- Anne/Baba import is explicitly out of scope and deferred to a later guardian/parent model discovery.
- Telefon 1-10 slot fidelity remains preserved.

## Composition Rules

- Full-name column present:
  - Use full-name field as `student_full_name`.
- Full-name absent, `AD + SOYAD` present:
  - Compose `student_full_name` as `AD + " " + SOYAD`.
  - Trim whitespace safely.
- Full-name present with `AD/SOYAD` also present:
  - Use full-name.
  - Emit warning: `Tam ad alanı bulunduğu için Ad/Soyad alanları birleştirme için kullanılmadı.`
  - Do not block import.
- Only `AD` present:
  - Use `AD` as `student_full_name`.
  - Emit warning: `Soyad alanı bulunamadı; öğrenci adı yalnızca Ad alanından oluşturuldu.`
  - Do not block import.
- Only `SOYAD` present:
  - Do not create `student_full_name` from surname alone.
  - Block the row with: `Soyad alanı tek başına öğrenci adı oluşturmak için yeterli değil.`
- No usable name data:
  - Existing missing required name behavior is preserved.

## Files Changed In Implementation

- `src/features/imports/ImportPage.tsx`
- `src/features/imports/services/columnDefinitions.ts`
- `src/features/imports/services/importSimulation.ts`
- `src/features/imports/services/types.ts`
- `tests/imports/columnMatching.test.ts`
- `tests/imports/importNameComposition.test.ts`

## Tests / Build Results

- `npm.cmd test -- --run` PASS
- 45 test files / 294 tests
- `npm.cmd run build` PASS
- Known Vite chunk-size warning only

## Manual QA Acceptance Note

Manual localhost QA passed:

- QA-1 `01_AD_SOYAD_yok_tam_ad.xlsx` PASS
- QA-2 `02_Tam_ad_ve_AD_SOYAD_birlikte.xlsx` PASS
- QA-3 `03_Sadece_AD_var.xlsx` PASS
- QA-4 `04_Sadece_SOYAD_var.xlsx` PASS
- QA-5 `05_Veli_Anne_Baba_yanlis_eslesme_guvenlik.xlsx` PASS
- QA-6 `06_AD_SOYAD_Telefon_1_10_genis.xlsx` PASS
- QA-7 Console/runtime PASS

## Explicit Non-Goals

- No Anne/Baba guardian import
- No Mahalle/Ilce support
- No export/report format change
- No backup/restore behavior change
- No DB schema change
- No persistent `first_name` / `last_name` fields
- No guardian model change

## Next Possible Discovery Topics

- Anne/Baba guardian import and parent model discovery
- Mahalle/Ilce data model discovery
- Structured first_name / last_name persistence only if product requires it
- Export/report additions for expanded student/guardian/location fields
