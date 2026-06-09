<!-- Son guncelleme: Parent/Location Import Product Decision | Branch: sprint-9-2-multi-phone-architecture-plan -->

# FILE_MAP — Aday Öğrenci Takip Sistemi

Bu dosya “hangi dosya ne işe yarar?” haritasıdır.

## 1. App / Layout

Son doğrulandı: Sprint 9.3A Çoklu Telefon Core Model

- `src/app/App.tsx`
  Uygulama kök bileşeni.
- `src/app/AppLayout.tsx`
  Üst bar, sol menü, global aday araması, bağlantı durumu, bildirim çanı, genel layout, route değişiminde dropdown kapanma davranışı ve sol menü L/H navigasyon kısayolları.
- `src/app/router.tsx`
  Route tanımları ve sayfa yerleşimi.
- `src/styles/global.css`
  Genel uygulama stilleri, responsive polish kuralları, kısayol yardım barı görünümü, sağ drawer düşük riskli genişlik hafifletmesi ve Raporlar/Hatırlatmalar/Export/Settings polish stillerini içerir.

## 2. Database / Backup

Son doğrulandı: Sprint 8.2

- `src/db/db.ts`
  Dexie veritabanı sınıfı ve IndexedDB tabloları.
- `src/db/schema.ts`
  Dexie schema/version tanımları.
- `src/db/seed.ts`
  Varsayılan seed verileri.
- `src/db/backup.ts`
  Tam Sistem Yedeği snapshot, metadata, validate, preview ve restore çekirdeği.

## 3. Students / Candidate List

Son doğrulandı: Phone-Level Outcome Read Model Pilot

- `src/features/students/StudentsPage.tsx`
  Aday Listesi, filtreler, sağ drawer, görüşme akışı, kompakt/açılır-kapanır kısayol yardım barı, call history UI ve sağ kişi kartı telefon alanını içerir. Sprint 9.3D-1 itibarıyla call history `phone_context_label` / `phone_context_number` display alanlarını gösterir. Sprint 9.3E-2 itibarıyla Telefon 1 / Telefon 2 aksiyonlu kartlarını korur, Telefon 3+ için readonly görünüm sunar, `+N numara daha göster` / `Daha az göster` interaction'ını yönetir ve `visible_phones` / `phones` / `hidden_phone_count` alanlarını tüketir. Sprint 9.3F-1 itibarıyla Telefon 3+ için call save selection, selected call phone state, `saveCallAndGoNext` içinde `contacted_phone_id` hesaplaması ve legacy Telefon 1/2 fallback davranışını taşır. Phone-Level Outcome Read Model Pilot itibarıyla Telefon 1/2 ve Telefon 3+ kartlarında `call_logs` kaynaklı read-only `Son sonuç` göstergesini render eder; schema, import/export ve `phone_status` semantiğini değiştirmez.
- `src/features/students/services/studentListReader.ts`
  Aday liste satırlarını okuma, filtreleme, Sınıf/Şube helper’ları ve `StudentListRow` read model üretimi. Legacy `phone_1` / `phone_2` / `phone_count` alanlarını korur; Sprint 9.3E-1 itibarıyla sağ kişi kartı çoklu telefon hazırlığı için `phones`, `visible_phones` ve `hidden_phone_count` alanlarını taşır.
- `src/features/students/services/studentPhoneStatus.ts`
  Telefon 1/2 son görüşülen ve yanlış numara durumları.
- `src/features/students/services/phoneCompatibility.ts`
  Çoklu telefon core helper’ları; legacy Telefon 1/2 alanlarından dinamik telefon listesi üretme, phones list’ten Telefon 1/2 compatibility slotları okuma, Telefon N / ilişki etiketi ve phone snapshot üretme.
- `src/features/students/services/studentDelete.ts`
  Tek aday ve ilişkili kayıtları güvenli silme.

## 4. Calls / Call Workflow

Son doğrulandı: Phone-Level Outcome Read Model Pilot

