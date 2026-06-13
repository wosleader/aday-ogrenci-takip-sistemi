<!-- Son guncelleme: Mahalle/Ilce Import Pilot | Branch: sprint-9-2-multi-phone-architecture-plan -->

# PROJECT_MEMORY — Aday Öğrenci Takip Sistemi

Bu dosya Codex oturumlarında ilk okunacak kısa proje hafızasıdır.

## Sistem Sağlığı

- PROJECT_MEMORY: Mahalle/Ilce Import Pilot
- FILE_MAP: Mahalle/Ilce Import Pilot
- DECISIONS: Mahalle/Ilce Import Pilot
- Son implementation commit: 70705af feat: import student location fields
- Son docs closure hedefi: docs: close student location import checkpoint

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
- Telefon 1/2 ve Telefon 3+ kartlarında son telefon bazlı görüşme sonucu read-only olarak gösterilir.
- Telefon bazlı son sonuç `call_logs` üzerinden türetilir; `PhoneRecord` mutate edilmez ve `phone_status` anlamı değişmez.
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
- Pilot izleme sırasında gelen PF-006–PF-012 küçük UI/UX polish bulguları kapatıldı.
- Sprint 9.2 Çoklu Telefon Mimarisi Planı başlatıldı; uygulama yapılmadan ürün/UX/teknik kararlar dokümante ediliyor.
- Sprint 9.3A Çoklu Telefon Core Model kapsamında domain type ve compatibility helper altyapısı tamamlandı; UI/import/export/call writer/reminder writer/backup davranışı değiştirilmedi.
- Sprint 9.3A son feature commit’i: `76a3b3a feat: add multi-phone core compatibility helpers`.
- Sprint 9.3A test/build sonucu: `npm.cmd test` ve `npm.cmd run build` geçti; Vite chunk size uyarısı build başarısızlığı değildir.
- Sprint 9.3B-1 kapsamında call log ve reminder kayıtları için optional phone context model alanları ve UI’ya bağlanmamış display/fallback helper’ları tamamlandı.
- Sprint 9.3B-1 son feature commit’i: `de15abf feat: add phone context model helpers for calls and reminders`.
- Sprint 9.3B-1 test/build sonucu: `npm.cmd test` ve `npm.cmd run build` geçti; Vite chunk size uyarısı build başarısızlığı değildir.
- Sprint 9.3B-2 kapsamında `writeCallLog` transaction içinde call log ve pending reminder kayıtlarına phone context persistence wiring bağlandı.
- Sprint 9.3B-2 son feature commit’i: `595979d feat: wire phone context persistence for calls and reminders`.
- Sprint 9.3B-2 test/build sonucu: `npm.cmd test` ve `npm.cmd run build` geçti; 38 test files / 210 tests başarılıdır. Vite chunk size uyarısı build başarısızlığı değildir.
- Sprint 9.3C kapsamında phone context bilgisi UI'ya dokunmadan reader/view-model katmanına taşındı.
- Sprint 9.3C son feature commit’i: `34d06bd feat: add phone context read models`.
- Sprint 9.3C test/build sonucu: `npm.cmd test` ve `npm.cmd run build` geçti; 38 test files / 214 tests başarılıdır. Vite chunk size uyarısı build başarısızlığı değildir.
- Sprint 9.3D-1 kapsamında phone context bilgisi sağ kişi kartındaki call history UI'ında gösterilir hale geldi.
- Sprint 9.3D-1 son feature commit’i: `23342b3 feat: show phone context in call history`.
- Sprint 9.3D-1 test/build sonucu: `npm.cmd test` ve `npm.cmd run build` geçti; 39 test files / 216 tests başarılıdır. Vite chunk size uyarısı build başarısızlığı değildir.
- Sprint 9.3D-2 kapsamında phone context bilgisi Hatırlatmalar listesindeki `Aranacak telefon` kolonunda gösterilir hale geldi.
- Sprint 9.3D-2 son feature commit’i: `dba4cc6 feat: show phone context in reminders list`.
- Sprint 9.3D-2 test/build sonucu: `npm.cmd test` ve `npm.cmd run build` geçti; 39 test files / 217 tests başarılıdır. Vite chunk size uyarısı build başarısızlığı değildir.
- Sprint 9.3E-1 kapsamında sağ kişi kartı çoklu telefon UI öncesi `StudentListRow` read model'i hazırlandı.
- Sprint 9.3E-1 son feature commit’i: `8043507 feat: add multi-phone read model for student cards`.
- Sprint 9.3E-1 test/build sonucu: `npm.cmd test` ve `npm.cmd run build` geçti; 39 test files / 218 tests başarılıdır. Vite chunk size uyarısı build başarısızlığı değildir.
- Sprint 9.3E-2 kapsamında sağ kişi kartında Telefon 3+ readonly görüntüleme eklendi.
- Sprint 9.3E-2 son feature commit’i: `67812cb feat: show extra phones in right card`.
- Sprint 9.3E-2 test/build sonucu: `npm.cmd test` ve `npm.cmd run build` geçti; 40 test files / 221 tests başarılıdır. Vite chunk size uyarısı build başarısızlığı değildir.
- Sprint 9.3F-1 kapsamında Telefon 3+ için call save selection eklendi.
- Sprint 9.3F-1 son feature commit’i: `121f175 feat: select extra phone for call save`.
- Sprint 9.3F-1 test/build sonucu: `npm.cmd test` ve `npm.cmd run build` geçti; 41 test files / 225 tests başarılıdır. Vite chunk size uyarısı build başarısızlığı değildir.
- Sprint 9.3F-1 ile sağ kişi kartında Telefon 3+ artık görüşmede kullanılan telefon olarak seçilebilir; seçilen Telefon 3+ `contacted_phone_id` olarak call log kaydına gider ve mevcut `phone_snapshot` altyapısı kullanılır. `callLogWriter`, schema/storage, reader/model, CSS, import/export/backup değiştirilmedi.
- Telefon 1/2 legacy davranışı korundu; validation mesajı Telefon 1/2'ye özel olmaktan çıkarıldı. Telefon 3+ yanlış/kullanılmıyor ve son görüşülen status aksiyonları hâlâ kapsam dışıdır.
- Sprint 9.3G-2 kapsaminda Excel Ice Aktar ekraninda progressive disclosure eklendi.
- Sprint 9.3G-2 son feature commit'i: `0c40524 feat: collapse long import review lists`.
- Sprint 9.3G-2 test/build sonucu: `npm.cmd test` ve `npm.cmd run build` gecti; 42 test files / 229 tests basarilidir. Vite chunk size uyarisi build basarisizligi degildir.
- Sprint 9.3G-2 ile Kolon Eslestirme uzun listeleri kademeli gosterilir; Hatalar ve Uyarilar ilk 10 kayitla sinirli gosterilir, fazlasi kullanici istegiyle acilir. Import logic, mapping, writer, simulation, schema/storage, global CSS, Telefon 3-10, AD/SOYAD, Anne/Baba ve Mahalle degistirilmedi.
- Sprint 9.3G-4 kapsaminda Telefon 3-10 import mapping key'leri ve import simulation `phones[]` coklu telefon modeli hazirlandi.
- Sprint 9.3G-4 son code commit'i: `2e1bbff feat: add multi-phone import simulation`.
- Sprint 9.3G-4 test/build sonucu: `npm.cmd test` ve `npm.cmd run build` gecti; 42 test files / 235 tests basarilidir. Vite chunk size uyarisi build basarisizligi degildir.
- Sprint 9.3G-4 ile `phone_1` / `phone_2` backward compatibility korunur; bos telefonlar `phones[]` icine alinmaz, ayni satirdaki duplicate telefonlar tekillestirilir, invalid non-empty telefonlar `is_valid: false` metadata ile tasinir ve duplicate warning kontrolu tum `phones[]` alanlarini kapsar.
- Sprint 9.3G-4'te `importWriter.ts`, `ImportPage.tsx`, schema/storage, export/report/backup, students/calls/reminders, Ad/Soyad, Anne/Baba ve Mahalle degistirilmedi. Telefon 3-10 DB writer/persistence henuz yapilmadi.
- Sprint 9.3G-5 code tarafı tamamlandı ve pushlandı.
- Sprint 9.3G-5 son code commit'i: `34ec8d5 feat: persist multi-phone import records`.
- Sprint 9.3G-5 test/build sonucu: `npm.cmd test` ve `npm.cmd run build` geçti; 42 test files / 240 tests başarılıdır. Vite chunk size uyarısı build başarısızlığı değildir.
- Sprint 9.3G-5 ile Telefon 3-10 gerçek import writer/persistence tamamlandı; `importWriter.ts` artık `row.phones[]` üzerinden Telefon 1-10 phone records yazar.
- `phone_1` / `phone_2` fallback ve backward compatibility korunur. `phone_label`, `reference_label`, `priority`, `source_column`, `original_phone_value` ve `is_valid` metadata'sı korunur.
- Invalid non-empty phones DB'ye `is_valid: false` ve `is_wrong: false` olarak yazılır. `search_text` tüm `row.phones[]` `normalized_phone_number` değerlerini içerir; sadece Telefon 3+ numarası olan öğrenci telefon aramasıyla bulunabilir.
- Sprint 9.3G-5'te `ImportPage`, `importSimulation`, `types`, `columnDefinitions`, schema/storage, export/report/backup, Ad/Soyad, Anne/Baba ve Mahalle değiştirilmedi.
- Sprint 9.3B-2 persistence wiring katmanıdır; Sprint 9.3C read/display model katmanıdır; Sprint 9.3D-1 call history UI display katmanıdır; Sprint 9.3D-2 reminder list UI display katmanıdır; Sprint 9.3E-1 right card multi-phone read model katmanıdır; Sprint 9.3E-2 right card multi-phone UI display katmanıdır; Sprint 9.3F-1 Telefon 3+ call save selection katmanıdır; Sprint 9.3G-2 import UI progressive disclosure katmanidir; Sprint 9.3G-4 multi-phone import mapping/simulation katmanidir; Sprint 9.3G-5 multi-phone import writer/persistence katmanıdır. Detay için `docs/CHECKPOINT_SPRINT_9_3G_5.md` kullanılmalıdır.
- Yeni engelleyici sorun bildirilmezse sistem küçük ölçekli kontrollü kullanımda izlenmeye devam eder.
- Pilot sırasında yeni sorun çıkarsa ayrı Pilot Feedback Fixes kapsamında ele alınacak.

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
- Sprint 9.2: Çoklu Telefon Mimarisi Planı hazırlanıyor.
- Sprint 9.3A: Çoklu Telefon Core Model + Compatibility tamamlandı.
- Sprint 9.3B-1: Call Log / Reminder Phone Context Model + Helpers tamamlandı.
- Sprint 9.3B-2: Phone Context Persistence Wiring tamamlandı.
- Sprint 9.3C: Phone Context Display / Read Layer tamamlandı.
- Sprint 9.3D-1: Call History Phone Context UI Display tamamlandı.
- Sprint 9.3D-2: Reminder List Phone Context UI Display tamamlandı.
- Sprint 9.3E-1: Right Card Multi-Phone Read Model tamamlandı.
- Sprint 9.3E-2: Right Card Multi-Phone UI Display tamamlandı.
- Sprint 9.3F-1: Phone 3+ Call Save Selection tamamlandı.
- Sprint 9.3G-2: Import UI Progressive Disclosure tamamlandı.
- Sprint 9.3G-4: Multi-Phone Import Mapping / Simulation tamamlandı.
- Sprint 9.3G-5: Multi-Phone Import Writer / Persistence tamamlandı.

