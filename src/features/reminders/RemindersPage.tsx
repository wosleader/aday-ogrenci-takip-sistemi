import { useLiveQuery } from "dexie-react-hooks";
import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import type { AppOutletContext } from "../../app/AppLayout";
import { Button } from "../../components/Button";
import { PageHeader } from "../../components/PageHeader";
import {
  createReminderTaskSummary,
  filterReminderTaskRows,
  readReminderTaskRows,
  type ReminderTaskFilter
} from "./services/reminderListReader";

const FILTERS: Array<{ value: ReminderTaskFilter; label: string }> = [
  { value: "all", label: "Tüm hatırlatmalar" },
  { value: "overdue", label: "Süresi geçenler" },
  { value: "today", label: "Bugün aranacaklar" },
  { value: "upcoming", label: "Yaklaşan aramalar" }
];

export function RemindersPage() {
  const { openStudentById } = useOutletContext<AppOutletContext>();
  const [activeFilter, setActiveFilter] = useState<ReminderTaskFilter>("all");
  const rows = useLiveQuery(() => readReminderTaskRows(), [], []);
  const summary = useMemo(() => createReminderTaskSummary(rows ?? []), [rows]);
  const filteredRows = useMemo(() => filterReminderTaskRows(rows ?? [], activeFilter), [activeFilter, rows]);

  return (
    <section className="reminders-page">
      <PageHeader
        title="Hatırlatmalar"
        description="Bugün aranacak, süresi geçen ve yaklaşan tekrar aramaları buradan takip edin."
      />

      <div className="reminder-summary-grid" aria-label="Hatırlatma özeti">
        <div className="reminder-summary-card overdue">
          <span>Süresi geçenler</span>
          <strong>{summary.overdue}</strong>
          <p>Zamanı geçmiş açık aramalar</p>
        </div>
        <div className="reminder-summary-card today">
          <span>Bugün aranacaklar</span>
          <strong>{summary.today}</strong>
          <p>Bugün için planlananlar</p>
        </div>
        <div className="reminder-summary-card upcoming">
          <span>Yaklaşan aramalar</span>
          <strong>{summary.upcoming}</strong>
          <p>İleri tarihli açık aramalar</p>
        </div>
        <div className="reminder-summary-card total">
          <span>Toplam açık hatırlatma</span>
          <strong>{summary.all}</strong>
          <p>Tamamlanmamış tekrar aramalar</p>
        </div>
      </div>

      <div className="reminder-filter-bar" aria-label="Hatırlatma filtreleri">
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
                  <th>Telefon 1</th>
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
                  <tr key={row.reminder_id}>
                    <td title={row.student_full_name}>{row.student_full_name}</td>
                    <td title={row.guardian_full_name ?? undefined}>{row.guardian_full_name || "-"}</td>
                    <td>{row.phone_1 || "-"}</td>
                    <td>{row.phone_2 || "-"}</td>
                    <td>{row.reminder_date_label}</td>
                    <td>{row.reminder_time_label}</td>
                    <td>
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
          <div className="reminder-empty-state">Açık hatırlatma yok.</div>
        )}
      </div>
    </section>
  );
}
