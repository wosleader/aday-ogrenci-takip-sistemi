# Pilot Readiness Checklist

## 1. Amac

Bu dokuman, Aday Ogrenci Takip Sistemi pilot kullanimi oncesinde uygulanacak son manuel kontrol listesidir.

Bu dokuman yeni ozellik gelistirme dokumani degildir. Hedef; veri kaybi, import/export/backup/restore ve arama akisi risklerini pilot oncesi yakalamaktir.

## 2. Test ortami hazirligi

- Branch: `sprint-8-pilot-readiness`
- Commit: `7adead6 docs: add sprint 7 checkpoint`
- Test temiz tarayici profili veya temiz IndexedDB uzerinde yapilmali.
- Gercek veya gercekci Excel dosyasi kullanilmali.
- Test oncesi sistemde onemli veri varsa mutlaka `Tam Sistem Yedegi Al` ile yedek alinmali.
- Test boyunca bulunan sorunlar su sekilde siniflandirilacak:
  - Bloklayici
  - Pilot sirasinda izlenir
  - Pilot sonrasi yapilir

## 3. A. Temiz baslangic testi

- [ ] Uygulama aciliyor mu?
- [ ] Bos aday listesi duzgun gorunuyor mu?
- [ ] Ust bar/global arama hata vermiyor mu?
- [ ] Ayarlar sekmeleri aciliyor mu?
- [ ] Varsayilan kisayollar geliyor mu?

## 4. B. Excel import testi

- [ ] Dogru Excel dosyasi secilebiliyor mu?
- [ ] Baslik satiri algilaniyor mu?
- [ ] Kolon eslestirme calisiyor mu?
- [ ] Yazim hatali kolon algilaniyor mu?
- [ ] Eksik kolon uyarisi gorunuyor mu?
- [ ] Duplicate import modali gorunuyor mu?
- [ ] Import sonrasi aday listesi doluyor mu?
- [ ] Import log kontrol edilebiliyor mu?

## 5. C. Aday listesi testi

- [ ] `/students` ekraninda ust arama sadece listeyi filtreliyor mu?
- [ ] `/students` ekraninda global dropdown acilmiyor mu?
- [ ] Global arama diger sayfalarda calisiyor mu?
- [ ] Filtreler calisiyor mu?
- [ ] 100 kayit/sayfa korunuyor mu?
- [ ] Sag drawer acilip kapanabiliyor mu?
- [ ] Sol menu acilip kapanabiliyor mu?
- [ ] Telefon 1/2, `✓`, `x` ve durum badge kontrolleri dogru mu?

## 6. D. Gorusme kaydetme testi

- [ ] Telefon secimi zorunlulugu dogru calisiyor mu?
- [ ] Gorusuldu sonucu kaydedilebiliyor mu?
- [ ] Ulasilamadi sonucu kaydedilebiliyor mu?
- [ ] Tekrar aranacak sonucu kaydedilebiliyor mu?
- [ ] Randevu sonucu kaydedilebiliyor mu?
- [ ] Yanlis numara sonucu kaydedilebiliyor mu?
- [ ] Kayit oldu sonucu kaydedilebiliyor mu?
- [ ] Aranmayacak / ilgilenmiyor sonucu kaydedilebiliyor mu?
- [ ] Randevu gecmis tarih 3 basis uyarisi calisiyor mu?
- [ ] Randevu aciklamasiz 2 basis davranisi calisiyor mu?
- [ ] `do_not_call` aciklamasiz otomatik not yaziyor mu?
- [ ] Kaydet ve sonrakine gec calisiyor mu?
- [ ] Iletisim gecmisi dogru gorunuyor mu?

## 7. E. Reminder testi

- [ ] Tekrar arama olusturuluyor mu?
- [ ] Reminder guncelleniyor mu?
- [ ] Popup gorunuyor mu?
- [ ] Ses ayari calisiyor mu?
- [ ] Popup acik/kapali ayari calisiyor mu?
- [ ] Bu Bildirimi Kapat calisiyor mu?
- [ ] Sonraki Bildirimleri Kapat calisiyor mu?
- [ ] Can paneli aciliyor mu?
- [ ] Can panelinden aday aciliyor mu?
- [ ] Tek `x` ile bildirim kaldirilabiliyor mu?
- [ ] Hepsini temizle calisiyor mu?
- [ ] 3 gun / 20 kayit / 10 gorunur siniri korunuyor mu?

## 8. F. Kisayol testi

- [ ] Varsayilan kisayollar calisiyor mu?
- [ ] Kisayol degistirme calisiyor mu?
- [ ] Cakisma uyarisi gorunuyor mu?
- [ ] 3 tusu yasagi calisiyor mu?
- [ ] Shift/Ctrl/Alt/CapsLock/Tab yasagi calisiyor mu?
- [ ] Textarea icinde harf/sayi kisayollari calismiyor mu?
- [ ] Ctrl+S calisiyor mu?
- [ ] Escape calisiyor mu?
- [ ] Alt kisayol bari aktif kisayollari gosteriyor mu?

