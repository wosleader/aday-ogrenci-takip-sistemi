# CHECKPOINT — Sprint 9.3D-1

Sprint adı:
Sprint 9.3D-1 — Call History Phone Context UI Display

Branch:
sprint-9-2-multi-phone-architecture-plan

Commit:
23342b3 feat: show phone context in call history

## 1. Kapsam

- Sprint 9.3C'de reader/view-model katmanında üretilen phone context display alanlarını sağ kişi kartındaki “İletişim geçmişi” UI'ında göstermek.
- Sadece call history UI ve odaklı UI testi eklemek.
- Reminder list UI, reminder popup, reminder alarm, reader/model, persistence, import/export, backup/restore ve docs dışı büyük işler kapsam dışı tutmak.

## 2. Yapılanlar

- `src/features/students/StudentsPage.tsx` içinde sağ kişi kartındaki “İletişim geçmişi” render alanı güncellendi.
- Call history UI artık reader'ın ürettiği şu alanları kullanır:
  - `phone_context_label`
  - `phone_context_number`
- Display formatı:
  - Label + numara varsa: `Telefon 3 · Öğrenci: 0555 123 4567`
  - Sadece label varsa: `Telefon 3 · Öğrenci`
  - Sadece numara varsa: `0555 123 4567`
  - Context yoksa mevcut `Telefon seçilmedi` davranışı korunur.
- Odaklı UI testi eklendi:
  - `tests/students/StudentsPageCallHistory.test.tsx`
- Testte phone context label + number görünürlüğü ve context yokken fallback davranışı doğrulandı.
- Türkçe karakterlerin dosya içinde UTF-8 olarak temiz olduğu doğrulandı.

## 3. Değişen Dosyalar

- src/features/students/StudentsPage.tsx
- tests/students/StudentsPageCallHistory.test.tsx

## 4. Eklenen Dosyalar

- tests/students/StudentsPageCallHistory.test.tsx

## 5. Test Sonucu

- npm.cmd test geçti.
- 39 test files başarılı.
- 216 tests başarılı.

## 6. Build Sonucu

- npm.cmd run build geçti.
- Vite chunk size uyarısı build hatası değildir.

## 7. Kapsam Dışı Bırakılan İşler

- Reminder list UI değişikliği
- Reminder popup değişikliği
- Reminder alarm reader değişikliği
- Reader/model değişikliği
- Persistence değişikliği
- Import/export değişikliği
- Backup/restore değişikliği
- IndexedDB/Dexie schema migration
- Storage version artırma
- Büyük çoklu telefon sağ kişi kartı UI
- Excel'den 8-10 telefon kolonunu dinamik import etme
- `+N numara daha göster` UI
- Mobile/responsive polish
- Reports Dashboard
- Yeni paket kurulumu
- Büyük refactor

## 8. Kararlar / Notlar

- Sprint 9.3D-1 yalnızca call history UI için düşük riskli display adımıdır.
- Reminder list UI tablo/CSS/mobil riskleri nedeniyle ayrı sprintte ele alınacaktır.
- Büyük çoklu telefon mimarisi roadmap'te kalmaya devam eder:
  - Excel'den çoklu telefon import
  - sağ kişi kartında aşamalı/dinamik telefon gösterimi
  - `+N numara daha göster`
  - import/export genişletmeleri
  - backup/restore güvence turu
- Bu sprint bu roadmap'in tamamı değildir; sadece phone context'in geçmiş iletişim UI'ında görünür hale gelmesi adımıdır.

## 9. Sonraki Önerilen İşler

- Sprint 9.3D-2 — Reminder List Phone Context UI Display Discovery / Implementation
- Reminder list için tablo/CSS/mobil etki analizi
- Telefon context'in reminder list'te “Aranacak telefon” olarak mı, mevcut `Telefon 1` alanının context-aware hali olarak mı gösterileceğine ürün kararı
- Daha sonra büyük çoklu telefon sağ kişi kartı UI ve Excel import genişletmeleri için ayrı discovery/plan sprintleri
