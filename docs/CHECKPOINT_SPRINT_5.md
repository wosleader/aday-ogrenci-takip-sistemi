# Aday Öğrenci Takip Sistemi - Sprint 5 Checkpoint

## Repo / Branch / Commit

- Repo URL: https://github.com/wosleader/aday-ogrenci-takip-sistemi
- Aktif branch: `sprint-5-call-workflow`
- Son commit: `0ef15c5 feat: add call workflow with refined reminder alerts`
- Tarih/saat: `2026-05-09 14:44:19 +03:00`

## Tamamlanan Sprint Özeti

- Sprint 0: React + Vite + TypeScript + PWA iskeleti
- Sprint 1: IndexedDB/Dexie veri modeli, domain modelleri, seed, backup çekirdeği
- Sprint 2: Excel import simülasyonu
- Sprint 2.1: başlık satırı algılama, kolon eşleştirme UX
- Sprint 2.2: import log UX, teknik destek paketi
- Sprint 3: gerçek IndexedDB import akışı
- Sprint 4: aday listesi gerçek veri akışı
- Sprint 4.1: mockup tabanlı aday listesi UX, veri yönetimi, telefon işaretleri, duplicate import modalı
- Sprint 5: gerçek arama akışı, `call_logs`, kaydet ve sonrakine geç, reminder popup/ses uyarısı

## Sprint 5'te Yapılanlar

- Sağ kişi kartındaki görüşme formu gerçek `call_logs` yazıyor.
- Kaydet ve sonrakine geç gerçek transaction akışına bağlandı.
- `students.last_call_result` güncelleniyor.
- `students.lifecycle_status` gerekli durumlarda güncelleniyor.
- `students.last_contacted_at` ve `last_contacted_phone_id` güncelleniyor.
- Telefon 1 / Telefon 2 üzerinden görüşülen numara takibi yapılıyor.
- `✓` = son görüşülen / iletişim kurulan numara.
- `x` = yanlış numara / kullanılmıyor.
- İki uygun telefon varsa `✓` seçimi zorunlu hale getirildi.
- `x` işaretli telefon otomatik görüşülen telefon seçilmiyor.
- Aynı öğrencide tek contacted telefon kalıyor.
- Tekrar arama tarihi varsa pending reminder oluşturuluyor.
- Mevcut pending reminder varsa güncelleniyor.
- Geçmiş alanı gerçek `call_logs` kayıtlarını gösteriyor.
- Reminder zamanı gelince üst merkez popup/toast çıkıyor.
- Birikmiş reminder'lar tek tek yağmak yerine toplu popup olarak gösteriliyor.
- Reminder sesi Web Audio ile eklendi.
- Reminder popup açık/kapalı ayarı eklendi.
- Reminder ses açık/kapalı ayarı eklendi.
- Test/build geçti.

## Önemli Ürün Kararları

- Yeni not textarea'sı boş gelir.
- Eski notlar Geçmiş altında gösterilir.
- `call_logs` artık görüşme geçmişinin ana kaynağıdır.
- `general_note` sadece Excel'den aktarılan not olarak gösterilir.
- Reminder bildirimi kapatmak reminder'ı completed yapmaz.
- "Bu Bildirimi Kapat" sadece bu oturum için bildirimi susturur.
- "Tüm Bildirimleri Kapat" o anda due olan tüm reminder popup'larını bu oturum için kapatır.
- Uygulama kapalıyken background notification bu sürümde yok.
- `3` tuşu kritik kısayol olarak kullanılmayacak.

## Sprint 5.1 İçin Önerilen Hedef

Klavye kısayolları + arama operasyonu hızlandırma:

- Gerçek klavye eventleri
- Atanabilir kısayol altyapısına uyum
- Hızlı durum seçimi
- Sıradaki adaya geçme
- Kaydetme
- Telefon 1 / Telefon 2 seçme
- Yanlış numara işaretleme
- Arama kutusuna odaklanma
- Kısayol çakışma kontrolü
- `3` tuşunun kritik işlemlerde kullanılmaması

## Sprint 5.1'de Yapılmayacaklar

- Detaylı Excel export
- VDS/senkronizasyon
- WhatsApp/SMS entegrasyonu
- Kullanıcı/profil sistemi
- Figma birebir UI alignment
- Büyük tasarım refactor

## Yeni Oturumda Devam Notu

Sprint 5.1'e başlamadan önce bu checkpoint dosyası okunmalı.
Önce plan çıkarılmalı, onay alınmadan kod yazılmamalı.
