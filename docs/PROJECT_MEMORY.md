<!-- Son guncelleme: React Router Security Product Decision | Branch: sprint-9-2-multi-phone-architecture-plan -->

# PROJECT_MEMORY — Aday Öğrenci Takip Sistemi

Bu dosya Codex oturumlarında ilk okunacak kısa proje hafızasıdır.

## Sistem Sağlığı

- PROJECT_MEMORY: React Router Security Product Decision
- FILE_MAP: SheetJS Security Remediation Production Closure
- DECISIONS: React Router Security Product Decision
- WhatsApp outbound disconnect PRODUCTION CLOSED: implementation `847ac24 feat: suspend whatsapp outbound integration`, pre-production docs closure `d2a4eff docs: close whatsapp outbound disconnect`. Draft modal/local metin hazırlama ACTIVE; outbound WhatsApp integration TEMPORARILY DISCONNECTED. Local manual QA, focused `2` dosya / `28`, canonical `59` dosya / `636` test, VDS deployment ve production smoke QA PASS.
- Cleanup implementation checkpoints: `9ddc519 feat: add student group cleanup correction` and `77542a5 feat: add student group cleanup maintenance ui`.
- Latest deployed/integration HEAD: `f12e2a0 fix: make production build use demo base`.
- Model C+ implementation: `4f643a4 feat: complete appointment lifecycle`. Checkpoint A/B/C CLOSED; Final Integration `PASS WITH NOTES`; production deployment `PASS`; live QA `FULL PASS`.
- Checkpoint C validation: StudentsPage history `31/31`; lifecycle/read-model/history `3` dosya / `82`; reminders `10` dosya / `72`; combined lifecycle `14` dosya / `168` test iki ardışık koşuda PASS; build PASS (bilinen Vite chunk-size warning).
- A+B+C tamamlandı ve production'da kapandı. Migration, backfill, DB version/index ve package/dependency değişikliği yoktur; appointment için ReminderRecord oluşturulmaz.
- Production target `a617b09`; Windows VDS kaynak repo `C:\Sites\aday-ogrenci-takip-sistemi`, statik yayın `C:\Sites\netvadi-demo`, public URL `https://netvadi.com/demo/` altındadır. Doğrulanmış publish yedeği: `C:\Backups\netvadi-demo_20260818_004229`; rollback gerekmedi.
- Controlled Legacy Student Group Cleanup (`MODEL B`) PRODUCTION CLOSED: product decision, Checkpoint A/B, final integration, production deployment and production smoke QA tamamlandı. Production smoke QA `PASS — data-limited`tir.
- Student Card Profile Editing / `Bilgileri Güncelle` V1 `PRODUCTION FEATURE COMPLETE`: Checkpoint B implementation `e64c15d feat: add student profile editing ui`, deployed target `3b8d017 docs: close student profile editing checkpoint b`. Windows VDS deployment ve production browser smoke QA PASS'tir. Canonical Student Search Reindex Checkpoint A `b3dbd63 feat: add student search reindex maintenance ui` COMPLETE, Strategy Review PASS, local manual QA PASS, production deployment `155dde6` COMPLETE, production browser QA PASS ve production reindex COMPLETE'tir. Feature `PRODUCTION CLOSED`dur.
- SheetJS Security Remediation `PRODUCTION CLOSED`: implementation `a0505ff feat: remediate sheetjs dependency security`, canonical `/demo/` build hotfix'i `f12e2a0 fix: make production build use demo base`. Discovery/decision, Strategy Review, local manual QA, production deployment ve user-confirmed production browser QA `PASS`tir.
- React Router / React Router DOM Security: Discovery `COMPLETE`, product decision `DECIDED`; implementation `NOT STARTED`, Strategy Review/manual QA/production deployment/production QA `PENDING`. Dependency security programı açıktır; sonraki execution gate bu dar Router remediation'dır.
- Current terminal HEAD/origin: yeni işe başlamadan önce Git ile doğrulanmalıdır.
- Güncel branch: sprint-9-2-multi-phone-architecture-plan
- Beklenen final working tree: yalnız `?? dev-server.log`

## Current Product Decision - SheetJS Security Remediation

- [Security Scope] Pre-remediation direct production dependency `xlsx@0.18.5` browser bundle'ına giriyor ve kullanıcı seçimi `.xlsx` / `.xls` workbook byte'larını browser'da `XLSX.read(...)` ile parse ediyordu. Checkpoint A bunu `xlsx@0.20.3` ile değiştirdi; crafted workbook input için discovery'de doğrulanan plausible runtime exposure, belirli bir exploit chain iddiasına dönüştürülmedi.
- [Artifact + Distribution] Resmi SheetJS Community Edition `0.20.3` artifact'i `vendor/xlsx-0.20.3.tgz` olarak vendored durumdadır. Boyutu `2,409,319` byte, SHA256 değeri `8DC73FC3B00203E72D176E85B50938627C7B086E607C682E8D3C22C02BB99FE8`dir. Package dependency tam olarak `"xlsx": "file:vendor/xlsx-0.20.3.tgz"`; deployed runtime target `xlsx@0.20.3`dür. `npm ci` deterministic local resolution ile PASS'tir. Artifact unpack/edit edilmemiş, SheetJS implementation'ında production `src/**` değiştirilmemiştir.
- [Security Outcome] `GHSA-4r6h-8v6p-xvw6` ve `GHSA-5pgg-2g8v-p4x9` kaldırıldı. Son audit full graph `9` grup (`2` low, `7` high), production-only `2` grup (`react-router`, `react-router-dom`) gösterir; bu slice npm audit'i sıfırlamaz ve dependency security genelini kapatmaz.
- [Validation] Focused Excel `3` dosya / `14` test, canonical `65` dosya / `672` test, production build, import E2E `6/6` ve browser export/download E2E `1/1` PASS'tir. XLSX chunk `493.28 kB` (`160.68 kB` gzip) oldu; bilinen genel Vite chunk warning non-blocking'dir. Yeni coverage date/time görünür import contract, gerçek legacy `.xls`/BIFF, malformed/empty workbook, export round-trip ve gerçek browser download'u kapsar.
- [Strategy + Local QA] İlk Strategy Review, test-only JavaScript `Date` / `Date.UTC(...)` fixture'ının `Pacific/Kiritimati` altında host-timezone handling nedeniyle visible date'i kaydırdığını buldu; bu production defect değildi. Test-only fix, Excel serial `46037.1875`, `yyyy-mm-dd hh:mm:ss` formatı ve exact `2026-01-15 04:30:00` raw:false çıktısıyla Default/UTC/Pacific-Kiritimati PASS verdi; narrow ve final Strategy Review PASS'tir. Kullanıcı-confirmed local manual browser QA: `.xlsx` import, legacy `.xls` import ve gerçek Excel export/download PASS.
- [Initial Deployment Incident] İlk production target `c8af973`de VDS fast-forward, `xlsx@0.20.3` install/artifact integrity, build, static publish ve live root HTTP `200` başarılıydı. Ancak bare `npm.cmd run build`, root `/assets/...`, `/manifest.webmanifest` ve `/registerSW.js` referansları üretti; root asset URL'leri unrelated `text/plain` içerik döndürürken gerçek dosyalar `/demo/assets/...` altında kaldı. `vite.config.ts` base'i CLI `--base` argümanından türetir ve argüman yoksa `/`e çözer; önceki başarılı VDS deploy'ları `npm.cmd run build -- --base=/demo/` kullanıyordu. Bu build-invocation contract regression'ıydı, SheetJS runtime veya Caddy defect'i değildi; ilk browser deployment production QA PASS kabul edilmedi.
- [/demo/ Build Hotfix + Final Deploy] `f12e2a0` yalnız `package.json` build scriptini `tsc -b && vite build --base=/demo/` yaptı; `package-lock.json`, `vite.config.ts`, `src/**`, tests, E2E, vendor ve Caddy değişmedi. Final VDS build'i plain `npm.cmd run build` ile `/demo/assets/...`, `/demo/manifest.webmanifest`, `/demo/registerSW.js` üretti; PWA `start_url`/`scope` `/demo/` oldu. Main JS/CSS ve `xlsx-BD77uNrC.js` (`493,280` byte) live HTTP `200` ve uygun JavaScript/CSS MIME ile doğrulandı; `https://netvadi.com/demo/` ve `https://www.netvadi.com/demo/` PASS'tir.
- [Production Browser QA + Next Slice] User-confirmed production QA: application opens, live `.xlsx` import, live legacy `.xls` import ve live Excel export/download PASS. SheetJS slice `PRODUCTION CLOSED`dur; dependency security genel programı açık kalır. `npm audit fix` / `--force`, React Router/React Router DOM, Vite, PostCSS, nanoid, undici, fast-uri, brace-expansion, @babel/core, glob ve source-map remediation ayrı işlerdir; sonraki aday React Router / React Router DOM'dur.

## Current Product Decision - React Router / React Router DOM Security

- [Current State] Direct dependency `react-router-dom@^7.15.0`, installed/lock `react-router-dom@7.15.0` ve onun tek transitive dependency'si `react-router@7.15.0`dır. `react-router` direct dependency değildir; tek Router version pair vardır.
- [Security Decision] Production audit `2` bulgu (`1 low`, `1 high`) ve `GHSA-84g9-w2xq-vcv6`, `GHSA-wrjc-x8rr-h8h6`, `GHSA-h8fp-f39c-q6mh`, `GHSA-337j-9hxr-rhxg`, `GHSA-chx6-hx7r-mcp5`, `GHSA-qwww-vcr4-c8h2` Router advisory setini raporlar. SSR/RSC/document request/hydration yolları bu client-only Vite SPA'da kullanılmasa da vulnerable production dependency remediate edilecektir.
- [Architecture + Subpath] Router `createBrowserRouter`/`Navigate`, `RouterProvider`, `Link`/`NavLink`/`Outlet`/`useLocation`/`useNavigate` kullanır; SSR, RSC, server action, loader/action, Router redirect ve hydration API yoktur. `basename`, `import.meta.env.BASE_URL`den türetilir; canonical `vite build --base=/demo/` ile `/demo` olur. Bu slice basename/config veya Caddy değişikliği yapmaz; `/demo/students` direct refresh production SPA fallback QA'sında doğrulanacaktır.
- [Approved Target] `react-router-dom@^7.18.2` ve onun transitive `react-router@7.18.2` pair'i onaylı hedefdir. `react-router` direct dependency eklenmez; major migration yoktur.
- [Disposable Evidence] Isolated candidate `7.18.2/7.18.2`: router-focused `5` dosya / `56` test, canonical `65` dosya / `672` test, production build ve import browser regression `6/6` PASS verdi. Candidate `npm audit --omit=dev` `0` vulnerability; full audit'te Router bulguları kalktı, yalnız later slices için unrelated `1 low` / `6 high` kaldı.
- [Next Gate] Implementation yalnız `package.json` ve `package-lock.json` hedefler. `src/**`, Vite/basename, Caddy, tests/E2E, vendor ve SheetJS değişmez; gerçek compatibility/coverage kanıtı aksi gerektirirse ayrı karar gerekir. Önce implementation validation + Strategy Review, sonra local ve production QA çalışacaktır.

## Latest Checkpoint - Canonical Student Search Reindex Checkpoint A

