# HANDOFF_CURRENT — Aday Öğrenci Takip Sistemi

## 1. Güncel Repo Durumu

- Repository adı: aday-ogrenci-takip-sistemi
- Aktif branch: sprint-9-2-multi-phone-architecture-plan
- Latest implementation: `847ac24 feat: suspend whatsapp outbound integration`. WhatsApp Draft Mode `ACTIVE`; WhatsApp outbound integration `TEMPORARILY DISCONNECTED`. Review ve local manual QA PASS; docs closure bu görevde güncellenmektedir. Production deployment ve smoke QA henüz yapılmadı.
- Cleanup implementation checkpoints: `9ddc519 feat: add student group cleanup correction` and `77542a5 feat: add student group cleanup maintenance ui`.
- Model C+ implementation: `4f643a4 feat: complete appointment lifecycle`. Checkpoint A/B/C CLOSED; Final Integration `PASS WITH NOTES`; production deployment `PASS`; live QA `FULL PASS`; Model C+ `PRODUCTION CLOSED`.
- Controlled Legacy Student Group Cleanup: `MODEL B - Review + Per-record Correction` PRODUCTION CLOSED. Checkpoint A/B, final integration, production deployment ve production smoke QA tamamlandı; smoke QA `PASS — data-limited`tir.
- Checkpoint C validation: StudentsPage history `31/31`; lifecycle/read-model/history `3` dosya / `82`; reminders `10` dosya / `72`; combined lifecycle `14` dosya / `168` test iki ardışık koşuda PASS; build PASS (bilinen Vite chunk-size warning). Migration/backfill, DB version ve index değişikliği yoktur.
- Latest deployed/integration HEAD: `2826ea3 test: cap vitest workers for stability`. Current terminal HEAD/origin yeni işe başlamadan önce Git ile doğrulanmalıdır.
- Dar Pilot Final Gate sonucu `PILOT READY WITH WARNINGS` idi; kullanıcı bildirimiyle dar pilot kullanım testi başarıyla tamamlandı. VELI TEL / guardian_phone import ve guardian phone Playwright E2E checkpoint'i, VELI ADI import alias fix, WhatsApp draft edit/override, import fallback fix, cleanup candidate read-only service, WhatsApp Web open suspend, Kampanya import persistence bugfix, görüşme durumu telefon seçimi kuralı düzeltmesi, tüm telefonlar invalid iken genel Yanlış Numara edge-case fix'i, iletişim geçmişi edit/void MVP'si, phone action label/helper cleanup, Reporting V2 Summary MVP + UI polish, linked communication history terminal status-aware soft delete ve linked reminder quick complete zinciri tamamlandı ve pushlandı.
- Beklenen final working tree: tracked dosya değişikliği yok; yalnız `dev-server.log` yerel runtime çıktısı olarak untracked kalabilir ve stage/commit edilmemelidir.
- Pending linked reminder edit kapanışı tamamlandı. Cancel pending linked reminder implementation, tests/build, Strategy Review, manuel QA, feature commit/push, Windows VDS deployment, feature-specific live QA, docs closure, Obsidian ve Drive doğrulaması tamamlandı. Model C+ ve cleanup için aktif implementation WIP yoktur; yeni ürün işi ayrı scoped discovery ile seçilmelidir.
- Pending linked call reminder cancellation tamamlandı: gerçek owner/current history satırında iptal aksiyonu görünür; shared/tarihsel referans satırlarında görünmez. `pending → cancelled` dışında lifecycle transition yoktur; call log, student ve appointment korunur.
- Önceki docs commit: 006ad84 docs: add sprint 9.3g-4 checkpoint
- Önceki multi-phone import simulation commit: 2e1bbff feat: add multi-phone import simulation
- Önceki import UI progressive disclosure commit: 0c40524 feat: collapse long import review lists
- Önceki Telefon 3+ call save selection commit: 121f175 feat: select extra phone for call save
- Önceki right card multi-phone UI commit: 67812cb feat: show extra phones in right card
- Önceki right card read model commit: 8043507 feat: add multi-phone read model for student cards
- Önceki docs commit: 53f8695 docs: add sprint 9.3e-1 checkpoint
- Önceki governance commit: a9bc3c6 docs: add ai workflow governance
- Önceki reminder UI commit: dba4cc6 feat: show phone context in reminders list
- Önceki feature commit: 23342b3 feat: show phone context in call history
- Önceki docs commit: 4ec3c61 docs: add sprint 9.3d-1 checkpoint
- Önceki önemli merge: cc008a7 Merge pull request #6 from wosleader/sprint-9-3b-2-phone-context-persistence-wiring
- Bir önceki phone context persistence commit’i: 595979d feat: wire phone context persistence for calls and reminders
- Canonical docs closure commit'inden sonra working tree beklenen durumu: yalnız `dev-server.log` untracked.
- GitHub/origin durumu: aktif branch `origin/sprint-9-2-multi-phone-architecture-plan` ile aynı son commit üzerinde görünür.

## Current Product State - WhatsApp Outbound Disconnect

- Student-card WhatsApp aksiyonu yalnız yerel telefon/context çözümüyle taslak modalını açar; şablon render, local override, düzenleme, kopyalama ve açık kullanıcı aksiyonuyla manuel CRM `Gönderildi olarak işaretle` devam eder.
- Uygulama `wa.me`, WhatsApp Web/API, `whatsapp://`, WhatsApp hedefli `window.open`, redirect, anchor, iframe, prefetch veya background request üretmez. `whatsappUrl.ts` silinmiştir; clickable outbound WhatsApp kontrolü yoktur.
- Modal açılması WhatsApp'ın açıldığı, mesajın gönderildiği veya teslim edildiği anlamına gelmez. Yeni UI akışında yalnız explicit `copied` ve `manually_marked_sent` logları yazılır; manuel işaret teslimat onayı değildir.
- Validation: local manual QA PASS; focused `2` dosya / `28` test PASS; canonical `59` dosya / `636` test PASS; build PASS (yalnız bilinen Vite chunk-size warning). `642 → 636` farkı yalnız silinen beş WhatsApp-link telefon normalization ve bir `wa.me` URL-construction testidir.
- Bu geçici ürün kararı dış bağlantıyı kalıcı olarak reddetmez. Reconnection yalnız açık product discovery/decision ile ele alınabilir; bu docs closure sonrası sıradaki gate production deployment ve smoke QA'dır.

## Latest Product Closure - Controlled Legacy Student Group Cleanup

- Product decision complete: `MODEL B - Review + Per-record Correction`. Batch cleanup, silent/automatic mutation, migration ve historical bulk backfill kabul edilmedi.
- Checkpoint A CLOSED: `9ddc519 feat: add student group cleanup correction`. Canonical assessment/predicate, read-only candidate reader, `updated_at` DTO alanı, per-record correction transaction, deterministic search-text refresh ve append-only audit tamamlandı.
- Existing detector exact `11. Sınıf YKS Hazırlık` eşleşmesini ve class sinyallerini kullanır; `high_confidence` / `needs_review` sonuçları yalnız inceleme adayıdır. `high_confidence` write authorization değildir ve string pattern provenance sayılmaz; reader ve correction service aynı assessment'ı kullanır.
- İlk sürümde kullanıcı her kaydı ayrı açar, mevcut context'i görür, hedef `student_group` değerini açıkça girer/seçer, reason verir ve explicit confirmation yapar. Güvenli UI dili `Yüksek olasılıklı`, `İnceleme gerekli`, `Öğrenci grubunu düzelt` ve neutral hedef için `Belirtilmemiş`tir.
- Kaynak veriyle doğrulanan exact grup korunabilir; kaynakta grup yoksa/boşsa persisted neutral value `""` olur. Sınıf, category, campaign veya başka bir alandan otomatik grup türetilmez. `category` yalnız context'tir ve bu scope'ta mutate edilmez.
- İlk write öncesinde mevcut Tam Sistem Yedeği zorunludur. Bu yedek student cleanup rollback için gereken `students` / `audit_logs` state'ini korur; byte-for-byte bütün uygulama snapshot'ı olarak tanımlanmaz. İlk rollback pre-cleanup full backup restore'dur.
- Correction service explicit `verified_value` / `unspecified` intent ayrımı yapar. `unspecified` persisted `""` değeridir; verified target kullanıcıdan gelen trim edilmiş gerçek değerdir. Category veya başka alandan grup türetilmez; reason zorunludur.
- Her per-record correction transaction içi re-read, active/deleted ve candidate revalidation, `expected_updated_at` stale guard ve fail-closed davranışı uygular. `student_group`, `search_text`, `updated_at` ve audit atomik yazılır; audit failure mutation'ı rollback eder.
- Call logs, reminders, appointments, campaign, guardian relations, phones, call summary, student summary ve Reporting V2 hesapları değiştirilmez. Liste/filtre/export güncel StudentRecord'u doğal olarak yansıtır.
- Chosen surface: `Settings -> Veri Sağlığı / Bakım`. StudentsPage cleanup paneli, import ekranında historical cleanup ve batch action yoktur.
- Validation: initial focused `2` dosya / `16`, import/list `2` dosya / `51`, import + students `20` dosya / `226` test PASS; build PASS. Strategy Review `PASS WITH NOTES` sonrası reject-path DB-state ve shared search-text contract notları test-only hardening ile kapandı. Post-hardening focused `3` dosya / `18`, import/list `2` dosya / `51`, imports + students `21` dosya / `228` test PASS; build PASS; narrow re-review PASS.
- Checkpoint B CLOSED: `77542a5 feat: add student group cleanup maintenance ui` Settings'te `Veri Sağlığı / Bakım` sekmesini, reactive candidate list/count/filters, per-record review, explicit target/reason/correction confirmation ve error/stale feedback akışını açtı. `category` salt-okunur kaldı; batch ve auto-fix yoktur.
- First-write backup gate ayrı confirmation'larla `locked -> download_initiated -> confirmed` çalışır. Tarayıcı yalnız indirme isteğinin başlatıldığını bilir; kullanıcı dosyayı sakladığını açıkça doğrular. Gate Settings mount/session-local React state'tir; same mount'ta korunur, reload/unmount ve successful restore sonrası resetlenir.
- Review snapshot `updated_at`, correction request'te `expected_updated_at` olarak kalır; stale fail-closed'dur. Başarılı correction modalı kapatır ve useLiveQuery aday listesini/count'larını doğal yeniler. Strategy Review'daki 5 finding hedefli fixlerle CLOSED; narrow re-review PASS. Local manual QA; list/filter/review, category read-only, backup/download/saved confirmation, custom ve `Belirtilmemiş` correction, live refresh, same-session gate ile restore/reload resetini PASS olarak doğruladı.
- Final Integration: 24 logical CPU üzerindeki uncapped Vitest default'u 23 worker ile unrelated async UI testlerinde aralıklı fail üretti. `1/2/4/8` worker full-suite matrix PASS verdiği için, en yüksek ölçülmüş stabil seviye `test.maxWorkers: 8` `2826ea3` ile canonical config'e alındı. Timeout/retry/assertion zayıflatma, test skip, global serialization ve production code değişikliği yoktur.
- Committed `2826ea3` doğrulaması: canonical `npm.cmd test` `59` dosya / `642` test PASS; `npm.cmd run build` PASS (yalnız bilinen Vite chunk-size warning); `npm.cmd run qa:import:e2e` `6/6` PASS.
- Production deploy PASS: Windows VDS kaynak repo `C:\Sites\aday-ogrenci-takip-sistemi` `a617b09 → 2826ea3` fast-forward edildi; `npm.cmd ci`, `/demo/` base build ve `robocopy .\dist C:\Sites\netvadi-demo /MIR` ile static publish tamamlandı. Robocopy exit code `3` normal/successful statüdür; service/container restart gerekmedi.
- Production smoke QA `PASS — data-limited`: `/demo/`, Settings ve `Veri Sağlığı / Bakım` yüzeyi doğrulandı. Production veri setinde eligible cleanup candidate bulunmadığından per-record review, backup-gate write, production correction write ve live candidate removal yeniden test edilmedi. Bu yollar deploy öncesi local manual QA ve exact deployed HEAD automated regression ile PASS'ti; QA için sahte/legacy veri eklenmedi ve product owner data-dependent write yolunun atlanmasını kabul etti.
- Controlled Legacy Student Group Cleanup PRODUCTION CLOSED ve açık blocker yoktur. Category cleanup, batch/auto-fix, schema redesign, historical backfill, Model C+, appointment, campaign, phone, reporting, WhatsApp, dependency/bundle ve dedicated batch rollback işleri bu scope dışındadır. Yeni ürün işi ancak ayrı scoped discovery ile seçilir.

