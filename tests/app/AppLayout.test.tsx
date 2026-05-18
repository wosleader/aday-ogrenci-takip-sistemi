import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useOutletContext } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppLayout, type AppOutletContext } from "../../src/app/AppLayout";
import { db } from "../../src/db/db";
import {
  markDismissedReminderBadge,
  persistDismissedReminderAlert,
  readDismissedReminderSummaries,
  readDismissedReminderBadge
} from "../../src/features/reminders/services/reminderDismissalStore";
import type { DueReminderAlert } from "../../src/features/reminders/services/reminderAlarmReader";

const alert: DueReminderAlert = {
  reminder_id: 1,
  student_id: 10,
  student_full_name: "ZEYNEP SUBAŞI",
  guardian_full_name: "RAMAZAN SUBAŞI",
  reminder_at: "2026-05-09T11:00:00"
};

async function seedSearchStudent() {
  const now = "2026-05-10T10:00:00.000Z";
  const studentId = await db.students.add({
    uuid: "student-1",
    student_full_name: "ECEM ÇAKIR",
    normalized_student_name: "ecem cakir",
    search_text: "ecem cakir yildiz cakir 05352329429",
    current_class: "12",
    student_group: "YKS",
    category: "YKS",
    campaign_id: null,
    lifecycle_status: "candidate",
    last_call_result: "not_called",
    general_note: "Bu not dropdown sonucunda görünmemeli",
    created_at: now,
    updated_at: now,
    sync_status: "local"
  });
  const guardianId = await db.guardians.add({
    uuid: "guardian-1",
    student_id: studentId,
    guardian_full_name: "Yıldız Çakır",
    normalized_guardian_name: "yildiz cakir",
    created_at: now,
    updated_at: now,
    sync_status: "local"
  });
  await db.phones.bulkAdd([
    {
      uuid: "phone-1",
      student_id: studentId,
      guardian_id: guardianId,
      phone_number: "0535 232 9429",
      normalized_phone_number: "05352329429",
      phone_label: "Telefon 1",
      phone_status: "active",
      is_valid: true,
      is_wrong: false,
      is_primary: true,
      created_at: now,
      updated_at: now,
      sync_status: "local"
    }
  ]);

  return studentId;
}

async function seedManySearchStudents(count: number) {
  const now = "2026-05-10T10:00:00.000Z";

  for (let index = 1; index <= count; index += 1) {
    const studentId = await db.students.add({
      uuid: `student-many-${index}`,
      student_full_name: `ELIF CAKAL ${index}`,
      normalized_student_name: `elif cakal ${index}`,
      search_text: `elif cakal ${index} fadime cakal 05374122906`,
      current_class: "12",
      student_group: "YKS",
      category: "YKS",
      campaign_id: null,
      lifecycle_status: "candidate",
      last_call_result: "not_called",
      created_at: now,
      updated_at: now,
      sync_status: "local"
    });
    await db.guardians.add({
      uuid: `guardian-many-${index}`,
      student_id: studentId,
      guardian_full_name: "Fadime Çakal",
      normalized_guardian_name: "fadime cakal",
      created_at: now,
      updated_at: now,
      sync_status: "local"
    });
    await db.phones.add({
      uuid: `phone-many-${index}`,
      student_id: studentId,
      phone_number: "0537 412 2906",
      normalized_phone_number: "05374122906",
      phone_label: "Telefon 1",
      phone_status: "active",
      is_valid: true,
      is_wrong: false,
      is_primary: true,
      created_at: now,
      updated_at: now,
      sync_status: "local"
    });
  }
}

function StudentsProbe() {
  const { globalSearch, pendingOpenStudentId, pendingSearchListRequestId } = useOutletContext<AppOutletContext>();

  return (
    <div>
      <div>Aday: {pendingOpenStudentId ?? "yok"}</div>
      <div>Liste arama: {pendingSearchListRequestId ? "evet" : "hayır"}</div>
      <div>Liste sorgusu: {globalSearch || "boş"}</div>
    </div>
  );
}