- Implementation `b3dbd63 feat: add student search reindex maintenance ui` COMPLETE. Surface: `Ayarlar -> Veri Sağlığı / Bakım -> Arama İndeksini Yeniden Oluştur`; UI existing `reindexActiveStudentSearchText` service'ini kullanır, Dexie traversal veya direct reindex write mantığını tekrar etmez.
- Shared Settings-session backup gate `locked -> download_initiated -> confirmed` existing Full System Backup'ı kullanır. Saved-file checkbox kullanıcı beyanıdır; app dosyanın diskte saklandığını teknik olarak doğrulamaz. Same mounted Settings session'da confirmed gate cleanup ve reindex için ortak kullanılabilir; reindex kartı bu onayın varlığını görünür açıklar ve ikinci backup istemez.
- Reload/remount ve successful restore shared gate'i resetler; persistent bypass yoktur. Her reindex run'ı için ayrı operation confirmation gerekir; loading/ref duplicate guard vardır. Reindex yalnız `search_text`i gerekirse günceller, audit veya `updated_at` mutate etmez.
- Strategy Review başlangıçta `CHANGES REQUIRED` verdi: ortak backup confirmation reindex yüzeyinde açık değildi. MEDIUM finding, current-session status ve gerçek cleanup-to-reindex cross-operation integration testiyle kapandı; Narrow Strategy Re-Review PASS'tir.
- Final validation: focused `1` dosya / `9` test, related `6` dosya / `44` test, canonical `64` dosya / `667` test ve production build PASS. Bilinen Vite chunk-size warning non-blocking'dir; `git diff --check` PASS'tir.
- Local Manual QA PASS: card/profile scope, backup download ve saved-file attestation, per-run confirmation, gerçek local reindex, first run `scanned_students: 1670` / `updated_students: 1669`, idempotent second run `1670` / `0`, guardian/phone/class/group/district/neighborhood search, general note/campaign exclusion, restore control availability ve reload gate reset doğrulandı. Bu sayılar yalnız test edilen local browser/profile içindir.
- Production deployment `155dde6` COMPLETE; production browser QA PASS ve production reindex COMPLETE'tir. First production run `scanned_students: 70` / `updated_students: 70`, idempotent second run `70` / `0` doğruladı. Bakım yüzeyi doğru göründü; deploy/page load automatic reindex çalıştırmadı, backup gate ve ayrı per-run confirmation PASS'tir. Bu başarı yalnız current production browser profile + current origin IndexedDB için geçerlidir; global, all-device veya VDS completion iddiası yoktur. VDS source `C:\Sites\aday-ogrenci-takip-sistemi`, static publish `C:\Sites\netvadi-demo`, live URL `https://netvadi.com/demo/`; index, `/demo/assets/index-OV_41tXq.js`, `/demo/assets/index-BWFm6r7p.css` ve `registerSW.js` HTTP 200 doğrulandı. Caddy restart gerekmedi/yapılmadı. `harita.html` deploy öncesinde mevcut değildi; precondition veya preservation iddiası yapılmadan application deployment bağımsız tamamlandı.
- Historical school-as-neighborhood ambiguity reindex tarafından düzeltilmez; mevcut stored inputs'tan derived `search_text` yeniden üretilir. Migration, DB version/table/index, package, WhatsApp ve Student Profile Editing değişikliği yoktur.

## Current Product Decision - WhatsApp Outbound Disconnect

- [Decision State] `847ac24 feat: suspend whatsapp outbound integration` ile WhatsApp Draft Mode ACTIVE, WhatsApp outbound integration TEMPORARILY DISCONNECTED durumundadır. Student-card aksiyonu yalnız modalı açar; phone/context çözümü, template render/local override, draft edit ve clipboard copy korunur.
- [Outbound Boundary] Executable `wa.me`, WhatsApp Web/API, `whatsapp://`, WhatsApp hedefli `window.open`, browser redirect, anchor, iframe, prefetch veya background request yoktur. `src/features/whatsapp/whatsappUrl.ts` silinmiştir; uygulama clickable WhatsApp outbound link üretmez.
- [Logging Truth] Modal açılması WhatsApp açıldı/gönderildi/teslim edildi iddiası oluşturmaz. Current UI yalnız explicit `copied` ve `manually_marked_sent` loglarını yazar; manuel işaret CRM takip bilgisidir, teslimat onayı değildir.
- [Validation] Local manual QA PASS; modal açılırken yeni tab/window veya WhatsApp navigation yok, taslak edit/copy çalışır ve `WhatsApp'ta Aç` kontrolü kalmaz. Focused `2` dosya / `28`, canonical `59` dosya / `636` test ve build PASS; yalnız bilinen Vite chunk-size warning vardır. `642 → 636` test farkı beş obsolete WhatsApp-link normalization ve bir `wa.me` URL-construction testinin silinmesidir; geçerli draft/CRM coverage kaybolmamıştır.
- [Production Deployment] VDS repo `C:\Sites\aday-ogrenci-takip-sistemi` branch'te `2826ea3 → d2a4eff` fast-forward edildi. `npm.cmd ci` PASS; mevcut deprecation uyarıları ve audit çıktısındaki `10` vulnerability (`2` low, `8` high) bu deployment tarafından üretilmiş yeni bulgu değildir ve deploy'u bloklamadı. `npm.cmd run build -- --base=/demo/` PASS verdi; yalnız bilinen Vite chunk-size warning görüldü. `dist`, `robocopy .\dist C:\Sites\netvadi-demo /MIR /R:2 /W:2` ile yayınlandı; exit code `3` başarılı/non-fatal kabul edildi. VDS repo `d2a4eff`, origin `0/0` ve temiz durumdadır; yayın hedefi `C:\Sites\netvadi-demo\index.html`dir.
- [Production Smoke QA] Live `/demo/` PASS: öğrenci kartı aksiyonu taslak modalını açar; yeni tab/window, `wa.me` veya WhatsApp Web navigation oluşmaz; taslak görünür ve düzenlenebilir, kopyalama çalışır, `WhatsApp'ta Aç` outbound kontrolü yoktur. Bu doğrulama bu listeyle sınırlıdır.
- [Future Boundary] Bu geçici disconnect ürün fikrinin kalıcı olarak silindiği anlamına gelmez. Dış bağlantının yeniden değerlendirilmesi yeni bir explicit product discovery/decision gerektirir; sessizce yeniden etkinleştirilemez.

## Latest Product Closure - Controlled Legacy Student Group Cleanup

- Decision base: `000fe6d docs: close model c plus deployment`. Seçilen model `MODEL B - Review + Per-record Correction`dır; Checkpoint A implementation commit'i `9ddc519 feat: add student group cleanup correction`dır. Batch cleanup, silent/automatic mutation, migration ve historical bulk backfill yoktur.
- Checkpoint A CLOSED: ortak canonical detector assessment/predicate, read-only candidate reader, `updated_at` taşıyan candidate DTO ve dedicated per-record correction service tamamlandı. Reader ile write transaction aynı eligibility/revalidation kuralını kullanır.
- Detector trim sonrası exact `11. Sınıf YKS Hazırlık` eşleşmesini ve `current_class` sinyallerini kullanarak `high_confidence` veya `needs_review` adayı üretir. Detector sonucu yalnız inceleme adayıdır; string pattern provenance veya write authorization değildir.
- `high_confidence` yalnız inceleme önceliğidir. UI dili `Yüksek olasılıklı` ve `İnceleme gerekli` olacaktır; `Kesin hatalı kayıt` denmeyecektir.
- İlk sürüm yalnız kayıt bazlı düzeltmedir. Kullanıcı mevcut kaydı görmeli, hedef öğrenci grubunu açıkça seçmeli/yazmalı, düzeltme nedeni vermeli ve işlemi ayrıca onaylamalıdır.
- Kaynak/orijinal veri gerçek grubu doğruluyorsa exact doğrulanmış değer kullanılabilir. Kaynakta Öğrenci Grubu yoksa veya boşsa persisted neutral value `""` olur; UI bunu `Belirtilmemiş` gösterebilir. Sınıf, category, campaign veya başka alanlardan öğrenci grubu türetilmez.
- `category` bu scope'ta değiştirilmez; yalnız inceleme bağlamı olarak gösterilebilir. Category cleanup ayrı product/data decision gerektirir.
- İlk write öncesinde Tam Sistem Yedeği zorunludur. Doğru kontrat, mevcut full backup'ın student cleanup rollback için gerekli `students` ve `audit_logs` state'ini korumasıdır; bütün uygulamanın byte-for-byte snapshot'ı olduğu iddia edilmez. İlk rollback yolu pre-cleanup backup restore'dur; dedicated batch rollback kapsam dışıdır.
- Correction service explicit `verified_value` / `unspecified` intent ayrımı kullanır. `unspecified` persisted `""` yazar; verified target kullanıcıdan gelen trim edilmiş gerçek değerdir. Sınıf, category, campaign veya başka alandan grup türetmez; `category` mutate edilmez ve correction reason zorunludur.
- Her correction transaction içinde StudentRecord yeniden okunur; missing/deleted/stale/non-candidate durumları ve `expected_updated_at` stale guard fail-closed doğrulanır. Monotonic `updated_at` ile `student_group`, `search_text`, `updated_at` ve append-only audit aynı transaction'da atomiktir; audit failure öğrenci update'ini rollback eder.
- Audit student id, old/new değer, düzeltme nedeni, risk/confidence, kaynak metadata, actor/performed_by ve before/after bağlamı taşır. Schema değişikliği yapılmadı.
- Shared deterministic `studentSearchText` builder correction sırasında mevcut ilişkili veriden `search_text`i yeniden kurar; blind string replacement yoktur. ImportWriter aynı builder'ı kullanır ve mevcut import search semantics korunur.
- Düzeltme call log, reminder, appointment, campaign, guardian relation, phone slot, call summary veya student summary alanlarını değiştirmez. Reporting V2 özel recompute gerektirmez; liste/filtre/export güncel StudentRecord'u doğal olarak okur.
- Seçilen UI yüzeyi `Settings -> Veri Sağlığı / Bakım`dır. StudentsPage içine cleanup paneli eklenmez, historical cleanup import ekranına karıştırılmaz ve batch action sunulmaz.
- Initial validation: detector + correction `2` dosya / `16` test PASS; import writer + student list reader `2` dosya / `51` test PASS; import + students `20` dosya / `226` test PASS; build PASS (yalnız bilinen Vite chunk-size warning).
- Strategy Review `PASS WITH NOTES` verdi. Reject-path persisted DB-state assertion ve shared search helper direct contract coverage notları test-only hardening ile kapatıldı. Post-hardening: focused `3` dosya / `18` test PASS; import writer + student list reader `2` dosya / `51` test PASS; imports + students `21` dosya / `228` test PASS; build PASS; narrow re-review PASS. Açık Checkpoint A bulgusu yoktur.
- Checkpoint B CLOSED: `77542a5 feat: add student group cleanup maintenance ui` ile `Settings -> Veri Sağlığı / Bakım` yüzeyinde `useLiveQuery` candidate list, `Tümü` / `Yüksek olasılıklı` / `İnceleme gerekli` filtreleri, per-record review modal ve reactive count/list refresh açıldı. StudentsPage cleanup paneli yoktur.
- Review modal öğrenci kimliği, sınıf, mevcut grup, read-only category, risk/evidence, kaynak metadata ile created/updated zamanı gösterir. Kullanıcı yalnız `verified_value` veya `unspecified` hedefini, zorunlu reason'ı ve ayrı correction confirmation'ı verir; `unspecified` persisted `""` olur.
- First-write backup gate `locked -> download_initiated -> explicit saved confirmation -> confirmed` olarak SettingsPage mount/session-local React state'te yaşar. Uygulama yalnız indirme isteğinin başlatıldığını bilir; dosyanın diskte saklandığını doğrulamaz. Saved confirmation kullanıcı beyanıdır; localStorage, sessionStorage, IndexedDB/DB bypass flag'i yoktur.
- Aynı Settings mount'unda ikinci correction yeni backup istemez; route unmount/reload ve successful restore gate'i resetler. Review snapshot `updated_at` correction request'in `expected_updated_at` değeridir; stale Checkpoint A service'iyle fail-closed kalır. Double-submit guard vardır.
- Initial Checkpoint B validation: focused Settings `2` dosya / `15`, Checkpoint A foundation `3` dosya / `18`, Settings + Students `16` dosya / `157`, Imports + Students `21` dosya / `228` test PASS; build PASS (bilinen Vite chunk warning). Strategy Review başlangıçta 5 finding ile `CHANGES REQUIRED` verdi.
- Truthful backup wording, modal timestamps, restore-reset integration, unspecified UI payload ve stale success feedback hedefli fixlerle kapandı. Post-fix focused Settings `2` dosya / `18`, Checkpoint A `3` dosya / `18`, Settings + Students `16` dosya / `160`, Imports + Students `21` dosya / `228` test PASS; build PASS. Narrow re-review PASS.
- Local manual QA PASS: bakım sekmesi/list/filter/review context'i, category read-only ve batch/auto-fix yokluğu doğrulandı. Correction confirmation, gerçek `.json` download initiation, saved confirmation, custom ve `Belirtilmemiş` correction, live refresh, same-session gate, pre-cleanup backup restore ve restore/reload sonrası gate reset başarıyla gözlendi. Student-list search'ün `student_group` aradığı varsayılmadı.
- Final Integration ilk olarak 24 logical CPU üzerinde uncapped Vitest'in 23 worker ile ilgisiz async UI testlerinde aralıklı fail üretmesini buldu. `1/2/4/8` worker matrix PASS verdi; en yüksek ölçülmüş stabil seviye olan `test.maxWorkers: 8` `2826ea3` ile canonical test config'e alındı. Timeout/retry/assertion zayıflatma, global serialization veya production code değişikliği yoktur.
- Committed `2826ea3` üzerinde canonical `npm.cmd test` `59` dosya / `642` test PASS, build PASS (yalnız bilinen Vite chunk-size warning) ve `npm.cmd run qa:import:e2e` `6/6` PASS verdi.
- Production deploy: Windows VDS repo `C:\Sites\aday-ogrenci-takip-sistemi` `a617b09 → 2826ea3` fast-forward edildi; `npm.cmd ci`, `/demo/` base build ve `robocopy .\dist C:\Sites\netvadi-demo /MIR` PASS tamamlandı. Robocopy exit code `3` normal/successful durumdur; service/container restart gerekmedi.
- Production smoke QA `PASS — data-limited`: `/demo/`, Settings ve `Veri Sağlığı / Bakım` yüzeyi doğrulandı. Production veri setinde eligible cleanup candidate olmadığından per-record review, backup-gate write, production correction write ve live candidate removal yeniden çalıştırılmadı; bu akışlar deploy öncesi local manual QA ve exact deployed HEAD automated regression ile doğrulanmıştı. QA için sahte/legacy veri enjekte edilmedi; product owner bu data-dependent write yolunun atlanmasını kabul etti.
- Kapsam dışı kalır: category cleanup/mutation, batch cleanup, silent auto-fix, migration, historical backfill ve StudentsPage cleanup paneli. Açık cleanup blocker'ı yoktur; yeni ürün işi ayrı scoped discovery ile seçilmelidir.

