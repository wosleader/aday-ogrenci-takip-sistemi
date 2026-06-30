# AI Workflow Governance — Aday Öğrenci Takip Sistemi

## 1. Amaç

Bu dokümanın amacı, Strategy AI + Codex/Uygulayıcı AI çalışma disiplinini standartlaştırmak, scope creep'i önlemek, commit/push/merge kontrolünü kullanıcıda tutmak ve sprintlerin hızlı ama güvenli ilerlemesini sağlamaktır.

Bu belge geliştirme sürecini yavaşlatmak için değil, gereksiz tekrarları azaltmak ve denetimi hızlandırmak için vardır.

## 2. Roller

- Kullanıcı / EL_Patron: ürün sahibi ve nihai onay makamı.
- Strategy AI: planlama, prompt hazırlama, risk denetimi ve Codex çıktısı kontrolü.
- Codex / Uygulayıcı AI: repo okuma, onaylı kapsamı uygulama, test/build çalıştırma ve raporlama.
- Repo docs: proje hafızasının ana kaynağı.

## 3. Standart İş Türleri

### Discovery / Plan Only

- Dosya değiştirmez.
- Kod yazmaz.
- Risk, etki alanı ve dosya bazlı plan çıkarır.

### Implementation

- Sadece onaylı dosyaları değiştirir.
- Kod işlerinde test/build çalıştırır.
- Commit/push yapmaz.

### Docs-only

- Sadece belirtilen docs dosyalarını değiştirir.
- `src/` ve `tests/` altında değişiklik yapmaz.
- Test/build çalıştırmaz.

### PR / Merge / Cleanup Analysis

- Kod/dosya değiştirmez.
- Branch, diff, merge-base, PR ve cleanup güvenliğini analiz eder.
- Merge/branch delete işlemleri kullanıcı onayıyla yapılır.

## 4. ÜST EMİR Standardı

Her Codex promptunun başında şu blok bulunmalı:

```text
ÜST EMİR:
İş türü:
Aktif branch:
Son commit:
İzinli dosyalar:
Yasak dosyalar:
Test/build:
Commit/push:
Durma şartı:
```

Bu blok promptun en kritik güvenlik katmanıdır. Detaylar uzun olsa bile Codex önce bu sınırlara uymalıdır.

## 5. Kalıcı Kırmızı Çizgiler

- Aynı anda tek açık Codex işi yürütülür; açık iş bitmeden yeni prompt/task başlatılmaz.
- Working tree temizliği teyit edilmeden yeni işe başlanmaz.
- Discovery olmadan implementation yapılmaz; özellikle data model, import/export, backup/restore, ana operasyon ekranı ve schema etkisi olan işler önce discovery gerektirir.
- `StudentsPage` gibi ana operasyon sayfalarına bakım/rapor/teknik UI gömme işleri ekstra discovery ve açık kullanıcı onayı ister.
- Kullanıcı onayı olmadan commit/push/merge yok.
- Kullanıcı onayı olmadan branch silme yok.
- İzinli dosya dışına çıkma yok.
- Büyük refactor yok.
- Yeni paket kurma yok.
- Import/export/backup/restore/migration işleri discovery olmadan yapılmaz.
- UI büyük dönüşüm işleri discovery olmadan yapılmaz.
- Gerçek öğrenci/veli/telefon verisi promptlara konmaz.
- Secrets, auth, env, token, config dosyaları paylaşılmaz.
- Codex raporu tek başına yeterli değildir; git status/diff/test/build kontrol edilir.
- `dev-server.log` yerel runtime çıktısıdır; stage/commit edilmez, silinmez ve ürün artifact'i gibi ele alınmaz.

## 6. Standart Codex Rapor Formatı

Implementation için:

- Başlangıç branch/status
- Okunan dosyalar
- Değişen dosyalar
- Yapılan değişiklikler
- Kapsam dışı korunan işler
- Test sonucu
- Build sonucu
- git status --short
- git diff --stat
- Riskler/notlar
- Önerilen commit mesajı

Discovery için:

- Mevcut durum
- Okunan dosyalar
- Bulgular
- Riskler
- Dosya bazlı plan
- Karar gerektiren sorular
- Önerilen sonraki prompt türü
- git status --short

Docs-only için:

- Eklenen/değişen docs dosyaları
- src/tests değişti mi?
- test/build çalıştırıldı mı?
- git status --short
- git diff --stat
- Önerilen commit mesajı

## 7. Hafif AI Sprint Kontrol Listesi

Her sprint sonunda Strategy AI şu 5 soruyu kontrol eder:

1. Sadece izinli dosyalar mı değişti?
2. Kapsam dışı iş yapıldı mı?
3. Kod işiyse test/build geçti mi?
4. Working tree durumu net mi?
5. Docs/checkpoint/handoff güncellemesi gerekiyorsa yapıldı mı?

## 8. Vault Read Checklist Gate

Bu gate yeni bir paralel sistem kurmak için değil, mevcut repo docs / strateji hafızası disiplinini uygulanabilir hale getirmek içindir.

Büyük sprint, ürün kararı veya Codex promptu öncesi:

1. MASTER_CONTEXT veya repo docs memory okunur.
2. `docs/PROJECT_MEMORY.md` okunur.
3. `docs/HANDOFF_CURRENT.md` okunur.
4. `docs/AI_WORKFLOW_GOVERNANCE.md` okunur.
5. `docs/DECISIONS.md` okunur.
6. `docs/FILE_MAP.md` okunur.
7. İlgili sprint / decision / risk notları okunur.
8. Okunan dosyalar raporda isim isim belirtilir.
9. Okunmayan dosya hakkında kesin konuşulmaz.

Küçük bugfix veya mikro UI işleri için bu liste task riskine göre daraltılabilir; ancak daraltma raporda açıkça belirtilmelidir.

## 9. Kullanılmayacak Ağır Süreçler

Bu proje şu aşamada ağır AI observability platformu, agent zinciri, MCP entegrasyonu, otomatik merge/push veya dış AI API entegrasyonu kullanmayacaktır.

Bunlar ancak EL_Patron onayı, ayrı discovery ve güvenlik değerlendirmesiyle ele alınabilir.

## 10. Devam Eden Roadmap ile İlişki

Bu governance mini sprint, ürün roadmap'ini değiştirmez.

Sıradaki ürün işi hâlâ:
Sprint 9.3D-2 — Reminder List Phone Context UI Display Discovery

Bu doküman sadece AI/Codex çalışma disiplinini daha standart hale getirir.
