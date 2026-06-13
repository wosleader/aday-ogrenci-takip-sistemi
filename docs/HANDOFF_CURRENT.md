# HANDOFF_CURRENT — Aday Öğrenci Takip Sistemi

## 1. Güncel Repo Durumu

- Repository adı: aday-ogrenci-takip-sistemi
- Aktif branch: sprint-9-2-multi-phone-architecture-plan
- Son güvenli HEAD/origin: 5727050 docs: close import e2e regression checkpoint
- Anne/Baba Guardian/Contact Model discovery tamamlandı; bu çalışma docs-only insan/ürün karar checkpoint'idir.
- Tracked working tree başlangıçta temizdir. `dev-server.log` yerel runtime çıktısı olarak untracked kalabilir ve stage/commit edilmemelidir.
- Bu docs-only karar kaydı tamamlanınca Strategy AI onayı sonrası docs commit değerlendirilecektir.
- Önerilen docs commit: docs: record guardian contact model decisions
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
- Working tree beklenen durumu: clean
- GitHub/origin durumu: aktif branch `origin/sprint-9-2-multi-phone-architecture-plan` ile aynı son commit üzerinde görünür.

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

Anne/Baba Guardian/Contact Model için uygulama öncesi karar yönü netleştirildi.

Özet:

- Yeni tablo açılmayacak; mevcut `guardians` tablosu kullanılacak.
- `guardian` = Veli, `mother` = Anne, `father` = Baba; legacy `relation_type: null` = Veli kabul edilecek.
- Anne/Baba/Veli öğrenci adı kaynağı olmayacak.
- İlk önerilen kod dilimi Anne/Baba isimleriyle sınırlı olacak; parent phones, export, backup guarantee ve telefonsuz import ayarı ayrı dilimlerde ele alınacak.
- Sağ kart yalnızca dolu `Veli Ad Soyad`, `Anne Adı`, `Baba Adı` satırlarını gösterecek.
- Explicit parent-phone kolonları ileride relation label alabilecek; generic telefon kolonlarından ilişki tahmini yapılmayacak.
- Karar ayrıntıları `docs/CHECKPOINT_GUARDIAN_CONTACT_MODEL_DECISION.md` içinde tutulacaktır.

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
Mahalle/İlçe Import Pilot docs-only closure review ve Strategy AI onayı sonrası docs commit/push.

Bunun ardından:
Anne/Baba implementasyonu hemen başlatılmamalıdır. Önce `DISCOVERY — Agent Context / Repo Hygiene Standardization` yapılmalı; repo hygiene/risk scan, agent instruction standardization ve context export/prompt-pack stratejisi değerlendirilmelidir.

Yeni kod işi başlatmadan önce Mahalle/İlçe Import Pilot docs-only kapanış commit/push edildiği doğrulanmalıdır.

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
