import type { CSSProperties } from "react";

import { PageHeader } from "../../components/PageHeader";

// TEMPORARY PROJECT PROGRESS PAGE - remove before final product.

const mainCards = [
  {
    title: "Dar Pilot Hazırlığı",
    percent: 99,
    description:
      "Dar pilot için hazır; bilgilendirme notları var. Ana import, aday kartı, arama, iletişim geçmişi, export ve backup akışı doğrulandı.",
    tone: "#16a34a",
  },
  {
    title: "Genel MVP Hazırlığı",
    percent: 89,
    description:
      "Günlük kullanım akışı güçlü. Kalan başlıklar daha çok güvenli tekrar import, düzenleme/geri alma ve ileri raporlama kararları.",
    tone: "#2563eb",
  },
  {
    title: "Tam Ürün Genişliği",
    percent: 66,
    description:
      "Pilot kapsamı netleşti. Tam ürün için veri modeli genişletmeleri, gelişmiş raporlar ve daha kapsamlı yönetim araçları ayrıca planlanacak.",
    tone: "#7c3aed",
  },
];

const detailCards = [
  {
    title: "Import Ekranı",
    percent: 98,
    description:
      "Kolon eşleştirme dili sadeleşti; sistem/rapor kolonları anlaşılır şekilde yönetiliyor.",
  },
  {
    title: "Telefon 1-10 Akışı",
    percent: 95,
    description:
      "Import, aday kartı, seçim, yanlış numara işaretleme ve detaylı export akışı pilot için hazır.",
  },
  {
    title: "Export / Rapor Uyumu",
    percent: 84,
    description:
      "Detaylı export Telefon 1-10 ve temel rapor ihtiyaçlarını karşılıyor; tam geri yükleme için sistem yedeği kullanılmalı.",
  },
  {
    title: "Pilot Kontrol Güveni",
    percent: 98,
    description:
      "Son test/build doğrulaması geçti. Kalan notlar pilotu durduran hatalar değil, kullanım bilgilendirmeleri.",
  },
];

const completedItems = [
  "Telefon 1-10 import, aday kartı, görüşme seçimi ve detaylı export uyumu tamamlandı.",
  "Telefon kartlarında son görüşme sonucu artık mevcut iletişim kayıtlarından okunarak gösteriliyor.",
  "Telefon seçim ve yanlış/kullanılmayacak numara aksiyonlarının açıklamaları netleştirildi.",
  "İletişim geçmişi kayıtları güvenli soft delete ile kaldırılabiliyor.",
  "İletişim kaydı silindikten sonra adayın son görüşme özeti kalan aktif kayıtlardan yeniden hesaplanıyor.",
  "Import mapping ekranı sistem/rapor kolonlarını sade dille gösteriyor ve gerekirse gizleyip tekrar gösterebiliyor.",
];

const pilotNoticeItems = [
  "Detaylı Excel Export raporlama ve paylaşım içindir; güvenli geri yükleme için Tam Sistem Yedeği kullanılmalı.",
  "Hatırlatma veya randevuya bağlı iletişim kayıtları bu MVP'de silinmez.",
  "İletişim geçmişi düzenleme ve geri alma özellikleri pilot sonrası ele alınacak.",
  "Ad/Soyad, Anne/Baba ve Mahalle alanları için model genişletmesi pilot sonrası ayrı fazdır.",
  "Temporary Proje İlerlemesi sayfası final ürüne çıkmadan önce kaldırılacak.",
];

const prePilotChecks = [
  "Dar Pilot: Pilot Ready with Warnings",
  "Backup, import, aday listesi, sağ kart, arama akışı ve detaylı export temel kontrolleri geçti.",
  "Raporlar sayfası ayrı CRM ekranı olarak korunuyor.",
  "Son kabul edilen pilot notları staff için bu sayfada kısa şekilde tutuluyor.",
];

const validationItems = [
  "Son güvenli HEAD/origin: e6f580b docs: close communication history soft delete checkpoint",
  "Son implementation commit: a9e891c feat: soft delete communication history",
  "npm.cmd test -- --run: 44 test file / 284 tests PASS",
  "npm.cmd run build: build PASS",
];

