import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import type { AppOutletContext } from "../../app/AppLayout";
import { Button } from "../../components/Button";
import { PageHeader } from "../../components/PageHeader";
import { getTodayInputValue, readDailyReport } from "./services/dailyReportReader";

type ReportCard = {
  label: string;
  value: number;
  hint?: string;
  tone?: "neutral" | "good" | "warning" | "danger";
};

export function ReportsPage() {
  const { openStudentById } = useOutletContext<AppOutletContext>();
  const [selectedDate, setSelectedDate] = useState(() => getTodayInputValue());
  const report = useLiveQuery(() => readDailyReport(selectedDate), [selectedDate], undefined);
  const summary = report?.summary;
  const reminderSummary = report?.reminder_summary;
  const cards: ReportCard[] = [
    {
      label: "Seçilen gün işlem yapılan aday",
      value: summary?.unique_student_count ?? 0,
      hint: "Seçilen gün içinde kaydı olan farklı adaylar"
    },
    {
      label: "Seçilen gün görüşme kaydı",
      value: summary?.call_log_count ?? 0,
      hint: "Seçilen gün girilen toplam kayıt"
    },
    { label: "Görüşüldü", value: summary?.reached_count ?? 0, tone: "good" },
    { label: "Ulaşılamadı", value: summary?.not_reached_count ?? 0, tone: "danger" },
    { label: "Tekrar aranacak", value: summary?.call_later_count ?? 0, tone: "warning" },
    { label: "Randevu", value: summary?.appointment_count ?? 0, tone: "warning" },
    { label: "Kayıt oldu", value: summary?.registered_count ?? 0, tone: "good" },
    { label: "Aranmayacak / ilgilenmiyor", value: summary?.do_not_call_count ?? 0 },
    { label: "Yanlış numara", value: summary?.wrong_number_count ?? 0, tone: "danger" },
    { label: "Süresi geçen hatırlatma", value: reminderSummary?.overdue ?? 0, tone: "danger" },
    { label: "Bugün aranacak hatırlatma", value: reminderSummary?.today ?? 0, tone: "warning" }
  ];

  return (
    <section className="reports-page">
      <div className="daily-report-header">
        <PageHeader
          title="Raporlar"
          description="Seçilen günün arama çalışmasını ve açık hatırlatmaları buradan hızlıca takip edin."
        />
        <label className="daily-report-date">
          <span>Rapor tarihi</span>
          <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
        </label>
      </div>

      <div className="daily-report-grid" aria-label="Günlük rapor özeti">
        {cards.map((card) => (
          <div className={`daily-report-card ${card.tone ?? "neutral"}`} key={card.label}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            {card.hint ? <p>{card.hint}</p> : null}
          </div>
        ))}
      </div>

      <section className="daily-report-section">
        <div className="daily-report-section-title">
          <div>
            <h2>Son görüşmeler</h2>
            <p>Seçilen gün içinde girilen son görüşme kayıtları.</p>
          </div>
        </div>

        {report?.recent_calls.length ? (
          <div className="daily-call-table-wrap">
            <table className="daily-call-table">
              <thead>
                <tr>
                  <th>Saat</th>
                  <th>Öğrenci</th>
                  <th>Veli</th>
                  <th>Sonuç</th>
                  <th>Not özeti</th>
                  <th>Adayı Aç</th>
                </tr>
              </thead>
              <tbody>
                {report.recent_calls.map((call) => (
                  <tr key={call.call_log_id}>
                    <td>{call.call_time_label}</td>
                    <td title={call.student_full_name}>{call.student_full_name}</td>
                    <td title={call.guardian_full_name ?? undefined}>{call.guardian_full_name || "-"}</td>
                    <td>{call.call_result_label}</td>
                    <td title={call.note_preview ?? undefined}>
                      {call.note_preview ? <span className="daily-call-note">{call.note_preview}</span> : <span className="daily-empty-value">Not yok</span>}
                    </td>
                    <td>
                      <Button className="daily-open-button" variant="secondary" onClick={() => openStudentById(call.student_id)}>
                        Adayı Aç
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="daily-report-empty">Bu gün için görüşme kaydı yok.</div>
        )}
      </section>

      <section className="daily-report-section daily-reminder-summary">
        <div>
          <h2>Açık hatırlatma özeti</h2>
          <p>Detaylı tekrar arama listesi için Hatırlatmalar sayfasını kullanın.</p>
        </div>
        <div className="daily-reminder-pills">
          <span>Süresi geçenler: {reminderSummary?.overdue ?? 0}</span>
          <span>Bugün aranacaklar: {reminderSummary?.today ?? 0}</span>
          <Link to="/reminders">Hatırlatmalar sayfasına git</Link>
        </div>
      </section>
    </section>
  );
}