## 13. Yol Haritası

Güncel önerilen sıra:

1. Sprint 9.3G-5 docs-only commit/push
2. Obsidian/Graphify update değerlendirmesi
3. Localhost manuel QA / dar pilot readiness kontrolü
4. Dar pilot öncesi kırıcı bug/risk değerlendirmesi
5. Dar pilot sonrası AD/SOYAD + Anne/Baba + Mahalle data model discovery/implementation
6. Export/report/backup uyumu discovery
7. Sprint 9.4 — Çoklu Telefon Import / Duplicate / Export
8. Sprint 9.5 — Çoklu Telefon UI / Sağ Kişi Kartı
9. Sprint 9.6 — Çoklu Telefon Responsive Polish
10. Gerçek kullanım geri bildirimlerini toplamaya devam / gerekirse Pilot Feedback Fixes
11. Reports Dashboard Polish
12. Mobile Drawer Polish
13. Mobile Table/Card View Polish
14. Akıllı Yardımcılar
15. Toplu silme / seçim modu
16. Figma/Stitch operasyon listesi sadeleştirme
17. Haftalık/aylık rapor veya rapor genişletmeleri
18. Günlük rapor / mükerrerler ekranı genişletmeleri
19. VDS/merkez/senkronizasyon

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
- Pilot izleme sırasında gelen PF-006–PF-012 küçük UI/UX polish bulguları kapatıldı.
- Pilot gerçek kullanım geri bildirimleri birkaç gün toplanacak; yeterli bulgu oluşursa ayrı Pilot Feedback Fixes kapsamında kapatılacak.
- Reports Dashboard Polish pilot sonrası ayrı sprint olarak değerlendirilecek; Gemini tarafından üretilen premium dashboard yaklaşımı pilot feedback fix kapsamında uygulanmadı.
- Mobile Drawer Polish ayrı sprint olarak yapılacak.
- Mobile Table/Card View Polish ayrı sprint olarak değerlendirilecek.
- Sistem uzun vadede Telefon 1 / Telefon 2 ile sınırlı kalmayacak; adayın birden fazla iletişim numarası telefon listesi olarak tutulacak. Bu iş ayrı mimari sprintte ele alınacak.
- Sprint 9.2 Çoklu Telefon Mimarisi Planı başlatıldı; detaylı plan `docs/MULTI_PHONE_ARCHITECTURE_PLAN.md` içindedir.
- Çoklu telefon kararı: sabit 10 boş telefon kutusu gösterilmeyecek; telefonlar dinamik liste olacak. Sağ kişi kartında ilk 2-3 telefon hızlı görünür, fazlası “+N numara daha göster” ile açılır. `Telefon N` referans etiketi ile ilişki etiketi ayrı tutulur. Call log ve reminder kayıtları seçili telefon bağlamını `phone_id` + snapshot ile koruyacak şekilde planlanır.
- Sprint 9.3A kararı: Çoklu telefon için `PhoneRelationLabel`, `PhoneOperationalStatus`, `PhoneSnapshot` type’ları ve phone compatibility helper’ları eklendi; mevcut Telefon 1 / Telefon 2 ekran davranışı bu sprintte değiştirilmedi.
- Sprint 9.3B-1 kararı: `CallLogRecord` ve `ReminderRecord` içine optional `phone_id` / `phone_snapshot` bağlamı hazırlandı; gerçek kayıt yazma, UI, import/export, backup/restore ve storage migration bu sprintte yapılmadı.
- Sprint 9.3B-2 kararı: `writeCallLog` transaction içinde call log ve pending reminder kayıtlarına optional `phone_id` / `phone_snapshot` persistence wiring bağlandı; UI display, import/export, backup/restore ve schema migration bu sprintte yapılmadı.
- Sprint 9.3C kararı: Historical phone context display/read model katmanında `phone_snapshot` önceliklidir. Call history eski kayıtlar için legacy contacted phone fallback'i kullanır. Reminder list current phone lookup yapmaz; yalnızca `reminder.phone_snapshot` varsa context alanlarını doldurur. UI display, popup, alarm reader, import/export, backup/restore ve schema migration bu sprintte yapılmadı.
- Sprint 9.3D-1 kararı: Phone context UI display önce düşük riskli call history alanında başlatıldı. Sağ kişi kartındaki iletişim geçmişi `phone_context_label` / `phone_context_number` alanlarını gösterir. Reminder list UI tablo/CSS/mobil riskleri nedeniyle ayrı sprintte ele alınacak. Büyük çoklu telefon sağ kişi kartı, Excel'den çoklu telefon import ve `+N numara daha göster` roadmap'te ayrı kalır.
- Sprint 9.3D-2 kararı: Reminder list UI'da yeni kolon eklenmeden mevcut Telefon 1 kolonu operasyonel olarak `Aranacak telefon` haline getirildi. Context varsa `phone_context_label` / `phone_context_number` gösterilir; context yoksa `phone_1` fallback'i korunur. Telefon 2 kolonu, CSS, reader/model, popup/alarm, import/export, backup/restore ve schema migration kapsam dışı tutuldu.
- Sprint 9.3E-1 kararı: Sağ kişi kartı 3+ telefon UI'dan önce `StudentListRow` read model hazırlığı yapıldı. `phones`, `visible_phones` ve `hidden_phone_count` alanları eklendi; ilk görünüm veri katmanında 3 telefon taşır. UI henüz bağlanmadı; Sprint 9.3E-2'ye bırakıldı.
- Sprint 9.3E-2 kararı: Sağ kişi kartında Telefon 1 / Telefon 2 mevcut aksiyonlu kartlar olarak korundu; Telefon 3+ readonly / görüntüleme-only gösterildi. `visible_phones`, `phones` ve `hidden_phone_count` UI'da kullanıldı; `+N numara daha göster` / `Daha az göster` davranışı eklendi. Telefon 3+ aksiyon/persistence, call log seçimi, shortcut, validation, CSS, reader/model, import/export ve backup/restore kapsam dışı bırakıldı.
- Sprint 9.3F-1 kararı: Telefon 3+ yalnızca call save selection için bağlandı. Seçilen Telefon 3+ `contacted_phone_id` olarak call log kaydına gider; `callLogWriter` ve schema/storage değiştirilmedi. Telefon 3+ yanlış/kullanılmıyor ve son görüşülen status aksiyonları ayrı discovery gerektirir.
- Excel çoklu telefon import ayrı discovery/implementation gerektirir.
- Sprint 9.3G-2 kararı: Excel İçe Aktar ekranında progressive disclosure yapıldı. Kolon Eşleştirme, Hatalar ve Uyarılar listeleri uzun olduğunda kademeli gösterilir. Import engine, writer, simulation, mapping definitions, schema/storage, Telefon 3-10, AD/SOYAD, Anne/Baba ve Mahalle kapsam dışı bırakıldı.
- Sprint 9.3G-4 kararı: Çoklu telefon import mapping/simulation uygulandı. Telefon 3-10 mapping key'leri ve simulation `phones[]` modeli hazırlandı; gerçek DB yazımı/import writer ayrı sprintte kalır. Writer sprinti yapılmadan Telefon 3-10 tam import edildi kabul edilmemelidir.
- Sprint 9.3G-5 kararı: Çoklu telefon import writer/persistence uygulandı. Writer `row.phones[]` varsa Telefon 1-10 phone records yazar; yoksa `phone_1` / `phone_2` fallback korunur. Schema/storage/version, export/report/backup, Ad/Soyad, Anne/Baba ve Mahalle kapsam dışıdır. Dar pilot eşiği için Telefon 3-10 import hattı mapping/simulation + writer/persistence olarak tamamlanmış kabul edilebilir; pilot readiness için manual QA ve kırıcı risk kontrolü ayrıca yapılmalıdır.
- Akıllı Operasyon Yardımcıları gelecekte park edilmiş fazdır; ilk yaklaşım dış AI değil, offline/rule-based/testable helper olmalıdır. Mevcut 9.3G hattını dağıtmayacaktır.

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
- Çoklu Telefon Mimarisi değişecekse: `docs/MULTI_PHONE_ARCHITECTURE_PLAN.md`
- Phone context persistence değişecekse: `docs/CHECKPOINT_SPRINT_9_3B_2.md`
- Phone context read/display model değişecekse: `docs/CHECKPOINT_SPRINT_9_3C.md`
- Call history phone context UI display değişecekse: `docs/CHECKPOINT_SPRINT_9_3D_1.md`
- Reminder list phone context UI display değişecekse: `docs/CHECKPOINT_SPRINT_9_3D_2.md`
- Right card multi-phone read model değişecekse: `docs/CHECKPOINT_SPRINT_9_3E_1.md`
- Right card multi-phone UI display değişecekse: `docs/CHECKPOINT_SPRINT_9_3E_2.md`
- Import UI progressive disclosure değişecekse: `docs/CHECKPOINT_SPRINT_9_3G_2.md`
- Multi-phone import mapping/simulation değişecekse: `docs/CHECKPOINT_SPRINT_9_3G_4.md`
- Multi-phone import writer/persistence değişecekse: `docs/CHECKPOINT_SPRINT_9_3G_5.md`
- Anne/Baba/Mahalle/İlçe import modeli veya Mahalle/İlçe sonraki slice değişecekse: `docs/CHECKPOINT_PARENT_LOCATION_IMPORT_DECISION.md`
- Çok eski sprint bağlamı gerekiyorsa ilgili eski checkpoint okunur; tüm checkpoint’ler gereksiz yere okutulmaz.

