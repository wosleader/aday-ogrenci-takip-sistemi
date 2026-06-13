<!-- Son guncelleme: Detailed Export Guardian Names | Branch: sprint-9-2-multi-phone-architecture-plan -->

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
- [Sprint 9.3B-1] Call log ve reminder kayıtları için optional `phone_id` / `phone_snapshot` model alanları ile display/fallback helper’ları tamamlandı. Bu sprintte gerçek call log/reminder writer davranışı, UI, import/export, backup/restore ve storage migration değiştirilmedi. Sonraki sprint Sprint 9.3B-2 — Phone Context Persistence Wiring olarak planlanır.
- [Sprint 9.3B-2] Phone context persistence writer seviyesinde bağlandı. Call log ve pending reminder kayıtları optional `phone_id` / `phone_snapshot` taşıyabilir. `writeCallLog` içinde yeni pending reminder create ve mevcut pending reminder update akışları seçili telefon bağlamına göre güncellenir; yeni contacted phone yoksa eski phone context korunmaz ve `null` olur. UI display, import/export, backup/restore ve schema migration bu sprintte bilinçli olarak kapsam dışı bırakıldı.
- [Sprint 9.3C] Historical phone context display/read model'de snapshot öncelikli kabul edildi. Call history legacy contacted phone fallback'i korunur. Reminder list current phone lookup yapmaz; yalnızca reminder snapshot varsa context alanlarını doldurur. UI display, popup, alarm reader, import/export, backup/restore ve schema migration bu sprintte kapsam dışı bırakıldı.
- [Sprint 9.3D-1] Phone context UI display önce düşük riskli call history alanında başlatıldı. Sağ kişi kartındaki iletişim geçmişi, reader'ın ürettiği `phone_context_label` / `phone_context_number` alanlarını gösterir. Reminder list UI tablo/CSS/mobil riskleri nedeniyle ayrı sprintte ele alınacaktır. Büyük çoklu telefon sağ kişi kartı ve Excel çoklu telefon import roadmap'te kalır; bu sprintte kapsam dışıdır.
- [Sprint 9.3D-2] Reminder list UI'da yeni kolon eklenmeden mevcut Telefon 1 kolonu operasyonel olarak `Aranacak telefon` haline getirildi. Context varsa `phone_context_label` / `phone_context_number` gösterilir; context yoksa `phone_1` fallback'i korunur. Telefon 2 kolonu, CSS, reader/model, popup/alarm, import/export, backup/restore ve schema migration kapsam dışı tutuldu.
- [Sprint 9.3E-1] Sağ kişi kartı 3+ telefon UI'dan önce read model hazırlığı yapılmıştır. `StudentListRow` artık `phones`, `visible_phones` ve `hidden_phone_count` alanlarını taşır; ilk görünüm için `visible_phones` 3 telefon içerir ve fazla telefon sayısı `hidden_phone_count` ile verilir. Yanlış/geçersiz telefonlar read model'den düşürülmez; UI sprintinde badge/display kararı verilir. `phone_1`, `phone_2` ve `phone_count` geriye dönük uyumluluk için korunur. UI'ya bağlama Sprint 9.3E-2'ye bırakılmıştır.
- [Sprint 9.3E-1] Telefon 3+ seçiminin arama kaydıyla ilişkisi ayrı discovery gerektirir. Excel çoklu telefon import bu sprintin kapsamı değildir.
- [Sprint 9.3E-2] Telefon 1 / Telefon 2 mevcut aksiyonlu kartlar olarak korunmuştur. Telefon 3+ bu sprintte readonly / görüntüleme-only gösterilmiştir. Telefon 3+ için aksiyon/persistence eklenmemiştir. `+N numara daha göster` / `Daha az göster` davranışı sağ kişi kartında kabul edilmiştir. CSS değişikliği yapılmadan mevcut yapı içinde dar UI geçişi tercih edilmiştir. Telefon 3+ seçim/call log/validation/shortcut ilişkisi ayrı discovery gerektirir. Excel çoklu telefon import ayrı discovery/implementation gerektirir.
- [Sprint 9.3F-1] Telefon 3+ için yalnızca call save selection eklendi. Telefon 3+ selected phone state üzerinden `contacted_phone_id` olarak call log kaydına bağlandı. `callLogWriter` değiştirilmedi; mevcut dynamic phone context altyapısı kullanıldı. Schema/storage migration yapılmadı. Telefon 3+ için yanlış/kullanılmıyor aksiyonu ve son görüşülen status aksiyonu eklenmedi. Shortcut sistemi değiştirilmedi; T/Y/X mevcut Telefon 1/2 davranışını korur. Validation mesajı Telefon 1/2'ye özel olmaktan çıkarılıp genel hale getirildi. Telefon 3+ status aksiyonları ayrı discovery gerektirir. Excel çoklu telefon import ayrı discovery/implementation gerektirir.
- [Sprint 9.3G-2] Excel İçe Aktar ekranında progressive disclosure uygulanmıştır. Kolon Eşleştirme, Hatalar ve Uyarılar listeleri uzun olduğunda kademeli gösterilir; bu karar kullanıcıyı uzun import review listeleriyle boğmamak için alınmıştır. Import engine, writer, simulation ve mapping definitions değiştirilmemiştir. Telefon 3-10 mapping/import, AD/SOYAD, Anne/Baba ve Mahalle bu sprintin kapsamı değildir. Mahalle ve veli modeli gibi data-model işleri plansız şekilde UI sprintine karıştırılmamalıdır. Çoklu telefon import mapping/simulation ve çoklu telefon import writer ayrı sprint gerektirir. Export/report/backup uyumu ayrı discovery gerektirir.
- [Sprint 9.3G-4] Multi-phone import mapping/simulation uygulandı. Telefon 3-10 mapping key'leri eklendi. Simulation internal modeli `phones[]` array yaklaşımını taşır; `phone_1` / `phone_2` backward compatibility korunur. `importWriter.ts` değiştirilmedi; Telefon 3-10 gerçek DB yazımı bu sprintin kapsamı değildir. Schema/storage migration yapılmadı. Ad/Soyad, Anne/Baba, Mahalle, export/report/backup bu sprintin kapsamı değildir. Writer sprinti yapılmadan “Telefon 3-10 tam import edildi” denmemelidir. Obsidian resmi kayıt değildir; bu docs closure sonrası Obsidian update ayrıca değerlendirilir.
- [Sprint 9.3G-5] Multi-phone import writer/persistence uygulandı. Writer `row.phones[]` varsa Telefon 1-10 phone records yazar; `row.phones[]` yoksa `phone_1` / `phone_2` fallback korunur. `phone_label` ve `reference_label` birlikte yazılır; `priority`, `source_column`, `original_phone_value` ve `is_valid` korunur. Invalid ama non-empty phones DB'ye `is_valid: false` ve `is_wrong: false` olarak yazılır. `search_text`, `row.phones[]` içindeki tüm `normalized_phone_number` değerlerini içerir. Schema/storage/version değişmedi. Export/report/backup, Ad/Soyad, Anne/Baba ve Mahalle bu sprintin kapsamı değildir. Graphify pasif yardımcı analiz aracı olabilir ama resmi kayıt değildir; çıktısı doğrudan uygulanmaz/commit edilmez/Obsidian'a otomatik yazılmaz. Obsidian resmi kayıt değildir; repo docs resmi kayıttır. Dar pilot öncesi Telefon 3-10 import hattı ana eşik olarak tamamlanmıştır; pilot readiness için manual QA ve kırıcı risk kontrolü ayrıca yapılmalıdır.
- [Phone-Level Outcome Read Model Pilot] Telefon bazlı son görüşme sonucu ilk aşamada `call_logs` kaynaklı read model olarak uygulanmıştır. `PhoneRecord` üzerine kalıcı outcome alanı eklenmez, `phone_status` call result saklamak için yeniden anlamlandırılmaz ve schema migration yapılmaz. Sağ kartta Telefon 1/2 ve Telefon 3+ için read-only `Son sonuç` göstergesi gösterilir; kaynak önceliği `contacted_phone_id`, `phone_snapshot.phone_id`, `phone_id`, normalized phone number fallback şeklindedir.
- [Phone-Level Outcome Read Model Pilot] Sağ karttaki ✓ / x kontrolleri şimdilik korunur. ✓ son görüşülen/arama telefonu seçimi, x yanlış numara/kullanılmıyor davranışı olarak kalır. Bu kontrollerin sadeleştirilmesi veya phone-level outcome UI'a dönüştürülmesi ayrı bir discovery konusudur.
- [Roadmap] Akıllı Operasyon Yardımcıları gelecekte offline/rule-based/testable helper yaklaşımıyla değerlendirilebilir; Telefon Kalitesi, Arama Öncelik, Hatırlatma Öneri, Veri Kalitesi ve Yönetici Özet yardımcıları aday fikirlerdir. Dış AI/LLM ancak KVKK, gizlilik, offline-first ve maliyet discovery sonrasında ele alınır; mevcut 9.3G hattına dahil edilmez.
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

