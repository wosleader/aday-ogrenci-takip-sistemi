# Pilot Smoke Checklist - 238ba22

- Repo safe HEAD: `238ba22 docs: close guardian phone UI clarity checkpoint`
- Branch: `sprint-9-2-multi-phone-architecture-plan`
- Kapsam: docs-only pilot readiness checklist
- Beklenen dirty file: yalnızca `?? dev-server.log`
- Bu doküman kod, test, schema, import, export veya backup implementation değişikliği içermez.

## 1. Amaç

Bu checklist, `238ba22` güvenli checkpoint'ine kadar tamamlanan zincirin pilot öncesinde hızlı ve kontrollü smoke doğrulamasını yapmak içindir.

Tamamlanan zincir:

1. Guardian parent names / Anne-Baba ad import davranışı
2. Explicit `ANNE TEL` / `BABA TEL` relation phone import
3. Detailed export guardian names
4. Backup/restore guardian roundtrip guarantee
5. Adaptive summary export columns
6. No-phone import setting
7. Guardian + phone UI clarity polish

Checklist şu davranışları kontrol eder:

- Import preview ile writer davranışı ayrımı korunuyor mu?
- Anne, Baba ve Veli adları doğru işleniyor mu?
- Explicit `ANNE TEL` / `BABA TEL` ilişki telefonları korunuyor mu?
- Telefon 1-10 slot sadakati korunuyor mu?
- No-phone import setting doğru çalışıyor mu?
- Invalid-only telefon satırı import dışında kalıyor mu?
- Duplicate normalized phone davranışı beklenen gibi mi?
- Sağ kart UI clarity beklentileri karşılanıyor mu?
- Detailed export, adaptive summary export ve backup/restore smoke geçiyor mu?
- Kontrol sonrasında working tree yalnızca `?? dev-server.log` içeriyor mu?

Checklist şunları garanti etmez:

- Büyük ölçekli performans testi değildir.
- Tüm import edge-case senaryolarını kapsamaz.
- Reporting Area V2, correction history, safe delete veya diğer park edilmiş işleri doğrulamaz.
- Excel export bir restore veya tam sistem yedeği değildir.

## 2. Kapsam

- Import preview
- Import writer davranışı
- No-phone import setting
- Anne/Baba/Veli adları
- Explicit `ANNE TEL` / `BABA TEL` relation phones
- Telefon 1-10 slot sadakati
- Invalid-only phone davranışı
- Duplicate normalized phone davranışı
- Sağ kart UI, `Veli Bilgileri` ve telefon relation rozetleri
- Detailed export
- Adaptive summary export
- Backup/restore
- Basic call/action smoke
- Final Git cleanliness

## 3. Kapsam Dışı

- Kod değişikliği yoktur.
- Test dosyası değişikliği yoktur.
- Schema veya migration işi yoktur.
- Import/export/backup implementation değişikliği yoktur.
- Reader, persistence veya phone ordering implementation değişikliği yoktur.
- Reporting Area V2 / Pipeline Visualization yoktur.
- Correction history yoktur.
- Safe delete yoktur.
- Clean re-import workflow yoktur.
- Phone-level outcome tracking yoktur.
- Gerçek veya pilot DB üzerinde reset yoktur.
- Excel export restore/backup gibi kullanılmaz.
- `dev-server.log` dosyasına dokunulmaz.

## 4. Ön Koşullar

- Branch `sprint-9-2-multi-phone-architecture-plan` olmalıdır.
- HEAD `238ba22` olmalıdır.
- Working tree yalnızca `?? dev-server.log` içermelidir.
- Smoke mümkünse izole/demo data ile yapılmalıdır.
- Restore smoke gerçek veya pilot data üzerinde yapılmamalıdır.
- Restore gerekiyorsa önce Tam Sistem Yedeği alınmalı ve işlem için açık onay bulunmalıdır.
- `dev-server.log` untracked kalabilir; silinmez, düzenlenmez ve stage edilmez.

