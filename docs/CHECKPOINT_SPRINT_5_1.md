# Aday Öğrenci Takip Sistemi - Sprint 5.1 Checkpoint

## Repo / Branch / Commit

- Repo URL: https://github.com/wosleader/aday-ogrenci-takip-sistemi
- Aktif branch: `sprint-5-1-keyboard-workflow`
- Son commit: `faa8cad feat: add keyboard workflow and refine reminder popup layout`
- Tarih/saat: `2026-05-10 03:18:51 +03:00`

## Tamamlanan Sprint Özeti

- Sprint 0: React + Vite + TypeScript + PWA iskeleti
- Sprint 1: IndexedDB/Dexie veri modeli, domain modelleri, seed, backup çekirdeği
- Sprint 2: Excel import simülasyonu
- Sprint 2.1: başlık satırı algılama, kolon eşleştirme UX
- Sprint 2.2: import log UX, teknik destek paketi
- Sprint 3: gerçek IndexedDB import akışı
- Sprint 4: aday listesi gerçek veri akışı
- Sprint 4.1: mockup tabanlı aday listesi UX, veri yönetimi, telefon işaretleri, duplicate import modalı
- Sprint 5: gerçek arama akışı, call_logs, kaydet ve sonrakine geç, reminder popup/ses uyarısı
- Sprint 5.1: klavye kısayolları, reminder popup polish, durum badge düzeltmesi

## Sprint 5.1'de Yapılanlar

- Klavye kısayolu registry eklendi.
- `F` üst arama kutusuna odaklanıyor.
- `ArrowUp` / `ArrowDown` adaylar arasında gezebiliyor.
- `N` sıradaki adaya geçiyor.
- `T` Telefon 1'i görüşülen numara olarak işaretliyor.
- `Y` Telefon 2'yi görüşülen numara olarak işaretliyor.
- `X` yanlış numara / kullanılmıyor toggle mantığına bağlandı.
- `1` Görüşüldü / ulaşıldı.
- `2` Ulaşılamadı.
- `4` Yanlış numara.
- `5` Randevu.
- `6` Aranmayacak.
- `Ctrl+S` kaydet ve sonrakine geç akışına bağlandı.
- Input/textarea/select içindeyken harf/sayı kısayolları bastırıldı.
- `3` tuşu kritik kısayol olarak kullanılmadı.
- Ayarlar'da varsayılan kısayollar listeleniyor.
- Reminder popup sadeleştirildi.
- Telefon bilgisi reminder popup'tan kaldırıldı.
- Hatırlatma tarih/saat gösterimi netleştirildi.
- "Tüm Bildirimleri Kapat" yerine "Sonraki Bildirimleri Kapat" kullanıldı.
- Reminder popup yatay genişliği ve buton dizilimi iyileştirildi.
- Durum badge önündeki gereksiz dikey çizgi hatası düzeltildi.
- Test/build geçti.

## Önemli Ürün Kararları

- `3` tuşu kritik işlem kısayolu olarak kullanılmayacak.
- `Ctrl+S` ana güvenli kaydetme kısayolu olacak.
- `S` tek başına global kaydetme olmayacak.
- Textarea içinde yazı yazarken harf kısayolları çalışmayacak.
- Reminder kapatma reminder'ı `completed` yapmayacak.
- Reminder popup sadece oturum bazlı dismissed mantığıyla kapanacak.
- Popup'ta telefon gösterilmeyecek.
- Call log geçmişin ana kaynağı olmaya devam edecek.

## Sprint 6 İçin Önerilen Hedef

Detaylı Excel Export:

- Aday listesini Excel'e dışa aktarma
- Detaylı export formatı
- Öğrenci, veli, telefonlar, kampanya, durum, son arama sonucu, tekrar arama, randevu, notlar
- Dinamik arama kolonları:
  - Arama 1 Açıklaması
  - Arama 1 Sonuç
  - Arama 1 Tarih
  - Arama 1 Telefon
  - Arama 2 Açıklaması
  - devam eden arama kolonları
- Görüşme geçmişini exporta düzgün taşıma
- Filtrelenmiş listeyi export etme
- Tüm adayları export etme
- Export öncesi özet / onay
- Büyük veri için performanslı export
- Türkçe kolon başlıkları
- Dosya adı tarih/saat içersin

## Sprint 6'da Yapılmayacaklar

- VDS/senkronizasyon
- WhatsApp/SMS entegrasyonu
- Kullanıcı/profil sistemi
- Figma birebir UI alignment
- Gelişmiş rapor dashboard
- Büyük tasarım refactor

## Yeni Oturumda Devam Notu

Sprint 6'ya başlamadan önce bu checkpoint dosyası okunmalı.
Önce plan çıkarılmalı, onay alınmadan kod yazılmamalı.
