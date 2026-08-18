<!-- Son guncelleme: Appointment Model C+ Checkpoint B | Branch: sprint-9-2-multi-phone-architecture-plan -->

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
  Genel uygulama stilleri, responsive polish kuralları, kısayol yardım barı görünümü, sağ drawer düşük riskli genişlik hafifletmesi ve Raporlar/Hatırlatmalar/Export/Settings polish stillerini içerir. `68d2899` itibarıyla Reporting V2 için ayrı `reporting-v2-*` sınıflarıyla özet kart grid'i, filtre hizası, tablo/panel düzeni ve günlük trend/kampanya kırılımı yerleşimi polish edilir.

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
  Aday Listesi, filtreler, sağ drawer, görüşme akışı, kompakt/açılır-kapanır kısayol yardım barı, call history UI ve sağ kişi kartı telefon alanını içerir. Sprint 9.3D-1 itibarıyla call history `phone_context_label` / `phone_context_number` display alanlarını gösterir. Sprint 9.3E-2 itibarıyla Telefon 1 / Telefon 2 aksiyonlu kartlarını korur, Telefon 3+ için readonly görünüm sunar, `+N numara daha göster` / `Daha az göster` interaction'ını yönetir ve `visible_phones` / `phones` / `hidden_phone_count` alanlarını tüketir. Sprint 9.3F-1 itibarıyla Telefon 3+ için call save selection, selected call phone state, `saveCallAndGoNext` içinde `contacted_phone_id` hesaplaması ve legacy Telefon 1/2 fallback davranışını taşır. Phone-Level Outcome Read Model Pilot itibarıyla Telefon 1/2 ve Telefon 3+ kartlarında `call_logs` kaynaklı read-only `Son sonuç` göstergesini render eder; schema, import/export ve `phone_status` semantiğini değiştirmez. `8f1f613` itibarıyla bağlantısız call history kayıtları için düzeltme/düzenle modalını ve `İletişim kaydını geçersiz say / sil` / `Geçersiz say / sil` soft delete aksiyon dilini sunar. `39e3840` itibarıyla pending reminder bağlantılı history satırında icon-only `Hatırlatmayı tamamla` aksiyonunu ve confirmation modalını render eder. `e15a051` itibarıyla yalnız canonical owner satırında `Hatırlatmayı iptal et` aksiyonunu, optional nedenli confirmation modalını ve `Vazgeç` ikincil eylemini render eder; shared/tarihsel satırlar aksiyon almaz.
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
  Görüşme kaydetme validasyonları, uyarı ve onay mantığı. Sprint 9.3F-1 itibarıyla görüşülen telefon seçimi için Telefon 1/2'ye özel olmayan genel validation mesajını ve çoklu telefon listesiyle uyumlu seçim kontrolünü taşır. `8bf7cb2` itibarıyla `wrong_number` için seçilebilir telefon varsa telefon seçimi zorunlu kalır; adayda telefon olup tüm telefonlar invalid/wrong ise genel `wrong_number` kaydına null phone context ile izin verir. `e16c6a3` ile appointment tarih/saatini Istanbul instant'ı olarak doğrular ve `<= now` değerini reject eder.
- `src/features/calls/services/callLogWriter.ts`
  `writeCallLog` transaction akışı; `call_logs`, student son durum, telefon güncellemeleri ve pending reminder create/update davranışını yönetir. Sprint 9.3B-2 itibarıyla call log ve pending reminder kayıtlarına `phone_id` / `phone_snapshot` persistence wiring yapar; legacy contacted phone alanlarını korur. `8bf7cb2` edge-case'inde tüm telefonlar invalid/wrong ise genel `wrong_number` kaydını telefon bağlamı olmadan yazabilir. `e16c6a3` appointment branch'inde gerçek AppointmentRecord, reciprocal owner link, embedded guardian-message state ve `appointment_create` audit'ini tek transaction içinde yazar; ReminderRecord oluşturmaz.
- `src/features/calls/services/callLogCorrection.ts`
  Bağlantısız iletişim geçmişi kayıtlarını düzeltir. Görüşme durumu, tarih/saat, not ve telefon bağlamını günceller; bağlı reminder/appointment kayıtlarını bloklar; PhoneRecord mutate etmeden öğrenci özetini aktif call log kayıtlarından yeniden hesaplatır. `e16c6a3` ile generic correction non-appointment call log'u appointment'a çeviremez ve pending modern appointment owner bütünlüğünü fail-closed doğrular.
- `src/features/calls/services/callLogDeletion.ts`
  İletişim geçmişi soft delete / geçersiz sayma akışı. `call_logs.deleted_at` / `updated_at` set eder, hard delete yapmaz ve öğrenci özetini aktif call log kayıtlarından yeniden hesaplayan ortak helper'ı sağlar. `e16c6a3` ile pending modern appointment forward owner linkini de fail-closed doğrular; missing/conflicting/duplicate/student-mismatch owner silinemez.
- `src/features/appointments/services/guardianMessageDueTime.ts`
  Appointment form tarih/saatini Europe/Istanbul anlamıyla ISO instant'a çevirir; embedded guardian-message due timestamp'ini 24/22 saat ve 19.00 cap kuralıyla hesaplar. Browser local timezone'a göre Date setter kullanmaz.
- `src/features/appointments/services/appointmentOwnerIntegrity.ts`
  Soft-delete olmayan canonical `pending` AppointmentRecord'ların forward `call_log_id` owner bağını doğrular. Missing/conflicting reciprocal, duplicate pending owner ve student mismatch durumlarında mutation fail-closed olur; legacy ve terminal appointment için owner tahmini üretmez.
- `src/features/calls/services/callLogPhoneContext.ts`
  Call log telefon bağlamı display/fallback helper’ları; `phone_snapshot` varsa Telefon N / ilişki etiketi label’ı üretir, eski kayıtlarda güvenli fallback döner.
- `src/features/calls/services/callHistoryReader.ts`
  Sağ drawer iletişim geçmişi için call history read model üretir; Sprint 9.3C itibarıyla phone snapshot-first context display alanlarını ve legacy fallback'i taşır. Phone-Level Outcome Read Model Pilot itibarıyla `phone_id`, `phone_snapshot.phone_id` ve `contacted_phone_id` alanlarını read model'e taşır; sağ kart telefon bazlı son sonuç lookup'ı bu alanları kullanır. `39e3840` itibarıyla linked reminder read model fields ve `canCompleteLinkedReminder` bilgisini taşır. `7636b57` itibarıyla `canCompleteLinkedReminder` yalnız owner/current linked reminder history satırında true olur. `e15a051` itibarıyla `canCancelLinkedReminder` canonical `reminder.call_log_id` owner'ını çözer; aynı reminder ID'sini taşıyan shared/tarihsel call log satırlarını cancellation owner saymaz ve duplicate pending owner durumunda fail-closed döner.

## 5. Reminders

Son doğrulandı: Sprint 9.3E-1 Right Card Multi-Phone Read Model

- `src/features/reminders/RemindersPage.tsx`
  Reminder list UI render eder; Sprint 9.3D-2 itibarıyla `Aranacak telefon` kolonunda `phone_context_label` / `phone_context_number` gösterir, context yoksa `phone_1` fallback'ini korur ve Telefon 2 kolonunu aynen tutar.
- `src/features/reminders/services/reminderAlarmReader.ts`
  Due/overdue reminder okuma ve alarm davranışı.
- `src/features/reminders/services/reminderListReader.ts`
  Hatırlatmalar sayfası için reminder list read model üretir; Sprint 9.3C itibarıyla reminder phone snapshot context display alanlarını taşır ve mevcut `phone_1` / `phone_2` davranışını korur.
- `src/features/reminders/services/reminderLifecycle.ts`
  Pending reminder kayıtlarını completed statüsüne alan lifecycle helper'ını taşır; linked reminder quick complete akışı bu helper üzerinden çalışır. `e15a051` ile pending linked call reminder cancellation, owner resolver, `pending → cancelled` transaction'ı ve `pending_reminder_cancel` audit append işlemini taşır; call log, student ve appointment mutate edilmez.
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
  Import alanları, kolon label/alias tanımları. Sprint 9.3G-4 itibarıyla Telefon 3-10 mapping definitions ve `gsm3` / `gsm 3` / `telefon 3` / `tel 3` / `phone 3` pattern'lerini 10'a kadar taşır; mevcut Telefon / 2. Telefon korunur. `18f47c9` itibarıyla `VELI ADI` / `Veli Adı` alias'ı mevcut `guardian_full_name` / `Veli Ad Soyad` alanına eşleşir.
- `src/features/imports/services/columnMatching.ts`
  Başlık satırı/kolon eşleştirme ve yazım hatası yakalama.
- `src/features/imports/services/importSimulation.ts`
  Import önizleme, uyarılar ve simülasyon özeti. Sprint 9.3G-4 itibarıyla `phones[]` üretimi, empty phone skip, row-level duplicate dedupe, invalid phone metadata ve duplicate warning kontrolünün tüm `phones[]` üzerinden çalışması davranışlarını taşır.
