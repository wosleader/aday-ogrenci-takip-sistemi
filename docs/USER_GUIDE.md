# Aday Öğrenci Takip Sistemi — Kullanım Kitapçığı

## 1. Sistem Ne İşe Yarar?

Aday Öğrenci Takip Sistemi, aday öğrenci ve veli aramalarını düzenli takip etmek için kullanılır.

Bu sistemle:

- Excel dosyasındaki adayları içe aktarabilirsiniz.
- Adayları listeleyip arayabilirsiniz.
- Her arama için görüşme sonucu ve not tutabilirsiniz.
- Tekrar aranacak adaylara tarih ve saat verebilirsiniz.
- Hatırlatmaları takip edebilirsiniz.
- Günlük çalışma özetini görebilirsiniz.
- Excel raporu alabilirsiniz.
- Tam Sistem Yedeği alıp gerektiğinde geri yükleyebilirsiniz.

## 2. İlk Kullanımda Ne Yapılır?

1. Excel dosyasını hazırlayın.
2. Sol menüden İçe Aktarma ekranını açın.
3. Excel dosyasını yükleyin.
4. Kolon eşleştirmelerini kontrol edin.
5. Simülasyon / ön kontrol sonucuna bakın.
6. Sorun yoksa içe aktarın.
7. Aday Listesi ekranından arama çalışmasına başlayın.

## 3. Excel İçe Aktarma

Excel içe aktarma, Excel dosyasındaki aday bilgilerini sisteme alır.

- Kolonlar otomatik eşleşebilir.
- Yanlış veya eksik eşleşme varsa kullanıcı düzeltebilir.
- Eksik bilgi veya yazım hatası varsa sistem uyarı/log gösterebilir.
- İçe aktarma öncesi güvenlik yedeği oluşturulabilir.

Sınıf / Şube bilgisi bazı farklı yazımlarla gelebilir. Sistem yaygın yazımları anlamaya çalışır:

- 9A, 9-A, 9/A, 9 A gibi yazımlar 9-A şeklinde yorumlanabilir.
- Sadece 9 veya 10 gibi değerler sınıf seviyesi olarak ele alınabilir.
- 22, 33, 44 gibi anlamsız değerler belirtilmemiş gibi değerlendirilebilir.

Çoklu telefon desteği ayrı bir mimari sprint konusudur. Mevcut pilot kullanımda Telefon 1 / Telefon 2 akışı esas alınır.

## 4. Aday Listesi

Aday Listesi, arama operasyonunun ana ekranıdır.

- Adaylar burada listelenir.
- Arama kutusu Aday Listesi içinde filtreleme yapar.
- Kampanya, Sınıf / Şube ve Durum Filtresi kullanılabilir.
- Açıklama / Not kolonu adayda genel not veya görüşme notu olup olmadığını kısa şekilde gösterir.
- Telefon 1 / Telefon 2 adayın kayıtlı temel iletişim numaralarıdır.
- Bir adaya tıklayınca sağ kişi kartı açılır.
- Alt kısayol yardım barı kompakt görünür. Göster/Gizle ile açılıp kapanabilir.

## 5. Sağ Kişi Kartı ve Görüşme Kaydetme

Bir aday seçildiğinde detayları sağ taraftaki kişi kartında görünür.

Bu karttan:

- Aday ve veli bilgilerini görebilirsiniz.
- Telefon bilgilerini takip edebilirsiniz.
- Görüşme sonucu seçebilirsiniz.
- Görüşme notu yazabilirsiniz.
- Tekrar arama tarihi verebilirsiniz.

Görüşme sonuçları:

- Görüşüldü
- Ulaşılamadı
- Tekrar aranacak
- Randevu
- Kayıt oldu
- Aranmayacak / ilgilenmiyor
- Yanlış numara

Genel açıklama ile görüşme notu farklıdır:

- Genel açıklama adayla ilgili genel bilgidir.
- Görüşme notu yapılan aramanın notudur.

Kaydet ve Sonrakine Geç, görüşmeyi kaydeder ve listedeki bir sonraki adaya geçmenizi sağlar.

Yanlış numara veya aranmayacak / ilgilenmiyor gibi durumlar dikkatli kullanılmalıdır. Bu seçimler arama takibini etkiler.

