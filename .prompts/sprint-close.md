# Sprint Close Prompt

Not:
Prompt başında ÜST EMİR bloğu kullanılmalı: iş türü, aktif branch, son commit, izinli/yasak dosyalar, test/build, commit/push ve durma şartı net olmalı.

Sprint kapanışlarında kullanılacak standart kontrol promptu.

Önce kontrol et:
- git branch
- git status
- git log --oneline --decorate -10
- npm.cmd test
- npm.cmd run build

Kontrol soruları:
- Checkpoint oluşturuldu mu?
- PROJECT_MEMORY.md güncellenmeli mi?
- FILE_MAP.md güncellenmeli mi?
- DECISIONS.md güncellenmeli mi?
- Yol haritası değişti mi?
- Yeni ürün kararı alındı mı?
- Kullanım kitapçığını etkileyen karar var mı?
- PROJECT_MEMORY.md ile DECISIONS.md arasında çelişen madde var mı?
- FILE_MAP.md değişen dosyalarla çelişiyor mu?
- Sonraki sprint net mi?
- Commit/push sonrası working tree clean mi?

Kurallar:
- Kod yazma.
- Onay olmadan dosya değiştirme.
- Commit komutu çalıştırma.
- Push komutu çalıştırma.
- Sadece kapanış raporu ve gerekiyorsa dokümantasyon güncelleme planı ver.