## 14. Güncel Çalışma Bilgisi

Bu bölüm sık değişir ve dosyanın en altında kalmalıdır.

- Güncel branch: `sprint-9-2-multi-phone-architecture-plan`
- Bu branch’in amacı: Çoklu telefon mimarisi ana hattında phone context persistence, read/display model, call history UI display, reminder list UI display, right card multi-phone read model, right card multi-phone readonly UI display, Telefon 3+ call save selection, import UI progressive disclosure, multi-phone import mapping/simulation ve multi-phone import writer/persistence katmanlarını taşımak.
- Önceki çalışma branch’i: `sprint-9-3b-1-phone-context-model-helpers`
- Güncel release candidate commit’i: `12062f0 docs: add sprint 9.1 checkpoint and update pilot findings`
- Güncel Pilot v1.0 release candidate commit’i: `113b44b docs: add pilot release candidate review`
- Pilot v1.0 release commit’i: `b59e3af docs: add pilot v1 release notes`
- Son bilinen fix commit’i: `7cdea84 fix: reduce reminders page outer scroll`
- Son feature commit’i: `76a3b3a feat: add multi-phone core compatibility helpers`
- Son phone context feature commit’i: `de15abf feat: add phone context model helpers for calls and reminders`
- Son phone context persistence commit’i: `595979d feat: wire phone context persistence for calls and reminders`
- Son phone context read model commit’i: `34d06bd feat: add phone context read models`
- Son phone context UI commit’i: `23342b3 feat: show phone context in call history`
- Son reminder list phone context UI commit’i: `dba4cc6 feat: show phone context in reminders list`
- Son right card multi-phone read model commit’i: `8043507 feat: add multi-phone read model for student cards`
- Son right card multi-phone UI commit’i: `67812cb feat: show extra phones in right card`
- Son Telefon 3+ call save selection commit’i: `121f175 feat: select extra phone for call save`
- Son import UI progressive disclosure commit’i: `0c40524 feat: collapse long import review lists`
- Son multi-phone import simulation commit’i: `2e1bbff feat: add multi-phone import simulation`
- Son multi-phone import writer commit’i: `34ec8d5 feat: persist multi-phone import records`
- Son bilinen dokümantasyon commit’i: `92dfb4e docs: close import ad soyad composition checkpoint`
- Sonraki zorunlu aşama: Parent / Location Import Product Decision docs-only commit/push. Sonra Mahalle/İlçe import için ayrı ve küçük implementation/discovery değerlendirilebilir; Anne/Baba aynı sprintte ele alınmamalı ve önce guardian/contact model kararı verilmelidir.