## 9. G. Export testi

- [ ] Detayli Excel Export calisiyor mu?
- [ ] Ozet Gorusme Raporu calisiyor mu?
- [ ] Tum adaylar export edilebiliyor mu?
- [ ] Filtrelenmis liste export edilebiliyor mu?
- [ ] Dosya adlari dogru mu?
- [ ] Dinamik Arama N kolonlari dogru mu?
- [ ] Dinamik Aciklama N kolonlari dogru mu?
- [ ] Bos notlar kolon sisirmiyor mu?
- [ ] Genel Aciklama ayrimi korunuyor mu?
- [ ] Excel dosyalari Excel'de acilabiliyor mu?

## 10. H. Backup / Restore testi

- [ ] Tam Sistem Yedegi Al calisiyor mu?
- [ ] Dosya adi dogru mu?
- [ ] Yanlis JSON restore denemesi reddediliyor mu?
- [ ] Excel export dosyasini restore denemesi reddediliyor mu?
- [ ] Dogru yedek analiz ozeti gorunuyor mu?
- [ ] `GERI YUKLE` yazmadan restore baslamiyor mu?
- [ ] Restore sonrasi aday listesi dogru mu?
- [ ] Restore sonrasi ayarlar/kisayollar dogru mu?
- [ ] Restore sonrasi `call_logs`/reminders dogru mu?
- [ ] Tum aday temizleme sonrasi restore ile veri geri geliyor mu?

## 11. I. Veri yonetimi testi

- [ ] Tum aday verilerini temizle calisiyor mu?
- [ ] Temizleme uyarilari gorunuyor mu?
- [ ] Temizleme sonrasi liste bos mu?
- [ ] Yedekten geri yukleme ile veri geri geliyor mu?

## 12. J. Mobil/dar ekran temel testi

- [ ] Sol menu kullanilabilir mi?
- [ ] Sag drawer kullanilabilir mi?
- [ ] Global arama kullanilabilir mi?
- [ ] Ayarlar sekmeleri kullanilabilir mi?
- [ ] Export ekrani kullanilabilir mi?
- [ ] Reminder popup kullanilabilir mi?

## 13. Kritik riskler

| Risk | Etki | Test yontemi | Sonuc / Not |
| --- | --- | --- | --- |
| Veri kaybi riski | Import, temizleme veya restore sirasinda geri donusu zor veri kaybi olusabilir. | Import -> gorusme -> reminder -> backup -> temizle -> restore dongusu uygulanir. | |
| Restore riski | Yanlis/bozuk dosya veya eksik yedek veriyi bozabilir. | Yanlis JSON, Excel export dosyasi ve dogru Tam Sistem Yedegi ile restore denenir. | |
| Import yanlis eslestirme riski | Aday, veli veya telefonlar yanlis alanlara aktarilabilir. | Gercek Excel dosyasinda kolon eslestirme ve onizleme satirlari kontrol edilir. | |
| Duplicate kayit riski | Ayni dosya tekrar import edilirse adaylar ikiye katlanabilir. | Ayni Excel dosyasi ikinci kez import edilmeye calisilir ve duplicate modal kontrol edilir. | |
| Arama personeli UX riski | Telefon secimi, validasyon veya kisayollar arama hizini dusurebilir. | En az 20 adaylik gercekci arama simulasyonu yapilir. | |
| Export yanlis anlama riski | Excel export dosyasi Tam Sistem Yedegi sanilabilir. | Export ekrani bilgilendirme metni ve dosya icerigi kontrol edilir. | |
| Performans riski | 1000+ adayda liste, arama veya export yavaslayabilir. | Buyuk veri setiyle liste, global arama ve export denenir. | |
| Mobil/dar ekran riski | Drawer, tablo veya popup dar ekranda kullanilamaz hale gelebilir. | Dar ekran veya mobil viewport smoke test uygulanir. | |

## 14. Pilot oncesi karar tablosu

| Kategori | Sorun / Not | Karar | Sorumlu | Durum |
| --- | --- | --- | --- | --- |
| Bloklayici: pilot oncesi cozulmeli | | | | |
| Pilot sirasinda izlenir | | | | |
| Pilot sonrasi yapilir | | | | |

## 15. Pilot baslangic kriteri

Pilot baslatmak icin:

- [ ] Import -> gorusme kaydet -> reminder -> export -> backup -> temizle -> restore dongusu en az 1 kez basarili olmali.
- [ ] Yanlis restore dosyalari guvenli reddedilmeli.
- [ ] Export dosyalari Excel'de acilmali.
- [ ] Backup dosyasi geri yuklenebilir olmali.
- [ ] Kritik veri kaybi riski kalmamali.

## 16. Sonraki adim

Bu checklist uygulandiktan sonra bulunan sorunlar siniflandirilacak.

Bloklayici yoksa pilot kullanim baslayabilir.

Bloklayici varsa kucuk bir `Pilot Fix` sprinti acilacak.