- `src/features/calls/CallPage.tsx`
  Eski/yardımcı call route sayfası; ana operasyon Aday Listesi + sağ drawer üzerinden yürür.
- `src/features/calls/services/callSaveValidation.ts`
  Görüşme kaydetme validasyonları, uyarı ve onay mantığı. Sprint 9.3F-1 itibarıyla görüşülen telefon seçimi için Telefon 1/2'ye özel olmayan genel validation mesajını ve çoklu telefon listesiyle uyumlu seçim kontrolünü taşır.
- `src/features/calls/services/callLogWriter.ts`
  `writeCallLog` transaction akışı; `call_logs`, student son durum, telefon güncellemeleri ve pending reminder create/update davranışını yönetir. Sprint 9.3B-2 itibarıyla call log ve pending reminder kayıtlarına `phone_id` / `phone_snapshot` persistence wiring yapar; legacy contacted phone alanlarını korur.
- `src/features/calls/services/callLogPhoneContext.ts`
  Call log telefon bağlamı display/fallback helper’ları; `phone_snapshot` varsa Telefon N / ilişki etiketi label’ı üretir, eski kayıtlarda güvenli fallback döner.
- `src/features/calls/services/callHistoryReader.ts`
  Sağ drawer iletişim geçmişi için call history read model üretir; Sprint 9.3C itibarıyla phone snapshot-first context display alanlarını ve legacy fallback'i taşır. Phone-Level Outcome Read Model Pilot itibarıyla `phone_id`, `phone_snapshot.phone_id` ve `contacted_phone_id` alanlarını read model'e taşır; sağ kart telefon bazlı son sonuç lookup'ı bu alanları kullanır.

## 5. Reminders

Son doğrulandı: Sprint 9.3E-1 Right Card Multi-Phone Read Model

- `src/features/reminders/RemindersPage.tsx`
  Reminder list UI render eder; Sprint 9.3D-2 itibarıyla `Aranacak telefon` kolonunda `phone_context_label` / `phone_context_number` gösterir, context yoksa `phone_1` fallback'ini korur ve Telefon 2 kolonunu aynen tutar.
- `src/features/reminders/services/reminderAlarmReader.ts`
  Due/overdue reminder okuma ve alarm davranışı.
- `src/features/reminders/services/reminderListReader.ts`
  Hatırlatmalar sayfası için reminder list read model üretir; Sprint 9.3C itibarıyla reminder phone snapshot context display alanlarını taşır ve mevcut `phone_1` / `phone_2` davranışını korur.
- `src/features/reminders/services/reminderDismissalStore.ts`
  Kapatılan reminder popup ve çan paneli geçmişi.
- `src/features/reminders/services/reminderPopupViewModel.ts`
  Popup gösterim modeli ve kullanıcıya görünen reminder metinleri.
- `src/features/reminders/services/reminderSettings.ts`
  Reminder popup/ses ayarları.
- `src/features/reminders/services/reminderPhoneContext.ts`
  Reminder telefon bağlamı display/fallback helper’ı; optional `phone_snapshot` alanını UI’ya bağlamadan okunabilir label’a dönüştürür.

## 6. Shortcuts

Son doğrulandı: Sprint 8.2

- `src/features/shortcuts/services/shortcutRegistry.ts`
  Varsayılan kısayollar, Türkçe label, validasyon ve action mapping.
- `src/features/shortcuts/services/shortcutSettings.ts`
  Kullanıcı kısayol ayarları ve IndexedDB kalıcılığı.
- `src/domain/constants/shortcuts.ts`
  Kısayol sabitleri.

## 7. Import

Son doğrulandı: Sprint 9.3G-5 Multi-Phone Import Writer / Persistence

