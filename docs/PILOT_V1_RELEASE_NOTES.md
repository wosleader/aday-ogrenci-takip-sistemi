# Pilot v1.0 Release Notes

## 1. Sürüm Özeti

Aday Öğrenci Takip Sistemi Pilot v1.0, küçük ölçekli kontrollü pilot kullanım için hazırlanmış ilk aday sürümdür.

Bu sürümde:

- Excel içe aktarma
- Aday listesi
- Görüşme kaydı
- Tekrar arama / hatırlatmalar
- Raporlar
- Excel dışa aktarma
- Tam Sistem Yedeği / Geri Yükleme
- Kullanım kitapçığı
- Pilot manuel test checklist’i

hazırdır.

## 2. Release Bilgisi

- Release adı: Pilot v1.0
- Branch: sprint-9-1-pilot-findings-final-fixes
- Release candidate commit: 113b44b docs: add pilot release candidate review
- Son fix commit: 4c289b7 fix: close pilot findings for restore notices and layout polish
- Son checkpoint commit: 12062f0 docs: add sprint 9.1 checkpoint and update pilot findings

## 3. Test Durumu

- npm.cmd test geçti.
- 35 test files başarılı.
- 184 tests başarılı.
- npm.cmd run build geçti.
- Vite chunk size uyarısı var; build başarısız değil.
- Manuel pilot checklist çalıştırıldı.
- Bulunan pilot bulguları PF-001, PF-002, PF-003, PF-004 kapatıldı.

## 4. Hazır Ana Özellikler

- Excel İçe Aktarma
- Kolon eşleştirme
- Import log / uyarılar
- Aday Listesi
- Arama kutusu
- Kampanya filtresi
- Sınıf / Şube filtresi
- Durum filtresi
- Sağ kişi kartı
- Görüşme sonucu kaydetme
- Görüşme notu
- Genel açıklama
- Görüşme geçmişi
- Kaydet ve Sonrakine Geç
- Tekrar arama
- Hatırlatma popup / çan paneli
- Hatırlatmalar sayfası
- Raporlar / Günlük Özet
- Detaylı Excel Export
- Özet Görüşme Raporu
- Tam Sistem Yedeği
- Geri Yükleme
- Ayarlar
- Klavye kısayolları
- Alt kısayol yardım barı
- Kullanım Kitapçığı
- Pilot Manuel Test Checklist

## 5. Pilot v1.0 ile Gelen Son İyileştirmeler

- Hatırlatmalar sayfası
- Raporlar / Günlük Özet sayfası
- Responsive layout polish
- Alt kısayol yardım barı polish
- Pilot-facing metin polish
- Kullanım kitapçığı
- Pilot checklist
- Pilot findings kapatma
- Restore uyarı/başarı bildirimleri
- Global arama dropdown davranışı düzeltmesi
- Sağ drawer sıkışması hafifletmesi

## 6. Bilinen Sınırlamalar

- Çoklu Telefon Mimarisi henüz uygulanmadı; pilotta Telefon 1 / Telefon 2 akışı esas alınır.
- Mobile Drawer Polish’in kapsamlı hali sonraki sprint konusudur.
- Mobile Table/Card View sonraki sprint konusudur.
- Reminder completed / düzenleme / oluşturma sonraki sprint konusudur.
- Haftalık/aylık raporlar yoktur.
- PDF rapor yoktur.
- Akıllı Yardımcılar henüz planlanan özelliktir.
- Toplu silme / seçim modu yoktur.
- Excel export geri yükleme aracı değildir; tam geri yükleme için Tam Sistem Yedeği kullanılmalıdır.

## 7. Pilot Başlatma Şartları

- İlk pilot küçük veri setiyle başlatılmalı.
- Pilot öncesi Tam Sistem Yedeği alınmalı.
- Kullanıcıya USER_GUIDE.md verilmelidir.
- Pilot sırasında PILOT_MANUAL_TEST_CHECKLIST.md kullanılmalıdır.
- Pilot bulguları PILOT_FINDINGS.md veya yeni bir pilot feedback dokümanına yazılmalıdır.
- Gün sonunda Tam Sistem Yedeği alınmalıdır.

## 8. Pilot Kullanım Akışı

1. Sistemi aç.
2. Küçük Excel dosyasını içe aktar.
3. Aday Listesi’nde arama/filtreleme yap.
4. Adayları ara ve görüşme sonucu kaydet.
5. Tekrar arama ver.
6. Hatırlatmaları kontrol et.
7. Raporlar sayfasını kontrol et.
8. Gerekirse Excel raporu al.
9. Gün sonunda Tam Sistem Yedeği al.
10. Bulunan sorunları pilot feedback listesine yaz.

## 9. Pilot Sonrası Önerilen Sprint

Sprint 9.2 — Pilot Feedback Fixes

Kapsam:

- Gerçek kullanıcıdan gelen bulgular
- Pilot sırasında çıkan küçük hatalar
- Kullanıcı dilindeki anlaşılmayan yerler
- Kritik olmayan görsel/akış polish

Kapsam dışı:

- Çoklu Telefon Mimarisi
- Büyük mobil drawer dönüşümü
- Yeni rapor sistemi
- Büyük veri modeli değişiklikleri

## 10. Final Karar

Pilot v1.0, küçük ölçekli kontrollü pilot kullanım için hazır kabul edilir.
Sürüm, gerçek kullanıcı geri bildirimleri toplamak amacıyla sınırlı kapsamda denenebilir.
