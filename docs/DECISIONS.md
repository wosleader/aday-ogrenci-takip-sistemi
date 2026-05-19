<!-- Son güncelleme: Sprint 9.3B-1 Phone Context Model Helpers | Branch: sprint-9-3b-1-phone-context-model-helpers -->

# DECISIONS — Aday Öğrenci Takip Sistemi

## Amaç

Bu dosya kritik ürün kararları için kısa karar günlüğüdür. Ayrıntılı sprint geçmişi için checkpoint dosyaları, güncel kısa bağlam için `docs/PROJECT_MEMORY.md` kullanılır.

## Aktif Kararlar

- [Sprint 6] Excel export raporlama/paylaşım içindir; eksiksiz geri yükleme için Tam Sistem Yedeği kullanılır.
- [Sprint 6] Ana UI’da “JSON yedek” gibi teknik ifade gösterilmez; kullanıcı dili “Tam Sistem Yedeği” olur.
- [Sprint 6.1] Arama operasyonu Aday Listesi + sağ kişi kartı üzerinden yürür; eski Arama Ekranı menüsü gizlidir.
- [Sprint 6.1] `/students` ekranında global arama dropdown’ı açılmaz; üst arama sadece listeyi filtreler.
- [Sprint 6.1] Üst bardaki Excel içe/dışa aktar butonları kaldırılmıştır; işlemler sol menüdedir.
- [Sprint 6.1] Tek aday silme sağ kişi kartındaki üç nokta menüsündedir.
- [Sprint 6.2] Detaylı Excel Export korunur; Özet Görüşme Raporu sade paylaşım raporudur.
- [Sprint 7] Restore replace mode’dur; merge mode henüz yoktur.
- [Sprint 7] Restore için `GERİ YÜKLE` yazı doğrulaması gerekir.
- [Sprint 8.1] Filtre adı Sınıf / Şube’dir; `current_class` + `student_group` birlikte yorumlanır.
- [Sprint 8.1] Durum chipleri Durum Filtresi dropdown’ına taşınmıştır.
- [Sprint 8.6] Günlük rapor kırılımları `call_logs.call_result` üzerinden hesaplanır: `reached`, `not_reached`, `call_later`, `appointment`, `registered`, `do_not_call`/`not_interested`, `wrong_number`. Günlük tarih filtresinde `call_time` birincildir; yoksa `created_at` kullanılır. Raporlar sayfası Excel export’un yerine geçmez; detaylı paylaşım için Detaylı Excel Export ve Özet Görüşme Raporu korunur.
- [Sprint 8.7] Responsive Layout Polish düşük riskli CSS ağırlıklı yaklaşımla yapıldı. Dar ekranlarda tablo/kart/filtre/dropdown taşmasını azaltmak için yatay scroll, min-width, breakpoint ve wrap düzenleri kullanıldı. Alt kısayol barı, mobil drawer ve mobil kart tablo dönüşümü ayrı sprintlere bırakıldı.
- [Sprint 8.8] Aday Listesi alt kısayol yardım barı varsayılan olarak kompakt/açılır-kapanır hale getirildi. Açık/kapalı tercih localStorage key’i `aots-shortcut-help-expanded` ile saklanır. Bu sadece UI tercihidir; kısayol registry, keyboard handler ve kısayol ayar mantığı değiştirilmedi.
- [Sprint 8.9] Pilot öncesi kullanıcıya görünen teknik metinler sadeleştirildi. “Import” yerine “İçe Aktarma”, teknik “JSON yedek” dili yerine kullanıcı dostu güvenlik yedeği/Tam Sistem Yedeği dili, Raporlar’da tarih seçimine uygun “Seçilen gün...” dili ve Ayarlar’da Türkçe hatırlatma dili kullanılacak. İş mantığı değiştirilmedi.
- [Sprint 9.0] Pilot öncesi kullanıcı dokümantasyonu iki dosya halinde tutulacak: `USER_GUIDE.md` son kullanıcı kitapçığı, `PILOT_MANUAL_TEST_CHECKLIST.md` geliştirici/operasyon manuel test checklist’i. Kod mantığı değişmeyecek.
- [Sprint 9.1] Manuel pilot testte bulunan PF-001, PF-002, PF-003 ve PF-004 kapatıldı. Route/menu değişiminde global arama dropdown’ı kapanır; restore yanlış dosya ve başarı durumları görünür alertdialog ile kullanıcıya bildirilir; sağ drawer sıkışması düşük riskli CSS ile hafifletildi. Backup/restore transaction mantığı, global arama temel davranışı ve Aday Listesi tablo mimarisi değiştirilmedi.
- [Pilot RC] Sprint 9.1 sonrası sistem küçük ölçekli pilot kullanım için release candidate kabul edilir. Manuel pilot testte bulunan PF-001, PF-002, PF-003 ve PF-004 kapatıldı. Pilot; küçük veri seti, kullanım kitapçığı, manuel checklist ve düzenli Tam Sistem Yedeği alma şartıyla başlatılabilir.
- [Pilot v1.0] Sprint 9.1 sonrası sistem küçük ölçekli kontrollü pilot kullanım için hazır kabul edilir. Pilot; küçük veri seti, Kullanım Kitapçığı, Pilot Manuel Test Checklist ve düzenli Tam Sistem Yedeği alma şartlarıyla başlatılacaktır.
- [Pilot Run] Pilot v1.0 gerçek kullanım denemesi yapılmıştır. Yeni engelleyici sorun bildirilmezse sistem küçük ölçekli kontrollü kullanımda izlenmeye devam eder; yeni bulgular ayrı Pilot Feedback Fixes kapsamında ele alınır.
- [Pilot UI Polish] Pilot izleme sırasında bulunan küçük UI/UX bulguları PF-006–PF-012 olarak kapatıldı. Export kapsam açıklamaları netleştirildi, sol menü L/H kısayolları çalışır hale getirildi, Raporlar/Hatırlatmalar scroll polish’i yapıldı, kısayol ayar butonları ve sol menü kısayol bilgilendirmesi iyileştirildi. Reports Dashboard Polish ayrı roadmap maddesi olarak kalır.
- [Sprint 9.2] Çoklu Telefon Mimarisi için plan yapıldı. Sabit 10 telefon kutusu gösterilmeyecek; telefonlar dinamik liste olarak tutulacak. Sağ kişi kartında ilk 2-3 telefon hızlı görünür, fazlası “+N numara daha göster” ile açılır. Telefonlar Telefon N referans etiketi, ilişki etiketi, durum, `source_column`, `phone_id` ve `phone_snapshot` mantığıyla yönetilecek. Call log ve reminder kayıtları seçili telefon bağlamını koruyacak. Export sade/detaylı ayrımıyla tasarlanacak. Mobil/responsive polish çoklu telefon UI sonrası ayrı ele alınacak.
- [Sprint 9.3A] Çoklu telefon core model ve compatibility helper altyapısı eklendi. `PhoneRelationLabel`, `PhoneOperationalStatus`, `PhoneSnapshot`, Telefon N referans etiketi, ilişki etiketi display helper’ı, legacy Telefon 1/2’den dinamik telefon listesi üretimi, phones list’ten Telefon 1/2 compatibility slotları ve helper düzeyi tekilleştirme hazırlanır. UI, import/export, call log writer, reminder writer, backup/restore ve migration davranışları bu sprintte değiştirilmez.
- [Sprint 9.3A] Call log/reminder phone context persistence, backup/restore migration ve UI entegrasyonu bilinçli olarak bu sprintin dışında bırakıldı. Call log/reminder phone context Sprint 9.3B’de, import/export ve UI işleri sonraki çoklu telefon sprintlerinde ele alınacak.
- [Sprint 9.3B-1] Call log ve reminder kayıtları için optional `phone_id` / `phone_snapshot` model alanları ile display/fallback helper’ları hazırlanır. Bu sprintte gerçek call log/reminder writer davranışı, UI, import/export, backup/restore ve storage migration değiştirilmez.
- [Roadmap] Kullanım kitapçığı pilot öncesi hazırlanacak.
- [Roadmap] Manuel pilot kontrol checklist’i çalıştırılacak.
- [Roadmap] Pilot sonrası bulgular ayrı Pilot Feedback Fixes kapsamında ele alınacak.
- [Roadmap] Reports Dashboard Polish pilot sonrası ayrı sprint olarak değerlendirilecek.
- [Roadmap] Mobile Drawer Polish ayrı sprint olarak yapılacak.
- [Roadmap] Mobile Table/Card View Polish ayrı sprint olarak değerlendirilecek.
- [Roadmap] Çoklu Telefon Mimarisi uygulaması Sprint 9.3–9.6 olarak parçalara bölünecek: Çoklu Telefon Core, Import / Duplicate / Export, UI / Sağ Kişi Kartı ve Responsive Polish.
- [Roadmap] Akıllı Yardımcılar offline/kural tabanlı olacak; dış AI API kullanılmayacak.
- [Roadmap] Figma/Stitch UI fikirleri kontrollü uygulanacak; büyük dönüşüm kullanıcı onayı olmadan yapılmayacak.

## Değişen Kararlar Nasıl Yazılır?

Bir karar değişirse eski madde silinmeden “Eski karar / Yeni karar / Neden değişti” şeklinde kısa not eklenir.
