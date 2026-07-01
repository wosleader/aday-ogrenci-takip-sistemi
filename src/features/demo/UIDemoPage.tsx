import { PageHeader } from "../../components/PageHeader";
import { Button } from "../../components/Button";
import { Download, Plus, Search } from "lucide-react";

export function UIDemoPage() {
  return (
    <div className="page">
      <PageHeader
        title="UI Komponent Demoları"
        description="Bu sayfa yeni eklenen CSS sınıflarının (tablolar, kartlar, formlar vb.) önizlemesi amacıyla oluşturulmuştur. Herhangi bir backend verisine bağlı değildir."
      />

      {/* Stats Cards Section */}
      <section>
        <h2 style={{ fontSize: "16px", marginBottom: "16px", color: "var(--text-muted)" }}>İstatistik Kartları</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-card-title">Toplam Aday</span>
            <span className="stat-card-value">1,248</span>
          </div>
          <div className="stat-card">
            <span className="stat-card-title">Bugün Aranan</span>
            <span className="stat-card-value">42</span>
          </div>
          <div className="stat-card">
            <span className="stat-card-title">Bekleyen Aramalar</span>
            <span className="stat-card-value">156</span>
          </div>
        </div>
      </section>

      {/* Table Section */}
      <section>
        <h2 style={{ fontSize: "16px", marginBottom: "16px", color: "var(--text-muted)", marginTop: "16px" }}>Örnek Tablo (Adaylar)</h2>
        <div className="card" style={{ padding: "0", overflow: "hidden" }}>
          <div style={{ padding: "20px", display: "flex", gap: "12px", borderBottom: "1px solid var(--border-color)", alignItems: "center" }}>
            <div style={{ position: "relative", flex: 1, maxWidth: "300px" }}>
              <Search style={{ position: "absolute", left: "10px", top: "10px", color: "var(--text-muted)" }} size={16} />
              <input type="text" placeholder="İsim, telefon veya e-posta ara..." className="form-input" style={{ paddingLeft: "36px" }} />
            </div>
            <div style={{ marginLeft: "auto", display: "flex", gap: "12px" }}>
              <Button variant="secondary"><Download size={16} /> Export</Button>
              <Button variant="primary"><Plus size={16} /> Yeni Aday</Button>
            </div>
          </div>
          <div className="table-container" style={{ border: "none", borderRadius: "0", boxShadow: "none" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Ad Soyad</th>
                  <th>Bölüm Tercihi</th>
                  <th>Durum</th>
                  <th>Son İşlem</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <div style={{ fontWeight: 500, color: "var(--text-main)" }}>Ayşe Yılmaz</div>
                    <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "2px" }}>+90 555 123 4567</div>
                  </td>
                  <td>Bilgisayar Mühendisliği</td>
                  <td><span className="badge badge-teal">Arandı</span></td>
                  <td>12 Eki 2023, 14:30</td>
                </tr>
                <tr>
                  <td>
                    <div style={{ fontWeight: 500, color: "var(--text-main)" }}>Mehmet Kaya</div>
                    <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "2px" }}>+90 544 987 6543</div>
                  </td>
                  <td>Hukuk Fakültesi</td>
                  <td><span className="badge badge-slate">Bekliyor</span></td>
                  <td>-</td>
                </tr>
                <tr>
                  <td>
                    <div style={{ fontWeight: 500, color: "var(--text-main)" }}>Zeynep Demir</div>
                    <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "2px" }}>+90 533 456 7890</div>
                  </td>
                  <td>Psikoloji</td>
                  <td><span className="badge badge-blue">Kayıtlı</span></td>
                  <td>11 Eki 2023, 09:15</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Forms Section */}
      <section>
        <h2 style={{ fontSize: "16px", marginBottom: "16px", color: "var(--text-muted)", marginTop: "16px" }}>Form Elemanları</h2>
        <div className="card" style={{ maxWidth: "500px" }}>
          <div className="form-group">
            <label className="form-label">Ad Soyad</label>
            <input type="text" className="form-input" placeholder="Örn: Ali Veli" />
          </div>
          <div className="form-group">
            <label className="form-label">Notlar</label>
            <textarea className="form-input" placeholder="Aday ile ilgili notlarınızı buraya yazın..." rows={4}></textarea>
          </div>
          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
            <Button variant="secondary">İptal</Button>
            <Button variant="primary">Kaydet</Button>
          </div>
        </div>
      </section>
    </div>
  );
}