## Current Product Decision - Appointment Model C+

- `call_later` mevcut pending `call` reminder, alarm/list ve edit/complete/cancel/delete lifecycle'ı ile aynen korunur.
- `appointment` sonucunda ayrı sahte `call` reminder oluşturulmaz. Checkpoint A gerçek AppointmentRecord'u owner call log ve modern ters link ile atomik yazar; tarih/saat ve not kalıcıdır.
- Checkpoint A, appointment üzerinde embedded guardian-message state'ini kalıcılaştırır. Checkpoint B, veli mesaj görevi ve randevu saati alarmı için operasyonel reader/UI'ı uygular. Checkpoint C canonical lifecycle service ile mesaj görevi, randevu notu, erteleme ve terminal durum mutationlarını uygular; mesaj görevinin tamamlanması appointment'ı veya randevu alarmını kapatmaz.
- Veli mesaj görevi Europe/Istanbul yerel saatine göre: randevu saati 12.00 öncesiyse 24 saat, 12.00 ve sonrasındaysa 22 saat öncedir; hesaplanan saat 19.00'dan sonraysa aynı gün 19.00'a sabitlenir. Geç oluşturulmuş gelecekteki appointment için geçmişte kalan görev hemen due/overdue görünür.
- Reschedule aynı appointment'ı günceller, yeni mesaj görevini hesaplar ve önceki görevi geçersiz kılar. `completed`, `no_show` veya `cancelled` appointment pending mesaj görevini kapatır; reopen yoktur.
- Veli mesaj metadata'sı normal exporta girmez. Full System Backup appointment, embedded mesaj durumu ve create audit'ini korur. Historical appointment backfill yoktur; migration/backfill yapılmamıştır.

## Latest Checkpoint - Appointment Model C+ Checkpoint C

- Implementation/push: `4f643a4 feat: complete appointment lifecycle`.
- Canonical `appointmentLifecycle.ts`, aktif modern pending appointment'ı transaction içinde yeniden okur, fail-closed owner integrity ve stale-state koşullarını doğrular; appointment mutation ile append-only audit aynı transaction'dadır.
- `Mesaj Gönderildi` yalnız internal guardian-message state'ini tamamlar; external SMS/WhatsApp göndermez, appointment `pending` kalır, guardian item düşer ve start alarmı korunur. ReminderRecord oluşturulmaz.
- Randevu notu, erteleme, `Geldi`, `Gelmedi` ve `İptal` yalnız canonical lifecycle service üzerinden yürür. Terminal appointment/history korunur, read-only kalır ve reopen almaz.
- CallLog `Görüşme notu` ile AppointmentRecord `Randevu notu` bağımsızdır; auto-sync yoktur. Pencil yalnız call note'u, calendar icon yalnız randevu yönetimini açar. Pending owner call-log correction yalnız note-only'dir.
- Reschedule aynı appointment ID'yi, owner call log'u ve notları korur; Europe/Istanbul due time'ını yeniden hesaplar, generation'ı tam `+1` yapar, guardian sent state'ini sıfırlar ve yeni guardian/start identity'leri üretir.
- Strategy Re-Review `PASS WITH NOTES`; yalnız tekrar üretilemeyen geçici StudentsPage `act`/timing notu non-blocking kaldı. Manual QA FULL PASS'tir.
- Schema, migration, DB version/index, backfill, yeni tablo, package/dependency değişikliği yoktur. Full System Backup raw appointment/audit state'ini korur; normal export guardian operational metadata taşımaz.
- A+B+C implementation tamamlandı. Final Integration `PASS WITH NOTES` sonrasında target `a617b09` production'a yayınlandı; deployment `PASS`, live QA `FULL PASS`, rollback `NOT REQUIRED`.
- VDS Caddy static hosting kullanır; Node process/PM2/Docker/systemd/nginx/Caddy restart gerekmedi. `npm ci` ve pilot seed + `/demo/` base build PASS; `robocopy /MIR` publish sırasında `harita.html` korunarak başarılı tamamlandı. Migration/schema/package değişikliği yapılmadı.

## Previous Checkpoint - Appointment Model C+ Checkpoint B

- Implementation/push: `79cf2f9 feat: unify operational appointment alerts`.
- Unified operational reader mevcut `call_reminder` satırlarını korur; aktif C+ appointment'lardan fail-closed olarak `appointment_guardian_message` ve `appointment_start` satırlarını türetir. Appointment için ReminderRecord oluşturulmaz.
- Guardian-message satırı yalnız aktif öğrenci, aktif `pending` appointment, geçerli appointment/call-log reciprocal owner bağı, geçerli due time ve `guardian_message_sent_at === null` koşullarında üretilir.
- Aynı appointment iki bağımsız operasyonel satır üretebilir: `appointment_guardian_message|appointmentId|generation|dueAt` ve `appointment_start|appointmentId|appointmentAt`. Dismiss/chime identity'leri birbirinden bağımsızdır.
- `OperationalAlertHost` AppLayout altında tek kez mount edilir; tüm rotalarda 30 saniyelik polling, future list ve due/overdue popup/chime davranışını sağlar. Dismiss localStorage UI bastırmasıdır; DB write değildir. Escape yalnız popup varken onu kapatır.
- RemindersPage üç tür satırı gösterir; Checkpoint C guardian-message satırında canonical `Mesaj Gönderildi` aksiyonunu service'e bağlamıştır.
- Strategy re-review `PASS WITH NOTES`; düşük notlar overdue microcopy'deki "açık aramalar" ifadesi ve malformed non-null sent timestamp için ayrı testin olmamasıdır. Üretim fail-closed guard'ı güvenlidir.
- Manual QA PASS: aynı appointment'ın iki satırı, due/start sırası, bağımsız dismiss, call_later regression, route-independent host ve chime/polling doğrulandı.

## Previous Checkpoint - Appointment Model C+ Checkpoint A

- Implementation/push: `e16c6a3 feat: persist appointment model c plus`.
- Yeni appointment canonical `pending` status ile aynı Dexie transaction içinde owner call log, `appointment.call_log_id`, `call_log.created_appointment_id` ve `appointment_create` audit'iyle oluşturulur. Appointment branch ReminderRecord üretmez; `created_reminder_id` boş kalır.
- Embedded state: `guardian_message_due_at`, `guardian_message_sent_at`, `guardian_message_generation`. Due hesabı Europe/Istanbul'da 12.00 öncesi `-24 saat`, sonrası `-22 saat`; 19.00 sonrası aynı gün 19.00 cap uygular ve overdue timestamp'i korur.
- Pending modern owner'da missing/conflicting reciprocal, duplicate owner veya student mismatch delete/correction için fail-closed'dur. Generic correction non-appointment call log'u `appointment` sonucuna çeviremez; canonical create flow dışında eksik appointment sentezlenmez.
- Backup/restore embedded alanları, reciprocal linkleri ve appointment create audit'ini korur; normal export guardian-message metadata'sını taşımaz. Legacy eksik alanlar okunur, mutate/backfill edilmez.
- Manual QA PASS: reciprocal owner link, pending status, due timestamp, audit, appointment için reminder oluşmaması, pending owner delete block, generic correction reject ve `call_later` reminder regression doğrulandı.
- Checkpoint B unified operational alert view-model ve guardian/start alarm UI uyguladı. `Mesaj Gönderildi`, reschedule, complete/no_show/cancel ve lifecycle auditleri daha sonra Checkpoint C'de tamamlandı.

## Latest Checkpoint - Cancel Pending Linked Call Reminder

- Feature, repo docs, Windows VDS deployment ve feature-specific live QA tamamlandı/pushlandı: `e15a051 feat: cancel pending linked reminders`, `a2743a3 docs: close pending reminder cancellation`, `a8c1b09 docs: close reminder cancellation deployment`. Obsidian closure tamamlandı; Drive doğrulaması tamamlandı. Bu checkpoint aktif WIP/backlog değildir.
- Cancellation yalnız gerçek owner/current history satırında görünür. Authoritative yön `reminder.call_log_id → owner call log`dur; başka call log'lardaki aynı `created_reminder_id` değerleri tarihsel/shared reference olabilir ve owner cancellation'ı bloklamaz.
- Modern reciprocal owner `created_reminder_id === reminder.id` ile doğrulanır. Güvenli legacy owner `null/undefined` back-link ile kabul edilebilir; başka reminder ID'si, student mismatch, silinmiş owner veya birden fazla aktif pending reminder aynı owner'ı gösterirse işlem fail-closed'dur.
- Lifecycle yalnız `pending → cancelled`dır. Reminder silinmez; call log, student, appointment ve PhoneRecord mutate edilmez. Reopen veya `cancelled → pending` yoktur.
- UI StudentsPage history owner satırında `Hatırlatmayı İptal Et` aksiyonunu gösterir. Tooltip/aria `Hatırlatmayı iptal et`; modal `Hatırlatma iptal edilsin mi?`, optional neden, `Vazgeç` ve `Hatırlatmayı İptal Et` aksiyonlarını kullanır. Completion modalının ikincil aksiyonu da `Vazgeç` olarak netleştirilmiştir.
- `pending_reminder_cancel` audit marker'ı reminder status update ile aynı Dexie transaction'ında append-only yazılır. Pending reader/list/alarm yalnız pending kayıtları gösterir; normal export audit payload'ı taşımaz, Full System Backup cancelled status ve audit'i korur.
- Validation: Strategy Review `PASS WITH NOTES`, manuel QA `PASS`, `52` test dosyası / `530` test PASS, build PASS, `git diff --check` PASS. `NO MIGRATION`; `NO BACKFILL`.
- Deployment: VDS repo `a2743a3` ve origin ile senkron kaldı. Pilot seed flag ile `/demo/` base build PASS verdi; `C:\Backups\netvadi-demo_20260726_045705` static-root backup'ı doğrulandı. `robocopy /MIR /XF "harita.html"` deploy PASS (exit code `3`), Caddy restart edilmedi; index/CSS/JS ve `https://netvadi.com/demo/harita.html` HTTP 200 verdi. `harita.html` deploy öncesi/sonrası SHA256 değeri `BB1C59773E707B22A37779E439383457C6200CC3B32666F7F2C8EE3C290ED1BA` olarak korundu; rollback gerekmedi.
- Live QA: owner/current satırdaki cancellation, modalın `Vazgeç` akışı, başarılı cancellation sonrası görüşme kaydının korunması, pending list/alarmdan düşme, yenileme sonrası persistence ve belirgin edit/complete/delete regresyonu PASS. Shared/tarihsel owner senaryosu için önceki gerçek veri QA ve otomatik regresyon kapsamı geçerlidir; canlıda gereksiz destructive shared-history kaydı oluşturulmadı.
- Non-blocking teknik not: duplicate-owner doğrulaması reminder tablosunun tamamını okur; veri hacmi anlamlı büyürse ayrı performance discovery konusu olarak değerlendirilir.
- Ayrı deferred UX işi: iletişim geçmişi action bar için görünür `✓` ve diğer aksiyonların `⋯` menüsünde toplanması. Bu feature'ın kapsamı veya eksik işi değildir.
- Historical deployment audit snapshot: o kapanıştaki `npm ci` çıktısında `2 low` / `7 high` vulnerability ve yaklaşık `905 kB` minified ana JS chunk vardı; bu feature deployment blocker'ı değildi. Current dependency-security state için `SheetJS Security Remediation` kararı kaynak alınır; eski docs arşivindeki `Latest` başlıkları ayrı docs-hijyen işidir.
- Sonraki kapı: deployment/live-QA repo docs review → exact-path docs commit/push → Obsidian shadow update → Drive shadow verification → feature final closure. Obsidian ve Drive shadow henüz tamamlanmış değildir.

