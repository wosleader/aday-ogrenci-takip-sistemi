# CURRENT_BACKLOG — Authoritative Current Work Selection

> **AUTHORITATIVE CURRENT-STATE FILE**
>
> Bu dosya "şu anda sırada ne var?" sorusu için tek güncel backlog kaynağıdır.
> Eski sprint planları, historical `Current` başlıkları, `Next Gate`, `Deferred`,
> `NOT STARTED` veya numaralı roadmap satırları bu dosyada açıkça `ACTIVE`
> yapılmadıkça yeni işi başlatmaz.

## Active Work

`NONE`

Şu anda otomatik olarak aktif edilmiş bir sprint, feature, remediation veya deployment gate'i yoktur.

## Current Backlog / Inactive Candidates

### Smart Operational Helpers

- Status: `NOT IMPLEMENTED`
- State: `BACKLOG / NOT ACTIVE`
- Smart Operational Helpers ürün alanı uygulanmış kabul edilmeyecektir.
- Historical dokümanlarda bununla çelişen `implemented`, `production complete`,
  `fully closed` veya benzeri Smart Operational Helpers / helper-slice kayıtları
  güncel ürün durumu değildir.
- Activation: yalnız kullanıcının açık seçimiyle yeni discovery / Product Decision başlatılabilir.

### WhatsApp Outbound Reconnection

- Status: `HOLD`
- State: `INACTIVE`
- Mevcut manuel draft / copy akışı korunur.
- İkinci bir kullanıcı talimatına kadar outbound reconnection discovery,
  Product Decision, implementation veya yeniden etkinleştirme çalışması başlatılmaz.
- Historical "next candidate" veya "reconnection" notları bu HOLD durumunu aşamaz.

### Phone Card Stage 2

- Status: `SEPARATE BACKLOG`
- State: `NOT ACTIVE`
- Product Decision onaylı değildir; implementation başlatılmış sayılmaz.
- Bu kayıt Phone Card Stage 1'i yeniden açmaz.

## Known Non-Blocking Technical Debt / Coverage Notes

Bunlar otomatik olarak aktif iş değildir:

- `OperationalAlertHost` React console warning.
- Hidden copy-control `aria-hidden` / focused accessibility warning.
- Bazı mobil durumlarda reminder overlay'in satır tıklamasını intercept edebilmesi.
- Bilinen Vite chunk-size warning / olası code-splitting incelemesi.
- Reports `.daily-call-table-wrap` için targeted browser coverage eksikliği; bu doğrulanmış bug değildir.

## Last Fully Closed Workstream

`Reports Narrow-Width / Mobile Padding`

- Final repository state-flip: `8cd8b47545d6d7c3dddc1a4f41992cb795c89f9c`
- Remaining closure gate: `NONE`
- Production redeploy: `NOT REQUIRED`
- Second vault sync: `NOT REQUIRED`

## Activation Rule

Yeni bir iş yalnızca kullanıcı açıkça seçtiğinde `ACTIVE` olur.

Aşağıdakiler tek başına aktivasyon sayılmaz:

- eski sprint numarası,
- historical roadmap sırası,
- eski `Current` başlığı,
- eski `Next Gate`,
- eski `Deferred` listesi,
- eski `NOT STARTED`,
- eski `candidate` / `next candidate` ifadesi.

Çelişki halinde current work selection için bu dosya üstündür.
Historical dosyalar kanıt / geçmiş olarak korunur; sessizce güncel iş emrine çevrilmez.
