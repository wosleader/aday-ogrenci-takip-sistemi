# Feature Plan Prompt

Görev:
[buraya görev yazılacak]

Önce oku:
- docs/PROJECT_MEMORY.md
- docs/FILE_MAP.md
- docs/DECISIONS.md

Gereksiz checkpoint okuma; PROJECT_MEMORY içindeki Checkpoint Okuma Rehberi’ni kullan.
Gerekiyorsa ilgili checkpoint’i oku.

Plan çıkarırken docs/DECISIONS.md ile çelişen öneri yapma.
Gerekirse ilgili karar maddesini referans al.

Plan çıkarırken sadece PROJECT_MEMORY / FILE_MAP özetlerine güvenme.
İşin ilgili olduğu gerçek kaynak dosyaları incele.
Dosya bazlı planı gerçek dosya içeriğine göre çıkar.
Varsayım yapma.

Kod yazma.
Dosya değiştirme.
Paket kurma.
Commit/push yapma.

Çıktı formatı:
1. Mevcut durum özeti
2. İlgili dosyalar
3. Dosya bazlı teknik plan
4. Riskler
5. Test planı
6. Kapsam dışı kalacaklar
