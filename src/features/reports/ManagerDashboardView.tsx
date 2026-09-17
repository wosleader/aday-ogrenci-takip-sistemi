import { useLiveQuery } from "dexie-react-hooks";
import { useId, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { HelpCircle, RotateCcw, SlidersHorizontal, X } from "lucide-react";
import type { AppOutletContext } from "../../app/AppLayout";
import { Button } from "../../components/Button";
import { getTodayInputValue } from "./services/dailyReportReader";
import { createLocalDayRange } from "./services/dailyReportReader";
import { readDashboardDefaultRange } from "./services/dashboardPreferences";
import { normalizeDashboardDateRange } from "./services/dashboardDateRange";
import { readDashboardAppointmentSummary } from "./services/dashboardAppointmentReader";
import { readDashboardAttention } from "./services/dashboardAttentionReader";
import { readDashboardOverview } from "./services/dashboardOverviewReader";
import { readDashboardReminderHealth } from "./services/dashboardReminderReader";
import { readFirstPhoneAttemptAt, readPhoneAttemptEfficiency } from "./services/phoneAttemptReader";
import {
  DASHBOARD_WIDGET_KEYS,
  DASHBOARD_WIDGET_LABELS,
  readDashboardWidgetVisibility,
  resetDashboardWidgetVisibility,
  writeDashboardWidgetVisibility,
  type DashboardWidgetKey,
  type DashboardWidgetVisibility
} from "./dashboardUi";

type DashboardViewProps = Pick<AppOutletContext, "openStudentById">;

function dateDaysAgo(today: string, days: number): string {
  const date = createLocalDayRange(today).start;
  date.setDate(date.getDate() - days + 1);
  return createLocalDayRange(date).date_input_value;
}

function formatPercent(value: number | null): string {
  return value === null ? "-" : `%${(value * 100).toLocaleString("tr-TR", { maximumFractionDigits: 1 })}`;
}

function formatDelta(value: number): string {
  return value > 0 ? `+${value}` : value < 0 ? `−${Math.abs(value)}` : "0";
}

function formatMetricValue(value: number): string {
  return Number.isFinite(value) ? value.toLocaleString("tr-TR") : "0";
}

function formatPercentDelta(value: number, signed = true): string {
  if (!Number.isFinite(value)) {
    return "-";
  }

  const sign = signed ? (value > 0 ? "+" : value < 0 ? "−" : "") : "";
  return `${sign}%${Math.abs(value * 100).toLocaleString("tr-TR", { maximumFractionDigits: 1 })}`;
}

function getMetricComparisonText(metric: { current: number; previous: number; absoluteDelta: number; percentDelta: number | null }): string {
  const current = Number.isFinite(metric.current) ? metric.current : 0;
  const previous = Number.isFinite(metric.previous) ? metric.previous : 0;
  const absoluteDelta = Number.isFinite(metric.absoluteDelta) ? metric.absoluteDelta : 0;
  const percentDelta = metric.percentDelta !== null && Number.isFinite(metric.percentDelta) ? metric.percentDelta : null;
  const lines = ["Önceki eşit dönemle karşılaştırma", `Bu dönem: ${formatMetricValue(current)}`, `Önceki dönem: ${formatMetricValue(previous)}`];

  if (absoluteDelta === 0) {
    lines.push("Değişim yok");
  } else if (previous === 0 || percentDelta === null) {
    lines.push(`Değişim: ${formatDelta(absoluteDelta)}`);
    lines.push("Yüzdesel karşılaştırma önceki dönem 0 olduğu için hesaplanamaz.");
  } else {
    const direction = absoluteDelta > 0 ? "artış" : "azalma";
    lines.push(`Değişim: ${formatMetricValue(Math.abs(absoluteDelta))} ${direction} (${formatPercentDelta(percentDelta, false)})`);
  }

  return lines.join("\n");
}

function MetricCard({ label, metric }: { label: string; metric?: { current: number; previous: number; absoluteDelta: number; percentDelta: number | null } }) {
  const tooltipId = useId();
  const current = typeof metric?.current === "number" && Number.isFinite(metric.current) ? metric.current : 0;
  const previous = typeof metric?.previous === "number" && Number.isFinite(metric.previous) ? metric.previous : 0;
  const absoluteDelta = typeof metric?.absoluteDelta === "number" && Number.isFinite(metric.absoluteDelta) ? metric.absoluteDelta : 0;
  const percentDelta = typeof metric?.percentDelta === "number" && Number.isFinite(metric.percentDelta) ? metric.percentDelta : null;
  const comparison = getMetricComparisonText({ current, previous, absoluteDelta, percentDelta });

  return (
    <article className="dashboard-kpi-card">
      <span>{label}</span>
      <strong>{formatMetricValue(current)}</strong>
      <small className="dashboard-kpi-comparison" tabIndex={0} aria-describedby={tooltipId}>
        <span aria-hidden="true">{formatDelta(absoluteDelta)}{percentDelta === null ? "" : ` · ${formatPercentDelta(percentDelta)}`}</span>
        <span className="dashboard-kpi-tooltip" id={tooltipId} role="tooltip">{comparison}</span>
      </small>
    </article>
  );
}

function LoadingBlock({ label }: { label: string }) {
  return <div className="dashboard-loading" role="status">{label} yükleniyor...</div>;
}

function HelpDialog({ onClose }: { onClose: () => void }) {
  return (
    <div className="dashboard-dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="dashboard-dialog" role="dialog" aria-modal="true" aria-labelledby="dashboard-help-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="dashboard-dialog-header"><div><h2 id="dashboard-help-title">Dashboard Yardım</h2><p>Yönetici görünümündeki metriklerin kısa açıklaması.</p></div><button className="dashboard-icon-button" type="button" aria-label="Yardımı kapat" onClick={onClose}><X size={18} /></button></div>
        <div className="dashboard-help-list">
          <details open><summary>Tarih Aralığı</summary><p>Dashboard seçtiğiniz yerel takvim günlerini kapsar. Ön tanımlı aralık Ayarlar'dan belirlenir; buradaki seçim geçicidir.</p></details>
          <details><summary>KPI'lar ve Önceki Dönem</summary><p>Üst kartlar aktif kayıtları gösterir. Değişim, aynı uzunluktaki önceki dönemle karşılaştırılır; önceki dönem boşsa yalnız fark gösterilir.</p></details>
          <details><summary>Görüşme Sonucu Dağılımı</summary><p>Görüşme kayıtlarının sonuçlara göre sayımıdır. Bu bir başarı skoru değildir.</p></details>
          <details><summary>Kampanya Performansı</summary><p>Görüşme kayıtları adayın güncel kampanyasına göre gruplanır.</p></details>
          <details><summary>Hatırlatma Sağlığı</summary><p>Açık telefon hatırlatmalarının süresi geçmiş, bugün, yaklaşan ve toplam sayılarını gösterir.</p></details>
          <details><summary>Randevu Durumu</summary><p>Bu bölüm gerçek randevu yaşam döngüsünü gösterir. Randevu Verildi ise görüşme sırasında seçilen CRM sonucudur.</p></details>
          <details><summary>Temas Verimliliği</summary><p>İlk sağlıklı telefon temasına ulaşmak için kaç farklı numaranın denendiğini gösterir. Bu görüşme süresi veya dakika metriği değildir; yalnız gerçek telefon denemelerini ölçer.</p><p>Örnek: Telefon 1 Yanlış Numara, Telefon 2 Kullanılmıyor, Telefon 3 Meşgul, Telefon 4 Görüşüldü ise ilk sağlıklı temas denemesi 4 olur. Aynı telefon tekrar denenirse bir kez sayılır; geçmiş data uydurulmaz.</p></details>
          <details><summary>Kampanya Bazlı Temas Verimliliği</summary><p>Bu tablo kampanya satış başarısını değil, aday datasındaki iletişim erişilebilirliğini gösterir. Ortalama deneme sayısı temas oranıyla birlikte okunmalıdır.</p></details>
          <details><summary>Yönetici Dikkat Alanları</summary><p>Yalnız kesin durumlar gösterilir: gecikmiş açık aramalar, bugünkü bekleyen randevular ve kullanılabilir telefonu olmayan adaylar.</p></details>
          <details><summary>Görünümü Özelleştir</summary><p>Blokları gizlemek yalnız bu ekranın görünümünü değiştirir; iş verilerinde değişiklik yapmaz.</p></details>
        </div>
      </section>
    </div>
  );
}

function CustomizeDialog({ visibility, onChange, onReset, onClose }: { visibility: DashboardWidgetVisibility; onChange: (key: DashboardWidgetKey, value: boolean) => void; onReset: () => void; onClose: () => void }) {
  return (
    <div className="dashboard-dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="dashboard-dialog dashboard-customize-dialog" role="dialog" aria-modal="true" aria-labelledby="dashboard-customize-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="dashboard-dialog-header"><div><h2 id="dashboard-customize-title">Görünümü Özelleştir</h2><p>İstemediğiniz blokları bu görünümden kaldırın.</p></div><button className="dashboard-icon-button" type="button" aria-label="Özelleştirmeyi kapat" onClick={onClose}><X size={18} /></button></div>
        <div className="dashboard-customize-list">{DASHBOARD_WIDGET_KEYS.map((key) => <label key={key}><input type="checkbox" checked={visibility[key]} onChange={(event) => onChange(key, event.target.checked)} />{DASHBOARD_WIDGET_LABELS[key]}</label>)}</div>
        <div className="dashboard-dialog-actions"><Button variant="secondary" onClick={onReset}><RotateCcw size={16} /> Varsayılan Görünüme Dön</Button><Button onClick={onClose}>Tamam</Button></div>
      </section>
    </div>
  );
}

export function ManagerDashboardView({ openStudentById }: DashboardViewProps) {
  const today = getTodayInputValue();
  const defaultRange = readDashboardDefaultRange();
  const [fromDate, setFromDate] = useState(() => dateDaysAgo(today, defaultRange));
  const [toDate, setToDate] = useState(today);
  const [rangeError, setRangeError] = useState("");
  const [visibility, setVisibility] = useState<DashboardWidgetVisibility>(() => readDashboardWidgetVisibility());
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const range = useMemo(() => normalizeDashboardDateRange(fromDate, toDate), [fromDate, toDate]);
  const validRange = !rangeError && range.dayCount <= 30;
  const overviewNeeded = visibility.overview || visibility.distribution || visibility.dailyTrend || visibility.campaignPerformance;
  const overview = useLiveQuery(() => validRange && overviewNeeded ? readDashboardOverview({ fromDate, toDate }) : Promise.resolve(undefined), [fromDate, toDate, validRange, overviewNeeded], undefined);
  const reminders = useLiveQuery(() => validRange && visibility.reminderHealth ? readDashboardReminderHealth() : Promise.resolve(undefined), [validRange, visibility.reminderHealth], undefined);
  const appointments = useLiveQuery(() => validRange && visibility.appointmentLifecycle ? readDashboardAppointmentSummary(range) : Promise.resolve(undefined), [range.fromDate, range.toDate, validRange, visibility.appointmentLifecycle], undefined);
  const attention = useLiveQuery(() => validRange && visibility.attention ? readDashboardAttention() : Promise.resolve(undefined), [validRange, visibility.attention], undefined);
  const contactEfficiency = useLiveQuery(() => validRange && (visibility.contactEfficiency || visibility.campaignContactEfficiency) ? readPhoneAttemptEfficiency({ start: range.start_iso, end: range.end_iso }) : Promise.resolve(undefined), [range.start_iso, range.end_iso, validRange, visibility.contactEfficiency, visibility.campaignContactEfficiency], undefined);
  const measurementStart = useLiveQuery(() => visibility.contactEfficiency || visibility.campaignContactEfficiency ? readFirstPhoneAttemptAt() : Promise.resolve(undefined), [visibility.contactEfficiency, visibility.campaignContactEfficiency], undefined);
  const quickRangeValue = [5, 7, 14, 30].find((days) => range.dayCount === days && range.fromDate === dateDaysAgo(today, days) && range.toDate === today)?.toString() ?? "custom";
  const handleRangeChange = (kind: "from" | "to", value: string) => {
    const nextFrom = kind === "from" ? value : fromDate;
    const nextTo = kind === "to" ? value : toDate;
    const nextRange = normalizeDashboardDateRange(nextFrom, nextTo);
    setRangeError(nextRange.dayCount > 30 ? "Dashboard en fazla 30 günlük aralık gösterebilir. Daha uzun dönem için Detaylı Raporlar'ı kullanın." : "");
    kind === "from" ? setFromDate(value) : setToDate(value);
  };
  const applyPreset = (days: number) => {
    setFromDate(dateDaysAgo(today, days));
    setToDate(today);
    setRangeError("");
  };
  const handleQuickRangeChange = (value: string) => {
    if (value !== "custom") {
      applyPreset(Number(value));
    }
  };
  const updateVisibility = (key: DashboardWidgetKey, value: boolean) => {
    const next = { ...visibility, [key]: value };
    setVisibility(next);
    writeDashboardWidgetVisibility(next);
  };
  const resetVisibility = () => setVisibility(resetDashboardWidgetVisibility());
  const kpis = overview?.kpis;

  return (
    <div className="manager-dashboard-view">
      <div className="dashboard-toolbar">
        <div><h2>Yönetici Dashboard</h2><p>Görüşme, randevu ve temas verimliliğini tek bakışta izleyin.</p></div>
        <div className="dashboard-toolbar-actions"><Button variant="secondary" onClick={() => setCustomizeOpen(true)}><SlidersHorizontal size={16} /> Görünümü Özelleştir</Button><Button variant="secondary" onClick={() => setHelpOpen(true)}><HelpCircle size={16} /> Yardım</Button></div>
      </div>
      <section className="dashboard-filter-panel" aria-label="Dashboard tarih filtresi"><div className="dashboard-filter-controls"><div className="dashboard-date-fields"><label><span>Başlangıç tarihi</span><input aria-label="Dashboard başlangıç tarihi" type="date" value={fromDate} onChange={(event) => handleRangeChange("from", event.target.value)} /></label><label><span>Bitiş tarihi</span><input aria-label="Dashboard bitiş tarihi" type="date" value={toDate} onChange={(event) => handleRangeChange("to", event.target.value)} /></label></div><label className="dashboard-quick-range"><span>Hızlı aralık</span><select aria-label="Hızlı aralık" value={quickRangeValue} onChange={(event) => handleQuickRangeChange(event.target.value)}><option value="custom" disabled>Özel aralık</option>{[5, 7, 14, 30].map((days) => <option value={days.toString()} key={days}>{days} gün</option>)}</select></label></div>{rangeError ? <p className="dashboard-validation" role="alert">{rangeError}</p> : <small>Seçim yalnız bu ekran için geçerlidir. Varsayılan aralık Ayarlar'dan değişir.</small>}</section>
      {!validRange ? <div className="dashboard-empty-state">Dashboard verileri bu aralık için yüklenemedi.</div> : null}

      {visibility.overview ? <section className="dashboard-widget" aria-label="Genel KPI"><div className="dashboard-section-heading"><div><h3>Genel KPI</h3><p>Aktif görüşme kayıtları ve önceki eşit dönem karşılaştırması.</p></div><span title="Önceki eşit dönemle karşılaştırma">ⓘ</span></div>{overview ? <div className="dashboard-kpi-grid"><MetricCard label="Toplam Görüşme Kaydı" metric={kpis?.totalCallLogs} /><MetricCard label="İşlem Gören Tekil Aday" metric={kpis?.uniqueStudentsWithCallLogs} /><MetricCard label="Görüşüldü" metric={kpis?.reached} /><MetricCard label="Ulaşılamadı" metric={kpis?.notReached} /><MetricCard label="Tekrar Aranacak" metric={kpis?.callLater} /><MetricCard label="Randevu Verildi" metric={kpis?.appointmentResults} /><MetricCard label="Kayıt Oldu" metric={kpis?.registeredResults} /></div> : <LoadingBlock label="KPI" />}</section> : null}

      {visibility.distribution ? <section className="dashboard-widget" aria-label="Görüşme sonucu dağılımı"><div className="dashboard-section-heading"><div><h3>Görüşme Sonucu Dağılımı</h3><p>Tüm görüşme sonucu kategorileri.</p></div></div>{overview ? <div className="dashboard-distribution">{overview.byCallResult.map((row) => { const max = Math.max(...overview.byCallResult.map((item) => item.count), 1); return <div className="dashboard-distribution-row" key={row.callResult}><span>{row.label}</span><div className="dashboard-bar"><i style={{ width: `${(row.count / max) * 100}%` }} /></div><strong>{row.count}</strong></div>; })}</div> : <LoadingBlock label="Dağılım" />}</section> : null}

      {visibility.dailyTrend ? <section className="dashboard-widget"><div className="dashboard-section-heading"><div><h3>Günlük Trend</h3><p>Seçilen dönemdeki günlük hareket.</p></div></div>{overview ? <div className="dashboard-table-scroll"><table className="dashboard-table dashboard-trend-table"><thead><tr><th>Tarih</th><th>Toplam görüşme</th><th>Tekil aday</th><th>Görüşüldü</th><th>Ulaşılamadı</th></tr></thead><tbody>{overview.dailyTrend.map((row) => <tr key={row.date}><td>{row.date}</td><td>{row.totalCallLogs}</td><td>{row.uniqueStudents}</td><td>{row.reached}</td><td>{row.notReached}</td></tr>)}</tbody></table></div> : <LoadingBlock label="Trend" />}</section> : null}

      {visibility.campaignPerformance ? <section className="dashboard-widget"><div className="dashboard-section-heading"><div><h3>Kampanya Performansı</h3><p>Görüşme raporlaması adayın güncel kampanyasına göre hesaplanır.</p></div></div>{overview ? <div className="dashboard-table-scroll"><table className="dashboard-table dashboard-campaign-table"><thead><tr><th>Kampanya</th><th>Tekil aday</th><th>Toplam kayıt</th><th>Görüşüldü</th><th>Ulaşılamadı</th><th>Tekrar aranacak</th><th>Randevu Verildi</th><th>Kayıt Oldu</th></tr></thead><tbody>{overview.byCampaign.length ? overview.byCampaign.map((row) => <tr key={`${row.campaignId ?? "none"}-${row.campaignName}`}><td>{row.campaignName}</td><td>{row.uniqueStudents}</td><td>{row.totalCallLogs}</td><td>{row.reached}</td><td>{row.notReached}</td><td>{row.callLater}</td><td>{row.appointmentResults}</td><td>{row.registeredResults}</td></tr>) : <tr><td colSpan={8}>Seçilen aralıkta kampanya kaydı yok.</td></tr>}</tbody></table></div> : <LoadingBlock label="Kampanya" />}</section> : null}

      {visibility.reminderHealth ? <section className="dashboard-widget dashboard-summary-widget"><div className="dashboard-section-heading"><div><h3>Reminder Health</h3><p>Açık telefon hatırlatmalarının durumu.</p></div><Link to="/reminders">Hatırlatmalara git</Link></div>{reminders ? <div className="dashboard-health-grid"><div><span>Süresi Geçen</span><strong>{reminders.overdue}</strong></div><div><span>Bugün</span><strong>{reminders.today}</strong></div><div><span>Yaklaşan</span><strong>{reminders.upcoming}</strong></div><div><span>Açık Toplam</span><strong>{reminders.openTotal}</strong></div></div> : <LoadingBlock label="Hatırlatma sağlığı" />}</section> : null}

      {visibility.appointmentLifecycle ? <section className="dashboard-widget dashboard-summary-widget"><div className="dashboard-section-heading"><div><h3>Randevu Durumu</h3><p><strong>Randevu Verildi</strong> görüşme sonucudur; bu bölüm gerçek randevu yaşam döngüsünü gösterir.</p></div></div>{appointments ? <div className="dashboard-health-grid dashboard-appointment-grid"><div><span>Toplam</span><strong>{appointments.total}</strong></div><div><span>Bekliyor</span><strong>{appointments.pending}</strong></div><div><span>Geldi</span><strong>{appointments.attended}</strong></div><div><span>Gelmedi</span><strong>{appointments.noShow}</strong></div><div><span>İptal</span><strong>{appointments.cancelled}</strong></div><div><span>Ertelendi</span><strong>{appointments.postponed}</strong></div><div><span>Kayıt Oldu</span><strong>{appointments.registered}</strong></div></div> : <LoadingBlock label="Randevu durumu" />}</section> : null}

      {visibility.attention ? <section className="dashboard-widget dashboard-summary-widget"><div className="dashboard-section-heading"><div><h3>Yönetici Dikkat Alanları</h3><p>Yalnız kesin ve işlem gerektiren durumlar.</p></div></div>{attention ? <div className="dashboard-attention-list"><div><strong>{attention.overdueCallReminders}</strong><span>Süresi geçmiş açık hatırlatma</span></div><div><strong>{attention.todaysPendingAppointments}</strong><span>Bugünkü bekleyen randevu</span></div><div><strong>{attention.candidatesWithoutUsablePhone.count}</strong><span>Kullanılabilir telefonu olmayan aktif aday</span></div></div> : <LoadingBlock label="Dikkat alanları" />}</section> : null}

      {visibility.contactEfficiency ? <ContactEfficiencyWidget efficiency={contactEfficiency} measurementStart={measurementStart} /> : null}
      {visibility.campaignContactEfficiency ? <CampaignContactEfficiencyWidget efficiency={contactEfficiency} /> : null}
      {customizeOpen ? <CustomizeDialog visibility={visibility} onChange={updateVisibility} onReset={resetVisibility} onClose={() => setCustomizeOpen(false)} /> : null}
      {helpOpen ? <HelpDialog onClose={() => setHelpOpen(false)} /> : null}
    </div>
  );
}

function ContactEfficiencyWidget({ efficiency, measurementStart }: { efficiency: Awaited<ReturnType<typeof readPhoneAttemptEfficiency>> | undefined; measurementStart: string | null | undefined }) {
  return <section className="dashboard-widget"><div className="dashboard-section-heading"><div><h3>Temas Verimliliği</h3><p>İlk sağlıklı telefon temasına ulaşmak için kaç farklı numaranın denendiğini gösterir.</p></div></div>{efficiency?.events.length ? <><div className="dashboard-efficiency-grid"><div><span>Temas Kurulan Aday</span><strong>{efficiency.contactedStudents}</strong></div><div><span>Temas Kurulamayan Aday</span><strong>{efficiency.uncontactedStudents}</strong></div><div><span>Temas Oranı</span><strong>{formatPercent(efficiency.contactRate)}</strong></div><div><span>Ort. İlk Sağlıklı Temas Denemesi</span><strong>{efficiency.averageHealthyAttempts?.toLocaleString("tr-TR", { maximumFractionDigits: 1 }) ?? "-"}</strong></div><div><span>İlk Telefonda Temas</span><strong>{formatPercent(efficiency.firstPhoneRate)}</strong></div><div><span>İlk 3 Telefonda Temas</span><strong>{formatPercent(efficiency.withinFirstThreeRate)}</strong></div><div><span>4+ Telefon Gerektiren</span><strong>{formatPercent(efficiency.fourPlusRate)}</strong></div></div>{measurementStart ? <small className="dashboard-source-note">Ölçüm {new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" }).format(new Date(measurementStart))} sonrasında kaydedilen telefon denemelerini kapsar.</small> : null}</> : <div className="dashboard-empty-state">Henüz Temas Verimliliği ölçüm verisi oluşmadı.</div>}</section>;
}

function CampaignContactEfficiencyWidget({ efficiency }: { efficiency: Awaited<ReturnType<typeof readPhoneAttemptEfficiency>> | undefined }) {
  return <section className="dashboard-widget"><div className="dashboard-section-heading"><div><h3>Kampanya Bazlı Temas Verimliliği</h3><p>Bu tablo kampanya satış başarısını değil, aday datasındaki iletişim erişilebilirliğini gösterir.</p></div></div>{efficiency?.events.length ? <div className="dashboard-table-scroll"><table className="dashboard-table dashboard-contact-table"><thead><tr><th>Kampanya</th><th>Temas Kurulan</th><th>Temas Kurulamayan</th><th>Temas Oranı</th><th>Ort. İlk Temas Denemesi</th><th>1. Telefonda</th><th>İlk 3 Telefonda</th><th>4+ Telefon</th></tr></thead><tbody>{efficiency.byCampaign.map((row) => <tr key={`${row.campaign_id ?? "none"}-${row.campaign_name}`}><td>{row.campaign_name}</td><td>{row.contactedStudents}</td><td>{row.uncontactedStudents}</td><td>{formatPercent(row.contactRate)}</td><td>{row.averageHealthyAttempts?.toLocaleString("tr-TR", { maximumFractionDigits: 1 }) ?? "-"}</td><td>{formatPercent(row.firstPhoneRate)}</td><td>{formatPercent(row.withinFirstThreeRate)}</td><td>{formatPercent(row.fourPlusRate)}</td></tr>)}</tbody></table></div> : <div className="dashboard-empty-state">Henüz Temas Verimliliği ölçüm verisi oluşmadı.</div>}</section>;
}