- `src/features/imports/services/importWriter.ts`
  Gerçek IndexedDB import transaction akışı. Sprint 9.3G-5 itibarıyla `row.phones[]` tüketir, `phone_1` / `phone_2` fallback'ini korur, Telefon 1-10 `PhoneRecord` persistence yapar, `phone_label` / `reference_label` / `priority` / `source_column` / `original_phone_value` / `is_valid` metadata'sını taşır, invalid non-empty phone persistence kararını uygular, `search_text` içine tüm `row.phones[]` numaralarını ekler ve dedupe / empty skip / `is_primary` davranışını yönetir. `82036c0` itibarıyla `row.campaign_name` değerini campaign lookup/create ve `student.campaign_id` persistence için kullanır; boş kampanyada default `Diğer` davranışı korunur.
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

Son doğrulandı: Adaptive Summary Export Columns

- `src/features/exports/ExportPage.tsx`
  Detaylı Excel Export ve Özet Görüşme Raporu üretir; Excel’in Tam Sistem Yedeği yerine geçmediğini kullanıcıya açıklar, export kapsam açıklamaları ve özet kart metinleri kullanıcı dostu hale getirilmiştir.
- `src/features/exports/services/exportDataReader.ts`
  Export dataset okuma.
- `src/features/exports/services/exportMapper.ts`
  Detaylı export ve Özet Görüşme Raporu kolon/satır mapping. Adaptive summary diliminde canonical summary rows, `SummaryColumnPlan`, slot-faithful `phones[]` mapping ve fail-fast plan/sheet doğrulaması burada uygulanır.
- `src/features/exports/services/excelExporter.ts`
  Workbook, dosya adı ve download.
- `src/features/exports/services/exportSelection.ts`
  Filtrelenmiş liste snapshot.
- `src/features/exports/services/exportTypes.ts`
  Export veri tipleri ve snapshot key sabitleri.

## 9. Reports

Son doğrulandı: Reporting V2 Summary MVP

- `src/features/reports/ReportsPage.tsx`
  Günlük raporlar sayfası; seçilen gün diliyle günlük özet, son görüşmeler ve açık hatırlatma özeti gösterir. `13c53e5` itibarıyla Reporting V2 read-only yönetici özeti, tarih aralığı, kampanya filtresi, özet metrik kartları, görüşme sonucu dağılımı, kampanya kırılımı ve günlük trend tablolarını render eder. `68d2899` itibarıyla Reporting V2 alanı ayrı profesyonel panel düzeni ve `reporting-v2-*` CSS sınıflarıyla polish edilir; günlük rapor alanı korunur.
- `src/features/reports/services/dailyReportReader.ts`
  Seçilen gün için `call_logs` üzerinden günlük operasyon özetini üretir; `call_time` birincil, `created_at` fallback kullanır.
- `src/features/reports/services/reportingV2Reader.ts`
  Reporting V2 read-only summary servisidir. Aktif `call_logs` kayıtlarını kullanır, `deleted_at` kayıtları dışlar, tarih aralığını `call_time` / `created_at` fallback ve local day sınırlarıyla hesaplar. `İşlem gören tekil aday`, result distribution, kampanya kırılımı ve günlük trend modellerini üretir. Kampanya kırılımı adayın güncel `students.campaign_id` değerine dayanır; call log campaign snapshot üretmez.

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
  Call history UI'da phone context label/number görünürlüğünü, no-context fallback davranışını, düzeltme/düzenle modalını, `Geçersiz Say / Sil` soft delete aksiyonunu, linked pending reminder için icon-only `Hatırlatmayı tamamla` ve owner-only `Hatırlatmayı iptal et` confirmation akışlarını test eder.
- `tests/students/StudentsPageMultiPhone.test.tsx`
  Sağ kişi kartında 5 telefonlu aday için Telefon 3+ readonly görünümü, expand/collapse davranışı, `hidden_phone_count` sıfır durumu, telefonsuz aday fallback'i ve Telefon 3+ için aksiyon butonu gösterilmemesini test eder.
- `tests/students/StudentsPagePhoneSelection.test.tsx`
  Telefon 3+ seçimini, seçili Telefon 3+'ün call log context'e gitmesini, seçili aday değişince selected phone state reset davranışını ve Telefon 3+ status aksiyonlarının olmamasını test eder. Phone-Level Outcome Read Model Pilot itibarıyla call log olmayan telefonda `Son sonuç: Yok`, Telefon 1/2 ve Telefon 3+ için son call result label'ı ve aynı telefonda çoklu call log varsa en güncel sonucun gösterilmesini doğrular.
- `tests/reminders/*`
  Reminder alarm, dismissed store, popup view model, reminder settings ve reminder lifecycle testleri.
- `tests/reminders/reminderLifecycle.test.ts`
  Pending reminder complete lifecycle helper'ını, cancellation transaction/audit rollback'ını, modern/legacy owner ve shared-reference fail-closed davranışlarını test eder.
- `tests/reminders/reminderPhoneContext.test.ts`
  Reminder telefon bağlamı helper’ını, eski kayıt fallback davranışını ve Türkçe relation label çıktısını test eder.
- `tests/reminders/reminderListReader.test.ts`
  Reminder list phone context snapshot/null fallback, mevcut `phone_1` / `phone_2` regression davranışı ve cancelled reminder'ın pending listeden dışlanmasını test eder.
- `tests/reminders/RemindersPage.test.tsx`
  Reminder list UI'da phone context label/number görünürlüğünü, `phone_1` fallback'ini, `phone_2` davranışını ve `Aranacak telefon` başlığını test eder.
- `tests/reports/*`
  Günlük rapor metrikleri, call result kırılımları, tarih filtresi, son görüşmeler, Raporlar sayfası smoke davranışları ve Reporting V2 read-only özet davranışları.
- `tests/reports/reportingV2Reader.test.ts`
  Reporting V2 servisinin tarih aralığı boundary davranışını, `deleted_at` filtrelemesini, campaign filter/kırılımını, unique student sayımını, daily trend üretimini ve call_result tabanlı özet metriklerini test eder.
- `tests/reports/ReportsPage.test.tsx`
  Raporlar sayfasında günlük raporun korunmasını, Reporting V2 özet alanını, tarih aralığı/kampanya filtresi UI'sını ve görünür metrik/tablo etiketlerini test eder.
- `tests/shortcuts/*`
  Kısayol registry, Türkçe label, çakışma/3 tuşu/riskli tuş validasyonları.
- `tests/app/*`
  AppLayout, global arama, route değişiminde dropdown kapanma, üst bar ve bildirim çanı davranışları.
- `tests/imports/*`
  Excel okuma, kolon eşleştirme, import simülasyonu, duplicate guard, import writer, log export ve import UI progressive disclosure davranışları.
- `tests/imports/columnMatching.test.ts`
  Telefon 3-10 mapping key ve alias davranışlarını test eder; mevcut Telefon / 2. Telefon davranışının korunmasını ve `Veli Adı` başlığının `guardian_full_name` alanına otomatik eşleşmesini doğrular.
- `tests/imports/importSimulation.test.ts`
  `phones[]` simulation üretimini, `phone_1` / `phone_2` compatibility davranışını, boş telefonların atlanmasını, aynı satır duplicate tekilleştirmesini, invalid phone metadata davranışını ve duplicate warning kontrolünün tüm phone alanlarını kapsamasını test eder.
- `tests/imports/importWriter.test.ts`
  Telefon 3-10 writer/persistence, metadata persistence, duplicate/empty/invalid/search_text/rollback davranışları ve Telefon 1/2 backward compatibility testlerini içerir. `82036c0` sonrası Kampanya persist, default `Diğer`, aynı import içinde duplicate campaign reuse ve farklı campaign senaryolarını kapsar.
- `tests/imports/ImportPageProgressiveDisclosure.test.tsx`
  Uzun kolon listesi kademeli gösterimini, `mapping_required` / önemli kolonların dar görünümde kalmasını, hata listesi expand/collapse davranışını, uyarı listesi expand/collapse davranışını ve `Veli Adı` auto guardian mapping akışını test eder.
- `tests/calls/*`
  Call writer, call history ve call save validation.
- `tests/calls/callLogCorrection.test.ts`
  Bağlantısız call log düzeltme, linked reminder/appointment bloklama, aktif call loglardan student summary recompute ve PhoneRecord mutate edilmeme davranışlarını test eder.
- `tests/calls/callLogDeletion.test.ts`
  Soft delete, student summary recompute, terminal status-aware linked reminder/appointment delete policy, PhoneRecord değişmeme ve snapshot fallback davranışlarını test eder.
- `tests/calls/callSaveValidation.test.ts`
  Görüşme kaydetme validation davranışını, çoklu telefon için genel görüşülen telefon seçimi mesajını ve mevcut call result/reminder/appointment uyarılarını test eder.
