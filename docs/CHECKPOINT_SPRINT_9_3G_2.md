# CHECKPOINT — Sprint 9.3G-2

Sprint adı:
Sprint 9.3G-2 — Import UI Progressive Disclosure

İş türü:
Implementation, ardından docs-only closure

Branch:
sprint-9-2-multi-phone-architecture-plan

Kod commit:
0c40524 feat: collapse long import review lists

## 1. Amaç

- Excel İçe Aktar ekranında uzun kolon eşleştirme, hata ve uyarı listelerinin görsel yığılmasını azaltmak.
- Import veri modeli, mapping seçenekleri veya writer/simulation logic değiştirmeden sadece UI display davranışını iyileştirmek.
- Telefon 3-10, AD/SOYAD, Anne/Baba ve Mahalle implementation işlerine girmemek.

## 2. Değişen Kod/Test Dosyaları

- src/features/imports/ImportPage.tsx
- tests/imports/ImportPageProgressiveDisclosure.test.tsx

## 3. Kolon Eşleştirme Davranışı

- Kolon Eşleştirme listesi ilk görünümde sınırlı gösterilir.
- `mapping_required`, manuel, auto-fixed ve zorunlu/önemli kolonlar dar görünümde korunur.
- Gizli kolon varsa `+N kolon daha göster` gösterilir.
- Açıkken `Daha az göster` gösterilir.
- Daraltınca tekrar sınırlı görünüme döner.
- Mapping logic değişmedi.
- Dropdown seçenekleri değişmedi.
- Column definitions değişmedi.

## 4. Hatalar Davranışı

- Hatalar başlığı/toplam sayı görünür kalır.
- İlk görünümde en fazla 10 hata gösterilir.
- Fazla hata varsa `+N hata daha göster` gösterilir.
- Açıkken `Daha az göster` gösterilir.
- Error üretimi ve import validation logic değişmedi.

## 5. Uyarılar Davranışı

- Uyarılar başlığı/toplam sayı görünür kalır.
- İlk görünümde en fazla 10 uyarı gösterilir.
- Fazla uyarı varsa `+N uyarı daha göster` gösterilir.
- Açıkken `Daha az göster` gösterilir.
- Warning üretimi ve import validation logic değişmedi.

## 6. State / Reset Davranışı

- Kolon mapping, hata ve uyarı expanded state'leri local state ile yönetilir.
- Yeni dosya, yeniden simülasyon ve simülasyon temizleme durumlarında state resetlenir.
- Global state veya büyük refactor yapılmadı.

## 7. Korunan Kapsam

- Import parser değişmedi.
- Import simulation değişmedi.
- Import writer değişmedi.
- Mapping definitions değişmedi.
- Column definitions değişmedi.
- Schema/storage değişmedi.
- Global CSS değişmedi.
- Telefon 3-10 mapping/import yapılmadı.
- AD/SOYAD yapılmadı.
- Anne/Baba yapılmadı.
- Mahalle yapılmadı.
- Export/report/backup yapılmadı.

## 8. Test Sonucu

- npm.cmd test geçti.
- 42 test files başarılı.
- 229 tests başarılı.

## 9. Build Sonucu

- npm.cmd run build geçti.
- Vite chunk size uyarısı var; build hatası değildir.

## 10. Risk / Not

- Bu sprint UI-only kaldı.
- Sıradaki data-model/import işleri ayrı discovery/implementation gerektirir.
- Telefon 3-10 import hâlâ yapılmadı.
- AD/SOYAD, Anne/Baba ve Mahalle hâlâ yapılmadı.
- Sonraki kontrollü iş roadmap kararına göre çoklu telefon import mapping/simulation discovery veya implementation olabilir.
