<!-- Son guncelleme: Cancel Pending Linked Call Reminder | Branch: sprint-9-2-multi-phone-architecture-plan -->

# DECISIONS — Aday Öğrenci Takip Sistemi

## Amaç

Bu dosya kritik ürün kararları için kısa karar günlüğüdür. Ayrıntılı sprint geçmişi için checkpoint dosyaları, güncel kısa bağlam için `docs/PROJECT_MEMORY.md` kullanılır.

## Aktif Kararlar

- [Sprint 6] Excel export raporlama/paylaşım içindir; eksiksiz geri yükleme için Tam Sistem Yedeği kullanılır.
- [Sprint 6] Ana UI’da “JSON yedek” gibi teknik ifade gösterilmez; kullanıcı dili “Tam Sistem Yedeği” olur.
- [Sprint 6.1] Arama operasyonu Aday Listesi + sağ kişi kartı üzerinden yürür; eski Arama Ekranı menüsü gizlidir.
- [Sprint 6.1] `/students` ekranında global arama dropdown’ı açılmaz; üst arama sadece listeyi filtreler.
- [Sprint 6.1] Üst bardaki Excel içe/dışa aktar butonları kaldırılmıştır; işlemler sol menüdedir.
- [Sprint 6.1] Tek aday silme sağ kişi kartındaki üç nokta menüsündedir.
- [Sprint 6.2] Detaylı Excel Export korunur; Özet Görüşme Raporu sade paylaşım raporudur.
- [Sprint 7] Restore replace mode’dur; merge mode henüz yoktur.
- [Sprint 7] Restore için `GERİ YÜKLE` yazı doğrulaması gerekir.
- [Sprint 8.1] Filtre adı Sınıf / Şube’dir; `current_class` + `student_group` birlikte yorumlanır.
- [Sprint 8.1] Durum chipleri Durum Filtresi dropdown’ına taşınmıştır.
- [Sprint 8.6] Günlük rapor kırılımları `call_logs.call_result` üzerinden hesaplanır: `reached`, `not_reached`, `call_later`, `appointment`, `registered`, `do_not_call`/`not_interested`, `wrong_number`. Günlük tarih filtresinde `call_time` birincildir; yoksa `created_at` kullanılır. Raporlar sayfası Excel export’un yerine geçmez; detaylı paylaşım için Detaylı Excel Export ve Özet Görüşme Raporu korunur.
- [Sprint 8.7] Responsive Layout Polish düşük riskli CSS ağırlıklı yaklaşımla yapıldı. Dar ekranlarda tablo/kart/filtre/dropdown taşmasını azaltmak için yatay scroll, min-width, breakpoint ve wrap düzenleri kullanıldı. Alt kısayol barı, mobil drawer ve mobil kart tablo dönüşümü ayrı sprintlere bırakıldı.
- [Sprint 8.8] Aday Listesi alt kısayol yardım barı varsayılan olarak kompakt/açılır-kapanır hale getirildi. Açık/kapalı tercih localStorage key’i `aots-shortcut-help-expanded` ile saklanır. Bu sadece UI tercihidir; kısayol registry, keyboard handler ve kısayol ayar mantığı değiştirilmedi.
- [Sprint 8.9] Pilot öncesi kullanıcıya görünen teknik metinler sadeleştirildi. “Import” yerine “İçe Aktarma”, teknik “JSON yedek” dili yerine kullanıcı dostu güvenlik yedeği/Tam Sistem Yedeği dili, Raporlar’da tarih seçimine uygun “Seçilen gün...” dili ve Ayarlar’da Türkçe hatırlatma dili kullanılacak. İş mantığı değiştirilmedi.
- [Sprint 9.0] Pilot öncesi kullanıcı dokümantasyonu iki dosya halinde tutulacak: `USER_GUIDE.md` son kullanıcı kitapçığı, `PILOT_MANUAL_TEST_CHECKLIST.md` geliştirici/operasyon manuel test checklist’i. Kod mantığı değişmeyecek.
- [Sprint 9.1] Manuel pilot testte bulunan PF-001, PF-002, PF-003 ve PF-004 kapatıldı. Route/menu değişiminde global arama dropdown’ı kapanır; restore yanlış dosya ve başarı durumları görünür alertdialog ile kullanıcıya bildirilir; sağ drawer sıkışması düşük riskli CSS ile hafifletildi. Backup/restore transaction mantığı, global arama temel davranışı ve Aday Listesi tablo mimarisi değiştirilmedi.
- [Pilot RC] Sprint 9.1 sonrası sistem küçük ölçekli pilot kullanım için release candidate kabul edilir. Manuel pilot testte bulunan PF-001, PF-002, PF-003 ve PF-004 kapatıldı. Pilot; küçük veri seti, kullanım kitapçığı, manuel checklist ve düzenli Tam Sistem Yedeği alma şartıyla başlatılabilir.
- [Pilot v1.0] Sprint 9.1 sonrası sistem küçük ölçekli kontrollü pilot kullanım için hazır kabul edilir. Pilot; küçük veri seti, Kullanım Kitapçığı, Pilot Manuel Test Checklist ve düzenli Tam Sistem Yedeği alma şartlarıyla başlatılacaktır.
- [Pilot Run] Pilot v1.0 gerçek kullanım denemesi yapılmıştır. Yeni engelleyici sorun bildirilmezse sistem küçük ölçekli kontrollü kullanımda izlenmeye devam eder; yeni bulgular ayrı Pilot Feedback Fixes kapsamında ele alınır.
- [Pilot UI Polish] Pilot izleme sırasında bulunan küçük UI/UX bulguları PF-006–PF-012 olarak kapatıldı. Export kapsam açıklamaları netleştirildi, sol menü L/H kısayolları çalışır hale getirildi, Raporlar/Hatırlatmalar scroll polish’i yapıldı, kısayol ayar butonları ve sol menü kısayol bilgilendirmesi iyileştirildi. Reports Dashboard Polish ayrı roadmap maddesi olarak kalır.
- [Sprint 9.2] Çoklu Telefon Mimarisi için plan yapıldı. Sabit 10 telefon kutusu gösterilmeyecek; telefonlar dinamik liste olarak tutulacak. Sağ kişi kartında ilk 2-3 telefon hızlı görünür, fazlası “+N numara daha göster” ile açılır. Telefonlar Telefon N referans etiketi, ilişki etiketi, durum, `source_column`, `phone_id` ve `phone_snapshot` mantığıyla yönetilecek. Call log ve reminder kayıtları seçili telefon bağlamını koruyacak. Export sade/detaylı ayrımıyla tasarlanacak. Mobil/responsive polish çoklu telefon UI sonrası ayrı ele alınacak.
- [Sprint 9.3A] Çoklu telefon core model ve compatibility helper altyapısı eklendi. `PhoneRelationLabel`, `PhoneOperationalStatus`, `PhoneSnapshot`, Telefon N referans etiketi, ilişki etiketi display helper’ı, legacy Telefon 1/2’den dinamik telefon listesi üretimi, phones list’ten Telefon 1/2 compatibility slotları ve helper düzeyi tekilleştirme hazırlanır. UI, import/export, call log writer, reminder writer, backup/restore ve migration davranışları bu sprintte değiştirilmez.
- [Sprint 9.3A] Call log/reminder phone context persistence, backup/restore migration ve UI entegrasyonu bilinçli olarak bu sprintin dışında bırakıldı. Call log/reminder phone context Sprint 9.3B’de, import/export ve UI işleri sonraki çoklu telefon sprintlerinde ele alınacak.
- [Sprint 9.3B-1] Call log ve reminder kayıtları için optional `phone_id` / `phone_snapshot` model alanları ile display/fallback helper’ları tamamlandı. Bu sprintte gerçek call log/reminder writer davranışı, UI, import/export, backup/restore ve storage migration değiştirilmedi. Sonraki sprint Sprint 9.3B-2 — Phone Context Persistence Wiring olarak planlanır.
- [Sprint 9.3B-2] Phone context persistence writer seviyesinde bağlandı. Call log ve pending reminder kayıtları optional `phone_id` / `phone_snapshot` taşıyabilir. `writeCallLog` içinde yeni pending reminder create ve mevcut pending reminder update akışları seçili telefon bağlamına göre güncellenir; yeni contacted phone yoksa eski phone context korunmaz ve `null` olur. UI display, import/export, backup/restore ve schema migration bu sprintte bilinçli olarak kapsam dışı bırakıldı.
- [Sprint 9.3C] Historical phone context display/read model'de snapshot öncelikli kabul edildi. Call history legacy contacted phone fallback'i korunur. Reminder list current phone lookup yapmaz; yalnızca reminder snapshot varsa context alanlarını doldurur. UI display, popup, alarm reader, import/export, backup/restore ve schema migration bu sprintte kapsam dışı bırakıldı.
- [Sprint 9.3D-1] Phone context UI display önce düşük riskli call history alanında başlatıldı. Sağ kişi kartındaki iletişim geçmişi, reader'ın ürettiği `phone_context_label` / `phone_context_number` alanlarını gösterir. Reminder list UI tablo/CSS/mobil riskleri nedeniyle ayrı sprintte ele alınacaktır. Büyük çoklu telefon sağ kişi kartı ve Excel çoklu telefon import roadmap'te kalır; bu sprintte kapsam dışıdır.
- [Sprint 9.3D-2] Reminder list UI'da yeni kolon eklenmeden mevcut Telefon 1 kolonu operasyonel olarak `Aranacak telefon` haline getirildi. Context varsa `phone_context_label` / `phone_context_number` gösterilir; context yoksa `phone_1` fallback'i korunur. Telefon 2 kolonu, CSS, reader/model, popup/alarm, import/export, backup/restore ve schema migration kapsam dışı tutuldu.
- [Sprint 9.3E-1] Sağ kişi kartı 3+ telefon UI'dan önce read model hazırlığı yapılmıştır. `StudentListRow` artık `phones`, `visible_phones` ve `hidden_phone_count` alanlarını taşır; ilk görünüm için `visible_phones` 3 telefon içerir ve fazla telefon sayısı `hidden_phone_count` ile verilir. Yanlış/geçersiz telefonlar read model'den düşürülmez; UI sprintinde badge/display kararı verilir. `phone_1`, `phone_2` ve `phone_count` geriye dönük uyumluluk için korunur. UI'ya bağlama Sprint 9.3E-2'ye bırakılmıştır.
- [Sprint 9.3E-1] Telefon 3+ seçiminin arama kaydıyla ilişkisi ayrı discovery gerektirir. Excel çoklu telefon import bu sprintin kapsamı değildir.
- [Sprint 9.3E-2] Telefon 1 / Telefon 2 mevcut aksiyonlu kartlar olarak korunmuştur. Telefon 3+ bu sprintte readonly / görüntüleme-only gösterilmiştir. Telefon 3+ için aksiyon/persistence eklenmemiştir. `+N numara daha göster` / `Daha az göster` davranışı sağ kişi kartında kabul edilmiştir. CSS değişikliği yapılmadan mevcut yapı içinde dar UI geçişi tercih edilmiştir. Telefon 3+ seçim/call log/validation/shortcut ilişkisi ayrı discovery gerektirir. Excel çoklu telefon import ayrı discovery/implementation gerektirir.
- [Sprint 9.3F-1] Telefon 3+ için yalnızca call save selection eklendi. Telefon 3+ selected phone state üzerinden `contacted_phone_id` olarak call log kaydına bağlandı. `callLogWriter` değiştirilmedi; mevcut dynamic phone context altyapısı kullanıldı. Schema/storage migration yapılmadı. Telefon 3+ için yanlış/kullanılmıyor aksiyonu ve son görüşülen status aksiyonu eklenmedi. Shortcut sistemi değiştirilmedi; T/Y/X mevcut Telefon 1/2 davranışını korur. Validation mesajı Telefon 1/2'ye özel olmaktan çıkarılıp genel hale getirildi. Telefon 3+ status aksiyonları ayrı discovery gerektirir. Excel çoklu telefon import ayrı discovery/implementation gerektirir.
- [Sprint 9.3G-2] Excel İçe Aktar ekranında progressive disclosure uygulanmıştır. Kolon Eşleştirme, Hatalar ve Uyarılar listeleri uzun olduğunda kademeli gösterilir; bu karar kullanıcıyı uzun import review listeleriyle boğmamak için alınmıştır. Import engine, writer, simulation ve mapping definitions değiştirilmemiştir. Telefon 3-10 mapping/import, AD/SOYAD, Anne/Baba ve Mahalle bu sprintin kapsamı değildir. Mahalle ve veli modeli gibi data-model işleri plansız şekilde UI sprintine karıştırılmamalıdır. Çoklu telefon import mapping/simulation ve çoklu telefon import writer ayrı sprint gerektirir. Export/report/backup uyumu ayrı discovery gerektirir.
- [Sprint 9.3G-4] Multi-phone import mapping/simulation uygulandı. Telefon 3-10 mapping key'leri eklendi. Simulation internal modeli `phones[]` array yaklaşımını taşır; `phone_1` / `phone_2` backward compatibility korunur. `importWriter.ts` değiştirilmedi; Telefon 3-10 gerçek DB yazımı bu sprintin kapsamı değildir. Schema/storage migration yapılmadı. Ad/Soyad, Anne/Baba, Mahalle, export/report/backup bu sprintin kapsamı değildir. Writer sprinti yapılmadan “Telefon 3-10 tam import edildi” denmemelidir. Obsidian resmi kayıt değildir; bu docs closure sonrası Obsidian update ayrıca değerlendirilir.
- [Sprint 9.3G-5] Multi-phone import writer/persistence uygulandı. Writer `row.phones[]` varsa Telefon 1-10 phone records yazar; `row.phones[]` yoksa `phone_1` / `phone_2` fallback korunur. `phone_label` ve `reference_label` birlikte yazılır; `priority`, `source_column`, `original_phone_value` ve `is_valid` korunur. Invalid ama non-empty phones DB'ye `is_valid: false` ve `is_wrong: false` olarak yazılır. `search_text`, `row.phones[]` içindeki tüm `normalized_phone_number` değerlerini içerir. Schema/storage/version değişmedi. Export/report/backup, Ad/Soyad, Anne/Baba ve Mahalle bu sprintin kapsamı değildir. Graphify pasif yardımcı analiz aracı olabilir ama resmi kayıt değildir; çıktısı doğrudan uygulanmaz/commit edilmez/Obsidian'a otomatik yazılmaz. Obsidian resmi kayıt değildir; repo docs resmi kayıttır. Dar pilot öncesi Telefon 3-10 import hattı ana eşik olarak tamamlanmıştır; pilot readiness için manual QA ve kırıcı risk kontrolü ayrıca yapılmalıdır.
- [Phone-Level Outcome Read Model Pilot] Telefon bazlı son görüşme sonucu ilk aşamada `call_logs` kaynaklı read model olarak uygulanmıştır. `PhoneRecord` üzerine kalıcı outcome alanı eklenmez, `phone_status` call result saklamak için yeniden anlamlandırılmaz ve schema migration yapılmaz. Sağ kartta Telefon 1/2 ve Telefon 3+ için read-only `Son sonuç` göstergesi gösterilir; kaynak önceliği `contacted_phone_id`, `phone_snapshot.phone_id`, `phone_id`, normalized phone number fallback şeklindedir.
- [Phone-Level Outcome Read Model Pilot] Sağ karttaki ✓ / x kontrolleri şimdilik korunur. ✓ son görüşülen/arama telefonu seçimi, x yanlış numara/kullanılmıyor davranışı olarak kalır. Bu kontrollerin sadeleştirilmesi veya phone-level outcome UI'a dönüştürülmesi ayrı bir discovery konusudur.
- [Roadmap] Akıllı Operasyon Yardımcıları gelecekte offline/rule-based/testable helper yaklaşımıyla değerlendirilebilir; Telefon Kalitesi, Arama Öncelik, Hatırlatma Öneri, Veri Kalitesi ve Yönetici Özet yardımcıları aday fikirlerdir. Dış AI/LLM ancak KVKK, gizlilik, offline-first ve maliyet discovery sonrasında ele alınır; mevcut 9.3G hattına dahil edilmez.
- [Roadmap] Kullanım kitapçığı pilot öncesi hazırlanacak.
- [Roadmap] Manuel pilot kontrol checklist’i çalıştırılacak.
- [Roadmap] Pilot sonrası bulgular ayrı Pilot Feedback Fixes kapsamında ele alınacak.
- [Roadmap] Reports Dashboard Polish pilot sonrası ayrı sprint olarak değerlendirilecek.
- [Roadmap] Mobile Drawer Polish ayrı sprint olarak yapılacak.
- [Roadmap] Mobile Table/Card View Polish ayrı sprint olarak değerlendirilecek.
- [Roadmap] Çoklu Telefon Mimarisi uygulaması Sprint 9.3–9.6 olarak parçalara bölünecek: Çoklu Telefon Core, Import / Duplicate / Export, UI / Sağ Kişi Kartı ve Responsive Polish.
- [Roadmap] Akıllı Yardımcılar offline/kural tabanlı olacak; dış AI API kullanılmayacak.
- [Roadmap] Figma/Stitch UI fikirleri kontrollü uygulanacak; büyük dönüşüm kullanıcı onayı olmadan yapılmayacak.

