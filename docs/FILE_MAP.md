<!-- Son güncelleme: Sprint 8.2 | Branch: sprint-8-2-project-memory-docs -->

# FILE_MAP — Aday Öğrenci Takip Sistemi

Bu dosya “hangi dosya ne işe yarar?” haritasıdır.
Bu dosya yön bulma haritasıdır. Nihai doğruluk için ilgili kaynak dosya okunmalıdır. Refactor sonrası bu dosya güncellenmelidir.

## 1. App / Layout

Son doğrulandı: Sprint 8.2

- `src/app/App.tsx`
  Uygulama kök bileşeni.
- `src/app/AppLayout.tsx`
  Üst bar, sol menü, global aday araması, bağlantı durumu, bildirim çanı, genel layout.
- `src/app/router.tsx`
  Route tanımları ve sayfa yerleşimi.
- `src/styles/global.css`
  Genel uygulama stilleri, filtre barları, popup/toast/drawer gibi UI sınıfları.

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

Son doğrulandı: Sprint 8.2

- `src/features/students/StudentsPage.tsx`
  Aday Listesi, filtreler, sağ drawer, arama operasyonu UI.
- `src/features/students/services/studentListReader.ts`
  Aday liste satırlarını okuma, filtreleme, Sınıf/Şube helper’ları.
- `src/features/students/services/studentPhoneStatus.ts`
  Telefon 1/2 son görüşülen ve yanlış numara durumları.
- `src/features/students/services/studentDelete.ts`
  Tek aday ve ilişkili kayıtları güvenli silme.

## 4. Calls / Call Workflow

Son doğrulandı: Sprint 8.2

- `src/features/calls/CallPage.tsx`
  Eski/yardımcı call route sayfası; ana operasyon Aday Listesi + sağ drawer üzerinden yürür.
- `src/features/calls/services/callSaveValidation.ts`
  Görüşme kaydetme validasyonları, uyarı ve onay mantığı.
- `src/features/calls/services/callLogWriter.ts`
  `call_logs`, student son durum, telefon ve reminder güncellemeleri.
- `src/features/calls/services/callHistoryReader.ts`
  Sağ drawer iletişim geçmişi için call log okuma.

## 5. Reminders

Son doğrulandı: Sprint 8.2

- `src/features/reminders/services/reminderAlarmReader.ts`
  Due/overdue reminder okuma ve alarm davranışı.
- `src/features/reminders/services/reminderDismissalStore.ts`
  Kapatılan reminder popup ve çan paneli geçmişi.
- `src/features/reminders/services/reminderPopupViewModel.ts`
  Popup gösterim modeli ve kullanıcıya görünen reminder metinleri.
- `src/features/reminders/services/reminderSettings.ts`
  Reminder popup/ses ayarları.

## 6. Shortcuts

Son doğrulandı: Sprint 8.2

- `src/features/shortcuts/services/shortcutRegistry.ts`
  Varsayılan kısayollar, Türkçe label, validasyon ve action mapping.
- `src/features/shortcuts/services/shortcutSettings.ts`
  Kullanıcı kısayol ayarları ve IndexedDB kalıcılığı.
- `src/domain/constants/shortcuts.ts`
  Kısayol sabitleri.

## 7. Import

Son doğrulandı: Sprint 8.2

- `src/features/imports/ImportPage.tsx`
  Excel import UI, kolon eşleştirme, duplicate modal, import onayı.
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

Son doğrulandı: Sprint 8.2

- `src/features/exports/ExportPage.tsx`
  Export UI, export tipi seçimi, tüm/filtrelenmiş liste kapsamı.
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

## 9. Settings / Data Management

Son doğrulandı: Sprint 8.2

- `src/features/settings/SettingsPage.tsx`
  Ayarlar sekmeleri, Klavye Kısayolları, Hatırlatmalar, Veri Yönetimi.
- `src/features/settings/services/dataManagement.ts`
  Tam sistem yedeği indirme, analiz ve restore servisleri.
- `src/domain/constants/settings.ts`
  Backup/app settings sabitleri.

## 10. Tests

Son doğrulandı: Sprint 8.2

- `tests/exports/*`
  Detaylı export, özet export, export data reader ve Excel exporter davranışları.
- `tests/settings/*`
  Veri yönetimi, backup/restore ve SettingsPage UI davranışları.
- `tests/students/*`
  Aday listesi okuma/filtreleme, Sınıf/Şube helper’ları, telefon status, aday silme.
- `tests/reminders/*`
  Reminder alarm, dismissed store, popup view model ve reminder settings.
- `tests/shortcuts/*`
  Kısayol registry, Türkçe label, çakışma/3 tuşu/riskli tuş validasyonları.
- `tests/app/*`
  AppLayout, global arama, üst bar ve bildirim çanı davranışları.
- `tests/imports/*`
  Excel okuma, kolon eşleştirme, import simülasyonu, duplicate guard, import writer, log export.
- `tests/calls/*`
  Call writer, call history ve call save validation.
- `tests/utils/*`
  Telefon ve metin normalizasyon yardımcıları.

## 11. Docs / Prompts

Son doğrulandı: Sprint 8.2

- `docs/PROJECT_MEMORY.md`
  Codex için güncel kısa proje hafızası.
- `docs/FILE_MAP.md`
  Modül/dosya haritası.
- `docs/DECISIONS.md`
  Kritik ürün kararlarının kısa karar günlüğü.
- `docs/PILOT_READINESS_CHECKLIST.md`
  Pilot öncesi manuel test checklist’i.
- `docs/CHECKPOINT_SPRINT_7.md`
  Tam Sistem Yedeği / Geri Yükleme checkpoint’i.
- `docs/CHECKPOINT_SPRINT_6_2.md`
  Özet Görüşme Raporu checkpoint’i.
- `docs/CHECKPOINT_SPRINT_6_1.md`
  Kısayollar, global arama, bildirim paneli checkpoint’i.
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
