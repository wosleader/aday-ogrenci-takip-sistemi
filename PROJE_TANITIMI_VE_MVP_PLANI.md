# Aday Öğrenci Takip Sistemi

## Proje Tanımı

**Aday Öğrenci Takip Sistemi**, YKS ve LGS hazırlık kursları için geliştirilecek, Excel tabanlı aday öğrenci/veli arama listelerini CRM mantığıyla yöneten, internet yokken de çalışabilen, düşük kaynak tüketimli ve kullanıcı dostu bir takip sistemidir.

Bu sistemin temel amacı; Excel'den gelen aday öğrenci ve veli datalarının içeri aktarılması, sıra sıra aranması, her aramanın ayrı kayıt altına alınması, tekrar arama hatırlatmaları oluşturulması, kurs içi randevuların takip edilmesi ve tüm verilerin detaylı Excel formatında dışa aktarılmasıdır.

Sistem özellikle hızlı arama operasyonları için tasarlanacaktır. Arama yapan kişi en az tıklamayla, mümkün olduğunca klavye üzerinden işlem yapabilecek; öğrenci, veli, telefonlar ve açıklamalar tek ekranda rahat okunabilecektir.

---

## Ana Kullanım Senaryosu

Kursa ait Excel dosyasında potansiyel öğrenci ve veli bilgileri bulunur. Bu dosya sisteme aktarılır. Arama personeli adayları sırayla arar, görüşme sonucunu seçer, not girer, gerekirse tekrar arama tarihi veya kurs içi randevu oluşturur. Her arama ayrı kayıt olarak tutulur. Daha sonra sistemden detaylı Excel raporu alınabilir.

---

## Temel Kararlar

- Sistem adı: **Aday Öğrenci Takip Sistemi**
- İlk sürüm: Tek bilgisayar odaklı, offline-first web/PWA uygulaması
- İnternet yokken çalışacak
- İnternet gelince ileride yedek/senkronizasyon desteği eklenebilecek
- İlk sürümde herkes tüm listeyi görecek
- Şimdilik gelişmiş kullanıcı profili/rol sistemi olmayacak
- İleride kullanıcı grupları, profiller ve VDS entegrasyonu eklenebilir
- LGS ve YKS aynı sistemde takip edilecek
- Kategoriler: LGS, YKS, Diğer
- İncelenen Excel dosyasındaki öğrenciler varsayılan olarak **11. sınıf YKS hazırlık** kabul edilecek
- Excel'de sadece ilk sekme / Worksheet referans alınacak
- İkinci sekme yok sayılacak
- Detaylı Excel export tercih edilecek
- Kampanya tanımı varsayılanı: **Diğer**
- **Normal** adlı kampanya tanımı kullanılmayacak
- Kampanya tanımları kullanıcı tarafından sonradan eklenip düzenlenebilecek
- WhatsApp/SMS entegrasyonu ilk sürümde olmayacak, sonraki aşamaya kalacak
- Aramalar genellikle 10:00 sonrası yapılır, 18:00 sonrası yapılmaz; bu saat aralığı ayarlardan değiştirilebilir olacak
- Tekrar aranacak tarihi var ama saati yoksa varsayılan saat **11:00** atanacak ve bu durum loglanacak

---

## Excel Dosyası Analizi Özeti

İncelenen dosya: `ATATÜRK AL-2024 GÜNCEL (4).xlsx`

Ana çalışma sayfası: `Worksheet`

İkinci sekme: yok sayılacak.

### Beklenen Kolonlar

| Excel Kolonu | CRM Alanı | Not |
|---|---|---|
| Sınıf - 1. kolon | Mevcut Sınıf | Data geldiği tarihte öğrencinin sınıfı |
| Sınıf - 2. kolon | Öğrenci Grubu | Kullanıcı tarafından eklenen grup alanı |
| Ad Soyad | Öğrenci Ad Soyad | Ana aday kaydı |
| Veli Ad Soyad | Veli Ad Soyad | İlk veli bilgisi |
| Telefon | Telefon 1 | Veli 1 veya ana telefon |
| 2. Telefon | Telefon 2 | Veli 2 veya alternatif telefon |
| Ulaşıldı mı | Son Arama Durumu | Boşsa Aranmadı |
| Tekrar arancak mı? | Tekrar Aranacak mı? | Yazım hatası otomatik tanınıp eşleştirilecek |
| AÇIKLAMA / AÇIKLAMA-2026 | Genel Not / İlk Açıklama | Arama geçmişine başlangıç notu olarak alınabilir |
| Tekrar Aranacak Tarih | Hatırlatma tarihi | Saat yoksa 11:00 atanacak |
| Kampanya Tanımı | Kampanya | Yoksa Diğer atanacak |