## Latest Decisions - Communication History Soft Delete

- [Communication History Soft Delete Pilot] Iletisim gecmisi silme davranisi hard delete degil soft delete olarak uygulanir. `call_logs.deleted_at` ve `updated_at` set edilir; kayit DB'de kalir ama aktif history/read model aklarindan gizlenir.
- [Communication History Soft Delete Pilot] Soft delete sonrasi ogrenci son gorusme ozeti kalan aktif `call_logs` kayitlarindan yeniden hesaplanir. `last_call_result`, `last_contacted_at`, `last_contacted_phone_id` aktif son kayda gore guncellenir; aktif kayit kalmazsa `not_called` / `null` guvenli bos durum kullanilir.
- [Communication History Soft Delete Pilot] `created_reminder_id` veya `created_appointment_id` bulunan call log kayitlari bu MVP'de silinmez. Reminder/appointment cascade delete, detach veya otomatik iptal yapilmaz; bu politika ayri discovery konusudur.

## Latest Decisions - Import AD/SOYAD Composition

- [Import AD/SOYAD Composition Pilot] Separate `AD` and `SOYAD` columns are supported only at import/simulation level. The persistent source of truth remains `students.student_full_name`; no `first_name` / `last_name` DB fields are added.
- [Import AD/SOYAD Composition Pilot] Full-name columns such as `Ad Soyad` / `Ogrenci Ad Soyad` win over split `AD` / `SOYAD`. If both are present, import continues with warning: `Tam ad alanı bulunduğu için Ad/Soyad alanları birleştirme için kullanılmadı.`
- [Import AD/SOYAD Composition Pilot] If only `AD` is present, import may create `student_full_name` from `AD` with warning: `Soyad alanı bulunamadı; öğrenci adı yalnızca Ad alanından oluşturuldu.`
- [Import AD/SOYAD Composition Pilot] If only `SOYAD` is present, the row is blocked with: `Soyad alanı tek başına öğrenci adı oluşturmak için yeterli değil.`
- [Import AD/SOYAD Composition Pilot] `Veli Adi`, `Anne adi`, and `Baba Adi` are not student name aliases. Anne/Baba guardian import, Mahalle/Ilce support, export/report changes, backup/restore changes, and schema changes remain out of scope.

