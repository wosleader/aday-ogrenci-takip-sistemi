# CHECKPOINT — Sprint 9.3B-2

Sprint adı:
Sprint 9.3B-2 — Phone Context Persistence Wiring

Branch:
sprint-9-3b-2-phone-context-persistence-wiring

Commit:
595979d feat: wire phone context persistence for calls and reminders

## 1. Kapsam

- Sprint 9.3B-1'de hazırlanan call log / reminder phone context model ve helper altyapısını gerçek kayıt yazma akışına bağlamak.
- Yalnızca `writeCallLog` transaction içinde phone context persistence wiring yapmak.
- UI, import/export, backup/restore, IndexedDB schema migration ve büyük refactor yapmamak.

## 2. Yapılanlar

- `writeCallLog` içinde `contactedPhone` varsa `createPhoneSnapshot(contactedPhone)` ile phone snapshot üretilir hale geldi.
- `contactedPhone` yoksa `phoneSnapshot` güvenli şekilde `null` kalır.
- `call_logs.add` içine `phone_snapshot` yazımı eklendi.
- Mevcut `phone_id` yazımı korundu.
- Mevcut `contacted_phone_id`, `contacted_phone_number`, `contacted_phone_label` legacy alanları korundu.
- Yeni pending reminder oluşturulurken `phone_id` ve `phone_snapshot` yazılır hale geldi.
- Mevcut pending reminder update edilirken phone context yeni contacted phone'a göre güncellenir hale geldi.
- Yeni contacted phone yoksa eski context korunmaz; `phone_id` ve `phone_snapshot` `null` olur.
- Türkçe relation label davranışı korundu:
  - Öğrenci
  - Yakın
  - Diğer

## 3. Değişen Dosyalar

- src/features/calls/services/callLogWriter.ts
- tests/calls/callLogWriter.test.ts

## 4. Eklenen Dosyalar

- Yok

## 5. Test Sonucu

- npm.cmd test geçti.
- 38 test files başarılı.
- 210 tests başarılı.

## 6. Build Sonucu

- npm.cmd run build geçti.
- Vite chunk size uyarısı var; build başarısız sayılmadı.

## 7. Kapsam Dışı Bırakılan İşler

- UI değişikliği
- Call history display
- Reminder display
- Sağ kişi kartı değişikliği
- Import/export değişikliği
- Backup/restore değişikliği
- IndexedDB/Dexie schema migration
- Storage version artırma
- Mobile/responsive değişiklik
- Reports Dashboard
- Büyük refactor

## 8. Kararlar / Notlar

- Phone context persistence, UI/form katmanına dokunmadan writer seviyesinde yapılabilir durumda tamamlandı.
- Reminder için ayrı writer yok; reminder create/update akışı `writeCallLog` transaction içinde ilerliyor.
- Optional alanlar kullanıldığı için schema migration gerekmedi.
- Backup snapshot tablo satırlarını bütün object olarak aldığı için bu sprintte backup/restore değişikliği yapılmadı.

## 9. Sonraki Önerilen İşler

- Sprint 9.3B-2 PR hazırlığı / merge kontrolü
- Phone context display/read layer için ayrı discovery
- Arama geçmişi ve Hatırlatmalar sayfasında telefon bağlamını göstermek için ayrı UI/read sprinti
- Çoklu telefon import/export ve backup/restore güvence işleri ayrı sprintlerde ele alınmalı
