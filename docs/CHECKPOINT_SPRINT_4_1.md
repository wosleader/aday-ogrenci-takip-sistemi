# Aday Öğrenci Takip Sistemi - Sprint 4.1 Checkpoint

## Repo / Branch / Commit

- Repo URL: https://github.com/wosleader/aday-ogrenci-takip-sistemi
- Aktif branch: `sprint-4-1-list-ux-data-management`
- Son commit: `c31b7c2 feat: refine student list ux and data management`
- Tarih/saat: `2026-05-09 06:20:33 +03:00`

## Tamamlanan Sprint Özeti

- Sprint 0: React + Vite + TypeScript + PWA iskeleti
- Sprint 1: IndexedDB/Dexie veri modeli, domain modelleri, seed, backup çekirdeği
- Sprint 2: Excel import simülasyonu
- Sprint 2.1: başlık satırı algılama, kolon eşleştirme UX
- Sprint 2.2: import log UX, teknik destek paketi
- Sprint 3: gerçek IndexedDB import akışı
- Sprint 4: Aday listesi gerçek veri akışı
- Sprint 4.1: mockup tabanlı aday listesi UX, veri yönetimi, telefon işaretleri, duplicate import modalı

## Sprint 4.1'de Yapılanlar

- Mockup dosyası repoya eklendi.
- Tasarım rehberi repoya eklendi.
- Aday listesi mockup tabanlı hale getirildi.
- Sol menü aç/kapanır hale geldi.
- Sağ kişi kartı aç/kapanır hale geldi.
- Telefon 1 ve Telefon 2 ayrı gösteriliyor.
- `✓` = son görüşülen / iletişim kurulan numara.
- `x` = yanlış numara / kullanılmıyor.
- Telefon durum servisleri eklendi.
- Açıklama / Not kolonu eklendi.
- Notlar sağ kartta Geçmiş alanına taşındı.
- Mükerrer telefon filtresinde grup başlıkları eklendi.
- Tek aday silme servisi eklendi.
- Ayarlar > Veri Yönetimi > Tüm aday verilerini temizle eklendi.
- Aynı dosya tekrar import edilirse modal uyarı eklendi.
- Test/build geçti.

## Önemli Ürün Kararları

- Mockup ve tasarım rehberi referans alınacak.
- Figma tasarımı ileride Sprint 4.2 UI Alignment olarak değerlendirilecek.
- Şimdilik Sprint 5'te gerçek arama akışına geçilecek.
- `3` tuşu varsayılan kritik kısayol olarak kullanılmayacak.
- Telefon işaretleri:
  - `✓` = son görüşülen / iletişim kurulan numara
  - `x` = yanlış numara / kullanılmıyor
- Eski notlar textarea içinde değil, Geçmiş altında gösterilecek.
- Yeni not textarea'sı boş gelecek.
- Kampanya ana listede değil, filtre alanında olacak.
- Duplicate import kullanıcıyı durduran modal ile uyarılacak.

## Sprint 5 İçin Önerilen Hedef

Gerçek Arama Akışı:

- Sağ kişi kartından görüşme sonucu seçme
- Hangi telefonla iletişim kurulduğunu seçme
- Yeni not yazma
- `call_logs` tablosuna gerçek kayıt yazma
- `students.last_call_result` / `lifecycle_status` güncelleme
- Telefon status güncelleme
- Tekrar arama tarihi/saatinden reminder oluşturma veya güncelleme
- Kaydet ve sonrakine geç
- Geçmiş alanında call logları kronolojik gösterme

## Sprint 5'te Yapılmayacaklar

- Detaylı Excel export
- VDS/senkronizasyon
- WhatsApp/SMS entegrasyonu
- Kullanıcı/profil sistemi
- Figma birebir UI alignment
- Büyük tasarım refactor

## Yeni Oturumda Devam Notu

Sprint 5'e başlamadan önce bu checkpoint dosyası okunmalı.
Önce plan çıkarılmalı, onay alınmadan kod yazılmamalı.
