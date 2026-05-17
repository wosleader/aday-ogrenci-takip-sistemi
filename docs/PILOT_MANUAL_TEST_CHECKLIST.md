# Pilot Manuel Test Checklist

## 1. Test Öncesi Hazırlık

- [ ] Doğru branch kontrol edildi.
- [ ] npm.cmd test çalıştırıldı.
- [ ] npm.cmd run build çalıştırıldı.
- [ ] Tarayıcı temiz profil veya temiz IndexedDB ile hazırlandı.
- [ ] Test Excel dosyası hazırlandı.
- [ ] Tam Sistem Yedeği için test klasörü hazırlandı.

## 2. Ana Pilot Döngüsü

- [ ] Temiz IndexedDB ile başlandı.
- [ ] Excel dosyası İçe Aktarma ekranında seçildi.
- [ ] Kolon eşleştirmeleri kontrol edildi.
- [ ] Simülasyon / ön kontrol sonucu incelendi.
- [ ] Hatalı/eksik kolon uyarıları kontrol edildi.
- [ ] Duplicate/mükerrer uyarıları kontrol edildi.
- [ ] İçe aktarma tamamlandı.
- [ ] Aday Listesi’nde kayıtlar göründü.
- [ ] Sınıf / Şube filtresi denendi.
- [ ] Durum Filtresi denendi.
- [ ] Arama kutusu denendi.
- [ ] Bir aday açıldı.
- [ ] Görüşme sonucu kaydedildi.
- [ ] Görüşme notu kaydedildi.
- [ ] Tekrar arama tarihi verildi.
- [ ] Kaydet ve Sonrakine Geç denendi.
- [ ] Hatırlatma popup/çan paneli kontrol edildi.
- [ ] Hatırlatmalar sayfası kontrol edildi.
- [ ] Raporlar sayfası kontrol edildi.
- [ ] Detaylı Excel Export alındı.
- [ ] Özet Görüşme Raporu alındı.
- [ ] Tam Sistem Yedeği alındı.
- [ ] Tüm adayları temizleme veya test ortamı sıfırlama denendi.
- [ ] Tam Sistem Yedeği ile geri yükleme denendi.
- [ ] Geri yükleme sonrası aday listesi, hatırlatmalar ve raporlar kontrol edildi.

## 3. Import / İçe Aktarma Kontrolü

- [ ] Doğru Excel dosyası okunuyor.
- [ ] İlk sekme ana veri olarak kullanılıyor.
- [ ] Gereksiz ikinci sekme dikkate alınmıyor.
- [ ] Kolon eşleştirme anlaşılır.
- [ ] Yazım hatalı kolonlar anlaşılır şekilde eşleşiyor veya uyarılıyor.
- [ ] Sınıf / Şube normalize davranışı kontrol edildi.
- [ ] Telefon 1 / Telefon 2 alanları doğru geliyor.
- [ ] Eksik telefon normal kabul ediliyor.
- [ ] Mükerrer telefon uyarısı kontrol edildi.
- [ ] Import log kullanıcıya anlaşılır.

## 4. Aday Listesi Kontrolü

- [ ] Liste hızlı açılıyor.
- [ ] Arama kutusu filtreliyor.
- [ ] Global dropdown Aday Listesi’nde açılmıyor.
- [ ] Kampanya filtresi çalışıyor.
- [ ] Sınıf / Şube filtresi çalışıyor.
- [ ] Durum Filtresi çalışıyor.
- [ ] Açıklama / Not kolonu anlaşılır.
- [ ] Telefon kolonları okunabilir.
- [ ] Alt kısayol yardım barı kompakt görünüyor.
- [ ] Göster/Gizle çalışıyor.
- [ ] Sağ kişi kartı açılıyor.

## 5. Görüşme Akışı Kontrolü

- [ ] Görüşüldü sonucu kaydediliyor.
- [ ] Ulaşılamadı sonucu kaydediliyor.
- [ ] Tekrar aranacak sonucu kaydediliyor.
- [ ] Randevu sonucu kaydediliyor.
- [ ] Kayıt oldu sonucu kaydediliyor.
- [ ] Aranmayacak / ilgilenmiyor sonucu kaydediliyor.
- [ ] Yanlış numara sonucu kaydediliyor.
- [ ] Genel açıklama ve görüşme notu ayrımı korunuyor.
- [ ] Görüşme geçmişi kronolojik görünüyor.
- [ ] Kaydet ve Sonrakine Geç çalışıyor.

