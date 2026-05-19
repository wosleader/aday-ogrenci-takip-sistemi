# Çoklu Telefon Mimarisi Planı

Bu doküman, Aday Öğrenci Takip Sistemi’nde çoklu telefon desteğinin ürün, UX ve teknik mimari kararlarını içerir.

## 1. Neden Bu Mimari Gerekli?

Pilot ve gerçek veri tarafında aday başına 8-10 telefon numarasına kadar çıkılabiliyor. Mevcut pilot akışında Telefon 1 / Telefon 2 pratik ve anlaşılır bir sınır sağladı, ancak gerçek operasyon için eksik kalıyor.

Arama operasyonunda yalnızca adayın aranması değil, hangi numaranın arandığı da kritiktir. 8 numarası olan bir adayda bir numara hiç kullanılmıyor, bir numara yanlış, bir numara “müsait değilim” demiş, başka bir numaradan ise gerçekten iletişim kurulmuş olabilir. Bu bilgiler aday geneline karışırsa sonraki danışman doğru kişiye ve doğru numaraya ulaşmakta zorlanır.

Çoklu telefon desteği sadece çok numara göstermek değildir. Numara bazlı durum, geçmiş, tekrar arama, import, export ve backup/restore bağlamının birlikte yönetilmesidir. Bu mimari ileride WhatsApp, SMS API, otomatik arama entegrasyonu veya telefon bazlı ulaşılabilirlik raporu gibi özellikler için sağlam temel oluşturmalıdır.

Mevcut kaynak yapısında `phones` tablosu ve `call_logs.phone_id/contacted_phone_*` alanları bu yöne uygun bir başlangıç sağlar. Ancak import, aday listesi, sağ kişi kartı, export ve reminder görünümü bugün hâlâ Telefon 1 / Telefon 2 merkezli çalışır. Reminder kayıtlarında telefon bağlamı henüz açık şekilde tutulmaz.

## 2. Temel Ürün İlkeleri

1. Sabit 10 boş telefon kutusu gösterilmeyecek.
2. Telefonlar dinamik liste olarak tutulacak; kaç numara varsa o kadar gösterilecek.
3. Sağ kişi kartındaki mevcut pratik akış korunacak.
4. Ayrı “Telefonlar” sekmesi ilk sürümde eklenmeyecek.
5. İlk 2-3 öncelikli telefon hızlı görünür olacak.
6. Fazlası “+N numara daha göster” ile açılacak.
7. Çok fazla seçenek kullanıcıyı boğmayacak.
8. Kullanıcı teknik olmayabilir; ilkokul mezunu kullanıcı bile anlayabilmeli.
9. Mobil app ve mobil responsive geleceği dikkate alınacak.
10. Kısayollar destekleyici olacak, ana kullanım yolu olmayacak.
11. Export çok fazla kolonla kullanıcıyı boğmayacak; sade/detaylı ayrımı değerlendirilecek.
12. Telefon bazlı durum ve hatırlatma bağlamı kaybolmayacak.

## 3. Sağ Kişi Kartı Tasarım Kararı

Karar:

- Sağ kişi kartında ayrı Telefonlar sekmesi yok.
- Mevcut sağ kart akışı korunur.
- Telefon bölümü dinamik ve genişletilebilir olur.
- Her telefon satırı, hem referans hem durum bilgisi taşıyabilir.
- Her satıra çok fazla buton eklenip karmaşa oluşturulmayacak.
- Telefon satırına tıklama/seçme ile görüşme formunda “aranan numara” bağlamı kurulabilir.
- Mevcut sistemde ayrı “Ara” butonu yoksa, bu plan “Ara butonu zorunlu” diye yorumlanmamalıdır.

Önerilen görünüm:

```text
Telefonlar

Telefon 1 · Anne
05xx xxx xx xx
Son: Ulaşılamadı

Telefon 2 · Baba
05xx xxx xx xx
Yanlış numara

Telefon 3
05xx xxx xx xx
Aktif

+5 numara daha göster
```

Açılınca:

```text
Telefon 4 · Veli
05xx xxx xx xx
Kullanılmıyor

Telefon 5
05xx xxx xx xx
Son iletişim kurulan

Telefon 6 · Yakın
05xx xxx xx xx
Müsait değil
```

Açıklamalar:

- “Telefon 1, Telefon 2, Telefon 5” referans etiketi olarak kullanılacak.
- Anne/Baba/Öğrenci/Veli/Yakın/Diğer ilişki etiketi ayrıca tutulacak.
- Kime ait olduğu bilinmeyen numaralar sadece “Telefon N” olarak görünebilir.
- Kullanıcılar kendi arasında “Telefon 5 üzerinden görüştüm” diyebilmeli.
- “Yanlış numara”, “Kullanılmıyor”, “Son iletişim kurulan” gibi durumlar satırda rozet/metin olarak gösterilebilir.
- İlk sürümde her satıra 3-4 aksiyon butonu koyulmayacak; kalabalık önlenecek.

## 4. Telefon Etiketleri ve Referans Mantığı

İlişki etiketi seçenekleri:

- Telefon
- Anne
- Baba
- Öğrenci
- Veli
- Yakın
- Diğer

Referans etiketi:

- Telefon 1
- Telefon 2
- Telefon 3
- Telefon 4
- Telefon 5
- ...

Karar:

- Telefon N referans etiketi operasyonel iletişim için korunur.
- İlişki etiketi kime ait olduğunu belirtir.
- Excel kolon adı kesin gerçek kabul edilmez, sadece ipucu kabul edilir.
- `source_column` ayrıca saklanır.
- Telefon 4 / GSM 5 gibi kolonlar ilişki belirtmiyorsa ilişki etiketi “Telefon” olur.
- “Telefon N” ve ilişki etiketi ayrı kavramlardır.

Örnek:

| Excel kolonu | Referans | İlişki | Ekran |
| --- | --- | --- | --- |
| Telefon 1 | Telefon 1 | Telefon | Telefon 1 |
| Anne Telefon | Telefon 2 | Anne | Telefon 2 · Anne |
| GSM 5 | Telefon 5 | Telefon | Telefon 5 |

## 5. Telefon Bazlı Durum Mantığı

Her telefon ayrı operasyon birimi kabul edilecek.

Telefon bazlı durum örnekleri:

- Aktif
- Ulaşılamadı
- İletişim kuruldu
- Yanlış numara
- Kullanılmıyor
- Müsait değil
- Tekrar aranacak
- Pasif

Karar:

- Yanlış numara aday geneline uygulanmaz; ilgili telefona uygulanır.
- Kullanılmıyor/yanlış numara telefonları tamamen gizlenmez.
- Bu telefonlar hızlı ilk 3 görünümden düşürülebilir ama “+N numara daha göster” içinde görünür kalır.
- Kullanıcı ileride gerekirse tekrar aktif/öncelikli yapabilmelidir.
- İlk sürümde drag/drop veya karmaşık manuel sıralama yapılmaz.
- Basit “Öncelikli yap” aksiyonu ileride değerlendirilebilir.
- Yanlış numara otomatik tamamen saklanmayacak; sadece öncelikten düşürülebilir ve geri alınabilir kalacaktır.
- Adayın genel durumu, tek bir telefonun yanlış numara olmasından agresif şekilde etkilenmeyecektir.

## 6. Arama Kaydı ve Phone Snapshot Kararı

Görüşme kayıtları artık sadece `student_id` ile değil, telefon referansıyla da bağlanmalıdır.

Önerilen call log alanları:

- `student_id`
- `phone_id`
- `phone_snapshot`
- `call_result`
- `note`
- `call_time`
- `created_at`

`phone_snapshot` içinde şunlar olmalı:

- `reference_label`
- `relation_label`
- `phone_number`
- `source_column` gerekirse

Karar:

- Telefon sonradan değişse bile eski görüşmede hangi numaranın arandığı kaybolmamalı.
- Görüşme geçmişinde aranan telefon referansı görünmeli: “Telefon 5 · Veli”.
- Görüşme sonucu telefonun son durumunu etkileyebilir.
- Yanlış numara sonucu ilgili `phone_id` durumunu günceller, aday geneline agresif sonuç yazmaz.
- Eski call log kayıtlarında `phone_id` yoksa “Aday geneli / Eski kayıt” gibi güvenli fallback düşünülmelidir.

Mevcut not:

- Bugünkü modelde `call_logs.phone_id`, `contacted_phone_id`, `contacted_phone_number` ve `contacted_phone_label` alanları vardır. Çoklu telefon sprintinde bunların `phone_snapshot` kararıyla nasıl uyumlanacağı ayrıca netleştirilmelidir.

## 7. Hatırlatma / Tekrar Arama Bağlamı

Bu bölüm kritik.

Karar:

- Tekrar arama oluşturulurken seçili telefon varsa reminder kaydı `phone_id` ve `phone_snapshot` tutmalıdır.
- Hatırlatma ekranında bağlam görünmelidir: “Tekrar aranacak: Telefon 5 · Veli”.
- Böylece 3 gün sonra farklı danışman görevi açtığında hangi numaradan/kime söz verildiğini bilir.
- Hatırlatma aday geneline bağlı kalabilir ama telefon bağlamı varsa kaybolmamalıdır.
- Eski reminder kayıtlarında `phone_id` yoksa aday geneli olarak kalabilir.

Önerilen reminder alanları:

- `student_id`
- `phone_id`
- `phone_snapshot`
- `reminder_at`
- `note`
- `status`
- `created_at`

Mevcut not:

- Bugünkü `ReminderRecord` içinde `phone_id` veya `phone_snapshot` yoktur. Çoklu telefon core sprintinde reminder schema/migration ve geriye dönük uyum ayrıca ele alınmalıdır.

## 8. Klavye Kısayolları Kararı

Mevcut pratik kısayol yaklaşımı korunacak.

Karar:

- T = Telefon 1 seç
- Y = Telefon 2 seç
- U = Telefon 3 seç

Kurallar:

- Sadece sağ kişi kartı açıkken çalışmalı.
- Input/textarea/select/contenteditable içindeyken çalışmamalı.
- Ctrl/Alt/Meta ile çalışmamalı.
- 4+ telefon için tek tek kısayol yok.
- Fazla numaralar için “+N numara daha göster” tıklanabilir.
- İlk sürümde “daha fazla numara göster” için ayrı kısayol şart değil.
- Kısayollar destekleyici özellik olacak, ana kullanım yolu olmayacak.
- Mobilde kısayol ana kullanım yolu değildir.
- Telefon 4/5/6 için ayrı kısayol eklenmeyecek; kısayol karmaşası önlenecek.

Ayarlar etkisi:

- Klavye Kısayolları sayfasında Telefon 1 / Telefon 2 / Telefon 3 seçme kısayolları net gösterilmeli.
- 4+ telefon için ayar eklenmemeli.
- Bugünkü `T` ve `Y` davranışı korunur; `U` yeni bir operasyon kısayolu olarak ancak çoklu telefon UI geldiğinde düşünülmelidir.

## 9. Import Mimarisi

Akıllı telefon kolon algılama yapılacak.

Algılanabilecek başlık örnekleri:

- Telefon
- Telefon 1
- Telefon 2
- Telefon 3
- GSM 1
- GSM 2
- GSM 4
- Cep Telefonu
- Anne Telefon
- Baba Telefon
- Öğrenci Telefon
- Veli Telefon
- Yakın Telefon
- Diğer Telefon

Kurallar:

- Telefon kolonları otomatik algılanır.
- Boş telefon hücreleri atlanır.
- Aynı aday içinde aynı numara tekrar ediyorsa tekilleştirilir.
- Farklı adaylarda aynı telefon varsa mükerrer telefon uyarısı üretilir.
- Kolon adı ilişki için ipucu kabul edilir, kesin gerçek kabul edilmez.
- Import log içinde çoklu telefon kolonları algılandı bilgisi gösterilir.
- Kolon eşleştirme ekranı çok karmaşık yapılmayacak; sistem tahmin eder, kullanıcı gerekirse sonradan düzeltir.