## Previous Checkpoint - Pending Linked Reminder Edit

- Latest closed product checkpoint: `e3f14aa docs: close pending linked reminder edit`.
- Implementation: `93b4471 feat: edit pending linked reminders`.
- Docs closure ve docs commit/push: PASS. Obsidian sync: PASS — kullanıcı paketi uyguladığını bildirdi. Drive shadow: TEYİT EDİLEMEDİ.
- Pending reminder yalnız gerçek owner/current call-log satırından tarih, saat ve not olarak düzenlenebilir. Shared/eski history satırları, tarihsel call-log snapshot'ı ve dependency linkleri korunur.
- Her başarılı reminder edit append-only audit üretir. Audit preview owner satırda pending, completed ve cancelled durumlarında kalır; edit/complete aksiyonları yalnız pending owner satırında görünür.
- Call-log correction lifecycle-aware çalışır: bağımsız kayıt full correction, active reminder/appointment block, terminal dependency note-only correction, missing/conflicting link fail-closed. Note-only işlem call time, result, phone context, dependency linkleri veya student summary alanlarını değiştirmez.
- Reminder edit ve correction auditleri transaction içinde append-only yazılır. Normal export audit payloadlarını içermez; Full System Backup audit kayıtlarını korur.
- Tooltip `document.body` portalı, adaptive placement ve delayed close ile çalışır. Uzun history notları wrap edilir; yatay overflow oluşturmaz.
- Validation: `52` test dosyası / `507` test PASS, build PASS, `git diff --check` PASS. Strategy Review: `PASS WITH NOTES`; BLOCKER/HIGH/MEDIUM yoktur.
- Non-blocking review notları: correction audit için doğrudan backup → restore → payload roundtrip testi ileride eklenebilir; correction/deletion terminal lifecycle listeleri için ortak policy discovery gelecekte değerlendirilebilir.
- Windows VDS deploy tarihi: 22 Temmuz 2026. VDS kaynak repo `C:\Sites\aday-ogrenci-takip-sistemi`, canlı statik klasör `C:\Sites\netvadi-demo`, public endpoint `https://netvadi.com/demo/`.
- Production build komutu: `$env:VITE_ENABLE_PILOT_SEED = "true"`; `npm.cmd run build -- --base=/demo/`; ardından `Remove-Item Env:\VITE_ENABLE_PILOT_SEED`. Build `/demo/` base ile PASS verdi; Caddy statik yayın yaptı ve restart gerekmedi.
- Canlıya `index-0qULszKd.js`, `index-fsXbIQqU.css` ve `xlsx-B7Fe_CV5.js` çıktı. Public index, JS, CSS ve `harita.html` HTTP 200 verdi. `harita.html` korundu; SHA256: `BB1C59773E707B22A37779E439383457C6200CC3B32666F7F2C8EE3C290ED1BA`.
- Deploy yedeği: `C:\Backups\netvadi-demo_20260722_123851`. Kullanıcı canlı QA sonucunu PASS olarak onayladı.
- Feature commit/push, VDS deploy, canlı QA, docs closure ve docs commit/push tamamlandı. Aktif tracked WIP yoktur; yalnız `?? dev-server.log` yerel runtime çıktısı bulunur.

## Previous Checkpoint - Stale Reminder Date Guard Fix

- Stale Reminder Date Guard Fix tamamlandı: `37d1fd5 fix: guard reminder creation to call later`.
- Problem: Daha önce hatırlatma atanmış adayda reminder tamamlandıktan sonra, formdaki eski `reminderDate` / `reminderTime` state'i kalabiliyor ve non-reminder görüşme sonucu seçilse bile `reminder_at` tekrar write payload'una gidebiliyordu.
- Kök neden: `StudentsPage` aynı adayda linked quick complete sonrası reminder tarih/saat state'ini temizlemiyordu; `saveCallAndGoNext` her result için `reminder_at` hesaplayabiliyordu; `callLogWriter` ise `input.reminder_at` varsa `call_result` değerine bakmadan pending reminder create/update yapıyordu.
- `isReminderCallResult` helper eklendi. Call reminder create/update artık yalnız `call_later` için yapılır.
- Non-reminder resultlarda stale `reminder_at` writer'a gitmez veya service guard tarafından ignore edilir; `created_reminder_id`, `reminder_at` ve `next_action` call log üzerinde null kalır.
- `StudentsPage`, `call_later` dışına geçişte stale `reminderDate` / `reminderTime` state'ini temizler. Linked quick complete sonrası aynı state temizlenir.
- `call_later` reminder davranışı korunur. Appointment lifecycle redesign yapılmadı. Existing pending reminder terminal/non-reminder result ile otomatik completed/cancelled yapılmadı.
- Schema, import/export, backup/restore, WhatsApp ve Reporting V2 davranışı değişmedi.
- VDS deploy edildi ve QA geçti. Kullanıcı QA sonucu: `QA geçti kanka.`
- Historical backlog notu: pending/linked reminder düzenleme UX problemi bu checkpoint anında açıktı. Bu ihtiyaç `93b4471` ile owner-only edit, audit preview ve lifecycle-aware correction olarak çözüldü.

## Latest Checkpoint - Linked Reminder Owner Row Visibility Fix

- Linked reminder owner-row visibility fix tamamlandı: `7636b57 fix: show linked reminder action only on owner history row`.
- Problem: aynı pending `created_reminder_id` birden fazla iletişim geçmişi satırında görünebildiği için eski linked satırlarda da `Hatırlatmayı tamamla` aksiyonu görünüyordu.
- Kök neden `completeReminder` bulk update değildi; `completeReminder` yalnız verilen reminderId kaydını `completed` yapar. Yanıltıcı görünüm, `callLogWriter`ın aynı adayda mevcut pending reminder varsa yeni reminder oluşturmak yerine mevcut reminder'ı güncellemesi ve eski call logların `created_reminder_id` referansını koruyabilmesiydi.
- `callHistoryReader` artık `canCompleteLinkedReminder` değerini yalnız owner/current row için true üretir. Owner önceliği `reminder.call_log_id` alanıdır; eksik/stale durumda aynı reminder id'ye bağlı aktif call loglar içinde latest `call_time`, sonra `created_at`, sonra `id` fallback'i kullanılır.
- Eski linked satırlarda quick complete action görünmez; sadece güncel/owner satırda görünür.
- `callLogWriter`, `completeReminder`, delete guard, schema, import/export, backup/restore ve WhatsApp davranışı değişmedi.
- VDS önce `39e3840` seviyesindeydi; `git pull` ile `39e3840..7636b57` fast-forward edildi. `npm ci`, `npm run build -- --base=/demo/` ve `robocopy /MIR` OK; robocopy `FAILED 0`; VDS HEAD/origin `7636b57`.
- Kullanıcı smoke sonucu: `Hepsi ok devam`.

## Latest Checkpoint - Linked Reminder Quick Complete

- Linked communication history policy iki commitlik zincirle güncellendi: `40cb62b fix: allow voiding closed linked call logs` ve `39e3840 feat: complete linked reminders from call history`.
- Pending reminder bağlantılı call log doğrudan silinemez; completed/cancelled reminder bağlantılı call log mevcut soft delete altyapısıyla `Geçersiz Say / Sil` yapılabilir.
- Pending appointment ve postponed appointment bağlantılı call log kayıtları bloklu kalır; terminal appointment status'ları soft delete için uygundur. Kararda status source of truth kabul edilir, yalnız tarih geçmişliği yeterli kriter değildir.
- Sağ kart iletişim geçmişinde pending reminder bağlantılı satırda küçük icon-only `Hatırlatmayı tamamla` aksiyonu görünür. Büyük yazılı yeşil buton kullanılmaz; anlam title/aria/confirmation üzerinden verilir.
- Hatırlatma tamamlama aksiyonu reminder `status` değerini `completed` yapar; call log silmez, link detach etmez ve aday özetini değiştirmez. Sonrasında mevcut delete guard doğal olarak soft delete'e izin verir.
- Confirmation modal kullanılır. Reminder cancel, appointment quick action, Reminders sayfasına navigasyon, Students page state preservation, reminder/appointment lifecycle redesign, export/import/backup formatı, Reporting V2 metrikleri ve WhatsApp akışları kapsam dışıdır.
- Validation: terminal status-aware delete policy phase için calls 6 files / 73 tests, reminders 7 files / 33 tests, reports 3 files / 22 tests, exports 4 files / 34 tests ve build PASS. Quick complete phase için calls 6 files / 77 tests, reminders 8 files / 37 tests, students 10 files / 90 tests, reports 3 files / 22 tests ve build PASS. Bilinen Vite chunk-size warning devam eder.
- `39e3840` VDS demo ortamına deploy edildi; kullanıcı smoke sonucunu `sıkıntı yok` olarak bildirdi. Smoke kapsamı: öğrenci kartında icon-only complete action çalışır ve sonrasında delete flow çalışır.

## Latest Checkpoint - Reporting V2 Summary MVP

