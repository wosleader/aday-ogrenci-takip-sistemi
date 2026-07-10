import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Outlet, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AppOutletContext } from "../../src/app/AppLayout";
import { db } from "../../src/db/db";
import { ReportsPage } from "../../src/features/reports/ReportsPage";
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

describe("ReportsPage", () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await db.delete();
  });

  it("renders the page shell and empty state", () => {
    renderReportsPage();

    expect(screen.getByRole("heading", { name: "Raporlar" })).toBeInTheDocument();
    expect(screen.getByLabelText("Rapor tarihi")).toBeInTheDocument();
    expect(screen.getByText("Seçilen gün işlem yapılan aday")).toBeInTheDocument();
    expect(screen.getByText("Seçilen gün görüşme kaydı")).toBeInTheDocument();
    expect(screen.getByText("Süresi geçen hatırlatma")).toBeInTheDocument();
    expect(screen.getByText("Bugün aranacak hatırlatma")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Son görüşmeler" })).toBeInTheDocument();
    expect(screen.getByText("Bu gün için görüşme kaydı yok.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Açık hatırlatma özeti" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Hatırlatmalar sayfasına git" })).toHaveAttribute("href", "/reminders");
  });

  it("renders the Reporting V2 read-only summary controls and labels", () => {
    renderReportsPage();

    expect(screen.getByRole("heading", { name: "Raporlama V2 özeti" })).toBeInTheDocument();
    expect(screen.getByLabelText("Raporlama V2 başlangıç tarihi")).toBeInTheDocument();
    expect(screen.getByLabelText("Raporlama V2 bitiş tarihi")).toBeInTheDocument();
    expect(screen.getByLabelText("Kampanya filtresi")).toBeInTheDocument();
    expect(screen.getAllByText("Toplam görüşme kaydı").length).toBeGreaterThan(0);
    expect(screen.getAllByText("İşlem gören tekil aday").length).toBeGreaterThan(0);
    expect(screen.getAllByText("CRM görüşme sonucu: Randevu Verildi").length).toBeGreaterThan(0);
    expect(screen.getAllByText("CRM görüşme sonucu: Kayıt Oldu").length).toBeGreaterThan(0);
    expect(screen.getByText("Görüşme sonucu dağılımı")).toBeInTheDocument();
    expect(screen.getByText("Kampanya bazlı sonuç tablosu")).toBeInTheDocument();
    expect(screen.getByText("Günlük trend")).toBeInTheDocument();
    expect(screen.getByText("Kampanya kırılımı adayın güncel kampanyasına göre hesaplanır.")).toBeInTheDocument();
  });

  it("opens the selected student from the recent calls list", async () => {
    const studentId = await seedDailyCall();
    const openStudentById = vi.fn();
    renderReportsPage(openStudentById);
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
    fireEvent.change(screen.getByLabelText("Rapor tarihi"), { target: { value: "2026-05-10" } });

    expect(await screen.findByText("YKS Kampanyası")).toBeInTheDocument();
    await userEvent.selectOptions(screen.getByLabelText("Kampanya filtresi"), "1");

    expect(await screen.findByText("AYSE YILMAZ")).toBeInTheDocument();
    expect(screen.getByText("Veli bilgi istedi")).toBeInTheDocument();
  });
});