## 6. Hatırlatmalar Kontrolü

- [ ] Tekrar arama hatırlatması oluşuyor.
- [ ] Hatırlatma popup/çan paneli çalışıyor.
- [ ] Popup kapatma reminder’ı tamamlandı yapmıyor.
- [ ] Hatırlatmalar sayfasında açık görev görünüyor.
- [ ] Süresi geçenler doğru görünüyor.
- [ ] Bugün aranacaklar doğru görünüyor.
- [ ] Yaklaşan aramalar doğru görünüyor.
- [ ] Adayı Aç çalışıyor.

## 7. Raporlar Kontrolü

- [ ] Raporlar sayfası açılıyor.
- [ ] Tarih seçimi çalışıyor.
- [ ] Seçilen gün işlem yapılan aday sayısı doğru.
- [ ] Seçilen gün görüşme kaydı sayısı doğru.
- [ ] Görüşüldü / Ulaşılamadı / Tekrar aranacak sayıları doğru.
- [ ] Randevu / Kayıt oldu / Yanlış numara sayıları doğru.
- [ ] Aranmayacak / ilgilenmiyor sayısı doğru.
- [ ] Son görüşmeler listesi doğru sıralanıyor.
- [ ] Adayı Aç çalışıyor.
- [ ] Açık hatırlatma özeti görünüyor.

## 8. Export Kontrolü

- [ ] Detaylı Excel Export alınıyor.
- [ ] Özet Görüşme Raporu alınıyor.
- [ ] Tüm adaylar export edilebiliyor.
- [ ] Filtrelenmiş liste export edilebiliyor.
- [ ] Görüşme notları doğru kolonlara gidiyor.
- [ ] Excel’in Tam Sistem Yedeği olmadığı uyarısı görülüyor.

## 9. Tam Sistem Yedeği / Geri Yükleme Kontrolü

- [ ] Tam Sistem Yedeği indiriliyor.
- [ ] Backup metadata bilgileri var.
- [ ] Yanlış dosya seçildiğinde hata gösteriliyor.
- [ ] Doğru yedek analiz ediliyor.
- [ ] GERİ YÜKLE onayı olmadan restore başlamıyor.
- [ ] Restore sonrası aday listesi geri geliyor.
- [ ] Restore sonrası hatırlatmalar kontrol ediliyor.
- [ ] Restore sonrası raporlar kontrol ediliyor.

## 10. Global Arama / Topbar Kontrolü

- [ ] Global arama Aday Listesi dışında dropdown açıyor.
- [ ] Aday Listesi’nde arama kutusu listeyi filtreliyor.
- [ ] Daha fazla gör düzgün çalışıyor.
- [ ] Türkçe karakterler bozuk görünmüyor.
- [ ] Online/offline göstergesi anlaşılır.

## 11. Responsive Kontrol

- [ ] 1366px temel masaüstü kontrol edildi.
- [ ] 1024px küçük laptop/tablet yatay kontrol edildi.
- [ ] 768px tablet kontrol edildi.
- [ ] 430px telefon kontrol edildi.
- [ ] 390px küçük telefon kontrol edildi.

Ekran bazlı:

- [ ] Aday Listesi tablo/filtre kontrol edildi.
- [ ] Hatırlatmalar kart/tablo kontrol edildi.
- [ ] Raporlar kart/liste kontrol edildi.
- [ ] Export sayfası kontrol edildi.
- [ ] Import sayfası kontrol edildi.
- [ ] Ayarlar sayfası kontrol edildi.

## 12. Pilot Kararı

- [ ] Kritik veri kaybı riski görülmedi.
- [ ] Import/export/yedekleme akışı çalışıyor.
- [ ] Arama operasyonu çalışıyor.
- [ ] Hatırlatma operasyonu çalışıyor.
- [ ] Raporlar günlük kontrol için yeterli.
- [ ] Kullanıcı metinleri anlaşılır.
- [ ] Pilot için engelleyici hata yok.
- [ ] Pilot başlatılabilir.
- [ ] Pilot öncesi küçük fix listesi çıkarıldı.

## 13. Pilot Notları

- Tarih:
- Test eden:
- Kullanılan test dosyası:
- Bulunan sorunlar:
- Karar:
- Sonraki aksiyonlar:
