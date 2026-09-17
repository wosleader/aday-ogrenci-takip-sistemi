import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Outlet, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AppOutletContext } from "../../src/app/AppLayout";
import { db } from "../../src/db/db";
import type { CallLogRecord } from "../../src/domain/models/callLog";
import { ReportsPage } from "../../src/features/reports/ReportsPage";
import { getTodayInputValue } from "../../src/features/reports/services/dailyReportReader";
import { createSearchText, normalizeText } from "../../src/utils/normalizeText";

const timestamp = "2026-05-10T09:00:00.000";

function TestOutletHost({ openStudentById }: { openStudentById: (studentId: number) => void }) {
  return (
    <Outlet
      context={{
        globalSearch: "",
        focusGlobalSearch: vi.fn(),
        openStudentById,
        pendingOpenStudentId: null,
        consumePendingOpenStudentId: vi.fn(),
        pendingSearchListRequestId: null,
        consumePendingSearchListRequest: vi.fn()
      } satisfies AppOutletContext}
    />
  );
}

function renderReportsPage(openStudentById = vi.fn()) {
  render(
    <MemoryRouter initialEntries={["/reports"]}>
      <Routes>
        <Route element={<TestOutletHost openStudentById={openStudentById} />}>
          <Route path="/reports" element={<ReportsPage />} />
        </Route>
      </Routes>
    </MemoryRouter>
  );

  return { openStudentById };
}

async function seedDailyCall() {
  const campaignId = await db.campaigns.add({
    uuid: "campaign-report-page",
    name: "YKS Kampanyası",
    is_default: false,
    is_active: true,
    created_at: timestamp,
    updated_at: timestamp,
    sync_status: "local"
  });
  const studentId = await db.students.add({
    uuid: "student-report-page",
    student_full_name: "AYSE YILMAZ",
    normalized_student_name: normalizeText("AYSE YILMAZ"),
    search_text: createSearchText(["AYSE YILMAZ", "FATMA YILMAZ"]),
    current_class: "11",
    student_group: "YKS",
    category: "YKS",
    campaign_id: campaignId,
    lifecycle_status: "candidate",
    last_call_result: "reached",
    created_at: timestamp,
    updated_at: timestamp,
    sync_status: "local"
  });
  await db.guardians.add({
    uuid: "guardian-report-page",
    student_id: studentId,
    guardian_full_name: "FATMA YILMAZ",
    normalized_guardian_name: normalizeText("FATMA YILMAZ"),
    created_at: timestamp,
    updated_at: timestamp,
    sync_status: "local"
  });
  await db.call_logs.add({
    uuid: "call-report-page",
    student_id: studentId,
    call_time: timestamp,
    call_result: "reached",
    note: "Veli bilgi istedi",
    created_at: timestamp,
    updated_at: timestamp,
    sync_status: "local"
  });

  return studentId;
}