## 15. Codex Standart Başlangıç Talimatı

Yeni Codex oturumlarında mümkünse şu kısa başlangıç kullanılacak:

“Önce `docs/PROJECT_MEMORY.md`, `docs/FILE_MAP.md` ve `docs/DECISIONS.md` oku. Sadece bu işle ilgili checkpoint gerekiyorsa oku. Kod yazmadan önce plan çıkar. Onay almadan dosya değiştirme, paket kurma, commit/push yapma.”

## Latest Checkpoint Closure - Communication History Soft Delete

- Implementation commit: `a9e891c feat: soft delete communication history`.
- Communication history entries can be deleted safely with soft delete; hard delete is not used.
- Soft delete sets `call_logs.deleted_at` and `call_logs.updated_at`.
- Deleted call logs no longer appear in communication history; phone-card `Son sonuc` falls back through the existing active `call_logs` read model.
- After soft delete, student summary is recomputed from remaining non-deleted `call_logs`: `last_call_result`, `last_contacted_at`, `last_contacted_phone_id`.
- If no active call logs remain, `last_call_result` becomes `not_called`, `last_contacted_at` becomes `null`, and `last_contacted_phone_id` becomes `null`.
- `PhoneRecord` is not mutated: `phone_status`, `is_wrong`, and `is_valid` remain unchanged.
- Call logs with `created_reminder_id` or `created_appointment_id` are blocked from deletion in this MVP; no reminder/appointment cascade delete is performed.
- No schema migration, import/export format change, backup/restore behavior change, edit/correction feature, or undo feature was added.
- Manual localhost QA passed after implementation.

