# CHECKPOINT — Sprint 9.3F-1

Sprint adı:
Sprint 9.3F-1 — Phone 3+ Call Save Selection

İş türü:
Implementation, ardından docs-only closure

Branch:
sprint-9-2-multi-phone-architecture-plan

Kod commit:
121f175 feat: select extra phone for call save

## 1. Amaç

- Telefon 3+ için yalnızca görüşme kaydında kullanılacak telefon seçimini eklemek.
- Telefon 3+ status aksiyonlarına, shortcutlara veya schema/storage değişikliğine girmemek.
- Mevcut `contacted_phone_id` / `phone_snapshot` altyapısını kullanmak.

## 2. Değişen Kod/Test Dosyaları

- src/features/students/StudentsPage.tsx
- src/features/calls/services/callSaveValidation.ts
- tests/calls/callSaveValidation.test.ts
- tests/students/StudentsPagePhoneSelection.test.tsx

## 3. UI Davranışı

- Telefon 3+ readonly kartlarında `Bu numarayla görüşüldü` seçimi eklendi.
- Seçili Telefon 3+ görüşme kaydında kullanılacak telefon olarak işaretlenir.
- Telefon 3+ için yanlış/kullanılmıyor butonu eklenmedi.
- Telefon 3+ için son görüşülen status aksiyonu eklenmedi.
- Telefon 1 / Telefon 2 mevcut aksiyonlu kart davranışı korundu.

## 4. Save / Call Log Davranışı

- `selectedCallPhoneId` / selected phone state kaydetme sırasında öncelikli `contacted_phone_id` olarak kullanılır.
- `selectedCallPhoneId` yoksa mevcut Telefon 1/2 legacy contacted fallback korunur.
- `callLogWriter` değiştirilmedi.
- Mevcut `contacted_phone_id` / `phone_snapshot` altyapısı kullanıldı.
- Telefon 3+ seçilince call history'de doğru telefon context'i görünür.

## 5. Validation Davranışı

- Telefon 1/2'ye özel hata mesajı genel hale getirildi.
- Validation input'u çoklu telefon listesiyle uyumlu hale getirildi.
- Validation değişikliği küçük ve sınırlı tutuldu.
- Büyük validation refactor yapılmadı.

## 6. Korunan Davranışlar

- Telefon 1 / Telefon 2 son görüşülen aksiyonu korundu.
- Telefon 1 / Telefon 2 yanlış/kullanılmıyor aksiyonu korundu.
- T/Y/X shortcut davranışı değiştirilmedi.
- `phone_1` / `phone_2` fallback davranışı korundu.
- `visible_phones` / `phones` UI gösterimi korundu.
- `+N numara daha göster` / `Daha az göster` davranışı korundu.

## 7. Kapsam Dışı Bırakılan İşler

- Telefon 3+ yanlış/kullanılmıyor status aksiyonu
- Telefon 3+ son görüşülen status aksiyonu
- `markPhoneAsContacted` refactor
- `updatePhoneStatus` refactor
- `callLogWriter` değişikliği
- Storage/schema migration
- Shortcut registry değişikliği
- CSS değişikliği
- Reader/model değişikliği
- Reminder writer değişikliği
- Excel çoklu telefon import
- Export/report/backup değişikliği
- Docs dışında kod/test değişikliği

## 8. Test Sonucu

- npm.cmd test geçti.
- 41 test files başarılı.
- 225 tests başarılı.

## 9. Build Sonucu

- npm.cmd run build geçti.
- Vite chunk size uyarısı var; build hatası değildir.

## 10. Risk / Not

- Telefon 3+ artık görüşme kaydına bağlanabilir.
- Telefon 3+ status yönetimi hâlâ ayrı discovery/implementation konusudur.
- Excel çoklu telefon import ayrı discovery/implementation gerektirir.
- Sonraki kontrollü iş roadmap kararına göre Telefon 3+ status aksiyon discovery veya Excel çoklu telefon import discovery olmalıdır.
