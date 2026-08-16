import { useLiveQuery } from "dexie-react-hooks";
import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import type { AppOutletContext } from "../../app/AppLayout";
import { Button } from "../../components/Button";
import { PageHeader } from "../../components/PageHeader";
import {
  createOperationalAlertSummary,
  filterOperationalAlertItems,
  getOperationalAlertKindLabel,
  readOperationalAlertItems,
  type OperationalAlertFilter
} from "./services/operationalAlertReader";

const FILTERS: Array<{ value: OperationalAlertFilter; label: string }> = [
  { value: "all", label: "Tüm operasyonlar" },
  { value: "overdue", label: "Süresi geçenler" },
  { value: "today", label: "Bugünkü operasyonlar" },
  { value: "upcoming", label: "Yaklaşan operasyonlar" }
];

function formatReminderPhoneContext(label?: string | null, number?: string | null): string | null {
  const normalizedLabel = label?.trim();
  const normalizedNumber = number?.trim();

  if (normalizedLabel && normalizedNumber) {
    return `${normalizedLabel}: ${normalizedNumber}`;
  }

  return normalizedLabel || normalizedNumber || null;
}

export function RemindersPage() {
  const { openStudentById } = useOutletContext<AppOutletContext>();
  const [activeFilter, setActiveFilter] = useState<OperationalAlertFilter>("all");
  const rows = useLiveQuery(() => readOperationalAlertItems(), [], []);
  const summary = useMemo(() => createOperationalAlertSummary(rows ?? []), [rows]);
  const filteredRows = useMemo(() => filterOperationalAlertItems(rows ?? [], activeFilter), [activeFilter, rows]);

  return (
    <section className="reminders-page">
      <PageHeader
        title="Hatırlatmalar"
        description="Arama, veli mesajı ve randevu zamanlarını tek listeden takip edin."
      />

      <div className="reminder-summary-grid" aria-label="Hatırlatma özeti">
        <div className="reminder-summary-card overdue">
          <span>Süresi geçenler</span>
          <strong>{summary.overdue}</strong>
          <p>Zamanı geçmiş açık aramalar</p>
        </div>
        <div className="reminder-summary-card today">
          <span>Bugünkü operasyonlar</span>
          <strong>{summary.today}</strong>
          <p>Bugün için planlananlar</p>
        </div>
        <div className="reminder-summary-card upcoming">
          <span>Yaklaşan operasyonlar</span>
          <strong>{summary.upcoming}</strong>
          <p>İleri tarihli operasyonlar</p>
        </div>
        <div className="reminder-summary-card total">
          <span>Toplam açık operasyon</span>
          <strong>{summary.all}</strong>
          <p>Takip gerektiren açık kayıtlar</p>
        </div>
      </div>

      <div className="reminder-filter-bar" aria-label="Operasyon filtreleri">
        {FILTERS.map((filter) => (
          <button
            className={`reminder-filter-button ${activeFilter === filter.value ? "active" : ""}`}
            key={filter.value}
            onClick={() => setActiveFilter(filter.value)}
            type="button"
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="reminder-table-panel">
        {filteredRows.length ? (
          <div className="reminder-table-wrap">
            <table className="reminder-table">
              <thead>
                <tr>
                  <th>Öğrenci</th>
                  <th>Veli</th>
                  <th>Telefon</th>
                  <th>Telefon 2</th>
                  <th>Tarih</th>
                  <th>Saat</th>
                  <th>Durum</th>
                  <th>Sonuç / Not</th>
                  <th>Adayı Aç</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.identity}>
                    <td title={row.student_full_name}>{row.student_full_name}</td>
                    <td title={row.guardian_full_name ?? undefined}>{row.guardian_full_name || "-"}</td>
                    <td>{formatReminderPhoneContext(row.phone_context_label, row.phone_context_number) ?? row.phone_1 ?? "-"}</td>
                    <td>{row.phone_2 || "-"}</td>
                    <td>{row.due_date_label}</td>
                    <td>{row.due_time_label}</td>
                    <td>
                      <span className={`operational-alert-kind-badge ${row.kind}`}>
                        {getOperationalAlertKindLabel(row.kind)}
                      </span>
                      <span className={`reminder-bucket-badge ${row.bucket}`}>{row.bucket_label}</span>
                    </td>
                    <td title={row.note_preview ?? row.last_call_result_label}>
                      <span className="reminder-note-preview">
                        {row.note_preview ? `${row.last_call_result_label} - ${row.note_preview}` : row.last_call_result_label}
                      </span>
                    </td>
                    <td>
                      <Button className="reminder-open-button" variant="secondary" onClick={() => openStudentById(row.student_id)}>
                        Adayı Aç
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="reminder-empty-state">Açık operasyon yok.</div>
        )}
      </div>
    </section>
  );
}