- `tests/calls/callHistoryReader.test.ts`
  Call history phone context snapshot, legacy fallback, null context, linked reminder read fields ve `canCompleteLinkedReminder` davranışını test eder.
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
- `docs/CHECKPOINT_IMPORT_STUDENT_LOCATION_FIELDS.md`
  Mahalle/Ilce Import Pilot kapanis checkpoint'i. `neighborhood` / `district` opsiyonel ogrenci alanlarini, schema version degismemesini, import preview/writer/read model/UI davranisini, test/build sonucunu ve Anne/Baba/export/search/backup kapsam disi kararlarini kaydeder.
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
  Iletisim gecmisi kayitlari icin soft delete servisi. `call_logs.deleted_at` / `updated_at` set eder, hard delete kullanmaz ve ogrenci son gorusme ozetini kalan aktif `call_logs` kayitlarindan yeniden hesaplar. `PhoneRecord` mutate etmez. Son linked policy: pending reminder bloklanir, completed/cancelled reminder soft delete edilebilir; pending/postponed appointment bloklanir, terminal appointment status'lari soft delete edilebilir.
- `src/features/students/StudentsPage.tsx`
  Sag drawer iletisim gecmisi satirlarinda kucuk silme aksiyonunu, linked pending reminder icin icon-only complete aksiyonunu ve onay modallarini render eder. Basarili soft delete sonrasi mevcut live query/read model akisi ile history ve telefon karti `Son sonuc` guncellenir.
- `tests/calls/callLogDeletion.test.ts`
  Soft delete, student summary recompute, tum aktif loglar silinince safe clear, terminal status-aware reminder/appointment policy, PhoneRecord degismeme ve snapshot fallback davranislarini test eder.
- `tests/students/StudentsPageCallHistory.test.tsx`
  Iletisim gecmisi UI'da delete button, confirmation required, cancel ve confirm sonrasi kaydin gorunur history'den kalkmasi davranislarini ve linked pending reminder quick complete akisini test eder.

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

## Latest File Map Addendum - Mahalle / Ilce Import Pilot

Son dogrulandi: Mahalle/Ilce Import Pilot

- `src/domain/models/student.ts`
  `StudentRecord` optional non-indexed `neighborhood?: string | null` ve `district?: string | null` alanlarini tasir. Dexie store index tanimi degismedi.
- `src/features/imports/services/types.ts`
  Import field key ve simulated row tipleri `neighborhood` / `district` alanlarini tasir.
- `src/features/imports/services/columnDefinitions.ts`
  `Mahalle`, `mah`, `mahalle adi`, `Ilce`, `ilce`, `ilce adi` gibi lokasyon aliaslarini import hedeflerine baglar.
- `src/features/imports/services/importSimulation.ts`
  Mahalle/Ilce degerlerini optional olarak preview/simulated row icine tasir; bos lokasyon import'u bloklamaz.
- `src/features/imports/services/importWriter.ts`
  Mahalle/Ilce degerlerini ogrenci kaydina persist eder; `general_note` icine yazmaz.
- `src/features/students/services/studentListReader.ts`
  Student list/read model Mahalle/Ilce alanlarini sag kart tarafina tasir; search/filter genisletmesi yapmaz.
- `src/features/students/StudentsPage.tsx`
  Sag drawer'da veri varsa kucuk read-only `Mahalle / Ilce` satirini gosterir.
- `tests/imports/columnMatching.test.ts`
  Mahalle/Ilce alias matching ve Anne/Baba guvenlik davranisini test eder.
- `tests/imports/importSimulation.test.ts`
  Mahalle/Ilce preview, optional bos alan ve import blocking regression davranislarini test eder.
- `tests/imports/importNameComposition.test.ts`
  AD/SOYAD composition ve Telefon 1-10 slot fidelity'nin Mahalle/Ilce ile korunmasini test eder.
- `tests/imports/importWriter.test.ts`
  Mahalle/Ilce persistence ve `general_note` kullanilmamasi davranisini test eder.

## Latest File Map Addendum - Playwright Import E2E Smoke Pilot

Son dogrulandi: Playwright Import E2E Smoke Pilot

- `package.json`
  `qa:import:e2e` script'ini tasir. Bu script ilk browser-level import smoke testini calistirir.
- `package-lock.json`
  `@playwright/test` dev dependency lock bilgisini tasir.
- `playwright.config.ts`
  Chromium-only Playwright config'i. Vite dev server'i `127.0.0.1:5173` uzerinden baslatir, failure durumunda trace/screenshot saklar ve download kabul eder.
- `e2e/import-smoke.spec.ts`
  Ilk dar browser-level import smoke testi. Runtime Excel upload, AD/SOYAD composition, Mahalle/Ilce, Telefon, manuel `Veli Adi` -> `Veli Ad Soyad` mapping, import tamamlama, Aday Listesi navigasyonu, right drawer dogrulamalari ve console/page error guard davranisini test eder.
- `e2e/helpers/importFixtures.ts`
  Smoke test icin temporary `.xlsx` workbook uretir. Mevcut `xlsx` dependency kullanilir; binary fixture dosyasi commit edilmez.
- `.gitignore`
  Playwright runtime output'u olan `test-results/` klasorunu ignore eder.
- `docs/CHECKPOINT_PLAYWRIGHT_IMPORT_E2E_SMOKE.md`
  Playwright Import E2E Smoke Pilot resmi kapanis checkpoint'i.
- `tests/students/studentListReader.test.ts`
  Student list read model'in lokasyon alanlarini tasidigini test eder.
- `docs/CHECKPOINT_IMPORT_STUDENT_LOCATION_FIELDS.md`
  Mahalle/Ilce Import Pilot resmi kapanis checkpoint'i.

## Latest File Map Addendum - Playwright Import Regression Matrix Phase 2A

Son dogrulandi: Playwright Import Regression Matrix Phase 2A

- `e2e/import-regression.spec.ts`
  Telefon 1-10 degerlerinin browser import akisi boyunca korunmasini, bos Mahalle/Ilce'nin importu engellememesini ve Anne/Baba alanlarinin ogrenci adi olusturmamasini kapsayan uc regression senaryosunu tasir.
- `e2e/helpers/importFixtures.ts`
  Smoke ve regression testleri icin ortak runtime `.xlsx` workbook ureticisini tasir. Dosyalar Playwright output dizininde uretilir; binary fixture commit edilmez.
- `e2e/import-smoke.spec.ts`
  Ilk mutlu yol browser smoke testi olarak korunur ve Phase 2A regression spec ile ayni komut altinda calisir.
- `package.json`
  `qa:import:e2e` script'i smoke ve regression spec dosyalarini birlikte calistirir.
- `playwright.config.ts`
  Chromium/Vite ayarlarina ek olarak import E2E testlerini stabil tutmak icin `workers: 1` kullanir.
- `docs/CHECKPOINT_PLAYWRIGHT_IMPORT_REGRESSION_PHASE_2A.md`
  Playwright Import Regression Matrix Phase 2A resmi kapanis checkpoint'i.

## Latest File Map Addendum - Guardian Contact Model Decision

Son dogrulandi: Anne/Baba Guardian/Contact Model uygulama oncesi karar checkpoint'i

- `src/domain/models/guardian.ts`
  Mevcut `GuardianRecord`, `student_id`, `guardian_full_name` ve optional `relation_type` alanlariyla Veli/Anne/Baba isim modelinin temelidir. Karar: yeni guardian table acilmadan `guardian`, `mother`, `father` semantigi kullanilacak; legacy `null` Veli sayilacak.
- `src/domain/models/phone.ts`
  `guardian_id`, `relation_label`, `source_column`, `reference_label` ve `priority` alanlari explicit Anne/Baba telefonlarini ileride temsil edebilir. Generic telefon kolonlarindan parent iliskisi tahmin edilmeyecek.
- `src/features/imports/services/columnDefinitions.ts`
  Gelecek names-only diliminde Anne/Baba isim aliaslari burada tanimlanacak. Telefon alias genisletmeleri ve riskli `No1/No2/Numara N` ailesi kontrollu testlerle ayri ele alinacak.
- `src/features/imports/services/importSimulation.ts`
  Gelecek dilimde Anne/Baba isimlerini simulation row'a tasiyacak ve student-name safety kuralini koruyacak. No-phone session setting daha sonraki ayri dilimdir.
- `src/features/imports/services/importWriter.ts`
  Bugun tek Veli kaydi olusturup telefonlari bu guardian'a baglar. Gelecek names-only dilimde mother/father guardian kayitlari ayrica olusturulacak; parent phone baglama bu dilime dahil olmayacak.
- `src/features/students/services/studentListReader.ts`
  Bugun ilk guardian kaydini Veli olarak secer. Gelecek names-only dilimde Veli/Anne/Baba kayitlarini relation type ile ayirmasi gerekir.
- `src/features/students/StudentsPage.tsx`
  Sag kartta yalnizca dolu `Veli Ad Soyad`, `Anne Adi`, `Baba Adi` satirlari gosterilecek; teknik unknown/no-phone placeholder metinleri eklenmeyecek.
- `src/features/exports/services/exportDataReader.ts`
  Bugun ogrenci basina ilk guardian'i alir. Anne/Baba export diliminde relation-aware bundle gerekir.
