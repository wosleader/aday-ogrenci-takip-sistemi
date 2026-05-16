# Aday Ogrenci Takip Sistemi - Sprint 6.1 Checkpoint

## 1. Proje Adi

Aday Ogrenci Takip Sistemi

## 2. Repo / Branch / Commit Bilgisi

- Repo URL: https://github.com/wosleader/aday-ogrenci-takip-sistemi
- Aktif branch: sprint-6-1-shortcut-settings
- Son commit: a01e98d fix: disable global search dropdown on student list
- Tarih/saat: 2026-05-16 12:28:43 +03:00

## 3. Sprint 6.1 Ozeti

Sprint 6.1'de klavye kisayollari, ust bar, global aday aramasi, reminder bildirim paneli ve kucuk navigasyon/UX polish isleri tamamlandi.

## 4. Sprint 6.1'de Yapilan Ana Isler

### Klavye Kisayollari

- Kisayollar Turkcelestirildi.
- ArrowUp yerine "Yukari Tusu" gosteriliyor.
- ArrowDown yerine "Asagi Tusu" gosteriliyor.
- Escape "Kapat / vazgec" olarak gosteriliyor.
- Ayarlar > Klavye Kisayollari sekmesinde kisayollar degistirilebilir hale geldi.
- Kisayol degisiklikleri kalici olarak saklaniyor.
- Cakisan kisayollar engelleniyor.
- 3 tusu kritik islem kisayolu olarak engelleniyor.
- Shift / Ctrl / Alt / CapsLock / Tab tek basina atanamiyor.
- Varsayilana dondurme calisiyor.
- Alt kisayol bari aktif kisayollari gosteriyor.
- Ust arama placeholder'i aktif arama kisayolunu gosteriyor.

### Ayarlar Ekrani

- Ayarlar ekrani sekmelere ayrildi:
  - Genel
  - Klavye Kisayollari
  - Hatirlatmalar
  - Veri Yonetimi
- Klavye Kisayollari bolumu kompakt/minimal hale getirildi.
- Kisayol yardim metinleri sadelestirildi.

### Reminder / Bildirim Paneli

- Reminder popup kapatma davranisi kalici hale getirildi.
- "Bu Bildirimi Kapat" ayni reminder'i ayni tarih/saat icin tekrar gostermiyor.
- "Sonraki Bildirimleri Kapat" o anda due/overdue olan bildirimleri tekrar popup olarak gostermiyor.
- Reminder tarih/saat degisirse yeniden gosterilebilir.
- Kapatilan reminder icin sag ust can ikonunda uyari izi olusuyor.
- Can paneli kapatilmis reminder bilgilerini gosteriyor.
- Her bildirim kartinda tekil kaldirma x'i var.
- Panelde "Hepsini temizle" var.
- Bildirim gecmisi:
  - en fazla 3 gun
  - en fazla 20 kayit saklama
  - panelde en fazla 10 kayit gosterme
  sinirlariyla calisiyor.
- Aday adina tiklayinca /students ekranina gidip ilgili aday drawer aciliyor.
- Cana tiklamak reminder'i completed yapmiyor.

### Ust Bar / Navigasyon

- Sol menude "Arama Ekrani" gizlendi.
- Ust bardaki tekrar eden Excel Ice Aktar / Disa Aktar butonlari kaldirildi.
- Bu islemler sol menu uzerinden yapilmaya devam ediyor.
- Ust bar daha sade hale geldi:
  - global aday aramasi
  - baglanti durumu gostergesi
  - bildirim cani
  - kullanici rozeti

### Global Aday Aramasi

- Ust arama kutusu tum uygulamada global aday aramasi olarak calisiyor.
- Aday Listesi disindaki sayfalarda 2+ karakterde dropdown aciliyor.
- Dropdown en fazla 8 sonuc gosteriyor.
- Sonuc satiri kompakt:
  - ogrenci adi
  - veli adi
  - telefon 1 / telefon 2