## Latest Checkpoint Closure - Import AD/SOYAD Composition

- Implementation commit: `ee7b12f feat: compose student names from ad soyad import`.
- Import now supports student name composition from separate `AD` and `SOYAD` columns.
- `student_first_name` and `student_last_name` are import/simulation-only fields; persistent student model remains `student_full_name`.
- No DB/schema migration, export/report change, backup/restore change, guardian model change, Anne/Baba implementation, or Mahalle/Ilce implementation was added.
- Full-name column wins over `AD` / `SOYAD` and emits a warning when split columns are also present.
- Only `AD` imports with a warning; only `SOYAD` is blocked because surname alone is not a safe student name.
- `Veli Adi`, `Anne adi`, and `Baba Adi` are not treated as student `AD` / `SOYAD`.
- Telefon 1-10 slot fidelity remains preserved.
- Test/build passed: `npm.cmd test -- --run` PASS, 45 test files / 294 tests; `npm.cmd run build` PASS with known Vite chunk-size warning.
- Manual localhost QA passed for QA-1 through QA-7 AD/SOYAD composition scenarios.

## Latest Product Decision - Parent / Location Import

- Base commit for the decision checkpoint: `92dfb4e docs: close import ad soyad composition checkpoint`.
- Anne/Baba/Mahalle/Ilce import discovery concluded `NEEDS HUMAN DECISION`; no code, schema, test, import writer, export, or backup change was made during discovery.
- Anne/Baba will not be implemented in the next small import slice. Anne/Baba must not be used as a student name source and must not overwrite `Veli Ad Soyad`.
- Anne/Baba requires a later guardian/contact model decision because current UI, export, and list readers still assume a primary/single `guardian_full_name` for "Veli".
- Mahalle/Ilce is the smaller next implementation candidate, but it should not be stored in `general_note` as a note-prefix hack. If implemented, it likely needs explicit optional student fields and an accepted decision for export/search/backup/restore impact.
- AD/SOYAD composition and Telefon 1-10 mapping/import/export behavior must remain untouched in any parent/location follow-up.
- `dev-server.log` is an untracked local runtime file and must not be staged, committed, deleted, or documented as a product artifact.
- New checkpoint: `docs/CHECKPOINT_PARENT_LOCATION_IMPORT_DECISION.md`.