Ön koşullardan biri sağlanmıyorsa smoke başlamadan durulmalı ve sapma raporlanmalıdır.

## 5. Test Verisi

8-12 satırlık küçük, yapay bir Excel çalışma dosyası yeterlidir. Gerçek aday verisi kullanılmamalıdır.

| Senaryo | Önerilen içerik | Beklenen amaç |
|---|---|---|
| Veli telefonu | Öğrenci adı, Veli adı, generic/Veli telefonu | Veli adı ve telefonun kaybolmaması |
| Anne telefonu | Öğrenci adı, Anne adı, `ANNE TEL` | Anne guardian ilişkisi ve relation phone bağlantısı |
| Baba telefonu | Öğrenci adı, Baba adı, `BABA TEL` | Baba guardian ilişkisi ve relation phone bağlantısı |
| Telefon 3-only | Öğrenci adı ve yalnız Telefon 3 | Numaranın Telefon 1'e kaymaması |
| Telefon 10-only | Öğrenci adı ve yalnız Telefon 10 | Numaranın Telefon 10 slotunda kalması |
| No-phone row | Öğrenci adı, telefon yok | OFF/ON policy farkını doğrulama |
| Invalid-only phone | Öğrenci adı ve geçersiz tek telefon | Her iki modda bloklama |
| Duplicate normalized phone | İki öğrencide biçimi farklı fakat normalize değeri aynı telefon | Duplicate uyarısı/koruması |
| Parent-only, student name yok | Anne/Baba adı, gerekirse Mahalle/İlçe; öğrenci adı yok | Parent alanlarının öğrenci adı üretmemesi |

### No-Phone Ayarı

Ayar adı:

`Telefonsuz adayları içe aktar`

Beklenen davranış:

- Varsayılan OFF'tur.
- ON seçimi yalnız mevcut import oturumu içindir.
- localStorage/sessionStorage persistence yoktur.
- OFF iken geçerli telefonu olmayan satır import edilmez.
- ON iken gerçekten telefonsuz, geçerli öğrenci adı bulunan satır import edilebilir.
- ON ile import edilen no-phone satırında PhoneRecord oluşmaz.
- Invalid-only phone OFF ve ON modlarında engellenir.
- Geçerli Anne/Baba telefonu usable phone sayılır.
- Yalnız Telefon 2, Telefon 3 veya Telefon 10 bulunan satır usable phone kabul edilir.

## 6. Komut Checklist'i

### 6.1 Başlangıç Git Kontrolü

```powershell
git status --short
git status -sb
git rev-parse --short HEAD
git log --oneline --decorate -8
```

Beklenen:

- HEAD: `238ba22`
- Branch: `sprint-9-2-multi-phone-architecture-plan`
- Dirty durum: yalnızca `?? dev-server.log`

### 6.2 Focused Test Komutları

Aşağıdaki dosyaların tamamı repoda doğrulanmıştır; uydurma test dosyası kullanılmamıştır.

