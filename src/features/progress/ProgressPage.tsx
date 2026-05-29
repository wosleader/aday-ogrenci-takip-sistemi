import type { CSSProperties } from "react";
import { PageHeader } from "../../components/PageHeader";

type ProgressItem = {
  title: string;
  percent: number;
  description: string;
  tone: string;
};

const mainCards: ProgressItem[] = [
  {
    title: "Dar Pilot Hazırlığı",
    percent: 90,
    description:
      "Telefonlu aday akışı ve import ekranı büyük ölçüde hazır. Kalan işler daha çok karar ve uyumluluk maddeleri.",
    tone: "#16a34a"
  },
  {
    title: "Genel MVP Hazırlığı",
    percent: 82,
    description:
      "Ana kullanım akışı güçlü. Export, tekrar import ve bazı düzeltme araçları hâlâ planlanıyor.",
    tone: "#2563eb"
  },
  {
    title: "Tam Ürün Genişliği",
    percent: 60,
    description:
      "Dar pilot güçlü, fakat tam ürün için rapor, model genişletme ve gelişmiş yönetim işleri devam edecek.",
    tone: "#9333ea"
  }
];

const detailCards: ProgressItem[] = [
  {
    title: "Import Ekranı",
    percent: 95,
    description: "Hata, uyarı, bilgi ve ön izleme alanları daha okunabilir hale getirildi.",
    tone: "#0891b2"
  },
  {
    title: "Telefon 1-10 Akışı",
    percent: 90,
    description: "Çoklu telefon import, arama kartı ve görüşme kaydı akışı çalışıyor.",
    tone: "#059669"
  },
  {
    title: "Export / Rapor Uyumu",
    percent: 62,
    description: "Ekran çalışıyor, fakat Telefon 3-10 detaylı export tarafı ayrıca ele alınacak.",
    tone: "#d97706"
  },
  {
    title: "Pilot Kapanış Kararları",
    percent: 85,
    description: "Kalan maddelerin pilot blocker mı yoksa backlog mu olduğuna karar verilecek.",
    tone: "#4f46e5"
  }
];

const completedItems = [
  "Import ekranında hata/uyarı/bilgi listeleri kademeli hale getirildi.",
  "Ön izleme alanı daha kontrollü gösteriliyor.",
  "Uzun listelerde “Daha az göster” sonrası sayfa doğru yere dönüyor.",
  "Import sonrası aynı dosya tekrar seçme/reset sorunu düzeltildi.",
  "Telefon 3+ seçim ve yanlış numara işaretleme davranışı Telefon 1/2 ile uyumlu hale getirildi.",
  "Telefon 1-10 import ve kayıt akışı pilot testlerde doğrulandı."
];

const decisionItems = [
  "Telefon 3-10 bilgisinin export/rapor tarafına nasıl ekleneceği belirlenecek.",
  "“Eski import verisini temizleyip yeniden içe aktar” davranışı güvenli şekilde tasarlanacak.",
  "Telefonun Excel’de hangi kolondan geldiğini gösteren sade bilgi işareti değerlendirilecek.",
  "Yanlış girilen iletişim geçmişi kayıtları için silme/düzeltme yöntemi planlanacak.",
  "Ad/Soyad, Anne/Baba ve Mahalle alanları ayrı keşif çalışmasına alınacak."
];

const pageStyles = {
  wrapper: {
    display: "grid",
    gap: "1rem",
    width: "100%",
    maxWidth: "1180px",
    margin: "0 auto",
    paddingBottom: "80px"
  },
  hero: {
    display: "grid",
    gap: "0.85rem",
    padding: "1rem",
    borderRadius: "8px",
    border: "1px solid rgba(148, 163, 184, 0.35)",
    background:
      "linear-gradient(135deg, rgba(15, 118, 110, 0.12), rgba(37, 99, 235, 0.08) 48%, rgba(245, 158, 11, 0.12))"
  },
  badge: {
    width: "fit-content",
    padding: "0.28rem 0.55rem",
    borderRadius: "999px",
    color: "#075985",
    background: "rgba(14, 165, 233, 0.14)",
    border: "1px solid rgba(14, 165, 233, 0.28)",
    fontSize: "0.78rem",
    fontWeight: 700
  },
  grid3: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "0.85rem"
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "0.85rem"
  },
  card: {
    display: "grid",
    gap: "0.75rem",
    padding: "1rem",
    borderRadius: "8px",
    border: "1px solid rgba(148, 163, 184, 0.28)",
    background: "rgba(255, 255, 255, 0.9)",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)"
  },
  section: {
    padding: "1rem",
    borderRadius: "8px",
    border: "1px solid rgba(148, 163, 184, 0.28)",
    background: "rgba(255, 255, 255, 0.94)"
  },
  list: {
    margin: 0,
    paddingLeft: "1.15rem",
    display: "grid",
    gap: "0.45rem"
  },
  update: {
    display: "grid",
    gap: "0.65rem",
    padding: "0.9rem 1rem",
    borderRadius: "8px",
    border: "1px solid rgba(22, 163, 74, 0.28)",
    background: "rgba(220, 252, 231, 0.5)"
  },
  updateBody: {
    display: "grid",
    gridTemplateColumns: "minmax(160px, 0.65fr) minmax(260px, 1.35fr)",
    gap: "0.65rem"
  },
  updateItem: {
    display: "grid",
    gap: "0.25rem",
    padding: "0.7rem",
    borderRadius: "8px",
    border: "1px solid rgba(22, 163, 74, 0.18)",
    background: "rgba(255, 255, 255, 0.72)"
  }
} satisfies Record<string, CSSProperties>;