Örnek import log:

```text
Çoklu telefon kolonları algılandı: Telefon 1, Telefon 2, Anne Telefon, GSM 4, GSM 5.
Boş telefon hücreleri atlandı.
Aynı adaydaki tekrar eden telefonlar tekilleştirildi.
```

Mevcut not:

- Bugünkü import tipi `phone_1` ve `phone_2` ile sınırlıdır. `importWriter` yalnızca bu iki alanı telefon kaydına çevirir. Çoklu telefon import sprintinde `SimulatedImportRow` içine dinamik telefon listesi eklenmelidir.

## 10. Export Mimarisi

Export kullanıcıyı boğmamalı.

Karar:

Varsayılan export sade kalmalı. Detaylı export çoklu telefonları daha geniş verebilir.

Varsayılan export önerisi:

- Telefon 1
- Telefon 1 Türü
- Telefon 2
- Telefon 2 Türü
- Telefon 3
- Telefon 3 Türü
- Diğer Telefonlar

Diğer Telefonlar örneği:

```text
Telefon 4 · Veli: 05xx | Telefon 5: 05xx | Telefon 6 · Yakın: 05xx
```

Detaylı export önerisi:

- Telefon 1
- Telefon 1 Türü
- Telefon 1 Durumu
- Telefon 2
- Telefon 2 Türü
- Telefon 2 Durumu
- ...
- Telefon 10
- Telefon 10 Türü
- Telefon 10 Durumu

Karar:

- Özet Görüşme Raporu çoklu telefon detayına boğulmamalı.
- Detaylı Excel Export çoklu telefon kolonlarını taşıyabilir.
- Excel export geri yükleme aracı değildir; Tam Sistem Yedeği tüm phone list yapısını taşır.
- Exportta çok kolon kafa karıştırabileceği için sade/detaylı ayrımı önemlidir.

## 11. Aday Listesi Etkisi

Aday Listesi’nde tüm telefonlar gösterilmeyecek.

Önerilen görünüm:

```text
05xx xxx xx xx · 05xx xxx xx xx · +6
```

Karar:

- İlk 2 telefon görünür.
- Fazlası “+N” olarak görünür.
- Liste ekranı telefon yönetim ekranına dönüşmemeli.
- Tüm telefon detayları sağ kişi kartında açılır.
- Telefon kolonları dar ekranda ezilmemeli; mevcut yatay scroll/min-width yaklaşımı korunmalıdır.

## 12. Backup / Restore Etkisi

Tam Sistem Yedeği mutlaka şunları taşımalı:

- Phone list
- Phone statuses
- `phone_id` bağlantıları
- Call log `phone_snapshot` bilgileri
- Reminder `phone_snapshot` bilgileri

Karar:

- Excel export geri yükleme amacıyla kullanılmaz.
- Restore sonrası telefon listesi, telefon durumları, görüşme ve hatırlatma bağlamı korunmalıdır.
- Backup validation yeni phone/reminder/call snapshot alanlarını tanıyacak şekilde güncellenmelidir.
- Eski backup dosyaları için geriye dönük uyum stratejisi Sprint 9.3 kapsamında test edilmelidir.

## 13. Raporlar Etkisi

Raporlar sayfası çoklu telefon detayına boğulmayacak.

Karar:

- Günlük rapor kırılımları mevcut `call_result` odaklı kalır.
- Telefon detayları rapor ana kartlarına eklenmez.
- Son görüşmeler listesinde gerekirse aranan telefon referansı kısa şekilde gösterilebilir.
- Gerekirse ileride “telefon bazlı ulaşılabilirlik” ayrı rapor konusu olabilir.
- Reports Dashboard Polish bu mimarinin uygulaması değildir; ayrı roadmap maddesi olarak kalır.

## 14. Responsive / Mobile Etkisi

