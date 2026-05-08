# Aday Öğrenci Takip Sistemi - Sprint 3 Checkpoint

## Repo ve Branch

- Repo URL: https://github.com/wosleader/aday-ogrenci-takip-sistemi
- Aktif branch: `sprint-3-real-import`
- Son commit: `3cc22d2 feat: add confirmed indexeddb import flow`
- Tarih/saat: `2026-05-08 22:05:55 +03:00`

## Tamamlanan Sprintler

- Sprint 0: React + Vite + TypeScript + PWA iskeleti kuruldu.
- Sprint 1: IndexedDB/Dexie veri modeli, domain modelleri, seed, varsayılan ayarlar ve JSON backup çekirdeği hazırlandı.
- Sprint 2: Excel import simülasyonu, ilk worksheet okuma, kolon eşleştirme, telefon/tarih/kampanya normalizasyonu eklendi.
- Sprint 2.1: Başlık satırı algılama, manuel kolon eşleştirme, sessionStorage kalıcılığı ve log spam azaltma tamamlandı.
- Sprint 2.2: Import log UX, TXT log dışa aktarma, teknik destek paketi ve gizlilik korumalı log eklendi.
- Sprint 3: Kullanıcı onaylı gerçek IndexedDB import akışı tamamlandı.

## Sprint 3 Kapsamı

- `İçe Aktar` butonu aktif edildi.
- Kullanıcı onayıyla gerçek import yapılıyor.
- Import öncesi JSON backup alınıyor.
- `students`, `guardians`, `phones`, `reminders`, `imports`, `import_logs`, `audit_logs` tablolarına transaction içinde yazılıyor.
- Duplicate guard eklendi.
- Aynı dosya/sheet/fingerprint şüphesinde uyarı veriliyor.
- Otomatik merge yapılmıyor.
- Import sonucu özet gösteriliyor.
- `Aday Listesine Git` butonu eklendi.
- Test ve build geçti.

## Gerçek Excel Test Sonucu

Test dosyası: `ATATÜRK AL-2024 GÜNCEL (4).xlsx`

- Toplam satır: 1163
- Okunacak satır: 1162
- İçe aktarılmayacak satır: 1
- Telefon bilgisi eksik kayıt: 22
- Telefon 1 boş, alternatif telefon var: 22
- Telefon 1 ve Telefon 2 boş: 0
- Kampanyası Diğer yapılacak: 1162
- Varsayılan saat atanacak: 12
- Okunan worksheet: `Worksheet`
- Yok sayılan worksheet: `SMS`
- Algılanan başlık satırı: 2

## Önemli Proje Kararları

- İlk worksheet okunacak, diğer sekmeler yok sayılacak.
- Varsayılan kampanya: `Diğer`.
- `Normal` kampanyası kullanılmayacak.
- Tekrar arama tarihi var ama saat yoksa `11:00` atanacak.
- Arama saatleri varsayılan `10:00 - 18:00`.
- `3` tuşu varsayılan kritik kısayollarda kullanılmayacak.
- Klavye kısayolları atanabilir/değiştirilebilir olacak.
- Anne/Baba için aynı telefon aynı satırda hata sayılmayacak.
- Bir veli telefonu boş olabilir.
- Mükerrer kontrol farklı satırlardaki aynı telefon ve aynı öğrenci+veli tekrarları için yapılacak.
- Arama açıklamaları kronolojik tutulacak.
- Detaylı export tercih ediliyor.
- Uygulama düşük kaynak tüketimli, mobil uyumlu ve eski bilgisayarlarda çalışabilir olmalı.
- Son kullanıcıya ileride kaynak kod klasörü değil, `Setup.exe` veya portable paket verilecek.

## Branch Yapısı

- `master`: Sprint 0 + Sprint 1 temiz başlangıç.
- `sprint-2-2-import-log-ux`: Sprint 2 + Sprint 2.1 + Sprint 2.2.
- `sprint-3-real-import`: Sprint 3 tamamlandı.

## Sprint 4 Önerilen Hedef

Sprint 4 için önerilen hedef: Aday Listesi Veri Akışı.

- Imported students verisini IndexedDB'den okuyup Aday Listesi ekranında göstermek.
- `students + guardians + phones` birleşik liste görünümü oluşturmak.
- Arama kutusu eklemek.
- Basit filtreleri eklemek.
- Telefon eksik, mükerrer ve tekrar aranacak göstergelerini hazırlamak.
- Aday detayına veya arama ekranına geçiş hazırlığı yapmak.

## Sprint 4'te Yapılmayacaklar

- Gerçek arama kaydı oluşturma.
- Randevu oluşturma akışı.
- Detaylı Excel export.
- VDS/senkronizasyon.
- Kullanıcı/profil sistemi.
- WhatsApp/SMS entegrasyonu.
- Büyük UI refactor.
- Yeni paket kurulumu.

## Yeni Oturumda Devam Notu

- Sprint 4'e geçmeden önce bu checkpoint dosyası okunmalı.
- Önce plan çıkarılmalı.
- Onay alınmadan kod yazılmamalı.
- Sprint 4 kapsamı Aday Listesi veri akışıyla sınırlı tutulmalı.