### Özel Excel Kuralları

- İlk sekme referans alınacak.
- Kolon başlıklarında yazım hatası varsa sistem otomatik tanıyacak.
- Örnek: `Tekrar arancak mı?` başlığı `Tekrar aranacak mı?` alanıyla otomatik eşleştirilecek.
- Bu tür otomatik düzeltmeler import logunda gösterilecek.
- Kolon bulunamazsa reaktif kolon eşleştirme ekranı açılacak.
- Import öncesi ilk 20 satır ön izleme gösterilecek.
- Import sonunda detaylı log gösterilecek.

---

## Kritik Kullanıcı Deneyimi Kararları

Sistem çok hızlı kullanılmalıdır.

Ana hedefler:

- En az tıklamayla işlem
- Klavye odaklı kullanım
- Atanabilir/değiştirilebilir klavye kısayolları
- Büyük ve okunaklı aday kartı
- Telefon 1, Telefon 2, öğrenci adı, veli adı ve açıklamanın tek tarafta rahat okunması
- Arama yapan kişinin hızlıca sonucu seçip sıradaki adaya geçebilmesi
- Düşük kaynak tüketimi
- Eski/kötü bilgisayarlarda bile hızlı açılma
- Mobil uyumlu arayüz

---

## Varsayılan Klavye Kısayolları

Kullanıcının klavyesinde `3` tuşu sorunlu olduğu için kritik işlem kısayollarında `3` kullanılmayacak.

| Kısayol | İşlem |
|---|---|
| N | Sıradaki adaya geç |
| 1 | Ulaşılamadı |
| 2 | Görüşüldü |
| 4 | Sonra aranacak |
| 5 | Randevu ver |
| 6 | Aranmayacak |
| 7 | Yanlış numara |
| 8 | Kayıt oldu |
| A | Açıklama / not alanına git |
| T | Tekrar arama tarihi seç |
| R | Randevu ekranını aç |
| F | Ara |
| K | Kampanya seç |
| D | Düzenle |
| Ctrl + S | Kaydet |
| Esc | İptal / pencereyi kapat |
| Enter | Onayla |

Kısayollar ayarlardan değiştirilebilir olmalıdır. Aynı kısayol iki işleme atanırsa sistem uyarı vermelidir.

---

## MVP Kapsamı

İlk çalışan sürümde bulunacak özellikler:

- Excel içeri aktarma
- İlk sekmeyi otomatik okuma
- Kolon eşleştirme
- Yazım hatalı kolonları otomatik tanıma
- Import ön izleme
- Import log ekranı
- Aday öğrenci listesi
- LGS/YKS kategori ayrımı
- Öğrenci grubu alanı
- Kampanya tanımı alanı
- Kampanya tanımı ekleme/düzenleme
- Öğrenci detay kartı
- Birden fazla veli/telefon desteği
- Telefon ve veli bilgisi düzenleme
- Arama sonucu seçme
- Her arama için ayrı not tutma
- Arama açıklamalarını kronolojik gösterme
- Tekrar arama tarihi/saat belirleme
- Saat yoksa 11:00 varsayılan atama
- Hatırlatma listesi
- Kurs içi randevu oluşturma
- Randevu durumu takip etme
- Arama geçmişi
- Liste içinde arama
- Filtreleme
- Mükerrer kayıt kontrolü
- Mükerrer kayıtlara tıklayınca filtreleme
- Düzenleme geçmişi / audit log
- Günlük özet rapor
- Detaylı Excel export
- Offline çalışma
- Yerel yedek alma
- Düşük kaynak tüketimli arayüz
- Mobil uyumlu görünüm

---

## MVP Dışı / Sonraki Aşamalar