## Değişen Kararlar Nasıl Yazılır?

Bir karar değişirse eski madde silinmeden “Eski karar / Yeni karar / Neden değişti” şeklinde kısa not eklenir.

## Current Product Decision - Appointment Model C+

- [Decision State] `Appointment Model C+ — Gerçek randevu + veliye mesaj görevi + randevu alarmı` APPROVED. Implementation başlamadı; schema/migration/backfill yetkisi yoktur. Önce implementation architecture discovery ve test matrix yapılacaktır.
- [Call Later Boundary] `call_later` görüşme kaydı, pending `reminder_type: call` kaydı, alarm/list ve mevcut edit/complete/cancel/delete lifecycle'ı ile aynen korunur. Model C+ bu davranışı değiştirmez.
- [Canonical Appointment] `appointment` sonucunda ayrı veya sahte `call` ReminderRecord oluşturulmaz. Yeni davranışta gerçek AppointmentRecord canonical planlı etkinliktir; student, owner call log, tarih/saat ve not ile atomik mümkün olan sınırda bağlanır. Owner yönü `appointment.call_log_id → owner call log`, modern ters yön `call_log.created_appointment_id → appointment.id` olacaktır.
- [Owner Integrity] Bir call log en fazla bir aktif canonical appointment oluşturabilir. Aynı öğrencinin farklı görüşmelerden birden fazla açık appointment'ı olabilir. Aynı owner call log'a birden fazla aktif appointment bağlanırsa işlem fail-closed olur. Reminder owner/shared cancellation kuralları appointment'a körlemesine uygulanmaz; legacy bağlantı fallback'i gerçek veriye göre discovery'de kararlaştırılır.
- [Appointment Lifecycle] Appointment durumları ürün dilinde `pending`, `completed`/Geldi, `no_show`/Gelmedi ve `cancelled`/İptal olacaktır. Pending appointment düzenlenebilir, ertelenebilir, tamamlanabilir, no-show veya iptal edilebilir. Terminal appointment reopen almaz; owner call log ve öğrenci kaydı korunur.
- [Guardian Message Task] Her pending appointment için personele manuel veli mesajı görevi gösterilir. Sistem SMS, WhatsApp veya başka bir mesajı otomatik göndermez. `Mesaj Gönderildi` yalnız bu görevi tamamlar; appointment status'unu, randevu zamanı alarmını, call log'u veya öğrenci kaydını değiştirmez.
- [Guardian Message Due Time] Europe/Istanbul yerel saatinde randevu saati 00.00–11.59 ise görev `appointment_at - 24 saat`; 12.00–23.59 ise `appointment_at - 22 saat` hesaplanır. Elde edilen yerel saat 19.00'dan sonraysa aynı takvim gününde 19.00'a sabitlenir; tam 19.00 değiştirilmez. Hesaplanan görev zamanı geçmişte kalan gelecekteki appointment, görünmez kayıt yerine hemen due/overdue görünür.
- [Reschedule] Erteleme aynı AppointmentRecord'u günceller; önceki randevu zamanı alarmı ve açık mesaj görevi geçersiz olur, yeni tarih için yeni pending mesaj görevi hesaplanır. Daha önce mesaj gönderildi işaretlenmiş olsa bile reschedule sonrası yeni görev açılır. Reschedule append-only audit gerektirir.
- [Terminal Appointment] `completed`, `no_show` veya `cancelled` durumunda pending veli mesaj görevi kapanır/iptal edilir; randevu zamanı alarmı pending gösterilmez. Appointment geçmiş kaydı korunur. Appointment/reminder tarafında otomatik reopen yoktur.
- [Alarm/List Semantics] Aynı operasyon alanı `Arama`, `Veli Mesajı` ve `Randevu` tiplerini semantik olarak ayrı göstermelidir. Appointment kimliği ReminderRecord kimliği yerine kullanılmaz; aynı appointment için duplicate alarm/kart üretilmez. Exact reader ve UI birleşimi implementation discovery'de belirlenecektir.
- [Audit] Appointment create, edit, reschedule, complete, no-show, cancel; guardian message marked sent ve reschedule sonrası task reset append-only audit gerektirir. Exact marker adları mevcut audit naming standardı üzerinden implementation discovery'de belirlenecektir.
- [Export / Backup] Veli mesaj görevi normal Excel/PDF/operasyon exportuna girmez; audit normal exporta girmez. Mevcut appointment export kontratı tahminle genişletilmez. Full System Backup/restore appointment, appointment status, mesaj görevi durumu, `Mesaj Gönderildi` bilgisi ve audit'i korumalı; restore completed task'i yeniden pending yapmamalıdır.
- [Historical Data] Eski `appointment` call log'larında tarih/saat kalıcı olmadığı için otomatik backfill, tarih tahmini veya sahte appointment üretimi yapılmaz. Mevcut gerçek AppointmentRecord kayıtları silinmez/dönüştürülmez. Migration gereksinimi implementation discovery kanıtına göre ayrıca kararlaştırılır.
- [Out of Scope] Otomatik SMS/WhatsApp, harici mesaj sağlayıcı, kullanıcı seçilebilir lead-time ayarı, snooze/tekrar bildirim politikası, appointment reopen, historical backfill, reminder cancellation redesign ve `✓ + ⋯` action-menu UX bu kararın kapsamı dışındadır.