## Deferred Roadmap - Student Card Profile Editing

- `Bilgileri Güncelle` gelecekte Students/candidate card `⋮` menüsünde `Adayı Sil` altında değerlendirilecek ayrı bir feature'dır; aktif implementation değildir ve önce discovery gerektirir.
- Muhtemel profile alanları `current_class`, `student_group`, campaign ve diğer mevcut student alanlarıdır; exact editable inventory, validation, audit/stale/search-text semantics ve guardian/phone sınırı kararlaştırılmamıştır.
- Source file, source sheet, source row ve mevcut import metadata provenance olarak varsayılan read-only kalmalıdır; elle güncellenmemelidir.

## Latest Checkpoint - Cancel Pending Linked Call Reminder

- Feature commit/push: `e15a051 feat: cancel pending linked reminders`; HEAD/origin yeni iş öncesi Git ile doğrulanmalıdır.
- Kapsam yalnız gerçek owner/current history satırındaki bağlı `pending` `call` reminder'dır. Completed/cancelled, bağlantısız, call dışı ve shared/tarihsel reference satırları aksiyon almaz; RemindersPage doğrudan aksiyonu, reopen, appointment lifecycle ve genel lifecycle refactor kapsam dışıdır.
- Owner kullanıcı rolü değildir: `reminder.call_log_id → owner call log` authoritative yönüdür. Modern reciprocal link, güvenli legacy fallback ve aynı owner'a bağlı tek aktif pending reminder kuralı servis katmanında yeniden doğrulanır. Shared/tarihsel `created_reminder_id` referansları owner cancellation'ı bloklamaz; missing/conflicting/ambiguous bağlantı fail-closed'dur.
- Appointment owner call logda bulunsa bile tek başına cancellation'ı bloklamaz. Cancellation sadece reminder'ı `pending → cancelled` yapar; appointment, call log ve student summary değişmez. Reminder veya görüşme kaydı silinmez.
- İptal nedeni opsiyoneldir; trim edilmiş boş değer `null` sayılır ve reminder modeline yeni alan eklemeden append-only audit payload'ında tutulur. Reminder status update ve audit, Dexie transaction'ında atomik olmalıdır.
- UI StudentsPage history owner satırıdır: `Hatırlatmayı İptal Et`, tooltip/aria `Hatırlatmayı iptal et`, modal `Hatırlatma iptal edilsin mi?`, ikincil eylem `Vazgeç`, birincil eylem `Hatırlatmayı İptal Et`. Açıklama görüşme kaydı ve varsa randevunun silinmeyeceğini söyler. Completion modalının ikincil eylemi `Vazgeç` olarak netleştirildi.
- Pending reader/list/alarm/count davranışı korunur; Full System Backup cancelled status ve audit'i saklar, normal export audit payload'ını taşımaz. `NO MIGRATION`; `NO BACKFILL`. Duplicate-owner doğrulamasının full reminder scan maliyeti non-blocking performance notudur.
- Validation: Strategy Review `PASS WITH NOTES`, manuel QA `PASS`, tests `52` files / `530` tests PASS, build PASS. Windows VDS deployment, feature-specific live QA, repo docs closure ve docs commit/push PASS.
- Deployment/live QA: `a2743a3` VDS'de origin ile senkron ve temiz working tree ile deploy edildi. Pilot seed flag + `/demo/` build PASS; deploy öncesi backup `C:\Backups\netvadi-demo_20260726_045705` doğrulandı. Static deploy `robocopy /MIR /XF "harita.html"` ile PASS (exit code `3`); Caddy restart edilmedi. `https://netvadi.com/demo/`, `harita.html`, CSS ve JS HTTP 200; `harita.html` SHA256 değeri `BB1C59773E707B22A37779E439383457C6200CC3B32666F7F2C8EE3C290ED1BA` olarak korundu. Rollback gerekmedi.
- Canlı QA PASS: owner/current satır cancellation, `Vazgeç` ile mutation'sız kapanış, başarılı cancellation sonrası call log korunumu, pending list/alarmdan düşme, yenileme sonrası persistence ve görünür edit/complete/delete regresyon kontrolü kabul edildi. Shared/tarihsel owner davranışı için önceki gerçek veri QA ve otomatik regresyon testleri geçerlidir; canlıda gereksiz destructive shared-history senaryosu oluşturulmadı.
- Non-blocking maintenance: `npm ci` audit çıktısındaki `2 low` / `7 high` vulnerability, yaklaşık `905 kB` minified ana JS chunk, duplicate-owner full-table scan, action-menu UX (`✓` + `⋯`) ve eski `Latest` docs başlıkları ayrı backlog/discovery işidir; bu deployment blocker değildir.
- Bu checkpoint kapandı: deployment/live-QA docs closure, exact-path docs commit/push, Obsidian ve Drive doğrulaması tamamlandı.
- Ayrı deferred UX işi: görünür `✓` ve diğer history aksiyonlarını `⋯` menüsünde toplama fikri; bu checkpoint'e dahil değildir.

## Latest Checkpoint - Appointment Model C+ Checkpoint C

- Implementation/push: `4f643a4 feat: complete appointment lifecycle`.
- Canonical service `src/features/appointments/services/appointmentLifecycle.ts` guardian message sent, appointment-note edit, reschedule, `Geldi`, `Gelmedi` ve `İptal` mutationlarını yürütür. Componentlerde doğrudan appointment Dexie mutation yoktur.
- Her lifecycle mutation, current DB state'i aynı Dexie transaction'ında yeniden okur; modern pending owner integrity, stale expectation ve reciprocal bağ koşulları fail-closed doğrulanır. Appointment update ile audit birlikte atomiktir; audit failure mutation'ı rollback eder.
- `Mesaj Gönderildi` yalnız internal tracking aksiyonudur: guardian item düşer, appointment `pending` ve appointment-start item kalır; external gönderim veya ReminderRecord oluşturma yoktur.
- `Görüşme notu` CallLog'a, `Randevu notu` AppointmentRecord'a aittir; auto-sync yoktur. Pencil call note-only correction, calendar icon appointment management yüzeyidir. Pending owner correction yalnız call note'u değiştirebilir.
- Reschedule aynı appointment ID ve owner call log ile devam eder; due time Europe/Istanbul kuralıyla yeniden hesaplanır, generation `+1`, guardian sent state `null` olur. Terminal `completed`/Geldi, `no_show`/Gelmedi ve `cancelled`/İptal kayıtları korunur, read-only'dir ve reopen almaz.
- Manual QA FULL PASS. Final Integration `PASS WITH NOTES` sonrasında target `a617b09` Windows VDS'ye yayınlandı: production deployment `PASS`, live QA `FULL PASS`, rollback `NOT REQUIRED`.
- VDS kaynak repo `C:\Sites\aday-ogrenci-takip-sistemi`, Caddy static publish dizini `C:\Sites\netvadi-demo`, public URL `https://netvadi.com/demo/`dur. Doğrulanmış backup `C:\Backups\netvadi-demo_20260818_004229`; `harita.html` korundu. Migration/schema/package değişikliği ve servis restartı gerekmedi.

## Previous Checkpoint - Appointment Model C+ Checkpoint B

- Implementation/push: `79cf2f9 feat: unify operational appointment alerts`.
- `call_reminder` davranışı korunurken aktif C+ appointment'lardan read-only `appointment_guardian_message` ve `appointment_start` operasyonel satırları fail-closed olarak türetilir. Appointment için ReminderRecord oluşturulmaz.
- Aynı appointment'ın guardian-message ve start satırları ayrı stable identity taşır; dismiss ve chime bastırmaları birbirini etkilemez.
- `OperationalAlertHost` AppLayout altında tek mount edilir; tüm rotalarda 30 saniyelik polling, future list, due/overdue popup/chime davranışını sağlar. Dismiss localStorage UI bastırmasıdır ve Escape yalnız popup varken onu kapatır.
- RemindersPage üç tür satırı gösterir; Checkpoint C guardian-message satırında canonical `Mesaj Gönderildi` aksiyonunu ekledi.
- Manual QA PASS. Checkpoint B sonrası lifecycle kapsamı Checkpoint C'de tamamlandı.

## Previous Checkpoint - Appointment Model C+ Checkpoint A

- `e16c6a3` gerçek AppointmentRecord persistence, reciprocal owner link, embedded guardian-message state, Europe/Istanbul due hesabı, atomic create audit ve legacy status compatibility getirir.
- Appointment branch ReminderRecord oluşturmaz; `call_later` mevcut pending call reminder lifecycle'ını korur. Pending modern owner integrity missing/conflicting/duplicate/mismatch bağlarda fail-closed'dur; generic correction appointment sentezleyemez.
- Manual QA PASS: pending appointment, reciprocal link, due time, appointment audit, no-reminder, deletion/correction guard ve `call_later` regression doğrulandı. Normal export guardian metadata'sını taşımaz; full backup/restore embedded state, link ve audit'i korur.
- Checkpoint A persistence katmanıdır. Checkpoint B guardian/start alarm reader ve UI'ı uyguladı. `Mesaj Gönderildi`, reschedule, complete/no_show/cancel ve lifecycle auditleri Checkpoint C'de tamamlandı.

## Historical Gate - Model C+ Final Integration Gate

- Amaç: tam repository test/build, cross-check ve Strategy Review ile A+B+C bütünlüğünü doğrulamaktır; gerekirse kısa final manual smoke yapılır.
- Deployment bu gate PASS olmadan yapılmaz. Aktif implementation/docs WIP yoktur.