- Aciklama/not dropdown'da gosterilmiyor.
- Sonuca tiklayinca /students ekrani aciliyor ve ilgili aday sag drawer'da aciliyor.
- "Daha fazla gor" /students ekranina gidip arama sorgusunu liste filtresine tasiyor.
- /students ekranindeyken global dropdown acilmiyor; ust arama sadece aday listesini filtreliyor.

### Baglanti Durumu Gostergesi

- Yazili "Cevrimdisi" gostergesi kaldirildi.
- Yerine ikonlu baglanti durumu gostergesi geldi.
- Internet var durumu yesil.
- Internet yok durumu amber/kehribar.
- Internet yok icin kirmizi/gri kullanilmiyor.
- Tooltip kullanici dostu:
  - Internet var: "Internet var. Program kullanilabilir."
  - Internet yok: "Internet yok. Program yine calisir. Kayitlar bu bilgisayarda saklanir."
- Merkez/bulut/senkron ifadeleri su asamada kullaniciya gosterilmiyor.

### Sag Kisi Karti

- Eski "Arama ekrani Sprint 5" butonu kaldirildi.
- "Adayi sil" ana gorunur buton olmaktan cikarildi.
- Aday silme uc nokta menusune tasindi.
- Tek aday silme sade Iptal / Sil onay modaliyla yapiliyor.
- Silme transaction guvenligi korunuyor.

## 5. Test/Build Durumu

- Son turda testler gecti:
  - 28 test dosyasi
  - 134 test
- Build gecti.
- Vite chunk size uyarisi var ama build basarisiz degil.

## 6. Onemli Urun Kararlari

- Arama operasyonu Aday Listesi + sag kisi karti uzerinden yurur.
- Ayri Arama Ekrani menusu simdilik kullanilmayacak.
- Ust arama kutusu global aday bulma alanidir.
- /students ekraninda dropdown acilmaz; liste filtreleme calisir.
- Ice/disa aktarma ust barda degil, sol menude yer alir.
- Tek aday silme gunluk akista gorunur ana buton olarak durmaz.
- Toplu silme/secim modu yol haritasindadir ama henuz yapilmamistir.
- Figma/Stitch UI fikirleri kontrollu uygulanacaktir; bu sprintte uygulanmamistir.
- Akilli Yardimcilar yol haritasina eklendi ama henuz uygulanmadi.
- Akilli Yardimcilar ileride Ayarlar altinda ayri sekme olarak gelecek, offline/kural tabanli calisacak, dis AI API kullanilmayacak.

## 7. Yol Haritasi

Siradaki onerilen sira:

1. Sprint 6.2 - Ozet Gorusme Raporu
2. Tam Sistem Yedegi / Geri Yukleme saglamlastirma
3. Son test / pilot
4. Akilli Yardimcilar
5. Toplu silme / secim modu
6. Figma/Stitch operasyon listesi sadelestirme

## 8. Sprint 6.2 Hedefi

Ozet Gorusme Raporu:

- Detayli Excel Export'a ek olarak sade rapor tipi
- Export secenegi adi:
  Ozet Gorusme Raporu (Fazla Detay Icermez)
- Kampanya yok
- Tekrar Arama Tarihi yok
- Daha az sutun, daha okunabilir gorusme notlari
- Kolonlar:
  - Sira No
  - Ogrenci Ad Soyad
  - Veli Ad Soyad
  - Telefon 1
  - Telefon 1 Durumu
  - Telefon 2
  - Telefon 2 Durumu
  - Sinif
  - Genel Aciklama
  - Aciklama 1
  - Aciklama 1 Tarihi
  - Aciklama 2
  - Aciklama 2 Tarihi
  - Aciklama 3
  - Aciklama 3 Tarihi
  - ...
  - Son Arama Sonucu
  - Son Gorusme Tarihi
  - Son Guncellenme Tarihi

## 9. Yeni Oturumda Devam Notu

Sprint 6.2'ye baslamadan once bu checkpoint dosyasi okunmali.
Once plan cikarilmali, onay alinmadan kod yazilmamali.
