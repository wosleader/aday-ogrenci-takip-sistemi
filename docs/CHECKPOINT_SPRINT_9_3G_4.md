# CHECKPOINT — Sprint 9.3G-4

Sprint adı:
Sprint 9.3G-4 — Multi-Phone Import Mapping / Simulation

İş türü:
Implementation, ardından docs-only closure

Branch:
sprint-9-2-multi-phone-architecture-plan

Code commit:
2e1bbff feat: add multi-phone import simulation

## Amaç

- Excel İçe Aktar tarafında Telefon 3-10 mapping key'lerini hazırlamak.
- Import simulation sonucunda çoklu telefonları array tabanlı modelle taşımak.
- Bu sprintte gerçek DB writer/persistence işine girmemek.
- Schema/storage, export/report/backup, Ad/Soyad, Anne/Baba ve Mahalle işlerini kapsam dışında tutmak.

## Değişen Code/Test Dosyaları

- src/features/imports/services/types.ts
- src/features/imports/services/columnDefinitions.ts
- src/features/imports/services/importSimulation.ts
- tests/imports/columnMatching.test.ts
- tests/imports/importSimulation.test.ts

## Değişmeyen Önemli Dosyalar

- src/features/imports/services/importWriter.ts
- src/features/imports/ImportPage.tsx
- docs/
- schema/storage/migration
- export/report/backup
- students/calls/reminders

## Type / Model Davranışı

- `ImportPhoneFieldKey` eklendi.
- `phone_1` - `phone_10` alanlarını kapsar.
- `SimulatedImportPhone` tipi eklendi.
- `SimulatedImportRow` geriye uyumlu `phone_1` / `phone_2` yanında `phones[]` taşır.
- `phone_1` / `phone_2` backward compatibility korundu.

## Column Definitions / Mapping Davranışı

- Telefon 3 - Telefon 10 mapping definition olarak eklendi.
- Mevcut Telefon / 2. Telefon davranışı korundu.
- Telefon 3-10 label yaklaşımı:
  - Telefon 3
  - Telefon 4
  - ...
  - Telefon 10
- Alias pattern örnekleri:
  - `gsm3`
  - `gsm 3`
  - `telefon 3`
  - `tel 3`
  - `phone 3`
  - aynı pattern 10'a kadar

## Simulation `phones[]` Davranışı

- Simulation mapping key'leri üzerinden `phones[]` üretir.
- Boş telefonlar array'e alınmaz.
- Aynı satırdaki duplicate telefonlar tekilleştirilir.
- Invalid ama non-empty telefonlar `is_valid: false` metadata ile taşınır.
- Duplicate warning kontrolü tüm `phones[]` alanlarını kapsar.
- `phone_1` / `phone_2` compatibility korunur.

## ImportPage Davranışı

- `ImportPage.tsx` değişmedi.
- Dropdown seçenekleri `COLUMN_DEFINITIONS` üzerinden beslendiği için Telefon 3-10 seçenekleri ImportPage değişmeden görünür hale gelir.
- Sprint 9.3G-2 progressive disclosure davranışı korunur.

## Writer Davranışı

- `importWriter.ts` değişmedi.
- Gerçek import writer hâlâ sadece `phone_1` / `phone_2` üzerinden çalışır.
- Telefon 3-10 mapping/simulation var, ancak DB'ye yazım henüz yoktur.
- Writer ayrı sprintte yapılacaktır.

## Schema / Storage

- Schema/storage değişmedi.
- Bu sprintte migration gerekmedi.
- Mevcut phones tablosu writer sprintinde tekrar doğrulanmalıdır.

## Korunan Kapsam

- Ad/Soyad yapılmadı.
- Anne/Baba yapılmadı.
- Mahalle yapılmadı.
- Export/report/backup yapılmadı.
- Students/calls/reminders yapılmadı.
- Obsidian yapılmadı.

## Test Sonucu

- npm.cmd test geçti.
- 42 test files
- 235 tests

## Build Sonucu

- npm.cmd run build geçti.
- Vite chunk size uyarısı var, build hatası değildir.

## Risk / Not

- Bu sprint simulation seviyesinde kaldı.
- Telefon 3-10 mapping artık görünür ve simulation'da taşınır.
- Ancak gerçek import writer hâlâ Telefon 1/2 ile sınırlıdır.
- Writer sprinti yapılmadan “Telefon 3-10 DB'ye yazılıyor” kabul edilmemelidir.
- Sıradaki kontrollü iş 9.3G-4 docs-only commit/push, sonra 9.3G-5 Multi-Phone Import Writer discovery/implementation planıdır.
- Obsidian update docs-only closure sonrası ayrıca değerlendirilecektir.
