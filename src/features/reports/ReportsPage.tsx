import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import type { AppOutletContext } from "../../app/AppLayout";
import { Button } from "../../components/Button";
import { PageHeader } from "../../components/PageHeader";
import { db } from "../../db/db";
import { getTodayInputValue, readDailyReport } from "./services/dailyReportReader";
import { readReportingV2Summary } from "./services/reportingV2Reader";

type ReportCard = {
  label: string;
  value: number;
  hint?: string;
  ariaLabel?: string;
  tone?: "neutral" | "good" | "warning" | "danger";
};

export function ReportsPage() {
  const { openStudentById } = useOutletContext<AppOutletContext>();
  const [selectedDate, setSelectedDate] = useState(() => getTodayInputValue());
  const [v2FromDate, setV2FromDate] = useState(() => getTodayInputValue());
  const [v2ToDate, setV2ToDate] = useState(() => getTodayInputValue());
  const [v2CampaignId, setV2CampaignId] = useState("all");
  const report = useLiveQuery(() => readDailyReport(selectedDate), [selectedDate], undefined);
  const campaignOptions = useLiveQuery(
    () => db.campaigns.toArray(),
    [],
    []
  ).filter((campaign) => !campaign.deleted_at && campaign.is_active && typeof campaign.id === "number");
  const v2Summary = useLiveQuery(
    () =>
      readReportingV2Summary({
        fromDate: v2FromDate,
        toDate: v2ToDate,
        campaignId: v2CampaignId === "all" ? null : Number(v2CampaignId)
      }),
    [v2FromDate, v2ToDate, v2CampaignId],
    undefined
  );
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
  const v2Cards: ReportCard[] = [
    {
      label: "Toplam görüşme kaydı",
      value: v2Summary?.totals.totalCallLogs ?? 0,
      hint: "Seçilen aralıkta aktif iletişim kayıtları"
    },
    {
      label: "İşlem gören tekil aday",
      value: v2Summary?.totals.uniqueStudentsWithCallLogs ?? 0,
      hint: "Seçilen aralıkta en az bir kaydı olan adaylar"
    },
    {
      label: "Randevu Verildi",
      value: v2Summary?.totals.appointmentResults ?? 0,
      hint: "CRM görüşme sonucu",
      ariaLabel: "CRM görüşme sonucu: Randevu Verildi",
      tone: "warning"
    },
    {
      label: "Kayıt Oldu",
      value: v2Summary?.totals.registeredResults ?? 0,
      hint: "CRM görüşme sonucu",
      ariaLabel: "CRM görüşme sonucu: Kayıt Oldu",
      tone: "good"
    },
    { label: "Ulaşılamadı", value: v2Summary?.totals.notReached ?? 0, tone: "danger" },
    { label: "Görüşüldü", value: v2Summary?.totals.reached ?? 0, tone: "good" }
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

      <section className="reporting-v2-panel" aria-label="Raporlama V2 özeti">
        <div className="reporting-v2-header">
          <div>
            <h2>Raporlama V2 özeti</h2>
            <p>Tarih aralığı ve kampanya kırılımıyla read-only yönetici özeti.</p>
          </div>
          <div className="reporting-v2-toolbar" aria-label="Raporlama V2 filtreleri">
            <label className="reporting-v2-field">
              <span>Başlangıç tarihi</span>
              <input
                aria-label="Raporlama V2 başlangıç tarihi"
                type="date"
                value={v2FromDate}
                onChange={(event) => setV2FromDate(event.target.value)}
              />
            </label>
            <label className="reporting-v2-field">
              <span>Bitiş tarihi</span>
              <input
                aria-label="Raporlama V2 bitiş tarihi"
                type="date"
                value={v2ToDate}
                onChange={(event) => setV2ToDate(event.target.value)}
              />
            </label>
            <label className="reporting-v2-field reporting-v2-field-wide">
              <span>Kampanya filtresi</span>
              <select value={v2CampaignId} onChange={(event) => setV2CampaignId(event.target.value)}>
                <option value="all">Tüm kampanyalar</option>
                {campaignOptions.map((campaign) => (
                  <option value={campaign.id} key={campaign.id}>
                    {campaign.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <p className="reporting-v2-note">
          Kampanya kırılımı adayın güncel kampanyasına göre hesaplanır.
        </p>

        <div className="reporting-v2-metric-grid" aria-label="Raporlama V2 kartları">
          {v2Cards.map((card) => (
            <div className={`reporting-v2-metric-card ${card.tone ?? "neutral"}`} key={card.label} aria-label={card.ariaLabel}>
              <span>{card.label}</span>
              <strong>{card.value}</strong>
              {card.hint ? <p>{card.hint}</p> : null}
            </div>
          ))}
        </div>

        <div className="reporting-v2-content-grid">
          <section className="reporting-v2-subpanel">
            <h3>Görüşme sonucu dağılımı</h3>
            <div className="reporting-v2-table-wrap">
              <table className="reporting-v2-table reporting-v2-table-compact">
                <thead>
                  <tr>
                    <th>Görüşme sonucu</th>
                    <th>Kayıt sayısı</th>
                  </tr>
                </thead>
                <tbody>
                  {(v2Summary?.byCallResult ?? []).map((row) => (
                    <tr key={row.callResult}>
                      <td>{row.label}</td>
                      <td>{row.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="reporting-v2-side-stack">
            <section className="reporting-v2-subpanel">
              <h3>Kampanya bazlı sonuç tablosu</h3>
              <div className="reporting-v2-table-wrap">
                <table className="reporting-v2-table reporting-v2-campaign-table">
                  <thead>
                    <tr>
                      <th>Kampanya</th>
                      <th>Tekil aday</th>
                      <th>Toplam kayıt</th>
                      <th>Görüşüldü</th>
                      <th>Ulaşılamadı</th>
                      <th>Randevu Verildi</th>
                      <th>Kayıt Oldu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {v2Summary?.byCampaign.length ? (
                      v2Summary.byCampaign.map((row) => (
                        <tr key={`${row.campaignId ?? "default"}-${row.campaignName}`}>
                          <td title={row.campaignName}>{row.campaignName}</td>
                          <td>{row.uniqueStudentsWithCallLogs}</td>
                          <td>{row.totalCallLogs}</td>
                          <td>{row.byCallResult.find((result) => result.callResult === "reached")?.count ?? 0}</td>
                          <td>{row.byCallResult.find((result) => result.callResult === "not_reached")?.count ?? 0}</td>
                          <td>{row.byCallResult.find((result) => result.callResult === "appointment")?.count ?? 0}</td>
                          <td>{row.byCallResult.find((result) => result.callResult === "registered")?.count ?? 0}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7}>Seçilen aralık için kampanya kırılımı yok.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="reporting-v2-subpanel">
              <h3>Günlük trend</h3>
              <div className="reporting-v2-table-wrap">
                <table className="reporting-v2-table reporting-v2-trend-table">
                  <thead>
                    <tr>
                      <th>Tarih</th>
                      <th>Toplam kayıt</th>
                      <th>Tekil aday</th>
                      <th>Randevu Verildi</th>
                      <th>Kayıt Oldu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(v2Summary?.dailyTrend ?? []).map((row) => (
                      <tr key={row.date}>
                        <td>{row.date}</td>
                        <td>{row.totalCallLogs}</td>
                        <td>{row.uniqueStudentsWithCallLogs}</td>
                        <td>{row.appointmentResults}</td>
                        <td>{row.registeredResults}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>
      </section>

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