## Latest Checkpoint Closure - Mahalle / Ilce Import Pilot

- Implementation commit: `70705af feat: import student location fields`.
- Previous decision checkpoint: `1d2f28f docs: record parent location import decision`.
- Import now supports optional student location fields: `Mahalle` -> `neighborhood`, `Ilce` / `Ilce` -> `district`.
- `StudentRecord` has optional non-indexed `neighborhood?: string | null` and `district?: string | null` fields.
- Dexie schema version was not changed; `src/db/schema.ts` and `src/db/db.ts` were not changed.
- Mahalle/Ilce is not stored in `general_note`.
- Import simulation preview carries Mahalle/Ilce values and writer persists them on the student record.
- Student list/read model carries Mahalle/Ilce and the right drawer shows a small read-only `Mahalle / Ilce` line when location data exists.
- Empty Mahalle/Ilce does not block import; only Mahalle or only Ilce is allowed.
- AD/SOYAD composition, Telefon 1-10 slot fidelity, and Veli/Anne/Baba student-name safety behavior remain unchanged.
- Anne/Baba guardian/contact model remains deferred.
- Export/report/search/filter/backup/restore behavior was not expanded in this sprint.
- Test/build passed: `npm.cmd test -- --run` PASS, 45 test files / 299 tests; `npm.cmd run build` PASS with known Vite chunk-size warning.
- Manual QA passed for QA-1 through QA-8 Mahalle/Ilce scenarios and console/runtime checks.
- New checkpoint: `docs/CHECKPOINT_IMPORT_STUDENT_LOCATION_FIELDS.md`.