- `src/features/imports/ImportPage.tsx`
  İçe aktarma ekranı; kolon eşleştirme, simülasyon, duplicate kontrolü, import log ve pilot öncesi kullanıcı dostu metinleri içerir. Sprint 9.3G-2 itibarıyla Kolon Eşleştirme, Hatalar ve Uyarılar listelerinde progressive disclosure local state'ini, `+N kolon/hata/uyarı daha göster` ve `Daha az göster` davranışlarını taşır. Sprint 9.3G-4'te değişmedi; dropdown `COLUMN_DEFINITIONS` üzerinden beslendiği için Telefon 3-10 seçenekleri ImportPage değişmeden görünür.
- `src/features/imports/services/excelReader.ts`
  Excel dosyası ve worksheet okuma.
- `src/features/imports/services/columnDefinitions.ts`
  Import alanları, kolon label/alias tanımları. Sprint 9.3G-4 itibarıyla Telefon 3-10 mapping definitions ve `gsm3` / `gsm 3` / `telefon 3` / `tel 3` / `phone 3` pattern'lerini 10'a kadar taşır; mevcut Telefon / 2. Telefon korunur.
- `src/features/imports/services/columnMatching.ts`
  Başlık satırı/kolon eşleştirme ve yazım hatası yakalama.
- `src/features/imports/services/importSimulation.ts`
  Import önizleme, uyarılar ve simülasyon özeti. Sprint 9.3G-4 itibarıyla `phones[]` üretimi, empty phone skip, row-level duplicate dedupe, invalid phone metadata ve duplicate warning kontrolünün tüm `phones[]` üzerinden çalışması davranışlarını taşır.
- `src/features/imports/services/importWriter.ts`
  Gerçek IndexedDB import transaction akışı. Sprint 9.3G-5 itibarıyla `row.phones[]` tüketir, `phone_1` / `phone_2` fallback'ini korur, Telefon 1-10 `PhoneRecord` persistence yapar, `phone_label` / `reference_label` / `priority` / `source_column` / `original_phone_value` / `is_valid` metadata'sını taşır, invalid non-empty phone persistence kararını uygular, `search_text` içine tüm `row.phones[]` numaralarını ekler ve dedupe / empty skip / `is_primary` davranışını yönetir.
- `src/features/imports/services/importDuplicateGuard.ts`
  Aynı dosya/sheet/fingerprint şüphesini yakalama.
- `src/features/imports/services/logExport.ts`
  Import log ve teknik destek çıktıları.
- `src/features/imports/services/dateNormalization.ts`
  Tekrar arama tarih/saat normalizasyonu.
- `src/features/imports/services/importBackup.ts`
  Import öncesi güvenlik yedeği yardımı.
- `src/features/imports/services/excelColumns.ts`
  Excel kolon harfi/indeks yardımcıları.
- `src/features/imports/services/types.ts`
  Import servis tipleri. Sprint 9.3G-4 itibarıyla `ImportPhoneFieldKey`, `SimulatedImportPhone`, `SimulatedImportRow.phones[]` ve `phone_1` / `phone_2` backward compatibility alanlarını içerir.

## 8. Export

Son doğrulandı: Sprint 9.1

- `src/features/exports/ExportPage.tsx`
  Detaylı Excel Export ve Özet Görüşme Raporu üretir; Excel’in Tam Sistem Yedeği yerine geçmediğini kullanıcıya açıklar, export kapsam açıklamaları ve özet kart metinleri kullanıcı dostu hale getirilmiştir.
- `src/features/exports/services/exportDataReader.ts`
  Export dataset okuma.
- `src/features/exports/services/exportMapper.ts`
  Detaylı export ve Özet Görüşme Raporu kolon/satır mapping.
- `src/features/exports/services/excelExporter.ts`
  Workbook, dosya adı ve download.
- `src/features/exports/services/exportSelection.ts`
  Filtrelenmiş liste snapshot.
- `src/features/exports/services/exportTypes.ts`
  Export veri tipleri ve snapshot key sabitleri.

## 9. Reports

Son doğrulandı: Sprint 8.9

- `src/features/reports/ReportsPage.tsx`
  Günlük raporlar sayfası; seçilen gün diliyle günlük özet, son görüşmeler ve açık hatırlatma özeti gösterir.