| Alan | Gerçek focused test dosyaları | Komut |
|---|---|---|
| Guardian parent names ve student-name safety | `columnMatching`, `importNameComposition`, `importWriter`, `studentListReader` | `npm.cmd test -- --run tests/imports/columnMatching.test.ts tests/imports/importNameComposition.test.ts tests/imports/importWriter.test.ts tests/students/studentListReader.test.ts` |
| Explicit ANNE TEL / BABA TEL ve slot sırası | `columnMatching`, `importSimulation`, `importWriter` | `npm.cmd test -- --run tests/imports/columnMatching.test.ts tests/imports/importSimulation.test.ts tests/imports/importWriter.test.ts` |
| Detailed export guardian names | `exportDataReader`, `exportMapper` | `npm.cmd test -- --run tests/exports/exportDataReader.test.ts tests/exports/exportMapper.test.ts` |
| Backup/restore guardian roundtrip | `backupRestore` | `npm.cmd test -- --run tests/settings/backupRestore.test.ts` |
| Adaptive summary export | `summaryExportMapper`, `excelExporter` | `npm.cmd test -- --run tests/exports/summaryExportMapper.test.ts tests/exports/excelExporter.test.ts` |
| No-phone setting, invalid-only ve policy snapshot | `ImportPageProgressiveDisclosure`, `importSimulation`, `importWriter`, `importNameComposition`, `importDuplicateGuard` | `npm.cmd test -- --run tests/imports/ImportPageProgressiveDisclosure.test.tsx tests/imports/importSimulation.test.ts tests/imports/importWriter.test.ts tests/imports/importNameComposition.test.ts tests/imports/importDuplicateGuard.test.ts` |
| Duplicate normalized phone read/import davranışı | `importSimulation`, `importWriter`, `studentListReader` | `npm.cmd test -- --run tests/imports/importSimulation.test.ts tests/imports/importWriter.test.ts tests/students/studentListReader.test.ts` |
| Guardian + phone UI clarity ve telefon aksiyonları | `StudentsPageMultiPhone`, `StudentsPagePhoneSelection`, `studentListReader` | `npm.cmd test -- --run tests/students/StudentsPageMultiPhone.test.tsx tests/students/StudentsPagePhoneSelection.test.tsx tests/students/studentListReader.test.ts` |

Not: Bu zincirdeki her ana alan için dedicated focused test bulundu. Basic call/action davranışı için ayrıca mevcut `tests/calls/` testleri ve `StudentsPagePhoneSelection.test.tsx` vardır; smoke checklist yeni test üretmez.

### 6.3 OOM-Safe Full Unit Test

Windows `cmd.exe` oturumunda:

```bat
set NODE_OPTIONS=--max-old-space-size=4096
npx.cmd vitest run --exclude e2e/** --maxWorkers=1
```

PowerShell kullanılıyorsa eşdeğer environment ataması `$env:NODE_OPTIONS='--max-old-space-size=4096'` şeklindedir; doğrulama komutunun geri kalanı değişmez.

### 6.4 Build

`package.json` içinde build scripti doğrulandı:

```powershell
npm.cmd run build
```

Script: `tsc -b && vite build`

### 6.5 Opsiyonel Mevcut Import E2E

Bu smoke belgesinin zorunlu parçası değildir. Chromium kurulmuşsa mevcut import E2E matrisi ayrıca çalıştırılabilir:

```powershell
npm.cmd run qa:import:e2e
```

### 6.6 Final Git Kontrolü

```powershell
git status --short
git status -sb
```

Beklenen final durum:

```text
?? dev-server.log
```

## 7. Manuel QA Checklist'i

### 7.1 Import Preview

- [ ] No-phone setting varsayılan OFF mu?
- [ ] OFF iken geçerli telefonu olmayan satır import dışında mı?
- [ ] ON iken gerçekten telefonsuz satır import edilebilir mi?
- [ ] Invalid-only phone iki modda da engelleniyor mu?
- [ ] Geçerli Anne/Baba telefonu usable phone sayılıyor mu?
- [ ] Telefon 3-only ve Telefon 10-only slotları korunuyor mu?
- [ ] Duplicate normalized phone uyarısı/engeli beklenen gibi mi?
- [ ] Anne/Baba/Veli alanları öğrenci adı üretmiyor mu?

### 7.2 Import Result

- [ ] Imported, skipped, duplicate ve invalid sayıları anlamlı mı?
- [ ] `no_usable_phone_count` beklenen satır sayısını gösteriyor mu?
- [ ] No-phone ON satırında PhoneRecord oluşmuyor mu?
- [ ] Invalid-only satır yanlışlıkla import olmuyor mu?
- [ ] Preview'da kabul edilmeyen satır writer tarafından yazılmıyor mu?

### 7.3 Öğrenci Listesi

- [ ] Öğrenci adı görünümü bozulmamış mı?
- [ ] Anne/Baba/Veli bilgisi kaybolmamış mı?
- [ ] Aynı import satırı içinde duplicate PhoneRecord oluşmuyor mu?
- [ ] Aday seçme ve detay açma akışı çalışıyor mu?
- [ ] Duplicate normalized phone davranışı listede beklenen işaret/filtreyi üretiyor mu?

