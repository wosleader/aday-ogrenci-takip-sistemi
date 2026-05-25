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

## 8. Kullanılmayacak Ağır Süreçler

Bu proje şu aşamada ağır AI observability platformu, agent zinciri, MCP entegrasyonu, otomatik merge/push veya dış AI API entegrasyonu kullanmayacaktır.

Bunlar ancak EL_Patron onayı, ayrı discovery ve güvenlik değerlendirmesiyle ele alınabilir.

## 9. Devam Eden Roadmap ile İlişki

Bu governance mini sprint, ürün roadmap'ini değiştirmez.

Sıradaki ürün işi hâlâ:
Sprint 9.3D-2 — Reminder List Phone Context UI Display Discovery

Bu doküman sadece AI/Codex çalışma disiplinini daha standart hale getirir.