## Previous Handoff Update - Pending Linked Reminder Edit

- Latest closed product checkpoint: `e3f14aa docs: close pending linked reminder edit`; branch `sprint-9-2-multi-phone-architecture-plan`.
- Implementation: `93b4471 feat: edit pending linked reminders`.
- Current terminal HEAD ve upstream farkı yeni iş öncesi Git ile doğrulanmalıdır.
- Durum: Implementation PASS; Tests/build PASS (`52` files / `507` tests); Strategy Review PASS WITH NOTES; feature commit/push PASS; VDS deploy PASS; live smoke/QA PASS; docs closure PASS; docs commit/push PASS; Obsidian sync PASS — kullanıcı paketi uyguladığını bildirdi; Drive shadow TEYİT EDİLEMEDİ.
- Non-blocking review notları: correction audit için doğrudan backup → restore → payload roundtrip testi ve correction/deletion için ortak lifecycle policy discovery ileride değerlendirilebilir; commit/deploy kapanışını engellemez.
- Pending linked reminder edit yalnız owner/current history satırında görünür. Tarih, saat ve not güncellenir; history snapshot/linkleri korunur; edit audit preview pending/completed/cancelled owner satırda kalır.
- Correction policy: unlinked call log full correction; active linked reminder/appointment block; terminal linked dependency note-only; missing/conflicting link fail-closed. Service guard ana otoritedir; UI tek güvenlik katmanı değildir.
- Windows VDS repo `C:\Sites\aday-ogrenci-takip-sistemi` fast-forward ile `37d1fd5`ten `93b4471`e alındı. Build: `$env:VITE_ENABLE_PILOT_SEED = "true"`; `npm.cmd run build -- --base=/demo/`; ardından environment temizliği. Statik yayın `C:\Sites\netvadi-demo` altında Caddy ile yapıldı; restart gerekmedi. Backup: `C:\Backups\netvadi-demo_20260722_123851`.
- Public endpoint `https://netvadi.com/demo/`; index, JS, CSS ve `harita.html` HTTP 200 verdi. `harita.html` SHA256 değeri deploy öncesi/sonrası aynıdır: `BB1C59773E707B22A37779E439383457C6200CC3B32666F7F2C8EE3C290ED1BA`.
- Kullanıcı canlı QA sonucu PASS: pending reminder oluşturma/edit, audit preview, quick complete, completed reminder note-only correction, unlinked correction regresyonu ve export davranışı kabul edildi.
- Beklenen working tree: tracked değişiklik yok; yalnız `?? dev-server.log`. Aktif implementation veya docs WIP yoktur. Sıradaki ürün işi yalnız `MOD: Discovery` ile seçilmelidir.

## Previous Handoff Update - Stale Reminder Date Guard Fix

- Current safe HEAD/origin: `37d1fd5 fix: guard reminder creation to call later`.
- Latest completed item: Stale reminder date guard fix.
- VDS deploy `37d1fd5` seviyesine tamamlandı; kullanıcı QA sonucunu `QA geçti kanka.` olarak bildirdi.
- No open bug in stale reminder reopen chain: linked quick complete sonrası veya non-`call_later` görüşme sonucu kaydında stale reminder tarih/saat bilgisinden yeni/pending reminder create/update yapılmamalıdır.
- `callLogWriter` reminder create/update işlemini yalnız `call_later` için yapar; non-reminder resultlarda stale `reminder_at` gelse bile `created_reminder_id`, `reminder_at` ve `next_action` call log'a taşınmaz.
- `StudentsPage` non-`call_later` result geçişinde ve linked quick complete sonrası `reminderDate` / `reminderTime` state'ini temizler.
- `call_later` reminder davranışı korunur. Appointment lifecycle redesign yapılmadı. Existing pending reminder terminal/non-reminder result ile otomatik completed/cancelled yapılmadı.
- Scope dışı/değişmeyenler: schema/migration, import/export, backup/restore, WhatsApp, Reporting V2, appointment lifecycle redesign ve every-call-later-creates-separate-reminder product change.
- Historical backlog: pending/linked reminder edit UX discovery bu checkpoint anında açık durumdaydı; ihtiyaç `93b4471` ile çözüldü.
- Historical scope: Bu checkpoint anında cancel reminder action backlog / not implemented idi; ihtiyaç daha sonra `e15a051` ile çözüldü. Reminder reschedule/ertele hâlâ backlog / not implemented.
- Beklenen working tree: tracked dosya değişikliği yok, yalnız `?? dev-server.log`.

## Latest Handoff Update - Linked Reminder Owner Row Visibility Fix

- Current safe HEAD/origin: `7636b57 fix: show linked reminder action only on owner history row`.
- Latest completed item: linked reminder owner-row visibility fix.
- Aynı pending reminder birden fazla iletişim geçmişi satırında görünebilir; bunun nedeni `callLogWriter`ın aynı adayda mevcut pending reminder varsa yeni reminder oluşturmak yerine mevcut reminder'ı güncellemesi ve eski call logların `created_reminder_id` referansını koruyabilmesidir.
- `callHistoryReader` artık `canCompleteLinkedReminder` değerini yalnız owner/current row için true üretir. Owner önceliği `reminder.call_log_id`; eksik/stale owner durumunda aynı reminder id'ye bağlı aktif call loglar içinde latest `call_time` / `created_at` / `id` fallback'i kullanılır.
- `completeReminder`, `callLogWriter`, delete guard, schema, import/export, backup/restore ve WhatsApp davranışı değişmedi.
- VDS deploy tamamlandı: VDS önce `39e3840` seviyesindeydi, `git pull` ile `39e3840..7636b57` fast-forward edildi, `npm ci` OK, `npm run build -- --base=/demo/` OK, `robocopy /MIR` OK ve `FAILED 0`.
- VDS HEAD/origin `7636b57` olarak doğrulandı; kullanıcı smoke sonucu: `Hepsi ok devam`.
- Strict-owner policy discovery sonradan yapıldı ancak ek implementation gerekmedi; canlıdaki sorun stale local/VDS ortamı ve owner-row fix'in VDS'de olmamasından kaynaklanıyordu.
- Historical scope: Cancel reminder action bu sprintte backlog olarak kalmıştı; ihtiyaç daha sonra `e15a051` ile uygulandı.
- Beklenen working tree: tracked dosya değişikliği yok, yalnız `?? dev-server.log`.

## Latest Handoff Update - Linked Reminder Quick Complete

- Current safe HEAD/origin: `39e3840 feat: complete linked reminders from call history`.
- Recent implementation chain: `40cb62b fix: allow voiding closed linked call logs` followed by `39e3840 feat: complete linked reminders from call history`.
- Linked communication history delete policy status-aware hale geldi. Pending reminder bağlantılı call log doğrudan silinemez; completed/cancelled reminder bağlantılı call log soft delete edilebilir.
- Pending appointment ve postponed appointment bağlantılı call log kayıtları bloklu kalır; terminal appointment status'ları soft delete edilebilir. Status source of truth'tur; yalnız tarih geçmişliği kriter değildir.
- Sağ kart iletişim geçmişinde pending reminder bağlantılı satır küçük icon-only `Hatırlatmayı tamamla` aksiyonu gösterir. Aksiyon confirmation modal sonrası reminder `status` değerini `completed` yapar; call log'u silmez, link detach etmez, aday özetini değiştirmez.
- Complete işleminden sonra mevcut delete guard doğal olarak aynı call log için `Geçersiz Say / Sil` akışına izin verir. Büyük yazılı yeşil button kullanılmaz; açıklama title/aria/confirmation üzerinde kalır.
- Historical scope/değişmeyenler: reminder cancel button bu quick-complete sprintinde yoktu ve daha sonra `e15a051` ile ayrı feature olarak eklendi; appointment quick action, Reminders sayfasına navigasyon, Students page state preservation, reminder/appointment lifecycle redesign, export/import/backup formatı, Reporting V2 metric calculation ve WhatsApp flow değişmedi.
- Validation: terminal status-aware delete policy phase calls 6/73, reminders 7/33, reports 3/22, exports 4/34 ve build PASS. Quick complete phase calls 6/77, reminders 8/37, students 10/90, reports 3/22 ve build PASS. Bilinen Vite chunk-size warning devam eder.
- VDS deploy tamamlandı; kullanıcı smoke sonucunu `sıkıntı yok` olarak bildirdi. Öğrenci kartı icon-only complete action çalışır ve ardından delete flow çalışır.
- Historical next backlog: Obsidian shadow sync; gerekirse linked reminder quick complete Obsidian shadow sync; reminder cancel button discovery daha sonra tamamlandı; appointment quick action discovery; Reminders page navigation + Students state preservation UX discovery; reminder/appointment lifecycle redesign discovery; Reporting V2 future personnel/team, came/no-show ve lifecycle reports discovery.

## Latest Handoff Update - Reporting V2 Summary MVP

- Current safe HEAD/origin: `68d2899 chore: polish reporting v2 layout`.
- Implementation chain: `13c53e5 feat: add reporting v2 summary` followed by `68d2899 chore: polish reporting v2 layout`.
- Reporting V2, Raporlar sayfasında mevcut günlük raporu bozmadan read-only yönetici özeti olarak eklendi. Günlük rapor alanı korunur.
- Source of truth aktif `call_logs` kayıtlarıdır; `deleted_at` olan kayıtlar dışlanır. Tarih aralığı `call_time`, yoksa `created_at` üzerinden yerel gün sınırlarıyla hesaplanır.
- `İşlem gören tekil aday`, seçili aralıkta aktif call log'u olan farklı aday sayısıdır. `Randevu Verildi` ve `Kayıt Oldu`, CRM `call_result` sayımlarıdır; gerçek lifecycle, gelen veli/no-show veya personel performansı değildir.
- Kampanya kırılımı adayın güncel `students.campaign_id` değerine göre hesaplanır. Call log campaign snapshot yoktur; kampanya sonradan değişirse geçmiş rapor kırılımı da değişebilir. UI'da bu not korunur.
- UI polish ayrı `reporting-v2-*` CSS sınıflarıyla yapıldı: özet kart grid'i, filtre hizası, görüşme sonucu dağılımı, kampanya tablosu ve günlük trend düzeni toparlandı.
- Değişmeyenler: schema/migration yok, import/export/backup yok, WhatsApp yok, personnel/team metric yok, gerçek kayıt lifecycle/no-show yok.
- Validation: implementation phase focused reports/calls/exports/imports/settings PASS, full serial `51 files / 416 tests` PASS, build PASS. UI polish phase reports/calls/settings PASS, build PASS. Bilinen Vite chunk-size warning devam eder.
- VDS deploy ve kullanıcı smoke sonucu sorun yok olarak bildirildi: `/demo` ve Reports açılır, günlük rapor bozulmaz, Reporting V2 görünür, tarih aralığı/kampanya filtresi çalışır, kampanya tablosu ve günlük trend görsel olarak kabul edilir.
- Next recommended action after this docs closure: Reporting V2 docs sonrası Obsidian shadow sync değerlendirilsin; ardından personel/team performance, gelen veli/no-show/appointment lifecycle veya export/report expansion ayrı discovery ile ele alınsın.

