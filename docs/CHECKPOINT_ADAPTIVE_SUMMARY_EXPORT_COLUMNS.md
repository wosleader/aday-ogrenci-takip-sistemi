# Adaptive Summary Export Columns

Date: 2026-06-14

Branch: `sprint-9-2-multi-phone-architecture-plan`

Closed implementation commit: `6347cfa feat: add adaptive summary export columns`

Previous checkpoint: `6924ec2 docs: close backup restore guardian roundtrip checkpoint`

## Why This Slice Exists

Özet Görüşme Raporu daha önce sabit Telefon 1/2 kolonlarına ve compatibility alanlarına dayanıyordu. Bu davranış Telefon 3-10 verisini dışarıda bırakabiliyor, Telefon 7-only gibi kayıtları yanlış slota sıkıştırma riski taşıyor ve mevcut Anne/Baba/Mahalle/İlçe verisini özet raporda değerlendirmiyordu.

Bu dilim özet export'u yalnızca export edilen gerçek satırlara göre adaptif ve slot-faithful hale getirir. Detaylı export, import, backup/restore, schema ve UI davranışları değiştirilmez.

## What Was Implemented

- Mevcut export dataset'inden canonical summary rows bir kez oluşturulur.
- `SummaryColumnPlan` aynı canonical satırlardan üretilir.
- Header ve row değerleri aynı `canonicalRows + SummaryColumnPlan` kaynağından oluşturulur.
- Ek DB sorgusu eklenmedi.
- Özet telefon kolonları compatibility `phone_1` / `phone_2` sıkıştırmasına dayanmaz; slot-faithful `phones[]` kaynağını kullanır.
- Mevcut dinamik `Açıklama N` kolonları ve sonuç/tarih trailing alanları korunur.

## Adaptive Optional Fields

- `Veli Ad Soyad` sabit ve temel özet kolonudur.
- `Anne Adı`, yalnızca export edilen en az bir satırda doluysa eklenir.
- `Baba Adı`, yalnızca export edilen en az bir satırda doluysa eklenir.
- `Mahalle`, yalnızca export edilen en az bir satırda doluysa eklenir.
- `İlçe`, yalnızca export edilen en az bir satırda doluysa eklenir.
- `Doğum Tarihi` mevcut modelde bulunmadığı için bu dilimde eklenmedi.

## Dynamic Phone And Status Behavior

- `Telefon 1` / `Telefon 1 Durumu` her zaman bulunur.
- `Telefon 2` / `Telefon 2 Durumu` her zaman bulunur.
- Dataset'teki en yüksek Telefon N slotu 3-10 arasındaysa Telefon 1'den Telefon N'e kadar bütün telefon/durum çiftleri eklenir.
- Üst sınır Telefon 10'dur.
- Telefon 7-only kayıt Telefon 7 altında kalır.
- Telefon 10-only kayıt Telefon 10 altında kalır.
- Parent relation telefonları özgün Telefon N slotlarında kalır.
- Slot sıkıştırması veya kaydırması yapılmaz.
- Ayrı `Anne Telefonu` / `Baba Telefonu` kolonları eklenmez.
- Boş telefon slotlarının durum hücresi boş kalır.
- Invalid non-empty telefon durumu `Geçersiz format` olarak export edilir.

## Header Order

1. `Sıra No`
2. `Öğrenci Ad Soyad`
3. `Veli Ad Soyad`
4. Adaptif `Anne Adı`
5. Adaptif `Baba Adı`
6. Adaptif `Mahalle`
7. Adaptif `İlçe`
8. Dinamik `Telefon N` / `Telefon N Durumu` çiftleri
9. `Sınıf`
10. `Genel Açıklama`
11. Dinamik `Açıklama N` kolonları
12. Mevcut sonuç/tarih trailing alanları

## Data Safety Validation

In-memory fail-fast validation şunları kontrol eder:

- Dolu Anne değerinin plan dışında kalmaması.
- Dolu Baba değerinin plan dışında kalmaması.
- Dolu Mahalle değerinin plan dışında kalmaması.
- Dolu İlçe değerinin plan dışında kalmaması.
- Dolu Telefon N değerinin planlanan maksimum slot üstünde kalmaması.
- Telefon slotlarının 1-10 aralığında olması.
- Her `Telefon N` header'ının eşleşen `Telefon N Durumu` header'ına sahip olması.
- Her row uzunluğunun header uzunluğuyla eşleşmesi.

Doğrulama eksik kolonları sessizce eklemez; programlama hatasını açıklayıcı exception ile görünür kılar. DB sorgusu veya kalıcı veri değişikliği yapmaz.

## Implementation Files

- `src/features/exports/services/exportMapper.ts`
- `tests/exports/summaryExportMapper.test.ts`

Implementation diff: 2 files changed, 435 insertions, 61 deletions.

## Tests And Validation

- Focused export tests: PASS, 4 files / 34 tests.
- OOM-safe full unit test: PASS, 45 files / 321 tests.
- Full test command:

```powershell
$env:NODE_OPTIONS='--max-old-space-size=4096'
npx.cmd vitest run --exclude e2e/** --maxWorkers=1
```

- `npm.cmd run build`: PASS.
- Known Vite chunk-size warning only.
- Playwright was not run because import/E2E scope was not touched.
- `dev-server.log` remained local/untracked and untouched.

## Explicitly Not Implemented

- Detailed export behavior changes.
- Import behavior changes.
- Backup/restore behavior changes.
- Schema migration or a new table.
- UI/right drawer/card label changes.
- `Veli Bilgisi` UI group label.
- Doğum Tarihi model/import/export support.
- Separate Anne/Baba phone columns.
- E2E/Playwright scenarios.
- Package changes.

## Known Warnings And Remaining Risks

- Summary export artık dinamik kolonlara sahiptir; dış Excel tüketicileri sabit kolon indeksleri yerine header adlarını kullanmalıdır.
- Doğum Tarihi için model/import persistence bulunmaz ve ayrı future discovery gerektirir.
- `Veli Bilgisi` UI etiketi ertelenmiştir.
- Gelecek summary export değişiklikleri Telefon 1-10 slot fidelity'yi korumalıdır.
- `SummaryColumnPlan` ve canonical helper'lar test erişimi için export edilmiştir; ileride ihtiyaç oluşursa internal helper modülüne taşınabilir.

## Trial Workflow Note

Gelecek Codex promptları için yeniden kullanılabilir bir güvenlik iskeleti deneme kararı alınmıştır. Bu karar hazır/blind prompt kararlarının kullanılacağı anlamına gelmez.

Her prompt mevcut işin HEAD, scope, izinli/yasak dosyalar, riskler, testler ve insan kararlarına göre ayrıca özelleştirilmelidir. Deneme birkaç faz boyunca güvenli çalışmadan uzun vadeli roadmap veya Obsidian standardına taşınmayacaktır. Scope drift, kontrol kaybı veya proje parçalanması üretirse eski daha katı manuel prompt stiline dönülecektir.

## Recommended Next Slice

Yeni implementation insan kararı olmadan başlatılmamalıdır. İki dar aday vardır:

1. Telefonsuz aday import ayarı:
   - Varsayılan kapalı.
   - İlk sürüm session-only.
   - Açık onay olmadan telefonsuz adayı engeller.
   - Mevcut telefonsuz kayıtları silmez.
   - Anne/Baba isim ve telefon davranışını değiştirmez.
2. Küçük UI polish:
   - Sağ drawer/card içinde `Veli Bilgisi` grup etiketi.
   - Export kolonu `Veli Ad Soyad` olarak değişmeden kalır.
   - Telefon kaynak bilgi göstergesi daha sonraki ayrı karar olabilir.
