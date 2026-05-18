<!-- Son güncelleme: Pilot v1.0 gerçek kullanım izleme | Branch: sprint-9-1-pilot-findings-final-fixes -->

# PROJECT_MEMORY — Aday Öğrenci Takip Sistemi

Bu dosya Codex oturumlarında ilk okunacak kısa proje hafızasıdır.

## Sistem Sağlığı

- PROJECT_MEMORY: ✅ Pilot v1.0 gerçek kullanım izleme
- FILE_MAP: ✅ Pilot v1.0 gerçek kullanım izleme
- DECISIONS: ✅ Pilot v1.0 gerçek kullanım izleme
- Son sprint-close çalıştırıldı: ✅ Sprint 9.1

## 1. Proje Amacı

- YKS/LGS hazırlık kurumları için aday öğrenci/veli arama ve takip CRM’i.
- Offline-first çalışır.
- Excel import, aday listesi, arama operasyonu, görüşme geçmişi, tekrar arama, export, tam sistem yedeği ve pilot kullanım hedeflenir.

## 2. Teknoloji ve Çalışma Modeli

- React + Vite + TypeScript + PWA.
- IndexedDB/Dexie yerel veri.
- Offline-first.
- Veriler bu bilgisayarda saklanır.
- Merkez/VDS/senkronizasyon henüz yok.
- Merkez, bulut, senkron ifadeleri gerçek özellik gelene kadar kullanıcıya gösterilmez.

## 3. Değişmeyen Kritik Kurallar

- Yeni paket kurmadan önce açık ihtiyaç olmalı.
- Büyük refactor yapılmayacak; kontrollü küçük sprintlerle ilerlenir.
- Kod yazmadan önce plan çıkarılır.
- Onay almadan dosya değiştirilmez.
- Commit/push kullanıcı onayıyla yapılır.
- Figma/Stitch büyük UI dönüşümüne kullanıcı onayı olmadan geçilmez.
- Akıllı Yardımcılar henüz uygulanmadı; dış AI API kullanılmayacak, offline/kural tabanlı olacak.

## 4. Kritik Ürün Kararları

Detaylı karar günlüğü: `docs/DECISIONS.md`

Kısa özet:

- Excel export geri yükleme aracı değildir; geri yükleme için Tam Sistem Yedeği kullanılır.
- Arama operasyonu Aday Listesi + sağ kişi kartı üzerinden yürür.
- `/students` ekranında global dropdown açılmaz.
- Restore replace mode’dur.
- Sınıf / Şube filtresi `current_class` + `student_group` üzerinden yorumlanır.
- Raporlar sayfası günlük operasyon özeti içindir; Excel export’un yerine geçmez.
- Akıllı Yardımcılar yol haritasındadır; offline/kural tabanlı olacak, dış AI API kullanılmayacak.

## 5. Veri Modeli ve Kavramlar

- `current_class` = Sınıf / eğitim seviyesi.
- `student_group` = Şube / grup / program bilgisi.
- Kullanıcıya gösterilecek filtre adı: Sınıf / Şube.
- Örnekler:
  - `current_class: 9`, `student_group: A` → `9-A`
  - `current_class: 11`, `student_group: YKS Hazırlık` → `11. Sınıf YKS Hazırlık`
  - `9A`, `9-A`, `9/A`, `9 A` → `9-A`
- `0`, `22`, `33`, `44` gibi anlamsız numeric-only değerler kullanıcıya seçenek olarak gösterilmez; Belirtilmemiş altında toplanır.
- `9`, `10`, `11`, `12` gibi gerçek sınıf seviyeleri `9. Sınıf`, `10. Sınıf` gibi gösterilebilir.
- Durum chipleri dropdown’a alınmıştır:
  Tümü, Telefon bilgisi eksik, Tekrar aranacak, Mükerrer telefon, Aranmamış, Notu olanlar.

## 6. Import Kararları

- Excel import kolon eşleştirme destekler.
- Yazım hatalı kolonlar otomatik eşleştirilebilir ve loglanır.
- Eksik/uyumsuz kolonlarda kullanıcı bilgilendirilir.
- Duplicate import modalı vardır.
- Sınıf ve Şube/Grup ayrı kolonlarda verilirse ayrı kolon daha güvenilir kabul edilir.
- Tek birleşik sınıf değeri varsa yaygın yazımlar parse edilmeye çalışılır.
- Çelişkide ayrı Şube/Grup kolonu esas alınır; mümkünse import log uyarısı yazılır.

## 7. Aday Listesi / Arama Operasyonu

- Aday listesi ana operasyon ekranıdır.
- Sağ drawer kişi kartıdır.
- Kaydet ve sonrakine geç arama akışının merkezidir.
- Telefon 1/2, son görüşülen numara, yanlış numara davranışları korunur.
- Açıklama/not, `call_logs` ve reminder akışları korunur.
- Sınıf / Şube filtresi pilot öncesi polish olarak eklendi.
- Sınıf seviyesi ve şube seviyesi filtrelenebilir.
- Durum Filtresi dropdown olarak çalışır.