## Latest Decisions - Cancel Pending Linked Call Reminder

- [Cancellation Completion] `e15a051 feat: cancel pending linked reminders` ile cancellation uygulandı ve origin'e pushlandı. Kapsam yalnız `pending`, `reminder_type: call`, bağlı call-log'u bulunan gerçek owner/current history satırıdır. Completed/cancelled, bağlantısız, call dışı ve tarihsel/shared reference satırları aksiyon almaz; RemindersPage doğrudan aksiyonu, reminder reopen, appointment lifecycle ve genel lifecycle refactor kapsam dışıdır.
- [Owner / Current Integrity] Authoritative owner yönü `reminder.call_log_id → owner call log`dur. Modern owner `ownerCallLog.created_reminder_id === reminder.id` ile doğrulanır; güvenli legacy fallback yalnız null/undefined back-link, aynı öğrenci, aktif owner ve tekil pending owner bağlantısında kabul edilir. Başka call log'lardaki aynı `created_reminder_id` tarihsel/shared reference olabilir; owner cancellation'ı bloklamaz ve kendi satırlarında aksiyon oluşturmaz. Aynı owner'a bağlı birden fazla aktif pending reminder fail-closed'dur; terminal ikinci reminder conflict sayılmaz.
- [Appointment Boundary] Owner call log üzerinde appointment bulunması tek başına cancellation'ı bloklamaz. Cancellation yalnız reminder status'unu değiştirir; appointment, call log, student summary ve PhoneRecord mutate edilmez. Dependency bütünlüğü belirsizse işlem fail-closed'dur. Appointment lifecycle ayrı discovery konusudur.
- [Cancellation Reason / UI] İptal nedeni opsiyonel kısa metindir; trim edilmiş boş değer `null` kabul edilir ve reminder modeline yeni alan eklenmeden audit payload'ında saklanır. UI yalnız StudentsPage owner satırındadır: `Hatırlatmayı İptal Et`, tooltip/aria `Hatırlatmayı iptal et`, modal `Hatırlatma iptal edilsin mi?`, ikincil `Vazgeç`, destructive `Hatırlatmayı İptal Et`. Completion modalının ikincil eylemi de `Vazgeç` olarak netleştirildi.
- [Cancellation Lifecycle] Yalnız `pending → cancelled` izinlidir. `completed → cancelled`, `cancelled → pending`, `cancelled → completed` ve tekrar cancellation reddedilir; cancelled reminder edit veya reopen almaz. Yeni bir `call_later` gerektiğinde mevcut writer kurallarıyla yeni reminder oluşturulur. Cancellation reminder veya call-log deletion değildir.
- [Cancellation Audit / Transaction] Cancellation append-only `action_type: update` ve `field_name: pending_reminder_cancel` ile kaydedilir. Reminder update ve audit Dexie `reminders + call_logs + audit_logs` transaction'ında atomiktir; audit yazılamazsa cancellation rollback olur. Cancellation audit preview history'ye eklenmez; mevcut edit audit preview korunur.
- [Backup / Export / Reporting] `NO MIGRATION`; `NO BACKFILL`. Full System Backup cancelled status ve audit'i korur; pending reader/list/alarm/count yalnız pending kayıtları gösterir. Normal export audit payload'ını taşımaz; yeni KPI veya raporlama metriği eklenmez.
- [Deferred Notes] Duplicate-owner doğrulamasının full reminder scan maliyeti non-blocking performance notudur; veri hacmi büyürse ayrı discovery gerekir. İletişim geçmişi action barında görünür `✓` ve diğer aksiyonların `⋯` menüsünde toplanması ayrı future UX işidir.
- [Decision State] Implementation, Strategy Review, manuel QA, feature commit/push, Windows VDS deployment, live QA, repo docs closure ve docs commit/push COMPLETE. Appointment lifecycle ayrı Model C+ product decision olarak onaylandı; implementation başlamadı.

## Latest Decisions - Pending Linked Reminder Edit

- [Pending Linked Reminder Edit] Hatırlatma düzenleme aksiyonu yalnız gerçek owner/current call-log satırında görünür. Pending call reminder için tarih, saat ve not düzenlenebilir; shared/eski history satırları değişmez.
- [Reminder Edit Integrity] Reminder edit, reminder tarih/saat/notunu ve owner call-log görünür notunu aynı transaction içinde günceller. Tarihsel call-log snapshot'ı, reminder linkleri ve diğer shared call-log satırları korunur.
- [Reminder Edit Audit] Her başarılı reminder edit, `pending_reminder_edit` marker'lı append-only reminder audit üretir. Preview gerçek owner satırında pending, completed ve cancelled durumlarında kalır; deleted reminder veya appointment-linked satır preview üretmez.
- [Reminder Lifecycle] Pending reminder edit/complete edilebilir. Completed/cancelled reminder tekrar pending yapılmaz, edit/complete aksiyonu göstermez; audit preview korunur.
- [Lifecycle-Aware Correction] Bağımsız call log full correction alır. Active linked reminder/appointment normal correction için blokludur. Terminal linked reminder/appointment yalnız note-only correction alır; missing entity ve conflict dependency fail-closed'dur.
- [Note-Only Boundary] Note-only correction call time, result, phone context, dependency linkleri, reminder/appointment lifecycle'i veya student summary alanlarını değiştiremez. Service-level policy ve save-time yeniden doğrulama ana güvenlik katmanıdır.
- [Correction Audit / Export / Backup] Başarılı full veya note-only correction `call_log_correction` marker'lı append-only audit üretir; mutation ve audit aynı transaction içindedir. Normal export audit payloadlarını içermez; Full System Backup audit kayıtlarını korur.

## Previous Decisions - Stale Reminder Date Guard Fix

- [Call Reminder Creation Guard] Call reminder create/update yalnız `call_later` sonucu için yapılır.
- [Call Reminder Creation Guard] Non-reminder call result kayıtları stale `reminder_at` taşısa bile call reminder create/update yapmamalıdır.
- [Call Reminder Creation Guard] Service layer, UI state'e güvenmeden reminder creation guard'ını uygular; `callLogWriter` non-`call_later` sonuçlarda `created_reminder_id`, `reminder_at` ve `next_action` alanlarını null bırakır.
- [Stale Reminder Form State] UI, `call_later` dışına geçerken stale `reminderDate` / `reminderTime` state'ini temizlemelidir. Linked quick complete sonrası aynı state temizlenir.
- [Scope Boundary] Existing pending reminder, terminal/non-reminder result ile otomatik cancelled veya completed yapılmaz. Appointment lifecycle redesign ve every-call-later-creates-separate-reminder product change bu fix'in kapsamı değildir.
- [Historical Pending Reminder Edit UX Backlog] Bu önceki backlog `93b4471` ile çözüldü. Güncel owner-only edit, audit preview ve lifecycle-aware correction kararları üstteki Pending Linked Reminder Edit bölümündedir.

## Latest Decisions - Linked Reminder Owner Row Visibility Fix

- [Linked Reminder Owner Row Visibility] `Hatırlatmayı tamamla` aksiyonu aynı pending reminder'a bağlı geçmiş satırların tamamında değil, yalnız owner/current iletişim geçmişi satırında görünür.
- [Linked Reminder Shared Reference] Aynı pending reminder birden fazla call log satırında referanslanabilir; çünkü `callLogWriter` aynı adayda mevcut pending reminder varsa yeni reminder oluşturmak yerine mevcut reminder'ı günceller. Bu davranış bu sprintte değiştirilmedi.
- [Linked Reminder Owner Source] Owner önceliği `reminder.call_log_id` alanıdır. Bu alan eksik/stale ise read model aynı reminder id'ye bağlı aktif call loglar içinde latest `call_time`, sonra `created_at`, sonra `id` fallback'iyle owner satırı seçer.
- [Linked Reminder Complete Semantics] `completeReminder` yalnız verilen reminder kaydını completed yapar; bulk update yapmaz. Bu helper, call log writer, delete guard, schema/import/export/backup ve WhatsApp davranışı değişmeden korunur.
- [Historical Linked Reminder Scope] Owner-row visibility checkpoint'i sırasında cancel reminder action backlog/discovery konusu idi; ihtiyaç daha sonra `e15a051` ile uygulandı. Reminder lifecycle redesign ve strict-owner write model değişiklikleri ayrı discovery konusu olarak kalır.