## Latest Decisions - Parent / Location Import

- [Parent/Location Import Decision] Anne/Baba import will not be included in the next small import slice. It requires a later guardian/contact model decision before implementation.
- [Parent/Location Import Decision] Anne/Baba fields must never be used to compose `student_full_name`, and must not overwrite the existing `Veli Ad Soyad` / `guardian_full_name` behavior.
- [Parent/Location Import Decision] If Anne/Baba is implemented later, it should be modeled as related guardian/contact data with an explicit relation decision, not as a shortcut into the current primary Veli field.
- [Parent/Location Import Decision] Mahalle/Ilce is the accepted smaller next candidate, but must not be stored in `general_note` as a hack. If implemented, it likely needs explicit optional student fields.
- [Parent/Location Import Decision] Export, search, backup, and restore impact for Mahalle/Ilce must be accepted before implementation. No export/report/backup/schema behavior should be changed incidentally.
- [Parent/Location Import Decision] AD/SOYAD composition and Telefon 1-10 mapping/import/export behavior are protected and must remain unchanged in parent/location follow-up work.
- [Parent/Location Import Decision] `dev-server.log` is a local untracked runtime file. It must not be staged, committed, deleted, or treated as product documentation.

## Latest Decisions - Mahalle / Ilce Import Pilot

