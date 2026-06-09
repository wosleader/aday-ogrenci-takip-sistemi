# Mahalle / Ilce Import Pilot

Date: 2026-06-10

Branch: `sprint-9-2-multi-phone-architecture-plan`

Implementation commit: `70705af feat: import student location fields`

Previous decision checkpoint: `1d2f28f docs: record parent location import decision`

## Scope

This checkpoint closes the narrow Mahalle/Ilce import pilot.

The pilot adds optional student location import support for:

- `Mahalle` -> `neighborhood`
- `Ilce` / `Ilce` -> `district`

The implementation intentionally stays small. It does not start Anne/Baba import, does not redesign the guardian/contact model, and does not expand export/report/search/filter/backup/restore behavior.

## Product Decision

- Mahalle and Ilce are optional student location fields.
- Empty Mahalle/Ilce values do not block import.
- Only Mahalle or only Ilce is valid.
- Mahalle/Ilce must not be stored in `general_note`.
- Mahalle/Ilce may be shown as a small read-only line on the student drawer/card when present.
- AD/SOYAD composition remains the student-name source behavior.
- Veli/Anne/Baba must not become student name sources.
- Anne/Baba guardian/contact modeling remains deferred.

## Technical Implementation

- `StudentRecord` now has optional non-indexed fields:
  - `neighborhood?: string | null`
  - `district?: string | null`
- Dexie schema version was not changed.
- `src/db/schema.ts` was not changed.
- `src/db/db.ts` was not changed.
- Import mapping recognizes Mahalle/Ilce aliases.
- Import simulation preview carries Mahalle/Ilce values.
- Import writer persists Mahalle/Ilce on the student record.
- Student list/read model carries Mahalle/Ilce.
- Student drawer/card shows a small read-only line:
  - `Mahalle / Ilce: ...`
- Search/filter behavior was not expanded.
- Export/report/backup/restore behavior was not changed.

## Files Changed In Implementation

- `src/domain/models/student.ts`
- `src/features/imports/services/types.ts`
- `src/features/imports/services/columnDefinitions.ts`
- `src/features/imports/services/importSimulation.ts`
- `src/features/imports/services/importWriter.ts`
- `src/features/students/services/studentListReader.ts`
- `src/features/students/StudentsPage.tsx`
- `tests/imports/columnMatching.test.ts`
- `tests/imports/importSimulation.test.ts`
- `tests/imports/importNameComposition.test.ts`
- `tests/imports/importWriter.test.ts`
- `tests/students/studentListReader.test.ts`

## Test / Build Result

- `npm.cmd test -- --run`: PASS, 45 test files / 299 tests
- `npm.cmd run build`: PASS
- Known Vite chunk-size warning only

## Manual QA Result

- QA-1 `01_AD_SOYAD_Mahalle_Ilce_Telefon.xlsx`: PASS
  - 3/3 readable
  - AD/SOYAD compose works
  - Mahalle/Ilce visible
- QA-2 `02_AdSoyad_Mahalle_Ilce_Telefon10.xlsx`: PASS
  - full name works
  - Mahalle/Ilce visible
  - Telefon 10 mapping preserved
- QA-3 `03_Mahalle_Ilce_Bos.xlsx`: PASS
  - empty Mahalle/Ilce does not block import
  - no empty location line shown
- QA-4 `04_Sadece_Mahalle.xlsx`: PASS
  - only Mahalle allowed
- QA-5 `05_Sadece_Ilce.xlsx`: PASS
  - only Ilce allowed
- QA-6 `06_AD_SOYAD_Telefon_1_10_Mahalle_Ilce.xlsx`: PASS
  - AD/SOYAD compose works
  - Mahalle/Ilce visible
  - Telefon 1-10 preserved
- QA-7 `07_Veli_Anne_Baba_Mahalle_Ilce_Guvenlik.xlsx`: PASS
  - Veli/Anne/Baba do not become student name
  - AD/SOYAD remains source of student name
  - Mahalle/Ilce visible
- QA-8 `08_Anne_Baba_Yok_Ogrenci_Adi_Yok.xlsx`: PASS
  - no student name means import blocked
  - Veli/Anne/Baba/Mahalle/Ilce do not create student name
- Console/runtime: PASS

## Explicit Non-Goals

- No Anne/Baba import.
- No guardian/contact model changes.
- No export expansion.
- No report expansion.
- No search/filter expansion.
- No backup/restore behavior changes.
- No Il/province/address hierarchy.
- No writing Mahalle/Ilce into `general_note`.
- No schema version bump.
- No indexed location fields.

## Risks / Deferred Items

- Mahalle/Ilce is currently display/import persistence only. Search/filter/export/report support requires separate product approval.
- Because fields are non-indexed, future filtering by Mahalle/Ilce may require a deliberate schema/index decision.
- Backup/restore behavior was not changed; future acceptance testing can explicitly verify location fields if backup/restore scope is reopened.
- Anne/Baba remains a separate guardian/contact model topic and must not be folded into this location-field model.

## Next Recommended Step

Do not immediately start Anne/Baba implementation.

Before Anne/Baba or other larger data-model work, run:

`DISCOVERY — Agent Context / Repo Hygiene Standardization`

That checkpoint should evaluate:

1. Repo hygiene / risk scan
2. Agent instruction standardization
3. Context export / prompt-pack strategy

## Local Runtime Note

`dev-server.log` may appear untracked. It is a local runtime helper/log file. Do not stage, commit, delete, or document it as a product artifact.