## Latest Decisions - Linked Reminder Quick Complete

- [Linked Communication History Delete Policy] Linked call log delete/void kararı artık terminal status-aware çalışır. Pending reminder bağlantılı call log doğrudan silinmez; completed/cancelled reminder bağlantılı call log soft delete edilebilir.
- [Linked Appointment Delete Policy] Pending appointment ve postponed appointment bağlantılı call log kayıtları bloklu kalır; terminal appointment status'ları soft delete için uygundur. Status source of truth kabul edilir; yalnız date-only geçmişlik kriteri kullanılmaz.
- [Linked Reminder Quick Complete] Sağ kart iletişim geçmişindeki pending reminder bağlantılı satır, küçük icon-only `Hatırlatmayı tamamla` aksiyonu gösterebilir.
- [Linked Reminder Quick Complete] Aksiyon reminder `status` değerini `completed` yapar. Call log silinmez, link detach edilmez, aday özeti değiştirilmez; sonrasında mevcut delete guard doğal olarak soft delete'e izin verir.
- [Linked Reminder UI] Büyük yazılı yeşil buton kullanılmaz. Anlam title/aria/confirmation modal üzerinden verilir; satır içinde ek açıklama metniyle kalabalık yaratılmaz.
- [Historical Linked Reminder Scope] Reminder cancel button quick-complete sprintinin kapsamı dışındaydı ve daha sonra `e15a051` ile ayrı feature olarak eklendi. Appointment quick action, Reminders sayfasına navigasyon, Students page state preservation, reminder/appointment lifecycle redesign, export/import/backup formatı, Reporting V2 metrikleri ve WhatsApp flow değişiklikleri kapsam dışıdır.

## Latest Decisions - Reporting V2 Summary MVP

- [Reporting V2 Summary MVP] Raporlar sayfasındaki V2 alanı read-only yönetici özeti olarak kabul edilir. Günlük rapor korunur; Reporting V2 mevcut günlük raporun yerine geçmez.
- [Reporting V2 Data Source] Reporting V2 metriklerinin kaynağı aktif `call_logs` kayıtlarıdır. `deleted_at` olan call log kayıtları dışlanır.
- [Reporting V2 Date Range] Tarih aralığı `call_time`, yoksa `created_at` üzerinden ve local day start/end sınırlarıyla hesaplanır.
- [Reporting V2 Unique Students] `İşlem gören tekil aday`, seçili tarih aralığında en az bir aktif call log'u olan farklı öğrenci/adayı ifade eder.
- [Reporting V2 Result Counts] `Randevu Verildi` ve `Kayıt Oldu` metrikleri CRM `call_result` sayımlarıdır. Bunlar gerçek veli geldi/gelmedi, no-show, personel performansı veya kesin kayıt lifecycle metriği olarak yorumlanmaz.
- [Reporting V2 Campaign Breakdown] Kampanya kırılımı adayın güncel `students.campaign_id` değerine göre hesaplanır. Call log üzerinde kampanya snapshot tutulmaz; adayın kampanyası sonradan değişirse geçmiş rapor kırılımı da değişebilir.
- [Reporting V2 UI Note] Kampanya kırılımının güncel aday kampanyasına göre hesaplandığı bilgisi kullanıcıya UI notu olarak gösterilir.
- [Reporting V2 Scope] Personnel/team performance, gelen veli/no-show, gerçek kayıt lifecycle, export/report expansion, schema/migration ve import/export/backup değişiklikleri bu MVP kapsamında değildir.
- [Reporting V2 Polish] UI polish ayrı `reporting-v2-*` CSS sınıflarıyla yapılır; daily report alanı ve metric calculation logic değiştirilmez.

## Latest Decisions - Communication History Soft Delete

- [Communication History Soft Delete Pilot] Iletisim gecmisi silme davranisi hard delete degil soft delete olarak uygulanir. `call_logs.deleted_at` ve `updated_at` set edilir; kayit DB'de kalir ama aktif history/read model aklarindan gizlenir.
- [Communication History Soft Delete Pilot] Soft delete sonrasi ogrenci son gorusme ozeti kalan aktif `call_logs` kayitlarindan yeniden hesaplanir. `last_call_result`, `last_contacted_at`, `last_contacted_phone_id` aktif son kayda gore guncellenir; aktif kayit kalmazsa `not_called` / `null` guvenli bos durum kullanilir.
- [Communication History Soft Delete Pilot] `created_reminder_id` veya `created_appointment_id` bulunan call log kayitlari bu MVP'de silinmez. Reminder/appointment cascade delete, detach veya otomatik iptal yapilmaz; bu politika ayri discovery konusudur.

## Latest Decisions - Communication History Edit / Void MVP

- [Communication History Edit / Void MVP] Bağlantısız iletişim geçmişi kayıtları düzeltilebilir/düzenlenebilir. Düzeltme kapsamı görüşme durumu, not, tarih/saat ve telefon bağlamıyla sınırlıdır.
- [Communication History Edit / Void MVP] Bağlantısız iletişim kayıtları `Geçersiz Say / Sil` ile mevcut soft delete altyapısını kullanır. Hard delete yapılmaz; `call_logs.deleted_at` ve `updated_at` set edilir.
- [Communication History Edit / Void MVP] Edit/delete sonrası aday özeti aktif ve silinmemiş `call_logs` kayıtlarından yeniden hesaplanır. Aktif kayıt yoksa güvenli boş durum `not_called` / `null` olur.
- [Communication History Edit / Void MVP] İlk MVP'de `created_reminder_id` veya `created_appointment_id` taşıyan call log kayıtları edit/delete için bloklanıyordu. Son linked delete policy delete/void tarafını terminal status-aware hale getirir; linked edit blokları, reminder/appointment cascade, detach, otomatik iptal ve lifecycle redesign kapsam dışı kalır.
- [Communication History Edit / Void MVP] PhoneRecord `phone_status`, `is_wrong` ve `call_outcome` alanları edit/delete sırasında mutate edilmez; telefon bazlı durumlar ayrı model semantiğini korur.
- [Communication History Edit / Void MVP] Reports/export aktif call log kayıtları üzerinden doğal güncellenir. Backup ham tabloları koruduğu için soft-deleted kayıtlar yedekte kalır. Schema/migration, import/export formatı, backup/restore formatı ve WhatsApp davranışı değişmez.

## Latest Decisions - Phone Action Label Clarification / Helper Cleanup

- [Phone Action Labels] Telefon kartındaki ✓ aksiyonu `Bu görüşmede kullanılacak telefon` anlamındadır ve mevcut seçim davranışını korur.
- [Phone Action Labels] X aksiyonu `Telefonu yanlış / kullanılmayacak olarak işaretle` anlamındadır; `phone_status` / `is_wrong` davranışını korur, telefonu seçilebilir listeden düşürür ve `call_outcome` değiştirmez.
- [Phone Outcome Dropdown] Telefon outcome dropdown telefon bazlı manuel sonuç alanıdır. Yalnız `call_outcome` yazar; `phone_status`, `is_wrong`, aday genel görüşme sonucu ve call log akışını değiştirmez.
- [General Call Result] Genel Görüşme Durumu aday genel görüşme sonucu / call log kaydı anlamını korur; call log ve student summary akışı değişmez.
- [Helper Cleanup] Görünür `Bu telefonun son arama sonucu` ve `Bu seçim iletişim geçmişine kayıt olarak işlenir.` helper yazıları kaldırılmıştır. Anlam aria/title gibi erişilebilirlik yüzeylerinde gerektiği kadar korunabilir.
- [Scope] X kaldırılmadı, dropdown davranışı değiştirilmedi, X/dropdown semantiği birleştirilmedi, PhoneRecord alanları değiştirilmedi, call log validation değiştirilmedi, export/backup/import/WhatsApp değiştirilmedi ve büyük UI redesign yapılmadı.

## Latest Decisions - Import AD/SOYAD Composition

- [Import AD/SOYAD Composition Pilot] Separate `AD` and `SOYAD` columns are supported only at import/simulation level. The persistent source of truth remains `students.student_full_name`; no `first_name` / `last_name` DB fields are added.
- [Import AD/SOYAD Composition Pilot] Full-name columns such as `Ad Soyad` / `Ogrenci Ad Soyad` win over split `AD` / `SOYAD`. If both are present, import continues with warning: `Tam ad alanı bulunduğu için Ad/Soyad alanları birleştirme için kullanılmadı.`
- [Import AD/SOYAD Composition Pilot] If only `AD` is present, import may create `student_full_name` from `AD` with warning: `Soyad alanı bulunamadı; öğrenci adı yalnızca Ad alanından oluşturuldu.`
- [Import AD/SOYAD Composition Pilot] If only `SOYAD` is present, the row is blocked with: `Soyad alanı tek başına öğrenci adı oluşturmak için yeterli değil.`
- [Import AD/SOYAD Composition Pilot] `Veli Adi`, `Anne adi`, and `Baba Adi` are not student name aliases. Anne/Baba guardian import, Mahalle/Ilce support, export/report changes, backup/restore changes, and schema changes remain out of scope.

## Latest Decisions - Parent / Location Import

- [Parent/Location Import Decision] Anne/Baba import will not be included in the next small import slice. It requires a later guardian/contact model decision before implementation.
- [Parent/Location Import Decision] Anne/Baba fields must never be used to compose `student_full_name`, and must not overwrite the existing `Veli Ad Soyad` / `guardian_full_name` behavior.
- [Parent/Location Import Decision] If Anne/Baba is implemented later, it should be modeled as related guardian/contact data with an explicit relation decision, not as a shortcut into the current primary Veli field.
- [Parent/Location Import Decision] Mahalle/Ilce is the accepted smaller next candidate, but must not be stored in `general_note` as a hack. If implemented, it likely needs explicit optional student fields.
- [Parent/Location Import Decision] Export, search, backup, and restore impact for Mahalle/Ilce must be accepted before implementation. No export/report/backup/schema behavior should be changed incidentally.
- [Parent/Location Import Decision] AD/SOYAD composition and Telefon 1-10 mapping/import/export behavior are protected and must remain unchanged in parent/location follow-up work.
- [Parent/Location Import Decision] `dev-server.log` is a local untracked runtime file. It must not be staged, committed, deleted, or treated as product documentation.

