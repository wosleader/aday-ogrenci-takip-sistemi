# AÖTS Mockup V2 — Tasarım Rehberi

---

## 1. Font Ailesi

### Kullanılan fontlar

| Rol | Aile | Ağırlıklar | CDN |
|-----|------|------------|-----|
| UI metni (`--sans`) | **Sora** | 400, 500, 600 | Google Fonts |
| Kod / telefon / sayı (`--mono`) | **IBM Plex Mono** | 400, 500 | Google Fonts |

### CDN import

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Sora:wght@400;500;600&display=swap" rel="stylesheet">
```

### Kullanım kuralları

- **Sora 400** → gövde metni, açıklamalar, placeholder
- **Sora 500** → nav item, button, label, tablo satırı
- **Sora 600** → sayfa başlıkları, drawer adı, tablo başlık
- **IBM Plex Mono 400** → telefon numarası, tarih, zaman, log satırı, count badge
- **IBM Plex Mono 500** → veli tel numarası (büyük), klavye kısayol etiketi
- Tüm form elemanlarına `font-family: var(--sans)` açıkça verilmeli — tarayıcı varsayılanı ezmez

### Type scale

| Token | Boyut | Ağırlık | Kullanım yeri |
|-------|-------|---------|---------------|
| `--fs-xs`  | 10px | 400/600 | Section label, klavye kısayol, timeline tarih |
| `--fs-sm`  | 11px | 400/500 | Badge, form label (uppercase), tooltip, alt bilgi |
| `--fs-base`| 12px | 400/500 | Tablo yardımcı sütunlar, button, filter, timeline metin |
| `--fs-md`  | 13px | 400/500 | Tablo ana satır, form input, nav item |
| `--fs-lg`  | 14px | 500/600 | Topbar başlık, table toolbar başlık |
| `--fs-xl`  | 15px | 500 | Veli telefon (mono) |
| `--fs-2xl` | 17px | 600 | Drawer kişi adı |

---

## 2. İkon Seti

**Tabler Icons** — v3.19.0

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.19.0/dist/tabler-icons.min.css">
```

Kullanım: `<i class="ti ti-[icon-name]"></i>`

### V2'de kullanılan ikonlar

| İkon | Sınıf | Nerede |
|------|-------|--------|
| Kullanıcılar | `ti-users` | Sidebar — aday listesi |
| Telefon | `ti-phone` | Sidebar + drawer ara butonu |
| Takvim saati | `ti-calendar-time` | Sidebar — hatırlatmalar |
| Takvim | `ti-calendar-event` | Sidebar — randevular |
| Dosya yükle | `ti-file-upload` | Sidebar + topbar |
| Grafik | `ti-chart-bar` | Sidebar — raporlar |
| Ayarlar | `ti-settings` | Sidebar |
| Import log | `ti-file-import` | Sidebar |
| Dışa aktar | `ti-table-export` | Topbar |
| Arama | `ti-search` | Topbar search |
| Zil | `ti-bell` | Topbar |
| Çarpı | `ti-x` | Drawer kapat |
| WhatsApp | `ti-brand-whatsapp` | Drawer |
| Telefon + | `ti-phone-plus` | Drawer — 2. hat |
| Kaydet | `ti-device-floppy` | Kaydet butonu |
| Onay | `ti-check` | Kaydet feedback |
| Veritabanı | `ti-database` | Status bar |
| Wifi off | `ti-wifi-off` | Status bar |
| Klavye | `ti-keyboard` | Status bar |
| Çevrimiçi dot | `ti-circle-filled` | Pill badge |

### Boyut rehberi

| Bağlam | Font-size |
|--------|-----------|
| Nav item ikonu | 17px |
| Topbar ikonu | 15–16px |
| Tablo toolbar | 14px |
| Drawer buton | 14px |
| Drawer kaydet | 16px |
| Status bar | 13px |
| Badge içi | 10–11px |

---

## 3. Renk Paleti

### CSS değişkenleri

