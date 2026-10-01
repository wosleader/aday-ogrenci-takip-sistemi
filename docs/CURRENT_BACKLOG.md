# CURRENT_BACKLOG — Authoritative Current Work Selection

> **AUTHORITATIVE CURRENT-STATE FILE**
>
> Bu dosya "şu anda sırada ne var?" sorusu için tek güncel backlog kaynağıdır.
> Eski sprint planları, historical `Current` başlıkları, `Next Gate`, `Deferred`,
> `NOT STARTED` veya numaralı roadmap satırları bu dosyada açıkça `ACTIVE`
> yapılmadıkça yeni işi başlatmaz.

## Active Work

ACTIVE: `Phone Card Stage 2A — Permanent Mobile Copy Control`

- State: `PRODUCT DECISION APPROVED / IMPLEMENTATION NOT STARTED`.
- Activation: explicit kullanıcı onayı yalnız permanent mobile copy control alt dilimi içindir; historical broader Phone Card Stage 2 paketini aktive etmez.
- Checkpoint: `docs/CHECKPOINT_PHONE_CARD_STAGE_2A_PERMANENT_MOBILE_COPY.md`.
- Next Gate: `PRODUCT DECISION DOCS REVIEW -> USER COMMIT/PUSH APPROVAL`.
- Docs checkpoint `PREPARATION ONLY`; commit/push `NOT RUN`; implementation, production ve vault `NOT STARTED`; `FULLY CLOSED: NO`.

## Current Backlog / Inactive Candidates

### Smart Operational Helpers

- Status: `NOT IMPLEMENTED`
- State: `BACKLOG / NOT ACTIVE`
- Roadmap: `NEXT AFTER STAGE 2A FULL CLOSURE`; Stage 2A kapanmadan başlatılmaz, sonraki aktivasyon ayrıca explicit kullanıcı seçimi gerektirir.
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
- Activation: `PARTIALLY ACTIVATED AS STAGE 2A ONLY`.
- Broader Stage 2 remains `NOT ACTIVE`; yalnız permanent mobile copy control alt diliminin Product Decision'ı `USER APPROVED`dur.
- Broader Stage 2 Product Decision onaylı değildir; Stage 2A dahil hiçbir implementation başlatılmış sayılmaz.
- Bu kayıt Phone Card Stage 1'i yeniden açmaz.

## Known Non-Blocking Technical Debt / Coverage Notes

Bunlar otomatik olarak aktif iş değildir:

- `OperationalAlertHost` React console warning.
- Desktop hidden copy-control `aria-hidden` / focused accessibility warning remains separate and unresolved. Stage 2A mobile visibility contract'ı henüz uygulanmadı; generic warning tamamen çözülmüş sayılmaz.
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
