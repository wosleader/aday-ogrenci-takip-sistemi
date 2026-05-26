# CHECKPOINT — Sprint 9.3E-1

Sprint adı:
Sprint 9.3E-1 — Right Card Multi-Phone Read Model

İş türü:
Implementation, ardından docs-only closure

Branch:
sprint-9-2-multi-phone-architecture-plan

Kod commit:
8043507 feat: add multi-phone read model for student cards

## 1. Amaç

- Sağ kişi kartı UI uygulamasına geçmeden önce `StudentListRow` read model'ini 3+ telefon için hazırlamak.
- Çoklu telefon sağ kişi kartı UI'nın ihtiyaç duyacağı liste, ilk görünüm ve kalan sayı bilgisini reader/view-model katmanında üretmek.
- UI, import/export, backup/restore, schema/storage ve call/reminder persistence alanlarına dokunmadan güvenli veri katmanı hazırlığı yapmak.

## 2. Değişen Kod Dosyaları

- src/features/students/services/studentListReader.ts
- tests/students/studentListReader.test.ts

## 3. Eklenen Read Model Alanları

`StudentListRow` geriye dönük uyumlu şekilde şu alanlarla genişletildi:

- `phones`
- `visible_phones`
- `hidden_phone_count`

## 4. Phone Row / View Model Alanları

`phones` ve `visible_phones` içindeki telefon satırları şu bilgileri taşır:

- `id`
- `phone_number`
- `normalized_phone_number`
- `reference_label`
- `relation_label`
- `display_label`
- `source_column`
- `phone_status`
- `is_primary`
- `is_wrong`
- `is_valid`

## 5. Davranış

- `phones` tüm okunabilir/normalize telefon listesini taşır.
- `visible_phones` sağ kişi kartı ilk görünümü için ilk 3 telefonu taşır.
- `hidden_phone_count` kalan telefon sayısını taşır.
- 5 telefonlu adayda `hidden_phone_count` 2 olur.
- Yanlış/geçersiz telefonlar listeden düşmez; status bilgisiyle taşınır.
- Telefonsuz adayda `phones` ve `visible_phones` boş liste, `hidden_phone_count` 0 döner.
- Sıralama mevcut compatibility helper davranışıyla priority/reference order üzerinden korunur.

## 6. Geriye Dönük Uyumluluk

Korunan alanlar:

- `phone_1`
- `phone_2`
- `phone_count`
- `has_missing_phone`

Korunan davranışlar:

- Mevcut aday listesi search/filter/sort davranışı
- Telefon 1 / Telefon 2 ekran tüketimi
- UI'nın mevcut `phone_1` / `phone_2` akışı

## 7. Test Sonucu

- npm.cmd test geçti.
- 39 test files passed.
- 218 tests passed.

## 8. Build Sonucu

- npm.cmd run build geçti.
- Vite chunk size uyarısı var; build hatası değildir.

## 9. Kapsam Dışı Bırakılan İşler

- UI değişikliği
- `StudentsPage.tsx` değişikliği
- CSS / `global.css` değişikliği
- Import/export değişikliği
- Backup/restore değişikliği
- IndexedDB/Dexie schema migration
- Storage version artırma
- Call/reminder persistence değişikliği
- Telefon 3+ seçim/call log wiring
- Excel çoklu telefon import
- `+N numara daha göster` UI
- Docs dışı ek değişiklik

## 10. Risk / Not

- Kullanıcı görünür davranışı değişmedi; yeni alanlar henüz UI'ya bağlanmadı.
- Sprint 9.3E-1, sağ kişi kartı çoklu telefon UI için veri/read model hazırlığıdır.
- Sıradaki güvenli iş Sprint 9.3E-2 right card multi-phone UI display discovery/implementation olabilir.
- Telefon 3+ seçiminin arama kaydıyla ilişkisi ayrı discovery gerektirir.
- Excel çoklu telefon import ayrı discovery/implementation gerektirir.

## 11. Sonraki Önerilen İşler

- Sprint 9.3E-2 — Right Card Multi-Phone UI Display
- Telefon 3+ seçim/call log ilişkisi discovery
- Excel çoklu telefon import discovery
- Çoklu telefon export/backup güvence işleri
