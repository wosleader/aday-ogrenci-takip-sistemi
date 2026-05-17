# Pilot Findings — Manuel Test Bulguları

## 1. Test Özeti

- Test tarihi: 2026-05-17
- Branch: sprint-9-0-user-guide-pilot-checklist
- Son commit: a157b15 docs: add user guide and pilot manual test checklist
- Test türü: Manuel pilot kontrol
- Genel karar: Ana akışlar başarılı, pilot öncesi küçük fix listesi oluştu.

## 2. Başarılı Kontroller

Aşağıdaki alanlar manuel kontrolde başarılı geçti:

- npm.cmd test geçti: 35 test files, 181 tests
- npm.cmd run build geçti
- Uygulama localhost üzerinde açıldı
- IndexedDB temizlenerek test edildi
- Excel içe aktarma başarılı
- Aday Listesi filtreleri başarılı
- Arama kutusu başarılı
- Kampanya filtresi başarılı
- Sınıf / Şube filtresi başarılı
- Durum Filtresi başarılı
- Açıklama / Not kolonu düzgün
- Telefon 1 / Telefon 2 okunabilir
- Alt kısayol yardım barı kompakt ve Göster/Gizle çalışıyor
- Sağ kişi kartı açılıyor
- Görüşme sonuçları kaydediliyor
- Görüşme notu ve genel açıklama ayrımı korunuyor
- Görüşme geçmişi kronolojik görünüyor
- Kaydet ve Sonrakine Geç çalışıyor
- Tekrar arama / Hatırlatmalar çalışıyor
- Popup kapatma reminder’ı completed yapmıyor
- Hatırlatmalar sayfası açık görevleri gösteriyor
- Raporlar sayfası ve tarih seçimi çalışıyor
- Rapor kırılımları doğru görünüyor
- Export başarılı
- Tam Sistem Yedeği indiriliyor
- Doğru yedek analiz ediliyor
- GERİ YÜKLE onayı olmadan restore başlamıyor
- Restore sonrası aday listesi, hatırlatmalar ve raporlar geri geliyor
- Global arama temel davranışı çalışıyor
- Türkçe karakter bozukluğu gözlenmedi

## 3. Pilot Bulguları

### PF-001 — Menüye dönünce önceki arama sonucu/dropdown tekrar açılıyor

- Ekran: Global arama / Aday Listesi / Menü geçişleri
- Öncelik: Orta
- Durum: Açık
- Sorun:
  Kullanıcı bir menüde arama yaptıktan sonra arama metnini silmeden başka menüye geçip geri döndüğünde, önceki arama sonucu/dropdown tekrar görünüyor.
- Beklenen:
  Menü değiştirildiğinde arama sonuç paneli kapanmalı. Arama metni kalacaksa bile dropdown otomatik açılmamalı.
- Önerilen çözüm:
  Route/menu değişiminde global search dropdown state kapatılsın. Aday Listesi filtre davranışı bozulmasın.

### PF-002 — Yanlış yedek dosyası uyarısı sayfanın altında kalıyor

- Ekran: Ayarlar > Veri Yönetimi > Geri Yükleme
- Öncelik: Yüksek
- Durum: Açık
- Sorun:
  Yanlış dosya seçildiğinde “Bu dosya Tam Sistem Yedeği dosyası gibi görünmüyor.” mesajı sayfanın altında kalıyor ve yeterince dikkat çekmiyor.
- Beklenen:
  Yanlış dosya seçildiğinde görünür, profesyonel bir uyarı modalı/toast/popup çıksın. Kullanıcı “Tamam” diyerek kapatabilsin.
- Önerilen çözüm:
  Restore parse/validation hataları için görünür alert/modal/toast benzeri bildirim gösterilsin.

### PF-003 — Geri yükleme başarılı olunca belirgin başarı mesajı çıkmalı

- Ekran: Ayarlar > Veri Yönetimi > Geri Yükleme
- Öncelik: Yüksek
- Durum: Açık
- Sorun:
  Restore başarılı oluyor ve veriler geri geliyor; ancak kullanıcıya yeterince güçlü “başarıyla geri yüklendi” bildirimi çıkmıyor.
- Beklenen:
  “Tam Sistem Yedeği başarıyla geri yüklendi.” veya “Geri yükleme tamamlandı. Adaylar, hatırlatmalar ve kayıtlar sisteme geri alındı.” şeklinde belirgin popup/toast/alert gösterilsin.
- Önerilen çözüm:
  Restore başarı sonucunda görünür başarı bildirimi gösterilsin.

### PF-004 — Sağ kişi kartı açıkken Aday Listesi çalışma alanı sıkışıyor

- Ekran: Aday Listesi / Sağ kişi kartı
- Öncelik: Orta-Yüksek
- Durum: Açık
- Sorun:
  Aday seçildiğinde sağ kişi kartı sabit genişlikte açılıyor. Bu sırada Aday Listesi tablosu ve alt kısayol barı daralıyor. Tablo yatay scroll’a düşüyor ve bazı kolonlara erişim zorlaşıyor. Geniş ekranda bile sağ panel açıkken orta alan kalabalık görünüyor.
- Beklenen:
  Sağ kişi kartı açıkken ana tablo alanı daha kontrollü davranmalı. Sağ panel genişliği, tablo görünürlüğü ve alt kısayol barı dengelenmeli.
- Önerilen çözüm:
  Sprint 9.1’de düşük riskli hafifletme yapılabilir:
  - Sağ panel genişliği gözden geçirilsin.
  - Sağ panel açıkken tablo kritik kolonları korunsun.
  - Büyük mobil drawer dönüşümü yapılmasın.
  - Mobile Drawer Polish ayrı sprint olarak kalsın.

## 4. Pilot Kararı

- Ana akışlar pilot için çalışır durumda.
- Bilinen engelleyici veri kaybı veya kritik import/export/restore hatası görülmedi.
- Ancak pilot öncesi PF-002 ve PF-003 yüksek öncelikle kapatılmalıdır.
- PF-001 ve PF-004 pilot konforu için Sprint 9.1’de ele alınmalıdır.

## 5. Sprint 9.1 Önerilen Kapsam

Sprint adı:
Sprint 9.1 — Pilot Test Findings / Final Fixes

Önerilen kapsam:

- PF-001 global arama dropdown state fix
- PF-002 restore yanlış dosya görünür uyarı
- PF-003 restore başarı bildirimi
- PF-004 sağ kişi kartı açıkken aday listesi sıkışmasını hafifletme

Kapsam dışı:

- Çoklu Telefon Mimarisi
- Mobile Drawer full-screen dönüşümü
- Mobile Table/Card View
- Yeni özellik
- Veri modeli değişikliği
