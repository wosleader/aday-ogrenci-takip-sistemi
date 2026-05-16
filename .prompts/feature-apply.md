# Feature Apply Prompt

Onaylanan planı uygula.

Kurallar:
- Sadece onaylanan kapsamı uygula.
- Yeni paket kurma.
- Büyük refactor yapma.
- Kapsam dışına çıkma.
- Commit komutu çalıştırma.
- Push komutu çalıştırma.
- Rapor içinde yalnızca önerilen commit mesajını yaz.

İş bitince çalıştır:
- npm.cmd test
- npm.cmd run build
- git status
- git diff --stat

Ayrıca kontrol et:
- Değiştirilen dosyalar `docs/FILE_MAP.md` ile çelişiyor mu?
- Çelişki varsa raporda `docs/FILE_MAP.md` güncellemesi öner.
- İş bittiğinde `.prompts/sprint-close.md` promptunu çalıştırmayı unutma.

Rapor formatı:
- Değişen dosyalar
- Eklenen dosyalar
- Ne düzeldi
- Test sonucu
- Build sonucu
- git status
- git diff --stat
- Önerilen commit mesajı
- Sonraki sprinte bırakılan işler