- `src/features/reports/services/dailyReportReader.ts`
  Seçilen gün için `call_logs` üzerinden günlük operasyon özetini üretir; `call_time` birincil, `created_at` fallback kullanır.

## 10. Settings / Data Management

Son doğrulandı: Sprint 8.9

- `src/features/settings/SettingsPage.tsx`
  Ayarlar ekranı; kısayollar, sol menü kısayol bilgilendirmesi, kısayol aksiyon buton polish’i, hatırlatma ayarları, veri yönetimi, Tam Sistem Yedeği/Geri Yükleme ve görünür restore uyarı/başarı bildirimlerini içerir.
- `src/features/settings/services/dataManagement.ts`
  Tam sistem yedeği indirme, analiz ve restore servisleri.
- `src/domain/constants/settings.ts`
  Backup/app settings sabitleri.

## 11. Tests

Son doğrulandı: Sprint 9.3G-5 Multi-Phone Import Writer / Persistence

- `tests/exports/*`
  Detaylı export, özet export, export data reader ve Excel exporter davranışları.
- `tests/settings/*`
  Veri yönetimi, backup/restore, SettingsPage UI davranışları ve restore uyarı/başarı bildirimleri.
- `tests/students/*`
  Aday listesi okuma/filtreleme, Sınıf/Şube helper’ları, telefon status, aday silme.
- `tests/students/studentListReader.test.ts`
  Student list reader davranışlarını test eder; Sprint 9.3E-1 itibarıyla 5 telefonlu adayda `phones`, ilk 3 `visible_phones`, `hidden_phone_count`, yanlış/geçersiz telefonların listede kalması ve telefonsuz aday fallback davranışlarını doğrular.
- `tests/students/phoneCompatibility.test.ts`
  Çoklu telefon core helper’larını, legacy Telefon 1/2 uyumluluğunu, Telefon N etiketlerini, relation label display metnini, phone snapshot üretimini ve helper düzeyi tekilleştirmeyi test eder.
- `tests/students/StudentsPageShortcutHelp.test.tsx`
  Aday Listesi alt kısayol yardım barının kompakt/açık görünümünü, Göster/Gizle davranışını ve localStorage toleransını test eder.
- `tests/students/StudentsPageCallHistory.test.tsx`
  Call history UI'da phone context label/number görünürlüğünü ve no-context fallback davranışını test eder.
- `tests/students/StudentsPageMultiPhone.test.tsx`
  Sağ kişi kartında 5 telefonlu aday için Telefon 3+ readonly görünümü, expand/collapse davranışı, `hidden_phone_count` sıfır durumu, telefonsuz aday fallback'i ve Telefon 3+ için aksiyon butonu gösterilmemesini test eder.
- `tests/students/StudentsPagePhoneSelection.test.tsx`
  Telefon 3+ seçimini, seçili Telefon 3+'ün call log context'e gitmesini, seçili aday değişince selected phone state reset davranışını ve Telefon 3+ status aksiyonlarının olmamasını test eder. Phone-Level Outcome Read Model Pilot itibarıyla call log olmayan telefonda `Son sonuç: Yok`, Telefon 1/2 ve Telefon 3+ için son call result label'ı ve aynı telefonda çoklu call log varsa en güncel sonucun gösterilmesini doğrular.
- `tests/reminders/*`
  Reminder alarm, dismissed store, popup view model ve reminder settings.
- `tests/reminders/reminderPhoneContext.test.ts`
  Reminder telefon bağlamı helper’ını, eski kayıt fallback davranışını ve Türkçe relation label çıktısını test eder.
- `tests/reminders/reminderListReader.test.ts`
  Reminder list phone context snapshot/null fallback ve mevcut `phone_1` / `phone_2` regression davranışlarını test eder.
- `tests/reminders/RemindersPage.test.tsx`
  Reminder list UI'da phone context label/number görünürlüğünü, `phone_1` fallback'ini, `phone_2` davranışını ve `Aranacak telefon` başlığını test eder.