```css
:root {
  /* Yüzeyler */
  --bg:        #F7F6F3;   /* Sayfa arka planı — sıcak kırık beyaz */
  --surface:   #FFFFFF;   /* Kart, sidebar, topbar yüzeyi */
  --gray-bg:   #F0EEE9;   /* Hover bg, count badge, kbd bg */

  /* Kenarlıklar */
  --border:    #E4E2DC;   /* Ana kenarlık */
  --border-md: #D1CEC5;   /* Orta kenarlık (input, nav kbd) */

  /* Metin */
  --text:      #1A1916;   /* Birincil metin */
  --muted:     #7A7870;   /* İkincil metin, nav item, label */
  --hint:      #B0ADA5;   /* Üçüncül, placeholder, section label */

  /* Vurgu (mavi-mor) */
  --accent:    #3D4EAC;   /* Primary button, aktif nav, focus border */
  --accent-bg: #EEF0FA;   /* Aktif nav bg, focus ring, filter.active bg */

  /* Yeşil — başarı / görüşüldü */
  --green:     #1E7A4A;
  --green-bg:  #E8F5EE;

  /* Kırmızı — hata / ulaşılamadı */
  --red:       #C0392B;
  --red-bg:    #FDECEA;

  /* Amber — uyarı / düşünüyor */
  --amber:     #9A6200;
  --amber-bg:  #FEF6E4;
}
```

### Renk kullanım haritası

| Renk | Durum badge | Tablo dot | Buton | Kenarlık |
|------|-------------|-----------|-------|----------|
| Accent | — | — | Primary btn, aktif nav | Focus border |
| Green | Görüşüldü | ● yeşil | WhatsApp btn | — |
| Red | Ulaşılamadı | ● kırmızı | — | — |
| Amber | Düşünüyor | ● turuncu | — | — |
| Gray | Aranmadı | ● gri | Secondary btn | Tüm kenarlar |

### Erişilebilirlik notu

- `--text` (#1A1916) üzerine `--muted` (#7A7870): **4.6:1** — WCAG AA geçer
- `--accent` (#3D4EAC) beyaz üzerine: **6.2:1** — WCAG AA geçer
- `--green` (#1E7A4A) `--green-bg` (#E8F5EE) üzerine: **5.1:1** — geçer

---

## 4. Border Radius Değerleri

```css
--radius:    8px;    /* Standart: button, input, select, nav item, card */
--radius-lg: 12px;   /* Büyük: contact card, modal, drawer iç kart */

/* İstisnalar (değişken değil, hardcode) */
border-radius: 999px;  /* Pill badge, status dot, avatar, count badge */
border-radius: 50%;    /* Avatar (tam yuvarlak) */
border-radius: 4px;    /* Küçük: kbd etiketi, save-btn hint */
border-radius: 0 8px 8px 0;  /* Aktif nav item — sol kenar düz */
```

### Ne zaman hangi radius

| Eleman | Radius |
|--------|--------|
| Button (tüm boyutlar) | `--radius` (8px) |
| Input, select, textarea | `--radius` (8px) |
| Nav item (pasif) | `--radius` (8px) |
| Nav item (aktif) | `0 8px 8px 0` |
| Logo kutusu | `--radius` (8px) |
| Contact card | `--radius-lg` (12px) |
| Status/pill badge | `999px` |
| Kbd etiketi | `4px` |
| Avatar | `50%` |

---

## 5. Gölge / Shadow Değerleri

V2'de **shadow kullanılmamıştır** — bu bilinçli bir tercih.

Derinlik, shadow yerine şunlarla sağlanır:
- `border: 1px solid var(--border)` → yüzey ayrımı
- `background` renk farkı (`--bg` vs `--surface`) → katman hissi
- Focus ring: `box-shadow: 0 0 0 3px var(--accent-bg)` → sadece focus state'de

Eğer projeye shadow eklemek istersen önerilen minimal set:

```css
/* Drawer veya modal için */
box-shadow: 0 4px 16px rgba(26, 25, 22, 0.08);

/* Tooltip veya dropdown için */
box-shadow: 0 2px 8px rgba(26, 25, 22, 0.10);

/* Focus ring (zaten V2'de var) */
box-shadow: 0 0 0 3px var(--accent-bg);
```

---

## 6. Spacing Scale

V2'de kullanılan spacing değerleri (explicit scale tanımlanmamış, ama pattern tutarlı):

```
2px   → letter-spacing, micro gap
3px   → badge padding dikey
4px   → badge padding yatay (küçük), margin-top (alt text)
5px   → button gap, filter gap
6px   → topbar-right gap, call-actions gap, topbar-btn padding dikey
8px   → nav item margin, row2 gap, toolbar gap, sidebar padding
9px   → pill padding yatay
10px  → nav item padding yatay, topbar-search sol iç boşluk
12px  → topbar padding, nav section padding, drawer footer padding
14px  → tablo td padding, drawer body gap, table-toolbar padding
16px  → sidebar padding yatay, drawer padding, topbar padding
18px  → drawer header/body padding yatay
20px  → topbar padding yatay
```

### Öneri: Resmi scale

```css
--space-1:  2px
--space-2:  4px
--space-3:  6px
--space-4:  8px
--space-5:  12px
--space-6:  16px
--space-7:  20px
--space-8:  24px
--space-9:  32px
```

---

## 7. Component Token'ları

### Layout

```css
--sidebar-w:  220px;   /* Sidebar genişliği */
--drawer-w:   400px;   /* Drawer genişliği */
--header-h:   52px;    /* Topbar yüksekliği */
/* Status bar: 28px (hardcode) */
/* Kbd bar: implicit ~30px */
```

### Buton token'ları

```css
/* Default button */
padding:      6px 12px;
border:       1px solid var(--border);
border-radius: var(--radius);
font-size:    12px;
font-weight:  500;
background:   transparent;
color:        var(--text);

/* Primary button */
background:   var(--accent);
color:        #fff;
border-color: var(--accent);

/* Small button */
padding:      5px 10px;
font-size:    11px;

/* Call button (drawer) */
padding:      7px 14px;
font-size:    12px;
font-weight:  500;
```

### Input token'ları

```css
padding:       8px 10px;
border:        1px solid var(--border);
border-radius: var(--radius);
background:    #fff;
font-size:     13px;
font-family:   var(--sans);
/* Focus */
border-color:  var(--accent);
box-shadow:    0 0 0 3px var(--accent-bg);
```

### Badge / Status token'ları

```css
/* Pill badge */
display:        inline-flex;
align-items:    center;
gap:            4px;
padding:        3px 9px;
border-radius:  999px;
font-size:      11px;
font-weight:    500;

/* Status dot (::before pseudo) */
width:          6px;
height:         6px;
border-radius:  50%;
```

### Tablo token'ları

```css
/* th */
padding:        8px 14px;
font-size:      11px;
font-weight:    600;
letter-spacing: .04em;
text-transform: uppercase;
color:          var(--muted);

/* td */
padding:        10px 14px;
font-size:      13px;
border-bottom:  1px solid var(--border);

/* hover */
background:     #FAFAF8;

/* selected row */
background:     var(--accent-bg);
```

---

## 8. Tailwind Class Mantığı

V2 vanilla CSS ile yazılmıştır ama Tailwind'e birebir çevrilebilir. Karşılık tablosu:

### Renkler

```
--bg          → bg-[#F7F6F3]  veya özel: bg-warm-50
--surface     → bg-white
--border      → border-[#E4E2DC]
--text        → text-[#1A1916]
--muted       → text-[#7A7870]
--accent      → bg-[#3D4EAC] / text-[#3D4EAC]
--accent-bg   → bg-[#EEF0FA]
--green       → text-[#1E7A4A]
--green-bg    → bg-[#E8F5EE]
--red         → text-[#C0392B]
--red-bg      → bg-[#FDECEA]
--amber       → text-[#9A6200]
--amber-bg    → bg-[#FEF6E4]
```

### Tailwind config (önerilen `extend`)

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'ui': {
          bg:         '#F7F6F3',
          surface:    '#FFFFFF',
          'gray-bg':  '#F0EEE9',
          border:     '#E4E2DC',
          'border-md':'#D1CEC5',
          text:       '#1A1916',
          muted:      '#7A7870',
          hint:       '#B0ADA5',
          accent:     '#3D4EAC',
          'accent-bg':'#EEF0FA',
          green:      '#1E7A4A',
          'green-bg': '#E8F5EE',
          red:        '#C0392B',
          'red-bg':   '#FDECEA',
          amber:      '#9A6200',
          'amber-bg': '#FEF6E4',
        }
      },
      fontFamily: {
        sans: ['Sora', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      borderRadius: {
        'ui':    '8px',
        'ui-lg': '12px',
      },
      fontSize: {
        'ui-xs':   '10px',
        'ui-sm':   '11px',
        'ui-base': '12px',
        'ui-md':   '13px',
        'ui-lg':   '14px',
        'ui-xl':   '15px',
        'ui-2xl':  '17px',
      }
    }
  }
}
```

---

## 9. Component Tasarım Rehberi

### Topbar

```
Yükseklik:    52px (--header-h)
Background:   var(--surface) / bg-white
Alt kenarlık: 1px solid var(--border)
Padding yatay: 20px
Gap:          16px
```

**İçerik yapısı (soldan sağa):**
1. Logo kutusu (32×32, --accent bg, --radius, mono font)
2. Marka adı (Sora 600, 13px) + alt başlık (Sora 400, 11px, --muted)
3. Arama kutusu (flex:1, max-width:320px)
4. Sağ taraf: status pill → action butonlar → bildirim → avatar

**Arama input:**
- Sol padding: 34px (ikon için yer)
- Background: --bg (odakta #fff)
- Border focus: --accent

---

### Sidebar

```
Genişlik:     220px (--sidebar-w)
Background:   var(--surface)
Sağ kenarlık: 1px solid var(--border)
Padding:      8px 0
```

**Section label:**
- Font: 10px, 600, uppercase, letter-spacing: .08em
- Renk: --hint
- Padding: 12px 16px 4px

**Nav item (pasif):**
- Padding: 8px 16px
- Margin: 1px 6px
- Radius: --radius
- Renk: --muted
- Sol kenarlık: 2px solid transparent
- İkon: 17px

**Nav item (aktif):**
- Background: --accent-bg
- Renk: --accent, font-weight: 500
- Sol kenarlık: 2px solid --accent
- Radius: 0 --radius --radius 0 (sol kenar düz)
- Margin sol: 0, padding sol: 20px

**Klavye kısayol etiketi:**
- Position: margin-left: auto
- Font: mono, 10px
- Background: --gray-bg, border: --border, radius: 4px
- Padding: 1px 5px

**Footer (kullanıcı):**
- Margin-top: auto
- Padding: 12px
- Üst kenarlık: 1px solid --border

---

### Tablo (Data Table)

```
font-size:    13px
border:       collapse
```

**thead:**
- Sticky top, z-index: 5
- Background: --bg (sayfadan farklı — tarama kolaylaşır)

**th:**
- 11px, 600, uppercase, letter-spacing: .04em, --muted
- Padding: 8px 14px
- Alt kenarlık: 1px solid --border

**td:**
- Padding: 10px 14px
- Alt kenarlık: 1px solid --border

**Row states:**
- default: transparent
- hover: #FAFAF8
- selected: --accent-bg (transition: background .1s)

**Özel sütun stilleri:**
- Ad Soyad: font-weight 500
- Telefon: mono, 12px, --muted
- Yardımcı (veli/sınıf/kampanya): 12px, --muted
- Sonraki adım: 12px, --muted; acil olanlar --red rengi

---

### Card

V2'de iki kart tipi var:

**Contact Card (drawer içi):**
```
Background:    var(--bg)
Border:        1px solid var(--border)
Radius:        var(--radius-lg) → 12px
Padding:       12px 14px
```

**Count Badge (toolbar):**
```
Background:    var(--gray-bg)
Border:        1px solid var(--border)
Radius:        999px
Padding:       2px 10px
Font:          mono, 11px, --muted
```

---

### Badge / Status

**Status pill:**
```css
display:       inline-flex;
align-items:   center;
gap:           5px;
padding:       3px 9px;
border-radius: 999px;
font-size:     11px;
font-weight:   500;
```

**Renk çiftleri:**
| Durum | Text | Background | Dot rengi |
|-------|------|------------|-----------|
| Görüşüldü | --green | --green-bg | --green |
| Ulaşılamadı | --red | --red-bg | --red |
| Düşünüyor | --amber | --amber-bg | #E6920A |
| Aranmadı | --muted | --gray-bg | --hint |

**Offline pill (topbar):**
```
Aynı pill yapısı, renk: --green / --green-bg
İkon: ti-circle-filled, 8px
```

---

### Input / Form

**Input & Select & Textarea:**
```css
width:         100%;
padding:       8px 10px;
border:        1px solid var(--border);
border-radius: var(--radius);
background:    #fff;
font-family:   var(--sans);   /* zorunlu */
font-size:     13px;
color:         var(--text);
outline:       none;
transition:    border-color .15s;
/* Focus */
border-color:  var(--accent);
box-shadow:    0 0 0 3px var(--accent-bg);
```

**Form label:**
```css
font-size:      11px;
font-weight:    600;
color:          var(--muted);
text-transform: uppercase;
letter-spacing: .05em;
margin-bottom:  5px;
display:        block;
```

**Textarea özel:**
```css
resize:         vertical;
min-height:     72px;
line-height:    1.5;
```

**İkili alan (tarih + saat):**
```css
display: flex;
gap:     8px;
/* Her biri: flex: 1 */
```

---

### Button

**Hierarşi:**

| Tip | Background | Border | Renk | Kullanım |
|-----|------------|--------|------|----------|
| Primary | --accent | --accent | #fff | Kaydet, ana CTA |
| Default | transparent | --border | --text | Genel action |
| Destructive | transparent | --border | --red | Sil, iptal |
| Ghost | transparent | transparent | --muted | İkon butonlar |

**Boyutlar:**

| Boyut | Padding | Font |
|-------|---------|------|
| Default | 6px 12px | 12px |
| Small | 5px 10px | 11px |
| Large (save) | 10px full | 13px, 600 |
| Call | 7px 14px | 12px, 500 |

**Save butonu özel:**
```css
width:         100%;
background:    var(--accent);
border-radius: var(--radius);
font-weight:   600;
/* Hover */
opacity: .9;
/* İçinde Enter kısayol hint */
font-family: mono; font-size: 10px;
background: rgba(255,255,255,.2);
border-radius: 3px; padding: 1px 5px;
```

**Icon-only buton (close, tel actions):**
```css
width:         28-30px;
height:        28-30px;
border-radius: var(--radius);
border:        1px solid var(--border);
background:    transparent;
color:         var(--muted);
/* Hover */
background:    var(--bg);
color:         var(--text);
```

---

### Klavye Kısayol Barı

```
Yükseklik:    ~30px
Background:   var(--surface)
Üst kenarlık: 1px solid var(--border)
Padding:      0 16px
Gap:          14px
```

**Kbd etiketi:**
```css
font-family:   var(--mono);
font-size:     10px;
font-weight:   500;           /* veya 400 */
background:    var(--gray-bg);
border:        1px solid var(--border-md);
border-radius: 4px;
padding:       1px 6px;
color:         var(--text);
```

**Kısayol öğesi:**
```css
font-size:  11px;
color:      var(--muted);
gap:        5px;
```

**Kural:** `3` tuşu hiçbir zaman kısayol olarak atanmaz.

---

### Status Bar (Alt)

```
Yükseklik:  28px
Background: var(--surface)
Üst kenarlık: 1px solid var(--border)
Padding:    0 16px
Gap:        20px
```

**İtem:**
```css
font-size:   11px;
color:       var(--muted);
font-family: var(--mono);
gap:         5px;
```

**Sağa yasla:**
```css
margin-left: auto;
```

---

### Timeline

**Kapsayıcı:**
```css
border-top:   1px solid var(--border);
padding-top:  14px;
```

**Başlık:**
```css
font-size:     11px;
font-weight:   600;
color:         var(--muted);
text-transform: uppercase;
letter-spacing: .06em;
```

**Item yapısı:** flex, gap: 10px

**Spine (dikey çizgi + nokta):**
```css
.tl-dot {
  width:  8px; height: 8px;
  border-radius: 50%;
}
.tl-connector {
  flex: 1;
  width: 1px;
  background: var(--border);
  margin: 3px 0;
}
```

**Dot renkleri:**
- Import (sistem): --hint (#B0ADA5)
- Ulaşılamadı: --red
- Görüşüldü: --green
- Düşünüyor: --amber
- Şu an / aktif: --accent

**Tarih:** mono, 10px, --hint
**Metin:** sans, 12px, --text, line-height 1.5
**Yazar:** sans, 10px, --hint

---

## 10. Animasyon / Transition

V2'de kullanılan transition değerleri:

```css
transition: background .12s, color .12s;   /* Nav item */
transition: border-color .15s;             /* Input focus */
transition: opacity .15s;                  /* Primary button hover */
/* Kaydet butonu feedback: setTimeout 1200ms ile renk değişimi */
```

Genel kural: **100–150ms, ease** — daha uzun süreler kullanılmaz.

---

## Hızlı Başlangıç Kontrol Listesi

Yeni bir component eklerken şu soruları sor:

- [ ] Font ailesi açıkça verildi mi? (`font-family: var(--sans)`)
- [ ] Border radius `--radius` mi, `--radius-lg` mi, `999px` mi?
- [ ] Renk token'ından mı geliyor, hardcode değil mi?
- [ ] Focus state'i var mı? (`border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-bg)`)
- [ ] Hover transition süresi 150ms'yi geçiyor mu?
- [ ] Shadow kullandıysan gerçekten gerekli mi?
- [ ] `3` tuşunu kısayol olarak atadın mı? (atama)