- [Mahalle/Ilce Import Pilot] Mahalle and Ilce are supported as optional student location fields: `neighborhood` and `district`.
- [Mahalle/Ilce Import Pilot] Location fields are stored directly on `StudentRecord` as optional non-indexed fields. Dexie schema version was not changed and `src/db/schema.ts` / `src/db/db.ts` remain unchanged.
- [Mahalle/Ilce Import Pilot] Mahalle/Ilce must not be stored in `general_note`.
- [Mahalle/Ilce Import Pilot] Empty Mahalle/Ilce, only Mahalle, and only Ilce are all allowed and do not block import.
- [Mahalle/Ilce Import Pilot] The student drawer may show a small read-only `Mahalle / Ilce` line when location data exists.
- [Mahalle/Ilce Import Pilot] AD/SOYAD composition, Telefon 1-10 slot fidelity, and Veli/Anne/Baba student-name safety behavior remain unchanged.
- [Mahalle/Ilce Import Pilot] Anne/Baba import and guardian/contact model changes remain deferred.
- [Mahalle/Ilce Import Pilot] Export expansion, report expansion, search/filter expansion, backup/restore behavior changes, province/address hierarchy, and indexed location fields remain out of scope.
- [Mahalle/Ilce Import Pilot] Do not immediately start Anne/Baba implementation. The next recommended step is `DISCOVERY — Agent Context / Repo Hygiene Standardization`.

## Latest Decisions - Playwright Import E2E Smoke Pilot

- [Playwright Import E2E Smoke Pilot] Browser-level automated QA is introduced as a narrow pilot, not as the full import regression matrix.
- [Playwright Import E2E Smoke Pilot] The first scope is one real-browser import smoke flow only: runtime-generated Excel upload, AD/SOYAD composition, Mahalle/Ilce, phone import, manual `Veli Adi` -> `Veli Ad Soyad` mapping, completing import, selecting the imported student, and checking right drawer values.
- [Playwright Import E2E Smoke Pilot] Runtime `.xlsx` fixtures are generated with the existing `xlsx` dependency. Binary Excel fixture files are not committed for the first pilot.
- [Playwright Import E2E Smoke Pilot] `test-results/` is generated test output and must stay ignored. `dev-server.log` remains a local untracked runtime file and must not be staged.
- [Playwright Import E2E Smoke Pilot] Full Telefon 1-10 E2E, Telefon 10-only, empty/partial Mahalle/Ilce, Anne/Baba safety, export E2E, backup/restore E2E, CI integration, and broad `data-testid` coverage are deferred to later phases.
- [Playwright Import E2E Smoke Pilot] Recommended next automated QA phase is `Phase 2 - Import Regression Matrix`.

## Latest Decisions - Playwright Import Regression Matrix Phase 2A

- [Playwright Import Regression Matrix Phase 2A] The original import smoke test remains intact; regression coverage is kept in the separate `e2e/import-regression.spec.ts` file.
- [Playwright Import Regression Matrix Phase 2A] The existing `qa:import:e2e` command is the single local import browser-QA command and runs both smoke and regression specs.
- [Playwright Import Regression Matrix Phase 2A] The first regression matrix is deliberately limited to three high-value scenarios: Telefon 1-10 preservation, empty Mahalle/Ilce acceptance with no empty drawer line, and Anne/Baba student-name safety.
- [Playwright Import Regression Matrix Phase 2A] Runtime Excel generation remains the fixture strategy. Binary `.xlsx` files are not committed.
- [Playwright Import Regression Matrix Phase 2A] Import E2E uses one Playwright worker for stability. Broad selector instrumentation and CI integration are deferred until real flakiness or pipeline need appears.
- [Playwright Import Regression Matrix Phase 2A] This automated QA expansion does not authorize production import logic, schema, export, backup, restore, or UI behavior changes.
- [Playwright Import Regression Matrix Phase 2A] Telefon 10-only, only-Mahalle, only-Ilce, invalid/duplicate phone, duplicate import warning, export E2E, and backup/restore E2E remain later candidates.

## Latest Decisions - Guardian Contact Model