function dateOffset(dateInput: string, days: number): string {
  const date = new Date(`${dateInput}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

async function seedDashboardKpis(includePrevious = true) {
  const studentId = await db.students.add({
    uuid: "student-dashboard-kpi",
    student_full_name: "DASHBOARD KPI",
    normalized_student_name: normalizeText("DASHBOARD KPI"),
    search_text: createSearchText(["DASHBOARD KPI"]),
    current_class: "11",
    student_group: "YKS",
    category: "YKS",
    campaign_id: null,
    lifecycle_status: "candidate",
    last_call_result: "reached",
    created_at: timestamp,
    updated_at: timestamp,
    sync_status: "local"
  });
  const today = getTodayInputValue();
  const previousDate = dateOffset(today, -7);
  const callLogs: CallLogRecord[] = [
    { uuid: "dashboard-current-1", student_id: studentId, call_time: `${today}T09:00:00`, call_result: "reached", note: null, created_at: `${today}T09:00:00`, updated_at: `${today}T09:00:00`, sync_status: "local" },
    { uuid: "dashboard-current-2", student_id: studentId, call_time: `${today}T10:00:00`, call_result: "not_reached", note: null, created_at: `${today}T10:00:00`, updated_at: `${today}T10:00:00`, sync_status: "local" }
  ];
  if (includePrevious) {
    callLogs.push({ uuid: "dashboard-previous-1", student_id: studentId, call_time: `${previousDate}T09:00:00`, call_result: "reached", note: null, created_at: `${previousDate}T09:00:00`, updated_at: `${previousDate}T09:00:00`, sync_status: "local" });
  }
  await db.call_logs.bulkAdd(callLogs);
}

describe("ReportsPage", () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    window.localStorage.clear();
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await db.delete();
  });

  it("opens on the manager dashboard by default", async () => {
    renderReportsPage();

    expect(screen.getByRole("heading", { name: "Raporlar" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Yönetici Dashboard" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Detaylı Raporlar" })).toHaveAttribute("aria-selected", "false");
    expect(screen.getByRole("heading", { name: "Yönetici Dashboard" })).toBeInTheDocument();
    expect(screen.getByLabelText("Dashboard başlangıç tarihi")).toBeInTheDocument();
    expect(screen.getByLabelText("Dashboard bitiş tarihi")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Genel KPI" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Raporlama V2 özeti" })).not.toBeInTheDocument();
  });

  it("renders the Reporting V2 read-only summary under Detailed Reports", async () => {
    renderReportsPage();
    await userEvent.click(screen.getByRole("tab", { name: "Detaylı Raporlar" }));

    expect(screen.getByRole("heading", { name: "Raporlama V2 özeti" })).toBeInTheDocument();
    expect(screen.getByLabelText("Raporlama V2 başlangıç tarihi")).toBeInTheDocument();
    expect(screen.getByLabelText("Raporlama V2 bitiş tarihi")).toBeInTheDocument();
    expect(screen.getByLabelText("Kampanya filtresi")).toBeInTheDocument();
    expect(screen.getAllByText("Toplam görüşme kaydı").length).toBeGreaterThan(0);
    expect(screen.getAllByText("İşlem gören tekil aday").length).toBeGreaterThan(0);
    expect(screen.getByLabelText("CRM görüşme sonucu: Randevu Verildi")).toBeInTheDocument();
    expect(screen.getByLabelText("CRM görüşme sonucu: Kayıt Oldu")).toBeInTheDocument();
    expect(screen.getAllByText("Randevu Verildi").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Kayıt Oldu").length).toBeGreaterThan(0);
    expect(screen.getAllByText("CRM görüşme sonucu").length).toBeGreaterThan(0);
    expect(screen.getByText("Görüşme sonucu dağılımı")).toBeInTheDocument();
    expect(screen.getByText("Kampanya bazlı sonuç tablosu")).toBeInTheDocument();
    expect(screen.getByText("Günlük trend")).toBeInTheDocument();
    expect(screen.getByText("Kampanya kırılımı adayın güncel kampanyasına göre hesaplanır.")).toBeInTheDocument();
  });

  it("opens the selected student from the recent calls list", async () => {
    const studentId = await seedDailyCall();
    const openStudentById = vi.fn();
    renderReportsPage(openStudentById);
    await userEvent.click(screen.getByRole("tab", { name: "Detaylı Raporlar" }));
    fireEvent.change(screen.getByLabelText("Rapor tarihi"), { target: { value: "2026-05-10" } });

    expect(await screen.findByText("AYSE YILMAZ")).toBeInTheDocument();
    expect(screen.getByText("FATMA YILMAZ")).toBeInTheDocument();
    expect(screen.getByText("Veli bilgi istedi")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Adayı Aç" }));

    expect(openStudentById).toHaveBeenCalledWith(studentId);
  });

  it("uses the Reporting V2 campaign filter without changing the daily report", async () => {
    await seedDailyCall();
    renderReportsPage();
    await userEvent.click(screen.getByRole("tab", { name: "Detaylı Raporlar" }));
    fireEvent.change(screen.getByLabelText("Rapor tarihi"), { target: { value: "2026-05-10" } });

    expect(await screen.findByText("YKS Kampanyası")).toBeInTheDocument();
    await userEvent.selectOptions(screen.getByLabelText("Kampanya filtresi"), "1");

    expect(await screen.findByText("AYSE YILMAZ")).toBeInTheDocument();
    expect(screen.getByText("Veli bilgi istedi")).toBeInTheDocument();
  });

  it("keeps presets temporary and supports customization and help", async () => {
    const user = userEvent.setup();
    renderReportsPage();

    const startDate = screen.getByLabelText("Dashboard başlangıç tarihi") as HTMLInputElement;
    const endDate = screen.getByLabelText("Dashboard bitiş tarihi") as HTMLInputElement;
    const quickRange = screen.getByRole("combobox", { name: "Hızlı aralık" }) as HTMLSelectElement;
    expect(startDate.value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(quickRange.value).toBe("7");
    const today = endDate.value;

    await user.selectOptions(quickRange, "5");
    expect(quickRange.value).toBe("5");
    expect(startDate.value).toBe(dateOffset(today, -4));
    expect(endDate.value).toBe(today);

    await user.selectOptions(quickRange, "14");
    expect(quickRange.value).toBe("14");
    expect(startDate.value).toBe(dateOffset(today, -13));

    await user.selectOptions(quickRange, "30");
    expect(quickRange.value).toBe("30");
    expect(startDate.value).toBe(dateOffset(today, -29));
    expect(window.localStorage.getItem("aday.dashboard.defaultRange.v1")).toBeNull();

    fireEvent.change(startDate, { target: { value: dateOffset(today, -2) } });
    expect(quickRange.value).toBe("custom");
    expect(screen.getByRole("option", { name: "Özel aralık" })).toBeDisabled();

    fireEvent.change(startDate, { target: { value: dateOffset(today, -6) } });
    expect(quickRange.value).toBe("7");

    fireEvent.change(startDate, { target: { value: today } });
    fireEvent.change(endDate, { target: { value: dateOffset(today, -6) } });
    expect(quickRange.value).toBe("7");

    fireEvent.change(endDate, { target: { value: today } });
    fireEvent.change(startDate, { target: { value: dateOffset(today, -30) } });
    expect(quickRange.value).toBe("custom");
    expect(await screen.findByRole("alert")).toHaveTextContent("en fazla 30 günlük");

    await user.click(screen.getByRole("button", { name: /Görünümü Özelleştir/ }));
    expect(screen.getByRole("dialog", { name: "Görünümü Özelleştir" })).toBeInTheDocument();
    await user.click(screen.getByRole("checkbox", { name: "Günlük Trend" }));
    expect(screen.queryByRole("heading", { name: "Günlük Trend" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Tamam" }));

    await user.click(screen.getByRole("button", { name: "Yardım" }));
    expect(screen.getByRole("dialog", { name: "Dashboard Yardım" })).toBeInTheDocument();
    expect(screen.getByText(/görüşme süresi veya dakika metriği değildir/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Yardımı kapat" }));
    expect(screen.queryByRole("dialog", { name: "Dashboard Yardım" })).not.toBeInTheDocument();
  });

  it("explains KPI deltas with current and previous values", async () => {
    await seedDashboardKpis();
    renderReportsPage();

    const card = (await screen.findByText("Toplam Görüşme Kaydı")).closest("article");
    expect(card).not.toBeNull();
    expect(within(card!).getByText("+1 · +%100")).toBeInTheDocument();

    const comparison = within(card!).getByText("+1 · +%100");
    expect(comparison.parentElement).toHaveAttribute("tabindex", "0");
    expect(comparison.parentElement).toHaveAttribute("aria-describedby");
    expect(within(card!).getByRole("tooltip", { hidden: true })).toHaveTextContent("Bu dönem: 2");
    expect(within(card!).getByRole("tooltip", { hidden: true })).toHaveTextContent("Önceki dönem: 1");
    expect(within(card!).getByRole("tooltip", { hidden: true })).toHaveTextContent("1 artış (%100)");
    expect(within(card!).getByRole("tooltip", { hidden: true })).not.toHaveTextContent(/NaN|Infinity/);
  });

  it("explains that percentage comparison is unavailable when the previous period is zero", async () => {
    await seedDashboardKpis(false);
    renderReportsPage();

    const card = (await screen.findByText("Toplam Görüşme Kaydı")).closest("article");
    expect(card).not.toBeNull();
    expect(within(card!).getByRole("tooltip", { hidden: true })).toHaveTextContent("Bu dönem: 2");
    expect(within(card!).getByRole("tooltip", { hidden: true })).toHaveTextContent("Önceki dönem: 0");
    expect(within(card!).getByRole("tooltip", { hidden: true })).toHaveTextContent("Değişim: +2");
    expect(within(card!).getByRole("tooltip", { hidden: true })).toHaveTextContent("Yüzdesel karşılaştırma önceki dönem 0 olduğu için hesaplanamaz.");
    expect(within(card!).getByRole("tooltip", { hidden: true })).not.toHaveTextContent(/NaN|Infinity/);
  });
});
