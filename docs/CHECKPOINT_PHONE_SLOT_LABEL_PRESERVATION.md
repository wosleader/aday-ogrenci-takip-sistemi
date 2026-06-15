# Checkpoint - Phone Slot Label Preservation

Date: 2026-06-15

Branch: `sprint-9-2-multi-phone-architecture-plan`

Implementation HEAD: `4b1eeb9 fix: preserve phone slot labels in student details`

Previous docs HEAD: `93b833f docs: add pilot smoke checklist`

Checkpoint type: docs-only closure

Working tree expectation: only `?? dev-server.log`

## 1. Kısa Özet

Pilot smoke sırasında yalnız `TELEFON 3` veya yalnız `TELEFON 10` içeren adaylarda slot sadakati kırıldı. Import preview ve kolon eşleştirme ekranı bu kolonları doğru tanımasına rağmen, import sonrasında sağ kart numarayı `Telefon 1` etiketiyle gösteriyordu.

`4b1eeb9` ile sağ kart ve aday detay görünümünde canonical telefon slot etiketi korunacak şekilde dar bir reader/UI düzeltmesi yapıldı. Telefon 1/2 action compatibility, hızlı arama hedefi ve primary telefon davranışı değiştirilmedi.

## 2. Pilot Smoke FAIL Bulgusu

### Mina Çelik

- Excel verisi: yalnız `TELEFON 3`
- Beklenen: `Telefon 3`
- Önceki gerçek: `Telefon 1`
- Sonuç: FAIL

### Bora Demir

- Excel verisi: yalnız `TELEFON 10`
- Beklenen: `Telefon 10`
- Önceki gerçek: `Telefon 1`
- Sonuç: FAIL

Diğer smoke gözlemleri:

- Efe Kaya için `Anne telefonu` rozeti çalışıyordu.
- Deniz Arslan için `Baba telefonu` rozeti çalışıyordu.
- `VELİ TEL` relation, ayrı bir Veli Telefonu mapping hedefi bulunmadığı için bu smoke turunda WARN/N/A kaldı.

## 3. Discovery Özeti

- Import preview ve kolon mapping davranışı doğruydu.
- Import writer ana kırılma noktası değildi.
- Phone persistence ana kırılma noktası değildi.
- `reference_label`, `display_label` ve `priority` metadata'sı korunuyordu.
- Kırılma reader/UI compatibility katmanında oluşuyordu.
- Eski Telefon 1/2 compatibility ve sıkıştırma policy'si, yeni slot sadakati beklentisiyle çelişiyordu.

Sınıflandırma:

- Kaynak kod açısından eski bilinçli compatibility policy'si.
- Yeni ürün beklentisi açısından UI/read-model bug'ı.
- Sonuç olarak eski policy ile güncel pilot ürün kararı arasında çatışma.

## 4. Ürün Kararı

- Sağ kart ve aday detay görünümünde Excel slot sadakati esas alınır.
- `TELEFON 3` import edildiyse kullanıcı `Telefon 3` görür.
- `TELEFON 10` import edildiyse kullanıcı `Telefon 10` görür.
- Boş slotları sıkıştırıp numarayı `Telefon 1` gibi göstermek yeni pilot beklentisiyle uyumsuzdur.
- Telefon 1/2 action compatibility, hızlı arama ve primary telefon davranışı korunur.
- Aynı telefon numarası sağ kartta iki kez render edilmez.
- Canonical metadata bulunmayan legacy kayıtlarda güvenli Telefon 1/2 fallback davranışı korunur.

## 5. Fix Özeti

`4b1eeb9` implementation davranışı:

- Sağ karttaki compatibility Telefon 1/2 alanları sabit label yerine canonical telefon metadata'sından label alır.
- Canonical label önceliği:
  1. `reference_label`
  2. Numaralı `phone_label`
  3. Geçerli `priority` değeri (`1-10`)
  4. `source_column` içindeki Telefon/Tel/GSM N değeri
  5. Legacy index fallback
- Telefon ID ve action hedefi değiştirilmedi.
- Mevcut duplicate render engeli korundu.
- Legacy fallback korundu.
- Slot label ile relation badge ayrı anlamlar olarak tutuldu.
- Generic Telefon 3/10 kayıtlarında relation badge gösterilmez.

## 6. Değişen Implementation Alanları

Implementation commit'inde değişen dosyalar:

- `src/features/students/StudentsPage.tsx`
- `src/features/students/services/phoneCompatibility.ts`
- `tests/students/StudentsPageMultiPhone.test.tsx`
- `tests/students/phoneCompatibility.test.ts`
- `tests/students/studentListReader.test.ts`

Bu docs-only closure sırasında bu dosyalara dokunulmadı.

## 7. Test Özeti

- Focused öğrenci testleri: PASS, 4 dosya / 56 test.
- Import/export/backup regresyonu: PASS, 5 dosya / 68 test.
- OOM-safe full test: PASS, 45 test files / 333 tests.

```powershell
set NODE_OPTIONS=--max-old-space-size=4096
npx.cmd vitest run --exclude e2e/** --maxWorkers=1
```

- `npm.cmd run build`: PASS.
- Bilinen Vite chunk-size warning devam eder; build başarısını etkilemez.

## 8. Manual Smoke QA Özeti

| Aday | Beklenen görünüm | Sonuç |
|---|---|---|
| Efe Kaya | `Telefon 1` + `Anne telefonu` rozeti | PASS |
| Deniz Arslan | `Telefon 1` + `Baba telefonu` rozeti | PASS |
| Mina Çelik | Yalnız `Telefon 3`; `Telefon 1` duplicate yok | PASS |
| Bora Demir | Yalnız `Telefon 10`; `Telefon 1` duplicate yok | PASS |
| Generic Telefon 3/10 | Relation badge yok | PASS |
| `VELİ TEL` relation | Ayrı mapping hedefi olmadığı için bu turda test edilemedi | WARN/N/A |

## 9. Non-goals / Değişmeyenler

- Schema değişmedi.
- Migration yapılmadı.
- Import writer değişmedi.
- Import simulation veya preview değişmedi.
- Export değişmedi.
- Backup/restore değişmedi.
- Package script değişmedi.
- No-phone import setting davranışı değişmedi.
- Invalid-only phone davranışı değişmedi.
- Duplicate normalized phone davranışı değişmedi.
- `dev-server.log` dosyasına dokunulmadı.
- `docs/PILOT_SMOKE_CHECKLIST_238ba22.md` tarihsel checklist olarak değiştirilmedi.

## 10. Riskler ve Sonraki Kontroller

- Liste tablosundaki legacy Telefon 1/2 compatibility alanları bilinçli olarak korunmuştur.
- Sağ kart smoke PASS olsa da gerçek pilot data ile sınırlı spot-check yapılması önerilir.
- Export ve backup davranışının etkilenmediği mevcut regresyon testleriyle desteklenmiştir.
- Obsidian/Drive sync, repo closure commit'i sonrasında ayrı bir görev olarak değerlendirilmelidir.

## 11. Current Safe State

Implementation safe HEAD:

`4b1eeb9 fix: preserve phone slot labels in student details`

Docs closure commit sonrasında yeni safe HEAD, bu closure commit'i olacaktır.