## Latest Checkpoint Closure - Playwright Import E2E Smoke Pilot

- Implementation commit: `6a02ef4 feat: add import e2e smoke test`.
- Previous checkpoint: `9ef99c2 docs: close student location import checkpoint`.
- First browser-level automated QA pilot was added with Playwright.
- New npm script: `qa:import:e2e`, run with `npm.cmd run qa:import:e2e`.
- The first E2E smoke test is `e2e/import-smoke.spec.ts`; it uses Chromium through `playwright.config.ts`.
- The smoke test generates a temporary `.xlsx` at runtime through `e2e/helpers/importFixtures.ts` using the existing `xlsx` dependency. Binary Excel fixtures are not committed.
- Covered smoke flow: upload Excel in the real browser UI, AD/SOYAD composition, Mahalle/Ilce import, phone import, manual `Veli Adi` -> `Veli Ad Soyad` mapping, completing import, opening Aday Listesi, selecting the imported student, checking right drawer values, and guarding against page/console errors.
- This is not the full import regression matrix. Telefon 1-10 full slot fidelity, Telefon 10-only, empty/partial Mahalle/Ilce, Anne/Baba safety, export E2E, backup/restore E2E, CI integration, and broad `data-testid` coverage remain out of scope.
- Validation passed: `npm.cmd run qa:import:e2e` PASS, 1 test; `npm.cmd test -- --run` PASS, 45 test files / 299 tests; `npm.cmd run build` PASS with known Vite chunk-size warning.
- `test-results/` is ignored and must not be committed. `dev-server.log` remains local/untracked and must not be staged.
- Chromium may need a one-time local install on a new machine: `npx.cmd playwright install chromium`.
- New checkpoint: `docs/CHECKPOINT_PLAYWRIGHT_IMPORT_E2E_SMOKE.md`.

