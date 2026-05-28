# CHECKPOINT — Sprint 9.3G-5

Sprint adı:
Sprint 9.3G-5 — Multi-Phone Import Writer / Persistence

İş türü:
Implementation, ardından docs-only closure

Branch:
sprint-9-2-multi-phone-architecture-plan

Code commit:
34ec8d5 feat: persist multi-phone import records

## Amaç

- Sprint 9.3G-4'te hazırlanan Telefon 3-10 mapping/simulation çıktısını gerçek import writer/persistence tarafına bağlamak.
- Telefon 3-10 için gerçek `PhoneRecord` yazımını sağlamak.
- Schema/storage/version, export/report/backup ve UI işlerini kapsam dışında tutmak.

## Değişen Code/Test Dosyaları

- src/features/imports/services/importWriter.ts
- tests/imports/importWriter.test.ts

## Değişmeyen Önemli Dosyalar

- src/features/imports/ImportPage.tsx
- src/features/imports/services/importSimulation.ts
- src/features/imports/services/types.ts
- src/features/imports/services/columnDefinitions.ts
- src/features/imports/services/columnMatching.ts
- schema/storage/migration
- export/report/backup
- students/calls/reminders
- docs/ code commit sırasında
- Obsidian vault

## Writer Davranışı

- Writer artık `row.phones[]` varsa Telefon 1-10 dahil tüm simulation phone listesinden `PhoneRecord` üretir.
- `row.phones[]` yoksa veya boşsa `phone_1` / `phone_2` fallback korunur.
- `writeImportToDatabase` public API değişmedi.
- Telefon 1/2 backward compatibility korunur.
- Telefon 3-10 gerçek DB'ye `PhoneRecord` olarak yazılır.

## Metadata Davranışı

- `phone_label` yazılır.
- `reference_label` yazılır.
- `priority` yazılır.
- `source_column` yazılır.
- `original_phone_value` korunur.
- `is_valid` simulation metadata'sından taşınır.
- `relation_label` import sırasında `null` kalır.
- `is_wrong` import sırasında `false` kalır.
- `phone_status` için gereksiz yeni davranış eklenmedi.

## Invalid Phone Kararı

- Strategy AI + kullanıcı kararıyla invalid ama non-empty telefonlar DB'ye yazılır.
- Bu kayıtlar `is_valid: false` ve `is_wrong: false` olarak yazılır.
- Writer invalid telefonu düzeltmez, normalize etmeye çalışmaz veya refactor etmez; simulation metadata'sını taşır.

## `search_text` Kararı

- Strategy AI + kullanıcı kararıyla `search_text`, `row.phones[]` içindeki tüm `normalized_phone_number` değerlerini içerir.
- Sadece Telefon 3+ numarası olan öğrenci telefon aramasıyla bulunabilir hale gelir.
- `studentListReader.ts` değiştirilmedi.
- UI/global search refactor yapılmadı.

## Dedup / Empty / Primary Davranışı

- Aynı satırdaki duplicate telefonlar tekilleştirilir.
- Empty phone DB'ye yazılmaz.
- İlk non-empty / en düşük priority telefon `is_primary: true` olur.
- Diğer telefonlar `is_primary: false` olur.

## Testler

- `importWriter.test.ts` Telefon 1-4 / Telefon 3 persistence, metadata, empty skip, dedupe, invalid non-empty persistence, Telefon 3 search_text ve rollback phone temizliği durumlarını kapsayacak şekilde güncellendi.
- Existing Telefon 1/2 regression davranışı korunur.

## Test Sonucu

- npm.cmd test geçti.
- 42 test files
- 240 tests

## Build Sonucu

- npm.cmd run build geçti.
- Vite chunk size uyarısı var, build hatası değildir.

## Scope Dışı

- ImportPage değişmedi.
- Simulation/mapping/type değişmedi.
- Schema/storage/version değişmedi.
- Export/report/backup yapılmadı.
- Students/calls/reminders yapılmadı.
- Ad/Soyad yapılmadı.
- Anne/Baba yapılmadı.
- Mahalle yapılmadı.
- Obsidian yapılmadı.
- Graphify repo'ya eklenmedi.

## Risk / Not

- Telefon 3-10 artık gerçek import writer/persistence tarafına bağlandı.
- Export/report/backup genişletmeleri hâlâ ayrı sprint/discovery konusudur.
- Ad/Soyad + Anne/Baba + Mahalle dar pilot sonrası ayrı ürün/data-model fazıdır.
- Bu sprint dar pilot için kritik eşiği kapatır.
- Docs-only closure sonrası Obsidian/Graphify update ayrıca değerlendirilecektir.
