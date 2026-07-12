import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Outlet, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AppOutletContext } from "../../src/app/AppLayout";
import { db } from "../../src/db/db";
import { StudentsPage } from "../../src/features/students/StudentsPage";
import { createSearchText, normalizeText } from "../../src/utils/normalizeText";

const now = "2026-05-10T10:00:00.000Z";

async function seedStudent() {
  const studentId = await db.students.add({
    uuid: "student-call-history",
    student_full_name: "AYSE YILMAZ",
    normalized_student_name: normalizeText("AYSE YILMAZ"),
    search_text: createSearchText(["AYSE YILMAZ", "FATMA YILMAZ", "05321234567"]),
    current_class: "11",
    student_group: "YKS",
    category: "YKS",
    campaign_id: null,
    lifecycle_status: "candidate",
    last_call_result: "reached",
    general_note: null,
    created_at: now,
    updated_at: now,
    sync_status: "local"
  });
  const guardianId = await db.guardians.add({
    uuid: "guardian-call-history",
    student_id: studentId,
    guardian_full_name: "FATMA YILMAZ",
    normalized_guardian_name: normalizeText("FATMA YILMAZ"),
    relation_type: null,
    note: null,
    created_at: now,
    updated_at: now,
    sync_status: "local"
  });
  await db.phones.add({
    uuid: "phone-call-history",
    student_id: studentId,
    guardian_id: guardianId,
    phone_number: "0532 123 4567",
    normalized_phone_number: "05321234567",
    phone_label: "Telefon 1",
    phone_status: "active",
    is_valid: true,
    is_wrong: false,
    is_primary: true,
    created_at: now,
    updated_at: now,
    sync_status: "local"
  });

  return studentId;
}

async function seedCallHistoryWithPhoneContext() {
  const studentId = await seedStudent();

  await db.call_logs.add({
    uuid: "call-history-with-phone-context",
    student_id: studentId,
    phone_id: 3,
    phone_snapshot: {
      phone_id: 3,
      reference_label: "Telefon 3",
      relation_label: "Öğrenci",
      phone_number: "0555 123 4567",
      source_column: "Öğrenci Telefon"
    },
    contacted_phone_id: 1,
    contacted_phone_number: "0532 123 4567",
    contacted_phone_label: "Telefon 1",
    call_time: "2026-05-10T12:00:00.000Z",
    call_result: "reached",
    note: "Öğrenci telefonu üzerinden görüşüldü.",
    reminder_at: null,
    next_action: null,
    created_by: "agent",
    created_reminder_id: null,
    created_appointment_id: null,
    sync_status: "local",
    created_at: now,
    updated_at: now,
    deleted_at: null
  });
}

async function seedCallHistoryWithoutPhoneContext() {
  const studentId = await seedStudent();

  await db.call_logs.add({
    uuid: "call-history-without-phone-context",
    student_id: studentId,
    phone_id: null,
    phone_snapshot: null,
    contacted_phone_id: null,
    contacted_phone_number: null,
    contacted_phone_label: null,
    call_time: "2026-05-10T12:00:00.000Z",
    call_result: "not_reached",
    note: null,
    reminder_at: null,
    next_action: null,
    created_by: "agent",
    created_reminder_id: null,
    created_appointment_id: null,
    sync_status: "local",
    created_at: now,
    updated_at: now,
    deleted_at: null
  });
}

