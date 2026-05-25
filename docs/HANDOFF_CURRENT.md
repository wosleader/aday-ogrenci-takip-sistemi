# HANDOFF_CURRENT — Aday Öğrenci Takip Sistemi

## 1. Güncel Repo Durumu

- Repository adı: aday-ogrenci-takip-sistemi
- Aktif branch: sprint-9-3b-2-phone-context-persistence-wiring
- Son commit: 0298172 docs: add sprint 9.3b-2 checkpoint
- Bir önceki kod commit’i: 595979d feat: wire phone context persistence for calls and reminders
- Working tree beklenen durumu: clean
- GitHub/origin durumu: aktif branch `origin/sprint-9-3b-2-phone-context-persistence-wiring` ile aynı son commit üzerinde görünür.

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

Sprint 9.3B-2 — Phone Context Persistence Wiring tamamlandı.

Özet:

- Sprint 9.3B-1’de hazırlanan call log / reminder phone context model ve helper altyapısı gerçek `writeCallLog` kayıt akışına bağlandı.
- Call log kayıtlarına optional `phone_snapshot` yazılır hale geldi.
- Pending reminder create/update akışlarına `phone_id` ve `phone_snapshot` bağlandı.
- Legacy alanlar korundu.
- UI/import/export/backup/restore/schema migration kapsam dışı bırakıldı.
- Test/build daha önce geçmişti.
- Sprint kapanış dokümantasyonu 0298172 commit’iyle tamamlandı.

## 5. Çoklu Telefon Roadmap Durumu

Tamamlananlar:

- Sprint 9.3A: Multi-phone core model / compatibility helpers
- Sprint 9.3B-1: Phone context model helpers for calls and reminders
- Sprint 9.3B-2: Phone context persistence wiring

Sıradaki muhtemel aşamalar:

- Sprint 9.3B-2 PR hazırlığı / merge kontrolü
- Phone context display/read layer discovery
- Arama geçmişi ve Hatırlatmalar UI’da telefon bağlamı gösterimi
- Çoklu telefon import/export genişletmeleri
- Backup/restore güvence turu
- Mobile polish ve diğer pilot sonrası işler

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
3. Sadece ilgili checkpoint’i oku; tüm checkpoint’leri gereksiz okuma.
4. Kod yazmadan önce gerçek kaynak dosyaları incele.
5. Plan/discovery istendiyse dosya değiştirme.
6. Uygulama istendiyse sadece onaylanan kapsamı uygula.
7. Kod işlerinde test/build çalıştır ve raporla.
8. Docs-only işlerde `src/` ve `tests/` altına dokunma.
9. Commit/push/merge yapma; sadece önerilen commit mesajı ver.
10. Kapsam dışı iyi fikirleri uygulama; sonraki işler bölümüne yaz.

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
- ilgili sprint checkpoint’ini oku
- sonra sadece rapor ver; kullanıcı onayı olmadan dosya değiştirme

## 10. Şu Anki En Güvenli Sonraki Adım

Şu anki en güvenli sıradaki iş:
Sprint 9.3B-2 PR hazırlığı / merge kontrolü.

Bunun ardından:
Phone context display/read layer için ayrı discovery/plan sprinti düşünülebilir.

## 11. Kaynak Dosyalar

- docs/PROJECT_MEMORY.md
- docs/FILE_MAP.md
- docs/DECISIONS.md
- docs/CHECKPOINT_SPRINT_9_3B_2.md
- docs/CHECKPOINT_SPRINT_9_3B_1.md
- docs/MULTI_PHONE_ARCHITECTURE_PLAN.md
- docs/PILOT_FINDINGS.md
- .prompts/codex-start.md
- .prompts/feature-plan.md
- .prompts/feature-apply.md
- .prompts/sprint-close.md