### 7.4 Sağ Kart / Veli Bilgileri

- [ ] Bölüm başlığı tam olarak `Veli Bilgileri` mi?
- [ ] Anne/Baba/Veli isimleri yalnız anlamlı ve dolu satırlarda gösteriliyor mu?
- [ ] Telefon slot başlıkları `Telefon 1`, `Telefon 2`, `Telefon 3` ve gerektiğinde `Telefon 10` olarak korunuyor mu?
- [ ] İlişki biliniyorsa uygun rozet görünüyor mu?
  - `Anne telefonu`
  - `Baba telefonu`
  - `Veli telefonu`
  - `Öğrenci telefonu`
  - `Yakın telefonu`
- [ ] Generic veya bilinmeyen telefonda ek ilişki rozeti yok mu?
- [ ] Excel `source_column` ana ekranda görünmüyor mu?
- [ ] Tooltip varsa `Excel kaynağı: ANNE TEL` biçimini kullanıyor mu?
- [ ] Geçersiz, yanlış/kullanılmıyor ve selected/current telefon durumları birbirine karışmıyor mu?
- [ ] `Son sonuç`, copy, +N / Daha az göster ve ✓ / x davranışları çalışıyor mu?

Açık not: Guardian + phone UI clarity checkpoint yalnız UI polish'tir. Schema, import, export, backup, reader, persistence ve phone ordering davranışı bu checkpoint'te değiştirilmemiştir.

### 7.5 Detailed Export

- [ ] Veli, Anne ve Baba adları export içinde korunuyor mu?
- [ ] `Veli Ad Soyad`, `Anne Adı` ve `Baba Adı` beklenen kolonlarda mı?
- [ ] Telefon 1-10 değerleri kendi slotlarında mı?
- [ ] Export kullanıcıya restore veya tam sistem yedeği gibi sunulmuyor mu?

### 7.6 Adaptive Summary Export

- [ ] Boş veya gereksiz kolon şişmesi yok mu?
- [ ] Anne/Baba/Mahalle/İlçe kolonları yalnız dolu veri olduğunda ekleniyor mu?
- [ ] Telefon kolonları kullanılan en yüksek slota kadar uyarlanıyor mu?
- [ ] Telefon slot anlamı kaybolmuyor veya Telefon 1/2'ye sıkıştırılmıyor mu?
- [ ] Relation phone değerleri kendi Telefon N slotlarında kalıyor mu?

### 7.7 Backup/Restore Smoke

- [ ] Tam Sistem Yedeği alınabiliyor mu?
- [ ] Restore yalnız izole/demo ortamda deneniyor mu?
- [ ] Restore öncesinde ayrıca güvenli backup mevcut mu?
- [ ] Restore sonrasında Veli/Anne/Baba guardian kayıtları korunuyor mu?
- [ ] Relation phone `guardian_id`, `relation_label`, `source_column`, `reference_label` ve `priority` değerleri korunuyor mu?
- [ ] Telefon slotları korunuyor mu?
- [ ] Gerçek veya pilot DB üzerinde kontrolsüz restore yapılmıyor mu?

### 7.8 Basic Call/Action Smoke

- [ ] Aday seçme çalışıyor mu?
- [ ] Sağ detay kartı açılıyor mu?
- [ ] Temel call/action butonları görünür ve çalışır mı?
- [ ] Telefon seçimi ✓ davranışı bozulmamış mı?
- [ ] Yanlış/kullanılmayacak x davranışı bozulmamış mı?
- [ ] UI kilitlenmeden işlem tamamlanıyor mu?
- [ ] Console/runtime error yok mu?

## 8. PASS / FAIL Kriterleri

### PASS