- `src/features/exports/services/exportMapper.ts`
  Gelecek export diliminde detayli ve ozet export Anne/Baba adlari ile Telefon 1-10'u kayipsiz tasiyacak. Parent telefonlari Telefon 1/2'ye kaydirilmayacak.
- `src/db/backup.ts`
  Mevcut `guardians` ve `phones` tablolarini zaten tam sistem yedegine dahil eder. Kod degisikligi gerekmese bile gelecek dilimde relation metadata roundtrip testi gerekir.
- `docs/CHECKPOINT_GUARDIAN_CONTACT_MODEL_DECISION.md`
  Guardian modeli, UI dili, mapping, parent phone slot kurali, export, backup, no-phone ayari ve implementation slicing kararlarinin resmi kaydi.

## Latest File Map Addendum - Guardian Parent Names Import Pilot

Son dogrulandi: Anne/Baba Names-Only Import and Drawer Pilot

- `src/domain/models/guardian.ts`
  `GuardianRelationType` ile `guardian`, `mother`, `father` iliski anahtarlarini tanimlar. Legacy `null` kayitlar reader tarafinda Veli kabul edilir.
- `src/features/imports/services/types.ts`
  Import/simulation-only `mother_full_name` ve `father_full_name` alanlarini tasir; `StudentRecord` uzerinde duplicate parent alani olusturmaz.
- `src/features/imports/services/columnDefinitions.ts`
  Anne Adi / Anne Ad Soyad / Anne Adi Soyadi ve Baba karsiliklarini ayri import hedeflerine baglar. Parent phone aliaslari bu dilimde yoktur.
- `src/features/imports/services/importSimulation.ts`
  Anne/Baba isimlerini simulated row ve preview'a tasir; bunlari ogrenci adi composition kaynagi yapmaz.
- `src/features/imports/services/importWriter.ts`
  Veli, Anne ve Baba icin mevcut `guardians` tablosunda ayri relation kayitlari olusturur. Generic telefonlari mother/father kayitlarina baglamaz.
- `src/features/students/services/studentListReader.ts`
  Ilk guardian'i otomatik Veli saymak yerine relation type'a gore Veli/Anne/Baba alanlarini ayirir; legacy `null` Veli uyumlulugunu korur.
- `src/features/students/StudentsPage.tsx`
  Sag drawer contact kartinda yalnizca dolu `Veli Ad Soyad`, `Anne Adi`, `Baba Adi` satirlarini kompakt gosterir.
- `tests/imports/columnMatching.test.ts`
  Parent-name alias matching ve student-name target ayrimini test eder.
- `tests/imports/importNameComposition.test.ts`
  Parent isimlerinin simulation'da tasinmasini ve ogrenci adi olmayan satiri olusturmamasini test eder.
- `tests/imports/importWriter.test.ts`
  Veli/Anne/Baba relation persistence ve generic telefonun parent'a atanmamasi davranisini test eder.
- `tests/students/studentListReader.test.ts`
  Relation-aware reader ile legacy null Veli davranisini test eder.
- `tests/students/StudentsPageMultiPhone.test.tsx`
  Drawer'da dolu parent satirlarini ve bos satirlarin gizlenmesini test eder.
- `docs/CHECKPOINT_GUARDIAN_PARENT_NAMES_IMPORT.md`
  Names-only implementation kapsami, validation sonucu, kalan riskler ve sonraki explicit parent-phone dilimi icin resmi kapanis kaydi.

## Latest File Map Addendum - Explicit Guardian Phone Relations Pilot

Son dogrulandi: Explicit Anne/Baba Phone Relation Pilot

- `src/features/imports/services/types.ts`
  Import-only `mother_phone` / `father_phone` hedeflerini ve simulated phone relation metadata tiplerini tasir.
- `src/features/imports/services/columnDefinitions.ts`
  Explicit Anne/Baba phone aliaslarini tanir. Generic GSM/Tel/Telefon aliaslari generic telefon slotlari olarak kalir.
- `src/features/imports/services/importSimulation.ts`
  Telefon kaynaklarini Excel kolon sirasinda isler, explicit slotlari ve sonraki uygun Telefon N allocator kuralini uygular, Anne/Baba relation label ve source-column bilgisini tasir.
- `src/features/imports/services/importWriter.ts`
  Relation-labeled parent phone'u mevcut mother/father guardian kaydina baglar; parent adi yoksa sahte guardian olusturmadan `guardian_id: null` ile relation label'i korur.
- `tests/imports/columnMatching.test.ts`
  Explicit parent aliaslari ile generic phone alias ayrimini kilitler.
- `tests/imports/importNameComposition.test.ts`
  Parent phone alanlarinin ogrenci adi kaynagi olmadigini dogrular.
- `tests/imports/importSimulation.test.ts`
  Relation metadata, slot allocation ve parent-name-absent simulation davranisini test eder.
- `tests/imports/importWriter.test.ts`
  Guardian linking, relation labels, source columns, slot order ve fake guardian olusturmama davranisini test eder.
- `docs/CHECKPOINT_EXPLICIT_GUARDIAN_PHONE_RELATIONS.md`
  Explicit parent-phone implementation kapsami, validation, riskler ve sonraki export/backup dilimi icin resmi kapanis kaydi.

## Latest File Map Addendum - Detailed Export Guardian Names

Son doğrulandı: Detailed Export Guardian Names

- `src/features/exports/services/exportTypes.ts`
  Detailed export bundle içinde relation-aware `guardian`, `mother` ve `father` guardian kayıtlarını taşır.
- `src/features/exports/services/exportDataReader.ts`
  Aktif guardian kayıtlarını relation type ile ayırır. `guardian` ve legacy `null` Veli, `mother` Anne, `father` Baba kabul edilir. Aynı relation türünde seçim `created_at`, ardından `id` sırasıyla deterministiktir.
- `src/features/exports/services/exportMapper.ts`
  Yalnızca detaylı export için `Veli Ad Soyad`, `Anne Adı`, `Baba Adı` kolonlarını üretir. Telefon 1-10 slot mapper'ı değişmeden kalır; summary export genişletilmez.
- `tests/exports/exportDataReader.test.ts`
  Relation-aware Veli/Anne/Baba seçimini, yanlış ilk guardian regresyonunu ve legacy null Veli uyumluluğunu doğrular.
- `tests/exports/exportMapper.test.ts`
  Guardian kolon sırasını, eksik Anne/Baba hücrelerini, Telefon 1-10 slot fidelity'yi ve ayrı Anne/Baba telefonu kolonlarının üretilmediğini doğrular.
- `docs/CHECKPOINT_DETAILED_EXPORT_GUARDIAN_NAMES.md`
  Detailed export guardian-name diliminin kapsam, karar, validation, risk ve sonraki backup/restore test-first adımını kaydeder.

## Latest File Map Addendum - Backup Restore Guardian Roundtrip Guarantee

Son doğrulandı: Backup/Restore Guardian Roundtrip Guarantee

- `src/db/backup.ts`
  Full System Backup için `guardians` ve `phones` dahil mevcut tabloları ham kayıtlarıyla snapshot'a alır ve restore eder. Bu dilimde değiştirilmedi; yeni roundtrip testi mevcut davranışın gerekli relation metadata'yı zaten koruduğunu doğruladı.
- `tests/settings/backupRestore.test.ts`
  Bir öğrenci, Veli/Anne/Baba/legacy Veli guardian kayıtları ve bağlı/bağlantısız relation-aware telefonlarla kaynak DB oluşturur. Snapshot'ı hedef DB'ye restore ederek guardian relation türlerini ve telefon `guardian_id`, `relation_label`, `source_column`, `reference_label`, `priority` alanlarını doğrular.
- `docs/CHECKPOINT_BACKUP_RESTORE_GUARDIAN_ROUNDTRIP.md`
  Test-only backup/restore garanti diliminin davranış, validation, kapsam dışı alanlar, kalan riskler ve sonraki summary export discovery kararını kaydeder.

## Latest File Map Addendum - Adaptive Summary Export Columns

Son doğrulandı: Adaptive Summary Export Columns

- `src/features/exports/services/exportMapper.ts`
  Summary dataset'i bir kez canonical satırlara dönüştürür, aynı satırlardan `SummaryColumnPlan` üretir ve adaptif header/row değerlerini oluşturur. Veli sabit; Anne/Baba/Mahalle/İlçe koşulludur. Telefon kolonları slot-faithful `phones[]` üzerinden minimum 1-2, kullanılan en yüksek slot kadar ve en fazla 10 olacak şekilde üretilir. In-memory validation veri kaybı ve sheet shape tutarsızlığında fail-fast davranır.
- `tests/exports/summaryExportMapper.test.ts`
  Telefon 1/2 uyumluluğu, Telefon 7-only ve Telefon 10-only slot fidelity, parent relation telefonları, adaptif guardian/location kolonları, invalid telefon durumu, boş slot durumu, telefon/status header çiftleri, row/header uzunluğu ve hatalı plan validation senaryolarını doğrular.
- `docs/CHECKPOINT_ADAPTIVE_SUMMARY_EXPORT_COLUMNS.md`
  Adaptive summary kapsamını, kolon planını, header sırasını, veri güvenliği doğrulamasını, validation sonuçlarını, kalan riskleri ve sonraki insan kararı seçeneklerini kaydeder.

## Latest File Map Addendum - No-Phone Import Setting

Son doğrulandı: No-Phone Candidate Import Setting

- `src/features/imports/ImportPage.tsx`
  Session-only `Telefonsuz adayları içe aktar` checkbox'ını ve yardım metnini gösterir. Toggle değişince mevcut worksheet/current mappings ile simülasyonu yeniden üretir; yeni dosya, reset, tamamlanan import ve page refresh akışlarında ayarı OFF'a döndürür. Ayarı storage'a yazmaz.
- `src/features/imports/services/types.ts`
  `ImportSimulationOptions.allowNoPhoneCandidates`, summary policy snapshot `allow_no_phone_candidates` ve ayrı `no_usable_phone_count` alanlarını tanımlar.
- `src/features/imports/services/importSimulation.ts`
  Gerçek no-phone, invalid-only ve valid usable phone ayrımını yapar. Valid Anne/Baba telefonu ve valid alternatif Telefon N slotlarını kullanılabilir sayar; policy OFF iken no-phone satırı, her iki modda invalid-only satırı bloklar.
- `src/features/imports/services/importWriter.ts`
  Simulation summary policy snapshot'ını backup/write öncesinde savunmacı olarak doğrular. ON ile kabul edilen no-phone satırda öğrenci/guardian yazabilir fakat PhoneRecord oluşturmaz.
- `tests/imports/ImportPageProgressiveDisclosure.test.tsx`
  Toggle'ın varsayılan OFF durumunu, helper metnini, yeniden simülasyonu, güncel policy ile importu ve reset davranışını doğrular.
- `tests/imports/importSimulation.test.ts`
  OFF/ON no-phone davranışı, invalid-only bloklama, parent phone ve Telefon 10 gibi alternatif slotların kullanılabilir sayılması senaryolarını kapsar.
- `tests/imports/importWriter.test.ts`
  OFF'ta no-phone öğrenci yazılmamasını, ON'da PhoneRecord oluşturmadan öğrenci/guardian yazılmasını ve stale/tampered summary'nin backup öncesi reddedilmesini doğrular.
- `tests/imports/importNameComposition.test.ts`
  Toggle açık veya kapalıyken yalnız Veli/Anne/Baba bilgilerinin öğrenci adı oluşturamadığını korur.
- `tests/imports/importDuplicateGuard.test.ts`
  Duplicate guard fixture'ını yeni varsayılan OFF telefon politikasına uyumlu geçerli telefonlu kayıtla doğrular; duplicate algoritması değişmez.

## Latest File Map Addendum - Guardian + Phone UI Clarity

Son doğrulandı: `ead391b feat: clarify guardian and phone labels`

- `src/features/students/StudentsPage.tsx`
  Sağ kart contact alanında `Veli Bilgileri` başlığını gösterir. Telefon slot başlığını `Telefon N` olarak korur; anlamlı relation bilgisini ayrı kompakt rozet olarak sunar. Generic relation rozet üretmez. `source_column` yalnız mevcutsa tooltip metninde kullanılır. Telefon status, Son sonuç, copy, expand/collapse ve ✓ / x davranışları aynı kalır.
- `tests/students/StudentsPageMultiPhone.test.tsx`
  `Veli Bilgileri` başlığını, dolu Veli/Anne/Baba satırlarını, Telefon 1 generic etiketsiz davranışını, Telefon 2 ve Telefon 3+ relation rozetlerini, kaynak tooltip'ini ve expand/collapse regresyonunu doğrular.
- `tests/students/StudentsPagePhoneSelection.test.tsx`
  Telefon 3+ ana etiketinin slot-faithful `Telefon 3` olarak kalmasıyla mevcut selection, wrong/unused, invalid, Son sonuç, copy ve call-save davranışlarını doğrular.
- `src/features/students/services/studentListReader.ts`
  Bu dilimde değiştirilmedi. UI için gerekli `reference_label`, `relation_label`, `display_label` ve `source_column` alanlarını zaten taşıdığı için yeni query/read-model çalışması gerekmedi.
- `docs/CHECKPOINT_GUARDIAN_PHONE_UI_CLARITY.md`
  UI kararını, validation sonuçlarını, değişmeyen davranışları, manuel QA sınırını ve yeni-chat handoff önerisini kaydeder.
- `docs/CHECKPOINT_NO_PHONE_IMPORT_SETTING.md`
  Ürün kararı, policy davranışı, validation, kapsam dışı alanlar, context sync notu ve sonraki aksiyonların resmi kapanış kaydıdır.
## Latest File Map Addendum - Phone Outcome Tracking + Compact UI Polish

Son doğrulandı: `667d501 fix: polish phone outcome card menu layout`

- `src/domain/models/phone.ts`
  Phone-level outcome anahtarlarını ve Türkçe etiketlerini taşır: `not_called`, `no_answer`, `busy`, `closed`, `reached`, `wrong_number`, `unused`. `call_outcome` ve `call_outcome_updated_at` phone-level alanlardır; `phone_status` yerine kullanılmaz.
- `src/features/students/services/studentPhoneOutcome.ts`
  Yalnızca seçili `PhoneRecord` için `call_outcome` ve `call_outcome_updated_at` günceller. Aynı numarayı taşıyan başka aday kayıtlarını otomatik güncellemez.
- `src/features/students/StudentsPage.tsx`
  Sağ kart telefon alanında kompakt 3 satırlı layout'u, `Son sonuç` read-only alanını ve outcome chip/menu UI'ını render eder. Outcome menu portal/fixed positioning, viewport-aware top/bottom placement, constrained `max-height` / `overflow-y` ve düzeltilmiş anchor gap davranışını taşır.
- `tests/students/StudentsPagePhoneSelection.test.tsx`
  Outcome seçenek sırasını, explicit menu selection davranışını, Aranmadı reset timestamp'ini, 3-row layout'u, portal/fixed menu positioning'i, top/bottom anchor gap ve constrained overflow davranışını doğrular.
- `tests/students/StudentsPageMultiPhone.test.tsx`
  Çoklu telefon kartlarıyla compact layout, relation badge ve expand/collapse regresyon davranışlarını korur.
- `tests/settings/backupRestore.test.ts`
  Backup/restore tarafının phone-level outcome alanlarını koruduğunu doğrulayan regresyon kapsamına dahildir.
- `docs/CHECKPOINT_PHONE_OUTCOME_TRACKING_AND_UI_POLISH.md`
  Phone-level outcome tracking ve compact phone card UI polish zincirinin resmi docs-only kapanış checkpoint'idir.

## Latest File Map Addendum - Demo Seed and WhatsApp Manual Drafts

Son doğrulandı: `48da40c fix: polish WhatsApp phone action icon`

- `vite.config.ts`
  `/demo` subpath deployment compatibility için Vite base path davranışını taşır. Pilot demo hedefi domain root değil `/demo` path'idir.
- `src/db/seed.ts`
  Pilot demo seed bootstrap ve zengin fake pilot seed verilerinin kaynağıdır. Gerçek data alanı ile demo/test seed alanı karıştırılmamalıdır.
- `src/features/students/StudentsPage.tsx`
  Telefon kartındaki WhatsApp ikon aksiyonunu, WhatsApp taslak modalını, kopyalama/açma/manuel gönderildi feedback'ini ve ilgili telefon kartındaki gönderildi badge'ini render eder. X, ✓, phone outcome dropdown ve `phone_status` / `call_outcome` semantiklerini değiştirmez.
- `src/features/whatsapp/whatsappTemplates.ts`
  Kurum bilgisi, konum, takip ve randevu gibi manuel WhatsApp taslak şablonlarını taşır.
- `src/features/whatsapp/whatsappTemplateRenderer.ts`
  Şablon değişkenlerini aday/veli/telefon bağlamına göre metne dönüştürür.
- `src/features/whatsapp/whatsappUrl.ts`
  Telefonu `wa.me` linki için normalize eder ve taslak URL üretir. WhatsApp API, bot veya auto-send değildir.
- `src/features/whatsapp/whatsappDraftLogService.ts`
  `draft_opened`, `copied` ve `manually_marked_sent` local log kayıtlarını yazar/okur. `manually_marked_sent` WhatsApp teslimat onayı değil, manuel CRM takip işaretidir.
- `src/domain/models/whatsappDraftLog.ts`
  WhatsApp draft log modelini ve izinli local log status değerlerini tanımlar.
- `tests/whatsapp/whatsappDraft.test.ts`
  URL normalization, template rendering, draft log write/read ve manually marked sent lookup davranışlarını doğrular.