- WhatsApp entegrasyonu
- SMS entegrasyonu
- Google Calendar entegrasyonu
- Outlook entegrasyonu
- Santral/VoIP entegrasyonu
- VDS entegrasyonu
- Merkezi PostgreSQL veritabanı
- Çok kullanıcılı senkronizasyon
- Kullanıcı grupları ve profiller
- Yetkilendirme sistemi
- Gelişmiş çakışma çözümü
- Otomatik mesaj şablonları
- KVKK izin takibi

---

## Ekranlar

### 1. Ana Panel

Kartlar:

- Bugün aranacak kişi sayısı
- Bugün yapılan arama sayısı
- Bugün oluşturulan randevu sayısı
- Tekrar aranacak kişi sayısı
- Aranmayacak kişi sayısı
- Ulaşılamayan kişi sayısı
- Mükerrer uyarı sayısı
- Eksik/hatalı telefon sayısı

Hızlı butonlar:

- Sıradaki Adayı Ara
- Bugün Aranacaklar
- Randevu Listesi
- Excel İçe Aktar
- Günlük Rapor Al

### 2. Aday Listesi

Kolonlar:

- Öğrenci Ad Soyad
- Mevcut Sınıf
- Öğrenci Grubu
- Kategori
- Kampanya Tanımı
- Veli Ad Soyad
- Telefon 1
- Telefon 2
- Son Arama Durumu
- Tekrar Aranacak Tarih
- Randevu Durumu
- Son Açıklama
- Mükerrer Uyarı

Filtreler:

- Kategori
- Öğrenci grubu
- Kampanya tanımı
- Aranmadı
- Ulaşıldı
- Ulaşılamadı
- Tekrar aranacak
- Aranmayacak
- Randevu verildi
- Kayıt oldu
- Yanlış numara
- Mükerrer kayıt var
- Telefon eksik
- Bugün aranacaklar
- Tarih aralığı

### 3. Arama Ekranı

Ana ekran.

Sol panel:

- Sıradaki adaylar
- Bugün aranacaklar
- Filtrelenmiş liste

Orta büyük aday kartı:

- Öğrenci adı soyadı
- Mevcut sınıf
- Öğrenci grubu
- Kategori
- Kampanya tanımı
- Veli adı soyadı
- Telefon 1
- Telefon 2
- Açıklama / genel not
- Son arama durumu
- Tekrar arama tarihi
- Randevu durumu

Sağ panel:

- Kronolojik arama geçmişi
- Önceki notlar
- Randevu geçmişi
- Düzenleme geçmişinden kısa izler
- Mükerrer uyarıları

Alt hızlı işlem çubuğu:

- Ulaşılamadı
- Görüşüldü
- Sonra Ara
- Randevu Ver
- Aranmayacak
- Yanlış Numara
- Kayıt Oldu
- Not Ekle
- Sıradaki

### 4. Randevular

Alanlar:

- Öğrenci adı
- Veli adı
- Telefon
- Randevu tarihi
- Randevu saati
- Kampanya tanımı
- Randevu durumu
- Not

Durumlar:

- Bekliyor
- Geldi
- Gelmedi
- Ertelendi
- İptal
- Kayıt oldu

### 5. Hatırlatmalar

- Bugün tekrar aranacaklar
- Geçmiş tarihi geçenler
- Yaklaşan hatırlatmalar
- Tamamlananlar
- İptal edilenler

### 6. Mükerrer Kayıtlar

Kontrol türleri:

- Aynı telefon farklı öğrencilerde
- Aynı öğrenci adı + veli adı farklı satırlarda
- Aynı öğrenci adı farklı bilgilerle

Aynı satırda Telefon 1 ve Telefon 2 aynıysa hata sayılmaz.

### 7. Günlük Rapor

Metrikler:

- Toplam arama
- Ulaşılan
- Ulaşılamayan
- Sonra aranacak
- Aranmayacak
- Yanlış numara
- İlgilenmiyor
- Kayıt oldu
- Oluşturulan randevu
- Bugünkü randevular
- Randevuya gelen
- Randevuya gelmeyen
- Eklenen not
- Düzenlenen telefon
- Oluşturulan hatırlatma

Filtreler:

- Bugün
- Dün
- Tarih aralığı
- Kampanya
- Kategori
- Öğrenci grubu

### 8. Excel İçe Aktar

Akış:

1. Excel seç
2. İlk sekme otomatik okunur
3. İlk 20 satır ön izleme gösterilir
4. Kolonlar otomatik eşleştirilir
5. Sorun varsa uyarı çıkar
6. Kullanıcı gerekirse kolon eşleştirir
7. Import simülasyonu yapılır
8. Log gösterilir
9. Onayla ve içeri aktar

### 9. Excel Dışa Aktar

Varsayılan: detaylı export.

Export kolonları:

- Mevcut Sınıf
- Öğrenci Grubu
- Kategori
- Kampanya Tanımı
- Ad Soyad
- Veli Ad Soyad
- Telefon
- 2. Telefon
- Ulaşıldı mı
- Tekrar Aranacak mı
- Tekrar Aranacak Tarih
- Son Arama Tarihi
- Son Arama Sonucu
- Son Açıklama
- Toplam Arama Sayısı
- Randevu Tarihi
- Randevu Durumu
- Mükerrer Uyarı
- Arama 1 Tarihi
- Arama 1 Sonucu
- Arama 1 Açıklaması
- Arama 2 Tarihi
- Arama 2 Sonucu
- Arama 2 Açıklaması
- Dinamik olarak devam eden arama kolonları

### 10. Ayarlar

Ayarlar:

- Varsayılan kategori: YKS
- Varsayılan öğrenci grubu: 11. Sınıf YKS Hazırlık
- Varsayılan kampanya: Diğer
- Kampanya tanımları yönetimi
- Saat girilmemiş tekrar arama varsayılanı: 11:00
- Arama başlangıç saati: 10:00
- Arama bitiş saati: 18:00
- Klavye kısayolları
- Excel kolon eşleştirme kuralları
- Yedekleme ayarları
- Tema
- Mobil görünüm tercihi

---

## Teknik Mimari

### Uygulama Tipi

Offline-first web CRM / PWA.

### Önerilen Teknolojiler

| Katman | Teknoloji |
|---|---|
| Arayüz | React + Vite |
| Offline uygulama | PWA |
| Yerel veri | IndexedDB |
| IndexedDB yönetimi | Dexie.js |
| Excel import/export | SheetJS / xlsx |
| Liste performansı | Virtual scrolling |
| Gelecek backend | Node.js veya FastAPI |
| Gelecek merkezi DB | PostgreSQL |

İlk sürümde backend zorunlu değildir. Sistem lokal IndexedDB ile çalışabilir.

---

## Veri Modeli

### students

- id
- uuid
- student_full_name
- current_class
- student_group
- category
- campaign_id
- status
- source_file_name
- source_sheet_name
- source_row_number
- general_note
- sync_status
- created_at
- updated_at
- deleted_at

### guardians

- id
- uuid
- student_id
- guardian_full_name
- relation_type
- note
- created_at
- updated_at
- deleted_at

### phones

- id
- uuid
- student_id
- guardian_id
- phone_number
- original_phone_value
- phone_label
- is_valid
- is_wrong
- is_primary
- note
- created_at
- updated_at
- deleted_at

### call_logs

- id
- uuid
- student_id
- phone_id
- call_time
- call_result
- note
- next_action
- created_reminder_id
- created_appointment_id
- created_at
- updated_at
- deleted_at

### reminders

- id
- uuid
- student_id
- reminder_type
- reminder_at
- status
- note
- is_default_time_assigned
- created_at
- updated_at
- deleted_at

### appointments

- id
- uuid
- student_id
- guardian_id
- appointment_at
- status
- campaign_id
- note
- created_at
- updated_at
- deleted_at

### campaigns

- id
- uuid
- name
- is_default
- is_active
- created_at
- updated_at
- deleted_at

Varsayılan kampanya: Diğer.

### imports

- id
- uuid
- file_name
- sheet_name
- total_rows
- imported_rows
- skipped_rows
- warning_count
- error_count
- started_at
- finished_at

### import_logs

- id
- import_id
- row_number
- column_name
- severity
- message
- auto_fixed
- created_at

### duplicate_checks

- id
- duplicate_type
- duplicate_value
- severity
- count
- related_student_ids
- created_at

### audit_logs

- id
- entity_type
- entity_id
- action_type
- field_name
- old_value
- new_value
- note
- performed_by
- created_at

### settings

- key
- value
- updated_at

Başlangıç ayarları:

- default_category = YKS
- default_student_group = 11. Sınıf YKS Hazırlık
- default_campaign = Diğer
- default_reminder_time = 11:00
- call_start_time = 10:00
- call_end_time = 18:00
- export_mode = Detaylı
- first_sheet_only = true
- auto_match_misspelled_columns = true

### keyboard_shortcuts

- id
- action_key
- shortcut
- is_active
- updated_at

---

## Mükerrer Kontrol Algoritması

### Hata Sayılmayacak Durum

- Aynı satırda Telefon 1 ve Telefon 2 aynı olabilir.
- Bu anne/baba için aynı numara girilmiş olabileceği için hata sayılmayacak.
- İstenirse sadece bilgi notu gösterilecek.

### Uyarı Verilecek Durumlar

1. Aynı telefon farklı satırlarda farklı öğrencilerde varsa: kırmızı uyarı.
2. Aynı öğrenci adı + veli adı farklı satırlarda varsa: turuncu uyarı.
3. Aynı öğrenci adı farklı velilerle/telefonlarla varsa: sarı uyarı.

### Normalize Kuralları

Telefon:

- Sadece rakamlar alınır
- Başında +90 veya 90 varsa 0 formatına çevrilir
- 10 haneli GSM ise başına 0 eklenir
- Hedef format: 05XXXXXXXXX

İsim:

- Büyük/küçük harf farkı yok sayılır
- Fazla boşluklar temizlenir
- Türkçe karakter normalize edilir
- Noktalama işaretleri temizlenir

---

## Import Log Örnekleri

- `Tekrar arancak mı?` başlığı `Tekrar aranacak mı?` alanıyla otomatik eşleştirildi.
- Satır 245: Tekrar aranacak tarihi var ancak saat yok. Varsayılan saat 11:00 olarak atandı.
- Satır 312: Telefon alanı boş.
- Satır 410: Aynı telefon farklı öğrenci kayıtlarında bulundu.
- Satır 511: Kampanya Tanımı boş olduğu için Diğer atandı.

---

## Arama Akışı

Sıradaki aday seçme önceliği:

1. Bugün tekrar aranacaklar
2. Randevu verilmiş ama sonucu işlenmemiş olanlar
3. Daha önce ulaşılamayanlar
4. Hiç aranmamışlar
5. Filtrelenmiş listeden sıradaki kayıt

Arama sonucu seçilince:

1. call_logs kaydı oluşturulur
2. Öğrencinin son durumu güncellenir
3. Not varsa arama kaydına eklenir
4. Sonra aranacak seçildiyse reminders kaydı oluşur
5. Randevu verildiyse appointments kaydı oluşur
6. audit_logs kaydı eklenir
7. İstenirse otomatik sıradaki adaya geçilir

---

## Offline Çalışma ve Yedekleme

Veriler IndexedDB içinde saklanır.

İnternet yokken yapılabilecekler:

- Adayları görüntüleme
- Arama kaydı ekleme
- Not ekleme
- Randevu oluşturma
- Hatırlatma oluşturma
- Excel export alma
- Yedek alma

Yedekleme zamanları:

- Import öncesi
- Import sonrası
- Export öncesi
- Senkronizasyon öncesi
- Manuel yedek alma

Yedek dosya adı örneği:

`aday-ogrenci-takip-yedek-2026-05-07-11-00.json`

---

## Performans Kuralları

- Liste sanallaştırma kullanılacak
- Büyük listelerde tüm satırlar aynı anda çizilmeyecek
- Arama ve filtreleme normalize edilmiş indeksler üzerinden yapılacak
- Excel import parça parça işlenecek
- Progress bar gösterilecek
- Gereksiz animasyon kullanılmayacak
- Ağır UI frameworklerinden kaçınılacak
- Mobilde sade tek kolon görünüm kullanılacak
- Eski bilgisayarda hızlı açılması öncelikli olacak

---

## Aşama 5 - MVP Geliştirme Planı

### Sprint 0 - Proje Hazırlığı

- [ ] Proje klasör yapısını oluştur
- [ ] React + Vite kurulumu yap
- [ ] PWA desteği ekle
- [ ] Temel routing yapısını kur
- [ ] Temel layout oluştur
- [ ] IndexedDB / Dexie temel bağlantısını kur
- [ ] Başlangıç ayarlarını tanımla
- [ ] Kampanya varsayılanını Diğer yap
- [ ] Klavye kısayolları varsayılanlarını tanımla