## 8. Reminder / Bildirim Kararları

- Reminder popup, ses ve çan paneli vardır.
- Popup kapatma aynı reminder’ı aynı tarih/saat için tekrar göstermez.
- Tarih/saat değişirse tekrar gösterilebilir.
- Çan paneli kapatılmış reminder bilgilerini gösterir.
- Çan panelinden aday açılabilir.
- Panel geçmiş sınırı: 3 gün / 20 kayıt / panelde 10 görünür.

## 9. Export Kararları

- Detaylı Excel Export korunur.
- Özet Görüşme Raporu eklendi.
- Özet rapor adı: Özet Görüşme Raporu (Fazla Detay İçermez)
- Özet raporda Kampanya ve Tekrar Arama Tarihi yoktur.
- Genel Açıklama ayrı, `call_logs.note` ayrı tutulur.
- Açıklama N / Açıklama N Tarihi dinamik kolonları dolu notlardan üretilir.
- Boş notlar kolon şişirmez.
- Export snapshot filtrelenmiş `student_id` listesinden beslenir.

## 10. Backup / Restore Kararları

- Tam Sistem Yedeği Al ve Sistem Yedeğinden Geri Yükle pilot seviyede güçlendirildi.
- Backup metadata:
  `app_name`, `backup_type`, `backup_version`, `app_version`, `app_schema_version`, `created_at`, `counts`.
- Dosya adı:
  `AOTS_Tam_Sistem_Yedegi_yyyy-MM-dd_HH-mm.json`
- Restore replace mode’dur.
- Merge mode henüz yok.
- Restore için `GERİ YÜKLE` yazı doğrulaması gerekir.
- Yanlış JSON, Excel export dosyası, eksik tablo, yeni `backup_version` kullanıcı dostu hata verir.
- Ana UI’da JSON yedek dili gösterilmez.

## 11. Test / Pilot Durumu

- Pilot readiness checklist var:
  `docs/PILOT_READINESS_CHECKLIST.md`
- Kullanım kitapçığı hazır:
  `docs/USER_GUIDE.md`
- Pilot manuel test checklist’i hazır:
  `docs/PILOT_MANUAL_TEST_CHECKLIST.md`
- Pilot release candidate review hazır:
  `docs/PILOT_RELEASE_CANDIDATE_REVIEW.md`
- Pilot v1.0 release notes hazır:
  `docs/PILOT_V1_RELEASE_NOTES.md`
- Pilot v1.0 gerçek kullanım deneme raporu hazır:
  `docs/PILOT_RUN_REPORT.md`
- Kritik manuel döngü:
  temiz veri → import → aday listesi → görüşme → reminder → export → backup → temizle → restore.
- Sprint 9.1 pilot bulguları kapatıldı.
- Sistem küçük ölçekli kontrollü pilot deneme için release candidate kabul edilebilir.
- Pilot v1.0 gerçek kullanım denemesi yapıldı.
- Yeni engelleyici sorun bildirilmezse sistem küçük ölçekli kontrollü kullanımda izlenmeye devam eder.
- Pilot sırasında sorun çıkarsa Sprint 9.2 Pilot Feedback Fixes açılacak.

## 12. Tamamlanan Sprintler

- Sprint 8.1: Sınıf / Şube filtresi ve Durum Filtresi polish.
- Sprint 8.3: Aday listesi Açıklama / Not kolonu polish.
- Sprint 8.5: Hatırlatmalar sayfası.
- Sprint 8.6: Raporlar / Günlük Özet Sayfası.
- Sprint 8.7: Responsive Layout Polish.
- Sprint 8.8: Shortcut Help Bar Polish.
- Sprint 8.9: Pilot Fix / Release Polish.
- Sprint 9.0: Kullanım Kitapçığı ve Pilot Manuel Test Checklist dokümantasyonu.
- Sprint 9.1: Pilot Test Findings / Final Fixes.
- Pilot Release Candidate / Final Review: tamamlandı.
- Pilot v1.0 Release Notes: hazırlandı.
- Pilot v1.0 gerçek kullanım denemesi: yapıldı.

## 13. Yol Haritası

Güncel önerilen sıra:

1. Birkaç günlük gerçek kullanım geri bildirimi toplama / gerekirse Sprint 9.2 — Pilot Feedback Fixes
2. Mobile Drawer Polish
3. Mobile Table/Card View Polish
4. Çoklu Telefon Mimarisi
5. Akıllı Yardımcılar
6. Toplu silme / seçim modu
7. Figma/Stitch operasyon listesi sadeleştirme
8. Haftalık/aylık rapor veya rapor genişletmeleri
9. Günlük rapor / mükerrerler ekranı genişletmeleri
10. VDS/merkez/senkronizasyon

Roadmap kararları:

- Responsive Layout Polish Sprint 8.7 kapsamında düşük riskli CSS ağırlıklı polish olarak tamamlandı.
- Shortcut Help Bar Polish Sprint 8.8 kapsamında tamamlandı.
- Pilot Fix / Release Polish Sprint 8.9 kapsamında tamamlandı.
- Kullanım kitapçığı ve pilot manuel test checklist’i Sprint 9.0 kapsamında hazırlandı.
- Manuel pilot kontrol bulguları Sprint 9.1 kapsamında kapatıldı.
- Pilot Release Candidate / Final Review tamamlandı.
- Pilot v1.0 release notes hazırdır.
- Pilot v1.0 gerçek kullanım denemesi yapılmıştır.
- Kullanım kitapçığı ve pilot checklist hazırdır.
- Pilot Findings kapatıldı.
- Pilot gerçek kullanım geri bildirimleri birkaç gün toplanacak; yeterli bulgu oluşursa Sprint 9.2 Pilot Feedback Fixes altında kapatılacak.
- Mobile Drawer Polish ayrı sprint olarak yapılacak.
- Mobile Table/Card View Polish ayrı sprint olarak değerlendirilecek.
- Sistem uzun vadede Telefon 1 / Telefon 2 ile sınırlı kalmayacak; adayın birden fazla iletişim numarası telefon listesi olarak tutulacak. Bu iş ayrı mimari sprintte ele alınacak.

## Bu Dosya Ne Zaman Güncellenmeli?

- Yeni sprint tamamlandığında
- Kritik ürün kararı değiştiğinde
- Veri modeli / import / export / backup davranışı değiştiğinde
- Yol haritası değiştiğinde
- Yeni ana modül eklendiğinde
- Kullanım kitapçığına etki eden karar alındığında

## Checkpoint Okuma Rehberi

- Backup/Restore değişecekse: `docs/CHECKPOINT_SPRINT_7.md`
- Özet Görüşme Raporu / export değişecekse: `docs/CHECKPOINT_SPRINT_6_2.md`
- Kısayollar / global arama / bildirim paneli değişecekse: `docs/CHECKPOINT_SPRINT_6_1.md`
- Detaylı export / call workflow feedback değişecekse: `docs/CHECKPOINT_SPRINT_6.md`
- Figma/Stitch UI kararları gerekiyorsa: `docs/UI_BASELINE_BEFORE_FIGMA.md`
- Pilot test gerekiyorsa: `docs/PILOT_READINESS_CHECKLIST.md`
- Hatırlatmalar sayfası değişecekse: `docs/CHECKPOINT_SPRINT_8_5.md`
- Raporlar / Günlük Özet sayfası değişecekse: `docs/CHECKPOINT_SPRINT_8_6.md`
- Responsive layout davranışı değişecekse: `docs/CHECKPOINT_SPRINT_8_7.md`
- Kısayol yardım barı değişecekse: `docs/CHECKPOINT_SPRINT_8_8.md`
- Pilot/release polish metinleri değişecekse: `docs/CHECKPOINT_SPRINT_8_9.md`
- Pilot bulguları / final fixes değişecekse: `docs/CHECKPOINT_SPRINT_9_1.md`
- Pilot release candidate kararı değişecekse: `docs/PILOT_RELEASE_CANDIDATE_REVIEW.md`
- Pilot v1.0 release notları değişecekse: `docs/PILOT_V1_RELEASE_NOTES.md`
- Pilot gerçek kullanım deneme sonucu değişecekse: `docs/PILOT_RUN_REPORT.md`
- Çok eski sprint bağlamı gerekiyorsa ilgili eski checkpoint okunur; tüm checkpoint’ler gereksiz yere okutulmaz.

## 14. Güncel Çalışma Bilgisi

Bu bölüm sık değişir ve dosyanın en altında kalmalıdır.

- Güncel branch: `sprint-9-1-pilot-findings-final-fixes`
- Bu branch’in amacı: Pilot v1.0 gerçek kullanım denemesi sonucunu kayıt altına almak.
- Önceki çalışma branch’i: `sprint-9-0-user-guide-pilot-checklist`
- Güncel release candidate commit’i: `12062f0 docs: add sprint 9.1 checkpoint and update pilot findings`
- Güncel Pilot v1.0 release candidate commit’i: `113b44b docs: add pilot release candidate review`
- Pilot v1.0 release commit’i: `b59e3af docs: add pilot v1 release notes`
- Son bilinen fix commit’i: `4c289b7 fix: close pilot findings for restore notices and layout polish`
- Sonraki önerilen aşama: Birkaç günlük gerçek kullanım geri bildirimi toplama / gerekirse Sprint 9.2 — Pilot Feedback Fixes.

## 15. Codex Standart Başlangıç Talimatı

Yeni Codex oturumlarında mümkünse şu kısa başlangıç kullanılacak:

“Önce `docs/PROJECT_MEMORY.md`, `docs/FILE_MAP.md` ve `docs/DECISIONS.md` oku. Sadece bu işle ilgili checkpoint gerekiyorsa oku. Kod yazmadan önce plan çıkar. Onay almadan dosya değiştirme, paket kurma, commit/push yapma.”
