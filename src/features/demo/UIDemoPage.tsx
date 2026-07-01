import { Search, MoreVertical, X, Check, CheckCircle, Clock } from "lucide-react";
import { Button } from "../../components/Button";

const mockCandidates = [
  { id: 1, grade: "8", name: "ECRE ANAR", parentPhone1: "05396635481", parentPhone2: "05542536398", status: "Aranmadı", tag: "Mükerrer", selected: true },
  { id: 2, grade: "8", name: "ÖZGÜR DENİZ ERDEM", parentPhone1: "05302604613", parentPhone2: "05323510216", status: "Aranmadı", tag: "Mükerrer" },
  { id: 3, grade: "8", name: "AHMET ÖZBAY", parentPhone1: "05459246093", parentPhone2: "05427462361", status: "Aranmadı" },
  { id: 4, grade: "8", name: "FUATCAN KIRKIR", parentPhone1: "05445445513", parentPhone2: "05419225971", status: "Aranmadı" },
  { id: 5, grade: "8", name: "ÇINAR EGE DALGIÇ", parentPhone1: "05342096156", parentPhone2: "-", status: "Aranmadı" },
  { id: 6, grade: "8", name: "BARTU BEDEL", parentPhone1: "05349668611", parentPhone2: "05419473730", status: "Aranmadı" },
  { id: 7, grade: "8", name: "MEHMET EYMEN ERTÜ...", parentPhone1: "05424347077", parentPhone2: "05335677889", status: "Aranmadı" },
];

export function UIDemoPage() {
  return (
    <div className="page" style={{ padding: 0 }}>
      {/* Top Header Bar */}
      <div className="crm-header-bar">
        <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
          <div style={{ position: "relative", width: "100%" }}>
            <Search style={{ position: "absolute", left: "12px", top: "8px", color: "var(--text-light)" }} size={16} />
            <input type="text" className="crm-search-input" placeholder="Aday, veli veya telefon ara... (F)" style={{ width: "100%" }} />
          </div>
        </div>
      </div>

      <div style={{ padding: "0 20px 20px", display: "flex", flexDirection: "column", height: "calc(100% - 60px)" }}>

        {/* Filters Area */}
        <div className="crm-filters">
          <strong style={{ fontSize: "16px", marginRight: "12px" }}>Aday Listesi</strong>
          <span className="badge badge-gray" style={{ marginRight: "auto" }}>1057 aday</span>

          <select className="crm-select"><option>Tüm kampanyalar</option></select>
          <select className="crm-select"><option>Tüm Sınıf / Şubeler</option></select>
          <select className="crm-select"><option>Tümü (Durum Filtresi)</option></select>
          <Button variant="secondary" style={{ height: "32px", fontSize: "13px", padding: "0 12px" }}>Sıfırla</Button>
        </div>

        {/* Workspace: Table + Detail Panel */}
        <div className="crm-workspace">

          {/* Left Column: Table */}
          <div className="crm-table-container">
            <div className="crm-table-wrapper">
              <table className="crm-table">
                <thead>
                  <tr>
                    <th style={{ width: "60px", textAlign: "center" }}>SINIF</th>
                    <th>ÖĞRENCİ</th>
                    <th>VELİ</th>
                    <th>TELEFON 1</th>
                    <th>TELEFON 2</th>
                    <th>DURUM</th>
                  </tr>
                </thead>
                <tbody>
                  {mockCandidates.map((c) => (
                    <tr key={c.id} className={c.selected ? "selected" : ""}>
                      <td style={{ textAlign: "center", color: "var(--text-muted)" }}>{c.grade}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{c.name}</div>
                        {c.tag && <span className="badge badge-warning" style={{ marginTop: "4px" }}>{c.tag}</span>}
                      </td>
                      <td style={{ color: "var(--text-muted)" }}>-</td>
                      <td style={{ color: "var(--text-muted)" }}>{c.parentPhone1}</td>
                      <td style={{ color: "var(--text-muted)" }}>{c.parentPhone2}</td>
                      <td>
                        <span className="badge badge-gray">{c.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column: Detail Panel */}
          <div className="crm-detail-panel">
            <div className="detail-header">
              <div className="detail-title">
                <h2>ECRE ANAR</h2>
                <div className="detail-subtitle">
                  <span>Sınıf: 8</span>
                  <span className="badge badge-warning">Mükerrer</span>
                </div>
              </div>
              <div className="action-buttons">
                <button className="icon-btn"><MoreVertical size={16} /></button>
                <button className="icon-btn"><X size={16} /></button>
              </div>
            </div>

            <div className="info-card">
              <div className="info-card-title">Veli Bilgileri</div>
              <div className="info-row">
                <span className="info-label">Anne Adı:</span>
                <span style={{ fontWeight: 600 }}>ÖZLEM</span>
              </div>
              <div className="info-row">
                <span className="info-label">Baba Adı:</span>
                <span style={{ fontWeight: 600 }}>ERCÜMENT</span>
              </div>
              <div className="info-subtext">Kamp-Erken Kayıt</div>
              <div className="info-subtext" style={{ marginTop: "4px" }}>Mahalle / İlçe: KÜPLÜPINAR MAH. / OSMANGAZİ</div>
            </div>

            <div className="phone-card">
              <div className="phone-header">
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span className="phone-type">TELEFON 1</span>
                  <span className="phone-tag">Baba telefonu</span>
                </div>
              </div>
              <div className="phone-number">
                05396635481
                <div className="action-buttons">
                  <button className="icon-btn"><Check size={16} /></button>
                  <button className="icon-btn"><X size={16} /></button>
                  <button className="icon-btn whatsapp" style={{ borderColor: "#10b981" }}><CheckCircle size={16} /></button>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px" }}>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Son sonuç: Yok</span>
                <span className="badge badge-gray">Aranmadı ▾</span>
              </div>
            </div>

            <div className="phone-card">
              <div className="phone-header">
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span className="phone-type">TELEFON 2</span>
                </div>
              </div>
              <div className="phone-number">
                05542536398
                <div className="action-buttons">
                  <button className="icon-btn"><Check size={16} /></button>
                  <button className="icon-btn"><X size={16} /></button>
                  <button className="icon-btn whatsapp" style={{ borderColor: "#10b981" }}><CheckCircle size={16} /></button>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px" }}>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Son sonuç: Yok</span>
                <span className="badge badge-gray">Aranmadı ▾</span>
              </div>
            </div>

            <div className="timeline-section">
              <div className="timeline-title">İLETİŞİM GEÇMİŞİ</div>
              <div className="timeline-item">
                <div className="timeline-date">28/06 12:08 • Sonra Aranacak</div>
                <div className="timeline-content">
                  <strong style={{ display: "block", marginBottom: "4px" }}>Telefon 1 - Baba: 05057828695</strong>
                  Anneyle görüştük. Çocuk başka bir kuruma gidiyor ancak bizim fiyatlarımızı öğrenmek istedi. Kuruma davet ettik, hafta içinde seyahat planları var. WP üzerinden takip yapılacak.
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-light)", marginTop: "8px" }}>Tekrar arama: 02/07 11:00 (agent)</div>
              </div>
            </div>

            <div style={{ padding: "20px", borderTop: "1px solid var(--border-color)", marginTop: "auto" }}>
               <Button variant="primary" style={{ width: "100%", height: "48px", fontSize: "16px", fontWeight: 600 }}>» Kaydet ve sonrakine geç</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