## Latest Decisions - Mahalle / Ilce Import Pilot

- [Mahalle/Ilce Import Pilot] Mahalle and Ilce are supported as optional student location fields: `neighborhood` and `district`.
- [Mahalle/Ilce Import Pilot] Location fields are stored directly on `StudentRecord` as optional non-indexed fields. Dexie schema version was not changed and `src/db/schema.ts` / `src/db/db.ts` remain unchanged.
- [Mahalle/Ilce Import Pilot] Mahalle/Ilce must not be stored in `general_note`.
- [Mahalle/Ilce Import Pilot] Empty Mahalle/Ilce, only Mahalle, and only Ilce are all allowed and do not block import.
- [Mahalle/Ilce Import Pilot] The student drawer may show a small read-only `Mahalle / Ilce` line when location data exists.
- [Mahalle/Ilce Import Pilot] AD/SOYAD composition, Telefon 1-10 slot fidelity, and Veli/Anne/Baba student-name safety behavior remain unchanged.
- [Mahalle/Ilce Import Pilot] Anne/Baba import and guardian/contact model changes remain deferred.
- [Mahalle/Ilce Import Pilot] Export expansion, report expansion, search/filter expansion, backup/restore behavior changes, province/address hierarchy, and indexed location fields remain out of scope.
- [Mahalle/Ilce Import Pilot] Do not immediately start Anne/Baba implementation. The next recommended step is `DISCOVERY — Agent Context / Repo Hygiene Standardization`.

## Latest Decisions - Playwright Import E2E Smoke Pilot

- [Playwright Import E2E Smoke Pilot] Browser-level automated QA is introduced as a narrow pilot, not as the full import regression matrix.
- [Playwright Import E2E Smoke Pilot] The first scope is one real-browser import smoke flow only: runtime-generated Excel upload, AD/SOYAD composition, Mahalle/Ilce, phone import, manual `Veli Adi` -> `Veli Ad Soyad` mapping, completing import, selecting the imported student, and checking right drawer values.
- [Playwright Import E2E Smoke Pilot] Runtime `.xlsx` fixtures are generated with the existing `xlsx` dependency. Binary Excel fixture files are not committed for the first pilot.
- [Playwright Import E2E Smoke Pilot] `test-results/` is generated test output and must stay ignored. `dev-server.log` remains a local untracked runtime file and must not be staged.
- [Playwright Import E2E Smoke Pilot] Full Telefon 1-10 E2E, Telefon 10-only, empty/partial Mahalle/Ilce, Anne/Baba safety, export E2E, backup/restore E2E, CI integration, and broad `data-testid` coverage are deferred to later phases.
- [Playwright Import E2E Smoke Pilot] Recommended next automated QA phase is `Phase 2 - Import Regression Matrix`.

## Latest Decisions - Playwright Import Regression Matrix Phase 2A

- [Playwright Import Regression Matrix Phase 2A] The original import smoke test remains intact; regression coverage is kept in the separate `e2e/import-regression.spec.ts` file.
- [Playwright Import Regression Matrix Phase 2A] The existing `qa:import:e2e` command is the single local import browser-QA command and runs both smoke and regression specs.
- [Playwright Import Regression Matrix Phase 2A] The first regression matrix is deliberately limited to three high-value scenarios: Telefon 1-10 preservation, empty Mahalle/Ilce acceptance with no empty drawer line, and Anne/Baba student-name safety.
- [Playwright Import Regression Matrix Phase 2A] Runtime Excel generation remains the fixture strategy. Binary `.xlsx` files are not committed.
- [Playwright Import Regression Matrix Phase 2A] Import E2E uses one Playwright worker for stability. Broad selector instrumentation and CI integration are deferred until real flakiness or pipeline need appears.
- [Playwright Import Regression Matrix Phase 2A] This automated QA expansion does not authorize production import logic, schema, export, backup, restore, or UI behavior changes.
- [Playwright Import Regression Matrix Phase 2A] Telefon 10-only, only-Mahalle, only-Ilce, invalid/duplicate phone, duplicate import warning, export E2E, and backup/restore E2E remain later candidates.

## Latest Decisions - Guardian Contact Model

- [Guardian Contact Model Decision] Anne/Baba/Veli bilgileri için mevcut `guardians` tablosu kullanılacaktır. Yeni `guardian_contacts` tablosu veya `StudentRecord` üzerinde tekrar eden parent alanları oluşturulmayacaktır.
- [Guardian Contact Model Decision] İlişki anahtarları `guardian` = Veli, `mother` = Anne ve `father` = Baba olarak standartlaştırılacaktır. Legacy `relation_type: null` kayıtları geriye uyumluluk için Veli kabul edilecektir.
- [Guardian Contact Model Decision] Aynı ad Veli ve Anne/Baba kolonlarında bulunsa bile yalnızca isim benzerliğine göre birleştirme veya ilişki tahmini yapılmayacaktır; kaynak kolon semantiği korunacaktır.
- [Guardian Contact Model Decision] Anne Adı, Baba Adı ve Veli Ad Soyad hiçbir koşulda öğrenci adı kaynağı değildir. Öğrenci adı yalnızca onaylı öğrenci adı kolonlarından oluşturulur; öğrenci adı olmayan satır parent bilgileriyle öğrenci oluşturamaz.
- [Guardian Contact Model Decision] İlk kod dilimi yalnızca Anne/Baba isimlerini kapsayacaktır: import mapping, simulation, guardian persistence, reader ayrıştırması ve sağ kartta yalnızca dolu Veli/Anne/Baba satırları. Parent phone relation, export ve backup değişiklikleri bu dilime dahil değildir.
- [Guardian Contact Model Decision] UI'da `ilişki bilinmiyor`, `unknown relation`, `ilişkilendirilmiş telefon yok` veya `telefon yok` gibi teknik/boş durum metinleri gösterilmeyecektir.
- [Guardian Contact Model Decision] Generic `GSM`, `Tel1`, `Telefon 3` gibi telefon kolonları Anne/Baba olarak yorumlanamaz. Yalnızca açık `ANNE TEL` / `BABA TEL` benzeri kolonlar ileride ilişki etiketi taşıyabilir.
- [Guardian Contact Model Decision] Numaralı telefon kolonları ilan edilen slotu korur. Numarasız ve ilişki belirten telefon kolonları Excel kolon sırasına göre sonraki boş Telefon N slotuna yerleşir; Anne/Baba telefonları Telefon 1/2'ye sıkıştırılmaz.
- [Guardian Contact Model Decision] `No`, telefon aliası değildir. `No1/No2/Numara N` ailesi öğrenci numarasıyla karışabileceği için ancak dar eşleştirme ve açık testlerle değerlendirilecektir.
- [Guardian Contact Model Decision] Detaylı export ve Özet Görüşme Raporu ileride Anne Adı/Baba Adı ile Telefon 1-10'u taşıyacak şekilde genişletilecektir. İlişki durumu veya bilinmeyen ilişki kolonları eklenmeyecektir.
- [Guardian Contact Model Decision] Tam Sistem Yedeği eksiksiz restore kaynağıdır. Mevcut `guardians` ve `phones` tabloları yeniden kullanılacak; ileride açık backup/restore roundtrip testi eklenecektir.
- [Guardian Contact Model Decision] `Telefonsuz adayları içe aktar` ayarı ilk sürümde import oturumuna özel ve varsayılan kapalı olacaktır. Ayar kapalıyken telefonsuz aday bloklanır; açıkken warning ile içe alınabilir. Öğrenci adı olmayan satır her durumda bloklanır.

## Latest Decisions - Guardian Parent Names Import Pilot

- [Guardian Parent Names Import Pilot] Anne/Baba names-only import tamamlandı. Kalıcı kaynak mevcut `guardians` tablosudur; `StudentRecord` üzerine duplicate parent alanları ve yeni tablo eklenmedi.
- [Guardian Parent Names Import Pilot] Import mapping `mother_full_name` ve `father_full_name` hedeflerini taşır. Anne/Baba/Veli alanları öğrenci adı composition kaynağı değildir; öğrenci adı olmayan satır parent bilgileriyle oluşturulmaz.
- [Guardian Parent Names Import Pilot] Writer Veli, Anne ve Baba için `guardian`, `mother`, `father` relation kayıtlarını ayrı oluşturur. İsim eşitliğine göre relation merge veya tahmin yapılmaz.
- [Guardian Parent Names Import Pilot] Generic telefonlar Anne/Baba kayıtlarına atanmaz. Explicit ANNE TEL/BABA TEL mapping ve doğru parent `guardian_id` bağlantısı sonraki dilimdir.
- [Guardian Parent Names Import Pilot] Student reader relation-aware çalışır ve legacy `relation_type: null` kayıtlarını Veli kabul eder.
- [Guardian Parent Names Import Pilot] Sağ drawer yalnızca dolu `Veli Ad Soyad`, `Anne Adı`, `Baba Adı` satırlarını gösterir; boş veya teknik relation/no-phone metni göstermez.
- [Guardian Parent Names Import Pilot] Schema, export, backup/restore, no-phone import setting, source-column display ve Playwright senaryoları değiştirilmedi.
- [Guardian Parent Names Import Pilot] Sonraki önerilen kod dilimi explicit ANNE TEL/BABA TEL phone relation'dır; Telefon 1-10 slot fidelity korunmalı ve generic kolonlardan parent ilişkisi çıkarılmamalıdır.

## Latest Decisions - Explicit Guardian Phone Relations Pilot