function renderLayout(initialEntry = "/") {
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<div>İçerik</div>} />
          <Route path="/settings" element={<div>Ayarlar içerik</div>} />
          <Route path="/students" element={<StudentsProbe />} />
          <Route path="/reminders" element={<div>Hatırlatmalar içerik</div>} />
          <Route path="/reports" element={<div>Raporlar içerik</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe("AppLayout notifications", () => {
  beforeEach(async () => {
    window.localStorage.clear();
    await db.delete();
    await db.open();
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await db.delete();
  });

  it("hides the call screen and duplicate topbar import/export actions", () => {
    renderLayout();

    expect(screen.queryByText("Arama ekranı")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Excel içe aktar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /^Dışa aktar$/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /İçe aktarma/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Excel dışa aktar/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Hatırlatmalar/i })).toHaveAttribute("href", "/reminders");
    expect(screen.getByRole("link", { name: /Raporlar/i })).toHaveAttribute("href", "/reports");
  });

  it("shows the active shortcut in the global student search placeholder", () => {
    renderLayout();

    expect(screen.getByLabelText("Genel arama")).toHaveAttribute(
      "placeholder",
      "Aday, veli veya telefon ara... (F)"
    );
  });

  it("shows compact global search results and opens a student", async () => {
    const studentId = await seedSearchStudent();
    renderLayout("/settings");

    await userEvent.type(screen.getByLabelText("Genel arama"), "Ec");

    expect(await screen.findByRole("option", { name: /ECEM ÇAKIR/i })).toBeInTheDocument();
    expect(screen.getByText(/Yıldız Çakır/i)).toBeInTheDocument();
    expect(screen.getByText(/0535 232 9429/i)).toBeInTheDocument();
    const result = screen.getByRole("option", { name: /0535 232 9429/i });
    expect(result).toHaveTextContent(" - 0535 232 9429 / -");
    expect(result).not.toHaveTextContent("Â");
    expect(screen.queryByText(/dropdown sonucunda/i)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("option", { name: /ECEM ÇAKIR/i }));

    expect(screen.getByText(`Aday: ${studentId}`)).toBeInTheDocument();
  });

  it("keeps the global search dropdown closed on the student list route", async () => {
    await seedSearchStudent();
    renderLayout("/students");

    await userEvent.type(screen.getByLabelText("Genel arama"), "Ec");

    expect(screen.queryByRole("option")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Daha fazla/ })).not.toBeInTheDocument();
    expect(screen.getByText("Liste sorgusu: Ec")).toBeInTheDocument();
  });

  it("closes global search results on route changes without clearing the query", async () => {
    await seedSearchStudent();
    renderLayout("/settings");

    await userEvent.type(screen.getByLabelText("Genel arama"), "Ec");
    expect(await screen.findByRole("option", { name: /ECEM/i })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("link", { name: /Raporlar/i }));

    expect(screen.getByLabelText("Genel arama")).toHaveValue("Ec");
    expect(screen.queryByRole("option")).not.toBeInTheDocument();
  });

  it("navigates with visible sidebar shortcut badges", () => {
    renderLayout("/settings");

    fireEvent.keyDown(window, { key: "l" });
    expect(screen.getByText("Aday: yok")).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "h" });
    expect(screen.getByText("Hatırlatmalar içerik")).toBeInTheDocument();
  });

  it("does not trigger sidebar shortcuts while typing in editable targets", () => {
    renderLayout("/settings");

    const globalSearch = screen.getByLabelText("Genel arama");
    globalSearch.focus();
    fireEvent.keyDown(globalSearch, { key: "l" });
    fireEvent.keyDown(globalSearch, { key: "h" });

    expect(screen.getByText("Ayarlar içerik")).toBeInTheDocument();

    const editable = document.createElement("div");
    editable.setAttribute("contenteditable", "true");
    document.body.appendChild(editable);
    editable.focus();
    fireEvent.keyDown(editable, { key: "l" });
    fireEvent.keyDown(editable, { key: "h" });
    editable.remove();

    expect(screen.getByText("Ayarlar içerik")).toBeInTheDocument();
  });

  it("does not trigger sidebar shortcuts with modifier keys", () => {
    renderLayout("/settings");

    fireEvent.keyDown(window, { key: "l", ctrlKey: true });
    fireEvent.keyDown(window, { key: "h", altKey: true });
    fireEvent.keyDown(window, { key: "l", metaKey: true });

    expect(screen.getByText("Ayarlar içerik")).toBeInTheDocument();
  });

  it("limits global search results and sends more results to the student list", async () => {
    await seedManySearchStudents(9);
    renderLayout("/settings");

    await userEvent.type(screen.getByLabelText("Genel arama"), "El");

    await waitFor(() => expect(screen.getAllByRole("option")).toHaveLength(8));
    await userEvent.click(screen.getByRole("button", { name: "Daha fazla gör" }));

    expect(screen.getByText("Liste arama: evet")).toBeInTheDocument();
    expect(screen.getByText("Aday: yok")).toBeInTheDocument();
  });

  it("uses a friendly connection status instead of the old offline text", () => {
    renderLayout();

    expect(screen.queryByText("Çevrimdışı")).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Bağlantı durumu: İnternet var/i)).toBeInTheDocument();
  });

  it("shows amber friendly connection status when internet is unavailable", () => {
    vi.spyOn(window.navigator, "onLine", "get").mockReturnValue(false);
    renderLayout();

    const indicator = screen.getByLabelText(/İnternet yok/i);
    expect(indicator).toHaveClass("offline");
    expect(indicator).not.toHaveClass("online");
  });

  it("shows dismissed reminder details from the bell and clears only the badge", async () => {
    persistDismissedReminderAlert([], alert);
    markDismissedReminderBadge();
    renderLayout();

    const bellButton = screen.getByRole("button", { name: "Bildirimler" });
    expect(bellButton).toHaveClass("has-alert");

    await userEvent.click(bellButton);

    expect(screen.getByText("Kapatılmış hatırlatmalar")).toBeInTheDocument();
    expect(screen.getByText("ZEYNEP SUBAŞI")).toBeInTheDocument();
    expect(screen.getByText("Veli: RAMAZAN SUBAŞI")).toBeInTheDocument();
    expect(screen.getByText("Bildirim kapatıldı")).toBeInTheDocument();
    expect(readDismissedReminderBadge()).toBe(false);
  });

  it("closes the notification panel when clicking outside", async () => {
    persistDismissedReminderAlert([], alert);
    renderLayout();

    await userEvent.click(screen.getByRole("button", { name: "Bildirimler" }));
    expect(screen.getByRole("dialog", { name: /hatırlatmalar/i })).toBeInTheDocument();

    await userEvent.click(document.body);

    expect(screen.queryByRole("dialog", { name: /hatırlatmalar/i })).not.toBeInTheDocument();
  });

  it("removes one notification panel summary", async () => {
    persistDismissedReminderAlert([], alert);
    renderLayout();

    await userEvent.click(screen.getByRole("button", { name: "Bildirimler" }));
    await userEvent.click(screen.getByRole("button", { name: /panelden/ }));

    expect(readDismissedReminderSummaries()).toEqual([]);
  });

  it("clears all notification panel summaries", async () => {
    persistDismissedReminderAlert([], alert);
    renderLayout();

    await userEvent.click(screen.getByRole("button", { name: "Bildirimler" }));
    await userEvent.click(screen.getByRole("button", { name: "Hepsini temizle" }));

    expect(readDismissedReminderSummaries()).toEqual([]);
  });

  it("opens the student route from a dismissed reminder name", async () => {
    persistDismissedReminderAlert([], alert);
    renderLayout();

    await userEvent.click(screen.getByRole("button", { name: "Bildirimler" }));
    await userEvent.click(screen.getByRole("button", { name: alert.student_full_name }));

    expect(screen.getByText("Aday: 10")).toBeInTheDocument();
  });

  it("shows only the first 10 dismissed reminders in the panel", async () => {
    let keys: string[] = [];

    for (let index = 1; index <= 12; index += 1) {
      keys = persistDismissedReminderAlert(keys, {
        ...alert,
        reminder_id: index,
        student_id: index,
        student_full_name: `Aday ${index}`,
        reminder_at: `2026-05-09T11:${String(index).padStart(2, "0")}:00`
      });
    }

    renderLayout();
    await userEvent.click(screen.getByRole("button", { name: "Bildirimler" }));

    expect(screen.getByText("Son 10 bildirim gÃ¶steriliyor.")).toBeInTheDocument();
    expect(screen.getByText("Aday 12")).toBeInTheDocument();
    expect(screen.queryByText("Aday 2")).not.toBeInTheDocument();
  });
});
