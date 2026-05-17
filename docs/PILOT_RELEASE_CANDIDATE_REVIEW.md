# Pilot Release Candidate Review

## 1. Özet

Bu doküman Aday Öğrenci Takip Sistemi’nin pilot kullanıma aday sürüm değerlendirmesidir.
Sprint 9.1 sonrası manuel pilot testte bulunan bilinen bulgular kapatılmıştır.
Bu sürüm, küçük ölçekli pilot deneme için adaydır.

## 2. Aday Sürüm Bilgisi

- Release candidate branch: sprint-9-1-pilot-findings-final-fixes
- Son commit: 12062f0 docs: add sprint 9.1 checkpoint and update pilot findings
- Son fix commit: 4c289b7 fix: close pilot findings for restore notices and layout polish
- Dokümantasyon commit’i: 12062f0 docs: add sprint 9.1 checkpoint and update pilot findings

## 3. Test ve Build Durumu

- npm.cmd test daha önce geçti:
  - 35 test files başarılı
  - 184 tests başarılı
- npm.cmd run build daha önce geçti
- Vite chunk size uyarısı var; build başarısız değil
- PWA generateSW çıktısı oluşuyor

Not:
Bu dokümantasyon turunda test/build tekrar çalıştırmak şart değil; release candidate kararı son başarılı test/build sonuçlarına dayanır.

## 4. Manuel Pilot Kontrol Özeti

Aşağıdaki ana akışlar manuel kontrolde başarılı geçti:

- Temiz IndexedDB ile başlama
- Test Excel dosyasıyla içe aktarma
- Aday Listesi
- Arama kutusu
- Kampanya filtresi
- Sınıf / Şube filtresi
- Durum Filtresi
- Açıklama / Not kolonu
- Telefon 1 / Telefon 2 okunabilirliği
- Alt kısayol yardım barı
- Sağ kişi kartı açılması
- Görüşme sonucu kaydetme
- Görüşme notu kaydetme
- Genel açıklama / görüşme notu ayrımı
- Görüşme geçmişi
- Kaydet ve Sonrakine Geç
- Tekrar arama oluşturma
- Hatırlatma popup / çan paneli
- Hatırlatmalar sayfası
- Raporlar sayfası
- Tarih seçimi
- Günlük rapor kırılımları
- Export
- Tam Sistem Yedeği alma
- Yanlış yedek dosyası uyarısı
- Doğru yedek analiz
- GERİ YÜKLE onayı
- Restore sonrası aday listesi / hatırlatmalar / raporlar
- Global arama
- Türkçe karakterler

## 5. Kapatılan Pilot Bulguları

### PF-001 — Global arama dropdown davranışı

- Durum: Çözüldü
- Route/menu değişiminde dropdown otomatik tekrar açılmaz.
- Arama metni korunabilir.
- Aday Listesi filtre davranışı korunur.

### PF-002 — Yanlış yedek dosyası uyarısı

- Durum: Çözüldü
- Yanlış Tam Sistem Yedeği dosyası seçildiğinde görünür alertdialog çıkar.
- Kullanıcı “Tamam” ile kapatabilir.

### PF-003 — Restore başarı bildirimi

- Durum: Çözüldü
- Geri yükleme başarılı olunca belirgin başarı bildirimi çıkar.
- Kullanıcı “Tamam” ile kapatabilir.

### PF-004 — Sağ kişi kartı açıkken liste sıkışması

- Durum: Çözüldü / Hafifletildi
- Sağ drawer genişliği düşük riskli CSS ile hafifletildi.
- Daha kapsamlı Mobile Drawer Polish sonraki sprint konusudur.

## 6. Pilot İçin Hazır Olan Ana Özellikler

- Excel içe aktarma
- Kolon eşleştirme
- Import log / uyarı sistemi
- Aday Listesi
- Sınıf / Şube filtresi
- Kampanya filtresi
- Durum filtresi
- Global arama
- Sağ kişi kartı
- Görüşme kaydetme
- Görüşme geçmişi
- Tekrar arama / reminder
- Hatırlatmalar sayfası
- Raporlar / Günlük Özet sayfası
- Detaylı Excel Export
- Özet Görüşme Raporu
- Tam Sistem Yedeği
- Geri Yükleme
- Ayarlar
- Klavye kısayolları
- Alt kısayol yardım barı
- Kullanım kitapçığı
- Pilot manuel test checklist’i

## 7. Pilot Kapsamında Bilinçli Sınırlamalar

- Çoklu Telefon Mimarisi henüz uygulanmadı; pilotta Telefon 1 / Telefon 2 akışı esas alınır.
- Mobile Drawer Polish daha kapsamlı hali sonraki sprint konusudur.
- Mobile Table/Card View sonraki sprint konusudur.
- Reminder completed / düzenleme / oluşturma akışları sonraki sprint konusudur.
- Haftalık/aylık raporlar, grafik/dashboard, PDF veya yeni export tipi yoktur.
- Akıllı Yardımcılar henüz planlanan özelliktir.
- Toplu silme / seçim modu yoktur.
- Excel export geri yükleme amacıyla kullanılmaz; tam geri yükleme için Tam Sistem Yedeği kullanılmalıdır.

## 8. Pilot Başlatma Önerisi

Öneri:
Bu sürüm küçük ölçekli pilot kullanım için başlatılabilir.

Koşullar:

- İlk pilot küçük bir aday listesiyle yapılmalı.
- Pilot öncesi Tam Sistem Yedeği alınmalı.
- Kullanıcıya Excel Export ile Tam Sistem Yedeği farkı anlatılmalı.
- Kullanıcıya Kullanım Kitapçığı verilmelidir.
- Pilot sırasında bulunan sorunlar docs/PILOT_FINDINGS.md veya yeni bir pilot bulgu dokümanına eklenmelidir.

## 9. Pilot Öncesi Operasyon Notları

- Pilot başlamadan önce tarayıcı / cihaz kontrol edilmeli.
- İlk deneme küçük veri setiyle yapılmalı.
- İçe aktarma sonrası aday sayısı kontrol edilmeli.
- Gün sonunda Tam Sistem Yedeği alınmalı.
- Export dosyaları rapor/paylaşım için kullanılmalı.
- Geri yükleme sadece Tam Sistem Yedeği ile yapılmalı.
- Kritik işlemlerden önce kullanıcı bilgilendirilmeli.

## 10. Sonraki Aşama Önerisi

1. Pilot kullanıcıyla küçük veri seti üzerinde gerçek deneme
2. Pilot sırasında çıkan bulguların kaydı
3. Sprint 9.2 — Pilot Feedback Fixes
4. Daha sonra:
   - Mobile Drawer Polish
   - Mobile Table/Card View Polish
   - Çoklu Telefon Mimarisi
   - Reminder tamamlandı/düzenleme/oluşturma
   - Akıllı Yardımcılar
   - Toplu silme/seçim modu

## 11. Final Karar

Karar:
Sprint 9.1 sonrası Aday Öğrenci Takip Sistemi pilot release candidate seviyesine gelmiştir.
Bilinen manuel pilot bulguları kapatılmıştır.
Sistem küçük ölçekli kontrollü pilot denemeye hazır kabul edilebilir.
