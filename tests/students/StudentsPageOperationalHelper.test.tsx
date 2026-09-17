import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Outlet, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AppOutletContext } from "../../src/app/AppLayout";
import { db } from "../../src/db/db";
import { StudentsPage } from "../../src/features/students/StudentsPage";
import { updateSmartOperationalAlertsEnabled } from "../../src/features/settings/services/smartTechnologySettings";
import { createSearchText, normalizeText } from "../../src/utils/normalizeText";

const now = "2026-05-10T10:00:00.000Z";

function todayReminderAt(): string {
  const reminderDate = new Date();
  reminderDate.setHours(reminderDate.getHours() + 1, 0, 0, 0);
  return reminderDate.toISOString();
}

function StudentsPageHost() {
  const context: AppOutletContext = {
    globalSearch: "",
    focusGlobalSearch: vi.fn(),
    openStudentById: vi.fn(),
    pendingOpenStudentId: null,
    consumePendingOpenStudentId: vi.fn(),
    pendingSearchListRequestId: null,
    consumePendingSearchListRequest: vi.fn()
  };

  return <Outlet context={context} />;
}

function renderStudentsPage() {
  render(
    <MemoryRouter initialEntries={["/students"]}>
      <Routes>
        <Route element={<StudentsPageHost />}>
          <Route path="/students" element={<StudentsPage />} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

async function seedStudent({
  fullName = "MELIS KAYA",
  phoneNumber = "0532 100 0001",
  phoneStatus = "active" as "active" | "invalid"
}: {
  fullName?: string;
  phoneNumber?: string;
  phoneStatus?: "active" | "invalid";
} = {}) {
  const normalizedPhoneNumber = phoneNumber.replace(/\D/g, "");
  const studentId = await db.students.add({
    uuid: crypto.randomUUID(),
    student_full_name: fullName,
    normalized_student_name: normalizeText(fullName),
    search_text: createSearchText([fullName, normalizedPhoneNumber]),
    current_class: "11",
    student_group: "YKS",
    category: "YKS",
    campaign_id: null,
    lifecycle_status: "candidate",
    last_call_result: "not_called",
    general_note: null,
    created_at: now,
    updated_at: now,
    sync_status: "local"
  });

  const phoneId = await db.phones.add({
    uuid: crypto.randomUUID(),
    student_id: studentId,
    guardian_id: null,
    phone_number: phoneNumber,
    normalized_phone_number: normalizedPhoneNumber,
    phone_label: "Telefon 1",
    reference_label: "Telefon 1",
    relation_label: "Telefon",
    priority: 1,
    phone_status: phoneStatus,
    is_valid: true,
    is_wrong: phoneStatus === "invalid",
    is_primary: true,
    created_at: now,
    updated_at: now,
    sync_status: "local"
  });

  return { phoneId, studentId };
}

async function seedAppointment(studentId: number, appointmentAt: string) {
  const callLogId = await db.call_logs.add({
    uuid: crypto.randomUUID(),
    student_id: studentId,
    call_time: now,
    call_result: "appointment",
    sync_status: "local",
    created_at: now,
    updated_at: now
  });
  const appointmentId = await db.appointments.add({
    uuid: crypto.randomUUID(),
    student_id: studentId,
    guardian_id: null,
    appointment_at: appointmentAt,
    status: "pending",
    call_log_id: callLogId,
    guardian_message_due_at: "2026-05-09T09:00:00.000Z",
    guardian_message_sent_at: null,
    guardian_message_generation: 1,
    created_at: now,
    updated_at: now,
    sync_status: "local"
  });
  await db.call_logs.update(callLogId, { created_appointment_id: appointmentId });
  return appointmentId;
}

describe("StudentsPage operational helper", () => {
  beforeEach(async () => {
    Element.prototype.scrollIntoView = vi.fn();
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-05-10T10:00:00.000Z"));
    await db.delete();
    await db.open();
    await updateSmartOperationalAlertsEnabled(true);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    await db.delete();
  });

  it("shows the selected student's highest-priority helper and reminder context", async () => {
    const { studentId } = await seedStudent();
    await db.reminders.add({
      uuid: crypto.randomUUID(),
      student_id: studentId,
      reminder_type: "call",
      reminder_at: todayReminderAt(),
      status: "pending",
      note: null,
      is_default_time_assigned: false,
      created_at: now,
      updated_at: now,
      sync_status: "local"
    });

    renderStudentsPage();

    const helper = await screen.findByRole("status", { name: "Akıllı operasyon uyarısı" });
    expect(helper).toHaveClass("smart-operational-alert", "is-today");
    expect(helper).toHaveTextContent(/Bugün .*aranacak/);
  });

  it("uses a warm compact alert for overdue reminders", async () => {
    const { studentId } = await seedStudent();
    await db.reminders.add({
      uuid: crypto.randomUUID(),
      student_id: studentId,
      reminder_type: "call",
      reminder_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      status: "pending",
      note: null,
      is_default_time_assigned: false,
      created_at: now,
      updated_at: now,
      sync_status: "local"
    });

    renderStudentsPage();

    const helper = await screen.findByRole("status", { name: "Akıllı operasyon uyarısı" });
    expect(helper).toHaveClass("smart-operational-alert", "is-overdue");
    expect(helper).toHaveTextContent("Gecikmiş arama");
  });

  it("renders the highest-priority overdue appointment in the existing single helper area", async () => {
    const { studentId } = await seedStudent();
    await seedAppointment(studentId, "2026-05-09T10:00:00.000Z");
    await db.reminders.add({
      uuid: crypto.randomUUID(),
      student_id: studentId,
      reminder_type: "call",
      reminder_at: "2026-05-09T09:00:00.000Z",
      status: "pending",
      is_default_time_assigned: false,
      created_at: now,
      updated_at: now,
      sync_status: "local"
    });

    renderStudentsPage();

    const helper = await screen.findByRole("status", { name: "Akıllı operasyon uyarısı" });
    expect(helper).toHaveTextContent("Gecikmiş randevu");
    expect(helper).toHaveTextContent("09.05.2026 13:00");
    expect(screen.getAllByRole("status", { name: "Akıllı operasyon uyarısı" })).toHaveLength(1);
  });

  it("keeps an overdue appointment ahead of a today call in the single helper area", async () => {
    const user = userEvent.setup();
    const { studentId } = await seedStudent();
    await seedAppointment(studentId, "2026-05-09T10:00:00.000Z");
    await db.reminders.add({
      uuid: crypto.randomUUID(),
      student_id: studentId,
      reminder_type: "call",
      reminder_at: "2026-05-10T13:00:00.000Z",
      status: "pending",
      is_default_time_assigned: false,
      created_at: now,
      updated_at: now,
      sync_status: "local"
    });

    renderStudentsPage();

    const studentRow = (await screen.findAllByText("MELIS KAYA"))
      .map((element) => element.closest("tr"))
      .find((row): row is HTMLTableRowElement => row !== null);
    expect(studentRow).toBeDefined();
    await user.click(studentRow!);

    const helper = await screen.findByRole("status", { name: "Akıllı operasyon uyarısı" });
    expect(helper).toHaveTextContent("Gecikmiş randevu");
    expect(helper).not.toHaveTextContent("aranacak");
    expect(screen.getAllByRole("status", { name: "Akıllı operasyon uyarısı" })).toHaveLength(1);
    expect(helper.querySelectorAll("button, a")).toHaveLength(0);
  });

  it("renders a today appointment with Istanbul-local time and excludes future-day appointments", async () => {
    const { studentId } = await seedStudent();
    await seedAppointment(studentId, "2026-05-10T13:00:00.000Z");

    renderStudentsPage();

    const helper = await screen.findByRole("status", { name: "Akıllı operasyon uyarısı" });
    expect(helper).toHaveTextContent("Bugün 16:00'da randevu");
    expect(helper).toHaveTextContent("16:00'da randevu");

    await act(async () => {
      await db.appointments.update(1, { appointment_at: "2026-05-11T13:00:00.000Z" });
    });

    await waitFor(() => expect(screen.queryByRole("status", { name: "Akıllı operasyon uyarısı" })).not.toBeInTheDocument());
  });

  it("clears an appointment helper when switching from an eligible appointment student", async () => {
    const user = userEvent.setup();
    const firstStudent = await seedStudent({ fullName: "DENIZ ARSLAN" });
    await seedAppointment(firstStudent.studentId, "2026-05-09T10:00:00.000Z");
    await seedStudent({ fullName: "MELIS KAYA", phoneNumber: "0532 100 0002" });

    renderStudentsPage();

    const firstStudentRow = (await screen.findAllByText("DENIZ ARSLAN"))
      .map((element) => element.closest("tr"))
      .find((row): row is HTMLTableRowElement => row !== null);
    expect(firstStudentRow).toBeDefined();
    await user.click(firstStudentRow!);

    const helper = await screen.findByRole("status", { name: "Akıllı operasyon uyarısı" });
    expect(helper).toHaveTextContent("Gecikmiş randevu");

    const secondStudentRow = (await screen.findAllByText("MELIS KAYA"))
      .map((element) => element.closest("tr"))
      .find((row): row is HTMLTableRowElement => row !== null);
    expect(secondStudentRow).toBeDefined();
    await user.click(secondStudentRow!);

    await waitFor(() => {
      expect(screen.queryByRole("status", { name: "Akıllı operasyon uyarısı" })).not.toBeInTheDocument();
      expect(screen.queryByText("Gecikmiş randevu")).not.toBeInTheDocument();
    });
  });

  it("does not render a helper when a student has no reminder, including without a usable phone", async () => {
    await seedStudent({ phoneStatus: "invalid" });

    renderStudentsPage();

    await screen.findAllByText("MELIS KAYA");
    expect(screen.queryByRole("status", { name: "Akıllı operasyon uyarısı" })).not.toBeInTheDocument();
  });

  it("keeps the reminder helper when phone usability changes", async () => {
    const { phoneId, studentId } = await seedStudent();
    await db.reminders.add({
      uuid: crypto.randomUUID(),
      student_id: studentId,
      reminder_type: "call",
      reminder_at: todayReminderAt(),
      status: "pending",
      is_default_time_assigned: false,
      created_at: now,
      updated_at: now,
      sync_status: "local"
    });

    renderStudentsPage();
    const helper = await screen.findByRole("status", { name: "Akıllı operasyon uyarısı" });
    expect(helper).toHaveTextContent(/Bugün .*aranacak/);

    await act(async () => {
      await db.phones.update(phoneId, { phone_status: "invalid", is_wrong: true });
    });

    expect(helper).toHaveTextContent(/Bugün .*aranacak/);
    expect(document.querySelector(".drawer-phone-card")).toHaveTextContent("Telefon 1");
  });

  it("refreshes the helper context when switching students in the same session", async () => {
    const user = userEvent.setup();
    const firstStudent = await seedStudent({
      fullName: "DENIZ ARSLAN",
      phoneNumber: "0532 100 0001"
    });
    await db.reminders.add({
      uuid: crypto.randomUUID(),
      student_id: firstStudent.studentId,
      reminder_type: "call",
      reminder_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      status: "pending",
      is_default_time_assigned: false,
      created_at: now,
      updated_at: now,
      sync_status: "local"
    });
    await seedStudent({
      fullName: "MELIS KAYA",
      phoneNumber: "0532 100 0002",
      phoneStatus: "invalid"
    });

    renderStudentsPage();

    const firstStudentRow = (await screen.findAllByText("DENIZ ARSLAN"))
      .map((element) => element.closest("tr"))
      .find((row): row is HTMLTableRowElement => row !== null);
    expect(firstStudentRow).toBeDefined();
    await user.click(firstStudentRow!);

    const helper = await screen.findByRole("status", { name: "Akıllı operasyon uyarısı" });
    await waitFor(() => expect(helper).toHaveTextContent("Gecikmiş arama"));

    const secondStudentRow = screen
      .getAllByText("MELIS KAYA")
      .map((element) => element.closest("tr"))
      .find((row): row is HTMLTableRowElement => row !== null);
    expect(secondStudentRow).toBeDefined();
    await user.click(secondStudentRow!);

    await waitFor(() => expect(screen.queryByRole("status", { name: "Akıllı operasyon uyarısı" })).not.toBeInTheDocument());
  });

  it("reacts to the smart operational alerts preference", async () => {
    const { studentId } = await seedStudent();
    await db.reminders.add({
      uuid: crypto.randomUUID(),
      student_id: studentId,
      reminder_type: "call",
      reminder_at: todayReminderAt(),
      status: "pending",
      is_default_time_assigned: false,
      created_at: now,
      updated_at: now,
      sync_status: "local"
    });

    renderStudentsPage();
    await screen.findByRole("status", { name: "Akıllı operasyon uyarısı" });

    await act(async () => {
      await updateSmartOperationalAlertsEnabled(false);
    });
    await waitFor(() => expect(screen.queryByRole("status", { name: "Akıllı operasyon uyarısı" })).not.toBeInTheDocument());

    await act(async () => {
      await updateSmartOperationalAlertsEnabled(true);
    });
    expect(await screen.findByRole("status", { name: "Akıllı operasyon uyarısı" })).toBeInTheDocument();
  });
});