- `tests/reports/*`
  Günlük rapor metrikleri, call result kırılımları, tarih filtresi, son görüşmeler ve Raporlar sayfası smoke davranışları.
- `tests/shortcuts/*`
  Kısayol registry, Türkçe label, çakışma/3 tuşu/riskli tuş validasyonları.
- `tests/app/*`
  AppLayout, global arama, route değişiminde dropdown kapanma, üst bar ve bildirim çanı davranışları.
- `tests/imports/*`
  Excel okuma, kolon eşleştirme, import simülasyonu, duplicate guard, import writer, log export ve import UI progressive disclosure davranışları.
- `tests/imports/columnMatching.test.ts`
  Telefon 3-10 mapping key ve alias davranışlarını test eder; mevcut Telefon / 2. Telefon davranışının korunmasını doğrular.
- `tests/imports/importSimulation.test.ts`
  `phones[]` simulation üretimini, `phone_1` / `phone_2` compatibility davranışını, boş telefonların atlanmasını, aynı satır duplicate tekilleştirmesini, invalid phone metadata davranışını ve duplicate warning kontrolünün tüm phone alanlarını kapsamasını test eder.
- `tests/imports/importWriter.test.ts`
  Telefon 3-10 writer/persistence, metadata persistence, duplicate/empty/invalid/search_text/rollback davranışları ve Telefon 1/2 backward compatibility testlerini içerir.
- `tests/imports/ImportPageProgressiveDisclosure.test.tsx`
  Uzun kolon listesi kademeli gösterimini, `mapping_required` / önemli kolonların dar görünümde kalmasını, hata listesi expand/collapse davranışını ve uyarı listesi expand/collapse davranışını test eder.
- `tests/calls/*`
  Call writer, call history ve call save validation.
- `tests/calls/callSaveValidation.test.ts`
  Görüşme kaydetme validation davranışını, çoklu telefon için genel görüşülen telefon seçimi mesajını ve mevcut call result/reminder/appointment uyarılarını test eder.
- `tests/calls/callHistoryReader.test.ts`
  Call history phone context snapshot, legacy fallback ve null context davranışını test eder.
- `tests/calls/callLogWriter.test.ts`
  `writeCallLog` transaction davranışını; call log/reminder phone context persistence, legacy contacted phone alanları, null fallback, existing pending reminder update ve Türkçe relation label korunumunu test eder.
- `tests/calls/callLogPhoneContext.test.ts`
  Call log telefon bağlamı helper’ını, eski kayıt fallback davranışını, legacy contacted phone label fallback’ini ve Türkçe relation label çıktısını test eder.
- `tests/utils/*`
  Telefon ve metin normalizasyon yardımcıları.

## 12. Docs / Prompts

Son doğrulandı: Sprint 9.3G-5 Multi-Phone Import Writer / Persistence

- `docs/PROJECT_MEMORY.md`
  Codex için güncel kısa proje hafızası.
- `docs/FILE_MAP.md`
  Modül/dosya haritası.
- `docs/DECISIONS.md`
  Kritik ürün kararlarının kısa karar günlüğü.
- `docs/PILOT_READINESS_CHECKLIST.md`
  Pilot öncesi manuel test checklist’i.
- `docs/USER_GUIDE.md`
  Son kullanıcıya yönelik sade kullanım kitapçığı.
- `docs/PILOT_MANUAL_TEST_CHECKLIST.md`
  Pilot öncesi manuel test ve karar checklist’i.
- `docs/CHECKPOINT_SPRINT_7.md`
  Tam Sistem Yedeği / Geri Yükleme checkpoint’i.
- `docs/CHECKPOINT_SPRINT_6_2.md`
  Özet Görüşme Raporu checkpoint’i.
- `docs/CHECKPOINT_SPRINT_6_1.md`
  Kısayollar, global arama, bildirim paneli checkpoint’i.
- `docs/CHECKPOINT_SPRINT_8_5.md`
  Hatırlatmalar sayfası checkpoint’i.
