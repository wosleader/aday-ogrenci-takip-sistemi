# UI Baseline Before Figma/Stitch

## Amaç

Bu doküman, Figma/Stitch tabanlı UI fikirleri uygulanmadan önceki mevcut çalışan tasarım ve düzenin güvenli dönüş noktasıdır.

## Referans Commit

- Branch: sprint-6-detailed-excel-export
- Commit: d8c57e2 feat: add detailed export and improve call workflow feedback

## Mevcut UI Düzeni

- Sol menü açılıp kapanabilir.
- Sağ kişi kartı açılıp kapanabilir.
- Aday listesi mevcut tablo/operasyon listesi karışımı yapıda çalışır.
- Telefon 1 ve Telefon 2 ayrı görünür.
- ✓ = son görüşülen / iletişim kurulan numara.
- x = yanlış numara / kullanılmıyor.
- Açıklama / Not kolonu vardır.
- Mükerrer telefon filtresi grup mantığıyla gösterilir.
- 100 kayıt/sayfa mantığı korunur.
- Sağ alt toast validasyon/başarı/hata mesajları için kullanılır.
- Reminder popup üst merkezde görünür.
- Export ekranı detaylı export ve filtrelenmiş export destekler.
- Ayarlar > Veri Yönetimi içinde Tam Sistem Yedeği dili kullanılır.

## Mevcut İşlevler

- Excel import
- Duplicate import modal uyarısı
- Gerçek IndexedDB import
- Aday listesi
- Sağ kişi kartından görüşme kaydı
- Kaydet ve sonrakine geç
- call_logs geçmişi
- Reminder oluşturma/güncelleme
- Reminder popup/ses
- Klavye kısayolları
- Detaylı Excel export
- Filtrelenmiş liste export
- Tam aday temizleme / veri yönetimi

## Figma/Stitch Prototipinden Alınması Düşünülen Fikirler

- Öğrenci + veli tek hücre
- Telefon 1 + Telefon 2 tek telefon bloğu
- Sınıf + grup tek hücre
- Daha az kolonlu operasyon listesi
- Sağ kişi kartında sekmeler:
  - Görüşme Kaydet
  - Bilgiler
  - Geçmiş
- Görüşme sonucu select yerine buton grid
- Üst operasyon sayaçları
- Mükerrerler ayrı sayfa
- Günlük rapor ekranı
- Sol menü altına günlük mini özet

## UI Değişiklik Uygulama Kuralı

Figma/Stitch kaynaklı UI değişiklikleri tek seferde büyük refactor olarak uygulanmayacak.
Her değişiklik ayrı küçük tur olarak yapılacak.
Her tur sonunda kullanıcıya şu sorular sorulacak:

- Bu değişiklik Figma/Stitch mockup'tan alınmıştı. Nasıl olmuş?
- Devam edelim mi?
- Memnun musun?
- Geri almak veya düzeltmek istediğin yer var mı?

Kullanıcı onayı alınmadan bir sonraki Figma/Stitch kaynaklı UI değişikliğine geçilmeyecek.

## Korunacak Kritik Davranışlar

- Import akışı bozulmayacak.
- Aday listesi veri akışı bozulmayacak.
- Telefon ✓ / x mantığı bozulmayacak.
- Kaydet ve sonrakine geç bozulmayacak.
- call_logs geçmişi bozulmayacak.
- Reminder popup/ses bozulmayacak.
- Export servisleri bozulmayacak.
- Klavye kısayolları bozulmayacak.
- Veri yönetimi / Tam Sistem Yedeği dili korunacak.

## Geri Dönüş Planı

Figma/Stitch UI değişikliği memnun etmezse bu baseline commit referans alınarak geri dönülebilir.
UI değişiklikleri ayrı branch'te yapılmalı.