- [Explicit Guardian Phone Relations Pilot] Yalnizca acik Anne/Baba telefon kolonlari parent relation metadata uretebilir. `ANNE TEL`, `Anne GSM`, `BABA TEL`, `Baba GSM` gibi aliaslar desteklenir; generic `GSM`, `GSM2`, `Tel1`, `Telefon 1` Anne/Baba olarak yorumlanmaz.
- [Explicit Guardian Phone Relations Pilot] Parent relation kolonu ozel bir Telefon slotu zorlamaz. Excel kolon sirasi ve sonraki uygun Telefon N allocator kurali uygulanir; existing Telefon 1-10 fidelity korunur.
- [Explicit Guardian Phone Relations Pilot] Anne/Baba adi varsa explicit phone ilgili mother/father guardian kaydina baglanir. Ad yoksa fake guardian olusturulmaz; relation label saklanir ve `guardian_id: null` kullanilir.
- [Explicit Guardian Phone Relations Pilot] Anne/Baba/Veli isimleri ve parent phone alanlari ogrenci adi composition kaynagi degildir. No-student-name guvenlik kurali korunur.
- [Explicit Guardian Phone Relations Pilot] Mevcut `guardians` ve `phones` tablolari kullanilir; yeni table veya schema version eklenmez.
- [Explicit Guardian Phone Relations Pilot] Export, backup/restore, no-phone import setting, broad source-column UI ve yeni Playwright senaryolari bu dilimin disindadir.
- [Explicit Guardian Phone Relations Pilot] Riskli `No1/No2/Numara N` alias ailesi false-positive riski nedeniyle ertelenmistir.
- [Explicit Guardian Phone Relations Pilot] Sonraki onerilen dilim export ve backup/restore garantileridir; export Telefon 1-10 slot fidelity'yi bozmamali ve Full System Backup, Excel exporttan ayri restore kaynagi olarak kalmalidir.

## Latest Decisions - Detailed Export Guardian Names

- [Detailed Export Guardian Names] Detaylı Excel Export relation-aware `Veli Ad Soyad`, `Anne Adı` ve `Baba Adı` kolonlarını taşır. Anne/Baba kolonları Veli kolonunun hemen arkasında yer alır; mevcut `Veli Ad Soyad` adı değiştirilmez.
- [Detailed Export Guardian Names] `relation_type: guardian` ve legacy `relation_type: null` Veli, `mother` Anne, `father` Baba kabul edilir. Export ilk oluşturulan guardian kaydını körlemesine Veli saymaz.
- [Detailed Export Guardian Names] Aynı relation türünde birden fazla aktif kayıt varsa kararlı seçim `created_at`, ardından `id` sırasındaki ilk kayıtla yapılır. Eksik Anne/Baba değerleri boş hücre olarak export edilir.
- [Detailed Export Guardian Names] Telefon 1-10 slot fidelity korunur. Parent relation telefonları mevcut Telefon N slotlarında kalır; `Anne Telefonu` veya `Baba Telefonu` gibi ayrı kolonlar eklenmez.
- [Detailed Export Guardian Names] Summary export, backup/restore, import, schema, sağ drawer/UI ve Playwright bu dilimde değiştirilmemiştir. `Veli Bilgisi` UI grup etiketi ayrı karardır.
- [Detailed Export Guardian Names] Sonraki önerilen dilim Full System Backup guardian/phone relation roundtrip garantisidir. Önce `tests/settings/backupRestore.test.ts` ile test-first ilerlenir; gerçek açık bulunmadıkça `src/db/backup.ts` değiştirilmez.
- [Detailed Export Guardian Names] Summary export Telefon 1-10 genişletmesi ayrıdır. Lossless/compact kapsamı ve Telefon 3-10 durum kolonları hakkında açık insan kararı olmadan summary export değiştirilmez.

## Latest Decisions - Backup Restore Guardian Roundtrip Guarantee

- [Backup Restore Guardian Roundtrip Guarantee] Full System Backup mevcut `guardians` ve `phones` tablolarını ham kayıtlarıyla saklayıp restore ettiği için guardian ve relation-aware phone metadata'sını kayıpsız korur.
- [Backup Restore Guardian Roundtrip Guarantee] Veli `guardian`, Anne `mother`, Baba `father` ve legacy `relation_type: null` kayıtları açık roundtrip testiyle korunur. Restore sahte veya fazla guardian oluşturmaz.
- [Backup Restore Guardian Roundtrip Guarantee] Telefon `guardian_id`, `relation_label`, `source_column`, `reference_label` ve `priority` alanları restore sonrasında korunur. `guardian_id: null` relation-labeled parent phone geçerli ve test edilen bir durumdur.
- [Backup Restore Guardian Roundtrip Guarantee] Bu güvence test-only sağlanmıştır. `src/db/backup.ts`, schema/version, import, export, UI, E2E ve package davranışı değiştirilmemiştir.
- [Backup Restore Guardian Roundtrip Guarantee] Gelecekte guardian/phone tablo şekli veya backup formatı değişirse roundtrip testi birlikte güncellenmelidir.
- [Backup Restore Guardian Roundtrip Guarantee] Sonraki önerilen konu summary export phone compatibility'dir; Telefon 1-10 kapsamı, status kolonları ve compact/lossless ürün kararı açıklaşmadan implementation başlatılmaz.

## Latest Decisions - Adaptive Summary Export Columns

- [Adaptive Summary Export Columns] Özet export kolonları export edilen gerçek canonical satırlardan hesaplanır; kolon planı ve satır değerleri aynı veri kaynağını kullanır, ek DB sorgusu yapılmaz.
- [Adaptive Summary Export Columns] `Veli Ad Soyad` sabittir. `Anne Adı`, `Baba Adı`, `Mahalle` ve `İlçe` yalnızca dataset'te en az bir dolu değer varsa eklenir.
- [Adaptive Summary Export Columns] Telefon 1 ve Telefon 2 durum kolonlarıyla birlikte daima bulunur. En yüksek kullanılan Telefon N slotu 3-10 ise bütün Telefon 1-N çiftleri eklenir; üst sınır 10'dur.
- [Adaptive Summary Export Columns] Summary phone kaynağı slot-faithful `phones[]` verisidir. Telefon 7-only, Telefon 10-only ve parent relation telefonları başka slotlara sıkıştırılmaz; ayrı Anne/Baba telefonu kolonları eklenmez.
- [Adaptive Summary Export Columns] Boş telefon slotlarının durum hücresi boş kalır; invalid non-empty telefon `Geçersiz format` olarak export edilir.
- [Adaptive Summary Export Columns] In-memory doğrulama dolu opsiyonel verinin plandan çıkmasını, plan üstü/geçersiz slotları, eksik telefon durum header'ını ve row/header uzunluk farkını açıklayıcı hatayla engeller; eksik kolonları sessizce eklemez.
- [Adaptive Summary Export Columns] Dış Excel tüketicileri dinamik kolonlar nedeniyle sabit indekslere değil header adlarına dayanmalıdır.
- [Adaptive Summary Export Columns] Doğum Tarihi modelde olmadığı için eklenmemiştir. `Veli Bilgisi` UI etiketi ayrı insan kararıdır; telefonsuz aday import ayarı daha sonra `71c9072` ile tamamlanmıştır.
- [Workflow Trial] Gelecek Codex görevleri için yeniden kullanılabilir güvenlik iskeleti yalnızca deneme olarak kullanılabilir. Her prompt HEAD, scope, dosyalar, riskler, testler ve insan kararları için özelleştirilmelidir; scope drift veya kontrol kaybı doğurursa eski katı manuel prompt stiline dönülür.

## Latest Decisions - No-Phone Import Setting

- [No-Phone Import Setting] Kullanıcı etiketi `Telefonsuz adayları içe aktar` olarak sabitlenmiştir.
- [No-Phone Import Setting] Varsayılan OFF'tur. İlk sürüm session-only'dir; localStorage/sessionStorage persistence yoktur ve yeni dosya, reset, tamamlanan import veya sayfa yenilemede OFF'a döner.
- [No-Phone Import Setting] OFF iken en az bir geçerli kullanılabilir telefonu olmayan satır import edilmez. Valid explicit Anne/Baba telefonu ile valid Telefon 2/Telefon 10 gibi alternatif slotlar kullanılabilir telefon sayılır.
- [No-Phone Import Setting] ON iken öğrenci adı bulunan gerçek no-phone satırı öğrenci olarak yazılabilir; PhoneRecord oluşturulmaz. Guardian kayıtları mevcut import kurallarıyla yazılabilir.
- [No-Phone Import Setting] Invalid-only telefon satırları OFF ve ON modlarında bloklanır; no-phone izni geçersiz telefon verisine izin vermez.
- [No-Phone Import Setting] Anne/Baba/Veli isimleri hiçbir modda öğrenci adı kaynağı değildir.
- [No-Phone Import Setting] Simulation summary seçilen politikayı `allow_no_phone_candidates` olarak taşır. Writer bağımsız UI boolean kullanmaz ve summary-policy uyumunu backup/write öncesinde doğrular.
- [No-Phone Import Setting] `no_usable_phone_count` ayrı sayaçtır; mevcut `empty_phone_count` yeniden tanımlanmamıştır.
- [No-Phone Import Setting] Mevcut telefonsuz kayıtlar üzerinde retroaktif silme, gizleme veya cleanup yapılmaz.
- [No-Phone Import Setting] Schema, export, backup/restore ve student screens bu dilimde değiştirilmemiştir.
- [Context Layers] Repo docs source of truth'tür. Google Drive / Obsidian strategy shadow vault ayrı katmandır, eski `e6f580b` durumundan güncel `71c9072` durumuna göre geridedir ve yalnızca açık görevle senkronize edilir.
- [Workflow Trial] Reusable safety skeleton + task-specific customization denemesi devam eder; scope drift veya kontrol kaybı görülürse daha katı manuel prompt stiline geri dönülür.

## Deferred Roadmap Decision - Reporting Area V2

- [Reporting Area V2] Aday pipeline görselleştirme fikri roadmap'e park edilmiştir; aktif scope değildir ve mevcut veri güvenliği, import, export ve backup önceliklerinin önüne geçmeyecektir.
- [Reporting Area V2] Gelecekte Yeni data, Arandı, Ulaşıldı/Ulaşılamadı, Potansiyel, Randevu, Geldi/Gelmedi, Demo/seviye çalışması, Kayıt görüşmesi, Kayıt oldu ve Vazgeçti/Takipte aşamaları üzerinden dönüşüm hunisi ve süreç tıkanmaları gösterilebilir.
- [Reporting Area V2] Yönetici görünümü takım/personel bazlı aday akışını ve data → randevu → gelen → kayıt dönüşüm oranlarını sunabilir.
- [Reporting Area V2] Bu karar LMS, ERP veya öğrenci portalı kapsamı açmaz; yalnızca Aday Öğrenci Takip Sistemi'nin kayıt görüşmesi pipeline'ına özeldir.