export function ProgressPage() {
  return (
    <section style={pageStyles.wrapper}>
      {/* TEMPORARY PROJECT PROGRESS PAGE - remove before final product. */}
      <div style={pageStyles.hero}>
        <PageHeader
          title="Proje İlerlemesi"
          description="Pilot öncesi durum, tamamlanan işler ve sıradaki kararlar burada kısa şekilde takip edilir."
        />
        <span style={pageStyles.badge}>Bu sayfa geçici takip ekranıdır; proje sonunda kaldırılacaktır.</span>
      </div>

      <div style={pageStyles.grid3} aria-label="Ana proje durum kartları">
        {mainCards.map((card) => (
          <ProgressCard item={card} variant="large" key={card.title} />
        ))}
      </div>

      <section style={pageStyles.section}>
        <h2>Şu An Neredeyiz?</h2>
        <p>
          Telefon 1-10 içe aktarma, aday kartında çoklu telefon kullanımı ve import ekranı büyük ölçüde
          toparlandı. Dar pilot için ana akış çalışır durumda. Kalan maddeler pilotu engelleyen büyük
          hatalardan çok, ürün kararı ve sonraki geliştirme başlıklarıdır.
        </p>
      </section>

      <div style={pageStyles.grid2} aria-label="Alt ilerleme kartları">
        {detailCards.map((card) => (
          <ProgressCard item={card} key={card.title} />
        ))}
      </div>

      <div style={pageStyles.grid2}>
        <section style={pageStyles.section}>
          <h2>Son Tamamlananlar</h2>
          <ul style={pageStyles.list}>
            {completedItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section style={pageStyles.section}>
          <h2>Sıradaki Kararlar</h2>
          <ul style={pageStyles.list}>
            {decisionItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>

      <section style={pageStyles.update}>
        <h2 style={{ margin: 0 }}>Son Güncelleme</h2>
        <div style={pageStyles.updateBody}>
          <div style={pageStyles.updateItem}>
            <span style={{ color: "#166534", fontSize: "0.78rem", fontWeight: 700 }}>Tarih/saat</span>
            <strong>29.05.2026 18:29</strong>
          </div>
          <div style={pageStyles.updateItem}>
            <span style={{ color: "#166534", fontSize: "0.78rem", fontWeight: 700 }}>Not</span>
            <p style={{ margin: 0 }}>
              Import ekranı kademeli gösterim ve scroll davranışı tamamlandı. Son güvenli commit: 91498b4.
            </p>
          </div>
        </div>
      </section>
    </section>
  );
}

function ProgressCard({ item, variant = "compact" }: { item: ProgressItem; variant?: "compact" | "large" }) {
  const ringSize = variant === "large" ? 92 : 72;

  return (
    <article style={pageStyles.card}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: variant === "large" ? "1.08rem" : "1rem" }}>{item.title}</h2>
          <p style={{ margin: "0.25rem 0 0", color: "#475569" }}>{item.description}</p>
        </div>
        <div
          aria-label={`${item.title} yüzde ${item.percent}`}
          style={{
            width: ringSize,
            height: ringSize,
            minWidth: ringSize,
            borderRadius: "999px",
            display: "grid",
            placeItems: "center",
            background: `conic-gradient(${item.tone} ${item.percent}%, rgba(226, 232, 240, 0.9) 0)`
          }}
        >
          <strong
            style={{
              width: ringSize - 18,
              height: ringSize - 18,
              borderRadius: "999px",
              display: "grid",
              placeItems: "center",
              background: "#fff",
              color: "#0f172a"
            }}
          >
            %{item.percent}
          </strong>
        </div>
      </div>
      <div
        aria-hidden="true"
        style={{
          height: 8,
          borderRadius: "999px",
          background: "rgba(226, 232, 240, 0.9)",
          overflow: "hidden"
        }}
      >
        <span
          style={{
            display: "block",
            width: `${item.percent}%`,
            height: "100%",
            borderRadius: "999px",
            background: item.tone
          }}
        />
      </div>
    </article>
  );
}