## Latest Checkpoint Closure - Playwright Import Regression Matrix Phase 2A

- Implementation commit: `0980cdb feat: add import e2e regression matrix`.
- Previous checkpoint: `90f70e3 docs: close import e2e smoke checkpoint`.
- The existing `npm.cmd run qa:import:e2e` command now runs the original smoke test and `e2e/import-regression.spec.ts`.
- Phase 2A adds three browser-level import regression scenarios: Telefon 1-10 values are preserved through import and right-drawer display, empty Mahalle/Ilce does not block import or render an empty location line, and Anne/Baba fields cannot create a student name when the required student name is missing.
- Runtime `.xlsx` files continue to be generated under Playwright output paths through the shared `e2e/helpers/importFixtures.ts` helper; binary fixtures are not committed.
- Playwright import E2E runs with one worker for local stability.
- Validation passed: `npm.cmd run qa:import:e2e` PASS, 4/4 Playwright tests; `npm.cmd test -- --run` PASS, 45 test files / 299 tests; `npm.cmd run build` PASS with known Vite chunk-size warning.
- No production `src/` behavior, schema, export, backup, or restore behavior changed.
- Telefon 10-only, only-Mahalle, only-Ilce, invalid/duplicate phone, duplicate import warning, export E2E, backup/restore E2E, CI integration, and broad `data-testid` coverage remain later candidates.
- `test-results/` remains ignored. `dev-server.log` remains local/untracked and must not be staged or committed.
- New checkpoint: `docs/CHECKPOINT_PLAYWRIGHT_IMPORT_REGRESSION_PHASE_2A.md`.