- `docs/CHECKPOINT_SPRINT_8_6.md`
  Raporlar / Günlük Özet Sayfası checkpoint’i.
- `docs/CHECKPOINT_SPRINT_8_7.md`
  Responsive Layout Polish checkpoint’i.
- `docs/CHECKPOINT_SPRINT_8_8.md`
  Shortcut Help Bar Polish checkpoint’i.
- `docs/CHECKPOINT_SPRINT_8_9.md`
  Pilot Fix / Release Polish checkpoint’i.
- `docs/CHECKPOINT_SPRINT_9_1.md`
  Pilot Test Findings / Final Fixes checkpoint’i.
- `docs/CHECKPOINT_SPRINT_9_3A.md`
  Sprint 9.3A Çoklu Telefon Core Model + Compatibility kapanış dokümanı; core model/helper kapsamını, test/build sonucunu ve sonraki sprint kararını içerir.
- `docs/CHECKPOINT_SPRINT_9_3B_1.md`
  Sprint 9.3B-1 Call Log / Reminder Phone Context Model + Helpers kapanış dokümanı; optional phone context model alanlarını, helper/test kapsamını ve sonraki persistence wiring sprintini içerir.
- `docs/CHECKPOINT_SPRINT_9_3B_2.md`
  Sprint 9.3B-2 Phone Context Persistence Wiring kapanış dokümanı; `writeCallLog` içinde call log ve pending reminder phone context persistence kapsamını, test/build sonucunu ve sonraki display/read layer discovery kararını içerir.
- `docs/CHECKPOINT_SPRINT_9_3C.md`
  Sprint 9.3C Phone Context Display / Read Layer kapanış dokümanı; call history ve reminder list reader/view-model phone context alanlarını, snapshot-first fallback kararını ve test/build sonucunu içerir.
- `docs/CHECKPOINT_SPRINT_9_3D_1.md`
  Sprint 9.3D-1 Call History Phone Context UI Display kapanış dokümanı; sağ kişi kartındaki iletişim geçmişinde phone context gösterimini, odaklı UI testini ve sonraki reminder list UI kararını içerir.
- `docs/CHECKPOINT_SPRINT_9_3D_2.md`
  Sprint 9.3D-2 Reminder List Phone Context UI Display kapanış dokümanı; Hatırlatmalar listesinde `Aranacak telefon` context-aware gösterimini, odaklı UI testini ve sonraki çoklu telefon roadmap kararını içerir.
- `docs/CHECKPOINT_SPRINT_9_3E_1.md`
  Sprint 9.3E-1 Right Card Multi-Phone Read Model kapanış dokümanı; `StudentListRow` çoklu telefon read model alanlarını, ilk 3/kalan sayı davranışını, geriye dönük uyumluluğu ve kapsam dışı UI/import/export/backup kararlarını içerir.
- `docs/CHECKPOINT_SPRINT_9_3E_2.md`
  Sprint 9.3E-2 Right Card Multi-Phone UI Display kapanış dokümanı; sağ kişi kartında Telefon 3+ readonly görünümü, `+N numara daha göster` / `Daha az göster` davranışı, Telefon 1/2 aksiyonlarının korunması, test/build sonucu ve Telefon 3+ aksiyon/persistence kapsam dışı kararlarını içerir.
- `docs/CHECKPOINT_SPRINT_9_3F_1.md`
  Sprint 9.3F-1 Phone 3+ Call Save Selection kapanış checkpoint'i; Telefon 3+ call save selection, `selectedCallPhoneId`, `contacted_phone_id` hesaplaması, validation genel mesajı, test/build sonucu ve Telefon 3+ status aksiyonlarının kapsam dışı kaldığını içerir.
- `docs/CHECKPOINT_SPRINT_9_3G_2.md`
  Sprint 9.3G-2 Import UI Progressive Disclosure kapanış checkpoint'i; Excel İçe Aktar ekranında kolon eşleştirme, hata ve uyarı listelerinin kademeli gösterimini, UI-only kapsamı, test/build sonucu ve import data-model işlerinin kapsam dışı kaldığını içerir.
