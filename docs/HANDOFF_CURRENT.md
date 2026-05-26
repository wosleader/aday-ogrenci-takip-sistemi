# HANDOFF_CURRENT — Aday Öğrenci Takip Sistemi

## 1. Güncel Repo Durumu

- Repository adı: aday-ogrenci-takip-sistemi
- Aktif branch: sprint-9-2-multi-phone-architecture-plan
- Son güvenli commit: 0c40524 feat: collapse long import review lists
- Sprint 9.3G-2 kod tarafı tamamlandı ve pushlandı.
- Bu docs closure tamamlanınca yeni docs commit beklenecek.
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

Sprint 9.3G-2 — Import UI Progressive Disclosure tamamlandı.

Özet:

- Sprint 9.3G-2 ile Excel İçe Aktar ekranında Kolon Eşleştirme, Hatalar ve Uyarılar listeleri kademeli gösterime alındı.
- Uzun kolon listelerinde öncelikli / `mapping_required` / manuel / auto-fixed / önemli kolonlar dar görünümde korunur.
- Hatalar ve Uyarılar ilk 10 kayıtla sınırlı gösterilir; fazlası kullanıcı isteğiyle açılır.
- Yeni dosya veya simülasyon temizleme durumlarında expanded state'ler resetlenir.
- Import logic, mapping seçenekleri, column definitions, simulation, writer, schema/storage, global CSS, Telefon 3-10, AD/SOYAD, Anne/Baba ve Mahalle değiştirilmedi.
- Test/build daha önce geçti: 42 test files / 229 tests.
- Sprint kapanış dokümantasyonu `docs/CHECKPOINT_SPRINT_9_3G_2.md` dosyasındadır.

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

Sıradaki muhtemel aşamalar:

- Sprint 9.3G-2 docs-only commit/push doğrulaması
- Çoklu telefon import mapping/simulation
- Çoklu telefon import writer
- AD/SOYAD + Anne/Baba + Mahalle data model discovery/implementation
- Export/report/backup uyumu discovery
- Çoklu telefon import/export genişletmeleri
- Backup/restore güvence turu
- Mobile polish ve diğer pilot sonrası işler

Not:
Büyük çoklu telefon roadmap'i ayrı kalır: Excel'den çoklu telefon import, sağ kişi kartında dinamik/aşamalı telefon gösterimi, `+N numara daha göster`, import/export ve backup/restore güvence işleri ayrı sprintlerde ele alınacaktır.

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
Sprint 9.3G-2 docs-only commit/push.

Bunun ardından:
Roadmap kararına göre çoklu telefon import mapping/simulation, çoklu telefon import writer veya AD/SOYAD + Anne/Baba + Mahalle data model discovery/implementation düşünülebilir. Export/report/backup uyumu discovery daha sonra ayrı ele alınmalıdır.

Yeni kod işi başlatmadan önce Sprint 9.3G-2 docs-only kapanış commit/push edildiği doğrulanmalıdır.

Import UI progressive disclosure yapıldı. Telefon 3-10 import, AD/SOYAD, Anne/Baba ve Mahalle henüz yapılmadı. Telefon 3+ status aksiyonları da henüz yapılmadı. Bu konular ayrı discovery olmadan uygulanmamalıdır.

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
- docs/MULTI_PHONE_ARCHITECTURE_PLAN.md
- docs/PILOT_FINDINGS.md
- .prompts/codex-start.md
- .prompts/feature-plan.md
- .prompts/feature-apply.md
- .prompts/sprint-close.md
