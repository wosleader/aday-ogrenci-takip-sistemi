<!-- Son güncelleme: Sprint 9.3C Phone Context Display / Read Layer | Branch: sprint-9-2-multi-phone-architecture-plan -->

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

Son doğrulandı: Sprint 8.8

- `src/features/students/StudentsPage.tsx`
  Aday Listesi, filtreler, sağ drawer, görüşme akışı ve Sprint 8.8 itibarıyla kompakt/açılır-kapanır kısayol yardım barını içerir.
- `src/features/students/services/studentListReader.ts`
  Aday liste satırlarını okuma, filtreleme, Sınıf/Şube helper’ları.
- `src/features/students/services/studentPhoneStatus.ts`
  Telefon 1/2 son görüşülen ve yanlış numara durumları.
- `src/features/students/services/phoneCompatibility.ts`
  Çoklu telefon core helper’ları; legacy Telefon 1/2 alanlarından dinamik telefon listesi üretme, phones list’ten Telefon 1/2 compatibility slotları okuma, Telefon N / ilişki etiketi ve phone snapshot üretme.
- `src/features/students/services/studentDelete.ts`
  Tek aday ve ilişkili kayıtları güvenli silme.

## 4. Calls / Call Workflow

Son doğrulandı: Sprint 9.3C Phone Context Display / Read Layer

- `src/features/calls/CallPage.tsx`
  Eski/yardımcı call route sayfası; ana operasyon Aday Listesi + sağ drawer üzerinden yürür.
- `src/features/calls/services/callSaveValidation.ts`
  Görüşme kaydetme validasyonları, uyarı ve onay mantığı.
- `src/features/calls/services/callLogWriter.ts`
  `writeCallLog` transaction akışı; `call_logs`, student son durum, telefon güncellemeleri ve pending reminder create/update davranışını yönetir. Sprint 9.3B-2 itibarıyla call log ve pending reminder kayıtlarına `phone_id` / `phone_snapshot` persistence wiring yapar; legacy contacted phone alanlarını korur.
- `src/features/calls/services/callLogPhoneContext.ts`
  Call log telefon bağlamı display/fallback helper’ları; `phone_snapshot` varsa Telefon N / ilişki etiketi label’ı üretir, eski kayıtlarda güvenli fallback döner.
- `src/features/calls/services/callHistoryReader.ts`
  Sağ drawer iletişim geçmişi için call history read model üretir; Sprint 9.3C itibarıyla phone snapshot-first context display alanlarını ve legacy fallback'i taşır.

## 5. Reminders

Son doğrulandı: Sprint 8.2

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

Son doğrulandı: Sprint 9.0

- `src/features/imports/ImportPage.tsx`
  İçe aktarma ekranı; kolon eşleştirme, simülasyon, duplicate kontrolü, import log ve pilot öncesi kullanıcı dostu metinleri içerir.
- `src/features/imports/services/excelReader.ts`
  Excel dosyası ve worksheet okuma.
- `src/features/imports/services/columnDefinitions.ts`
  Import alanları, kolon label/alias tanımları.
- `src/features/imports/services/columnMatching.ts`
  Başlık satırı/kolon eşleştirme ve yazım hatası yakalama.
- `src/features/imports/services/importSimulation.ts`
  Import önizleme, uyarılar ve simülasyon özeti.
- `src/features/imports/services/importWriter.ts`
  Gerçek IndexedDB import transaction akışı.
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
  Import servis tipleri.

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

Son doğrulandı: Sprint 9.3C Phone Context Display / Read Layer

- `tests/exports/*`
  Detaylı export, özet export, export data reader ve Excel exporter davranışları.
- `tests/settings/*`
  Veri yönetimi, backup/restore, SettingsPage UI davranışları ve restore uyarı/başarı bildirimleri.
- `tests/students/*`
  Aday listesi okuma/filtreleme, Sınıf/Şube helper’ları, telefon status, aday silme.
- `tests/students/phoneCompatibility.test.ts`
  Çoklu telefon core helper’larını, legacy Telefon 1/2 uyumluluğunu, Telefon N etiketlerini, relation label display metnini, phone snapshot üretimini ve helper düzeyi tekilleştirmeyi test eder.
- `tests/students/StudentsPageShortcutHelp.test.tsx`
  Aday Listesi alt kısayol yardım barının kompakt/açık görünümünü, Göster/Gizle davranışını ve localStorage toleransını test eder.
- `tests/reminders/*`
  Reminder alarm, dismissed store, popup view model ve reminder settings.
- `tests/reminders/reminderPhoneContext.test.ts`
  Reminder telefon bağlamı helper’ını, eski kayıt fallback davranışını ve Türkçe relation label çıktısını test eder.
- `tests/reminders/reminderListReader.test.ts`
  Reminder list phone context snapshot/null fallback ve mevcut `phone_1` / `phone_2` regression davranışlarını test eder.
- `tests/reports/*`
  Günlük rapor metrikleri, call result kırılımları, tarih filtresi, son görüşmeler ve Raporlar sayfası smoke davranışları.
- `tests/shortcuts/*`
  Kısayol registry, Türkçe label, çakışma/3 tuşu/riskli tuş validasyonları.
- `tests/app/*`
  AppLayout, global arama, route değişiminde dropdown kapanma, üst bar ve bildirim çanı davranışları.
- `tests/imports/*`
  Excel okuma, kolon eşleştirme, import simülasyonu, duplicate guard, import writer, log export.
- `tests/calls/*`
  Call writer, call history ve call save validation.
- `tests/calls/callHistoryReader.test.ts`
  Call history phone context snapshot, legacy fallback ve null context davranışını test eder.
- `tests/calls/callLogWriter.test.ts`
  `writeCallLog` transaction davranışını; call log/reminder phone context persistence, legacy contacted phone alanları, null fallback, existing pending reminder update ve Türkçe relation label korunumunu test eder.
- `tests/calls/callLogPhoneContext.test.ts`
  Call log telefon bağlamı helper’ını, eski kayıt fallback davranışını, legacy contacted phone label fallback’ini ve Türkçe relation label çıktısını test eder.
- `tests/utils/*`
  Telefon ve metin normalizasyon yardımcıları.

## 12. Docs / Prompts

Son doğrulandı: Sprint 9.1

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
