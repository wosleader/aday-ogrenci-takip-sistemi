# Guardian + Phone UI Clarity

Date: 2026-06-14

Branch: `sprint-9-2-multi-phone-architecture-plan`

Closed implementation commit: `ead391b feat: clarify guardian and phone labels`

Previous checkpoint: `eefd4ed docs: close no-phone import setting checkpoint`

## Why This Slice Exists

Veli, Anne ve Baba kayıtları ile explicit parent phone relation metadata'sı sistemde bulunuyordu; ancak sağ öğrenci kartında slot bilgisi ve kişi ilişkisi aynı başlıkta birleşebiliyor, Telefon 1/2 ile Telefon 3+ sunumu arasında görsel tutarsızlık oluşabiliyordu.

Bu küçük UI dilimi veri davranışını değiştirmeden iki bilgiyi ayırır:

- Telefonun sabit slotu: `Telefon N`
- Telefonun anlamlı kişi ilişkisi: küçük ikincil rozet

## Final Product Decision

- Contact section başlığı: `Veli Bilgileri`
- `Veli / Anne / Baba Bilgileri` final başlık olarak kullanılmaz.
- Veli, Anne ve Baba adları yalnız dolu olduklarında mevcut ayrı satır etiketleriyle gösterilir.
- Telefon slot başlığı her zaman `Telefon 1`, `Telefon 2`, `Telefon 3` ... olarak kalır.
- Relation bilgisi slot adını değiştirmez veya Telefon N sadakatini gizlemez.

## Relation Badge Behavior

Anlamlı relation değerleri şu kompakt rozetleri üretir:

- `Anne telefonu`
- `Baba telefonu`
- `Veli telefonu`
- `Öğrenci telefonu`
- `Yakın telefonu`

Generic veya bilinmeyen relation için:

- Ek rozet gösterilmez.
- `İlişki belirtilmedi` gibi fallback metni gösterilmez.
- Normal/generic telefon kartı görsel olarak sade kalır.

## Source Tooltip Behavior

- Excel `source_column` ana UI metni olarak gösterilmez.
- Relation rozeti ve kaynak bilgisi birlikte mevcutsa native tooltip kullanılır.
- Tooltip biçimi: `Excel kaynağı: ANNE TEL`
- Kaynak bilgisi yoksa boş veya teknik placeholder tooltip üretilmez.

## Existing Behavior Preserved

- Active/current phone state
- Yanlış numara / kullanılmıyor görünümü
- Geçersiz format görünümü
- Read-only `Son sonuç`
- Telefon numarası copy affordance
- Telefon 3+ `+N numara daha göster` / `Daha az göster`
- ✓ / x aksiyonları
- Call-save phone selection context
- Telefon 1-10 slot ve sıra sadakati

## Implementation Files

- `src/features/students/StudentsPage.tsx`
- `tests/students/StudentsPageMultiPhone.test.tsx`
- `tests/students/StudentsPagePhoneSelection.test.tsx`

## Explicitly Unchanged

- DB schema veya migration
- Import mapping, simulation veya writer
- Export kolonları veya mapper
- Full System Backup / restore
- Student list reader veya DB query
- Phone persistence veya `phone_status` semantiği
- Telefon slot/order logic
- Reporting veya pipeline visualization
- CRUD, correction veya communication history
- Package/dependency yapısı

## Tests And Validation

- Initial focused validation: PASS, 3 test files / 45 tests.
- OOM-safe full unit validation: PASS, 45 test files / 328 tests.

```powershell
$env:NODE_OPTIONS='--max-old-space-size=4096'
npx.cmd vitest run --exclude e2e/** --maxWorkers=1
```

- `npm.cmd run build`: PASS.
- Known Vite chunk-size warning only.
- Final title correction focused validation: PASS, 2 test files / 21 tests.

## Manual QA Note

Uygulama localhost üzerinde runtime hatası olmadan açıldı. Ancak temiz browser profilinde aday verisi bulunmadığı için gerçek bir Veli/Anne/Baba ve relation-aware telefon kartı üzerinde görsel QA tamamlanamadı.

Commit öncesi veya takip eden kabul kontrolünde veri içeren bir localhost profiliyle şu noktalar doğrulanmalıdır:

1. `Veli Bilgileri` başlığı sade ve dengeli görünür.
2. Dolu Veli/Anne/Baba satırları doğru görünür.
3. Generic Telefon 1 ek relation rozeti göstermez.
4. Explicit Anne/Baba telefonunda doğru rozet görünür.
5. Telefon 3+ slot etiketi ve relation rozeti birlikte taşma yaratmaz.
6. Tooltip yalnız kaynak mevcutsa görünür.
7. Status, Son sonuç, copy, expand/collapse ve ✓ / x davranışları çalışır.

## Context And Workflow Notes

- Repo docs source of truth'tür.
- Google Drive / Obsidian strategy vault ayrı katmandır ve `eefd4ed` seviyesine senkronlanmıştır.
- Bu `ead391b` checkpoint'i sonrasında strategy vault için küçük bir follow-up sync gerekebilir; açık görev olmadan Codex bunu yapmamalıdır.
- `dev-server.log` yerel untracked runtime çıktısıdır; stage, commit veya delete edilmemelidir.
- Reusable safety skeleton + task-specific customization kontrollü deneme olarak sürer; scope drift veya kontrol kaybında daha katı manuel prompt stiline dönülür.
- `Reporting Area V2: Aday Pipeline Görselleştirme` deferred roadmap olarak kalır ve bu checkpoint aktif scope açmaz.

## Recommended Next Action

Immediate yeni kod dilimi başlatılmamalıdır. Sonraki ana görev `new-chat handoff / çalışma disiplini testi` olmalıdır.

Yeni chat başlangıçta şunları doğrulamalıdır:

1. Latest HEAD/origin
2. Active branch
3. Working tree ve `dev-server.log` ayrımı
4. Repo docs ile Google Drive / Obsidian strategy vault sync seviyesi
5. Discovery / implementation / docs-only scope disiplini

Bu kontrol tamamlandıktan sonra yeni ürün dilimi ayrıca seçilmelidir.