## Latest Handoff Update - Phone Action Label Clarification / Helper Cleanup

- Current safe HEAD/origin: `c094741 chore: simplify phone result helper labels`.
- Implementation chain: `8224582 chore: clarify phone action labels` followed by `c094741 chore: simplify phone result helper labels`.
- Telefon kartındaki ✓, X, phone outcome dropdown ve genel görüşme sonucu alanlarının kullanıcı dili netleştirildi; teknik davranış değiştirilmedi.
- ✓ `Bu görüşmede kullanılacak telefon` anlamını korur. X `Telefonu yanlış / kullanılmayacak olarak işaretle` anlamındadır ve `phone_status` / `is_wrong` davranışını korur; `call_outcome` değiştirmez.
- Phone outcome dropdown telefon bazlı manuel sonuç alanıdır; yalnız `call_outcome` yazar, `phone_status` / `is_wrong` / genel aday görüşme sonucu değiştirmez ve call log oluşturmaz.
- Genel Görüşme Durumu aday genel call log kaydı anlamını korur; call log / student summary akışı değişmedi.
- Görsel kalabalık yapan görünür `Bu telefonun son arama sonucu` ve `Bu seçim iletişim geçmişine kayıt olarak işlenir.` helper yazıları kaldırıldı; uygun aria/title anlamı korundu.
- Korunanlar: schema/migration yok, PhoneRecord model/semantik değişmedi, X/dropdown/✓ davranışı değişmedi, call log write rules ve general validation değişmedi, `reached` telefon zorunluluğu ve `wrong_number` eligible phone / all-invalid edge-case kuralları korundu, communication history edit/void, import/export/backup ve WhatsApp değişmedi.
- Validation: `8224582` için focused student 4/40, calls 6/61, exports 4/34, settings 3/15, full serial 50/402 ve build PASS. `c094741` için focused student 4/40, calls 6/61, full serial 50/402 ve build PASS. Bilinen Vite chunk-size warning devam eder.
- `8224582` VDS deploy + browser smoke OK; `c094741` VDS deploy + visual smoke OK olarak kullanıcı tarafından temiz bildirildi.

## Latest Handoff Update - All Phones Invalid Wrong Number Fix

- Current safe HEAD/origin: `8bf7cb2 fix: allow wrong number when all phones are invalid`.
- Edge-case: Adaydaki tüm telefonlar X / yanlış-kullanılmıyor işaretliyken ve phone-level outcome dropdown'larında `Kullanılmıyor` seçiliyken genel `Yanlış Numara` kaydı artık `Bu kayıt için seçilebilir telefon bulunamadı` hatasıyla bloklanmaz.
- Son kural: `reached` / Görüşüldü için telefon zorunluluğu korunur. `wrong_number` / Yanlış Numara için seçilebilir telefon varsa telefon seçimi zorunlu kalır.
- Eğer adayda en az bir telefon var ama tüm telefonlar zaten `is_wrong` veya `phone_status: invalid` ise genel `wrong_number` telefon seçmeden kaydedilebilir.
- Bu edge-case'te call log null phone context taşıyabilir; aday genel sonucu `wrong_number` olur ve phone-level status/outcome tekrar güncellenmez.
- No-phone aday davranışı bu fix'in kapsamı değildir; mevcut guard korunur.
- Validation: focused 5 files / 77 tests PASS; full default 49 files / 397 tests PASS; full serial 49 files / 397 tests PASS; build PASS, bilinen Vite chunk-size warning dışında sorun yok; `git diff --check` PASS, yalnız LF -> CRLF çalışma kopyası uyarıları görüldü.
- `8bf7cb2` VDS demo ortamına deploy edildi. Kullanıcı smoke testte tüm telefonları X / yanlış-kullanılmıyor yaptı, phone outcome dropdown'larında `Kullanılmıyor` seçti, genel `Yanlış Numara` kaydetti ve sorun olmadığını bildirdi.
- Scope dışı/değişmeyenler: schema/migration, import/export, backup/restore, WhatsApp, reminder lifecycle, communication history edit/delete ve package/config.
- Beklenen working tree: tracked dosya değişikliği yok; yalnız `dev-server.log` yerel runtime çıktısı olarak untracked kalabilir ve stage/commit edilmemelidir.

## Latest Handoff Update - Communication History Edit / Void MVP

- Current safe HEAD/origin: `8f1f613 feat: allow correcting unlinked communication history`.
- Bağlantısız iletişim geçmişi kayıtları sağ karttan düzeltilebilir/düzenlenebilir.
- Düzeltilebilir alanlar: görüşme durumu, not, tarih/saat ve telefon bağlamı. Bu MVP reminder/randevu lifecycle, cascade veya detach davranışı eklemez.
- Bağlantısız iletişim kayıtları mevcut soft delete altyapısıyla `Geçersiz Say / Sil` yapılabilir. Teknikte hard delete yoktur; `call_logs.deleted_at` ve `updated_at` set edilir.
- Soft-deleted kayıtlar history/read model'den düşer. Reports/export aktif call log kayıtları üzerinden doğal güncellenir; backup ham tabloları aldığı için soft-deleted kayıtlar yedekte kalır.
- Edit/delete sonrası aday özeti aktif call log kayıtlarından yeniden hesaplanır: `last_call_result`, `last_contacted_at`, `last_contacted_phone_id`.
- `created_reminder_id` veya `created_appointment_id` dolu call log kayıtları bu MVP'de edit/delete için bloklanır.
- `PhoneRecord` status/outcome alanları edit/delete sırasında mutate edilmez.
- Validation: focused 3 files / 15 tests PASS; full serial 50 files / 402 tests PASS; standard full 50 files / 402 tests PASS; build PASS, bilinen Vite chunk-size warning dışında sorun yok; `git diff --check` PASS, yalnız LF -> CRLF çalışma kopyası uyarıları görüldü.
- `8f1f613` VDS demo ortamına deploy edildi. Kullanıcı smoke testte bağlantısız kayıt düzeltme, görüşme durumu/not/tarih-saat güncelleme, `Geçersiz Say / Sil` ile history'den düşürme, bağlı reminder/randevu kayıtlarının bloklanması, aday özetinin aktif call loglara göre güncellenmesi ve reminder/randevu tarafında bozulma gözlenmemesi akışlarını sorun yok olarak bildirdi.
- Scope dışı/değişmeyenler: schema/migration, import/export formatı, backup/restore formatı, WhatsApp, reminder/appointment cascade, communication history undo ve package/config.
- Beklenen working tree: tracked dosya değişikliği yok; yalnız `dev-server.log` yerel runtime çıktısı olarak untracked kalabilir ve stage/commit edilmemelidir.

## Latest Handoff Update - Call Phone Selection Rule

- Current safe HEAD/origin: `055597a fix: relax phone selection for non-contact call results`.
- Kullanıcı gözlemi: `Ulaşılamadı` seçildiğinde sistem “Son görüşülen / iletişim kurulan numara” seçimini zorunlu tutuyordu; ulaşılamayan çağrıda bu hem mantık hem metin olarak yanıltıcıydı.
- Kök neden: `validateCallSave()` ve `callLogWriter()` birden fazla uygun telefon olduğunda telefon seçimini `call_result` değerinden bağımsız istiyordu.
- Yeni kural: Telefon seçimi `reached` için zorunludur; `wrong_number` için seçilebilir telefon varsa zorunludur.
- Telefon seçimi opsiyonel/non-blocking sonuçlar: `not_called`, `not_reached`, `call_later`, `appointment`, `do_not_call`, `not_interested`, `registered`.
- Telefon seçilmeden yazılan call log null phone context taşıyabilir; call history `Telefon seçilmedi` fallback'iyle gösterir.
- Phone-level outcome/status yalnız telefon bağlamı varsa güncellenir. Non-contact ve telefonsuz kayıtlar telefon kartı durumunu mutate etmez.
- UI/error dili nötrleşti: `Aranan / işlem yapılan telefon` ve `Hangi telefonla işlem yapılacak? Lütfen bu kayıt için ilgili telefonu seçin.`.
- Impact audit: reminder/call_later, appointment, reports, export ve call history null phone context ile uyumludur; blocker/high risk bulunmadı.
- Validation: `npm.cmd test -- --run tests/calls` PASS, 5 files / 53 tests; `npm.cmd test -- --run tests/students` PASS, 10 files / 87 tests; `npm.cmd test -- --run tests/exports` PASS, 4 files / 34 tests; `npm.cmd test -- --run tests/reminders` PASS, 7 files / 33 tests; `npm.cmd test -- --run tests/reports` PASS, 2 files / 8 tests; `npx.cmd vitest run --exclude e2e/** --maxWorkers=1` PASS, 49 files / 392 tests; `npm.cmd run build` PASS with known Vite chunk-size warning.
- `git diff --check` PASS; yalnız LF -> CRLF çalışma kopyası uyarıları görüldü.
- `055597a` VDS demo ortamına deploy edildi ve kullanıcı sorun olmadığını bildirdi. `Ulaşılamadı`, `Görüşüldü`, `Yanlış Numara`, `Sonra Aranacak` ve `Randevu Verildi` smoke akışlarında sorun bildirilmediği not edildi; bu kullanıcı bildirimiyle sınırlıdır.
- Scope dışı/değişmeyenler: schema/migration, import/export, backup/restore, WhatsApp, package/config ve rapor/export label metinleri.
- Beklenen working tree: tracked dosya değişikliği yok; yalnız `dev-server.log` yerel runtime çıktısı olarak untracked kalabilir ve stage/commit edilmemelidir.

## Latest Handoff Update - Dar Pilot Basari Kapanisi

- Current safe HEAD/origin: `b8dad6a docs: close campaign import persistence bugfix`.
- Kullanıcı bildirimi: test başarılı, hepsi okey, dar pilot başarılı.
- Dar pilot kullanım testi başarıyla tamamlandı ve Sprint 9.2 pilot eşiği geçildi.
- Pilot sırasında doğrulanan ana akışlar: Excel import, Kampanya import sonrası doğru persistence, kampanya filtresinde gerçek kampanyaların görünmesi, Veli/Anne/Baba telefon ilişkileri, generic Telefon alanlarının yanlışlıkla parent relation etiketi almaması, aday kartı temel bilgileri, filtreler, WhatsApp modal temel akışı ve export kontrolü.
- Yeni blocker/high bug bildirilmedi.
- Kod tarafında yeni iş açılmadı; sonraki aşama pilot geri bildirimlerini kontrollü backlog/prioritization sürecine almak olmalıdır.
- Yeni geliştirme veya düzeltme işleri ayrı discovery/karar ile ele alınmalıdır.
- Beklenen working tree: tracked dosya değişikliği yok; yalnız `dev-server.log` yerel runtime çıktısı olarak untracked kalabilir ve stage/commit edilmemelidir.

## Latest Handoff Update - Kampanya Import Persistence Bugfix

- Current safe HEAD/origin: `82036c0 fix: persist imported campaign names`.
- Kullanıcı bug gözlemi: Excel import dosyasındaki `Kampanya` değerleri simülasyon/preview ekranında doğru görünüyordu; import sonrası adaylar `Diğer` kampanyasına düşüyor ve kampanya filtresinde yalnız `Diğer` görünüyordu.
- Kök neden: `importSimulation` `row.campaign_name` değerini doğru taşıyor ve `ImportPage` preview bunu gösteriyordu; `importWriter` ise `row.campaign_name` değerini kullanmayıp tüm student kayıtlarına default `Diğer` `campaign_id` yazıyordu.
- Fix davranışı: `importWriter` artık `row.campaign_name` değerini trimleyerek kullanır. Boş kampanya mevcut default `Diğer` davranışını korur.
- Kampanya doluysa aynı isimde aktif campaign kullanılır; yoksa yeni aktif campaign oluşturulur. Aynı import içinde aynı kampanya adı tekrar ederse cache ile tek campaign kaydı kullanılır.
- Student `campaign_id` gerçek kampanya kaydına bağlanır; `category`, `student_group`, `current_class`, guardian phone ve phone slot logic değişmedi.
- Eski DB kayıtları geriye dönük düzeltilmedi; fix yalnız yeni importlar için geçerlidir.
- Validation: `npm.cmd test -- --run tests/imports` PASS, 9 files / 100 tests; `npm.cmd test -- --run tests/students` PASS, 10 files / 86 tests; `npm.cmd run build` PASS, bilinen Vite chunk-size warning dışında hata yok; `git diff --check` PASS, yalnız LF -> CRLF çalışma kopyası uyarıları görüldü.
- `82036c0` VDS demo ortamına deploy edildi. Kullanıcı VDS deploy, import sonrası kampanya ve kampanya filtresi smoke testlerini okey bildirdi; bu not kullanıcı bildirimiyle sınırlıdır.
- Beklenen working tree: tracked dosya değişikliği yok; yalnız `dev-server.log` yerel runtime çıktısı olarak untracked kalabilir ve stage/commit edilmemelidir.

## Latest Handoff Update - Dar Pilot Final Gate

- Current safe HEAD/origin: `0e58928 docs: close guardian phone e2e checkpoint`.
- Final gate kararı: `PILOT READY WITH WARNINGS`.
- Dar pilot için blocker veya high risk bulunmadı; pilot başlayabilir.
- VDS `/demo` manuel smoke kullanıcı tarafından okey bildirildi. Bu not kullanıcı bildirimiyle sınırlıdır; canlıda doğrulanmamış ek davranış garantisi olarak yazılmamalıdır.
- Final validation:
  - `npm.cmd test -- --run tests/imports` PASS, 9 files / 96 tests.
  - `npm.cmd test -- --run tests/students` ilk koşuda WhatsApp UI async/flaky fail verdi; izole retry PASS; full retry PASS, 10 files / 86 tests.
  - `npm.cmd test -- --run tests/exports` PASS, 4 files / 34 tests.
  - `npm.cmd test -- --run tests/settings` PASS, 3 files / 15 tests.
  - `npm.cmd test -- --run tests/reports tests/reminders` PASS, 9 files / 41 tests.
  - `npm.cmd run qa:import:e2e` PASS, 6/6 Playwright test.
  - `npm.cmd run build` PASS, bilinen Vite chunk-size warning dışında sorun yok.
- Risk sınıfları: BLOCKER yok; HIGH yok; MEDIUM WhatsApp modal async/flaky test ilk koşu ve React `act(...)` warning; LOW bilinen Vite chunk-size warning.
- Deferred işler: Phone Action Simplification / `✓` `x` dropdown karmaşası, Communication History correction/delete, Reporting Area V2, mobile polish, eski `student_group` cleanup apply, `VELI TEL` ayrı export kolonu ve WhatsApp outbound reconnection kararı.
- Pilot öncesi zorunlu bugfix gerekmiyor; kısa manuel QA/smoke yeterli kabul edildi.
- Sıradaki muhtemel karar/discovery: Phone Action Simplification veya WhatsApp outbound reconnection için açık ürün kararı.
- Beklenen working tree: tracked dosya değişikliği yok; yalnız `dev-server.log` yerel runtime çıktısı olarak untracked kalabilir ve stage/commit edilmemelidir.

## Historical Handoff Update - WhatsApp Web Open Suspend + Cleanup Candidate Service

- Historical safe HEAD/origin: `4ebfe33 fix: suspend WhatsApp web open action`.
- Recent safe chain:
  - `7067175 feat: allow editing WhatsApp draft messages`
  - `723326f feat: persist WhatsApp template overrides`
  - `c77e8cf fix: avoid hardcoded student group import fallback`
  - `f609292 feat: report hardcoded student group cleanup candidates`
  - `4ebfe33 fix: suspend WhatsApp web open action`
- WhatsApp Web bağlı cihaz kısıtı nedeniyle CRM içindeki `WhatsApp'ta Aç` / `wa.me` yeni sohbet açma aksiyonu geçici olarak askıya alındı.
- Modalda `WhatsApp'ta Aç` butonu görünür ama disabled kalır. Kısa açıklama kullanıcıyı `Mesajı Kopyala` ile WhatsApp'a manuel yapıştırmaya yönlendirir.
- Yeni kullanımda `window.open` çalışmaz, UI akışı `buildWhatsAppDraftUrl` çağırmaz ve `draft_opened` log oluşmaz.
- `Mesajı Kopyala` edited/current draft body ile çalışır ve `copied` log yazar.
- `Gönderildi olarak işaretle` yalnız manuel CRM takip işaretidir; `manually_marked_sent` log yazmaya devam eder ve WhatsApp teslimat onayı değildir.
- WhatsApp API, bot, auto-send, vCard/contact-save ve teslimat doğrulama yoktur. `src/features/whatsapp/whatsappUrl.ts` gelecekte yeniden açma ihtimali için korunur.
- `4ebfe33` VDS demo ortamına deploy edildi ve kullanıcı tarafından tamamlandı olarak bildirildi. Demo kontrol hedefi: `/students` WhatsApp modalında Aç butonu disabled, kopyalama ve manuel gönderildi akışları çalışıyor.
- `c77e8cf` yeni importlarda hardcoded `11. Sınıf YKS Hazırlık` student_group fallback'ini ve hardcoded `YKS` category yazımını kaldırdı. Eski DB kayıtları otomatik düzeltilmez.
- `f609292` eski fallback kayıtlarını tespit eden read-only cleanup candidate service ekledi. DB write, migration, UI, apply/cleanup yoktur.
- StudentsPage içine cleanup report UI gömülmeyecek; daha önce denenmiş cleanup UI iptal edilmiştir. Ana operasyon sayfasına bakım UI'ı eklemek ayrı discovery ve kullanıcı onayı ister.
- Devam disiplini: tek iş, temiz working tree, discovery sonrası implementation, kullanıcı onayı olmadan commit/push yok.

## Latest Handoff Update - VELI ADI Import Alias Fix

- Current safe HEAD/origin: `18f47c9 fix: map veli adi import column`.
- `VELI ADI` / `Veli Adı` import kolon başlığı artık otomatik olarak mevcut `guardian_full_name` / `Veli Ad Soyad` alanına eşleşir.
- `VELI AD SOYAD` / `Veli Ad Soyad` mevcut davranışı korunur.
- Değişiklik yalnız alias/mapping düzeyindedir; import writer, schema/db, export/backup, StudentsPage, WhatsApp ve package/config değişmedi.
- `VELI TEL`, `VELI TELEFON` ve `guardian_phone` bu sprintte eklenmedi; ayrı karar/implementation gerektirir.
- Validation: `npm.cmd test -- --run tests/imports` PASS, 9 files / 94 tests; `npm.cmd run build` PASS with known Vite chunk-size warning; `git diff --check` PASS with only LF -> CRLF working-copy warnings.
- `18f47c9` VDS demo ortamına deploy edildi ve kullanıcı tarafından tamamlandı olarak bildirildi. Bu not deploy bildirimiyle sınırlıdır.
- Beklenen working tree: tracked dosya değişikliği yok; yalnız `dev-server.log` yerel runtime çıktısı olarak untracked kalabilir ve stage/commit edilmemelidir.

## Latest Handoff Update - VELI TEL / Guardian Phone Import

- Current safe HEAD/origin: `cf47e2d feat: import explicit guardian phone relations`.
- `VELI TEL`, `VELI TELEFON`, `VELI GSM`, `VELI CEP`, `Veli Telefonu` ve `Veli Cep Telefonu` başlıkları import-only `guardian_phone` alanına otomatik eşleşir.
- `guardian_phone` kalıcı student field değildir; schema/db değişmedi.
- Simülasyon bu telefonları `phones[]` hattına `relation_label: "Veli"` ve gerçek Excel `source_column` bilgisiyle ekler.
- Telefon özel slota zorlanmaz; mevcut Telefon 1-10 slot fidelity ve Excel kolon sırası korunur.
- Generic Telefon/GSM/Tel/Telefon 1 gibi başlıklardan Veli ilişkisi tahmin edilmez.
- Veli adı varsa writer telefonu ilgili Veli guardian kaydına bağlar. Veli adı yoksa fake/boş guardian oluşturulmaz; `relation_label: "Veli"` korunur ve `guardian_id: null` kalabilir.
- ANNE TEL / BABA TEL mevcut davranışı korunur.
- `VELI ADI` / `VELI AD SOYAD`, Veli telefonu ve Anne/Baba/Veli bilgileri öğrenci adı kaynağı değildir.
- Export, backup/restore, StudentsPage, WhatsApp, schema/db ve package/config değişmedi.
- Validation: `npm.cmd test -- --run tests/imports` PASS, 9 files / 96 tests; `npm.cmd run build` PASS with known Vite chunk-size warning; `git diff --check` PASS with only LF -> CRLF working-copy warnings.
- `cf47e2d` VDS demo ortamına deploy edildi ve kullanıcı tarafından test/QA okey olarak bildirildi. Bu not kullanıcı bildirimiyle sınırlıdır.
- Beklenen working tree: tracked dosya değişikliği yok; yalnız `dev-server.log` yerel runtime çıktısı olarak untracked kalabilir ve stage/commit edilmemelidir.

## Latest Handoff Update - Guardian Phone Import E2E

- Current safe HEAD/origin: `b486735 test: cover guardian phone import e2e`.
- Playwright import regression içinde `imports guardian phone relations with parent phones` senaryosu bulunur.
- Senaryo gerçek browser akışında Excel upload, import, Aday Listesi ve sağ kart doğrulaması yapar.
- `VELI ADI` + `VELI TEL` birlikte doğrulanır: Veli adı `Veli Ad Soyad`, telefon `Veli telefonu` badge'iyle görünür.
- `ANNE TEL` ve `BABA TEL` sırasıyla `Anne telefonu` / `Baba telefonu` badge'leriyle doğrulanır.
- Generic `Telefon` relation badge üretmez ve normal Telefon N davranışında kalır.
- `VELI TEL` var ama `VELI ADI` yoksa fake/boş guardian oluşmadığı ve `Veli Ad Soyad` satırının basılmadığı E2E ile korunur; telefon yine `Veli telefonu` badge'iyle görünebilir.
- Ürün kodu değişmedi: `src/**`, schema, import writer, export/backup, StudentsPage, WhatsApp, package/config ve docs `b486735` içinde değişmedi.
- Validation: `npm.cmd run qa:import:e2e` PASS, 6/6 Playwright test; `npm.cmd test -- --run tests/imports` PASS, 9 files / 96 tests; `npm.cmd run build` PASS with known Vite chunk-size warning; `git diff --check` PASS with only LF -> CRLF working-copy warning.
- Beklenen working tree: tracked dosya değişikliği yok; yalnız `dev-server.log` yerel runtime çıktısı olarak untracked kalabilir ve stage/commit edilmemelidir.

## Latest Handoff Update - Guardian + Phone UI Clarity

- Current safe HEAD/origin: `ead391b feat: clarify guardian and phone labels`.
- Sağ kart contact bölüm başlığı `Veli Bilgileri` olarak kabul edilmiştir; `Veli / Anne / Baba Bilgileri` final metin değildir.
- Dolu Veli/Anne/Baba ad satırları korunur.
- Telefon slot başlıkları sabit `Telefon N` biçimindedir. Anlamlı ilişki ayrıca kompakt `Anne telefonu`, `Baba telefonu`, `Veli telefonu`, `Öğrenci telefonu` veya `Yakın telefonu` rozetiyle gösterilir.
- Generic/bilinmeyen relation için rozet yoktur. `source_column` görünür ana metin değildir; mevcutsa yalnız tooltip'te `Excel kaynağı: ...` olarak sunulur.
- Telefon status, `Son sonuç`, copy, +N / Daha az göster ve ✓ / x davranışları değişmemiştir.
- Schema, reader, persistence, import, export, backup/restore ve telefon slot sırası değişmemiştir.
- Validation: 3 focused dosya / 45 test PASS; OOM-safe full unit 45 dosya / 328 test PASS; build PASS; final başlık düzeltmesi 2 dosya / 21 test PASS.
- Temiz browser profilinde aday verisi olmadığı için gerçek veri kartı görsel QA'sı yapılamadı; uygulama runtime hatası olmadan açıldı.
- Tracked working tree docs görevi öncesinde temizdir; `dev-server.log` yerel untracked runtime çıktısı olarak kalabilir ve stage/commit edilmemelidir.
- Sonraki ana görev immediate coding değildir: yeni-chat handoff/disiplin testi yapılmalıdır. Yeni chat önce latest HEAD, branch, working tree, Google Drive / Obsidian sync seviyesi ve çalışma kurallarını doğrulamalıdır.
- Strategy vault ayrı katmandır ve `eefd4ed` seviyesine senkronlanmıştır; `ead391b` için küçük follow-up sync gerekebilir.
- Reusable safety skeleton + task-specific customization kontrollü deneme olarak sürer; scope drift veya kontrol kaybında geri alınır.
- `Reporting Area V2: Aday Pipeline Görselleştirme` deferred roadmap olarak kalır, aktif scope değildir.

## Latest Handoff Update - Demo Seed + WhatsApp Manual Draft UI

- Current safe HEAD/origin: `48da40c fix: polish WhatsApp phone action icon`.
- Recent implementation chain:
  - `13f5d12 fix: support subpath deployment base`
  - `edae87a feat: add pilot demo seed bootstrap`
  - `1dc09c7 fix: enrich pilot seed and add UI smoke QA`
  - `cf660d1 feat: add WhatsApp draft message templates`
  - `6fdd940 fix: show WhatsApp manual sent status`
  - `48da40c fix: polish WhatsApp phone action icon`
- `/demo` subpath deploy support is complete. `netvadi.com/demo` is the pilot demo area.
- Pilot seed bootstrap and richer fake pilot seed + UI smoke QA are complete.
- WhatsApp draft modalı yerel hazırlık/kopyalama ve manuel CRM işaretleme akışıdır; outbound WhatsApp integration geçici olarak disconnected durumdadır. WhatsApp API, bot, auto-send, vCard/contact-save veya delivery confirmation yoktur.
- `Gönderildi olarak işaretle` means manual CRM follow-up status only; it must not be described as WhatsApp delivery confirmation.
- WhatsApp status remains phone-card scoped. Student list WhatsApp badges are intentionally not part of the current product.
- Environment split:
  - `localhost:5173` = real local data area.
  - `localhost:7777` = fake/pilot test area.
  - `netvadi.com/demo` = pilot demo area.
- Pending decisions:
  - WhatsApp draft editing.
  - Undo/revert for manual sent marker.
  - X/dropdown semantic redesign.
- X/dropdown discovery result: X is the operational invalid marker and changes `phone_status` / `is_wrong`; dropdown `Yanlış Numara` / `Kullanılmıyor` changes `call_outcome`. They are not equivalent and must not be merged without a separate product/data decision.
- Working tree should be clean except `dev-server.log`. During this docs sync an extra untracked `docs/docs.zip` may be present locally; do not stage it unless explicitly requested and verified.

## 2. Proje Özeti

Aday Öğrenci Takip Sistemi, dershane/kurs aday öğrenci arama ve takip operasyonları için offline-first PWA tabanlı yerel CRM sistemidir.

Temel alanlar:

- Excel import
- Aday listesi
- Sağ kişi kartı
- Arama kaydı
- Hatırlatma / geri arama
- Notlar
- Detaylı export
- Özet rapor
- Tam sistem yedeği / geri yükleme
- Pilot kullanım

## 3. Mimari ve Teknoloji

- React + Vite + TypeScript
- PWA
- IndexedDB / Dexie
- SheetJS/xlsx
- Vitest
- Offline-first local data yaklaşımı
- Domain logic ve UI ayrımı

## 4. Güncel Sprint Durumu

No-Phone Candidate Import Setting tamamlandı.

Özet:

- Import ekranında `Telefonsuz adayları içe aktar` ayarı bulunur; varsayılan OFF ve session-only'dir.
- Ayar storage'a yazılmaz; yeni dosya, reset, tamamlanan import ve sayfa yenilemede OFF'a döner.
- OFF iken geçerli kullanılabilir telefonu olmayan satırlar import edilmez.
- ON iken öğrenci adı bulunan gerçekten telefonsuz satırlar öğrenci olarak yazılabilir; PhoneRecord oluşturulmaz.
- Geçerli Anne/Baba telefonu ile Telefon 2 veya Telefon 10 gibi alternatif slotlar kullanılabilir telefon sayılır.
- Invalid-only telefon satırları her iki modda da veri kalitesi hatasıyla engellenir.
- Simulation policy snapshot'ı `allow_no_phone_candidates` ile taşınır; writer backup/write öncesinde policy uyumunu doğrular.
- Mevcut telefonsuz kayıtlar silinmez, gizlenmez veya geriye dönük temizlenmez.
- Validation: focused import 5 dosya / 83 test PASS; OOM-safe full suite 45 dosya / 328 test PASS; Playwright import E2E 4/4 PASS; build PASS.

### Önceki Uygulama Durumu

Phone-Level Outcome Read Model Pilot code tarafı tamamlandı ve pushlandı.

Özet:

- Sağ kart Telefon 1/2 ve Telefon 3+ phone card'larında read-only `Son sonuç` göstergesi eklendi.
- Veri kaynağı mevcut `call_logs` kayıtlarıdır.
- Telefon sonucu eşleştirme önceliği: `contacted_phone_id`, `phone_snapshot.phone_id`, `phone_id`, normalized phone number fallback.
- Schema migration yapılmadı.
- `PhoneRecord` mutate edilmedi ve `phone_status` semantiği değiştirilmedi.
- Import/export/backup davranışı değişmedi.
- Yeni call result değeri eklenmedi.
- Communication history delete/edit davranışı eklenmedi.
- Sağ kart ✓ / x davranışı şimdilik korunur; sadeleştirme ayrı discovery konusudur.
- Test/build geçti: `npm.cmd test -- --run` PASS, 43 test file / 276 tests; `npm.cmd run build` PASS, yalnızca Vite chunk size warning.
- Bu docs closure tamamlanınca `docs/CHECKPOINT_PHONE_LEVEL_OUTCOME_READ_MODEL.md` resmi kapanış checkpoint'i olacaktır.

## 5. Çoklu Telefon Roadmap Durumu

Tamamlananlar:

- Sprint 9.3A: Multi-phone core model / compatibility helpers
- Sprint 9.3B-1: Phone context model helpers for calls and reminders
- Sprint 9.3B-2: Phone context persistence wiring
- Sprint 9.3C: Phone context read/display model layer
- Sprint 9.3D-1: Call history UI phone context display
- Sprint 9.3D-2: Reminder list UI phone context display
- Sprint 9.3E-1: Right card multi-phone read model
- Sprint 9.3E-2: Right card multi-phone UI display
- Sprint 9.3F-1: Phone 3+ call save selection
- Sprint 9.3G-2: Import UI progressive disclosure
- Sprint 9.3G-4: Multi-phone import mapping/simulation
- Sprint 9.3G-5: Multi-phone import writer/persistence
- Phone-Level Outcome Read Model Pilot: latest phone call outcomes read-only from `call_logs`

Sıradaki muhtemel aşamalar:

- Mahalle/Ilce Import Pilot docs-only review/commit after Strategy AI approval
- Obsidian/Graphify update değerlendirmesi
- Localhost manuel QA / dar pilot readiness kontrolü
- Dar pilot öncesi kırıcı bug/risk değerlendirmesi
- Dar pilot sonrası AD/SOYAD + Anne/Baba + Mahalle data model discovery/implementation
- Export/report/backup uyumu discovery
- Mobile polish ve diğer pilot sonrası işler

Not:
Büyük çoklu telefon roadmap'i ayrı kalır: Excel'den çoklu telefon import, sağ kişi kartında dinamik/aşamalı telefon gösterimi, `+N numara daha göster`, import/export ve backup/restore güvence işleri ayrı sprintlerde ele alınacaktır.

Not:
Phone-Level Outcome Read Model Pilot ile sağ kartta telefon bazlı son sonuç göstergesi read-only olarak tamamlandı. Kaynak `call_logs` olduğu için tam geçmiş düzenleme/silme, phone-level persistence ve outcome export/import hâlâ ayrı ürün kararlarıdır. Graphify pasif yardımcı analiz aracıdır, resmi kayıt değildir. Obsidian vault repo dışıdır; resmi kayıt repo docs dosyalarıdır. Terminal/Git source of truth.

Not:
Akıllı Operasyon Yardımcıları gelecekte park edilmiş fazdır. İlk yaklaşım dış AI değil; Telefon Kalitesi, Arama Öncelik, Hatırlatma Öneri, Veri Kalitesi ve Yönetici Özet gibi offline / rule-based / testable helper fikirleri olmalıdır. Dış AI/LLM ancak KVKK, gizlilik, offline-first ve maliyet discovery sonrasında ele alınır.

Not:
Bu roadmap öneri seviyesindedir. Her yeni iş öncesi ayrı discovery/plan yapılmalıdır.

## 6. Kritik Proje Kararları

- Excel export backup değildir; geri yükleme için Tam Sistem Yedeği kullanılır.
- Kullanıcıya teknik “JSON backup” dili gösterilmez.
- Campaign default: Diğer.
- 3 tuşu kritik shortcut olarak kullanılmaz.
- Statuses stable key / Turkish label yaklaşımı korunur.
- `students.lifecycle_status`, `students.last_call_result` ve `call_logs.call_result` ayrımı korunur.
- Arama operasyonu Aday Listesi + sağ kişi kartı üzerinden yürür.
- Smart assistants dış AI API ile değil, offline/rule-based olarak roadmap’te tutulur.
- Import/export/backup/restore/migration işleri yüksek risklidir; önce plan/discovery gerekir.

## 7. Çalışma Protokolü

Yeni AI / Codex için:

1. Önce git durumunu kontrol et.
2. Önce `docs/PROJECT_MEMORY.md`, `docs/FILE_MAP.md`, `docs/DECISIONS.md` oku.
3. `docs/AI_WORKFLOW_GOVERNANCE.md` içindeki ÜST EMİR ve iş türü standardını kullan.
4. Sadece ilgili checkpoint’i oku; tüm checkpoint’leri gereksiz okuma.
5. Kod yazmadan önce gerçek kaynak dosyaları incele.
6. Plan/discovery istendiyse dosya değiştirme.
7. Uygulama istendiyse sadece onaylanan kapsamı uygula.
8. Kod işlerinde test/build çalıştır ve raporla.
9. Docs-only işlerde `src/` ve `tests/` altına dokunma.
10. Commit/push/merge yapma; sadece önerilen commit mesajı ver.
11. Kapsam dışı iyi fikirleri uygulama; sonraki işler bölümüne yaz.

## 8. Yasaklar / Kırmızı Çizgiler

- Kullanıcı onayı olmadan dosya değiştirme.
- Commit/push/merge yapma.
- Branch silme.
- Yeni paket kurma.
- Büyük refactor yapma.
- Kapsam dışı migration yazma.
- Import/export/backup/restore mantığını izinsiz değiştirme.
- UI dönüşümü başlatma.
- Test/build yapmadan kod işi tamamlandı deme.
- Eski context’e güvenip repo dosyalarını okumadan işlem yapma.

## 9. Yeni AI İçin Başlangıç Komutu

Bu projeye yeni başlayan AI önce şunları yapmalı:

- git branch --show-current
- git status --short
- git log --oneline --decorate -10
- `docs/PROJECT_MEMORY.md` oku
- `docs/FILE_MAP.md` oku
- `docs/DECISIONS.md` oku
- `docs/HANDOFF_CURRENT.md` oku
- `docs/AI_WORKFLOW_GOVERNANCE.md` oku
- ilgili sprint checkpoint’ini oku
- sonra sadece rapor ver; kullanıcı onayı olmadan dosya değiştirme

## 10. Şu Anki En Güvenli Sonraki Adım

Şu anki en güvenli sıradaki iş:
WhatsApp icon polish sonrası repo docs / handoff / governance sync review ve Strategy AI onayı sonrası docs commit/push.

Bunun ardından:
Anne/Baba implementasyonu hemen başlatılmamalıdır. Önce `DISCOVERY — Agent Context / Repo Hygiene Standardization` yapılmalı; repo hygiene/risk scan, agent instruction standardization ve context export/prompt-pack stratejisi değerlendirilmelidir.

Yeni kod işi başlatmadan önce latest HEAD, working tree, gerçek/demo data alanı ayrımı, Drive/Obsidian sync seviyesi ve bu docs governance sync'in commit/push durumu doğrulanmalıdır.

Telefon 3-10 mapping/simulation, gerçek import writer/persistence, sağ kart latest phone outcome read model, AD/SOYAD composition ve Mahalle/İlçe import pilot tamamlandı. Anne/Baba implementasyonu ertelendi ve guardian/contact model kararı gerektirir. Communication history delete/correction, Phone Action Simplification ve phone-level outcome persistence/export ayrı discovery olmadan uygulanmamalıdır.

## 11. Kaynak Dosyalar

- docs/PROJECT_MEMORY.md
- docs/FILE_MAP.md
- docs/DECISIONS.md
- docs/AI_WORKFLOW_GOVERNANCE.md
- docs/CHECKPOINT_SPRINT_9_3B_2.md
- docs/CHECKPOINT_SPRINT_9_3B_1.md
- docs/CHECKPOINT_SPRINT_9_3C.md
- docs/CHECKPOINT_SPRINT_9_3D_1.md
- docs/CHECKPOINT_SPRINT_9_3D_2.md
- docs/CHECKPOINT_SPRINT_9_3E_1.md
- docs/CHECKPOINT_SPRINT_9_3E_2.md
- docs/CHECKPOINT_SPRINT_9_3F_1.md
- docs/CHECKPOINT_SPRINT_9_3G_2.md
- docs/CHECKPOINT_SPRINT_9_3G_4.md
- docs/CHECKPOINT_SPRINT_9_3G_5.md
- docs/CHECKPOINT_PARENT_LOCATION_IMPORT_DECISION.md
- docs/CHECKPOINT_IMPORT_STUDENT_LOCATION_FIELDS.md
- docs/MULTI_PHONE_ARCHITECTURE_PLAN.md
- docs/PILOT_FINDINGS.md
- .prompts/codex-start.md
- .prompts/feature-plan.md
- .prompts/feature-apply.md
- .prompts/sprint-close.md

## Latest Handoff Update - Communication History Soft Delete

- Current safe HEAD/origin: `a9e891c feat: soft delete communication history`.
- Communication History Soft Delete + Student Summary Recompute Pilot implementation is complete and pushed.
- Working tree should be clean after implementation; this docs-only closure is pending Strategy AI approval before docs commit/push.
- Suggested docs commit: `docs: close communication history soft delete checkpoint`.
- Implementation behavior: call history entries are soft-deleted via `call_logs.deleted_at` / `updated_at`; student latest communication summary is recomputed from remaining active `call_logs`.
- Reminder/appointment-linked call logs are blocked from deletion in this MVP; no cascade delete/detach is performed.
- No schema migration, import/export format change, backup/restore behavior change, PhoneRecord mutation, edit/correction, or undo behavior was added.

## Latest Handoff Update - Import AD/SOYAD Composition

- Current safe HEAD/origin: `ee7b12f feat: compose student names from ad soyad import`.
- Import AD/SOYAD Composition Pilot implementation is complete and pushed.
- Working tree should be clean after implementation; this docs-only closure is pending Strategy AI approval before docs commit/push.
- Suggested docs commit: `docs: close import ad soyad composition checkpoint`.
- Implementation behavior: Excel import can compose `AD` + `SOYAD` into existing `student_full_name` without adding persistent first/last name fields.
- `student_first_name` and `student_last_name` are import/simulation-only fields; writer persists composed `student_full_name` only.
- Full-name column wins over `AD/SOYAD` and emits warning: `Tam ad alanı bulunduğu için Ad/Soyad alanları birleştirme için kullanılmadı.`
- Only `AD` imports with warning: `Soyad alanı bulunamadı; öğrenci adı yalnızca Ad alanından oluşturuldu.`
- Only `SOYAD` is blocked with: `Soyad alanı tek başına öğrenci adı oluşturmak için yeterli değil.`
- `Veli Adi`, `Anne adi`, and `Baba Adi` are not treated as student AD/SOYAD; Anne/Baba guardian import remains a later discovery.
- No schema migration, export/report format change, backup/restore behavior change, Mahalle/Ilce implementation, or guardian model change was added.
- Telefon 1-10 slot fidelity remains preserved.
- Test/build passed: `npm.cmd test -- --run` PASS, 45 test files / 294 tests; `npm.cmd run build` PASS with known Vite chunk-size warning.
- Manual localhost QA QA-1 through QA-7 passed.

## Latest Handoff Update - Parent / Location Import Decision

- Current safe HEAD/origin: `92dfb4e docs: close import ad soyad composition checkpoint`.
- Anne/Baba/Mahalle/İlçe import discovery is complete and concluded `NEEDS HUMAN DECISION`.
- No code, test, schema, import writer, export, backup/restore, or runtime behavior changed during discovery.
- This docs-only decision checkpoint records that Anne/Baba will not be included in the next small import slice.
- Anne/Baba must not be used as a student name source and must not overwrite `Veli Ad Soyad`.
- Anne/Baba requires a later guardian/contact model decision.
- Mahalle/İlçe is the accepted smaller next candidate, but it should use explicit optional student fields if implemented; it must not be stored in `general_note` as a note-prefix hack.
- Export/search/backup/restore impact for Mahalle/İlçe must be decided before implementation.
- AD/SOYAD composition and Telefon 1-10 mapping/import/export behavior must remain untouched.
- `dev-server.log` may appear as an untracked local runtime file; do not stage, commit, delete, or document it as a product artifact.
- Suggested docs commit after approval: `docs: record parent location import decision`.

## Latest Handoff Update - Mahalle / Ilce Import Pilot

- Current safe HEAD/origin: `70705af feat: import student location fields`.
- Mahalle/Ilce Import Pilot implementation is complete and pushed.
- This docs-only closure is pending Strategy AI approval before docs commit/push.
- Suggested docs commit after approval: `docs: close student location import checkpoint`.
- Import supports optional `Mahalle` -> `neighborhood` and `Ilce` / `Ilce` -> `district`.
- `StudentRecord` now has optional non-indexed `neighborhood` and `district` fields.
- Dexie schema version did not change; `src/db/schema.ts` and `src/db/db.ts` were not changed.
- Mahalle/Ilce is not stored in `general_note`.
- Import simulation preview carries location values; writer persists them on student records.
- Student list/read model carries location values; the right drawer shows `Mahalle / Ilce` as a small read-only line when data exists.
- Empty Mahalle/Ilce, only Mahalle, and only Ilce are allowed and do not block import.
- AD/SOYAD composition, Telefon 1-10 slot fidelity, and Veli/Anne/Baba student-name safety behavior remain unchanged.
- Anne/Baba guardian/contact model remains deferred.
- Export/report/search/filter/backup/restore behavior was not expanded.

## Latest Handoff Update - Playwright Import E2E Smoke Pilot

- Current safe HEAD/origin: `6a02ef4 feat: add import e2e smoke test`.
- First Playwright browser-level import QA smoke pilot is complete and pushed.
- This docs-only closure is pending Strategy AI approval before docs commit/push.
- Suggested docs commit after approval: `docs: close import e2e smoke checkpoint`.
- New script: `npm.cmd run qa:import:e2e`.
- The smoke test covers one narrow real-browser import flow: runtime-generated Excel upload, AD/SOYAD composition, Mahalle/Ilce, phone import, manual `Veli Adi` -> `Veli Ad Soyad` mapping, completing import, opening Aday Listesi, selecting the imported student, checking right drawer values, and console/page error guard.
- This is not the full import regression matrix. Telefon 1-10 full slot fidelity, Telefon 10-only, empty/partial Mahalle/Ilce, Anne/Baba safety, export E2E, backup/restore E2E, CI integration, and broad selector/test-id coverage remain later phases.
- Validation passed: `npm.cmd run qa:import:e2e` PASS, 1 test; `npm.cmd test -- --run` PASS, 45 test files / 299 tests; `npm.cmd run build` PASS with known Vite chunk-size warning.
- On a new machine Chromium may need one-time install: `npx.cmd playwright install chromium`.
- `test-results/` is ignored. `dev-server.log` may appear as an untracked local runtime file; do not stage, commit, delete, or treat it as product documentation.
- Test/build passed: `npm.cmd test -- --run` PASS, 45 test files / 299 tests; `npm.cmd run build` PASS with known Vite chunk-size warning.
- Manual QA QA-1 through QA-8 and console/runtime checks passed.
- Next recommended step: do not start Anne/Baba implementation. Run `DISCOVERY — Agent Context / Repo Hygiene Standardization` first.
- `dev-server.log` may appear as an untracked local runtime file; do not stage, commit, delete, or document it as a product artifact.

## Latest Handoff Update - Playwright Import Regression Matrix Phase 2A

- Current implementation HEAD/origin: `0980cdb feat: add import e2e regression matrix`.
- Previous checkpoint: `90f70e3 docs: close import e2e smoke checkpoint`.
- Phase 2A implementation is complete and pushed; this docs-only closure awaits Strategy AI approval before docs commit/push.
- Suggested docs commit after approval: `docs: close import e2e regression checkpoint`.
- `npm.cmd run qa:import:e2e` now runs the original smoke test plus `e2e/import-regression.spec.ts` with one Playwright worker.
- Regression coverage now includes Telefon 1-10 preservation, empty Mahalle/Ilce acceptance without an empty drawer line, and Anne/Baba fields not creating a student name.
- Validation passed: Playwright 4/4, Vitest 45 files / 299 tests, and production build PASS; only the known Vite chunk-size warning remains.
- No production `src/`, schema, export, backup, or restore behavior changed.
- `test-results/` stays ignored. `dev-server.log` is local runtime output and must not be staged, committed, deleted, or treated as a project artifact.
- On a new machine Chromium may require: `npx.cmd playwright install chromium`.
- Later Phase 2B candidates are Telefon 10-only, only-Mahalle/only-Ilce, invalid/duplicate phones, duplicate import warning flow, and minimal selector hardening only if flakiness appears.

## Latest Handoff Update - Detailed Export Guardian Names

- Current safe HEAD/origin: `9b030a8 feat: export guardian parent names`.
- Previous checkpoint: `eca0fe9 docs: close explicit guardian phone relations checkpoint`.
- Detailed Export Guardian Names implementation is complete and pushed; this docs-only closure awaits Strategy AI approval before docs commit/push.
- Suggested docs commit after approval: `docs: close detailed export guardian names checkpoint`.
- Detailed export now includes `Veli Ad Soyad`, `Anne Adı`, and `Baba Adı`, with Anne/Baba immediately after Veli.
- Guardian selection is relation-aware: `guardian` or legacy `null` maps to Veli, `mother` to Anne, and `father` to Baba. Same-relation duplicates use stable `created_at`, then `id` ordering.
- Telefon 1-10 slot fidelity is unchanged. Parent relation phones remain in their existing slots and no separate parent-phone columns were added.
- Summary export, backup/restore, import, schema, UI and Playwright were not changed.
- Validation passed: focused export tests 3 files / 24 tests; OOM-safe full suite 45 files / 315 tests; build PASS with known Vite chunk-size warning.
- Next recommended slice: backup/restore guardian roundtrip guarantee, starting as a test-only change.
- `dev-server.log` remains local runtime output and must not be staged, committed, deleted, or treated as a project artifact.

## Latest Handoff Update - Adaptive Summary Export Columns

- Current safe HEAD/origin: `6347cfa feat: add adaptive summary export columns`.
- Previous checkpoint: `6924ec2 docs: close backup restore guardian roundtrip checkpoint`.
- Adaptive summary export implementation is complete and pushed; this docs-only closure awaits Strategy AI approval before docs commit/push.
- Suggested docs commit after approval: `docs: close adaptive summary export checkpoint`.
- Veli remains fixed; Anne, Baba, Mahalle and İlçe are dataset-adaptive.
- Telefon 1/2 remain fixed and the report expands through the highest used slot up to Telefon 10, always with matching status columns.
- Slot-faithful `phones[]` prevents Telefon 7-only, Telefon 10-only and parent relation phones from moving into compatibility slots.
- Validation fails fast on omitted optional data, out-of-plan/out-of-range slots, missing status headers or mismatched row/header lengths.
- Detailed export, import, backup/restore, schema, UI, Playwright and package files were not changed.
- Validation passed: focused export 4 files / 34 tests; OOM-safe full suite 45 files / 321 tests; build PASS with known Vite chunk-size warning.
- The session-only/default-off no-phone import setting was completed in `71c9072`; `Veli Bilgisi` UI polish remains a separate optional decision.
- Reusable Codex safety prompt skeleton is a monitored trial, not a permanent roadmap standard; revert to stricter manual prompts if it creates scope drift.
- `dev-server.log` remains local runtime output and must not be staged, committed, deleted, or treated as a project artifact.

## Deferred Roadmap Idea - Reporting Area V2

- `Reporting Area V2: Aday Pipeline Görselleştirme` gelecekte adayların Yeni data → arama/ulaşma → potansiyel → randevu → geldi/gelmedi → demo/seviye çalışması → kayıt görüşmesi → kayıt/takip/vazgeçti akışını görselleştirebilir.
- Hedef dönüşüm oranlarını, süreç tıkanmalarını ve takım/personel bazlı aday akışını yönetim paneli seviyesinde okunur sunmaktır.
- Bu fikir aktif scope değildir; adaptive summary export kapanışına yeni implementation işi eklemez.
- Import/export/backup veri güvenliği ve mevcut raporlama alanı olgunlaşmadan başlanmamalıdır.
- LMS/ERP/öğrenci portalı fikirlerinden ayrıdır ve yalnızca mevcut aday takip/kayıt görüşmesi sürecine özeldir.

## Latest Handoff Update - No-Phone Import Setting

- Current safe HEAD/origin: `71c9072 feat: add no-phone import setting`.
- No-phone import setting implementation is complete and pushed; this docs-only closure awaits Strategy AI approval before docs commit/push.
- Suggested docs commit after approval: `docs: close no-phone import setting checkpoint`.
- User-facing setting: `Telefonsuz adayları içe aktar`.
- Default is OFF. The setting is session-only, is not written to localStorage/sessionStorage and resets on new file, reset, completed import and page refresh.
- OFF blocks rows without a valid usable phone. ON permits a true no-phone row with a student name and creates no PhoneRecord.
- Valid explicit Anne/Baba phones and valid alternate Telefon N slots count as usable phones.
- Invalid-only phone rows remain blocked in both modes.
- Writer validates the simulation summary's `allow_no_phone_candidates` policy snapshot before backup/write.
- Existing no-phone records are not deleted, hidden or retroactively cleaned.
- Schema, export, backup/restore and student screens were not changed.
- Validation passed: focused import 5 files / 83 tests; OOM-safe full suite 45 files / 328 tests; Playwright import E2E 4/4; build PASS with known Vite chunk-size warning.
- `dev-server.log` remains local runtime output and must not be staged, committed, deleted or treated as a project artifact.

## Next Recommended Actions

1. Google Drive / Obsidian strategy shadow vault sync is overdue. It is behind repo docs from the old `e6f580b` state and should be synchronized to `71c9072` only when explicitly requested.
2. After that sync, choose the next product slice through a separate decision/discovery task.

Repo docs remain the source of truth. The Drive/Obsidian strategy vault is a separate context layer and must not be updated implicitly by Codex. Reporting Area V2 remains deferred roadmap only. The reusable safety skeleton plus task-specific customization remains a monitored trial and must be reverted if scope drift or control loss appears.

## Latest Handoff Update - Backup Restore Guardian Roundtrip Guarantee

- Current safe HEAD/origin: `c6876de test: guarantee guardian backup restore roundtrip`.
- Previous checkpoint: `b48ce74 docs: close detailed export guardian names checkpoint`.
- Test-only guardian backup/restore guarantee is complete and pushed; this docs-only closure awaits Strategy AI approval before docs commit/push.
- Suggested docs commit after approval: `docs: close backup restore guardian roundtrip checkpoint`.
- Existing Full System Backup preserves Veli, Anne, Baba and legacy null-relation guardian records without creating fake records.
- Relation-aware phones preserve `guardian_id`, `relation_label`, `source_column`, `reference_label` and `priority`, including a relation-labeled phone with `guardian_id: null`.
- `src/db/backup.ts` required no change. Schema, import, export, UI, E2E and package behavior remain unchanged.
- Validation passed: focused backup/restore test 1 file / 8 tests; OOM-safe full suite 45 files / 316 tests; build PASS with known Vite chunk-size warning.
- Next recommended step: summary export phone compatibility discovery/product decision before implementation.
- `dev-server.log` remains local runtime output and must not be staged, committed, deleted, or treated as a project artifact.
## Latest Handoff Update - Phone Outcome Tracking + Compact UI Polish

- Current safe HEAD/origin: `667d501 fix: polish phone outcome card menu layout`.
- Implementation chain: `f7eccc2 feat: add phone-level call outcome tracking` followed by `667d501 fix: polish phone outcome card menu layout`.
- Every phone can now carry its own phone-level `call_outcome` and `call_outcome_updated_at`; legacy missing values display as `Aranmadı`.
- The compact phone card layout is HEADER slot/relation, BODY phone number plus horizontal ✓ / x, FOOTER `Son sonuç` plus outcome chip.
- The outcome chip is explicit-click only; it does not write call logs, change candidate general status, trigger quick-call behavior, or cycle values on one click.
- The outcome menu uses portal/fixed positioning, top/bottom viewport-aware placement, constrained `max-height` / `overflow-y`, and a corrected anchor gap so it remains visually attached to the chip.
- Backup/restore preserves outcome fields. Import/export mapping was intentionally not changed for this MVP.
- No source, test, package, deployment, schema, import/export, backup, or VDS changes are part of this docs closure.
- VDS pilot direction is `/demo` on Windows VDS/domain; implementation/deployment is a later task and Vite base path must be checked before deploy.
- New checkpoint: `docs/CHECKPOINT_PHONE_OUTCOME_TRACKING_AND_UI_POLISH.md`.
- Suggested docs commit after review: `docs: close phone outcome ui checkpoint`.