## Latest Decisions - Guardian + Phone UI Clarity

- [Guardian + Phone UI Clarity] Sağ kart contact bölümünün final başlığı `Veli Bilgileri`dir. Daha uzun `Veli / Anne / Baba Bilgileri` başlığı kullanılmaz; Anne ve Baba ayrımı içerideki alan etiketleriyle yapılır.
- [Guardian + Phone UI Clarity] Telefon slot kimliği birincildir ve `Telefon 1` ... `Telefon 10` biçiminde korunur. Relation bilgisi slot başlığının yerine geçmez.
- [Guardian + Phone UI Clarity] Yalnız anlamlı relation değerleri kompakt ikincil rozet üretir: Anne, Baba, Veli, Öğrenci ve Yakın. Generic veya bilinmeyen relation için rozet ve `İlişki belirtilmedi` fallback'i gösterilmez.
- [Guardian + Phone UI Clarity] Excel `source_column` teknik ana UI metni değildir. Mevcutsa yalnız ilişki rozeti tooltip'inde `Excel kaynağı: ...` olarak gösterilebilir.
- [Guardian + Phone UI Clarity] Active/current, wrong/unused, invalid format, latest result, copy, expand/collapse ve ✓ / x davranışları değiştirilmez.
- [Guardian + Phone UI Clarity] Bu UI dilimi schema, reader, persistence, import, export, backup/restore veya Telefon 1-10 slot/sıra mantığını değiştirmez.
- [Context Layers] Google Drive / Obsidian strategy vault `eefd4ed` seviyesine ayrı olarak senkronlanmıştır; `ead391b` UI checkpoint'i için follow-up sync ayrı ve açık görev gerektirir.
- [Workflow Trial] Sonraki ana adım yeni-chat handoff/disiplin testidir. Yeni chat kod işine başlamadan latest HEAD, branch, working tree, context sync seviyesi ve görev disiplinini doğrular. Reusable safety skeleton denemesi scope drift görülürse sonlandırılır.
## Latest Decisions - Phone Outcome Tracking + Compact UI Polish

- [Phone Outcome Tracking] Phone-level outcome state `PhoneRecord` üzerinde ayrı `call_outcome` ve `call_outcome_updated_at` alanlarıyla tutulur. `phone_status`, `is_wrong` ve `is_valid` semantiği yeniden kullanılmaz.
- [Phone Outcome Tracking] Kullanıcıya görünen outcome seçenekleri Aranmadı, Cevap Yok, Meşgul, Kapalı, Görüşüldü, Yanlış Numara ve Kullanılmıyor olarak sabitlenmiştir.
- [Phone Outcome Tracking] Outcome chip seçimi yalnızca seçili telefon kaydını günceller. Call log yazmaz, aday genel görüşme durumunu değiştirmez, quick call sonucunu otomatik üretmez ve aynı numarayı taşıyan başka adayları otomatik güncellemez.
- [Phone Outcome Tracking] Legacy veya boş `call_outcome` değeri UI'da Aranmadı olarak gösterilir; kullanıcı Aranmadı'yı manuel seçerse bu gerçek reset kabul edilir ve timestamp güncellenir.
- [Phone Outcome UI] Sağ kart telefon layout'u üç satırlıdır: header slot/relation, body numara + yatay ✓ / x, footer `Son sonuç` + outcome chip. Full-width select kullanılmaz.
- [Phone Outcome UI] `Son sonuç` call-log-derived read-only bilgidir; phone outcome chip'i ayrı phone-level manuel durumdur. Bu iki anlam UI'da ayrıştırılmış kalır.
- [Phone Outcome UI] Outcome menüsü portal/fixed positioning kullanır, top/bottom placement seçer, alan dar ise `max-height` ve iç scroll kullanır, chip'ten kopuk görünmeyecek şekilde anchor gap korunur.
- [Phone Outcome Scope] Export/import outcome mapping, call log auto-mapping, outcome history/audit screen, duplicate same-number shared outcome, backend/server persistence ve VDS deploy bu checkpoint'in kapsamı değildir.
- [VDS Demo Direction] Pilot yönü Windows VDS + domain altında `/demo` path'idir. Vite base path ve deployment planı ayrı görevde doğrulanmalıdır.

## Latest Decisions - Demo Seed and WhatsApp Manual Drafts

- [Subpath Deploy] Pilot demo için `/demo` subpath desteği tamamlanmıştır. `netvadi.com/demo` pilot demo alanıdır; domain root hedefi değildir.
- [Pilot Data Areas] `localhost:5173` gerçek lokal data alanıdır. `localhost:7777` fake/pilot test alanıdır. Bu iki alan karıştırılmamalıdır.
- [Pilot Seed] Pilot demo seed bootstrap ve zengin fake pilot seed + UI smoke QA tamamlanmıştır. Seed/pilot test verisi gerçek öğrenci verisi gibi ele alınmamalıdır.
- [WhatsApp Manual Drafts] WhatsApp için API, bot, otomatik gönderim, kişi kaydetme/vCard veya teslimat doğrulama kullanılmayacaktır. Ücretsiz/manual `wa.me` taslak akışı kullanılacaktır.
- [WhatsApp Manual Drafts] `WhatsApp'ta Aç` yalnız taslak bağlantısı açar. Gönderme işlemi WhatsApp içinde kullanıcı/personel tarafından manuel yapılır.
- [WhatsApp Manual Sent Marker] `Gönderildi olarak işaretle` WhatsApp teslimat onayı değildir. Bu yalnız CRM içinde manuel takip işaretidir.
- [WhatsApp UI Scope] Öğrenci listesinde WhatsApp rozeti gösterilmeyecektir. WhatsApp bilgisi telefon kartı bazlı mikro UI olarak kalır.
- [WhatsApp Pending] WhatsApp taslak editleme ve gönderildi işaretini geri alma aktif scope değildir; ayrı ürün kararı gerektirir.
- [Phone Action Semantics] X/çarpı butonu operational invalid marker'dır ve `phone_status` ile `is_wrong` alanlarını etkiler.
- [Phone Action Semantics] Dropdown `Yanlış Numara` ve `Kullanılmıyor` seçenekleri phone-level `call_outcome` alanını etkiler.
- [Phone Action Semantics] X ile dropdown aynı veri davranışını üretmez. X/dropdown birleşimi veya sadeleştirmesi ayrı product/data decision olmadan yapılmayacaktır.

## Latest Decisions - WhatsApp Web Open Suspend + Import Fallback Cleanup

- [WhatsApp Web Open Suspend] WhatsApp Web bağlı cihaz kısıtı nedeniyle `WhatsApp'ta Aç` / `wa.me` yeni sohbet açma aksiyonu geçici olarak askıya alınmıştır.
- [WhatsApp Web Open Suspend] Buton görünür ama disabled kalır; kullanıcı mesajı kopyalayıp WhatsApp'a manuel yapıştırmaya yönlendirilir.
- [WhatsApp Web Open Suspend] Yeni kullanımda `window.open` çalışmaz, UI akışı `buildWhatsAppDraftUrl` çağırmaz ve `draft_opened` log oluşmaz.
- [WhatsApp Web Open Suspend] `Mesajı Kopyala` edited/current draft body ile çalışır ve `copied` log yazar.
- [WhatsApp Manual Sent Marker] `Gönderildi olarak işaretle` manuel CRM takip işareti olarak kalır; `manually_marked_sent` log yazar ve WhatsApp teslimat onayı değildir.
- [WhatsApp Scope] WhatsApp API, bot, auto-send, vCard/contact-save ve teslimat doğrulama yoktur. `whatsappUrl.ts` helper'ı gelecekte yeniden açma ihtimali için korunur.
- [VDS Demo] `4ebfe33` VDS demo ortamına deploy edilmiş ve kullanıcı tarafından tamamlandı olarak bildirilmiştir. Bu not doğrulanan detayları abartmaz; demo kontrol hedefi `/students` WhatsApp modalında Aç butonu disabled, kopyalama ve manuel gönderildi akışlarıdır.
- [Import Fallback Fix] `c77e8cf` ile yeni importlarda hardcoded `11. Sınıf YKS Hazırlık` student_group fallback'i ve hardcoded `YKS` category yazımı kaldırılmıştır.
- [Import Fallback Fix] Yeni importta Excel'de `student_group` veya `category` yoksa/boşsa CRM bu değerleri uydurmaz. Bu fix sadece yeni importları etkiler; mevcut DB'deki eski kayıtları otomatik düzeltmez.
- [Student Cleanup Candidate Service] `f609292` eski hardcoded student_group kayıtlarını tespit eden read-only servis eklemiştir. DB write, migration, UI, apply/cleanup yoktur.
- [Student Cleanup UI Gate] StudentsPage içine cleanup report UI gömülmeyecek; daha önce denenmiş cleanup UI iptal edilmiştir. Ana operasyon sayfasına bakım UI eklemek ayrı discovery ve kullanıcı onayı ister.

## Latest Decisions - VELI ADI Import Alias Fix

- [VELI ADI Import Alias] `VELI ADI` / `Veli Adı`, import kolon eşleştirmede `Veli Ad Soyad` ile aynı anlamda kabul edilir ve mevcut `guardian_full_name` alanına otomatik eşleşir.
- [VELI ADI Import Alias] `VELI AD SOYAD` / `Veli Ad Soyad` mevcut davranışı korunur.
- [VELI ADI Import Alias Scope] Bu karar yalnız alias/mapping düzeyindedir; import writer, schema/db, export/backup, StudentsPage, WhatsApp ve package/config davranışı değişmez.
- [VELI TEL Deferred] Bu eski not `cf47e2d feat: import explicit guardian phone relations` ile kapanmıştır; Veli telefonu import davranışı artık aşağıdaki ayrı karar kapsamında tanımlıdır.
- [VDS Demo] `18f47c9` VDS demo ortamına deploy edilmiş ve kullanıcı tarafından tamamlandı olarak bildirilmiştir; bu not yalnız deploy bildirimi olarak tutulur.

## Latest Decisions - VELI TEL / Guardian Phone Import

