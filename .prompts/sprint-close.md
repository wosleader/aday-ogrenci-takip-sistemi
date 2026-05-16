# Sprint Close Prompt

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
- Bu sprintte Codex’in bilmesi gereken ama PROJECT_MEMORY / FILE_MAP / DECISIONS içinde eksik kalan bir karar, edge-case veya dosya sorumluluğu var mı?
- Varsa hangi dosyada güncellenmeli?
- PROJECT_MEMORY.md ile DECISIONS.md arasında çelişen madde var mı?
- FILE_MAP.md değişen dosyalarla çelişiyor mu?
- FILE_MAP gerçek kaynak dosya değişiklikleriyle hâlâ uyumlu mu?
- DECISIONS ile PROJECT_MEMORY arasında çelişki var mı?
- Bir sonraki sprintte ilgili checkpoint okumaya gerçekten gerek var mı, yoksa PROJECT_MEMORY + gerçek kaynak dosyalar yeterli mi?
- Sonraki sprint net mi?
- Commit/push sonrası working tree clean mi?

Kurallar:
- Kod yazma.
- Onay olmadan dosya değiştirme.
- Commit komutu çalıştırma.
- Push komutu çalıştırma.
- Sadece kapanış raporu ve gerekiyorsa dokümantasyon güncelleme planı ver.