const lastUpdate = {
  datetime: "06.06.2026",
  note:
    "Dar pilot final hazırlığı Pilot Ready with Warnings olarak değerlendirildi. Telefon son sonuç göstergesi, telefon aksiyon açıklamaları ve iletişim geçmişi soft delete akışı tamamlandı. Son güvenli commit: e6f580b.",
};

export function ProgressPage() {
  return (
    <div style={styles.pageShell}>
      <PageHeader
        title="Proje İlerlemesi"
        description="Pilot öncesi durum, tamamlanan işler ve sıradaki kararlar burada kısa şekilde takip edilir."
      />

      <div style={styles.temporaryBadge}>
        Bu sayfa geçici takip ekranıdır; proje sonunda kaldırılacaktır.
      </div>

      <section style={styles.heroGrid} aria-label="Ana proje durum kartları">
        {mainCards.map((card) => (
          <article key={card.title} style={styles.statusCard}>
            <div style={styles.cardHeader}>
              <span style={styles.cardTitle}>{card.title}</span>
              <span style={{ ...styles.percentText, color: card.tone }}>{card.percent}%</span>
            </div>
            <div style={styles.progressTrack} aria-hidden="true">
              <div
                style={{
                  ...styles.progressFill,
                  width: `${card.percent}%`,
                  background: card.tone,
                }}
              />
            </div>
            <p style={styles.cardDescription}>{card.description}</p>
          </article>
        ))}
      </section>

      <section style={styles.summarySection}>
        <div>
          <span style={styles.sectionEyebrow}>Dar Pilot Durumu</span>
          <h2 style={styles.sectionTitle}>Dar pilot için hazır; bilgilendirme notları var.</h2>
        </div>
        <p style={styles.summaryText}>
          Telefon 1-10 import, aday kartı, görüşme kaydı, detaylı export, manuel
          Veli Ad Soyad eşleştirme ve iletişim geçmişi silme akışı pilot için
          doğrulandı. Kalan başlıklar pilotu durduran temel hatalar değil; kullanım
          sırasında bilinmesi gereken sınırlar ve pilot sonrası ürün kararlarıdır.
        </p>
      </section>

      <section style={styles.detailGrid} aria-label="Alt ilerleme göstergeleri">
        {detailCards.map((card) => (
          <article key={card.title} style={styles.detailCard}>
            <div
              style={{
                ...styles.ring,
                background: `conic-gradient(#2563eb 0 ${card.percent}%, #e5e7eb ${card.percent}% 100%)`,
              }}
              aria-hidden="true"
            >
              <span style={styles.ringValue}>{card.percent}</span>
            </div>
            <div>
              <h3 style={styles.detailTitle}>{card.title}</h3>
              <p style={styles.detailDescription}>{card.description}</p>
            </div>
          </article>
        ))}
      </section>

      <section style={styles.twoColumnGrid}>
        <article style={styles.listCard}>
          <h2 style={styles.listTitle}>Tamamlanan Son İyileştirmeler</h2>
          <ul style={styles.cleanList}>
            {completedItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article style={styles.listCard}>
          <h2 style={styles.listTitle}>Pilot Sırasında Bilinmesi Gerekenler</h2>
          <ul style={styles.cleanList}>
            {pilotNoticeItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </section>

      <section style={styles.twoColumnGrid}>
        <article style={styles.listCard}>
          <h2 style={styles.listTitle}>Pilot Öncesi Kontrol</h2>
          <ul style={styles.cleanList}>
            {prePilotChecks.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article style={styles.listCard}>
          <h2 style={styles.listTitle}>Son Teknik Doğrulama</h2>
          <ul style={styles.cleanList}>
            {validationItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </section>

      <section style={styles.updateCard}>
        <div style={styles.updateHeader}>
          <div>
            <span style={styles.sectionEyebrow}>Son Güncelleme</span>
            <h2 style={styles.updateTitle}>Pilot öncesi kapanış notu</h2>
          </div>
          <span style={styles.updatePill}>{lastUpdate.datetime}</span>
        </div>
        <div style={styles.updateInfoGrid}>
          <div style={styles.updateInfoBox}>
            <span style={styles.updateLabel}>Tarih</span>
            <strong>{lastUpdate.datetime}</strong>
          </div>
          <div style={styles.updateInfoBox}>
            <span style={styles.updateLabel}>Not</span>
            <p style={styles.updateText}>{lastUpdate.note}</p>
          </div>
        </div>
      </section>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  pageShell: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
    width: "100%",
    maxWidth: "1180px",
    marginInline: "auto",
    paddingBottom: "80px",
  },
  temporaryBadge: {
    alignSelf: "flex-start",
    borderRadius: "999px",
    border: "1px solid #f4c27b",
    background: "#fff7ed",
    color: "#9a4f00",
    fontSize: "13px",
    fontWeight: 700,
    padding: "8px 12px",
  },
  heroGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "16px",
  },
  statusCard: {
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    background: "#ffffff",
    boxShadow: "0 14px 40px rgba(15, 23, 42, 0.06)",
    padding: "20px",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "baseline",
  },
  cardTitle: {
    color: "#111827",
    fontSize: "17px",
    fontWeight: 800,
  },
  percentText: {
    fontSize: "28px",
    fontWeight: 900,
    lineHeight: 1,
  },
  progressTrack: {
    height: "8px",
    borderRadius: "999px",
    background: "#eef2f7",
    overflow: "hidden",
    marginTop: "16px",
  },
  progressFill: {
    height: "100%",
    borderRadius: "999px",
  },
  cardDescription: {
    margin: "14px 0 0",
    color: "#4b5563",
    fontSize: "14px",
    lineHeight: 1.55,
  },
  summarySection: {
    border: "1px solid #dbeafe",
    borderRadius: "8px",
    background: "linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%)",
    padding: "22px",
  },
  sectionEyebrow: {
    color: "#2563eb",
    fontSize: "12px",
    fontWeight: 900,
    letterSpacing: "0",
    textTransform: "uppercase",
  },
  sectionTitle: {
    margin: "6px 0 0",
    color: "#111827",
    fontSize: "22px",
    lineHeight: 1.2,
  },
  summaryText: {
    maxWidth: "880px",
    margin: "14px 0 0",
    color: "#334155",
    fontSize: "15px",
    lineHeight: 1.7,
  },
  detailGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "14px",
  },
  detailCard: {
    display: "grid",
    gridTemplateColumns: "64px 1fr",
    gap: "14px",
    alignItems: "center",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    background: "#ffffff",
    padding: "16px",
  },
  ring: {
    display: "grid",
    placeItems: "center",
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    color: "#111827",
    fontWeight: 900,
  },
  ringValue: {
    display: "grid",
    placeItems: "center",
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    background: "#ffffff",
    fontSize: "15px",
  },
  detailTitle: {
    margin: 0,
    color: "#111827",
    fontSize: "15px",
  },
  detailDescription: {
    margin: "6px 0 0",
    color: "#64748b",
    fontSize: "13px",
    lineHeight: 1.5,
  },
  twoColumnGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "16px",
  },
  listCard: {
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    background: "#ffffff",
    padding: "20px",
  },
  listTitle: {
    margin: "0 0 14px",
    color: "#111827",
    fontSize: "18px",
  },
  cleanList: {
    margin: 0,
    paddingLeft: "18px",
    color: "#475569",
    fontSize: "14px",
    lineHeight: 1.7,
  },
  updateCard: {
    border: "1px solid #d1fae5",
    borderRadius: "8px",
    background: "#f0fdf4",
    padding: "18px",
  },
  updateHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  updateTitle: {
    margin: "5px 0 0",
    color: "#064e3b",
    fontSize: "20px",
  },
  updatePill: {
    borderRadius: "999px",
    background: "#dcfce7",
    color: "#166534",
    fontSize: "13px",
    fontWeight: 800,
    padding: "7px 10px",
  },
  updateInfoGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(160px, 220px) 1fr",
    gap: "12px",
    marginTop: "14px",
  },
  updateInfoBox: {
    border: "1px solid #bbf7d0",
    borderRadius: "8px",
    background: "#ffffff",
    padding: "12px",
  },
  updateLabel: {
    display: "block",
    color: "#16a34a",
    fontSize: "12px",
    fontWeight: 900,
    marginBottom: "5px",
    textTransform: "uppercase",
  },
  updateText: {
    margin: 0,
    color: "#365314",
    fontSize: "14px",
    lineHeight: 1.55,
  },
};