- `docs/CHECKPOINT_SPRINT_9_3G_4.md`
  Sprint 9.3G-4 Multi-Phone Import Mapping / Simulation kapanış checkpoint'i; Telefon 3-10 mapping key'lerini, `phones[]` simulation modelini, `phone_1` / `phone_2` compatibility kararını ve import writer/persistence kapsam dışı notunu içerir.
- `docs/CHECKPOINT_SPRINT_9_3G_5.md`
  Sprint 9.3G-5 Multi-Phone Import Writer / Persistence kapanış checkpoint'i; Telefon 3-10 gerçek DB writer/persistence davranışını, metadata/search_text/invalid/dedupe/primary kararlarını, test/build sonucunu ve export/report/backup kapsam dışı notunu içerir.
- `docs/CHECKPOINT_PARENT_LOCATION_IMPORT_DECISION.md`
  Anne/Baba/Mahalle/İlçe import discovery sonrası alınan product/technical decision checkpoint'i. Anne/Baba'nın sonraki küçük import slice'a dahil edilmeyeceğini, Anne/Baba'nın öğrenci adı veya Veli override kaynağı olmayacağını, Mahalle/İlçe'nin ayrı ve daha küçük aday olarak ele alınacağını ve `general_note` hack'i yapılmayacağını kaydeder.
- `docs/PILOT_RELEASE_CANDIDATE_REVIEW.md`
  Pilot kullanıma aday sürüm değerlendirmesi, test/build özeti, kapatılan pilot bulguları ve pilot başlatma kararı.
- `docs/PILOT_V1_RELEASE_NOTES.md`
  Pilot v1.0 release notları; hazır özellikler, test durumu, bilinen sınırlamalar ve pilot başlatma şartları.
- `docs/PILOT_RUN_REPORT.md`
  Pilot v1.0 gerçek kullanım deneme raporu; yapılan pilot akışını, başarılı kontrolleri ve sonraki aksiyonları içerir.
- `docs/PILOT_FINDINGS.md`
  Manuel ve gerçek kullanım pilot bulgularını, PF-001’den PF-012’ye kadar çözülen UI/UX polish notlarını ve sonraki aksiyonları içerir.
- `docs/MULTI_PHONE_ARCHITECTURE_PLAN.md`
  Çoklu Telefon Mimarisi için ürün, UX, veri modeli, import/export, reminder, call log, backup/restore ve responsive etkilerini açıklayan plan dokümanı.
- `docs/UI_BASELINE_BEFORE_FIGMA.md`
  Figma/Stitch öncesi çalışan UI baseline.
- `docs/mockups/AOTS_Mockup_v2.html`
  Mockup referansı.
- `docs/mockups/AOTS_v2_Tasarim_Rehberi.md`
  Tasarım rehberi.
- `.prompts/codex-start.md`
  Yeni oturum başlangıç promptu.
- `.prompts/feature-plan.md`
  Kod yazmadan önce plan çıkarmak için standart prompt.
- `.prompts/feature-apply.md`
  Onaylanan planı uygulamak için standart prompt.
- `.prompts/sprint-close.md`
  Sprint kapanış kontrol ve dokümantasyon tutarlılığı promptu.

## Latest File Map Addendum - Communication History Soft Delete

Son dogrulandi: Communication History Soft Delete + Student Summary Recompute Pilot

- `src/features/calls/services/callLogDeletion.ts`
  Iletisim gecmisi kayitlari icin soft delete servisi. `call_logs.deleted_at` / `updated_at` set eder, hard delete kullanmaz, reminder/appointment baglantili kayitlari bloklar ve ogrenci son gorusme ozetini kalan aktif `call_logs` kayitlarindan yeniden hesaplar. `PhoneRecord` mutate etmez.
- `src/features/students/StudentsPage.tsx`
  Sag drawer iletisim gecmisi satirlarinda kucuk silme aksiyonunu ve onay modalini render eder. Basarili soft delete sonrasi mevcut live query/read model akisi ile history ve telefon karti `Son sonuc` guncellenir.