- [Guardian Contact Model Decision] Anne/Baba/Veli bilgileri için mevcut `guardians` tablosu kullanılacaktır. Yeni `guardian_contacts` tablosu veya `StudentRecord` üzerinde tekrar eden parent alanları oluşturulmayacaktır.
- [Guardian Contact Model Decision] İlişki anahtarları `guardian` = Veli, `mother` = Anne ve `father` = Baba olarak standartlaştırılacaktır. Legacy `relation_type: null` kayıtları geriye uyumluluk için Veli kabul edilecektir.
- [Guardian Contact Model Decision] Aynı ad Veli ve Anne/Baba kolonlarında bulunsa bile yalnızca isim benzerliğine göre birleştirme veya ilişki tahmini yapılmayacaktır; kaynak kolon semantiği korunacaktır.
- [Guardian Contact Model Decision] Anne Adı, Baba Adı ve Veli Ad Soyad hiçbir koşulda öğrenci adı kaynağı değildir. Öğrenci adı yalnızca onaylı öğrenci adı kolonlarından oluşturulur; öğrenci adı olmayan satır parent bilgileriyle öğrenci oluşturamaz.
- [Guardian Contact Model Decision] İlk kod dilimi yalnızca Anne/Baba isimlerini kapsayacaktır: import mapping, simulation, guardian persistence, reader ayrıştırması ve sağ kartta yalnızca dolu Veli/Anne/Baba satırları. Parent phone relation, export ve backup değişiklikleri bu dilime dahil değildir.
- [Guardian Contact Model Decision] UI'da `ilişki bilinmiyor`, `unknown relation`, `ilişkilendirilmiş telefon yok` veya `telefon yok` gibi teknik/boş durum metinleri gösterilmeyecektir.
- [Guardian Contact Model Decision] Generic `GSM`, `Tel1`, `Telefon 3` gibi telefon kolonları Anne/Baba olarak yorumlanamaz. Yalnızca açık `ANNE TEL` / `BABA TEL` benzeri kolonlar ileride ilişki etiketi taşıyabilir.
- [Guardian Contact Model Decision] Numaralı telefon kolonları ilan edilen slotu korur. Numarasız ve ilişki belirten telefon kolonları Excel kolon sırasına göre sonraki boş Telefon N slotuna yerleşir; Anne/Baba telefonları Telefon 1/2'ye sıkıştırılmaz.
- [Guardian Contact Model Decision] `No`, telefon aliası değildir. `No1/No2/Numara N` ailesi öğrenci numarasıyla karışabileceği için ancak dar eşleştirme ve açık testlerle değerlendirilecektir.
- [Guardian Contact Model Decision] Detaylı export ve Özet Görüşme Raporu ileride Anne Adı/Baba Adı ile Telefon 1-10'u taşıyacak şekilde genişletilecektir. İlişki durumu veya bilinmeyen ilişki kolonları eklenmeyecektir.
- [Guardian Contact Model Decision] Tam Sistem Yedeği eksiksiz restore kaynağıdır. Mevcut `guardians` ve `phones` tabloları yeniden kullanılacak; ileride açık backup/restore roundtrip testi eklenecektir.
- [Guardian Contact Model Decision] `Telefonsuz adayları içe aktar` ayarı ilk sürümde import oturumuna özel ve varsayılan kapalı olacaktır. Ayar kapalıyken telefonsuz aday bloklanır; açıkken warning ile içe alınabilir. Öğrenci adı olmayan satır her durumda bloklanır.

## Latest Decisions - Guardian Parent Names Import Pilot

- [Guardian Parent Names Import Pilot] Anne/Baba names-only import tamamlandı. Kalıcı kaynak mevcut `guardians` tablosudur; `StudentRecord` üzerine duplicate parent alanları ve yeni tablo eklenmedi.
- [Guardian Parent Names Import Pilot] Import mapping `mother_full_name` ve `father_full_name` hedeflerini taşır. Anne/Baba/Veli alanları öğrenci adı composition kaynağı değildir; öğrenci adı olmayan satır parent bilgileriyle oluşturulmaz.
- [Guardian Parent Names Import Pilot] Writer Veli, Anne ve Baba için `guardian`, `mother`, `father` relation kayıtlarını ayrı oluşturur. İsim eşitliğine göre relation merge veya tahmin yapılmaz.
- [Guardian Parent Names Import Pilot] Generic telefonlar Anne/Baba kayıtlarına atanmaz. Explicit ANNE TEL/BABA TEL mapping ve doğru parent `guardian_id` bağlantısı sonraki dilimdir.
- [Guardian Parent Names Import Pilot] Student reader relation-aware çalışır ve legacy `relation_type: null` kayıtlarını Veli kabul eder.
- [Guardian Parent Names Import Pilot] Sağ drawer yalnızca dolu `Veli Ad Soyad`, `Anne Adı`, `Baba Adı` satırlarını gösterir; boş veya teknik relation/no-phone metni göstermez.
- [Guardian Parent Names Import Pilot] Schema, export, backup/restore, no-phone import setting, source-column display ve Playwright senaryoları değiştirilmedi.
- [Guardian Parent Names Import Pilot] Sonraki önerilen kod dilimi explicit ANNE TEL/BABA TEL phone relation'dır; Telefon 1-10 slot fidelity korunmalı ve generic kolonlardan parent ilişkisi çıkarılmamalıdır.