async function seedCallHistoryWithPendingReminder() {
  const studentId = await seedStudent();
  const reminderId = await db.reminders.add({
    uuid: "linked-pending-reminder",
    student_id: studentId,
    reminder_type: "call",
    reminder_at: "2026-05-11T11:00:00.000Z",
    status: "pending",
    note: "Açık hatırlatma",
    is_default_time_assigned: false,
    sync_status: "local",
    created_at: now,
    updated_at: now,
    deleted_at: null
  });
  const callLogId = await db.call_logs.add({
    uuid: "call-history-with-pending-reminder",
    student_id: studentId,
    phone_id: null,
    phone_snapshot: null,
    contacted_phone_id: null,
    contacted_phone_number: null,
    contacted_phone_label: null,
    call_time: "2026-05-10T12:00:00.000Z",
    call_result: "call_later",
    note: "Hatırlatma bağlı görüşme.",
    reminder_at: "2026-05-11T11:00:00.000Z",
    next_action: "Tekrar arama",
    created_by: "agent",
    created_reminder_id: reminderId,
    created_appointment_id: null,
    sync_status: "local",
    created_at: now,
    updated_at: now,
    deleted_at: null
  });

  await db.reminders.update(reminderId, { call_log_id: callLogId });
}

async function seedCallHistoryWithSharedPendingReminder() {
  const studentId = await seedStudent();
  const reminderId = await db.reminders.add({
    uuid: "shared-pending-reminder",
    student_id: studentId,
    reminder_type: "call",
    reminder_at: "2026-05-11T11:00:00.000Z",
    status: "pending",
    note: "Paylaşılan açık hatırlatma",
    is_default_time_assigned: false,
    sync_status: "local",
    created_at: now,
    updated_at: now,
    deleted_at: null
  });
  await db.call_logs.add({
    uuid: "call-history-shared-reminder-old",
    student_id: studentId,
    phone_id: null,
    phone_snapshot: null,
    contacted_phone_id: null,
    contacted_phone_number: null,
    contacted_phone_label: null,
    call_time: "2026-05-10T11:00:00.000Z",
    call_result: "call_later",
    note: "Eski hatırlatma satırı.",
    reminder_at: "2026-05-11T11:00:00.000Z",
    next_action: "Tekrar arama",
    created_by: "agent",
    created_reminder_id: reminderId,
    created_appointment_id: null,
    sync_status: "local",
    created_at: now,
    updated_at: now,
    deleted_at: null
  });
  const ownerCallLogId = await db.call_logs.add({
    uuid: "call-history-shared-reminder-owner",
    student_id: studentId,
    phone_id: null,
    phone_snapshot: null,
    contacted_phone_id: null,
    contacted_phone_number: null,
    contacted_phone_label: null,
    call_time: "2026-05-10T12:00:00.000Z",
    call_result: "call_later",
    note: "Hatırlatma sahibi satır.",
    reminder_at: "2026-05-11T11:00:00.000Z",
    next_action: "Tekrar arama",
    created_by: "agent",
    created_reminder_id: reminderId,
    created_appointment_id: null,
    sync_status: "local",
    created_at: now,
    updated_at: now,
    deleted_at: null
  });

  await db.reminders.update(reminderId, { call_log_id: ownerCallLogId });
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

describe("StudentsPage call history phone context", () => {
  beforeEach(async () => {
    Element.prototype.scrollIntoView = vi.fn();
    window.localStorage.clear();
    await db.delete();
    await db.open();
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    window.localStorage.clear();
    await db.delete();
  });

  it("shows phone context label and number in the call history", async () => {
    await seedCallHistoryWithPhoneContext();

    renderStudentsPage();

    expect(await screen.findByText("Telefon 3 · Öğrenci: 0555 123 4567")).toBeInTheDocument();
    expect(screen.getByText("Öğrenci telefonu üzerinden görüşüldü.")).toBeInTheDocument();
  });

  it("keeps the no-phone fallback when call history has no phone context", async () => {
    await seedCallHistoryWithoutPhoneContext();

    renderStudentsPage();

    expect(await screen.findByText("Telefon seçilmedi")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Hatırlatmayı tamamla" })).not.toBeInTheDocument();
  });

  it("requires confirmation before soft deleting a call history item from the drawer", async () => {
    const user = userEvent.setup();
    await seedCallHistoryWithPhoneContext();

    renderStudentsPage();

    expect(await screen.findByText("Telefon 3 · Öğrenci: 0555 123 4567")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "İletişim kaydını geçersiz say / sil" }));

    expect(screen.getByRole("dialog", { name: "İletişim kaydı geçersiz sayılsın / silinsin mi?" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "İptal" }));

    expect(
      screen.queryByRole("dialog", { name: "İletişim kaydı geçersiz sayılsın / silinsin mi?" })
    ).not.toBeInTheDocument();
    expect(screen.getByText("Telefon 3 · Öğrenci: 0555 123 4567")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "İletişim kaydını geçersiz say / sil" }));
    await user.click(screen.getByRole("button", { name: "Geçersiz say / sil" }));

    await waitFor(() => {
      expect(screen.queryByText("Telefon 3 · Öğrenci: 0555 123 4567")).not.toBeInTheDocument();
    });

    const callLog = await db.call_logs.where("uuid").equals("call-history-with-phone-context").first();
    expect(callLog?.deleted_at).toBeTruthy();
  });

  it("updates an unlinked call history item from the drawer", async () => {
    const user = userEvent.setup();
    await seedCallHistoryWithPhoneContext();

    renderStudentsPage();

    expect(await screen.findByText("Öğrenci telefonu üzerinden görüşüldü.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "İletişim kaydını düzelt" }));

    const dialog = screen.getByRole("dialog", { name: "İletişim kaydı düzelt" });
    const noteInput = within(dialog).getByLabelText("Not");

    await user.clear(noteInput);
    await user.type(noteInput, "Düzeltilmiş iletişim notu.");
    await user.click(within(dialog).getByRole("button", { name: "Kaydet" }));

    await waitFor(() => {
      expect(screen.getByText("Düzeltilmiş iletişim notu.")).toBeInTheDocument();
    });

    const callLog = await db.call_logs.where("uuid").equals("call-history-with-phone-context").first();
    expect(callLog?.note).toBe("Düzeltilmiş iletişim notu.");
    expect(callLog?.deleted_at).toBeNull();
  });

  it("completes a pending linked reminder from the call history row before soft delete", async () => {
    const user = userEvent.setup();
    await seedCallHistoryWithPendingReminder();

    renderStudentsPage();

    expect(await screen.findByText("Hatırlatma bağlı görüşme.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Hatırlatmayı tamamla" }));

    const completeDialog = screen.getByRole("dialog", { name: "Hatırlatma tamamlansın mı?" });
    expect(
      within(completeDialog).getByText("Bu görüşmeye bağlı açık hatırlatma tamamlandı olarak işaretlenecek. Görüşme kaydı silinmez.")
    ).toBeInTheDocument();

    await user.click(within(completeDialog).getByRole("button", { name: "Hatırlatmayı tamamla" }));

    await waitFor(async () => {
      expect((await db.reminders.where("uuid").equals("linked-pending-reminder").first())?.status).toBe("completed");
    });
    await waitFor(() => {
      expect(screen.queryByRole("button", { name: "Hatırlatmayı tamamla" })).not.toBeInTheDocument();
    });
    expect(screen.getByText("Hatırlatma bağlı görüşme.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "İletişim kaydını geçersiz say / sil" }));
    await user.click(screen.getByRole("button", { name: "Geçersiz say / sil" }));

    await waitFor(() => {
      expect(screen.queryByText("Hatırlatma bağlı görüşme.")).not.toBeInTheDocument();
    });

    const callLog = await db.call_logs.where("uuid").equals("call-history-with-pending-reminder").first();
    expect(callLog?.deleted_at).toBeTruthy();
  });

  it("shows linked reminder quick complete only on the owner history row", async () => {
    await seedCallHistoryWithSharedPendingReminder();

    renderStudentsPage();

    expect(await screen.findByText("Hatırlatma sahibi satır.")).toBeInTheDocument();
    expect(screen.getByText("Eski hatırlatma satırı.")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Hatırlatmayı tamamla" })).toHaveLength(1);
  });
});