## 6. Tekrar Arama ve Hatırlatmalar

Tekrar aranacak adaylar için tarih ve saat girilebilir.

- Saat girilmezse sistem varsayılan saat atayabilir.
- Zamanı gelen hatırlatmalar ekranda uyarı olarak görünebilir.
- Bildirim çanı kapatılmış hatırlatma bildirimleriyle ilgilidir.

Çan paneli ve Hatırlatmalar sayfası farklıdır:

- Çan paneli, ekrandaki hatırlatma uyarıları ve kapatılan bildirimlerle ilgilidir.
- Hatırlatmalar sayfası, açık tekrar arama görevlerini takip etmek içindir.

Hatırlatmalar sayfasındaki kavramlar:

- Süresi geçenler: zamanı geçmiş ama hâlâ açık olan tekrar aramalar.
- Bugün aranacaklar: bugün için planlanan tekrar aramalar.
- Yaklaşan aramalar: ileri tarihli açık tekrar aramalar.
- Toplam açık hatırlatma: tamamlanmamış tekrar arama görevleri.

Adayı Aç butonu, ilgili adayı Aday Listesi ekranında açar.

## 7. Raporlar

Raporlar sayfasında iki görünüm bulunur: Yönetici Dashboard ve Detaylı Raporlar.

Yönetici Dashboard ilk açılan görünümdür. Burada geçici bir tarih aralığı seçebilir veya 5, 7, 14 ve 30 günlük hazır aralıklardan birini kullanabilirsiniz. Bu seçim yalnız dashboard görünümünü değiştirir; Ayarlar'daki varsayılan tarih aralığını değiştirmez. Daha uzun operasyon incelemeleri için Detaylı Raporlar görünümünü kullanın.

Dashboard'daki KPI kartları seçilen dönem ile aynı uzunluktaki önceki dönemi karşılaştırır. Görüşme sonucu dağılımı, günlük trend ve kampanya performansı aktif görüşme kayıtlarını gösterir. Randevu Verildi bir görüşme sonucudur; Randevu Durumu ise gerçek randevuların bekliyor, geldi, gelmedi, iptal, ertelendi ve kayıt oldu durumlarını gösterir.

Hatırlatma Sağlığı açık telefon hatırlatmalarını, Yönetici Dikkat Alanları ise süresi geçen hatırlatmaları, bugünkü bekleyen randevuları ve kullanılabilir telefonu olmayan aktif adayları özetler.

Temas Verimliliği, ilk sağlıklı telefon temasına ulaşmak için kaç farklı numaranın denendiğini gösterir. Bu bir görüşme süresi veya dakika metriği değildir; yalnız ölçüm başladıktan sonra kaydedilen gerçek telefon denemelerini kapsar. Kampanya bazlı temas tablosu satış başarısını değil, aday datasındaki iletişim erişilebilirliğini gösterir.

Görünümü Özelleştir ile dashboard bloklarını gizleyebilir, Varsayılan Görünüme Dön ile geri getirebilirsiniz. Yardım düğmesi metriklerin neyi gösterdiğini ve nasıl hesaplandığını açıklar.

Detaylı Raporlar görünümünde günlük rapor, Reporting V2, son görüşmeler ve açık hatırlatma özeti korunur. Raporlar sayfası Excel dışa aktarma yerine geçmez; paylaşım veya daha ayrıntılı dosya için Excel Dışa Aktar ekranını kullanın.

## 8. Excel Dışa Aktarma

Excel Dışa Aktar ekranında iki ana rapor tipi vardır:

- Detaylı Excel Export: Daha fazla alan ve teknik detay içerir.
- Özet Görüşme Raporu: Daha sade, okunabilir ve paylaşmaya uygun rapordur.

Kapsam seçimi:

- Tüm adaylar: sistemdeki tüm aktif adaylar dışa aktarılır.
- Filtrelenmiş liste: Aday Listesi ekranındaki mevcut filtre sonucuna göre dışa aktarılır.

Çok önemli:

Excel dosyaları raporlama ve paylaşım içindir.
Sistemi eksiksiz geri yüklemek için Excel değil, Tam Sistem Yedeği kullanılmalıdır.

