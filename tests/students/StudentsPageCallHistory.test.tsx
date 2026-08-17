import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Outlet, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AppOutletContext } from "../../src/app/AppLayout";
import { db } from "../../src/db/db";
import type { AppointmentStatus } from "../../src/domain/constants/statuses";
import { StudentsPage } from "../../src/features/students/StudentsPage";
import { createSearchText, normalizeText } from "../../src/utils/normalizeText";

const now = "2026-05-10T10:00:00.000Z";

function formatReminderEditTimestamp(value: string): string {
  const date = new Date(value);
  const pad = (part: number) => String(part).padStart(2, "0");

  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

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

async function seedCallHistoryWithPhoneContext(note = "Öğrenci telefonu üzerinden görüşüldü.") {
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
    note,
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

async function seedCallHistoryWithLegacyPendingReminder() {
  const studentId = await seedStudent();
  const reminderId = await db.reminders.add({
    uuid: "legacy-linked-pending-reminder",
    student_id: studentId,
    reminder_type: "call",
    reminder_at: "2026-05-11T11:00:00.000Z",
    status: "pending",
    note: "Eski açık hatırlatma",
    is_default_time_assigned: false,
    sync_status: "local",
    created_at: now,
    updated_at: now,
    deleted_at: null
  });
  const callLogId = await db.call_logs.add({
    uuid: "call-history-with-legacy-pending-reminder",
    student_id: studentId,
    phone_id: null,
    phone_snapshot: null,
    contacted_phone_id: null,
    contacted_phone_number: null,
    contacted_phone_label: null,
    call_time: "2026-05-10T12:00:00.000Z",
    call_result: "call_later",
    note: "Eski hatırlatma bağlı görüşme.",
    reminder_at: "2026-05-11T11:00:00.000Z",
    next_action: "Tekrar arama",
    created_by: "agent",
    created_reminder_id: null,
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

async function seedTerminalReminderWithEditAudit(status: "completed" | "cancelled") {
  await seedCallHistoryWithPendingReminder();
  const reminder = await db.reminders.where("uuid").equals("linked-pending-reminder").first();
  const ownerCallLog = await db.call_logs.where("uuid").equals("call-history-with-pending-reminder").first();
  const editedAt = "2026-05-12T10:00:00.000Z";

  await db.reminders.update(reminder!.id!, {
    note: "Güncellenmiş terminal reminder notu",
    status,
    updated_at: editedAt
  });
  await db.call_logs.update(ownerCallLog!.id!, { note: "Güncellenmiş terminal reminder notu" });
  await db.audit_logs.add({
    entity_type: "reminder",
    entity_id: reminder!.id!,
    action_type: "update",
    field_name: "pending_reminder_edit",
    old_value: JSON.stringify({
      reminder_at: "2026-05-11T11:00:00.000Z",
      note: "Açık hatırlatma",
      owner_call_log_id: ownerCallLog!.id
    }),
    new_value: JSON.stringify({
      reminder_at: reminder!.reminder_at,
      note: "Güncellenmiş terminal reminder notu",
      owner_call_log_id: ownerCallLog!.id
    }),
    performed_by: "İpek",
    created_at: editedAt
  });

  return editedAt;
}

async function seedCallHistoryWithAppointment(status: AppointmentStatus) {
  const studentId = await seedStudent();
  const appointmentId = await db.appointments.add({
    uuid: `linked-appointment-${status}`,
    student_id: studentId,
    guardian_id: null,
    appointment_at: "2026-05-11T11:00:00.000Z",
    status,
    campaign_id: null,
    note: "Bağlı randevu",
    call_log_id: null,
    guardian_message_due_at: "2026-05-10T11:00:00.000Z",
    guardian_message_sent_at: null,
    guardian_message_generation: 1,
    sync_status: "local",
    created_at: now,
    updated_at: now,
    deleted_at: null
  });
  const callLogId = await db.call_logs.add({
    uuid: `call-history-with-${status}-appointment`,
    student_id: studentId,
    phone_id: null,
    phone_snapshot: null,
    contacted_phone_id: null,
    contacted_phone_number: null,
    contacted_phone_label: null,
    call_time: "2026-05-10T12:00:00.000Z",
    call_result: "appointment",
    note: "Randevu bağlı görüşme.",
    reminder_at: null,
    next_action: null,
    created_by: "agent",
    created_reminder_id: null,
    created_appointment_id: appointmentId,
    sync_status: "local",
    created_at: now,
    updated_at: now,
    deleted_at: null
  });

  await db.appointments.update(appointmentId, { call_log_id: callLogId });

  return { appointmentId, callLogId, studentId };
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
  return render(
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

  it("keeps long history note text intact inside the semantic timeline content wrapper", async () => {
    const longToken = "a".repeat(240);
    const longUrl = `https://example.test/${"path".repeat(60)}`;
    const note = `İlk satır.\n${longToken}\n${longUrl}\nSon satır.`;
    await seedCallHistoryWithPhoneContext(note);

    renderStudentsPage();

    const noteElement = await screen.findByText((_, element) => element?.textContent === note);

    expect(noteElement).toHaveClass("tl-text");
    expect(noteElement.textContent).toBe(note);
    expect(noteElement.closest(".tl-content")).toContainElement(noteElement);
    expect(screen.getByRole("button", { name: "İletişim kaydını düzelt" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "İletişim kaydını geçersiz say / sil" })).toBeInTheDocument();
  });

  it("keeps the no-phone fallback when call history has no phone context", async () => {
    await seedCallHistoryWithoutPhoneContext();

    renderStudentsPage();

    expect(await screen.findByText("Telefon seçilmedi")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Hatırlatmayı tamamla" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Hatırlatmayı düzenle" })).not.toBeInTheDocument();
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
    const noteInput = within(dialog).getByLabelText("Görüşme notu");

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

  it.each(["completed", "cancelled"] as const)(
    "opens a note-only correction modal for a %s linked reminder",
    async (status) => {
      const user = userEvent.setup();
      const editedAt = await seedTerminalReminderWithEditAudit(status);
      const originalCallLog = await db.call_logs.where("uuid").equals("call-history-with-pending-reminder").first();
      const originalStudent = await db.students.get(originalCallLog!.student_id);

      renderStudentsPage();

      await screen.findByText("Güncellenmiş terminal reminder notu");
      await user.click(screen.getByRole("button", { name: "İletişim kaydını düzelt" }));

      const dialog = await screen.findByRole("dialog", { name: "İletişim kaydı düzelt" });
      const resultInput = within(dialog).getByLabelText("Görüşme Durumu");
      const dateInput = within(dialog).getByLabelText("Tarih");
      const timeInput = within(dialog).getByLabelText("Saat");
      const phoneInput = within(dialog).getByLabelText("Telefon bağlamı");
      const noteInput = within(dialog).getByLabelText("Görüşme notu");

      expect(
        within(dialog).getByText("Bağlı kayıt tamamlandığı için yalnız açıklama notu düzeltilebilir.")
      ).toBeInTheDocument();
      expect(resultInput).toBeDisabled();
      expect(dateInput).toBeDisabled();
      expect(timeInput).toBeDisabled();
      expect(phoneInput).toBeDisabled();
      expect(noteInput).not.toBeDisabled();

      await user.clear(noteInput);
      await user.type(noteInput, "Terminal görüşme notu düzeltildi.");
      await user.click(within(dialog).getByRole("button", { name: "Kaydet" }));

      await waitFor(() => {
        expect(screen.getByText("Terminal görüşme notu düzeltildi.")).toBeInTheDocument();
      });

      const updatedCallLog = await db.call_logs.where("uuid").equals("call-history-with-pending-reminder").first();
      const reminder = await db.reminders.where("uuid").equals("linked-pending-reminder").first();
      const correctionAudit = (await db.audit_logs.where("entity_id").equals(updatedCallLog!.id!).toArray()).find(
        (record) => record.field_name === "call_log_correction"
      );

      expect(updatedCallLog).toMatchObject({
        note: "Terminal görüşme notu düzeltildi.",
        call_time: originalCallLog?.call_time,
        call_result: originalCallLog?.call_result,
        created_reminder_id: originalCallLog?.created_reminder_id
      });
      expect(reminder?.status).toBe(status);
      expect(await db.students.get(updatedCallLog!.student_id)).toEqual(originalStudent);
      expect(correctionAudit).toMatchObject({ field_name: "call_log_correction", performed_by: "agent" });
      expect(
        screen.getByRole("button", { name: new RegExp(`Tekrar düzenlendi: ${formatReminderEditTimestamp(editedAt)}`) })
      ).toBeInTheDocument();
    }
  );

  it("blocks normal correction for a pending linked reminder without opening the modal", async () => {
    const user = userEvent.setup();
    await seedCallHistoryWithPendingReminder();

    renderStudentsPage();

    await screen.findByText("Hatırlatma bağlı görüşme.");
    await user.click(screen.getByRole("button", { name: "İletişim kaydını düzelt" }));

    expect(await screen.findByText("Bu görüşmeye bağlı aktif bir hatırlatma bulunuyor. Normal düzeltme yerine Hatırlatmayı düzenle işlemini kullanın.")).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "İletişim kaydı düzelt" })).not.toBeInTheDocument();
  });

  it("edits only the call-log note for an active linked appointment", async () => {
    const user = userEvent.setup();
    const { appointmentId, callLogId } = await seedCallHistoryWithAppointment("pending");
    const appointmentBefore = await db.appointments.get(appointmentId);

    renderStudentsPage();

    expect(await screen.findByText("Görüşme notu:")).toBeInTheDocument();
    expect(screen.getByText("Randevu bağlı görüşme.")).toBeInTheDocument();
    expect(screen.getByText("Randevu notu: Bağlı randevu")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "İletişim kaydını düzelt" }));

    const dialog = await screen.findByRole("dialog", { name: "İletişim kaydı düzelt" });
    expect(within(dialog).getByLabelText("Görüşme Durumu")).toBeDisabled();
    expect(within(dialog).getByLabelText("Tarih")).toBeDisabled();
    expect(within(dialog).getByLabelText("Saat")).toBeDisabled();
    expect(within(dialog).getByLabelText("Telefon bağlamı")).toBeDisabled();
    const noteInput = within(dialog).getByLabelText("Görüşme notu");
    await user.clear(noteInput);
    await user.type(noteInput, "Güncellenmiş görüşme notu.");
    await user.click(within(dialog).getByRole("button", { name: "Kaydet" }));

    await waitFor(async () => {
      expect((await db.call_logs.get(callLogId))?.note).toBe("Güncellenmiş görüşme notu.");
    });
    expect(await db.appointments.get(appointmentId)).toEqual(appointmentBefore);
    expect(await screen.findByText("Güncellenmiş görüşme notu.")).toBeInTheDocument();
    expect(screen.getByText("Randevu notu: Bağlı randevu")).toBeInTheDocument();
  });

  it("manages a modern pending appointment without changing the owner call-log note", async () => {
    const user = userEvent.setup();
    const { appointmentId, callLogId } = await seedCallHistoryWithAppointment("pending");
    const ownerBefore = await db.call_logs.get(callLogId);

    renderStudentsPage();

    expect(await screen.findByText("Görüşme notu:")).toBeInTheDocument();
    expect(screen.getByText("Randevu bağlı görüşme.")).toBeInTheDocument();
    expect(screen.getByText("Randevu notu: Bağlı randevu")).toBeInTheDocument();
    const manageButtons = await screen.findAllByRole("button", { name: "Randevuyu yönet" });
    expect(manageButtons).toHaveLength(1);
    const [manageButton] = manageButtons;
    expect(manageButton).toHaveAttribute("title", "Randevuyu yönet");
    expect(manageButton).not.toHaveTextContent("Randevuyu yönet");
    await user.click(manageButton);
    const dialog = await screen.findByRole("dialog", { name: "Randevuyu yönet" });
    const noteInput = within(dialog).getByLabelText("Randevu notu");
    await user.clear(noteInput);
    await user.type(noteInput, "Yeni randevu notu.");
    await user.click(within(dialog).getByRole("button", { name: "Notu kaydet" }));

    await waitFor(async () => {
      expect((await db.appointments.get(appointmentId))?.note).toBe("Yeni randevu notu.");
    });
    expect(await db.call_logs.get(callLogId)).toEqual(ownerBefore);

    await user.click(await screen.findByRole("button", { name: "Randevuyu yönet" }));
    const refreshedDialog = await screen.findByRole("dialog", { name: "Randevuyu yönet" });
    await user.clear(within(refreshedDialog).getByLabelText("Tarih"));
    await user.type(within(refreshedDialog).getByLabelText("Tarih"), "2099-05-13");
    await user.clear(within(refreshedDialog).getByLabelText("Saat"));
    await user.type(within(refreshedDialog).getByLabelText("Saat"), "17:01");
    await user.click(within(refreshedDialog).getByRole("button", { name: "Randevuyu ertele" }));

    await waitFor(async () => {
      expect(await db.appointments.get(appointmentId)).toMatchObject({
        appointment_at: "2099-05-13T14:01:00.000Z",
        note: "Yeni randevu notu.",
        guardian_message_generation: 2,
        guardian_message_sent_at: null
      });
    });
  });

  it("prefills the appointment management modal with Istanbul date and time values", async () => {
    const user = userEvent.setup();
    const { appointmentId } = await seedCallHistoryWithAppointment("pending");
    await db.appointments.update(appointmentId, { appointment_at: "2099-05-11T21:30:00.000Z" });

    renderStudentsPage();

    await user.click(await screen.findByRole("button", { name: "Randevuyu yönet" }));
    const dialog = await screen.findByRole("dialog", { name: "Randevuyu yönet" });

    expect(within(dialog).getByLabelText("Tarih")).toHaveValue("2099-05-12");
    expect(within(dialog).getByLabelText("Saat")).toHaveValue("00:30");
  });

  it.each([
    ["Geldi", "completed"],
    ["Gelmedi", "no_show"],
    ["İptal", "cancelled"]
  ] as const)("confirms the %s terminal appointment action and removes lifecycle controls", async (label, status) => {
    const user = userEvent.setup();
    const { appointmentId } = await seedCallHistoryWithAppointment("pending");

    renderStudentsPage();

    await user.click(await screen.findByRole("button", { name: "Randevuyu yönet" }));
    const manageDialog = await screen.findByRole("dialog", { name: "Randevuyu yönet" });
    await user.click(within(manageDialog).getByRole("button", { name: label }));
    const confirmation = await screen.findByRole("dialog", { name: `Randevu ${label} olarak işaretlensin mi?` });
    await user.click(within(confirmation).getByRole("button", { name: label }));

    await waitFor(async () => {
      expect((await db.appointments.get(appointmentId))?.status).toBe(status);
    });
    await waitFor(() => {
      expect(screen.queryByRole("button", { name: "Randevuyu yönet" })).not.toBeInTheDocument();
    });
  });

  it("keeps terminal and legacy appointment rows read-only", async () => {
    await seedCallHistoryWithAppointment("attended");

    renderStudentsPage();

    expect(await screen.findByText(/Randevu:.*Geldi/)).toBeInTheDocument();
    expect(screen.getByText("Görüşme notu:")).toBeInTheDocument();
    expect(screen.getByText("Randevu bağlı görüşme.")).toBeInTheDocument();
    expect(screen.getByText("Randevu notu: Bağlı randevu")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Randevuyu yönet" })).not.toBeInTheDocument();
  });

  it("does not show lifecycle management for a malformed pending appointment link", async () => {
    const { appointmentId } = await seedCallHistoryWithAppointment("pending");
    await db.appointments.update(appointmentId, { call_log_id: null });

    renderStudentsPage();

    expect(await screen.findByText("Randevu bağlı görüşme.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Randevuyu yönet" })).not.toBeInTheDocument();
  });

  it("opens a note-only correction modal for a terminal appointment", async () => {
    const user = userEvent.setup();
    const { appointmentId, callLogId } = await seedCallHistoryWithAppointment("attended");
    const appointmentBefore = await db.appointments.get(appointmentId);
    const callLogBefore = await db.call_logs.get(callLogId);

    renderStudentsPage();

    await screen.findByText("Randevu bağlı görüşme.");
    await user.click(screen.getByRole("button", { name: "İletişim kaydını düzelt" }));

    const dialog = await screen.findByRole("dialog", { name: "İletişim kaydı düzelt" });
    expect(within(dialog).getByLabelText("Görüşme Durumu")).toBeDisabled();
    expect(within(dialog).getByLabelText("Tarih")).toBeDisabled();
    expect(within(dialog).getByLabelText("Saat")).toBeDisabled();
    expect(within(dialog).getByLabelText("Telefon bağlamı")).toBeDisabled();
    const noteInput = within(dialog).getByLabelText("Görüşme notu");
    await user.clear(noteInput);
    await user.type(noteInput, "Terminal randevu notu düzeltildi.");
    await user.click(within(dialog).getByRole("button", { name: "Kaydet" }));

    await waitFor(() => {
      expect(screen.getByText("Terminal randevu notu düzeltildi.")).toBeInTheDocument();
    });

    expect(await db.call_logs.get(callLogId)).toMatchObject({
      note: "Terminal randevu notu düzeltildi.",
      call_time: callLogBefore?.call_time,
      call_result: callLogBefore?.call_result,
      created_appointment_id: appointmentId
    });
    expect(await db.appointments.get(appointmentId)).toEqual(appointmentBefore);
  });

  it("shows the data-check message when a linked reminder record is missing", async () => {
    const user = userEvent.setup();
    await seedCallHistoryWithPendingReminder();
    const reminder = await db.reminders.where("uuid").equals("linked-pending-reminder").first();
    await db.reminders.delete(reminder!.id!);

    renderStudentsPage();

    await screen.findByText("Hatırlatma bağlı görüşme.");
    await user.click(screen.getByRole("button", { name: "İletişim kaydını düzelt" }));

    expect(await screen.findByText("Bağlı kayıt bulunamadı. Düzeltme yapılamadı; veri kontrolü gerekli.")).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "İletişim kaydı düzelt" })).not.toBeInTheDocument();
  });

  it("replaces the owner history note after updating a pending reminder", async () => {
    const user = userEvent.setup();
    await seedCallHistoryWithPendingReminder();
    const originalCallLog = await db.call_logs.where("uuid").equals("call-history-with-pending-reminder").first();

    renderStudentsPage();

    expect(await screen.findByText("Hatırlatma bağlı görüşme.")).toBeInTheDocument();
    expect(screen.queryByText(/^Tekrar düzenlendi:/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Hatırlatmayı tamamla" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Hatırlatmayı düzenle" }));

    const dialog = screen.getByRole("dialog", { name: "Hatırlatmayı düzenle" });
    const dateInput = within(dialog).getByLabelText("Tarih") as HTMLInputElement;
    const timeInput = within(dialog).getByLabelText("Saat") as HTMLInputElement;
    const noteInput = within(dialog).getByLabelText("Hatırlatma notu") as HTMLTextAreaElement;
    const initialReminderAt = new Date("2026-05-11T11:00:00.000Z");

    expect(dateInput.value).toBe(initialReminderAt.toISOString().slice(0, 10));
    expect(timeInput.value).toBe(initialReminderAt.toTimeString().slice(0, 5));
    expect(noteInput.value).toBe("Açık hatırlatma");

    await user.clear(dateInput);
    await user.type(dateInput, "2026-05-15");
    await user.clear(timeInput);
    await user.type(timeInput, "15:45");
    await user.clear(noteInput);
    await user.type(noteInput, "Güncellenmiş reminder notu");
    await user.click(within(dialog).getByRole("button", { name: "Hatırlatmayı güncelle" }));

    const expectedReminderAt = new Date("2026-05-15T15:45:00").toISOString();
    const expectedReminderLabel = new Intl.DateTimeFormat("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(expectedReminderAt));

    await waitFor(async () => {
      expect(await db.reminders.where("uuid").equals("linked-pending-reminder").first()).toMatchObject({
        reminder_at: expectedReminderAt,
        note: "Güncellenmiş reminder notu",
        status: "pending"
      });
    });
    const editAudit = (await db.audit_logs.where("entity_id").equals(
      (await db.reminders.where("uuid").equals("linked-pending-reminder").first())?.id ?? -1
    ).toArray()).find((audit) => audit.field_name === "pending_reminder_edit");

    expect(await screen.findByText("Güncellenmiş reminder notu")).toBeInTheDocument();
    expect(screen.queryByText("Hatırlatma bağlı görüşme.")).not.toBeInTheDocument();
    expect(screen.queryByText(/Hatırlatma notu:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Görüşme notu:/)).not.toBeInTheDocument();
    expect(editAudit?.created_at).toBeTruthy();
    const reminderEditPreviewTrigger = screen.getByRole("button", {
      name: new RegExp(`Tekrar düzenlendi: ${formatReminderEditTimestamp(editAudit!.created_at)}`)
    });
    const reminderEditPreviewWrapper = reminderEditPreviewTrigger.parentElement;
    const originalInnerHeight = window.innerHeight;
    const originalInnerWidth = window.innerWidth;
    const triggerRect = {
      bottom: 114,
      height: 14,
      left: 300,
      right: 460,
      top: 100,
      width: 160,
      x: 300,
      y: 100
    };

    expect(reminderEditPreviewTrigger).toBeInTheDocument();
    expect(reminderEditPreviewWrapper).toHaveStyle({ display: "inline-flex", position: "relative" });
    expect(reminderEditPreviewTrigger.closest(".tl-author")).toBeInTheDocument();
    expect(reminderEditPreviewTrigger).toHaveStyle({
      background: "transparent",
      padding: "0px"
    });
    expect(reminderEditPreviewTrigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText(`Tekrar arama: ${expectedReminderLabel}`)).not.toBeInTheDocument();
    expect(screen.queryByText("Açık hatırlatma")).not.toBeInTheDocument();
    expect(screen.queryByText("agent")).not.toBeInTheDocument();
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();

    Object.defineProperty(window, "innerHeight", { configurable: true, value: 600 });
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 800 });
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
      if (this === reminderEditPreviewTrigger) {
        return triggerRect as DOMRect;
      }

      if (this.getAttribute("role") === "tooltip") {
        return {
          bottom: 140,
          height: 140,
          left: 0,
          right: 320,
          top: 0,
          width: 320,
          x: 0,
          y: 0
        } as DOMRect;
      }

      return {
        bottom: 0,
        height: 0,
        left: 0,
        right: 0,
        top: 0,
        width: 0,
        x: 0,
        y: 0
      } as DOMRect;
    });
    vi.useFakeTimers();

    try {
      fireEvent.pointerEnter(reminderEditPreviewTrigger);
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(69);
      });
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1);
      });

      const tooltip = screen.getByRole("tooltip");
      expect(tooltip).toHaveTextContent(`Önceki tarih/saat: ${formatReminderEditTimestamp("2026-05-11T11:00:00.000Z")}`);
      expect(tooltip).toHaveTextContent("Önceki not: Açık hatırlatma");
      expect(tooltip).not.toHaveTextContent("Düzenleyen:");
      expect(tooltip.parentElement).toBe(document.body);
      expect(reminderEditPreviewWrapper).not.toContainElement(tooltip);
      expect(tooltip).toHaveAttribute("data-placement", "bottom");
      expect(tooltip).toHaveStyle({ left: "300px", pointerEvents: "none", position: "fixed", top: "120px", zIndex: "100" });
      expect(reminderEditPreviewTrigger).toHaveAttribute("aria-describedby", tooltip.id);
      expect(reminderEditPreviewTrigger).toHaveAttribute("aria-expanded", "true");
      expect(reminderEditPreviewWrapper?.querySelector('[aria-hidden="true"]')).toBeNull();

      fireEvent.pointerLeave(reminderEditPreviewTrigger);
      expect(screen.getByRole("tooltip")).toBeInTheDocument();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(159);
      });
      expect(screen.getByRole("tooltip")).toBeInTheDocument();

      fireEvent.pointerEnter(reminderEditPreviewTrigger);
      await act(async () => {
        await vi.advanceTimersByTimeAsync(160);
      });
      expect(screen.getByRole("tooltip")).toBeInTheDocument();

      fireEvent.pointerLeave(reminderEditPreviewTrigger);
      await act(async () => {
        await vi.advanceTimersByTimeAsync(160);
      });
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();

      triggerRect.top = 530;
      triggerRect.bottom = 544;
      triggerRect.y = 530;
      fireEvent.pointerEnter(reminderEditPreviewTrigger);
      await act(async () => {
        await vi.advanceTimersByTimeAsync(70);
      });
      expect(screen.getByRole("tooltip")).toHaveAttribute("data-placement", "top");
      expect(screen.getByRole("tooltip")).toHaveStyle({ top: "384px" });

      triggerRect.left = -40;
      triggerRect.right = 120;
      triggerRect.x = -40;
      fireEvent(window, new Event("resize"));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(20);
      });
      expect(screen.getByRole("tooltip")).toHaveStyle({ left: "8px" });

      triggerRect.left = 760;
      triggerRect.right = 920;
      triggerRect.x = 760;
      fireEvent(window, new Event("scroll", { bubbles: true }));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(20);
      });
      expect(screen.getByRole("tooltip")).toHaveStyle({ left: "472px" });

      await act(async () => {
        reminderEditPreviewTrigger.focus();
      });
      expect(screen.getByRole("tooltip")).toBeInTheDocument();
      await act(async () => {
        reminderEditPreviewTrigger.blur();
      });
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();

      fireEvent.click(reminderEditPreviewTrigger);
      expect(screen.getByRole("tooltip")).toBeInTheDocument();
      expect(screen.getByRole("tooltip")).toHaveStyle({ pointerEvents: "auto" });
      fireEvent.pointerLeave(reminderEditPreviewTrigger);
      await act(async () => {
        await vi.advanceTimersByTimeAsync(160);
      });
      expect(screen.getByRole("tooltip")).toBeInTheDocument();

      fireEvent.click(reminderEditPreviewTrigger);
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();

      fireEvent.click(reminderEditPreviewTrigger);
      expect(screen.getByRole("tooltip")).toBeInTheDocument();
      fireEvent.keyDown(reminderEditPreviewTrigger, { key: "Escape" });
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
      Object.defineProperty(window, "innerHeight", { configurable: true, value: originalInnerHeight });
      Object.defineProperty(window, "innerWidth", { configurable: true, value: originalInnerWidth });
    }

    expect(screen.getAllByText("Hatırlatma güncellendi.").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Hatırlatmayı tamamla" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Hatırlatmayı düzenle" })).toBeInTheDocument();

    const updatedOwnerCallLog = await db.call_logs.where("uuid").equals("call-history-with-pending-reminder").first();
    expect(updatedOwnerCallLog).toMatchObject({
      note: "Güncellenmiş reminder notu",
      call_result: originalCallLog?.call_result,
      call_time: originalCallLog?.call_time,
      created_at: originalCallLog?.created_at,
      reminder_at: originalCallLog?.reminder_at,
      next_action: originalCallLog?.next_action,
      created_reminder_id: originalCallLog?.created_reminder_id,
      phone_id: originalCallLog?.phone_id,
      phone_snapshot: originalCallLog?.phone_snapshot,
      updated_at: originalCallLog?.updated_at
    });
  });

  it.each(["completed", "cancelled"] as const)(
    "keeps the reminder edit preview and hides actions for a %s owner reminder",
    async (status) => {
      const editedAt = await seedTerminalReminderWithEditAudit(status);

      renderStudentsPage();

      expect(await screen.findByText("Güncellenmiş terminal reminder notu")).toBeInTheDocument();
      expect(screen.queryByText("Açık hatırlatma")).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Hatırlatmayı tamamla" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Hatırlatmayı düzenle" })).not.toBeInTheDocument();

      const previewTrigger = screen.getByRole("button", {
        name: new RegExp(`Tekrar düzenlendi: ${formatReminderEditTimestamp(editedAt)}`)
      });

      await act(async () => {
        fireEvent.focus(previewTrigger);
      });

      await waitFor(() => {
        expect(screen.getByRole("tooltip")).toHaveTextContent(
          `Önceki tarih/saat: ${formatReminderEditTimestamp("2026-05-11T11:00:00.000Z")}`
        );
        expect(screen.getByRole("tooltip")).toHaveTextContent("Önceki not: Açık hatırlatma");
      });
      expect(screen.getByRole("tooltip").parentElement).toBe(document.body);
    }
  );

  it("cleans reminder audit tooltip timers, listeners, and portal content on unmount", async () => {
    await seedCallHistoryWithPendingReminder();
    const reminder = await db.reminders.where("uuid").equals("linked-pending-reminder").first();
    const ownerCallLog = await db.call_logs.where("uuid").equals("call-history-with-pending-reminder").first();

    await db.audit_logs.add({
      entity_type: "reminder",
      entity_id: reminder!.id!,
      action_type: "update",
      field_name: "pending_reminder_edit",
      old_value: JSON.stringify({
        reminder_at: "2026-05-11T11:00:00.000Z",
        note: "Açık hatırlatma",
        owner_call_log_id: ownerCallLog!.id
      }),
      new_value: JSON.stringify({
        reminder_at: reminder!.reminder_at,
        note: reminder!.note,
        owner_call_log_id: ownerCallLog!.id
      }),
      note: null,
      performed_by: "agent",
      created_at: "2026-05-12T10:00:00.000Z"
    });

    const view = renderStudentsPage();
    const trigger = await screen.findByRole("button", { name: /Tekrar düzenlendi:/ });
    const addEventListener = vi.spyOn(window, "addEventListener");
    const removeEventListener = vi.spyOn(window, "removeEventListener");
    vi.useFakeTimers();

    try {
      fireEvent.pointerEnter(trigger);
      await act(async () => {
        await vi.advanceTimersByTimeAsync(70);
      });

      expect(screen.getByRole("tooltip")).toBeInTheDocument();
      expect(addEventListener).toHaveBeenCalledWith("resize", expect.any(Function));
      expect(addEventListener).toHaveBeenCalledWith("scroll", expect.any(Function), true);

      fireEvent.pointerLeave(trigger);
      view.unmount();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(200);
      });

      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
      expect(removeEventListener).toHaveBeenCalledWith("resize", expect.any(Function));
      expect(removeEventListener).toHaveBeenCalledWith("scroll", expect.any(Function), true);
    } finally {
      vi.useRealTimers();
    }
  });

  it("completes a pending linked reminder from the call history row before soft delete", async () => {
    const user = userEvent.setup();
    await seedCallHistoryWithPendingReminder();
    const reminder = await db.reminders.where("uuid").equals("linked-pending-reminder").first();
    const ownerCallLog = await db.call_logs.where("uuid").equals("call-history-with-pending-reminder").first();
    const editedAt = "2026-05-12T10:00:00.000Z";

    await db.call_logs.update(ownerCallLog!.id!, { note: "Güncellenmiş reminder notu" });
    await db.audit_logs.add({
      entity_type: "reminder",
      entity_id: reminder!.id!,
      action_type: "update",
      field_name: "pending_reminder_edit",
      old_value: JSON.stringify({
        reminder_at: "2026-05-11T11:00:00.000Z",
        note: "Açık hatırlatma",
        owner_call_log_id: ownerCallLog!.id
      }),
      new_value: JSON.stringify({
        reminder_at: reminder!.reminder_at,
        note: "Güncellenmiş reminder notu",
        owner_call_log_id: ownerCallLog!.id
      }),
      performed_by: "İpek",
      created_at: editedAt
    });

    renderStudentsPage();

    expect(await screen.findByText("Güncellenmiş reminder notu")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Hatırlatmayı tamamla" }));

    const completeDialog = screen.getByRole("dialog", { name: "Hatırlatma tamamlansın mı?" });
    expect(
      within(completeDialog).getByText("Bu görüşmeye bağlı açık hatırlatma tamamlandı olarak işaretlenecek. Görüşme kaydı silinmez.")
    ).toBeInTheDocument();
    expect(within(completeDialog).getByRole("button", { name: "Vazgeç" })).toBeInTheDocument();

    await user.click(within(completeDialog).getByRole("button", { name: "Hatırlatmayı tamamla" }));

    await waitFor(async () => {
      expect((await db.reminders.where("uuid").equals("linked-pending-reminder").first())?.status).toBe("completed");
    });
    await waitFor(() => {
      expect(screen.queryByRole("button", { name: "Hatırlatmayı tamamla" })).not.toBeInTheDocument();
    });
    expect(screen.queryByRole("button", { name: "Hatırlatmayı düzenle" })).not.toBeInTheDocument();
    expect(screen.getByText("Güncellenmiş reminder notu")).toBeInTheDocument();
    const previewTrigger = screen.getByRole("button", {
      name: new RegExp(`Tekrar düzenlendi: ${formatReminderEditTimestamp(editedAt)}`)
    });

    await act(async () => {
      fireEvent.focus(previewTrigger);
    });
    await waitFor(() => {
      expect(screen.getByRole("tooltip")).toHaveTextContent("Önceki not: Açık hatırlatma");
    });

    await user.click(screen.getByRole("button", { name: "İletişim kaydını geçersiz say / sil" }));
    await user.click(screen.getByRole("button", { name: "Geçersiz say / sil" }));

    await waitFor(() => {
      expect(screen.queryByText("Güncellenmiş reminder notu")).not.toBeInTheDocument();
    });

    const callLog = await db.call_logs.where("uuid").equals("call-history-with-pending-reminder").first();
    expect(callLog?.deleted_at).toBeTruthy();
  });

  it("cancels a pending linked reminder only through the owner row and keeps the call history record", async () => {
    const user = userEvent.setup();
    await seedCallHistoryWithPendingReminder();
    const reminder = await db.reminders.where("uuid").equals("linked-pending-reminder").first();
    const callLog = await db.call_logs.where("uuid").equals("call-history-with-pending-reminder").first();

    renderStudentsPage();

    const cancelButton = await screen.findByRole("button", { name: "Hatırlatmayı iptal et" });
    expect(cancelButton).toHaveAttribute("title", "Hatırlatmayı iptal et");
    await user.click(cancelButton);

    const cancelDialog = screen.getByRole("dialog", { name: "Hatırlatma iptal edilsin mi?" });
    expect(
      within(cancelDialog).getByText("Bu görüşmeye bağlı açık hatırlatma iptal edilecek. Görüşme kaydı ve varsa randevu silinmeyecek.")
    ).toBeInTheDocument();
    const reasonInput = within(cancelDialog).getByLabelText("İptal nedeni (isteğe bağlı)") as HTMLTextAreaElement;
    expect(reasonInput).toHaveAttribute("placeholder", "Hatırlatmanın neden iptal edildiğini yazabilirsiniz.");
    expect(within(cancelDialog).getByRole("button", { name: "Vazgeç" })).toBeInTheDocument();
    await user.click(within(cancelDialog).getByRole("button", { name: "Vazgeç" }));

    expect((await db.reminders.get(reminder!.id!))?.status).toBe("pending");
    expect(screen.queryByRole("dialog", { name: "Hatırlatma iptal edilsin mi?" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Hatırlatmayı iptal et" }));
    await user.type(screen.getByLabelText("İptal nedeni (isteğe bağlı)"), "  Takip gerekmiyor  ");
    await user.click(screen.getByRole("button", { name: "Hatırlatmayı İptal Et" }));

    await waitFor(async () => {
      expect((await db.reminders.get(reminder!.id!))?.status).toBe("cancelled");
    });
    const cancellationAudit = (await db.audit_logs.where("entity_id").equals(reminder!.id!).toArray()).find(
      (audit) => audit.field_name === "pending_reminder_cancel"
    );

    expect(JSON.parse(cancellationAudit?.new_value ?? "{}")).toMatchObject({
      owner_call_log_id: callLog!.id,
      new_status: "cancelled",
      cancellation_reason: "Takip gerekmiyor"
    });
    expect(await db.call_logs.get(callLog!.id!)).toMatchObject({
      deleted_at: null,
      note: "Hatırlatma bağlı görüşme."
    });
    expect(await screen.findByText("Hatırlatma iptal edildi.")).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Hatırlatma iptal edilsin mi?" })).not.toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByRole("button", { name: "Hatırlatmayı iptal et" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Hatırlatmayı tamamla" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Hatırlatmayı düzenle" })).not.toBeInTheDocument();
    });
    expect(screen.getByText("Hatırlatma bağlı görüşme.")).toBeInTheDocument();
  });

  it("shows and completes cancellation for a safe legacy owner without backfilling its call-log link", async () => {
    const user = userEvent.setup();
    await seedCallHistoryWithLegacyPendingReminder();
    const reminder = await db.reminders.where("uuid").equals("legacy-linked-pending-reminder").first();
    const callLog = await db.call_logs.where("uuid").equals("call-history-with-legacy-pending-reminder").first();

    await db.audit_logs.add({
      entity_type: "reminder",
      entity_id: reminder!.id!,
      action_type: "update",
      field_name: "pending_reminder_edit",
      old_value: JSON.stringify({
        reminder_at: "2026-05-11T10:00:00.000Z",
        note: "Eski legacy notu",
        owner_call_log_id: callLog!.id
      }),
      new_value: JSON.stringify({
        reminder_at: reminder!.reminder_at,
        note: reminder!.note,
        owner_call_log_id: callLog!.id
      }),
      created_at: "2026-05-12T10:00:00.000Z"
    });

    renderStudentsPage();

    await user.click(await screen.findByRole("button", { name: "Hatırlatmayı iptal et" }));
    expect(screen.getByRole("dialog", { name: "Hatırlatma iptal edilsin mi?" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Hatırlatmayı İptal Et" }));

    await waitFor(async () => {
      expect((await db.reminders.get(reminder!.id!))?.status).toBe("cancelled");
    });
    expect((await db.call_logs.get(callLog!.id!))?.created_reminder_id).toBeNull();
    expect(await screen.findByText("Hatırlatma iptal edildi.")).toBeInTheDocument();
  });

  it("hides cancellation when two pending legacy reminders point to the same owner", async () => {
    await seedCallHistoryWithLegacyPendingReminder();
    const reminder = await db.reminders.where("uuid").equals("legacy-linked-pending-reminder").first();
    const callLog = await db.call_logs.where("uuid").equals("call-history-with-legacy-pending-reminder").first();

    await db.reminders.add({
      uuid: "duplicate-legacy-linked-pending-reminder",
      student_id: reminder!.student_id,
      call_log_id: callLog!.id,
      reminder_type: "call",
      reminder_at: "2026-05-11T11:00:00.000Z",
      status: "pending",
      note: "Çelişkili ikinci legacy hatırlatma",
      is_default_time_assigned: false,
      sync_status: "local",
      created_at: now,
      updated_at: now,
      deleted_at: null
    });

    renderStudentsPage();

    expect(await screen.findByText("Eski hatırlatma bağlı görüşme.")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByRole("button", { name: "Hatırlatmayı iptal et" })).not.toBeInTheDocument();
    });
  });

  it("shows cancellation only for a legacy owner when an active historical row shares the reminder reference", async () => {
    const user = userEvent.setup();
    await seedCallHistoryWithLegacyPendingReminder();
    const reminder = await db.reminders.where("uuid").equals("legacy-linked-pending-reminder").first();
    const studentId = reminder!.student_id;

    await db.call_logs.add({
      uuid: "call-history-legacy-shared-reference",
      student_id: studentId,
      phone_id: null,
      phone_snapshot: null,
      contacted_phone_id: null,
      contacted_phone_number: null,
      contacted_phone_label: null,
      call_time: "2026-05-10T11:00:00.000Z",
      call_result: "call_later",
      note: "Tarihsel paylaşılan hatırlatma satırı.",
      reminder_at: "2026-05-11T11:00:00.000Z",
      next_action: "Tekrar arama",
      created_by: "agent",
      created_reminder_id: reminder!.id,
      created_appointment_id: null,
      sync_status: "local",
      created_at: now,
      updated_at: now,
      deleted_at: null
    });

    renderStudentsPage();

    expect(await screen.findByText("Eski hatırlatma bağlı görüşme.")).toBeInTheDocument();
    expect(screen.getByText("Tarihsel paylaşılan hatırlatma satırı.")).toBeInTheDocument();
    const ownerHistoryRow = screen.getByText("Eski hatırlatma bağlı görüşme.").closest(".tl-item") as HTMLElement | null;
    const historicalHistoryRow = screen
      .getByText("Tarihsel paylaşılan hatırlatma satırı.")
      .closest(".tl-item") as HTMLElement | null;

    expect(ownerHistoryRow).not.toBeNull();
    expect(historicalHistoryRow).not.toBeNull();
    expect(within(ownerHistoryRow!).getByRole("button", { name: "Hatırlatmayı iptal et" })).toBeInTheDocument();
    expect(within(historicalHistoryRow!).queryByRole("button", { name: "Hatırlatmayı iptal et" })).not.toBeInTheDocument();

    await user.click(within(ownerHistoryRow!).getByRole("button", { name: "Hatırlatmayı iptal et" }));
    expect(screen.getByRole("dialog", { name: "Hatırlatma iptal edilsin mi?" })).toBeInTheDocument();
  });

  it("shows a fail-closed error when a reminder becomes terminal while its cancellation modal is open", async () => {
    const user = userEvent.setup();
    await seedCallHistoryWithPendingReminder();
    const reminder = await db.reminders.where("uuid").equals("linked-pending-reminder").first();

    renderStudentsPage();

    await user.click(await screen.findByRole("button", { name: "Hatırlatmayı iptal et" }));
    await db.reminders.update(reminder!.id!, { status: "completed" });
    await user.click(screen.getByRole("button", { name: "Hatırlatmayı İptal Et" }));

    expect(await screen.findByText("Yalnızca açık hatırlatmalar güncellenebilir.")).toBeInTheDocument();
    expect((await db.reminders.get(reminder!.id!))?.status).toBe("completed");
  });

  it("creates a reminder only for call_later from the drawer form", async () => {
    const user = userEvent.setup();
    await seedStudent();

    const view = renderStudentsPage();

    expect(await screen.findByText("Aday genel görüşme sonucu")).toBeInTheDocument();

    await user.selectOptions(await screen.findByDisplayValue("Görüşüldü"), "call_later");

    const dateInput = view.container.querySelector('input[type="date"]') as HTMLInputElement | null;
    expect(dateInput).not.toBeNull();
    await user.type(dateInput!, "2026-05-14");
    await user.click(screen.getByRole("button", { name: /Kaydet ve sonrakine geç/ }));

    await waitFor(async () => {
      expect(await db.reminders.count()).toBe(1);
    });

    const reminder = await db.reminders.toCollection().first();
    const callLog = await db.call_logs.toCollection().first();
    expect(reminder).toMatchObject({
      status: "pending",
      reminder_at: "2026-05-14T08:00:00.000Z"
    });
    expect(callLog).toMatchObject({
      call_result: "call_later",
      created_reminder_id: reminder?.id
    });
  });

  it("does not reopen a completed linked reminder when saving a non-reminder result after quick complete", async () => {
    const user = userEvent.setup();
    await seedCallHistoryWithPendingReminder();

    renderStudentsPage();

    expect(await screen.findByText("Hatırlatma bağlı görüşme.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Hatırlatmayı tamamla" }));
    await user.click(
      within(screen.getByRole("dialog", { name: "Hatırlatma tamamlansın mı?" })).getByRole("button", {
        name: "Hatırlatmayı tamamla"
      })
    );

    await waitFor(async () => {
      expect((await db.reminders.where("uuid").equals("linked-pending-reminder").first())?.status).toBe("completed");
    });

    await user.selectOptions(screen.getByDisplayValue("Görüşüldü"), "not_interested");
    await user.click(screen.getByRole("button", { name: /Kaydet ve sonrakine geç/ }));

    await waitFor(async () => {
      expect((await db.call_logs.toArray()).some((log) => log.call_result === "not_interested")).toBe(true);
    });

    const reminders = await db.reminders.toArray();
    const latestCallLog = (await db.call_logs.toArray()).sort((left, right) => right.created_at.localeCompare(left.created_at))[0];

    expect(reminders).toHaveLength(1);
    expect(reminders[0]).toMatchObject({
      uuid: "linked-pending-reminder",
      status: "completed",
      reminder_at: "2026-05-11T11:00:00.000Z"
    });
    expect(latestCallLog).toMatchObject({
      call_result: "not_interested",
      reminder_at: null,
      next_action: null,
      created_reminder_id: null
    });
    expect(screen.queryByRole("button", { name: "Hatırlatmayı tamamla" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Hatırlatmayı iptal et" })).not.toBeInTheDocument();
  });

  it("keeps quick complete, edit, and cancellation on only the owner row with a shared reminder reference", async () => {
    await seedCallHistoryWithSharedPendingReminder();
    const reminder = await db.reminders.where("uuid").equals("shared-pending-reminder").first();
    const ownerCallLog = await db.call_logs.where("uuid").equals("call-history-shared-reminder-owner").first();

    await db.audit_logs.add({
      entity_type: "reminder",
      entity_id: reminder!.id!,
      action_type: "update",
      field_name: "pending_reminder_edit",
      old_value: JSON.stringify({
        reminder_at: "2026-05-11T11:00:00.000Z",
        note: "Eski owner notu",
        owner_call_log_id: ownerCallLog!.id
      }),
      new_value: JSON.stringify({
        reminder_at: reminder!.reminder_at,
        note: reminder!.note,
        owner_call_log_id: ownerCallLog!.id
      }),
      created_at: "2026-05-12T10:00:00.000Z"
    });

    renderStudentsPage();

    expect(await screen.findByText("Hatırlatma sahibi satır.")).toBeInTheDocument();
    expect(screen.getByText("Eski hatırlatma satırı.")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Hatırlatmayı tamamla" })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "Hatırlatmayı düzenle" })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "Hatırlatmayı iptal et" })).toHaveLength(1);

    const ownerHistoryRow = screen.getByText("Hatırlatma sahibi satır.").closest(".tl-item") as HTMLElement | null;
    const oldHistoryRow = screen.getByText("Eski hatırlatma satırı.").closest(".tl-item") as HTMLElement | null;

    expect(ownerHistoryRow).not.toBeNull();
    expect(oldHistoryRow).not.toBeNull();
    expect(within(ownerHistoryRow!).getByRole("button", { name: /Tekrar düzenlendi:/ })).toBeInTheDocument();
    expect(within(oldHistoryRow!).queryByRole("button", { name: /Tekrar düzenlendi:/ })).not.toBeInTheDocument();
    expect(within(ownerHistoryRow!).getByRole("button", { name: "Hatırlatmayı iptal et" })).toBeInTheDocument();
    expect(within(oldHistoryRow!).queryByRole("button", { name: "Hatırlatmayı iptal et" })).not.toBeInTheDocument();
  });
});