- Reporting V2 Summary MVP iki commitlik zincirle tamamlandı: `13c53e5 feat: add reporting v2 summary` ve `68d2899 chore: polish reporting v2 layout`.
- Raporlar sayfasındaki mevcut günlük rapor korunur; Reporting V2 ayrı read-only yönetici özeti olarak görünür.
- Kaynak veri aktif `call_logs` kayıtlarıdır. `deleted_at` olan kayıtlar dışlanır. Tarih aralığı `call_time`, yoksa `created_at` üzerinden yerel gün başlangıç/bitiş sınırlarıyla hesaplanır.
- `İşlem gören tekil aday`, seçili tarih aralığında en az bir aktif call log'u olan farklı aday sayısıdır.
- `Randevu Verildi` ve `Kayıt Oldu` kartları CRM `call_result` sayımlarıdır; gerçek veli geldi/gelmedi, no-show, personel performansı veya kesin kayıt lifecycle metriki değildir.
- Kampanya kırılımı adayın güncel `students.campaign_id` değerine göre hesaplanır. Call log üzerinde campaign snapshot yoktur; adayın kampanyası sonradan değişirse geçmiş aralık kırılımı da değişebilir. UI içinde bu not gösterilir.
- Export/import/backup davranışı değişmedi. Schema/migration yapılmadı. Reporting V2 UI polish ayrı `reporting-v2-*` CSS sınıflarıyla yapıldı.
- Validation: implementation phase reports/calls/exports/imports/settings focused testleri, full serial `51 files / 416 tests` ve build PASS. UI polish phase reports/calls/settings focused testleri ve build PASS. Bilinen Vite chunk-size warning devam eder.
- VDS deploy sonrası kullanıcı smoke sonucunu sorun yok olarak bildirdi: `/demo` açıldı, Reports page açıldı, günlük rapor bozulmadı, Reporting V2 özet görünür, tarih aralığı ve kampanya filtresi çalışır, kampanya tablosu ve günlük trend görsel yerleşimi kabul edildi.

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
- Anne/Baba/Veli bilgileri mevcut `guardians` tablosunda ilişki türüyle tutulacaktır: `guardian`, `mother`, `father`; legacy `null` Veli kabul edilir.
- Anne Adı, Baba Adı ve Veli Ad Soyad öğrenci adı kaynağı değildir.
- İlk Anne/Baba uygulaması names-only olacaktır; explicit parent phones, export ve telefonsuz import ayarı ayrı dilimlerdir.
- Generic telefon başlıklarından Anne/Baba ilişkisi tahmin edilmez. Yalnızca açık Anne/Baba telefon kolonları ileride relation label taşıyabilir.
- `Telefonsuz adayları içe aktar` ayarı tamamlandı; varsayılan kapalıdır, yalnızca mevcut import oturumunda geçerlidir ve kalıcı storage'a yazılmaz.
- Anne/Baba names-only import tamamlandı. `mother_full_name` / `father_full_name` simulation alanları mevcut `guardians` tablosuna `mother` / `father` ilişkileriyle yazılır.
- `VELI ADI` / `Veli Adı` import kolon başlığı artık mevcut `guardian_full_name` / `Veli Ad Soyad` alanına otomatik eşleşir; `VELI AD SOYAD` davranışı korunur.
- Explicit Veli phone import tamamlandı. `VELI TEL`, `VELI TELEFON`, `VELI GSM`, `VELI CEP`, `Veli Telefonu` ve `Veli Cep Telefonu` başlıkları import-only `guardian_phone` alanına eşleşir.
- `guardian_phone` persistent student field değildir; schema/db değişmedi. Simülasyonda bu telefonlar `phones[]` hattına `relation_label: "Veli"` ve gerçek Excel `source_column` bilgisiyle katılır.
- Veli telefonu özel slota zorlanmaz; mevcut Telefon 1-10 slot fidelity / Excel kolon sırası korunur. Generic Telefon/GSM/Tel/Telefon 1 başlıklarından Veli ilişkisi tahmin edilmez.
- Veli adı varsa writer telefonu ilgili Veli guardian kaydına bağlar. Veli adı yoksa fake/boş guardian oluşturulmaz; `relation_label: "Veli"` korunur ve `guardian_id: null` kalabilir.
- `VELI ADI` / `VELI AD SOYAD`, Anne/Baba/Veli isimleri ve Veli phone alanları öğrenci adı kaynağı değildir.
- Guardian phone import davranışı `b486735` ile browser-level Playwright E2E altında da korunur. Senaryo `VELI ADI` + `VELI TEL`, `ANNE TEL`, `BABA TEL`, generic Telefon ve Veli adı olmadan Veli telefonu akışını sağ kart seviyesinde doğrular.
- Export, backup/restore, StudentsPage, WhatsApp, schema/db ve package/config davranışı bu Veli phone diliminde değişmedi.
- Reader Veli/Anne/Baba kayıtlarını relation type ile ayırır; legacy `relation_type: null` Veli olarak kalır.
- Sağ kart yalnızca dolu `Veli Ad Soyad`, `Anne Adı`, `Baba Adı` satırlarını kompakt gösterir.
- Explicit Anne/Baba phone relation import tamamlandı. Açık `ANNE TEL` / `BABA TEL` kolonları relation metadata taşır; generic telefon kolonlarından Anne/Baba ilişkisi çıkarılmaz.
- Parent phone slotları Excel kolon sırası ve sonraki uygun Telefon N kuralıyla atanır; Telefon 1-10 slot fidelity korunur.
- Anne/Baba adı varsa explicit parent phone doğru mother/father guardian kaydına bağlanır. İsim yoksa sahte guardian oluşturulmaz; relation label korunur ve `guardian_id: null` kullanılır.
- Detaylı export Veli/Anne/Baba adlarını relation-aware olarak taşır. Tam Sistem Yedeği guardian ve parent-phone relation metadata roundtrip davranışı explicit test ile garanti altındadır.
- Özet export artık dataset'e göre adaptiftir: Veli sabit kalır; Anne, Baba, Mahalle ve İlçe yalnızca en az bir dolu değer varsa eklenir. Telefon 1/2 sabittir; en yüksek kullanılan Telefon N slotuna kadar telefon/durum çiftleri üretilir ve slot fidelity korunur.
- Source-column UI ve `Veli Bilgisi` UI grup etiketi henüz uygulanmadı.

## 7. Aday Listesi / Arama Operasyonu

- Aday listesi ana operasyon ekranıdır.
- Sağ drawer kişi kartıdır.
- Kaydet ve sonrakine geç arama akışının merkezidir.
- Telefon 1/2, son görüşülen numara, yanlış numara davranışları korunur.
- Telefon 1/2 ve Telefon 3+ kartlarında son telefon bazlı görüşme sonucu read-only olarak gösterilir.
- Telefon bazlı son sonuç `call_logs` üzerinden türetilir; `PhoneRecord` mutate edilmez ve `phone_status` anlamı değişmez.
- Görüşme durumu kaydında telefon seçimi her sonuç için genel zorunluluk değildir. Telefon seçimi `reached` için zorunludur; `wrong_number` için seçilebilir telefon varsa zorunludur.
- `not_called`, `not_reached`, `call_later`, `appointment`, `do_not_call`, `not_interested` ve `registered` sonuçları telefon seçilmeden kaydedilebilir; kullanıcı telefon seçerse bağlam kayda geçebilir.
- `wrong_number` seçildiğinde adayda telefon var ama tüm telefonlar zaten `is_wrong` veya `phone_status: invalid` ise genel Yanlış Numara kaydı telefon seçmeden yapılabilir; call log null phone context taşır ve phone-level durumlar tekrar güncellenmez.
- Telefon seçilmeden yazılan call log kayıtları null phone context taşıyabilir; call history bu durumu `Telefon seçilmedi` fallback'iyle güvenli gösterir.
- Phone-level outcome/status yalnız telefon bağlamı varsa güncellenir; schema, import, export, backup/restore ve WhatsApp davranışı bu kural değişikliğinde değişmedi.
- Bağlantısız iletişim geçmişi kayıtları sağ karttan düzeltilebilir/düzenlenebilir veya `Geçersiz Say / Sil` ile soft delete yapılabilir.
- İletişim geçmişi edit/delete hard delete yapmaz; `call_logs.deleted_at` / `updated_at` kullanılır ve aday özeti aktif call log kayıtlarından yeniden hesaplanır.
- Bağlantılı iletişim kayıtlarında edit bloklu kalır. Delete/void politikası status-aware hale gelmiştir: pending reminder bloklanır, completed/cancelled reminder soft delete edilebilir; pending/postponed appointment bloklanır, terminal appointment status'ları soft delete edilebilir. Reminder/appointment cascade, detach veya otomatik iptal yapılmaz.
- İletişim geçmişi düzeltme sırasında `PhoneRecord` status/outcome alanları mutate edilmez.
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
- Sağ kart iletişim geçmişindeki pending reminder bağlantılı kayıtlar icon-only `Hatırlatmayı tamamla` aksiyonu sunar; aksiyon reminder'ı completed yapar, call log'u silmez/detach etmez ve aday özetini değiştirmez.

## 9. Export Kararları

- Detaylı Excel Export korunur.
- Detaylı export `Veli Ad Soyad`, `Anne Adı`, `Baba Adı` kolonlarını bu sırayla taşır; Anne/Baba kolonları Veli kolonunun hemen arkasındadır.
- Export guardian seçimi relation-aware çalışır: `guardian` ve legacy `null` Veli, `mother` Anne, `father` Baba kabul edilir.
- Aynı relation türünde birden fazla aktif kayıt varsa `created_at`, ardından `id` sırasındaki ilk kayıt kullanılır; eksik Anne/Baba hücreleri boş kalır.
- Telefon 1-10 slot fidelity korunur. Parent relation telefonları mevcut Telefon N slotlarında kalır; ayrı Anne Telefonu/Baba Telefonu kolonları üretilmez.
- Özet Görüşme Raporu eklendi.
- Özet rapor adı: Özet Görüşme Raporu (Fazla Detay İçermez)
- Özet raporda Kampanya ve Tekrar Arama Tarihi yoktur.
- Genel Açıklama ayrı, `call_logs.note` ayrı tutulur.
- Açıklama N / Açıklama N Tarihi dinamik kolonları dolu notlardan üretilir.
- Boş notlar kolon şişirmez.
- Export snapshot filtrelenmiş `student_id` listesinden beslenir.
- Özet export canonical satırları bir kez üretir ve aynı satırlardan `SummaryColumnPlan` çıkarır; ekstra DB sorgusu yapmaz.
- Özet export `phones[]` üzerinden slot-faithful çalışır. Telefon 7-only ve Telefon 10-only değerler kendi slotlarında kalır; ayrı Anne/Baba telefonu kolonları oluşturulmaz.
- Boş telefon slotlarının durum hücresi boştur; invalid non-empty telefon `Geçersiz format` olarak gösterilir.
- Adaptif plan ve sheet shape doğrulaması, dolu opsiyonel alanların veya telefon slotlarının kaybolması halinde açıklayıcı hatayla fail-fast davranır.

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
- Full System Backup guardian kayıtlarını ve telefon relation metadata'sını ham tablo kayıtlarıyla kayıpsız korur.
- Roundtrip testi `guardian`, `mother`, `father`, legacy `relation_type: null`, bağlı ve `guardian_id: null` parent telefon senaryolarını doğrular.
- Telefon `guardian_id`, `relation_label`, `source_column`, `reference_label` ve `priority` alanları restore sonrasında korunur.
- Bu garanti için backup implementation veya schema değişikliği gerekmedi; gelecek tablo/model değişiklikleri aynı testi güncel tutmalıdır.

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
- Dar Pilot Final Gate sonucu `PILOT READY WITH WARNINGS` olarak kaydedildi; `0e58928` seviyesi için blocker/high risk yoktur.
- VDS `/demo` manuel smoke kullanıcı tarafından okey bildirildi; bu not kullanıcı bildirimiyle sınırlıdır.
- Pilot öncesi zorunlu bugfix gerekmez; kısa manuel QA/smoke yeterli kabul edildi.
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
- Sonraki zorunlu aşama: WhatsApp icon polish sonrası repo docs / handoff / governance sync review. Yeni ürün kod işi başlatılmadan önce HEAD, working tree, gerçek/demo data alanı ve Drive/Obsidian sync durumu doğrulanmalıdır.

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

## Latest Checkpoint Closure - Adaptive Summary Export Columns

- Implementation commit: `6347cfa feat: add adaptive summary export columns`.
- Previous checkpoint: `6924ec2 docs: close backup restore guardian roundtrip checkpoint`.
- Summary export now derives adaptive columns from the actual exported canonical rows.
- `Veli Ad Soyad` remains fixed; Anne, Baba, Mahalle and İlçe appear only when at least one exported row has a value.
- Telefon 1/2 remain fixed; the report expands through the highest used Telefon N slot, up to Telefon 10, with a matching status column for every slot.
- Summary phone mapping uses slot-faithful `phones[]`; Telefon 7-only, Telefon 10-only and parent relation phones are not compressed or shifted.
- Empty phone status cells stay blank and invalid non-empty phones use `Geçersiz format`.
- In-memory fail-fast validation protects optional data, slot range, phone/status header pairing and row/header shape.
- Detailed export, import, backup/restore, schema, UI, E2E and package behavior were not changed.
- Validation passed: focused export 4 files / 34 tests; OOM-safe full suite 45 files / 321 tests; build PASS with known Vite chunk-size warning.
- New checkpoint: `docs/CHECKPOINT_ADAPTIVE_SUMMARY_EXPORT_COLUMNS.md`.
- Future Codex prompts may use a reusable safety skeleton only as a monitored trial; each prompt must remain task-specific and the trial must be abandoned if it causes scope drift or control loss.

## Latest Checkpoint Closure - No-Phone Import Setting