## Latest Decisions - Explicit Guardian Phone Relations Pilot

- [Explicit Guardian Phone Relations Pilot] Yalnizca acik Anne/Baba telefon kolonlari parent relation metadata uretebilir. `ANNE TEL`, `Anne GSM`, `BABA TEL`, `Baba GSM` gibi aliaslar desteklenir; generic `GSM`, `GSM2`, `Tel1`, `Telefon 1` Anne/Baba olarak yorumlanmaz.
- [Explicit Guardian Phone Relations Pilot] Parent relation kolonu ozel bir Telefon slotu zorlamaz. Excel kolon sirasi ve sonraki uygun Telefon N allocator kurali uygulanir; existing Telefon 1-10 fidelity korunur.
- [Explicit Guardian Phone Relations Pilot] Anne/Baba adi varsa explicit phone ilgili mother/father guardian kaydina baglanir. Ad yoksa fake guardian olusturulmaz; relation label saklanir ve `guardian_id: null` kullanilir.
- [Explicit Guardian Phone Relations Pilot] Anne/Baba/Veli isimleri ve parent phone alanlari ogrenci adi composition kaynagi degildir. No-student-name guvenlik kurali korunur.
- [Explicit Guardian Phone Relations Pilot] Mevcut `guardians` ve `phones` tablolari kullanilir; yeni table veya schema version eklenmez.
- [Explicit Guardian Phone Relations Pilot] Export, backup/restore, no-phone import setting, broad source-column UI ve yeni Playwright senaryolari bu dilimin disindadir.
- [Explicit Guardian Phone Relations Pilot] Riskli `No1/No2/Numara N` alias ailesi false-positive riski nedeniyle ertelenmistir.
- [Explicit Guardian Phone Relations Pilot] Sonraki onerilen dilim export ve backup/restore garantileridir; export Telefon 1-10 slot fidelity'yi bozmamali ve Full System Backup, Excel exporttan ayri restore kaynagi olarak kalmalidir.

## Latest Decisions - Detailed Export Guardian Names

- [Detailed Export Guardian Names] Detaylı Excel Export relation-aware `Veli Ad Soyad`, `Anne Adı` ve `Baba Adı` kolonlarını taşır. Anne/Baba kolonları Veli kolonunun hemen arkasında yer alır; mevcut `Veli Ad Soyad` adı değiştirilmez.
- [Detailed Export Guardian Names] `relation_type: guardian` ve legacy `relation_type: null` Veli, `mother` Anne, `father` Baba kabul edilir. Export ilk oluşturulan guardian kaydını körlemesine Veli saymaz.
- [Detailed Export Guardian Names] Aynı relation türünde birden fazla aktif kayıt varsa kararlı seçim `created_at`, ardından `id` sırasındaki ilk kayıtla yapılır. Eksik Anne/Baba değerleri boş hücre olarak export edilir.
- [Detailed Export Guardian Names] Telefon 1-10 slot fidelity korunur. Parent relation telefonları mevcut Telefon N slotlarında kalır; `Anne Telefonu` veya `Baba Telefonu` gibi ayrı kolonlar eklenmez.
- [Detailed Export Guardian Names] Summary export, backup/restore, import, schema, sağ drawer/UI ve Playwright bu dilimde değiştirilmemiştir. `Veli Bilgisi` UI grup etiketi ayrı karardır.
- [Detailed Export Guardian Names] Sonraki önerilen dilim Full System Backup guardian/phone relation roundtrip garantisidir. Önce `tests/settings/backupRestore.test.ts` ile test-first ilerlenir; gerçek açık bulunmadıkça `src/db/backup.ts` değiştirilmez.
- [Detailed Export Guardian Names] Summary export Telefon 1-10 genişletmesi ayrıdır. Lossless/compact kapsamı ve Telefon 3-10 durum kolonları hakkında açık insan kararı olmadan summary export değiştirilmez.