### Sprint 1 - Veri Modeli ve Yerel Veritabanı

- [ ] students tablosunu oluştur
- [ ] guardians tablosunu oluştur
- [ ] phones tablosunu oluştur
- [ ] call_logs tablosunu oluştur
- [ ] reminders tablosunu oluştur
- [ ] appointments tablosunu oluştur
- [ ] campaigns tablosunu oluştur
- [ ] imports tablosunu oluştur
- [ ] import_logs tablosunu oluştur
- [ ] duplicate_checks tablosunu oluştur
- [ ] audit_logs tablosunu oluştur
- [ ] settings tablosunu oluştur
- [ ] keyboard_shortcuts tablosunu oluştur

### Sprint 2 - Excel Import

- [ ] Excel dosyası seçme ekranı yap
- [ ] Sadece ilk sekmeyi okuma kuralını uygula
- [ ] İlk 20 satır ön izleme göster
- [ ] Kolon başlıklarını normalize et
- [ ] Otomatik kolon eşleştirme yap
- [ ] Yazım hatalarını otomatik tanı
- [ ] Eksik kolon için eşleştirme ekranı yap
- [ ] Import simülasyonu yap
- [ ] Import log ekranı oluştur
- [ ] Telefon normalize et
- [ ] Tarih/saat normalize et
- [ ] Saat yoksa 11:00 ata
- [ ] Kampanya yoksa Diğer ata
- [ ] Verileri IndexedDB'ye yaz
- [ ] Import sonrası özet göster

### Sprint 3 - Aday Listesi ve Filtreleme

- [ ] Aday listesi ekranını oluştur
- [ ] Virtual table/scroll yapısını kur
- [ ] Temel kolonları göster
- [ ] Hızlı arama kutusu ekle
- [ ] Kategori filtresi ekle
- [ ] Öğrenci grubu filtresi ekle
- [ ] Kampanya filtresi ekle
- [ ] Durum filtresi ekle
- [ ] Bugün aranacaklar filtresi ekle
- [ ] Mükerrer uyarı filtresi ekle
- [ ] Satıra tıklayınca aday detayına git

### Sprint 4 - Arama Ekranı

- [ ] Sol aday kuyruğunu oluştur
- [ ] Büyük aday kartını oluştur
- [ ] Telefon 1 / Telefon 2 alanlarını büyük göster
- [ ] Genel açıklama alanını göster
- [ ] Kronolojik arama geçmişini göster
- [ ] Hızlı işlem butonlarını ekle
- [ ] Klavye kısayollarını bağla
- [ ] Not ekleme alanını oluştur
- [ ] Sonra aranacak akışını oluştur
- [ ] Randevu ver akışını oluştur
- [ ] Sıradaki adaya geçişi yap
- [ ] Audit log kaydı oluştur

### Sprint 5 - Hatırlatma ve Randevu

- [ ] Hatırlatma tablosunu listele
- [ ] Bugün aranacaklar ekranını yap
- [ ] Geçmiş tarihli hatırlatmaları göster
- [ ] Hatırlatmayı tamamlandı/iptal yap
- [ ] Randevu ekranını yap
- [ ] Kurs içi randevu oluştur
- [ ] Randevu durumlarını yönet
- [ ] Randevu filtrelerini ekle

### Sprint 6 - Mükerrer Kontrol ve Düzenleme Geçmişi

- [ ] Telefon mükerrer kontrolünü yap
- [ ] Öğrenci + veli mükerrer kontrolünü yap
- [ ] Aynı öğrenci farklı bilgiler uyarısını yap
- [ ] Mükerrer kayıt ekranını oluştur
- [ ] Uyarıya tıklayınca listeyi filtrele
- [ ] Düzenleme geçmişi ekranını oluştur
- [ ] Öğrenci/veli/telefon düzenleme işlemlerini logla

### Sprint 7 - Detaylı Excel Export