- Başlangıç HEAD `238ba22`.
- Branch `sprint-9-2-multi-phone-architecture-plan`.
- Başlangıç working tree yalnızca `?? dev-server.log`.
- Focused testler geçiyor veya dedicated test yokluğu açıkça belgelenmiş.
- OOM-safe unit test geçiyor.
- Build geçiyor.
- Import preview/writer ayrımı korunuyor.
- No-phone OFF/ON davranışı doğru.
- Invalid-only phone import edilmiyor.
- Anne/Baba geçerli telefonu usable phone sayılıyor.
- Telefon 3-only ve Telefon 10-only slot sadakati korunuyor.
- Sağ kart UI clarity beklentileri geçiyor.
- Detailed export geçiyor.
- Adaptive summary export geçiyor.
- Backup/restore smoke izole ortamda geçiyor.
- Final working tree yalnızca `?? dev-server.log`.

### FAIL

- HEAD `238ba22` değil.
- Branch yanlış.
- `dev-server.log` dışında beklenmeyen dirty file var.
- No-phone OFF/ON davranışı bozuk.
- Invalid-only phone import ediliyor.
- Anne/Baba telefonu usable phone sayılmıyor.
- Telefon 3-only veya Telefon 10-only slotu Telefon 1'e kayıyor.
- `source_column` ana ekranda görünür teknik metin olarak basılıyor.
- Guardian adları export'ta kayboluyor.
- Backup/restore guardian veya phone relation metadata'sını bozuyor.
- Build kırılıyor.
- Restore gerçek/pilot data üzerinde kontrolsüz deneniyor.

### Warning Ama Kabul Edilebilir

- Windows LF -> CRLF uyarıları.
- `?? dev-server.log` untracked kalması.
- Playwright/E2E flaky ise ve zorunlu smoke kapsamına alınmadıysa bunun açıkça raporlanması.
- Veri anlamını bozmayan küçük görsel hizalama sorunları.
- Tooltip generic telefonlarda yokken relation kaynaklı telefonlarda doğru çalışması.

## 9. Riskler ve Guardrails

| Risk | Guardrail |
|---|---|
| Mevcut DB verisini bozma | Yalnız izole/demo smoke data kullan. |
| Backup almadan restore denemek | Restore öncesi Tam Sistem Yedeği ve açık onay şartı koy. |
| Demo data ile pilot datayı karıştırmak | Ayrı browser profili veya ayrı demo DB kullan. |
| Excel export'u restore/backup sanmak | Export yalnız rapor/paylaşım çıktısıdır; restore kaynağı Tam Sistem Yedeği'dir. |
| Duplicate testinde gerçek kayıtları kirletmek | Yapay telefon ve öğrenci adları kullan; pilot DB'ye yazma. |
| Scope'un Reporting V2'ye kayması | Pipeline visualization ayrı discovery olmadan başlatılmaz. |
| Scope'un correction history/safe delete'e kayması | Bu konular ayrı ürün kararı ve sprint gerektirir. |
| Full test OOM | Belgelenen 4096 MB ve `--maxWorkers=1` komutunu kullan. |
| UI smoke'un subjektif kalması | Exact görünen metinleri, slotları ve durumları checklist üzerinden işaretle. |

Genel guardrails:

- İzole/demo smoke data kullan.
- Gerçek/pilot DB üzerinde restore veya reset yapma.
- Export'un yalnız rapor olduğunu açık tut.
- `dev-server.log` dosyasına dokunma.
- Kod, test, schema veya implementation değişikliği yapma.
- Scope dışı işler için ayrı discovery aç.

## 10. Final Sign-Off

| Kontrol | Sonuç | Not |
|---|---|---|
| Git start | PASS / FAIL | |
| Focused tests | PASS / WARN / FAIL | |
| OOM-safe tests | PASS / FAIL | |
| Build | PASS / FAIL | |
| Manual import QA | PASS / FAIL | |
| Right-card UI QA | PASS / FAIL | |
| Export QA | PASS / FAIL | |
| Backup/restore smoke | PASS / FAIL | |
| Final Git status | PASS / FAIL | |
| Pilot smoke result | PASS / WARNING / FAIL | |

- Reviewer note:
- Date:

