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
- Durum: Çözüldü
- Sorun:
  Kullanıcı bir menüde arama yaptıktan sonra arama metnini silmeden başka menüye geçip geri döndüğünde, önceki arama sonucu/dropdown tekrar görünüyor.
- Beklenen:
  Menü değiştirildiğinde arama sonuç paneli kapanmalı. Arama metni kalacaksa bile dropdown otomatik açılmamalı.
- Önerilen çözüm:
  Route/menu değişiminde global search dropdown state kapatılsın. Aday Listesi filtre davranışı bozulmasın.
- Çözüm notu:
  Sprint 9.1’de route/menu değişiminde global arama dropdown’ının kapanması sağlandı. Arama metni korunur, ancak sonuç paneli kullanıcı etkileşimi olmadan kendiliğinden açılmaz.

### PF-002 — Yanlış yedek dosyası uyarısı sayfanın altında kalıyor

- Ekran: Ayarlar > Veri Yönetimi > Geri Yükleme
- Öncelik: Yüksek
- Durum: Çözüldü
- Sorun:
  Yanlış dosya seçildiğinde “Bu dosya Tam Sistem Yedeği dosyası gibi görünmüyor.” mesajı sayfanın altında kalıyor ve yeterince dikkat çekmiyor.
- Beklenen:
  Yanlış dosya seçildiğinde görünür, profesyonel bir uyarı modalı/toast/popup çıksın. Kullanıcı “Tamam” diyerek kapatabilsin.
- Önerilen çözüm:
  Restore parse/validation hataları için görünür alert/modal/toast benzeri bildirim gösterilsin.
- Çözüm notu:
  Sprint 9.1’de yanlış Tam Sistem Yedeği dosyası seçildiğinde görünür alertdialog eklendi. Kullanıcı uyarıyı “Tamam” ile kapatabilir.

### PF-003 — Geri yükleme başarılı olunca belirgin başarı mesajı çıkmalı

- Ekran: Ayarlar > Veri Yönetimi > Geri Yükleme
- Öncelik: Yüksek
- Durum: Çözüldü
- Sorun:
  Restore başarılı oluyor ve veriler geri geliyor; ancak kullanıcıya yeterince güçlü “başarıyla geri yüklendi” bildirimi çıkmıyor.
- Beklenen:
  “Tam Sistem Yedeği başarıyla geri yüklendi.” veya “Geri yükleme tamamlandı. Adaylar, hatırlatmalar ve kayıtlar sisteme geri alındı.” şeklinde belirgin popup/toast/alert gösterilsin.
- Önerilen çözüm:
  Restore başarı sonucunda görünür başarı bildirimi gösterilsin.
- Çözüm notu:
  Sprint 9.1’de restore başarılı olunca görünür başarı bildirimi eklendi. Kullanıcı bildirimi “Tamam” ile kapatabilir.

### PF-004 — Sağ kişi kartı açıkken Aday Listesi çalışma alanı sıkışıyor

- Ekran: Aday Listesi / Sağ kişi kartı
- Öncelik: Orta-Yüksek
- Durum: Çözüldü
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
- Çözüm notu:
  Sprint 9.1’de drawer genişliği düşük riskli CSS ile hafifletildi. Kapsamlı mobile drawer polish ve mobil tablo/kart dönüşümü sonraya bırakıldı.

### PF-006 — Export kapsamı seçenekleri kullanıcı için daha açık anlatılmalı

- Ekran: Excel Dışa Aktar / Export Kapsamı
- Öncelik: Orta
- Durum: Çözüldü
- Sorun:
  Export kapsamı seçenekleri arasındaki fark kullanıcı için yeterince açık değildi.
- Beklenen:
  “Tüm adayları dışa aktar” ve “Mevcut filtrelenmiş listeyi dışa aktar” seçenekleri sade ve net anlatılmalı.
- Çözüm notu:
  Export kapsamı açıklamaları kullanıcı dostu hale getirildi. “Tüm adayları dışa aktar” seçeneğinin Aday Listesi’ndeki arama/filtreleri dikkate almadığı net yazıldı. “Mevcut filtrelenmiş listeyi dışa aktar” seçeneğinin arama, kampanya, sınıf/şube ve durum filtrelerini dikkate aldığı net yazıldı.

### PF-007 — Sol menü kısayol rozetleri görünüyor ama çalışmıyor

- Ekran: Sol menü / Global navigasyon
- Öncelik: Orta
- Durum: Çözüldü
- Sorun:
  Sol menüde L ve H rozetleri görünmesine rağmen ilgili sayfalara geçiş yapmıyordu.
- Beklenen:
  L tuşu Aday Listesi’ne, H tuşu Hatırlatmalar’a götürmeli; yazı yazılan alanlarda ve modifier tuşlarıyla tetiklenmemeli.