- [VELI TEL / Guardian Phone Import] Açık `VELI TEL`, `VELI TELEFON`, `VELI GSM`, `VELI CEP`, `Veli Telefonu` ve `Veli Cep Telefonu` başlıkları explicit Veli relation phone kabul edilir ve import-only `guardian_phone` alanına eşleşir.
- [VELI TEL / Guardian Phone Import] Generic Telefon/GSM/Tel/Telefon 1 gibi başlıklardan Veli ilişkisi tahmin edilmez; bu başlıklar mevcut generic Telefon N davranışında kalır.
- [VELI TEL / Guardian Phone Import] Veli telefonu mevcut Telefon N slot hattında kalır. Özel bir slot zorlanmaz; Excel kolon sırası ve Telefon 1-10 slot fidelity korunur.
- [VELI TEL / Guardian Phone Import] Veli adı varsa writer telefonu ilgili Veli guardian kaydına bağlar. Veli adı yoksa fake/boş guardian oluşturulmaz; `relation_label: "Veli"` korunur ve `guardian_id: null` kalabilir.
- [VELI TEL / Guardian Phone Import] `guardian_phone` persistent student field değildir. Schema/db, export, backup/restore, StudentsPage, WhatsApp ve package/config davranışı değişmez.
- [VELI TEL / Guardian Phone Import] Veli phone alanı, `VELI ADI` / `VELI AD SOYAD`, Anne/Baba/Veli isimleri ve parent phone alanları öğrenci adı composition kaynağı değildir.
- [VELI TEL / Guardian Phone Import] Ayrı Veli telefonu export kolonu bu sprintte eklenmez; parent relation telefonları mevcut Telefon 1-10 slotları içinde kalır.
- [VDS Demo] `cf47e2d` VDS demo ortamına deploy edilmiş ve kullanıcı tarafından test/QA okey olarak bildirilmiştir; bu not kullanıcı bildirimiyle sınırlıdır.

## Latest Decisions - Guardian Phone Import E2E

- [Guardian Phone Import E2E] Guardian phone import davranışı artık browser-level Playwright E2E ile de korunur; `qa:import:e2e` komutu bu senaryoyu regression matrix içinde çalıştırır.
- [Guardian Phone Import E2E] `VELI ADI` + `VELI TEL`, `ANNE TEL` ve `BABA TEL` ilişkileri import sonrası sağ kart seviyesinde doğrulanır.
- [Guardian Phone Import E2E] Generic `Telefon` kolonu Veli/Anne/Baba relation üretmemelidir; normal Telefon N olarak kalması browser testte korunur.
- [Guardian Phone Import E2E] `VELI TEL` bulunan ama `VELI ADI` bulunmayan satır fake/boş guardian oluşturmamalıdır; `Veli Ad Soyad` satırı basılmamalı, telefon relation badge'iyle görünebilmelidir.
- [Guardian Phone Import E2E] Bu checkpoint test-only'dir; production `src/**`, import writer, schema/db, export/backup, StudentsPage, WhatsApp ve package/config davranışı değişmez.

## Latest Decisions - Dar Pilot Final Gate

- [Dar Pilot Final Gate] `0e58928 docs: close guardian phone e2e checkpoint` seviyesi dar pilot için `PILOT READY WITH WARNINGS` kabul edilir.
- [Dar Pilot Final Gate] Blocker ve high risk bulunmamıştır; pilot öncesi zorunlu bugfix gerekmez.
- [Dar Pilot Final Gate] Kısa manuel QA/smoke yeterli kabul edilir; VDS `/demo` manuel smoke kullanıcı tarafından okey bildirildiği kadar kayda alınır, canlıda doğrulanmamış ek garanti dili kullanılmaz.
- [Dar Pilot Final Gate] Final validation import, students, exports, settings, reports/reminders, Playwright import E2E ve build kontrollerinde PASS sonucuyla kapanmıştır.
- [Risk Classification] BLOCKER yok; HIGH yok; MEDIUM olarak WhatsApp modal testinde ilk koşu async/flaky fail ve React `act(...)` warning not edilir; LOW olarak bilinen Vite chunk-size warning kabul edilir.
- [Deferred Scope] Phone Action Simplification / `✓` `x` dropdown karmaşası, Communication History correction/delete, Reporting Area V2, mobile polish, eski `student_group` cleanup apply, `VELI TEL` ayrı export kolonu ve WhatsApp Web open suspend kalıcı ürün kararı pilot sonrası veya ayrı discovery kapsamındadır.
- [Next Decision Candidates] Bir sonraki ürün/discovery hattı Phone Action Simplification veya WhatsApp Web open suspend için kalıcı ürün kararı olabilir; ikisi de ayrı tekil görev olarak ele alınmalıdır.

## Latest Decisions - Kampanya Import Persistence Bugfix

- [Campaign Import Persistence] Importta dolu `Kampanya` değeri default `Diğer` ile ezilmez.
- [Campaign Import Persistence] Dolu kampanya adı trimlenir; aynı isimde aktif campaign varsa kullanılır, yoksa yeni aktif campaign oluşturulur.
- [Campaign Import Persistence] Aynı import içinde aynı kampanya adı tekrar ederse tek campaign kaydı cache ile tekrar kullanılır.
- [Campaign Import Persistence] Student kaydı `campaign_id` üzerinden gerçek kampanya kaydına bağlanır; student list/read model ve filtreler bu ilişkiyi kullanır.
- [Campaign Import Persistence] Kampanya boşsa mevcut default `Diğer` davranışı korunur.
- [Campaign Import Persistence] Bu bugfix eski DB kayıtlarını geriye dönük temizlemez; yalnız yeni importlar için geçerlidir.
- [Campaign Import Persistence Scope] Campaign management UI, schema migration, export/backup değişikliği, `category`, `student_group`, guardian phone ve phone slot logic bu sprintte değiştirilmemiştir.
- [VDS Demo] `82036c0` VDS demo ortamına deploy edilmiş; kullanıcı import sonrası kampanya ve kampanya filtresi smoke testlerini okey bildirmiştir. Bu not kullanıcı bildirimiyle sınırlıdır.

## Latest Decisions - Dar Pilot Basari Kapanisi

- [Dar Pilot Success] Dar pilot kullanım testi kullanıcı bildirimiyle başarılı tamamlanmıştır: test başarılı, hepsi okey, dar pilot başarılı.
- [Dar Pilot Success] Pilot sonucunda blocker/high bug bildirilmemiştir.
- [Dar Pilot Success] Import, kampanya persistence, kampanya filtresi, Veli/Anne/Baba telefon ilişkileri, generic Telefon alanlarının parent relation üretmemesi, aday kartı temel bilgileri, filtreler, WhatsApp modal temel akışı ve export kontrolü pilot için yeterli kabul edilmiştir.
- [Dar Pilot Success] Sprint 9.2 pilot eşiği geçilmiştir.
- [Dar Pilot Success] Kod tarafında yeni iş açılmamıştır; yeni geliştirme başlamadan önce gerçek kullanım geri bildirimi toplanacak ve kontrollü backlog/prioritization yapılacaktır.
- [Dar Pilot Success] Sonraki işler ayrı discovery ve ürün kararıyla ele alınacaktır.

## Latest Decisions - Call Phone Selection Rule

- [Call Phone Selection Rule] Görüşme durumu kaydında telefon seçimi her sonuç için genel zorunluluk değildir.
- [Call Phone Selection Rule] Telefon seçimi `reached` için zorunludur; `wrong_number` için seçilebilir telefon varsa zorunludur. `reached` gerçek temas kurulan telefonu, `wrong_number` ise normal durumda hangi numaranın yanlış olduğunun bilinmesini gerektirir.
- [Call Phone Selection Rule] `not_called`, `not_reached`, `call_later`, `appointment`, `do_not_call`, `not_interested` ve `registered` telefon seçimi olmadan kaydedilebilir. Kullanıcı telefon seçerse bağlam kayda geçebilir.
- [Call Phone Selection Rule] Telefon seçilmeden yazılan call log kayıtlarında phone context null kalabilir. Call history bu durumu `Telefon seçilmedi` fallback'iyle gösterir.
- [Call Phone Selection Rule] Phone-level outcome/status yalnız telefon bağlamı varsa güncellenir; null phone context bulunan non-contact kayıtlar telefon kartı outcome/status değerlerini değiştirmez.
- [Call Phone Selection Rule] UI/error metinlerinde “görüşülen / iletişim kurulan numara” yerine nötr “Aranan / işlem yapılan telefon” dili kullanılır.
- [Call Phone Selection Rule Scope] Schema/migration, import/export, backup/restore, WhatsApp, reports/export label metinleri ve package/config davranışı değiştirilmemiştir.
- [Impact Audit] `055597a` sonrası calls, students, exports, reminders, reports, full OOM-safe unit ve build kontrolleri PASS; blocker/high risk bulunmamıştır.
- [VDS Demo] `055597a` VDS demo ortamına deploy edilmiş ve kullanıcı sorun olmadığını bildirmiştir; `Ulaşılamadı`, `Görüşüldü`, `Yanlış Numara`, `Sonra Aranacak` ve `Randevu Verildi` smoke akışlarında sorun bildirilmediği kullanıcı bildirimiyle kaydedilir.

## Latest Decisions - All Phones Invalid Wrong Number Fix

- [All Phones Invalid Wrong Number] `wrong_number` seçildiğinde adayda en az bir telefon var ama tüm telefonlar `is_wrong` veya `phone_status: invalid` ise genel Yanlış Numara kaydı telefon seçmeden yapılabilir.
- [All Phones Invalid Wrong Number] Bu edge-case'te call log null phone context taşıyabilir; aday genel sonucu `wrong_number` olur ve phone-level status/outcome tekrar güncellenmez.
- [All Phones Invalid Wrong Number] Seçilebilir telefon varsa `wrong_number` için telefon seçimi zorunlu kalır; `reached` için telefon zorunluluğu değişmez.
- [All Phones Invalid Wrong Number Scope] No-phone aday davranışı, X/dropdown semantiği, schema/migration, import/export, backup/restore, WhatsApp, reminder lifecycle ve communication history edit/delete değişmez.
- [VDS Demo] `8bf7cb2` VDS demo ortamına deploy edilmiş; kullanıcı tüm telefonlar X/yanlış-kullanılmıyor + phone outcome `Kullanılmıyor` + genel `Yanlış Numara` smoke testinde sorun olmadığını bildirmiştir.