- Safe implementation commit: `71c9072 feat: add no-phone import setting`.
- Import ekranında kullanıcı etiketi `Telefonsuz adayları içe aktar` olan session-only ayar bulunur.
- Yardım metni: `Kapalıyken geçerli telefon numarası bulunmayan satırlar içe aktarılmaz. Anne veya Baba telefonu da telefon olarak kabul edilir. Bu ayar yalnızca mevcut içe aktarma işlemi için geçerlidir.`
- Ayar varsayılan OFF'tur; localStorage/sessionStorage'a yazılmaz ve yeni dosya, reset, tamamlanan import veya sayfa yenilemede OFF'a döner.
- OFF iken en az bir geçerli kullanılabilir telefonu bulunmayan satır import listesine girmez.
- ON iken öğrenci adı bulunan gerçek no-phone satırı öğrenci olarak yazılabilir; PhoneRecord oluşturulmaz ve mevcut guardian alanları normal kurallarla yazılabilir.
- Valid explicit Anne/Baba telefonu ile Telefon 2/Telefon 10 gibi alternatif slotlar kullanılabilir telefon sayılır.
- Invalid-only telefon satırları OFF ve ON modlarında veri kalitesi hatasıyla bloklanır; temiz no-phone satırı sayılmaz.
- Simulation özeti policy snapshot'ını `allow_no_phone_candidates` ile taşır; writer backup/write başlamadan önce summary-policy uyumunu doğrular.
- `no_usable_phone_count`, geçerli kullanılabilir telefonu olmayan satırları ayrı sayar; legacy `empty_phone_count` yeniden tanımlanmamıştır.
- Mevcut telefonsuz kayıtlar için silme, gizleme veya retroaktif cleanup yoktur.
- Schema, export, backup/restore ve student screens değişmemiştir.
- Validation: focused import 5 dosya / 83 test PASS; OOM-safe full unit 45 dosya / 328 test PASS; Playwright import E2E 4/4 PASS; build PASS; bilinen Vite chunk warning devam eder.
- Resmi kapanış kaydı: `docs/CHECKPOINT_NO_PHONE_IMPORT_SETTING.md`.

## Context Sync Note

- Google Drive / Obsidian strategy shadow vault, eski `e6f580b` durumundan güncel `71c9072` repo docs durumuna göre geridedir ve senkronizasyon artık gecikmiştir.
- Repo docs source of truth'tür; strategy vault ayrı bir katmandır ve açık görev olmadan Codex tarafından senkronize edilmez.
- Bir sonraki önerilen aksiyon önce Drive/Obsidian strategy vault sync, ardından yeni ürün dilimi kararıdır.
- Yeniden kullanılabilir güvenlik iskeleti + görev-özel özelleştirme yaklaşımı hâlâ kontrollü denemedir; scope drift veya kontrol kaybı görülürse geri alınır.

## Future Roadmap - Reporting Area V2

- `Reporting Area V2: Aday Pipeline Görselleştirme` fikri roadmap'e park edilmiştir; aktif implementation scope değildir.
- Olası pipeline Yeni data, Arandı, Ulaşıldı/Ulaşılamadı, Potansiyel, Randevu verildi, Geldi/Gelmedi, Demo ders/seviye çalışması, Kayıt görüşmesi, Kayıt oldu ve Vazgeçti/Takipte aşamalarını içerebilir.
- Amaç data → randevu → gelen → kayıt dönüşümünü, süreçteki tıkanmaları ve takım/personel bazlı aday akışını yönetici için okunur hale getirmektir.
- Bu fikir yalnızca aday takip ve kayıt görüşmesi sürecimize özeldir; LMS, ERP veya öğrenci portalı projesi değildir.
- Import/export/backup veri güvenliği ve mevcut rapor alanı oturmadan başlatılmayacak, mevcut önceliklerin önüne geçmeyecektir.

## Current Product Decision - Student Card Profile Editing V1

- [Decision State] Product owner `MODEL 1` small dedicated modal kararını onayladı. Checkpoint A `d6b7620 feat: implement student profile editing checkpoint a` ve Checkpoint B `e64c15d feat: add student profile editing ui` `COMPLETE / PASS`tır. Student card `⋮` → `Aday işlemleri` içinde mevcut `Adayı Sil` altında `Bilgileri Güncelle` açılır; seçili adayı hedefler, popover'ı kapatır ve navigation, delete veya WhatsApp aksiyonu başlatmaz.
- [Modal + Editable Surface] Küçük dedicated modal `Aday Bilgilerini Güncelle` yalnız `student_full_name`, `current_class`, `student_group`, `neighborhood`, `district` ve zorunlu `Değişiklik Nedeni` alanını taşır. `general_note`, `category`, `campaign_id`, guardians, phones ve lifecycle/call alanları V1 dışında kalır. Ad trim sonrası zorunludur ve `normalized_student_name` yeniden üretilir; boş sınıf `null`, boş grup `""`, boş mahalle/ilçe `null` persist edilir. Sınıf/grup/category bağımsızdır; otomatik türetme yoktur.
- [Fresh Reader + Save Boundary] Modal, kart/liste state'ini save baseline'ı olarak kullanmaz; açılışta `readStudentProfileForEdit` ile id, uuid, beş editable değer, read-only provenance ve `updated_at` içeren fresh snapshot alır. Reader failure fail-closed'dur. Save `updateStudentProfile`a id, uuid, fresh `expected_updated_at`, beş onaylı alan, mandatory reason ve `performed_by: agent` gönderir; StudentsPage doğrudan Dexie write, arbitrary StudentRecord patch, search-text rebuild veya audit write yapmaz.
- [Provenance + Audit] Varsa `source_file_name`, `source_sheet_name` ve `source_row_number` modalda salt-okunur context'tir; partial/missing source context temiz ele alınır ve profile patch'e girmez. Update service zorunlu trim edilmiş reason, transaction içi authoritative reread, UUID/missing/deleted/stale/no-change fail-closed guard, monotonik `updated_at` ve aynı transaction'da `entity_type: student`, `action_type: update`, `field_name: student_profile_edit` audit'i uygular. Audit failure öğrenci mutation'ını rollback eder.
- [Validation + Async UX] Blank/whitespace ad veya reason save'i bloklar. No-change, stale, write/audit/service failure ve missing/deleted/UUID mismatch modalı açık ve kullanıcı girdisini korunmuş bırakır; auto retry/merge ve false success yoktur. Save sırasında button disabled ve handler-level duplicate-submit guard vardır; modal güvenli olmayan şekilde kapanmaz. Cancel yalnız saving değilken kullanılabilir. Reader request counter'ı late read'in başka seçili adayın modal state'ini ezmesini önler.
- [Success + Error Mapping] Başarılı save success feedback sonrasında modalı kapatır; mevcut Dexie/live-query akışı listeyi, kartı ve seçili detay state'ini tam sayfa reload olmadan yeniler. Bilinen reader/update hata kodları Turkish validation, missing, deleted/ineligible, UUID mismatch, stale, no-change, `student_write_failed` ve audit-failure mesajlarına map edilir; bilinmeyen hatada generic fallback kullanılır.
- [Canonical Search + Reindex] Shared `studentSearchText` öğrenci adı, aktif guardian adları, aktif phone values, sınıf, grup, district ve neighborhood'u kapsar. Import writer, pilot/demo seed, cleanup correction ve profile update aynı canonical rebuild'e hizalıdır. Controlled `reindexActiveStudentSearchText(database?: AppDatabase)` `{ scanned_students, updated_students }` döndürür; callable/testable, deterministic/idempotent, active-record-only ve tek transaction'dır; yalnız farklıysa `search_text`i günceller, deleted kayıtları atlar ve rollback dışında partial success üretmez. Profile/business alanları, category/campaign/provenance, `updated_at` ve audit mutate edilmez. Yeni/updated yollar canonical text üretse de, untouched historical browser kayıtları stale/incomplete `search_text` taşıyabilir. Local manual QA ve production browser/profile reindex'i explicit maintenance action ile çalıştırıldı; static VDS deploy browser Dexie/IndexedDB'yi kendiliğinden mutate edemez.
- [Reindex Operational Model V1] Production-safe invocation `Ayarlar -> Veri Sağlığı / Bakım` altında ayrı `Arama İndeksini Yeniden Oluştur` section olarak `b3dbd63` ile implement edildi. Operation yalnız current browser profile + current origin IndexedDB'yi kapsar, global/device-wide completion iddiası taşımaz. İlk run öncesi session-local maintenance backup gate `locked -> download_initiated -> explicit saved confirmation -> confirmed` gerekir; app download initiation dışında dosyanın diskte olduğunu kanıtlayamaz. Same mounted Settings session'da cleanup ve reindex shared confirmation kullanabilir; reindex yüzeyi bunu görünür açıklar. Her run ayrıca explicit operation confirmation ister; loading/duplicate guard, scanned/updated counters ve `updated_students = 0` için `Arama indeksi zaten güncel.` bilgi durumu vardır. Hata auto retry/restore yapmaz; existing Full System Restore manuel disaster-recovery yoludur. Reload/remount/successful restore gate'i sıfırlar; persistent bypass yoktur.
- [Reindex Boundaries] Backup reindex-relevant `students`, `guardians`, `phones` tablolarını içerir; `whatsapp_draft_logs` mevcut full-backup table set'i dışındadır fakat reindex ona dokunmaz. Aynı uygulamanın başka tab/window'unda backup + reindex sırasında candidate write yapılmamalıdır. Search dışında `general_note`, call/interview notes, campaign, priority, pilot-only extras ve non-authoritative school tokenı dışarıda kalır. Historical school-as-neighborhood ambiguity temizlenmez; UI yalnız indeksin kayıt verisini düzeltmediğini açıklar. Yeni audit, audit schema/action type, `updated_at`, schema/version/table/index/package, sync, global lock, WhatsApp veya profile-edit değişikliği yoktur.
- [Production Closure + Validation] Implementation chain: `479ac09` product decision, `e1445a7` canonical search decision, `d6b7620` Checkpoint A, `e65b681` Checkpoint A docs, `e64c15d` Checkpoint B UI ve deployed `3b8d017` Checkpoint B docs closure. Focused UI `6/6`, relevant Checkpoint B `6` dosya / `81`, canonical `63` dosya / `658`, build ve import E2E `6/6` PASS'tir; bilinen Vite chunk-size warning non-blocking'dir. Windows VDS `C:\Sites\aday-ogrenci-takip-sistemi` kaynak repo `d2a4eff → 3b8d017` fast-forward, `npm ci`, `/demo/` base Vite build ve `robocopy` static publish ile PASS tamamlandı; static backup `C:\Backups\netvadi-demo_20260825_050337` oluşturuldu, Caddy restart gerekmedi. Live `/demo/`, yeni JS/CSS ve `registerSW.js` HTTP 200 verdi.
- [Production Browser QA + Status] User-confirmed production browser smoke QA PASS: `Bilgileri Güncelle` `Adayı Sil` altında görünür, dedicated modal/fresh values/provenance/approved fields doğru; successful save sonrası modal kapanır, list/card reactive yenilenir, reopen persistence, no-change, blank-required validation ve cancel davranışı çalışır. Profile edit WhatsApp outbound/navigation side effect üretmez. Student Profile Editing V1 `PRODUCTION DEPLOYED / PRODUCTION QA PASS / PRODUCTION FEATURE COMPLETE`tir. Reindex Checkpoint A implementation/local manual QA complete, production deployment `155dde6` COMPLETE, production browser QA PASS ve production reindex COMPLETE'tir. Bu completion yalnız current production browser profile + current origin IndexedDB içindir; bu historical closure anında sonraki feature henüz seçilmemişti. Current next gate SheetJS Remediation Checkpoint A'dır.
- [Safety / Architecture] WhatsApp Draft Mode ACTIVE fakat outbound TEMPORARILY DISCONNECTED kalır; profile editing'in outbound WhatsApp side effect'i yoktur. Schema migration, DB version bump, yeni table/index veya package/dependency değişikliği yoktur.

## Latest Checkpoint Closure - Guardian + Phone UI Clarity