- Çözüm notu:
  Sol menüdeki L ve H kısayolları çalışır hale getirildi. L → Aday Listesi, H → Hatırlatmalar. Input/textarea/select/contenteditable içindeyken ve Ctrl/Alt/Meta ile basıldığında tetiklenmez. Mevcut operasyon kısayolları korunur.

### PF-008 — Raporlar sayfasında gereksiz dikey scroll / kompaktlık sorunu

- Ekran: Raporlar
- Öncelik: Düşük-Orta
- Durum: Çözüldü / Hafifletildi
- Sorun:
  Raporlar sayfasında masaüstü görünümde içerik neredeyse sığmasına rağmen gereksiz dikey scroll ve fazla boşluk hissi oluşuyordu.
- Beklenen:
  Raporlar sayfası mevcut tasarım dilini koruyarak daha kompakt görünmeli.
- Çözüm notu:
  Raporlar sayfası scoped CSS ile daha kompakt hale getirildi. Kart yüksekliği, grid gap, section padding ve page bottom padding değerleri düşük riskli şekilde azaltıldı. Global body/html overflow davranışına dokunulmadı.
- Not:
  Gemini tarafından üretilen premium dashboard yaklaşımı birebir uygulanmadı. Reports Dashboard Polish ayrı roadmap maddesi olarak saklandı.

### PF-009 — Export özet kartında “Maksimum Arama N” başlığı kırılıyor

- Ekran: Excel Dışa Aktar / Export Öncesi Özet
- Öncelik: Düşük
- Durum: Çözüldü
- Sorun:
  “Maksimum Arama N” başlığı kart içinde kırılıyor ve teknik görünüyordu.
- Beklenen:
  Kart başlığı sade, kullanıcı dostu ve kırılmadan okunabilir olmalı.
- Çözüm notu:
  “Maksimum Arama N” metni “En yüksek arama” olarak değiştirildi. Export hesaplama/Excel üretim mantığı değiştirilmedi.

### PF-010 — Klavye Kısayolları aksiyon butonları buton gibi görünmüyor

- Ekran: Ayarlar > Klavye Kısayolları
- Öncelik: Düşük-Orta
- Durum: Çözüldü
- Sorun:
  “Değiştir” ve “Varsayılana döndür” aksiyonları metin gibi görünüyor, buton oldukları yeterince anlaşılmıyordu.
- Beklenen:
  Kısayol aksiyonları sade ama belirgin buton görünümünde olmalı.
- Çözüm notu:
  Ayarlar > Klavye Kısayolları bölümündeki “Değiştir” ve “Varsayılana döndür” butonları scoped CSS ile daha belirgin hale getirildi. Global button tasarımına dokunulmadı.

### PF-011 — Sol menü kısayolları Klavye Kısayolları sayfasında görünmüyor

- Ekran: Ayarlar > Klavye Kısayolları
- Öncelik: Düşük-Orta
- Durum: Çözüldü
- Sorun:
  Sol menüde çalışan L/H navigasyon kısayolları, Klavye Kısayolları sayfasında görünmüyordu.
- Beklenen:
  Kullanıcı, sol menü kısayollarını ayarlar ekranında bilgilendirme olarak görebilmeli.
- Çözüm notu:
  Ayarlar > Klavye Kısayolları bölümüne küçük bilgilendirme kartı eklendi: L → Aday Listesi, H → Hatırlatmalar. Bu kısayollar değiştirilebilir operasyon kısayolları listesine eklenmedi; sadece bilgilendirme olarak gösterildi.

### PF-012 — Hatırlatmalar sayfasında gereksiz dış sayfa scroll’u devam ediyor

- Ekran: Hatırlatmalar
- Öncelik: Orta
- Durum: Çözüldü
- Sorun:
  Hatırlatmalar sayfasında liste içi scroll doğru çalışmasına rağmen masaüstünde dış sayfada gereksiz dikey scroll devam ediyordu.
- Beklenen:
  Uzun kayıtlar için scroll öncelikle tablo/liste kutusunda olmalı; küçük ekranlarda doğal sayfa scroll’u korunmalı.
- Çözüm notu:
  Hatırlatmalar sayfasında masaüstü görünüm için layout yeniden dengelendi. Liste içi scroll `.reminder-table-wrap` içinde kaldı. Dış sayfadaki gereksiz dikey scroll azaltıldı/kaldırıldı. 1024px ve altında doğal sayfa scroll’u korunur. Global body/html veya genel `.page` selectorlarına dokunulmadı.

## 4. Pilot Kararı

- Ana akışlar pilot için çalışır durumda.
- Bilinen engelleyici veri kaybı veya kritik import/export/restore hatası görülmedi.
- Sprint 9.1 ile PF-001, PF-002, PF-003 ve PF-004 kapatıldı.
- Pilot izleme sırasında gelen PF-006, PF-007, PF-008, PF-009, PF-010, PF-011 ve PF-012 küçük UI/UX polish bulguları kapatıldı.
- Sistem pilot kullanım için daha güvenli ve anlaşılır hale geldi.

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
