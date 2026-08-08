import { describe, expect, it, vi } from "vitest";
import { createBackupSnapshot } from "../../src/db/backup";
import { AppDatabase } from "../../src/db/db";
import type { AppointmentStatus, ReminderStatus } from "../../src/domain/constants/statuses";
import type { AppointmentRecord } from "../../src/domain/models/appointment";
import type { CallLogRecord } from "../../src/domain/models/callLog";
import type { PhoneRecord } from "../../src/domain/models/phone";
import type { ReminderRecord } from "../../src/domain/models/reminder";
import type { StudentRecord } from "../../src/domain/models/student";
import {
  getCallLogCorrectionPolicy,
  updateCallLogCorrection
} from "../../src/features/calls/services/callLogCorrection";
import { readCallHistoryForStudent } from "../../src/features/calls/services/callHistoryReader";
import { readDetailedExportData } from "../../src/features/exports/services/exportDataReader";
import { createSearchText, normalizeText } from "../../src/utils/normalizeText";

const timestamp = "2026-05-08T09:00:00.000Z";

async function createDatabase() {
  const database = new AppDatabase(`test-call-log-correction-${crypto.randomUUID()}`);
  await database.open();
  return database;
}

function student(overrides: Partial<StudentRecord> = {}): StudentRecord {
  const fullName = overrides.student_full_name ?? "Ayse Yilmaz";

  return {
    uuid: crypto.randomUUID(),
    student_full_name: fullName,
    normalized_student_name: normalizeText(fullName),
    search_text: createSearchText([fullName]),
    current_class: "11",
    student_group: "11. Sinif YKS",
    category: "YKS",
    campaign_id: null,
    lifecycle_status: "candidate",
    last_call_result: "not_called",
    last_contacted_at: null,
    last_contacted_phone_id: null,
    general_note: null,
    sync_status: "local",
    created_at: timestamp,
    updated_at: timestamp,
    deleted_at: null,
    ...overrides
  };
}

function phone(studentId: number, overrides: Partial<PhoneRecord> = {}): PhoneRecord {
  const phoneNumber = overrides.phone_number ?? "05321234567";

  return {
    uuid: crypto.randomUUID(),
    student_id: studentId,
    guardian_id: null,
    phone_number: phoneNumber,
    normalized_phone_number: overrides.normalized_phone_number ?? phoneNumber.replace(/\D/g, ""),
    original_phone_value: phoneNumber,
    phone_label: "Telefon 1",
    reference_label: "Telefon 1",
    relation_label: "Telefon",
    priority: 1,
    phone_status: "active",
    is_valid: true,
    is_wrong: false,
    is_primary: true,
    note: null,
    sync_status: "local",
    created_at: timestamp,
    updated_at: timestamp,
    deleted_at: null,
    ...overrides
  };
}

function callLog(studentId: number, overrides: Partial<CallLogRecord> = {}): CallLogRecord {
  return {
    uuid: crypto.randomUUID(),
    student_id: studentId,
    guardian_id: null,
    phone_id: null,
    phone_snapshot: null,
    contacted_phone_id: null,
    contacted_phone_number: null,
    contacted_phone_label: null,
    call_time: timestamp,
    call_result: "not_reached",
    note: "Eski not",
    reminder_at: null,
    next_action: null,
    created_by: "agent",
    created_reminder_id: null,
    created_appointment_id: null,
    sync_status: "local",
    created_at: timestamp,
    updated_at: timestamp,
    deleted_at: null,
    ...overrides
  };
}

function reminder(studentId: number, status: ReminderStatus, overrides: Partial<ReminderRecord> = {}): ReminderRecord {
  return {
    uuid: crypto.randomUUID(),
    student_id: studentId,
    call_log_id: null,
    phone_id: null,
    phone_snapshot: null,
    reminder_type: "call",
    reminder_at: "2026-05-12T11:00:00.000Z",
    status,
    note: "Hatırlatma notu",
    is_default_time_assigned: false,
    sync_status: "local",
    created_at: timestamp,
    updated_at: timestamp,
    deleted_at: null,
    ...overrides
  };
}

function appointment(
  studentId: number,
  status: AppointmentStatus,
  overrides: Partial<AppointmentRecord> = {}
): AppointmentRecord {
  return {
    uuid: crypto.randomUUID(),
    student_id: studentId,
    guardian_id: null,
    appointment_at: "2026-05-12T14:00:00.000Z",
    status,
    campaign_id: null,
    note: "Randevu notu",
    sync_status: "local",
    created_at: timestamp,
    updated_at: timestamp,
    deleted_at: null,
    ...overrides
  };
}

function correctionInput(callLogId: number, overrides: Partial<Parameters<typeof updateCallLogCorrection>[0]> = {}) {
  return {
    call_log_id: callLogId,
    call_time: timestamp,
    call_result: "not_reached" as const,
    contacted_phone_id: null,
    note: "Düzeltilmiş not",
    ...overrides
  };
}

describe("callLogCorrection", () => {
  it("updates an unlinked call log and recomputes latest student summary", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student({ last_call_result: "not_reached" }));
      const phoneId = await database.phones.add(phone(studentId));
      const callLogId = await database.call_logs.add(
        callLog(studentId, {
          call_time: "2026-05-10T10:00:00.000Z",
          call_result: "not_reached"
        })
      );

      const correction = await updateCallLogCorrection(
        {
          call_log_id: callLogId,
          call_time: "2026-05-10T12:30:00.000Z",
          call_result: "reached",
          contacted_phone_id: phoneId,
          note: "Düzeltilmiş not"
        },
        database
      );

      const updatedLog = await database.call_logs.get(callLogId);
      const updatedStudent = await database.students.get(studentId);
      const history = await readCallHistoryForStudent(studentId, database);

      expect(updatedLog?.call_result).toBe("reached");
      expect(updatedLog?.call_time).toBe("2026-05-10T12:30:00.000Z");
      expect(updatedLog?.note).toBe("Düzeltilmiş not");
      expect(updatedLog?.contacted_phone_id).toBe(phoneId);
      expect(updatedLog?.phone_snapshot?.phone_number).toBe("05321234567");
      expect(updatedLog?.created_reminder_id).toBeNull();
      expect(updatedLog?.created_appointment_id).toBeNull();
      expect(updatedStudent?.last_call_result).toBe("reached");
      expect(updatedStudent?.last_contacted_at).toBe("2026-05-10T12:30:00.000Z");
      expect(updatedStudent?.last_contacted_phone_id).toBe(phoneId);
      expect(history[0].call_result_label).toBe("Görüşüldü");
      expect(history[0].note).toBe("Düzeltilmiş not");
      expect(correction.correction_mode).toBe("full");

      const audit = (await database.audit_logs.where("entity_id").equals(callLogId).toArray()).find(
        (record) => record.field_name === "call_log_correction"
      );
      const oldValue = JSON.parse(audit?.old_value ?? "{}");
      const newValue = JSON.parse(audit?.new_value ?? "{}");

      expect(audit).toMatchObject({
        entity_type: "call_log",
        entity_id: callLogId,
        action_type: "update",
        field_name: "call_log_correction",
        performed_by: "agent"
      });
      expect(oldValue).toMatchObject({
        correction_mode: "full",
        note: "Eski not",
        call_time: "2026-05-10T10:00:00.000Z",
        call_result: "not_reached",
        created_reminder_id: null,
        created_appointment_id: null
      });
      expect(newValue).toMatchObject({
        correction_mode: "full",
        note: "Düzeltilmiş not",
        call_time: "2026-05-10T12:30:00.000Z",
        call_result: "reached",
        phone_id: phoneId,
        created_reminder_id: null,
        created_appointment_id: null
      });
      expect(await database.reminders.count()).toBe(0);
      expect(await database.appointments.count()).toBe(0);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("keeps the latest summary on the newest active log when an older log is corrected", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(
        student({
          last_call_result: "reached",
          last_contacted_at: "2026-05-10T14:00:00.000Z",
          last_contacted_phone_id: null
        })
      );
      const oldCallLogId = await database.call_logs.add(
        callLog(studentId, {
          call_time: "2026-05-10T10:00:00.000Z",
          call_result: "not_reached"
        })
      );
      await database.call_logs.add(
        callLog(studentId, {
          call_time: "2026-05-10T14:00:00.000Z",
          call_result: "reached"
        })
      );

      await updateCallLogCorrection(
        {
          call_log_id: oldCallLogId,
          call_time: "2026-05-10T11:00:00.000Z",
          call_result: "do_not_call",
          note: "Eski kayıt düzeltildi",
          contacted_phone_id: null
        },
        database
      );

      const updatedStudent = await database.students.get(studentId);

      expect(updatedStudent?.last_call_result).toBe("reached");
      expect(updatedStudent?.last_contacted_at).toBe("2026-05-10T14:00:00.000Z");
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("reports lifecycle-aware correction policies for linked dependencies", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const unlinkedCallLogId = await database.call_logs.add(callLog(studentId));
      const pendingReminderId = await database.reminders.add(reminder(studentId, "pending"));
      const completedReminderId = await database.reminders.add(reminder(studentId, "completed"));
      const cancelledReminderId = await database.reminders.add(reminder(studentId, "cancelled"));
      const pendingAppointmentId = await database.appointments.add(appointment(studentId, "pending"));
      const registeredAppointmentId = await database.appointments.add(appointment(studentId, "registered"));
      const unknownAppointmentId = await database.appointments.add(
        appointment(studentId, "pending", { status: "unknown" as AppointmentStatus })
      );
      const deletedReminderId = await database.reminders.add(
        reminder(studentId, "completed", { deleted_at: "2026-05-12T12:00:00.000Z" })
      );
      const otherStudentId = await database.students.add(student({ student_full_name: "Mehmet Kaya" }));
      const mismatchedReminderId = await database.reminders.add(reminder(otherStudentId, "completed"));
      const pendingReminderCallLogId = await database.call_logs.add(
        callLog(studentId, { created_reminder_id: pendingReminderId })
      );
      const completedReminderCallLogId = await database.call_logs.add(
        callLog(studentId, { created_reminder_id: completedReminderId })
      );
      const cancelledReminderCallLogId = await database.call_logs.add(
        callLog(studentId, { created_reminder_id: cancelledReminderId })
      );
      const missingReminderCallLogId = await database.call_logs.add(callLog(studentId, { created_reminder_id: 9999 }));
      const deletedReminderCallLogId = await database.call_logs.add(
        callLog(studentId, { created_reminder_id: deletedReminderId })
      );
      const pendingAppointmentCallLogId = await database.call_logs.add(
        callLog(studentId, { created_appointment_id: pendingAppointmentId })
      );
      const registeredAppointmentCallLogId = await database.call_logs.add(
        callLog(studentId, { created_appointment_id: registeredAppointmentId })
      );
      const unknownAppointmentCallLogId = await database.call_logs.add(
        callLog(studentId, { created_appointment_id: unknownAppointmentId })
      );
      const missingAppointmentCallLogId = await database.call_logs.add(
        callLog(studentId, { created_appointment_id: 9998 })
      );
      const conflictCallLogId = await database.call_logs.add(
        callLog(studentId, { created_reminder_id: completedReminderId, created_appointment_id: registeredAppointmentId })
      );
      const mismatchedReminderCallLogId = await database.call_logs.add(
        callLog(studentId, { created_reminder_id: mismatchedReminderId })
      );

      await expect(getCallLogCorrectionPolicy(unlinkedCallLogId, database)).resolves.toEqual({ mode: "full" });
      await expect(getCallLogCorrectionPolicy(pendingReminderCallLogId, database)).resolves.toMatchObject({
        mode: "blocked_active",
        message: expect.stringContaining("Bu görüşmeye bağlı aktif bir hatırlatma")
      });
      await expect(getCallLogCorrectionPolicy(completedReminderCallLogId, database)).resolves.toEqual({ mode: "note_only" });
      await expect(getCallLogCorrectionPolicy(cancelledReminderCallLogId, database)).resolves.toEqual({ mode: "note_only" });
      await expect(getCallLogCorrectionPolicy(missingReminderCallLogId, database)).resolves.toEqual({
        mode: "blocked_missing",
        message: "Bağlı kayıt bulunamadı. Düzeltme yapılamadı; veri kontrolü gerekli."
      });
      await expect(getCallLogCorrectionPolicy(deletedReminderCallLogId, database)).resolves.toMatchObject({
        mode: "blocked_conflict"
      });
      await expect(getCallLogCorrectionPolicy(pendingAppointmentCallLogId, database)).resolves.toMatchObject({
        mode: "blocked_active",
        message: expect.stringContaining("Bu görüşmeye bağlı aktif bir etkinlik")
      });
      await expect(getCallLogCorrectionPolicy(registeredAppointmentCallLogId, database)).resolves.toEqual({ mode: "note_only" });
      await expect(getCallLogCorrectionPolicy(unknownAppointmentCallLogId, database)).resolves.toMatchObject({
        mode: "blocked_conflict"
      });
      await expect(getCallLogCorrectionPolicy(missingAppointmentCallLogId, database)).resolves.toEqual({
        mode: "blocked_missing",
        message: "Bağlı kayıt bulunamadı. Düzeltme yapılamadı; veri kontrolü gerekli."
      });
      await expect(getCallLogCorrectionPolicy(conflictCallLogId, database)).resolves.toMatchObject({
        mode: "blocked_conflict"
      });
      await expect(getCallLogCorrectionPolicy(mismatchedReminderCallLogId, database)).resolves.toMatchObject({
        mode: "blocked_conflict"
      });
    } finally {
      database.close();
      await database.delete();
    }
  });

  it.each(["completed", "cancelled"] satisfies ReminderStatus[])(
    "updates only the note for a %s linked reminder and preserves the student summary",
    async (status) => {
      const database = await createDatabase();

      try {
        const studentId = await database.students.add(
          student({
            last_call_result: "reached",
            last_contacted_at: "2026-05-10T12:00:00.000Z",
            last_contacted_phone_id: 1,
            lifecycle_status: "registered"
          })
        );
        const phoneId = await database.phones.add(phone(studentId));
        const reminderId = await database.reminders.add(reminder(studentId, status));
        const callLogId = await database.call_logs.add(
          callLog(studentId, {
            call_time: "2026-05-10T12:00:00.000Z",
            call_result: "reached",
            phone_id: phoneId,
            phone_snapshot: {
              phone_id: phoneId,
              phone_number: "05321234567",
              reference_label: "Telefon 1",
              relation_label: "Öğrenci"
            },
            contacted_phone_id: phoneId,
            contacted_phone_number: "05321234567",
            contacted_phone_label: "Telefon 1",
            created_reminder_id: reminderId
          })
        );
        const studentBefore = await database.students.get(studentId);
        const reminderBefore = await database.reminders.get(reminderId);

        const correction = await updateCallLogCorrection(
          correctionInput(callLogId, {
            call_time: "2026-05-10T12:00:00.000Z",
            call_result: "reached",
            contacted_phone_id: phoneId,
            note: "Terminal not düzeltildi"
          }),
          database
        );

        const updatedLog = await database.call_logs.get(callLogId);
        const studentAfter = await database.students.get(studentId);
        const reminderAfter = await database.reminders.get(reminderId);
        const audit = (await database.audit_logs.where("entity_id").equals(callLogId).toArray()).find(
          (record) => record.field_name === "call_log_correction"
        );
        const oldValue = JSON.parse(audit?.old_value ?? "{}");
        const newValue = JSON.parse(audit?.new_value ?? "{}");

        expect(correction).toMatchObject({ correction_mode: "note_only", latest_call_log_id: null, contacted_phone_id: phoneId });
        expect(updatedLog).toMatchObject({
          note: "Terminal not düzeltildi",
          call_time: "2026-05-10T12:00:00.000Z",
          call_result: "reached",
          phone_id: phoneId,
          contacted_phone_id: phoneId,
          created_reminder_id: reminderId,
          created_appointment_id: null
        });
        expect(updatedLog?.phone_snapshot).toEqual({
          phone_id: phoneId,
          phone_number: "05321234567",
          reference_label: "Telefon 1",
          relation_label: "Öğrenci"
        });
        expect(studentAfter).toEqual(studentBefore);
        expect(reminderAfter).toEqual(reminderBefore);
        expect(oldValue).toMatchObject({ correction_mode: "note_only", note: "Eski not", call_result: "reached" });
        expect(newValue).toMatchObject({
          correction_mode: "note_only",
          note: "Terminal not düzeltildi",
          call_time: oldValue.call_time,
          call_result: oldValue.call_result,
          phone_id: oldValue.phone_id,
          phone_snapshot: oldValue.phone_snapshot,
          created_reminder_id: oldValue.created_reminder_id,
          created_appointment_id: oldValue.created_appointment_id
        });
      } finally {
        database.close();
        await database.delete();
      }
    }
  );

  it("updates only the note for a terminal appointment without mutating the appointment", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(
        student({
          last_call_result: "appointment",
          last_contacted_at: "2026-05-10T12:00:00.000Z",
          last_contacted_phone_id: null
        })
      );
      const appointmentId = await database.appointments.add(appointment(studentId, "attended"));
      const callLogId = await database.call_logs.add(
        callLog(studentId, {
          call_time: "2026-05-10T12:00:00.000Z",
          call_result: "appointment",
          created_appointment_id: appointmentId
        })
      );
      const studentBefore = await database.students.get(studentId);
      const appointmentBefore = await database.appointments.get(appointmentId);

      await updateCallLogCorrection(
        correctionInput(callLogId, {
          call_time: "2026-05-10T12:00:00.000Z",
          call_result: "appointment",
          note: "Katılım notu düzeltildi"
        }),
        database
      );

      expect(await database.call_logs.get(callLogId)).toMatchObject({
        note: "Katılım notu düzeltildi",
        call_time: "2026-05-10T12:00:00.000Z",
        call_result: "appointment",
        created_appointment_id: appointmentId
      });
      expect(await database.students.get(studentId)).toEqual(studentBefore);
      expect(await database.appointments.get(appointmentId)).toEqual(appointmentBefore);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it.each(["pending", "postponed"] satisfies AppointmentStatus[])(
    "blocks a %s linked appointment correction",
    async (status) => {
      const database = await createDatabase();

      try {
        const studentId = await database.students.add(student());
        const appointmentId = await database.appointments.add(appointment(studentId, status));
        const callLogId = await database.call_logs.add(callLog(studentId, { created_appointment_id: appointmentId }));

        await expect(updateCallLogCorrection(correctionInput(callLogId), database)).rejects.toThrow("aktif bir etkinlik");
        expect(await database.audit_logs.count()).toBe(0);
      } finally {
        database.close();
        await database.delete();
      }
    }
  );

  it.each(["attended", "missed", "cancelled", "registered", "completed", "no_show"] satisfies AppointmentStatus[])(
    "permits note-only correction for a terminal %s appointment",
    async (status) => {
      const database = await createDatabase();

      try {
        const studentId = await database.students.add(student());
        const appointmentId = await database.appointments.add(appointment(studentId, status));
        const callLogId = await database.call_logs.add(
          callLog(studentId, { call_result: "appointment", created_appointment_id: appointmentId })
        );

        await expect(getCallLogCorrectionPolicy(callLogId, database)).resolves.toEqual({ mode: "note_only" });
        await updateCallLogCorrection(
          correctionInput(callLogId, { call_result: "appointment", note: `${status} notu` }),
          database
        );

        expect(await database.call_logs.get(callLogId)).toMatchObject({ note: `${status} notu`, call_result: "appointment" });
        expect((await database.appointments.get(appointmentId))?.status).toBe(status);
      } finally {
        database.close();
        await database.delete();
      }
    }
  );

  it("fails closed for a broken modern appointment reciprocal link", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const callLogId = await database.call_logs.add(callLog(studentId, { call_result: "appointment" }));
      const appointmentId = await database.appointments.add(
        appointment(studentId, "completed", { call_log_id: callLogId + 1 })
      );
      await database.call_logs.update(callLogId, { created_appointment_id: appointmentId });

      await expect(getCallLogCorrectionPolicy(callLogId, database)).resolves.toMatchObject({ mode: "blocked_conflict" });
      expect(await database.audit_logs.count()).toBe(0);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("rejects converting a normal call log to appointment without creating C+ appointment state", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const callLogId = await database.call_logs.add(callLog(studentId, { call_result: "not_reached" }));
      const before = await database.call_logs.get(callLogId);

      await expect(
        updateCallLogCorrection(correctionInput(callLogId, { call_result: "appointment" }), database)
      ).rejects.toThrow("Randevu yalnız randevu oluşturma akışından");

      expect(await database.call_logs.get(callLogId)).toEqual(before);
      expect(await database.appointments.count()).toBe(0);
      expect(await database.audit_logs.count()).toBe(0);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it.each([
    ["missing back-link", async (database: AppDatabase, studentId: number, callLogId: number) => {
      await database.appointments.add(appointment(studentId, "pending", { call_log_id: callLogId }));
    }],
    ["conflicting back-link", async (database: AppDatabase, studentId: number, callLogId: number) => {
      await database.appointments.add(appointment(studentId, "pending", { call_log_id: callLogId }));
      const conflictingAppointmentId = await database.appointments.add(appointment(studentId, "completed"));
      await database.call_logs.update(callLogId, { created_appointment_id: conflictingAppointmentId });
    }],
    ["duplicate forward owners", async (database: AppDatabase, studentId: number, callLogId: number) => {
      await database.appointments.bulkAdd([
        appointment(studentId, "pending", { call_log_id: callLogId }),
        appointment(studentId, "pending", { call_log_id: callLogId })
      ]);
    }]
  ])("fails closed for a pending forward owner with %s", async (_label, setup) => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const callLogId = await database.call_logs.add(callLog(studentId, { call_result: "appointment" }));
      await setup(database, studentId, callLogId);
      const before = await database.call_logs.get(callLogId);

      await expect(updateCallLogCorrection(correctionInput(callLogId, { call_result: "appointment" }), database)).rejects.toThrow(
        "Bağlı kayıtlar güvenle doğrulanamadı"
      );

      expect(await database.call_logs.get(callLogId)).toEqual(before);
      expect(await database.audit_logs.count()).toBe(0);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("fails closed for a pending forward owner with a student mismatch", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const otherStudentId = await database.students.add(student({ student_full_name: "Başka Aday" }));
      const callLogId = await database.call_logs.add(callLog(studentId, { call_result: "appointment" }));
      await database.appointments.add(appointment(otherStudentId, "pending", { call_log_id: callLogId }));
      const before = await database.call_logs.get(callLogId);

      await expect(updateCallLogCorrection(correctionInput(callLogId, { call_result: "appointment" }), database)).rejects.toThrow(
        "Bağlı kayıtlar güvenle doğrulanamadı"
      );

      expect(await database.call_logs.get(callLogId)).toEqual(before);
      expect(await database.audit_logs.count()).toBe(0);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("rejects changing a pending appointment owner to a non-appointment result", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const callLogId = await database.call_logs.add(callLog(studentId, { call_result: "appointment" }));
      const appointmentId = await database.appointments.add(appointment(studentId, "pending", { call_log_id: callLogId }));
      await database.call_logs.update(callLogId, { created_appointment_id: appointmentId });
      const before = await database.call_logs.get(callLogId);

      await expect(updateCallLogCorrection(correctionInput(callLogId, { call_result: "reached" }), database)).rejects.toThrow(
        "aktif bir etkinlik"
      );

      expect(await database.call_logs.get(callLogId)).toEqual(before);
      expect((await database.appointments.get(appointmentId))?.status).toBe("pending");
      expect(await database.audit_logs.count()).toBe(0);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("rejects non-note changes for a terminal dependency even when UI restrictions are bypassed", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const phoneId = await database.phones.add(phone(studentId));
      const secondPhoneId = await database.phones.add(phone(studentId, { phone_number: "05329876543", priority: 2 }));
      const reminderId = await database.reminders.add(reminder(studentId, "completed"));
      const callLogId = await database.call_logs.add(
        callLog(studentId, {
          call_time: "2026-05-10T12:00:00.000Z",
          call_result: "reached",
          phone_id: phoneId,
          contacted_phone_id: phoneId,
          created_reminder_id: reminderId
        })
      );
      const before = await database.call_logs.get(callLogId);

      await expect(
        updateCallLogCorrection(
          correctionInput(callLogId, { call_time: "2026-05-11T12:00:00.000Z", call_result: "reached", contacted_phone_id: phoneId }),
          database
        )
      ).rejects.toThrow("yalnız açıklama notu");
      await expect(
        updateCallLogCorrection(
          correctionInput(callLogId, { call_time: "2026-05-10T12:00:00.000Z", call_result: "registered", contacted_phone_id: phoneId }),
          database
        )
      ).rejects.toThrow("yalnız açıklama notu");
      await expect(
        updateCallLogCorrection(
          correctionInput(callLogId, {
            call_time: "2026-05-10T12:00:00.000Z",
            call_result: "reached",
            contacted_phone_id: secondPhoneId
          }),
          database
        )
      ).rejects.toThrow("yalnız açıklama notu");

      expect(await database.call_logs.get(callLogId)).toEqual(before);
      expect(await database.audit_logs.count()).toBe(0);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("rechecks dependency lifecycle inside the save transaction when a terminal modal becomes stale", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const reminderId = await database.reminders.add(reminder(studentId, "completed"));
      const callLogId = await database.call_logs.add(callLog(studentId, { created_reminder_id: reminderId }));

      await expect(getCallLogCorrectionPolicy(callLogId, database)).resolves.toEqual({ mode: "note_only" });
      await database.reminders.update(reminderId, { status: "pending" });

      await expect(updateCallLogCorrection(correctionInput(callLogId), database)).rejects.toThrow("aktif bir hatırlatma");
      expect((await database.call_logs.get(callLogId))?.note).toBe("Eski not");
      expect(await database.audit_logs.count()).toBe(0);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("blocks active, missing, and conflicting dependencies without mutation or correction audit", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const pendingReminderId = await database.reminders.add(reminder(studentId, "pending"));
      const completedReminderId = await database.reminders.add(reminder(studentId, "completed"));
      const appointmentId = await database.appointments.add(appointment(studentId, "pending"));
      const callLogIds = await database.call_logs.bulkAdd(
        [
          callLog(studentId, { created_reminder_id: pendingReminderId }),
          callLog(studentId, { created_reminder_id: 9999 }),
          callLog(studentId, { created_reminder_id: completedReminderId, created_appointment_id: appointmentId })
        ],
        { allKeys: true }
      );
      const studentBefore = await database.students.get(studentId);

      await expect(updateCallLogCorrection(correctionInput(callLogIds[0]), database)).rejects.toThrow("aktif bir hatırlatma");
      await expect(updateCallLogCorrection(correctionInput(callLogIds[1]), database)).rejects.toThrow(
        "Bağlı kayıt bulunamadı. Düzeltme yapılamadı; veri kontrolü gerekli."
      );
      await expect(updateCallLogCorrection(correctionInput(callLogIds[2]), database)).rejects.toThrow("güvenle doğrulanamadı");

      expect(await database.students.get(studentId)).toEqual(studentBefore);
      expect(await database.audit_logs.count()).toBe(0);
      await expect(database.call_logs.bulkGet(callLogIds)).resolves.toEqual(
        expect.arrayContaining([
          expect.objectContaining({ note: "Eski not" }),
          expect.objectContaining({ note: "Eski not" }),
          expect.objectContaining({ note: "Eski not" })
        ])
      );
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("keeps the call-log update and correction audit atomic", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const callLogId = await database.call_logs.add(callLog(studentId));
      const before = await database.call_logs.get(callLogId);
      const auditAdd = vi.spyOn(database.audit_logs, "add").mockRejectedValueOnce(new Error("Audit insert failed"));

      await expect(updateCallLogCorrection(correctionInput(callLogId), database)).rejects.toThrow("Audit insert failed");

      expect(await database.call_logs.get(callLogId)).toEqual(before);
      expect(await database.audit_logs.count()).toBe(0);
      auditAdd.mockRestore();
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("does not write an audit row when the call-log update fails", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const callLogId = await database.call_logs.add(callLog(studentId));
      const callLogUpdate = vi
        .spyOn(database.call_logs, "update")
        .mockRejectedValueOnce(new Error("Call-log update failed"));

      await expect(updateCallLogCorrection(correctionInput(callLogId), database)).rejects.toThrow("Call-log update failed");

      expect(await database.audit_logs.count()).toBe(0);
      callLogUpdate.mockRestore();
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("keeps every successful correction as a separate append-only audit row", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const callLogId = await database.call_logs.add(callLog(studentId));

      await updateCallLogCorrection(correctionInput(callLogId, { note: "İlk düzeltme" }), database);
      await updateCallLogCorrection(
        correctionInput(callLogId, { call_time: timestamp, call_result: "not_reached", note: "İkinci düzeltme" }),
        database
      );

      const audits = (await database.audit_logs.where("entity_id").equals(callLogId).toArray()).filter(
        (record) => record.field_name === "call_log_correction"
      );

      expect(audits).toHaveLength(2);
      expect(JSON.parse(audits[0].new_value ?? "{}").note).toBe("İlk düzeltme");
      expect(JSON.parse(audits[1].new_value ?? "{}").note).toBe("İkinci düzeltme");
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("keeps correction audit in the full backup but out of normal detailed export", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const callLogId = await database.call_logs.add(callLog(studentId));

      await updateCallLogCorrection(correctionInput(callLogId), database);

      const backup = await createBackupSnapshot(database);
      const detailedExport = await readDetailedExportData({ database });
      const backupAudit = backup.tables.audit_logs.find(
        (record) =>
          (record as { entity_id?: number; field_name?: string }).entity_id === callLogId &&
          (record as { field_name?: string }).field_name === "call_log_correction"
      );

      expect(backupAudit).toMatchObject({ entity_type: "call_log", field_name: "call_log_correction" });
      expect(JSON.stringify(detailedExport)).not.toContain("call_log_correction");
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("does not mutate PhoneRecord fields during correction", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const phoneId = await database.phones.add(phone(studentId, { phone_status: "contacted" }));
      const beforePhone = await database.phones.get(phoneId);
      const callLogId = await database.call_logs.add(callLog(studentId));

      await updateCallLogCorrection(
        {
          call_log_id: callLogId,
          call_time: "2026-05-10T12:00:00.000Z",
          call_result: "reached",
          note: "Telefon bağlamı düzeltildi",
          contacted_phone_id: phoneId
        },
        database
      );

      const afterPhone = await database.phones.get(phoneId);

      expect(afterPhone?.phone_status).toBe(beforePhone?.phone_status);
      expect(afterPhone?.is_wrong).toBe(beforePhone?.is_wrong);
      expect(afterPhone?.is_valid).toBe(beforePhone?.is_valid);
      expect(afterPhone?.updated_at).toBe(beforePhone?.updated_at);
    } finally {
      database.close();
      await database.delete();
    }
  });
});
