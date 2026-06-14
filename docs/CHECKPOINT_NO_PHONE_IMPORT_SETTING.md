# No-Phone Candidate Import Setting

Date: 2026-06-14

Branch: `sprint-9-2-multi-phone-architecture-plan`

Closed implementation commit: `71c9072 feat: add no-phone import setting`

Previous checkpoint: `3f850f3 docs: close adaptive summary export checkpoint`

## Why This Slice Exists

Import daha önce öğrenci adı bulunan fakat telefonu olmayan satırları yalnızca uyarıyla okunabilir kabul ediyor ve öğrenci kaydı olarak yazıyordu. Ürün kararı, telefonsuz adayların varsayılan olarak import edilmemesi; gerektiğinde kullanıcının mevcut import işlemi için açıkça izin verebilmesidir.

Bu dilim yalnızca import oturumuna özel bir ayar, simulation policy ve writer güvenlik doğrulaması ekler. Mevcut kayıtları veya import dışındaki ürün alanlarını değiştirmez.

## User-Facing Setting

Label:

`Telefonsuz adayları içe aktar`

Helper text:

`Kapalıyken geçerli telefon numarası bulunmayan satırlar içe aktarılmaz. Anne veya Baba telefonu da telefon olarak kabul edilir. Bu ayar yalnızca mevcut içe aktarma işlemi için geçerlidir.`

Davranış:

- Varsayılan OFF.
- Session-only.
- localStorage/sessionStorage persistence yok.
- Yeni dosya, simülasyon reset, tamamlanan import ve page refresh sonrasında OFF.
- Toggle değişince mevcut worksheet ve current manual mappings ile simülasyon yeniden hesaplanır.
- Import action son toggle durumuyla yeniden simülasyon yapar.

## Policy Behavior

### Setting OFF

- Öğrenci adı ve en az bir valid usable phone bulunan satır import edilir.
- Valid explicit `ANNE TEL` / `BABA TEL` telefonu usable phone sayılır.
- Yalnız valid Telefon 2 veya Telefon 10 gibi alternatif slotu bulunan satır usable phone kabul edilir.
- Hiç telefon girdisi olmayan öğrenci satırı bloklanır ve write listesine girmez.
- Sadece invalid telefon girdisi bulunan satır veri kalitesi hatasıyla bloklanır.

### Setting ON

- Öğrenci adı bulunan gerçek no-phone satırı import edilebilir.
- Öğrenci kaydı oluşturulur, PhoneRecord oluşturulmaz.
- Veli/Anne/Baba bilgileri varsa mevcut guardian kurallarıyla oluşturulabilir.
- Invalid-only telefon satırı yine bloklanır; no-phone izni invalid veriye izin vermez.

### Student Name Safety

- Öğrenci adı her durumda zorunludur.
- Veli, Anne veya Baba adları öğrenci adı oluşturmaz.
- Yalnız parent/guardian bilgileri bulunan satır toggle açıkken de öğrenci oluşturmaz.

## Simulation And Writer Safety

- `ImportSimulationOptions.allowNoPhoneCandidates` seçilen politikayı simülasyona taşır.
- `ImportSimulationSummary.allow_no_phone_candidates` kullanılan politikanın snapshot'ıdır.
- `no_usable_phone_count`, en az bir valid usable phone bulunmayan satırları ayrı sayar.
- Legacy `empty_phone_count` semantiği yeniden tanımlanmamıştır.
- OFF ile bloklanan satır `simulated_rows` içine girmez ve `skipped_rows` içinde sayılır.
- Writer bağımsız bir UI boolean almaz.
- Writer summary policy snapshot'ını ve simulated rows'u backup/write başlamadan önce doğrular.
- OFF policy taşıyan stale/tampered summary içinde no-phone importable row varsa işlem reddedilir.
- Invalid-only importable row içeren güvenli olmayan summary de reddedilir.

## Implementation Files

- `src/features/imports/ImportPage.tsx`
- `src/features/imports/services/importSimulation.ts`
- `src/features/imports/services/importWriter.ts`
- `src/features/imports/services/types.ts`
- `tests/imports/ImportPageProgressiveDisclosure.test.tsx`
- `tests/imports/importDuplicateGuard.test.ts`
- `tests/imports/importNameComposition.test.ts`
- `tests/imports/importSimulation.test.ts`
- `tests/imports/importWriter.test.ts`

## Tests And Validation

- Focused import tests: PASS, 5 files / 83 tests.
- OOM-safe full unit suite: PASS, 45 files / 328 tests.

```powershell
$env:NODE_OPTIONS='--max-old-space-size=4096'
npx.cmd vitest run --exclude e2e/** --maxWorkers=1
```

- Playwright import E2E: PASS, 4/4 tests.
- `npm.cmd run build`: PASS.
- Known Vite chunk-size warning only.
- Localhost import page opened successfully; no console error observed.

## Existing Data Guarantee

- Existing no-phone records are not deleted.
- Existing no-phone records are not hidden.
- No retroactive cleanup or migration runs.
- No student list/right drawer filtering change was added.

## Explicitly Not Implemented

- Schema or Dexie version change.
- New DB table or migration.
- Export behavior change.
- Backup/restore behavior change.
- Student list/right drawer change.
- Retroactive no-phone cleanup.
- `Veli Bilgisi` UI label.
- Package/dependency change.
- New Playwright scenario; existing import E2E matrix was only rerun.

## Context And Workflow Notes

- Repo docs remain the project source of truth.
- Google Drive / Obsidian strategy shadow vault is behind the repo docs, still reflecting the older `e6f580b` era rather than current `71c9072` state.
- Vault sync is overdue but is a separate task. Codex must not perform it without an explicit request.
- Reusable safety skeleton + task-specific customization remains a monitored trial. Revert to stricter manual task prompts if scope drift or control loss appears.
- `Reporting Area V2: Aday Pipeline Görselleştirme` remains deferred roadmap only and is not activated by this checkpoint.
- `dev-server.log` remains local/untracked runtime output and must not be staged, committed, deleted or treated as a project artifact.

## Recommended Next Actions

1. Explicitly requested Google Drive / Obsidian strategy vault sync from the old `e6f580b` context to current repo docs at `71c9072`.
2. After context layers are synchronized, select the next product slice through a separate discovery/decision task.

No new implementation should be inferred from this docs closure.