- Safe implementation commit: `ead391b feat: clarify guardian and phone labels`.
- Sağ öğrenci kartındaki contact alanının başlığı `Veli Bilgileri` olarak sabitlendi. Daha uzun `Veli / Anne / Baba Bilgileri` başlığı kullanılmadı.
- Dolu Veli, Anne ve Baba adları mevcut ayrı satır etiketleriyle gösterilmeye devam eder.
- Telefon slot başlıkları `Telefon 1`, `Telefon 2`, `Telefon 3` ... biçiminde sabit kalır; relation bilgisi slot adının yerine geçmez.
- Anlamlı relation değerleri küçük ikincil rozetle gösterilir: `Anne telefonu`, `Baba telefonu`, `Veli telefonu`, `Öğrenci telefonu`, `Yakın telefonu`.
- Generic veya bilinmeyen relation için ek rozet gösterilmez; `İlişki belirtilmedi` gibi gürültülü bir fallback eklenmez.
- Excel `source_column` ana UI metni değildir. Mevcutsa yalnızca relation rozeti tooltip'inde `Excel kaynağı: ...` olarak sunulur.
- Active/current, yanlış-kullanılmıyor, geçersiz format, `Son sonuç`, kopyalama, genişletme/daraltma ve ✓ / x davranışları korunmuştur.
- Schema, import, export, backup/restore, reader, persistence ve Telefon 1-10 slot/sıra mantığı değişmemiştir.
- Validation: focused 3 dosya / 45 test PASS; OOM-safe full unit 45 dosya / 328 test PASS; build PASS. Başlık düzeltmesi sonrası focused 2 dosya / 21 test PASS.
- Temiz browser profilinde aday verisi bulunmadığı için gerçek veri kartı üzerinde görsel QA tamamlanamadı; uygulama hatasız açıldı. Veri içeren localhost profiliyle manuel kart kontrolü önerilir.
- Google Drive / Obsidian strategy vault ayrı olarak `eefd4ed` seviyesine senkronlanmıştır; bu checkpoint sonrasında `ead391b` değişikliğini içeren küçük follow-up sync gerekebilir.
- Sonraki ana aksiyon yeni-chat handoff/disiplin testidir; yeni oturum önce HEAD, branch, working tree, Drive/Obsidian sync durumu ve çalışma disiplinini doğrulamalıdır.

## Latest Implementation Chain - Demo Seed and WhatsApp Manual Drafts

- Güncel HEAD/origin: `48da40c fix: polish WhatsApp phone action icon`.
- Beklenen final git durumu: tracked working tree temiz; yalnız `dev-server.log` yerel runtime çıktısı olarak untracked kalabilir.
- `/demo` subpath deploy compatibility tamamlandı: `13f5d12 fix: support subpath deployment base`.
- Pilot demo seed bootstrap tamamlandı: `edae87a feat: add pilot demo seed bootstrap`.
- Zengin pilot seed + görünür CRM data/UI smoke QA tamamlandı: `1dc09c7 fix: enrich pilot seed and add UI smoke QA`.
- WhatsApp manuel taslak sistemi tamamlandı: `cf660d1 feat: add WhatsApp draft message templates`.
- WhatsApp manuel gönderildi status feedback tamamlandı: `6fdd940 fix: show WhatsApp manual sent status`.
- WhatsApp phone action icon polish tamamlandı: `48da40c fix: polish WhatsApp phone action icon`.
- WhatsApp entegrasyonu bilinçli olarak ücretsiz/manual taslak modelidir: WhatsApp API, bot, otomatik gönderim, kişi kaydetme/vCard veya teslimat onayı yoktur.
- `Gönderildi olarak işaretle` WhatsApp teslimat onayı değildir; yalnız personelin CRM içinde manuel takip işaretidir.
- WhatsApp bilgisi öğrenci listesinde rozet olarak gösterilmez; telefon kartı bazlı küçük aksiyon/ikon ve ilgili telefonun gönderildi rozeti olarak kalır.
- Ortam ayrımı: `localhost:5173` gerçek lokal data alanıdır; `localhost:7777` fake/pilot test alanıdır; `netvadi.com/demo` pilot demo alanıdır.

## Pending Decisions - WhatsApp and Phone Actions

- WhatsApp taslak editleme henüz yapılmadı; ayrı ürün kararı ve implementation gerektirir.
- Gönderildi işaretini geri alma henüz yapılmadı; ayrı ürün kararı ve audit/UX değerlendirmesi gerektirir.
- X/dropdown semantic redesign henüz yapılmadı.
- X/çarpı butonu operational invalid marker'dır; `phone_status` ve `is_wrong` alanlarını etkiler.
- Dropdown `Yanlış Numara` / `Kullanılmıyor` phone-level `call_outcome` alanını etkiler.
- X ile dropdown aynı veri davranışını üretmez. Bu yüzden birleştirme veya sadeleştirme ayrı product/data decision gerektirir.

## Historical Handoff Sync - WhatsApp Web Open Suspend + Import Fallback Cleanup

- Tarihsel güvenli HEAD/origin: `4ebfe33 fix: suspend WhatsApp web open action`.
- Son güvenli commit zinciri:
  - `7067175 feat: allow editing WhatsApp draft messages`
  - `723326f feat: persist WhatsApp template overrides`
  - `c77e8cf fix: avoid hardcoded student group import fallback`
  - `f609292 feat: report hardcoded student group cleanup candidates`
  - `4ebfe33 fix: suspend WhatsApp web open action`
- WhatsApp modalındaki `WhatsApp'ta Aç` / `wa.me` yeni sohbet açma aksiyonu, WhatsApp Web bağlı cihaz kısıtı nedeniyle geçici olarak askıya alınmıştır.
- Buton görünür ama disabled durumdadır; kullanıcıya mesajı kopyalayıp WhatsApp'a manuel yapıştırması gerektiğini söyleyen kısa açıklama gösterilir.
- Yeni kullanımda `window.open` çalışmaz, UI akışı `buildWhatsAppDraftUrl` çağırmaz ve `draft_opened` log oluşmaz.
- `Mesajı Kopyala`, edited/current draft body ile çalışmaya devam eder ve `copied` log yazar.
- `Gönderildi olarak işaretle`, WhatsApp teslimat onayı değil manuel CRM takip işaretidir ve `manually_marked_sent` log yazmaya devam eder.
- WhatsApp API, bot, auto-send, vCard/kişi kaydetme veya teslimat doğrulama yoktur.
- `src/features/whatsapp/whatsappUrl.ts` silinmemiştir; gelecekte `wa.me` açma akışı tekrar kabul edilirse helper yeniden kullanılabilir.
- `4ebfe33` VDS demo ortamına deploy edildi ve kullanıcı tarafından tamamlandı olarak bildirildi. Demo kontrol hedefi: `/students` WhatsApp modalında Aç butonu disabled, kopyalama ve manuel gönderildi akışları çalışıyor.
- `c77e8cf` ile yeni importlarda hardcoded `11. Sınıf YKS Hazırlık` student_group fallback'i ve hardcoded `YKS` category yazımı kaldırıldı. Yeni importta Excel'de yoksa/boşsa bu alanlar neutral kalır.
- Bu import fallback fix yalnızca yeni importları etkiler; mevcut DB'deki eski hatalı kayıtlar otomatik düzeltilmez.
- `f609292` ile eski hardcoded student_group kayıtlarını tespit eden read-only cleanup candidate servisi eklendi. DB write, migration, apply/cleanup ve UI yoktur.
- StudentsPage içine cleanup report UI gömülmeyecek; daha önce denenmiş cleanup UI iptal edilmiştir. Ana operasyon sayfalarına bakım UI'ı eklemek için ayrı discovery ve kullanıcı onayı gerekir.

## Latest Checkpoint Closure - VELI ADI Import Alias Fix

- Implementation commit: `18f47c9 fix: map veli adi import column`.
- `VELI ADI` / `Veli Adı` import kolon başlığı artık mevcut `guardian_full_name` / `Veli Ad Soyad` alanına otomatik eşleşir.
- `VELI AD SOYAD` / `Veli Ad Soyad` mevcut davranışı korunur.
- Değişiklik yalnız alias/mapping düzeyindedir.
- `VELI TEL`, `VELI TELEFON`, `guardian_phone`, import writer, schema/db, export/backup, StudentsPage ve WhatsApp dosyaları değiştirilmedi.
- Validation: `npm.cmd test -- --run tests/imports` PASS, 9 test files / 94 tests; `npm.cmd run build` PASS, bilinen Vite chunk-size warning dışında sorun yok; `git diff --check` PASS, yalnız LF -> CRLF çalışma kopyası uyarıları görüldü.
- `18f47c9` VDS demo ortamına deploy edildi ve kullanıcı tarafından tamamlandı olarak bildirildi; bu not deploy bildirimiyle sınırlıdır, canlıda ek davranış doğrulaması iddia etmez.

## Latest Checkpoint Closure - VELI TEL / Guardian Phone Import

- Implementation commit: `cf47e2d feat: import explicit guardian phone relations`.
- `VELI TEL`, `VELI TELEFON`, `VELI GSM`, `VELI CEP`, `Veli Telefonu` ve `Veli Cep Telefonu` başlıkları artık import-only `guardian_phone` alanına otomatik eşleşir.
- Simülasyonda Veli telefonu `phones[]` hattına `relation_label: "Veli"` ve gerçek Excel `source_column` değeriyle katılır.
- Telefon özel slota zorlanmaz; Excel kolon sırası ve mevcut Telefon 1-10 slot fidelity korunur.
- Generic Telefon/GSM/Tel/Telefon 1 gibi başlıklardan Veli ilişkisi tahmin edilmez.
- Veli adı varsa writer telefonu ilgili Veli guardian kaydına bağlar. Veli adı yoksa fake/boş guardian oluşturulmaz; relation label korunur ve `guardian_id: null` kalabilir.
- ANNE TEL / BABA TEL mevcut davranışı korunur. `VELI ADI` / `VELI AD SOYAD`, Anne/Baba/Veli isimleri ve Veli phone alanları öğrenci adı kaynağı değildir.
- Export, backup/restore, StudentsPage, WhatsApp, schema/db ve package/config değişmedi.
- Validation: `npm.cmd test -- --run tests/imports` PASS, 9 test files / 96 tests; `npm.cmd run build` PASS, bilinen Vite chunk-size warning dışında hata yok; `git diff --check` PASS, yalnız LF -> CRLF çalışma kopyası uyarıları görüldü.
- `cf47e2d` VDS demo ortamına deploy edildi ve kullanıcı tarafından test/QA okey olarak bildirildi; bu not kullanıcı bildirimiyle sınırlıdır.

## Latest Test Checkpoint - Guardian Phone Import E2E

- Test commit: `b486735 test: cover guardian phone import e2e`.
- Playwright import regression içine `imports guardian phone relations with parent phones` senaryosu eklendi.
- Senaryo browser üzerinden Excel upload, import, aday listesi ve sağ kart doğrulama akışını çalıştırır.
- `VELI ADI` + `VELI TEL` birlikte doğrulanır: Veli adı sağ kartta `Veli Ad Soyad` olarak, telefon `Veli telefonu` relation badge'iyle görünür.
- `ANNE TEL` ve `BABA TEL` ayrı `Anne telefonu` / `Baba telefonu` badge'leriyle doğrulanır.
- Generic `Telefon` kolonu relation badge üretmeden normal Telefon N olarak kalır.
- `VELI TEL` var ama `VELI ADI` yok senaryosunda fake/boş guardian oluşmadığı, `Veli Ad Soyad` satırı basılmadığı ve telefonun `Veli telefonu` badge'iyle görünebildiği testlenir.
- Bu test-only checkpoint ürün kodu değiştirmez: `src/**`, schema, import writer, export/backup, StudentsPage, WhatsApp, docs ve package/config değişmedi.
- Validation: `npm.cmd run qa:import:e2e` PASS, 6/6 Playwright test; `npm.cmd test -- --run tests/imports` PASS, 9 files / 96 tests; `npm.cmd run build` PASS, bilinen Vite chunk-size warning dışında sorun yok; `git diff --check` PASS, yalnız LF -> CRLF çalışma kopyası uyarısı görüldü.

## Latest Pilot Gate Decision - Dar Pilot Final Gate

- Gate base: `0e58928 docs: close guardian phone e2e checkpoint`.
- Final karar: `PILOT READY WITH WARNINGS`.
- Blocker/high risk bulunmadı; dar pilot başlayabilir.
- Validation özeti:
  - `npm.cmd test -- --run tests/imports`: PASS, 9 files / 96 tests.
  - `npm.cmd test -- --run tests/students`: ilk koşuda WhatsApp UI async/flaky fail görüldü; izole retry PASS; full retry PASS, 10 files / 86 tests.
  - `npm.cmd test -- --run tests/exports`: PASS, 4 files / 34 tests.
  - `npm.cmd test -- --run tests/settings`: PASS, 3 files / 15 tests.
  - `npm.cmd test -- --run tests/reports tests/reminders`: PASS, 9 files / 41 tests.
  - `npm.cmd run qa:import:e2e`: PASS, 6/6 Playwright test.
  - `npm.cmd run build`: PASS, yalnız bilinen Vite chunk-size warning.