- `tests/students/StudentsPagePhoneSelection.test.tsx`
  WhatsApp ikon butonu, modal açma, `WhatsApp'ta Aç`, `Mesajı Kopyala`, `Gönderildi olarak işaretle`, gönderildi badge'i ve X/✓ regression davranışlarını doğrular.

## Latest File Map Addendum - WhatsApp Web Open Suspend + Student Cleanup Candidate Service

Son doğrulandı: `4ebfe33 fix: suspend WhatsApp web open action`

- `src/features/students/StudentsPage.tsx`
  WhatsApp taslak modalını, template override/edit state'ini, kopyalama ve manuel gönderildi işaretleme akışını render eder. `WhatsApp'ta Aç` / `wa.me` open action geçici olarak disabled durumdadır; yeni kullanımda `window.open`, `buildWhatsAppDraftUrl` ve `draft_opened` log tetiklenmez. `Mesajı Kopyala` ve `Gönderildi olarak işaretle` akışları korunur.
- `src/features/whatsapp/whatsappUrl.ts`
  `wa.me` URL helper'ını taşımaya devam eder. Geçici suspend sırasında UI akışından çağrılmaz, silinmemiştir ve gelecekte open action yeniden kabul edilirse kullanılabilir.
- `src/features/whatsapp/whatsappDraftLogService.ts`
  `copied` ve `manually_marked_sent` logları aktif kalır. `draft_opened` modelde tarihsel/gelecek uyumluluk için durur, fakat suspend sonrası yeni open action kullanımında üretilmez.
- `tests/students/StudentsPagePhoneSelection.test.tsx`
  WhatsApp modalında open action'ın disabled olduğunu, `window.open` ve `draft_opened` oluşmadığını, buna karşılık edited/current body ile kopyalama ve manuel gönderildi loglarının çalıştığını doğrular.
- `tests/whatsapp/whatsappDraft.test.ts`
  URL helper, template rendering, draft log write/read ve manually sent lookup birim davranışlarını korur; helper silinmediği için bu testler kalır.
- `src/features/imports/services/importWriter.ts`
  `c77e8cf` sonrası yeni importlarda hardcoded `11. Sınıf YKS Hazırlık` student_group fallback'i ve hardcoded `YKS` category yazımı yapmaz. Bu yalnız yeni importları etkiler; eski DB kayıtlarını temizlemez.
- `src/features/students/services/studentCleanupCandidates.ts`
  Eski hardcoded student_group fallback'inden etkilenmiş olabilecek kayıtları read-only tespit eder. DB write, apply/cleanup, migration veya UI içermez.
- `tests/students/studentCleanupCandidates.test.ts`
  Cleanup candidate servisinin high_confidence / needs_review sınıflamasını, current_class 11 dışlamasını ve kaynak metadata taşımasını doğrular.

## Latest File Map Addendum - VELI ADI Import Alias Fix

Son doğrulandı: `18f47c9 fix: map veli adi import column`

- `src/features/imports/services/columnDefinitions.ts`
  `guardian_full_name` alias listesine `veli adi` eklenmiştir. Bu sayede `VELI ADI` / `Veli Adı` başlığı mevcut `Veli Ad Soyad` import alanına otomatik eşleşir.
- `tests/imports/columnMatching.test.ts`
  `Veli Adı` ve `Veli Ad Soyad` başlıklarının ikisinin de `guardian_full_name` hedefini verdiğini, Anne/Baba adlarının öğrenci adı olarak yorumlanmadığını ve generic telefon aliaslarının parent relation üretmediğini doğrular.
- `tests/imports/importNameComposition.test.ts`
  `AD` + `SOYAD` composition davranışı korunurken `Veli Adı` kolonunun manuel mapping olmadan `guardian_full_name` olarak taşınmasını doğrular.
- `tests/imports/ImportPageProgressiveDisclosure.test.tsx`
  ImportPage kolon eşleştirme UI'ında `Veli Adı` satırının `Tam eşleşti` durumunda ve `guardian_full_name` değerinde olduğunu doğrular.
- Scope dışı: `VELI TEL`, `guardian_phone`, import writer, schema/db, export/backup, StudentsPage ve WhatsApp davranışı değiştirilmemiştir.

## Latest File Map Addendum - VELI TEL / Guardian Phone Import

Son doğrulandı: `cf47e2d feat: import explicit guardian phone relations`

- `src/features/imports/services/types.ts`
  `guardian_phone` import-only parent phone field olarak `mother_phone` / `father_phone` hattına paralel tanımlıdır. Kalıcı student field değildir.
- `src/features/imports/services/columnDefinitions.ts`
  `VELI TEL`, `VELI TELEFON`, `VELI GSM`, `VELI CEP`, `Veli Telefonu` ve `Veli Cep Telefonu` alias'larını `guardian_phone` alanına eşler. Generic Telefon/GSM/Tel başlıkları generic Telefon N olarak kalır.
- `src/features/imports/services/importSimulation.ts`
  `guardian_phone` kaynaklarını Excel kolon sırası ve mevcut Telefon N allocator kuralıyla `phones[]` hattına katar; `relation_label: "Veli"` ve gerçek Excel `source_column` bilgisini taşır.
- `src/features/imports/services/importWriter.ts`
  Mevcut relation phone davranışıyla Veli telefonunu Veli guardian kaydına bağlar. Veli adı yoksa fake guardian oluşturmaz; relation label korunur ve `guardian_id: null` kalabilir.
- `tests/imports/columnMatching.test.ts`
  Explicit Veli/Anne/Baba phone alias'larının generic Telefon/GSM/Tel başlıklarından ayrıldığını doğrular.
- `tests/imports/importNameComposition.test.ts`
  Veli telefonu ve parent bilgileri öğrenci adı kaynağı olmadığını doğrular.
- `tests/imports/importSimulation.test.ts`
  Veli phone relation metadata, source column, slot allocation, no-phone policy ve duplicate warning davranışını doğrular.
- `tests/imports/importWriter.test.ts`
  Veli telefonunun Veli guardian kaydına bağlanmasını ve Veli adı yoksa fake guardian oluşturulmadan `guardian_id: null` kalmasını doğrular.
- Scope dışı: export/backup, StudentsPage, WhatsApp, schema/db ve package/config değişmemiştir.

## Latest File Map Addendum - Cancel Pending Linked Call Reminder

Son doğrulandı: `e15a051 feat: cancel pending linked reminders`

- `src/features/reminders/services/reminderLifecycle.ts`
  Canonical owner resolver'ı ve pending linked call reminder cancellation transaction'ını taşır. `reminder.call_log_id` owner yönüdür; shared/tarihsel call-log reference'ları owner conflict değildir, fakat aynı owner'a bağlı birden fazla aktif pending reminder fail-closed'dur. Cancellation yalnız reminder status/updated_at değerini değiştirir ve `pending_reminder_cancel` auditini atomik ekler.
- `src/features/calls/services/callHistoryReader.ts`
  Owner/current history satırına `canCancelLinkedReminder` üretir. Modern reciprocal ve güvenli legacy owner'ı destekler; shared/tarihsel satırlar action almaz.
- `src/features/students/StudentsPage.tsx`
  Owner satırında `Hatırlatmayı iptal et` icon aksiyonunu ve optional nedenli confirmation modalını render eder. Call log veya randevu silinmeyeceğini açıklar; completion modalının vazgeçme metni de `Vazgeç`dir.
- `tests/calls/callHistoryReader.test.ts`
  Modern/legacy owner, birden fazla shared reference, conflicting reciprocal ve duplicate pending owner visibility kurallarını doğrular.
- `tests/reminders/reminderLifecycle.test.ts`
  Owner cancellation success, shared row rejection, duplicate-owner fail-closed, audit rollback ve call log/appointment korunumu regresyonlarını doğrular.
- `tests/students/StudentsPageCallHistory.test.tsx`
  Owner satırında cancellation ikon/modal görünürlüğünü, shared satırda aksiyonun olmamasını ve existing complete/edit/delete akışlarının korunmasını doğrular.
- `tests/reminders/reminderListReader.test.ts` ve `tests/reminders/reminderAlarmReader.test.ts`
  Cancelled reminder'ın pending list/alarm kaynaklarından dışlandığını doğrular.
- `tests/exports/exportDataReader.test.ts` ve `tests/settings/backupRestore.test.ts`
  Normal exportun cancellation audit payloadını taşımadığını, Full System Backup/restore'un cancelled status ile audit payloadını koruduğunu doğrular.
- Scope dışı: schema/migration, backfill, RemindersPage aksiyonu, appointment lifecycle, import/export formatı, package/config ve VDS deployment değişmemiştir.

## Previous File Map Addendum - Pending Linked Reminder Edit

Son doğrulandı: `93b4471 feat: edit pending linked reminders`

- `src/features/calls/services/callHistoryReader.ts`
  Strict owner/current reminder kararını, append-only reminder edit audit preview alanlarını ve shared/eski/deleted/appointment-linked satırlarda fail-closed görünürlüğü taşır.
- `src/features/calls/services/callLogCorrection.ts`
  Lifecycle-aware correction policy'nin service otoritesidir: full, note-only ve blocked sonuçları üretir; dependency durumunu transaction içinde yeniden okur ve correction auditini atomik yazar.
- `src/features/reminders/services/reminderLifecycle.ts`
  Pending call reminder tarih/saat/not editini gerçek owner call log ile aynı transaction içinde uygular ve `pending_reminder_edit` auditini append-only ekler.
- `src/features/students/StudentsPage.tsx`
  Owner-row reminder edit modalı, persistent audit preview tooltip'i, lifecycle-aware correction modal politikası ve uzun history notu görünümünü render eder.
- `src/styles/global.css`
  Reminder audit tooltip portalı ile timeline note wrap/overflow desteğini taşır; drawer'a geniş kapsamlı overflow gizleme eklemez.
- `tests/calls/callHistoryReader.test.ts`
  Owner/shared ayrımı, terminal preview kalıcılığı, malformed audit fallback'i, actor filtreleme ve reminder/appointment görünürlük sınırlarını doğrular.
- `tests/calls/callLogCorrection.test.ts`
  Correction lifecycle matrisi, note-only service guard, audit append-only/rollback, missing/conflict fail-closed ve export/backup kapsamını doğrular.
- `tests/exports/exportDataReader.test.ts`
  Normal exportun reminder/correction audit payloadlarını okumadığını doğrular.
- `tests/reminders/reminderLifecycle.test.ts`
  Owner-only pending reminder editini, audit transaction rollback'ını ve terminal/invalid lifecycle guard'larını doğrular.
- `tests/settings/backupRestore.test.ts`
  Full System Backup/restore akışında audit verisinin korunmasını doğrular.
- `tests/students/StudentsPageCallHistory.test.tsx`
  Reminder edit UI, audit tooltip portal/delay/focus/placement davranışı, terminal note-only correction ve action görünürlük regresyonlarını doğrular.
- Scope dışı: schema/migration, import/export formatı, WhatsApp, package/config ve VDS servis yapılandırması değiştirilmemiştir.

## Previous File Map Addendum - Stale Reminder Date Guard Fix

Son doğrulandı: `37d1fd5 fix: guard reminder creation to call later`

- `src/domain/constants/statuses.ts`
  `isReminderCallResult` helper'ını taşır. Şu an call reminder create/update için reminder result yalnız `call_later` kabul edilir.
- `src/features/calls/services/callLogWriter.ts`
  Reminder create/update service guard'ını uygular. Non-`call_later` sonuçlarda stale `reminder_at` gelse bile reminder oluşturmaz/güncellemez; call log üzerinde `created_reminder_id`, `reminder_at` ve `next_action` null kalır.
- `src/features/calls/services/callSaveValidation.ts`
  Reminder-aware validation davranışını `isReminderCallResult` helper'ı üzerinden kurar; `call_later` tarih/saat zorunluluğu korunur, non-reminder sonuçlar stale reminder tarih/saat yüzünden bloklanmaz.
- `src/features/students/StudentsPage.tsx`
  Sağ kart görüşme formunda non-`call_later` result geçişinde stale `reminderDate` / `reminderTime` state'ini temizler. Linked quick complete sonrası aynı state temizlenir. `saveCallAndGoNext`, reminder payload'ını yalnız `call_later` için üretir.
- `tests/calls/callLogWriter.test.ts`
  Writer service guard kapsamını, non-reminder sonuçlarda stale reminder date ignore davranışını ve mevcut pending reminder'ın non-reminder sonuçla güncellenmemesini doğrular.
- `tests/calls/callSaveValidation.test.ts`
  `call_later` tarih/saat validasyonu korunurken non-reminder sonuçlarda stale reminder date/time'ın validation'ı bozmadığını doğrular.
- `tests/students/StudentsPageCallHistory.test.tsx`
  Drawer formdan yalnız `call_later` için reminder oluştuğunu ve linked quick complete sonrası non-reminder kayıtla completed reminder'ın yeniden açılmadığını doğrular.
- Scope dışı: appointment lifecycle redesign, existing pending reminder auto-cancel/auto-complete, import/export, backup/restore, WhatsApp, Reporting V2, schema/db ve VDS komutları değiştirilmemiştir.

## Latest File Map Addendum - Linked Reminder Owner Row Visibility Fix

Son doğrulandı: `7636b57 fix: show linked reminder action only on owner history row`

- `src/features/calls/services/callHistoryReader.ts`
  Linked reminder read model owner-row visibility kararını uygular. `canCompleteLinkedReminder` yalnız owner/current row için true olur; owner önceliği `reminder.call_log_id`, fallback ise aynı reminder id'ye bağlı aktif call loglar içinde latest `call_time`, sonra `created_at`, sonra `id` sıralamasıdır.
- `tests/calls/callHistoryReader.test.ts`
  Owner-row visibility, `reminder.call_log_id` önceliği, latest active linked call log fallback'i, completed/cancelled/missing reminder durumları ve eski linked satırlarda quick complete action görünmemesi davranışlarını doğrular.
- `tests/reminders/reminderLifecycle.test.ts`
  `completeReminder` helper'ının yalnız verilen reminder kaydını completed yaptığını, bulk update yapmadığını koruyan regresyonu içerir.
- `tests/students/StudentsPageCallHistory.test.tsx`
  Sağ kart iletişim geçmişinde `Hatırlatmayı tamamla` aksiyonunun yalnız owner/current history satırında göründüğünü; eski shared reminder referanslı satırlarda görünmediğini doğrular.
- Scope dışı: `callLogWriter`, `completeReminder`, delete guard, schema/db, import/export, backup/restore, WhatsApp, package/config ve VDS komutları değiştirilmemiştir.

## Latest File Map Addendum - Guardian Phone Import E2E

Son doğrulandı: `b486735 test: cover guardian phone import e2e`

- `e2e/import-regression.spec.ts`
  Guardian phone import relation senaryosunu içerir. Browser üzerinden Excel upload, import, Aday Listesi ve sağ kart doğrulama akışında `VELI ADI` + `VELI TEL`, `ANNE TEL`, `BABA TEL` ve generic `Telefon` davranışını kapsar. Generic Telefon relation badge üretmez. `VELI TEL` var ama `VELI ADI` yoksa fake/boş guardian satırı oluşmadığını ve telefonun `Veli telefonu` badge'iyle görünebildiğini doğrular.
- `e2e/helpers/importFixtures.ts`
  Runtime workbook helper'ı guardian phone E2E fixture verisini üretmek için kullanılır; binary Excel fixture commit edilmez.
- Scope dışı: production `src/**`, import writer, schema/db, export/backup, StudentsPage, WhatsApp, package/config ve docs davranışı `b486735` test commit'inde değiştirilmemiştir.

## Latest File Map Addendum - Kampanya Import Persistence Bugfix

Son doğrulandı: `82036c0 fix: persist imported campaign names`

- `src/features/imports/services/importSimulation.ts`
  `campaign_name` değerini simülasyon satırına doğru taşır; bu dilimde değiştirilmedi.
- `src/features/imports/ImportPage.tsx`
  Preview tablosunda `row.campaign_name` değerini gösterir; bu dilimde değiştirilmedi.
- `src/features/imports/services/importWriter.ts`
  `row.campaign_name` değerini trimleyip campaign lookup/create için kullanır. Boş kampanya default `Diğer` kampanyasına bağlanır. Dolu kampanya için aynı isimde aktif campaign varsa kullanılır, yoksa yeni aktif campaign oluşturulur. Aynı import içinde tekrar eden kampanya adları cache ile tek kayda bağlanır.
- `src/features/students/services/studentListReader.ts`
  Student `campaign_id` üzerinden aktif campaign adını `campaign_name` olarak read model'e taşır; bu dilimde değiştirilmedi.
- `tests/imports/importWriter.test.ts`
  Kampanya persist, default `Diğer`, duplicate campaign reuse ve farklı campaign senaryolarını doğrular.
- Scope dışı: schema/db migration, export/backup, StudentsPage UI, WhatsApp, campaign management UI, `category`, `student_group`, guardian phone ve phone slot logic değişmemiştir.

## Latest File Map Addendum - Call Phone Selection Rule

Son doğrulandı: `055597a fix: relax phone selection for non-contact call results`

- `src/features/calls/services/callSaveValidation.ts`
  Görüşme durumu bazlı telefon seçimi zorunluluğunun birincil validation kaynağıdır. Telefon seçimi yalnız `reached` ve `wrong_number` için zorunludur; non-contact sonuçlarda telefon seçimi opsiyoneldir.
- `src/features/calls/services/callLogWriter.ts`
  Service-level guard aynı kuralı korur. Telefon bağlamı olmayan non-contact kayıtları null phone context ile yazabilir; `reached` ve `wrong_number` için telefon bağlamı ister.
- `src/features/students/StudentsPage.tsx`
  Sağ kart call save UI'ında nötr telefon seçimi dilini gösterir: `Aranan / işlem yapılan telefon`. Zorunluluk mesajı artık “görüşülen / iletişim kurulan numara” anlamı taşımaz.
- `tests/calls/callSaveValidation.test.ts`
  `reached` / `wrong_number` zorunluluğunu ve `not_reached`, `call_later`, `appointment`, `do_not_call`, `not_interested`, `registered`, `not_called` gibi sonuçlarda telefon seçiminin opsiyonel olduğunu doğrular.
- `tests/calls/callLogWriter.test.ts`
  Writer guard davranışını, null phone context ile non-contact kayıt yazımını ve telefon bağlamı varsa snapshot/persistence davranışını korur.
- `tests/students/StudentsPagePhoneSelection.test.tsx`
  UI metinleri, telefon seçimi zorunluluk uyarıları, yanlış/uygun olmayan telefon blokları ve sağ kart regresyonlarını kapsar.
- Scope dışı: schema/migration, import/export, backup/restore, WhatsApp, package/config ve report/export label metinleri değiştirilmemiştir.

## Latest File Map Addendum - All Phones Invalid Wrong Number Fix

Son doğrulandı: `8bf7cb2 fix: allow wrong number when all phones are invalid`

- `src/features/calls/services/callSaveValidation.ts`
  Görüşme durumu bazlı telefon seçimi kuralının validation kaynağıdır. `wrong_number` için seçilebilir telefon varsa telefon seçimi zorunlu kalır; adayda telefon olup tüm telefonlar `is_wrong` veya `phone_status: invalid` ise genel `wrong_number` kaydına null phone context ile izin verir.
- `src/features/calls/services/callLogWriter.ts`
  Service-level guard validation ile aynı edge-case'i korur. Tüm telefonlar invalid/wrong ise `wrong_number` call log'u telefon bağlamı olmadan yazılabilir; seçilebilir telefon varsa `wrong_number` için telefon bağlamı ister.
- `src/features/students/StudentsPage.tsx`
  Sağ kart genel görüşme kaydı akışında bu validation/writer sonucunu tüketir; X, phone outcome dropdown, phone-level status/outcome ve no-phone aday davranışı bu fix kapsamında değiştirilmemiştir.
- `tests/calls/callSaveValidation.test.ts`
  Tüm telefonlar invalid/wrong iken `wrong_number` kaydının bloklanmamasını, seçilebilir telefon varken `wrong_number` zorunluluğunun sürmesini ve `reached` zorunluluğunun korunmasını doğrular.
- `tests/calls/callLogWriter.test.ts`
  Writer'ın tüm telefonlar invalid/wrong edge-case'inde null phone context ile genel `wrong_number` yazabilmesini ve seçilebilir telefon guard'ını koruduğunu doğrular.
- `tests/students/StudentsPagePhoneSelection.test.tsx`
  Sağ kart UI regression'larında tüm telefonlar yanlış/kullanılmıyor iken genel `Yanlış Numara` kaydının yapılabildiğini ve ilgili hata metninin çıkmadığını kapsar.
- Scope dışı: schema/migration, import/export, backup/restore, WhatsApp, reminder lifecycle, communication history edit/delete ve package/config değiştirilmemiştir.

## Latest File Map Addendum - Phone Action Label Clarification / Helper Cleanup

Son doğrulandı: `c094741 chore: simplify phone result helper labels`

- `src/features/students/StudentsPage.tsx`
  Telefon kartı ✓ / X / outcome dropdown ve genel görüşme sonucu microcopy ayrımını taşır. ✓ = bu görüşmede kullanılacak telefon; X = yanlış / kullanılmayacak telefon işareti; phone outcome dropdown = telefon bazlı manuel sonuç alanı; Genel Görüşme Durumu = aday genel call log kaydı. Görünür helper yazılar sadeleştirilip kaldırılmıştır; büyük redesign ve teknik davranış değişikliği yoktur.
- `tests/students/StudentsPagePhoneSelection.test.tsx`
  Phone action label, aria/title, dropdown davranışı, genel görüşme sonucu akışı ve helper cleanup regression coverage içerir.
- `tests/students/StudentsPageMultiPhone.test.tsx`
  Multi-phone action label regression coverage içerir.
- Scope dışı: schema/migration, PhoneRecord model/semantik, phone_status/is_wrong/call_outcome davranışı, X/dropdown/✓ davranışı, call log validation/write rules, import/export/backup ve WhatsApp değiştirilmemiştir.

## Latest File Map Addendum - Appointment Model C+ Checkpoint B

Son doğrulandı: `79cf2f9 feat: unify operational appointment alerts`

- `src/features/reminders/services/operationalAlertReader.ts`
  Mevcut call reminder satırlarını ve aktif C+ appointment'lardan fail-closed türetilen `appointment_guardian_message` / `appointment_start` satırlarını tek read-only operasyonel modelde üretir. Appointment için ReminderRecord oluşturmaz; aynı appointment'ın item identity'lerini bağımsız taşır.
- `src/features/reminders/OperationalAlertHost.tsx`
  AppLayout altında tek kez mount edilen global 30 saniyelik polling, future list, due/overdue popup/chime ve Escape davranışı host'udur. Dismiss DB write yapmaz; local UI bastırması kullanır.
- `src/features/reminders/RemindersPage.tsx`
  `call_reminder`, `appointment_guardian_message` ve `appointment_start` satırlarını read-only listeler. Appointment satırlarında lifecycle aksiyonu yoktur; yalnız `Adayı Aç` bulunur.
- `src/features/reminders/services/reminderDismissalStore.ts`
  Mevcut call reminder dismissal anahtarlarını korur; appointment guardian/start item'larının bağımsız stable identity'lerini local UI bastırmasında destekler.
- `src/features/reminders/services/reminderPopupViewModel.ts`
  Üç operasyonel tür için popup metinlerini ve tür farkını read modelden üretir.
- `src/app/AppLayout.tsx`
  Route bağımsız operasyonel alert host'unu tek global mount noktasında taşır.
- `src/features/students/StudentsPage.tsx`
  Eski route'a bağlı reminder polling/popup/chime sorumluluğunu taşımaz; öğrenci drawer ve call flow sorumlulukları korunur.
- `tests/reminders/operationalAlertReader.test.ts`
  Türetilen guardian/start satırları, fail-closed integrity, identity ve call reminder regresyonlarını kapsar.
- `tests/reminders/OperationalAlertHost.test.tsx`
  Global host polling, chime, popup, dismiss ve Escape davranışlarını kapsar.
- Scope dışı: DB version/index/migration/backfill, appointment ReminderRecord oluşturma, guardian message sent mutation, appointment lifecycle mutationları, package/config ve deployment değiştirilmemiştir.

## Latest File Map Addendum - Appointment Model C+ Checkpoint C

Son doğrulandı: `4f643a4 feat: complete appointment lifecycle`

- `src/features/appointments/services/appointmentLifecycle.ts`
  Guardian-message sent, appointment note edit, reschedule ve `pending → completed`/`no_show`/`cancelled` mutationlarının canonical service'idir. Current state'i transaction içinde yeniden okur, stale expectation'ı doğrular ve appointment update ile lifecycle audit'ini atomik yazar.
- `src/features/appointments/services/appointmentOwnerIntegrity.ts`
  Lifecycle için modern pending appointment, aktif öğrenci ve reciprocal owner call-log bağını fail-closed doğrular; legacy, terminal, duplicate veya conflict durumlarını mutation dışı bırakır.
- `src/features/appointments/services/guardianMessageDueTime.ts`
  Europe/Istanbul appointment input formatter'ını, future-only ortak doğrulamayı ve reschedule sonrası guardian-message due time hesabını taşır.
- `src/features/calls/services/callHistoryReader.ts`
  Owner call-log `Görüşme notu` ile linked `AppointmentRecord.note` değerini ayrı read-model alanları olarak taşır; terminal/legacy kayıtları read-only gösterir.
- `src/features/calls/services/callLogCorrection.ts`
  Valid pending appointment owner için yalnız call-log note-only correction'a izin verir; appointment state, tarih/saat, sonuç ve phone context korunur.
- `src/features/reminders/services/operationalAlertReader.ts`
  Guardian-message sent, reschedule generation ve terminal appointment state'i sonrası guardian/start operational item'larını current appointment state'ten fail-closed türetir.
- `src/features/reminders/RemindersPage.tsx`
  Guardian operational item üzerinde canonical `Mesaj Gönderildi` aksiyonunu sunar; call reminder ve appointment-start satırlarının davranışını korur. Tablo action layout'u kompakt, responsive ve yatay overflow olmadan kalır.
- `src/features/students/StudentsPage.tsx`
  Modern pending owner row için tek calendar-icon `Randevuyu yönet` entry point'ini, appointment management modalını ve CallLog/Appointment note ayrımını taşır. Terminal, legacy ve malformed rows lifecycle action göstermez.
- `src/styles/global.css`
  Reminder action grubu ve ilgili operational row'ların kompakt responsive görünümünü taşır; business logic içermez.
- Scope dışı: DB version/index/migration/backfill, yeni table, appointment ReminderRecord, package/config, import/export formatı ve production deployment değiştirilmemiştir.