## 9. Tam Sistem Yedeği ve Geri Yükleme

Tam Sistem Yedeği, sistemin eksiksiz geri yüklenebilmesi için kullanılır.

Bu işlem Ayarlar > Veri Yönetimi altında bulunur.

- Yedek dosyası güvenli bir yerde saklanmalıdır.
- Geri yükleme mevcut verileri değiştirebilir.
- Bu nedenle geri yükleme yapmadan önce doğru dosya seçildiğinden emin olunmalıdır.
- GERİ YÜKLE onayı, işlemin bilinçli yapıldığını doğrulamak için istenir.
- Yanlış dosya seçilirse sistem uyarı gösterebilir.

Excel export ile Tam Sistem Yedeği aynı şey değildir:

- Excel export raporlama ve paylaşım içindir.
- Tam Sistem Yedeği eksiksiz geri yükleme içindir.

## 10. Ayarlar

Ayarlar ekranında:

- Klavye kısayolları düzenlenebilir.
- Hatırlatma ayarları yönetilebilir.
- Veri Yönetimi bölümünden yedekleme ve geri yükleme yapılabilir.

Veri Yönetimi bölümündeki işlemler dikkatli kullanılmalıdır. Özellikle geri yükleme ve aday verilerini temizleme işlemleri önce kontrol edilmelidir.

## 11. Klavye Kısayolları

Alt kısayol barı Göster/Gizle ile açılıp kapanabilir.

Kısayollar arama akışını hızlandırır.

Örnek kısayollar:

- F: Arama alanı
- T: Telefon 1
- Y: Telefon 2
- Ctrl+S: Kaydet

Kullanıcı kısayolları Ayarlar ekranından değiştirebilir.

## 12. Sık Yapılan Hatalar ve Çözümler

Excel kolonları yanlış eşleştiyse:

- Kolon eşleştirme ekranını kontrol edin.
- Gerekirse ilgili kolonu elle düzeltin.

Telefon boşsa:

- Aday yine sisteme alınabilir.
- Arama öncesi telefon bilgisi kontrol edilmelidir.

Aday bulunamıyorsa:

- Arama kutusunu temizleyin.
- Kampanya, Sınıf / Şube ve Durum Filtresi seçimlerini kontrol edin.

Hatırlatma görünmüyorsa:

- Tekrar arama tarihi ve saatini kontrol edin.
- Adayın tekrar aranacak olarak kaydedildiğinden emin olun.

Export dosyası geri yükleme için kullanılmamalıdır:

- Geri yükleme için Tam Sistem Yedeği dosyası gerekir.

Tam Sistem Yedeği kaybolursa:

- Sistemi eski haline eksiksiz geri yüklemek mümkün olmayabilir.

## 13. Pilot Kullanım İçin Önerilen Günlük Akış

1. Sistemi açın.
2. Hatırlatmaları kontrol edin.
3. Aday Listesi’nden aramaya başlayın.
4. Görüşme sonucunu ve notunu kaydedin.
5. Tekrar aranacaksa tarih verin.
6. Gün sonunda Raporlar sayfasını kontrol edin.
7. Gerekirse Excel raporu alın.
8. Düzenli olarak Tam Sistem Yedeği alın.

## 14. Akıllı Yardımcılar

Akıllı Yardımcılar ileride Ayarlar altında ayrı bir bölüm olarak planlanmaktadır.

Planlanan yardımcılar:

- Görüşme notundan durum önerisi.
- Tekrar arama önerisi.
- Randevu önerisi.

İlk yaklaşım offline ve kural tabanlı olacaktır.
Dış AI API kullanılmayacaktır.

Bu özellik uygulamada görünmüyorsa planlanan özellik olarak değerlendirilmelidir.

## 15. Önemli Uyarılar

- Excel export yedek değildir.
- Geri yükleme yapmadan önce doğru dosya seçildiğinden emin olun.
- Yanlış numara / aranmayacak gibi durumlar dikkatli işaretlenmelidir.
- Gerçek pilotta önce küçük bir aday listesiyle deneme yapılması önerilir.
- Çoklu Telefon Mimarisi ayrı sprintte ele alınacaktır; mevcut pilotta Telefon 1 / Telefon 2 akışı esas alınır.
