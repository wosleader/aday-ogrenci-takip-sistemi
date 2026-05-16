# Aday Ogrenci Takip Sistemi - Sprint 7 Checkpoint

## 1. Proje Adi

Aday Ogrenci Takip Sistemi

## 2. Repo / Branch / Commit Bilgisi

- Repo URL: https://github.com/wosleader/aday-ogrenci-takip-sistemi
- Aktif branch: sprint-7-backup-restore-hardening
- Son commit: 3e7bf9b feat: harden full system backup and restore
- Tarih/saat: 2026-05-16 13:28:27 +03:00

## 3. Sprint 7 Ozeti

Sprint 7'de Tam Sistem Yedegi Al ve Sistem Yedeginden Geri Yukle akislari pilot kullanima daha guvenli, anlasilir ve hata toleransli hale getirildi.

## 4. Sprint 7'de Yapilan Ana Isler

### Backup Metadata

- Tam Sistem Yedegi metadata'si guclendirildi:
  - app_name
  - backup_type
  - backup_version
  - app_version
  - app_schema_version
  - created_at
  - counts
- Yedek dosya adi kullanici dostu formata cekildi:
  AOTS_Tam_Sistem_Yedegi_yyyy-MM-dd_HH-mm.json

### Backup Validation / Preview

- Backup parse/validation/preview akisi eklendi.
- Yanlis JSON dosyasi icin kullanici dostu hata uretildi.
- Tam Sistem Yedegi olmayan JSON dosyalari reddediliyor.
- Eksik required tablo varsa restore engelleniyor.
- Required tablo array degilse restore engelleniyor.
- Daha yeni backup_version icin kullanici dostu hata donuyor.
- Restore oncesi ozet uretilebiliyor.

### Restore

- Restore replace mode olarak gercek hale getirildi.
- Merge mode bu sprintte yapilmadi.
- Restore `GERI YUKLE` yazi dogrulamasi olmadan baslamiyor.
- Restore transaction guvenligi korunuyor.
- Restore sonrasi tablo count dogrulamasi eklendi.
- Restore basarisizliginda kullanici dostu hata mesajlari donuyor.
- Mevcut verilerin korunmaya calisildigi mesaj dili eklendi.

### Ayarlar > Veri Yonetimi

- "Sistem Yedeginden Geri Yukle" disabled olmaktan cikarildi.
- Dosya secme, analiz ozeti, guclu uyari ve restore sonucu gosterimi eklendi.
- Ana UI'daki teknik "JSON yedek" dili kaldirildi.
- "Tam Sistem Yedegi" dili korundu.
- "Tum aday verilerini temizle" akisi bozulmadi.

## 5. Dahil Edilen Tablolar

Tam sistem yedegi su tablolari kapsar:

- students
- guardians
- phones
- call_logs
- reminders
- appointments
- campaigns
- imports
- import_logs
- duplicate_checks
- audit_logs
- settings
- keyboard_shortcuts

## 6. Onemli Urun Kararlari

- Excel export raporlama/paylasim amaclidir.
- Eksiksiz geri yukleme icin Excel degil, Tam Sistem Yedegi kullanilmalidir.
- Restore ilk guvenli surumde replace mode olarak calisir.
- Merge mode sonraki surume birakildi.
- Restore riskli islem oldugu icin `GERI YUKLE` yazi dogrulamasi kullanilir.
- Ana UI'da "JSON yedek" gibi teknik ifade gosterilmez.
- Dosya uzantisi .json olabilir ama kullanici dili "Tam Sistem Yedegi" olarak kalir.
- Soft-deleted kayitlarin yedege dahil edilmesi mevcut davranis olarak korundu.

## 7. Test/Build Durumu

- npm.cmd test gecti:
  - 30 test dosyasi
  - 149 test basarili
- npm.cmd run build gecti.
- Vite chunk size uyarisi var ama build basarisiz degil.

## 8. Testlerde Dogrulananlar

- Tam sistem yedegi gerekli tablolari icerir.
- Yedek metadata icerir.
- Yedek dosya adi dogru formatta olusur.
- Gecersiz JSON restore edilmez.
- Excel export benzeri yanlis dosya restore edilmez.
- Eksik required tablo varsa restore edilmez.
- Required tablo array degilse restore edilmez.
- Daha yeni backup_version varsa kullanici dostu hata doner.
- Restore oncesi ozet dogru hesaplanir.
- `GERI YUKLE` yazilmadan restore baslamaz.
- Replace mode mevcut verileri guvenli sekilde degistirir.
- Restore sonrasi kayit sayilari beklenenle eslesir.
- Restore basarisizliginda kullanici dostu hata doner.
- Ayarlar > Veri Yonetimi metinleri "Tam Sistem Yedegi" dilini korur.
- Ana UI'da "JSON yedek" ifadesi gorunmez.
- Mevcut clearCandidateData testleri gecmeye devam eder.

## 9. Sonraki Onerilen Asama

Son test / pilot hazirligi

Hedef:

- Uctan uca manuel test senaryolari
- Import -> arama -> reminder -> export -> backup -> restore dongusu
- Pilot kullanim oncesi kritik hata avi
- Kullanim kitapcigi iskeleti
- Son release notlari

## 10. Daha Sonraki Yol Haritasi

- Akilli Yardimcilar
- Toplu silme / secim modu
- Figma/Stitch operasyon listesi sadelestirme
- Gunluk rapor / mukerrerler ekrani
- VDS/merkez/senkronizasyon

## 11. Kullanim Kitapcigi Notu

Kullanim kitapciginda "Akilli Yardimcilar" bolumu unutulmamali.
Bu bolumde:

- Ayarlar > Akilli Yardimcilar
- genel aktif/pasif secenekleri
- gorusme notundan durum / tekrar arama / randevu onerisi
- offline ve kural tabanli calisma
- dis AI API kullanilmamasi

anlatilacak.

## 12. Yeni Oturumda Devam Notu

Son test / pilot hazirligina baslamadan once bu checkpoint dosyasi okunmali.
Once plan cikarilmali, onay alinmadan kod yazilmamali.