- VDS `/demo` manuel smoke kullanıcı tarafından okey bildirildi; bu not canlı ortam için abartılı garanti olarak yorumlanmamalıdır.
- Risk sınıfları: BLOCKER yok; HIGH yok; MEDIUM olarak WhatsApp modal testinde ilk koşu async/flaky fail ve React `act(...)` warning not edildi; LOW olarak bilinen Vite chunk-size warning devam ediyor.
- Deferred işler: Phone Action Simplification / `✓` `x` dropdown karmaşası, Communication History correction/delete, Reporting Area V2, mobile polish, eski `student_group` cleanup apply, `VELI TEL` ayrı export kolonu ve WhatsApp outbound reconnection kararı.
- Pilot öncesi zorunlu bugfix gerekmiyor; kısa manuel QA/smoke yeterli kabul edildi.
- Sıradaki muhtemel product/discovery: Phone Action Simplification veya WhatsApp outbound reconnection için açık ürün kararı.

## Latest Checkpoint Closure - Kampanya Import Persistence Bugfix

- Bugfix commit: `82036c0 fix: persist imported campaign names`.
- Kullanıcı gözlemi: Excel import dosyasında `Kampanya` değerleri simülasyon/preview ekranında doğru görünmesine rağmen import sonrası adaylar `Diğer` kampanyasına düşüyor ve kampanya filtresinde yalnız `Diğer` görünüyordu.
- Kök neden: `importSimulation` `row.campaign_name` değerini doğru taşıyor ve `ImportPage` preview bu değeri gösteriyordu; ancak `importWriter` bu değeri kullanmayıp tüm student kayıtlarına default `Diğer` `campaign_id` yazıyordu.
- Fix davranışı: `importWriter` artık `row.campaign_name` değerini trimleyerek kullanır. Kampanya boşsa mevcut default `Diğer` davranışı korunur.
- Kampanya doluysa aynı isimde aktif campaign varsa kullanılır; yoksa yeni aktif campaign oluşturulur. Aynı import içinde aynı kampanya adı tekrar ederse cache ile tek campaign kaydı kullanılır.
- Student `campaign_id` gerçek kampanya kaydına bağlanır; `category`, `student_group`, `current_class`, guardian phone ve phone slot logic değişmemiştir.
- Eski DB kayıtları geriye dönük düzeltilmedi; fix yeni importlar için geçerlidir.
- Validation: `npm.cmd test -- --run tests/imports` PASS, 9 files / 100 tests; `npm.cmd test -- --run tests/students` PASS, 10 files / 86 tests; `npm.cmd run build` PASS, bilinen Vite chunk-size warning dışında hata yok; `git diff --check` PASS, yalnız LF -> CRLF çalışma kopyası uyarıları görüldü.
- `82036c0` VDS demo ortamına deploy edildi. Kullanıcı VDS deploy, import sonrası kampanya ve kampanya filtresi smoke testlerini okey bildirdi; bu not kullanıcı bildirimiyle sınırlıdır.

## Latest Pilot Result - Dar Pilot Basari Kapanisi

- Pilot kapanış base commit: `b8dad6a docs: close campaign import persistence bugfix`.
- Kullanıcı bildirimi: test başarılı, hepsi okey, dar pilot başarılı.
- Dar pilot kullanım testi başarıyla tamamlandı; Sprint 9.2 pilot eşiği geçildi.
- Pilot sırasında Excel import, Kampanya import persistence, gerçek kampanyaların kampanya filtresinde görünmesi, Veli/Anne/Baba telefon ilişkileri, generic Telefon alanlarının yanlışlıkla Veli/Anne/Baba olarak etiketlenmemesi, aday kartı temel bilgileri, filtreler, WhatsApp modal temel akışı ve export kontrolü başarılı kabul edildi.
- Yeni blocker/high bug bildirilmedi.
- Kod tarafında yeni iş açılmadı; bundan sonraki aşama pilot geri bildirimlerini kontrollü backlog/prioritization ile değerlendirmektir.
- Yeni geliştirme işleri ayrı discovery ve karar ile ele alınmalıdır.

## Latest Checkpoint Closure - Call Phone Selection Rule

- Bugfix commit: `055597a fix: relax phone selection for non-contact call results`.
- Kullanıcı gözlemi: `Ulaşılamadı` seçildiğinde sistem yine “Son görüşülen / iletişim kurulan numara” seçimini zorunlu tutuyordu; ulaşılamayan çağrıda bu dil ve zorunluluk yanıltıcıydı.
- Kök neden: `validateCallSave()` ve `callLogWriter()` birden fazla uygun telefon olduğunda telefon seçimini `call_result` değerinden bağımsız istiyordu.
- Yeni karar: Telefon seçimi yalnız `reached` ve `wrong_number` sonuçlarında zorunlu kalır. `not_called`, `not_reached`, `call_later`, `appointment`, `do_not_call`, `not_interested` ve `registered` telefon seçilmeden kaydedilebilir.
- UI/error dili nötr hale getirildi: `Aranan / işlem yapılan telefon` ve `Hangi telefonla işlem yapılacak? Lütfen bu kayıt için ilgili telefonu seçin.` kullanılır.
- Null phone context güvenlidir: call history `Telefon seçilmedi` fallback'iyle gösterir; reminders, appointment, reports ve export akışları null/boş telefon bağlamıyla çalışabilir.
- Phone-level outcome/status yalnız telefon bağlamı varsa güncellenir; telefon seçilmemiş non-contact kayıtlar telefon kartı durumunu mutate etmez.
- Impact audit sonucu blocker/high risk yoktur. Schema/migration, import/export, backup/restore, WhatsApp ve package/config değişmedi.
- Validation: `npm.cmd test -- --run tests/calls` PASS, 5 files / 53 tests; `npm.cmd test -- --run tests/students` PASS, 10 files / 87 tests; `npm.cmd test -- --run tests/exports` PASS, 4 files / 34 tests; `npm.cmd test -- --run tests/reminders` PASS, 7 files / 33 tests; `npm.cmd test -- --run tests/reports` PASS, 2 files / 8 tests; `npx.cmd vitest run --exclude e2e/** --maxWorkers=1` PASS, 49 files / 392 tests; `npm.cmd run build` PASS, bilinen Vite chunk-size warning dışında sorun yok; `git diff --check` PASS, yalnız LF -> CRLF çalışma kopyası uyarıları görüldü.
- `055597a` VDS demo ortamına deploy edildi ve kullanıcı sorun olmadığını bildirdi. Smoke akışı olarak `Ulaşılamadı`, `Görüşüldü`, `Yanlış Numara`, `Sonra Aranacak` ve `Randevu Verildi` durumlarında sorun bildirilmedi; bu not kullanıcı bildirimiyle sınırlıdır.

## Latest Checkpoint Closure - All Phones Invalid Wrong Number Fix

- Bugfix commit: `8bf7cb2 fix: allow wrong number when all phones are invalid`.
- Edge-case: Adaydaki tüm telefonlar X / yanlış-kullanılmıyor işaretliyken ve phone-level outcome dropdown'larında `Kullanılmıyor` seçiliyken genel `Yanlış Numara` kaydı artık `Bu kayıt için seçilebilir telefon bulunamadı` hatasıyla bloklanmaz.
- Son kural: `reached` / Görüşüldü için telefon zorunluluğu korunur. `wrong_number` / Yanlış Numara için seçilebilir telefon varsa telefon seçimi zorunlu kalır.
- Eğer adayda en az bir telefon var ama tüm telefonlar zaten `is_wrong` veya `phone_status: invalid` ise genel `wrong_number` telefon seçmeden kaydedilebilir.
- Bu edge-case'te call log null phone context taşıyabilir; aday genel sonucu `wrong_number` olur ve phone-level status/outcome tekrar güncellenmez.
- No-phone aday davranışı bu fix'in kapsamı değildir; mevcut guard korunur.
- Validation: focused 5 files / 77 tests PASS; full default 49 files / 397 tests PASS; full serial 49 files / 397 tests PASS; build PASS, bilinen Vite chunk-size warning dışında sorun yok; `git diff --check` PASS, yalnız LF -> CRLF çalışma kopyası uyarıları görüldü.
- `8bf7cb2` VDS demo ortamına deploy edildi. Kullanıcı smoke testte tüm telefonları X / yanlış-kullanılmıyor yaptı, phone outcome dropdown'larında `Kullanılmıyor` seçti, genel `Yanlış Numara` kaydetti ve sorun olmadığını bildirdi.

## Latest Checkpoint Closure - Communication History Edit / Void MVP

- Implementation commit: `8f1f613 feat: allow correcting unlinked communication history`.
- Bağlantısız iletişim geçmişi kayıtları sağ karttan düzeltilebilir/düzenlenebilir; görüşme durumu, not, tarih/saat ve telefon bağlamı güncellenebilir.
- Bağlantısız iletişim kayıtları `Geçersiz Say / Sil` ile mevcut soft delete altyapısını kullanır. Hard delete yoktur; `call_logs.deleted_at` / `updated_at` set edilir.
- O sprintte `created_reminder_id` veya `created_appointment_id` bulunan kayıtlar edit/delete için bloklanıyordu. Son linked policy ile delete/void tarafı terminal status-aware hale geldi; edit tarafında linked kayıt blokları korunur. Reminder/appointment cascade, detach veya otomatik iptal yapılmaz.
- Edit/delete sonrası aday özeti aktif call log kayıtlarından yeniden hesaplanır. PhoneRecord status/outcome alanları mutate edilmez.
- Reports/export aktif call log kayıtları üzerinden doğal güncellenir; backup ham tabloları koruduğu için soft-deleted kayıtlar yedekte kalır.
- Validation: focused 3 files / 15 tests PASS; full serial 50 files / 402 tests PASS; standard full 50 files / 402 tests PASS; build PASS, bilinen Vite chunk-size warning dışında sorun yok; `git diff --check` PASS, yalnız LF -> CRLF çalışma kopyası uyarıları görüldü.
- `8f1f613` VDS demo ortamına deploy edildi. Kullanıcı smoke testte bağlantısız kayıt düzeltme, görüşme durumu/not/tarih-saat güncelleme, `Geçersiz Say / Sil` ile history'den düşürme, bağlı reminder/randevu kayıtlarının bloklanması, aday özetinin aktif call loglara göre güncellenmesi ve reminder/randevu tarafında bozulma gözlenmemesi akışlarında sorun olmadığını bildirdi.

## Latest Checkpoint Closure - Phone Action Label Clarification / Helper Cleanup

- Implementation commits: `8224582 chore: clarify phone action labels` and `c094741 chore: simplify phone result helper labels`.
- Telefon kartındaki ✓ aksiyonu `Bu görüşmede kullanılacak telefon`, X aksiyonu `Telefonu yanlış / kullanılmayacak olarak işaretle`, telefon outcome dropdown'u ise telefon bazlı manuel son arama sonucu olarak netleştirildi.
- Genel Görüşme Durumu alanı aday genel görüşme sonucu / call log kaydı anlamını korur.
- Görsel kalabalık yapan görünür `Bu telefonun son arama sonucu` ve `Bu seçim iletişim geçmişine kayıt olarak işlenir.` helper yazıları kaldırıldı; aria/title anlamı uygun yerde korundu.
- Teknik davranış değişmedi: ✓, X, dropdown, `phone_status`, `is_wrong`, `call_outcome`, call log write rules, general call result validation, `reached` zorunluluğu, `wrong_number` eligible phone kuralı, all-invalid `wrong_number` null-context edge-case ve communication history edit/void davranışları korunur.
- Schema/migration, import/export/backup formatı ve WhatsApp dosyaları değişmedi; büyük UI redesign yapılmadı.
- Validation: `8224582` için focused student 4 files / 40 tests, calls 6 files / 61 tests, exports 4 files / 34 tests, settings 3 files / 15 tests, full serial 50 files / 402 tests ve build PASS. `c094741` için focused student 4 files / 40 tests, calls 6 files / 61 tests, full serial 50 files / 402 tests ve build PASS. Bilinen Vite chunk-size warning devam eder; `git diff --check` yalnız LF -> CRLF çalışma kopyası uyarılarıyla PASS.
- `8224582` VDS deploy + browser smoke OK; `c094741` VDS deploy + visual smoke OK olarak kullanıcı tarafından temiz bildirildi.