- [ ] Standart export kolonlarını oluştur
- [ ] Detaylı export kolonlarını oluştur
- [ ] Dinamik Arama 1/2/3 açıklama kolonlarını üret
- [ ] Randevu bilgilerini exporta ekle
- [ ] Mükerrer uyarı bilgisini exporta ekle
- [ ] Kampanya bilgisini exporta ekle
- [ ] Export öncesi yedek alma seçeneği ekle
- [ ] Export dosyasını indirilebilir oluştur

### Sprint 8 - Günlük Rapor ve Ayarlar

- [ ] Günlük rapor ekranını oluştur
- [ ] Bugün/dün/tarih aralığı filtrelerini ekle
- [ ] Kampanya/kategori/öğrenci grubu filtrelerini ekle
- [ ] Raporu Excel'e aktar
- [ ] Ayarlar ekranını oluştur
- [ ] Kampanya yönetimini yap
- [ ] Klavye kısayolları düzenleme ekranını yap
- [ ] Arama saat aralığı ayarını yap
- [ ] Varsayılan hatırlatma saatini ayarlanabilir yap

### Sprint 9 - Offline, Yedekleme ve Test

- [ ] PWA offline cache testlerini yap
- [ ] IndexedDB veri kalıcılığını test et
- [ ] Import öncesi/sonrası yedek al
- [ ] Manuel yedek al butonu ekle
- [ ] JSON yedek dışa aktar
- [ ] JSON yedekten geri yükle
- [ ] Büyük dosya import testi yap
- [ ] Büyük listede filtreleme testi yap
- [ ] Eski PC performans kontrolü yap
- [ ] Mobil görünüm testi yap

---

## Test Senaryoları

- [ ] Excel ilk sekme doğru okunuyor mu?
- [ ] İkinci sekme yok sayılıyor mu?
- [ ] Yazım hatalı kolon otomatik eşleşiyor mu?
- [ ] Eksik kolonlarda eşleştirme ekranı açılıyor mu?
- [ ] Telefonlar normalize ediliyor mu?
- [ ] Aynı satırdaki aynı telefon hata sayılmıyor mu?
- [ ] Aynı telefon farklı öğrencilerde mükerrer uyarı veriyor mu?
- [ ] Aynı öğrenci + veli farklı satırda uyarı veriyor mu?
- [ ] Saat yoksa 11:00 atanıyor mu?
- [ ] Bu durum loglanıyor mu?
- [ ] Kampanya boşsa Diğer atanıyor mu?
- [ ] Arama notları kronolojik tutuluyor mu?
- [ ] Detaylı exportta Arama 1/2 açıklamaları çıkıyor mu?
- [ ] Düzenleme geçmişi çalışıyor mu?
- [ ] Kısayollar çalışıyor mu?
- [ ] Kısayollar değiştirilebiliyor mu?
- [ ] 3 tuşu varsayılan kritik işlemde kullanılmıyor mu?
- [ ] Offline iken yeni arama kaydı ekleniyor mu?
- [ ] Tarayıcı kapanıp açıldığında veri duruyor mu?
- [ ] Büyük listede arama/filtre takılmadan çalışıyor mu?
- [ ] Mobil görünüm kullanılabilir mi?

---

## Son Onaydan Önce Kontrol Edilecekler

- [ ] MVP kapsamı onaylandı mı?
- [ ] Ekran yapısı onaylandı mı?
- [ ] Veri modeli onaylandı mı?
- [ ] Excel import kuralları onaylandı mı?
- [ ] Detaylı export formatı onaylandı mı?
- [ ] Kampanya sistemi onaylandı mı?
- [ ] Klavye kısayolları onaylandı mı?
- [ ] Varsayılan saatler onaylandı mı?
- [ ] Offline/yedekleme yaklaşımı onaylandı mı?
- [ ] Geliştirmeye başlama onayı alındı mı?

---

## Kısa Proje Özeti

Bu proje, Excel listeleriyle çalışan kurs arama süreçlerini düzenli, hızlı, hatasız ve raporlanabilir hale getirmek için geliştirilecek özel bir CRM'dir. Önceliği kullanıcı dostu arama ekranı, klavye ile hızlı kullanım, Excel uyumluluğu, offline çalışma ve detaylı görüşme geçmişidir. Sistem ilk sürümde tek bilgisayarda güçlü şekilde çalışacak, ileride VDS ve çok kullanıcılı merkezi yapıya taşınabilecek şekilde tasarlanacaktır.