Karar:

- Çoklu telefon UI sonrası responsive yeniden değerlendirilecek.
- Mobile Drawer Polish çoklu telefon UI’dan sonra yapılmalı.
- Mobile Table/Card View ayrı sprint olarak kalır.
- Çoklu telefon UI mobilde sade kalmalı:
  - İlk 2-3 telefon
  - +N göster
  - Telefon satırına dokunarak seçim
- Masaüstü kısayollar mobil tasarımın temeli olmayacak.

## 15. Uygulama Sprintlerine Bölme Önerisi

Önerilen sıra:

### Sprint 9.3 — Çoklu Telefon Core

- Veri modeli / phone list yapısı
- Backward compatibility
- `phone_id` / `phone_snapshot`
- Call log bağlantısı
- Reminder bağlantısı
- Backup/restore etkisi
- Testler

### Sprint 9.4 — Çoklu Telefon Import / Duplicate / Export

- Import akıllı telefon kolon algılama
- Aynı adayda telefon tekilleştirme
- Farklı adaylarda mükerrer telefon uyarısı
- Export sade/detaylı telefon yapısı
- Testler

### Sprint 9.5 — Çoklu Telefon UI / Sağ Kişi Kartı

- Sağ kartta ilk 3 telefon
- +N numara daha göster
- Telefon satırı seçimi
- Telefon durum etiketleri
- Görüşme geçmişinde telefon referansı
- Hatırlatmalarda telefon referansı görünümü
- Testler

### Sprint 9.6 — Çoklu Telefon Responsive Polish

- Sağ kart responsive
- Mobil görünüm
- Dar ekranlarda telefon listesi
- Mobile Drawer Polish için hazırlık

## 16. Riskler

- Import bozulabilir.
- Export kolonları kullanıcıyı yorabilir.
- Backup/restore etkilenir.
- Call log geriye dönük uyum ister.
- Reminder bağlamı migration ister.
- Mevcut Telefon 1 / Telefon 2 akışı korunmazsa pilot kullanıcıları zorlanabilir.
- Çok fazla telefon gösterimi sağ kartı şişirebilir.
- Çok fazla kısayol karmaşa yaratabilir.
- Yanlış numara otomatik sıralama hatalı uygulanırsa kullanıcı doğru numarayı bulamayabilir.
- Telefon bazlı yanlış numara sonucu aday genel sonucuna yanlış yansıtılırsa operasyon güveni düşer.
- Eski export/test beklentileri geniş kolon yapısıyla kırılabilir.

## 17. Açık Sorular

- Mevcut veride `phone1/phone2` nasıl migrate edilmeli?
- Eski call log kayıtlarında `phone_id` yoksa snapshot nasıl gösterilmeli?
- Reminder eski kayıtlarında `phone_id` yoksa aday geneli olarak mı kalmalı?
- Detaylı exportta maksimum telefon sayısı 10 mu olmalı?
- Telefon durumları ilk sürümde hangi seviyede düzenlenebilir olmalı?
- “Öncelikli yap” ilk uygulamada yer almalı mı, sonraya mı kalmalı?
- Yanlış numara hızlı görünümden düşürüldüğünde kullanıcı bunu nasıl geri almalı?
- Çoklu telefon kolonları import eşleştirme ekranında ne kadar görünür olmalı?
- Mevcut `contacted_phone_number/contacted_phone_label` alanları yeni `phone_snapshot` ile birlikte mi kalmalı, yoksa migration sonrası snapshot içine mi taşınmalı?
- `phones.phone_label` yalnızca referans etiketi mi olmalı, yoksa ilişki etiketi için ayrı alan mı açılmalı?

## 18. Nihai Ürün İlkesi

Çoklu telefon desteği kullanıcıya daha fazla yük getirmemeli; yalnızca ihtiyaç olduğunda daha fazla telefon görünmeli. İlk ekranda en olası 2-3 numara, net referans etiketi ve son durum bilgisi gösterilir. Daha fazla numara, tek bir genişletme hareketiyle açılır.