- `tests/calls/callLogDeletion.test.ts`
  Soft delete, student summary recompute, tum aktif loglar silinince safe clear, reminder/appointment bloklama, PhoneRecord degismeme ve snapshot fallback davranislarini test eder.
- `tests/students/StudentsPageCallHistory.test.tsx`
  Iletisim gecmisi UI'da delete button, confirmation required, cancel ve confirm sonrasi kaydin gorunur history'den kalkmasi davranislarini test eder.

## Latest File Map Addendum - Import AD/SOYAD Composition

Son dogrulandi: Import AD/SOYAD Composition Pilot

- `src/features/imports/services/types.ts`
  Import/simulation-only `student_first_name` ve `student_last_name` alanlarini tanimlar. Bunlar `StudentRecord` kalici model alanlari degildir.
- `src/features/imports/services/columnDefinitions.ts`
  `AD`, `SOYAD`, `Ogrenci Adi`, `Ogrenci Soyadi` aliaslarini import mapping hedeflerine baglar. Veli/Anne/Baba adlari student AD/SOYAD olarak otomatik eslesmez.
- `src/features/imports/services/importSimulation.ts`
  Full-name column kazanir; full-name yoksa `AD + SOYAD` mevcut `student_full_name` sonucuna compose edilir. Only AD warning ile kabul edilir; only SOYAD bloklanir.
- `src/features/imports/ImportPage.tsx`
  AD/SOYAD mapping satirlarini import review'da oncelikli gorunur tutar. Runtime/import writer davranisini degistirmez.
- `tests/imports/columnMatching.test.ts`
  AD/SOYAD aliaslarini ve Veli/Anne/Baba guvenlik eslesmeme davranisini test eder.
- `tests/imports/importNameComposition.test.ts`
  AD/SOYAD composition, full-name wins, only AD warning, only SOYAD block, missing-name fallback, writer persistence ve Telefon 1-10 slot fidelity regression testlerini icerir.

## Latest File Map Addendum - Parent / Location Import Decision

Son dogrulandi: Parent/Location Import Product Decision

- `src/domain/models/student.ts`
  Discovery icin kritik model kaynagi. Kalici ogrenci modelinde `student_full_name` vardir; persistent `student_first_name` / `student_last_name`, Anne/Baba, Mahalle/Ilce, district/neighborhood/address alanlari yoktur.
- `src/domain/models/guardian.ts`
  Guardian kayitlari `guardian_full_name`, optional `relation_type` ve `note` tasir. Mevcut import/list/export akisi pratikte birincil `Veli Ad Soyad` varsayimina dayanir; Anne/Baba icin ileride guardian/contact model karari gerekir.
- `src/features/imports/services/columnDefinitions.ts`
  AD/SOYAD aliaslari ve mevcut import target listesi burada tanimlidir. Anne/Baba/Mahalle/Ilce icin yeni mapping kararindan once bu dosyada yeni hedef eklenmemelidir.
- `src/features/imports/services/importSimulation.ts`
  AD/SOYAD composition ve required name davranisi burada yurutulur. Anne/Baba ogrenci adi kaynagi olmayacak sekilde korunmalidir.
- `src/features/imports/services/importWriter.ts`
  Kalici import yazimi burada yapilir. Parent/location decision uygulanmadan Anne/Baba veya Mahalle/Ilce persistence eklenmemelidir.
- `src/features/exports/services/exportMapper.ts`
  Detayli export kolonlari burada uretilir. Mahalle/Ilce veya Anne/Baba export etkisi ayrica kabul edilmeden degistirilmemelidir.
- `docs/CHECKPOINT_PARENT_LOCATION_IMPORT_DECISION.md`
  Anne/Baba'nin ertelenmesi, Mahalle/Ilce'nin daha kucuk aday olarak ayrilmasi, no note-prefix hack karari ve sonraki implementation sinirlari icin resmi checkpoint.
