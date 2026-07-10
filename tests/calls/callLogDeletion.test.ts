import { describe, expect, it } from "vitest";
import { createBackupSnapshot } from "../../src/db/backup";
import { AppDatabase } from "../../src/db/db";
import type { AppointmentStatus, ReminderStatus } from "../../src/domain/constants/statuses";
import type { AppointmentRecord } from "../../src/domain/models/appointment";
import type { CallLogRecord } from "../../src/domain/models/callLog";
import type { PhoneRecord } from "../../src/domain/models/phone";
import type { ReminderRecord } from "../../src/domain/models/reminder";
import type { StudentRecord } from "../../src/domain/models/student";
import { readCallHistoryForStudent } from "../../src/features/calls/services/callHistoryReader";
import { softDeleteCallLogAndRecomputeStudentSummary } from "../../src/features/calls/services/callLogDeletion";
import { readDetailedExportData } from "../../src/features/exports/services/exportDataReader";
import { readDailyReport } from "../../src/features/reports/services/dailyReportReader";
import { readReportingV2Summary } from "../../src/features/reports/services/reportingV2Reader";
import { createSearchText, normalizeText } from "../../src/utils/normalizeText";

const timestamp = "2026-05-08T09:00:00.000Z";

async function createDatabase() {
  const database = new AppDatabase(`test-call-log-delete-${crypto.randomUUID()}`);
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
    normalized_phone_number: overrides.normalized_phone_number ?? phoneNumber,
    original_phone_value: phoneNumber,
    phone_label: "Telefon 1",
    reference_label: "Telefon 1",
    relation_label: "Telefon",
    priority: 1,
    phone_status: "contacted",
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
    call_result: "reached",
    note: null,
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
    reminder_type: "call",
    reminder_at: "2026-05-12T11:00:00.000Z",
    status,
    note: null,
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
    note: null,
    sync_status: "local",
    created_at: timestamp,
    updated_at: timestamp,
    deleted_at: null,
    ...overrides
  };
}

describe("callLogDeletion", () => {
  it("soft deletes the call log row and hides it from communication history", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student({ last_call_result: "reached" }));
      const callLogId = await database.call_logs.add(callLog(studentId));

      await softDeleteCallLogAndRecomputeStudentSummary(callLogId, database);
      const deletedLog = await database.call_logs.get(callLogId);
      const history = await readCallHistoryForStudent(studentId, database);

      expect(deletedLog).toBeDefined();
      expect(deletedLog?.deleted_at).toBeTruthy();
      expect(deletedLog?.updated_at).toBe(deletedLog?.deleted_at);
      expect(history).toEqual([]);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("recomputes student latest summary from the previous active call when latest is deleted", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(
        student({
          last_call_result: "reached",
          last_contacted_at: "2026-05-10T12:00:00.000Z",
          last_contacted_phone_id: 22
        })
      );
      const oldPhoneId = await database.phones.add(phone(studentId, { phone_number: "05320000001" }));
      const latestPhoneId = await database.phones.add(phone(studentId, { phone_number: "05320000002" }));
      await database.call_logs.add(
        callLog(studentId, {
          contacted_phone_id: oldPhoneId,
          phone_id: oldPhoneId,
          call_time: "2026-05-10T10:00:00.000Z",
          call_result: "not_reached"
        })
      );
      const latestCallLogId = await database.call_logs.add(
        callLog(studentId, {
          contacted_phone_id: latestPhoneId,
          phone_id: latestPhoneId,
          call_time: "2026-05-10T12:00:00.000Z",
          call_result: "reached"
        })
      );

      await softDeleteCallLogAndRecomputeStudentSummary(latestCallLogId, database);
      const updatedStudent = await database.students.get(studentId);

      expect(updatedStudent?.last_call_result).toBe("not_reached");
      expect(updatedStudent?.last_contacted_at).toBe("2026-05-10T10:00:00.000Z");
      expect(updatedStudent?.last_contacted_phone_id).toBe(oldPhoneId);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("keeps student latest summary when an older call log is deleted", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(
        student({
          last_call_result: "reached",
          last_contacted_at: "2026-05-10T12:00:00.000Z",
          last_contacted_phone_id: 2
        })
      );
      const oldCallLogId = await database.call_logs.add(
        callLog(studentId, {
          contacted_phone_id: 1,
          call_time: "2026-05-10T10:00:00.000Z",
          call_result: "not_reached"
        })
      );
      await database.call_logs.add(
        callLog(studentId, {
          contacted_phone_id: 2,
          call_time: "2026-05-10T12:00:00.000Z",
          call_result: "reached"
        })
      );

      await softDeleteCallLogAndRecomputeStudentSummary(oldCallLogId, database);
      const updatedStudent = await database.students.get(studentId);

      expect(updatedStudent?.last_call_result).toBe("reached");
      expect(updatedStudent?.last_contacted_at).toBe("2026-05-10T12:00:00.000Z");
      expect(updatedStudent?.last_contacted_phone_id).toBe(2);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("clears student latest summary when no active call logs remain", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(
        student({
          last_call_result: "reached",
          last_contacted_at: "2026-05-10T12:00:00.000Z",
          last_contacted_phone_id: 1
        })
      );
      const callLogId = await database.call_logs.add(
        callLog(studentId, {
          contacted_phone_id: 1,
          call_time: "2026-05-10T12:00:00.000Z",
          call_result: "reached"
        })
      );

      await softDeleteCallLogAndRecomputeStudentSummary(callLogId, database);
      const updatedStudent = await database.students.get(studentId);

      expect(updatedStudent?.last_call_result).toBe("not_called");
      expect(updatedStudent?.last_contacted_at).toBeNull();
      expect(updatedStudent?.last_contacted_phone_id).toBeNull();
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("blocks deletion when the linked reminder is pending", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const reminderId = await database.reminders.add(reminder(studentId, "pending"));
      const reminderCallLogId = await database.call_logs.add(callLog(studentId, { created_reminder_id: reminderId }));

      await expect(softDeleteCallLogAndRecomputeStudentSummary(reminderCallLogId, database)).rejects.toThrow(
        "açık bir hatırlatma"
      );
      expect((await database.call_logs.get(reminderCallLogId))?.deleted_at).toBeNull();
    } finally {
      database.close();
      await database.delete();
    }
  });

  it.each(["completed", "cancelled"] satisfies ReminderStatus[])(
    "soft deletes a call log linked to a %s reminder without mutating the reminder",
    async (status) => {
      const database = await createDatabase();

      try {
        const studentId = await database.students.add(student({ last_call_result: "reached" }));
        const reminderId = await database.reminders.add(reminder(studentId, status));
        const callLogId = await database.call_logs.add(callLog(studentId, { created_reminder_id: reminderId }));
        const reminderBefore = await database.reminders.get(reminderId);

        await softDeleteCallLogAndRecomputeStudentSummary(callLogId, database);
        const deletedLog = await database.call_logs.get(callLogId);
        const reminderAfter = await database.reminders.get(reminderId);

        expect(deletedLog?.deleted_at).toBeTruthy();
        expect(reminderAfter).toEqual(reminderBefore);
      } finally {
        database.close();
        await database.delete();
      }
    }
  );

  it.each(["pending", "postponed"] satisfies AppointmentStatus[])(
    "blocks deletion when the linked appointment is %s",
    async (status) => {
      const database = await createDatabase();

      try {
        const studentId = await database.students.add(student());
        const appointmentId = await database.appointments.add(appointment(studentId, status));
        const appointmentCallLogId = await database.call_logs.add(
          callLog(studentId, { created_appointment_id: appointmentId })
        );

        await expect(softDeleteCallLogAndRecomputeStudentSummary(appointmentCallLogId, database)).rejects.toThrow(
          "aktif/işlenmemiş bir randevu"
        );
        expect((await database.call_logs.get(appointmentCallLogId))?.deleted_at).toBeNull();
      } finally {
        database.close();
        await database.delete();
      }
    }
  );

  it.each(["attended", "missed", "cancelled", "registered"] satisfies AppointmentStatus[])(
    "soft deletes a call log linked to a terminal %s appointment without mutating the appointment",
    async (status) => {
      const database = await createDatabase();

      try {
        const studentId = await database.students.add(student({ last_call_result: "appointment" }));
        const appointmentId = await database.appointments.add(appointment(studentId, status));
        const callLogId = await database.call_logs.add(callLog(studentId, { created_appointment_id: appointmentId }));
        const appointmentBefore = await database.appointments.get(appointmentId);

        await softDeleteCallLogAndRecomputeStudentSummary(callLogId, database);
        const deletedLog = await database.call_logs.get(callLogId);
        const appointmentAfter = await database.appointments.get(appointmentId);

        expect(deletedLog?.deleted_at).toBeTruthy();
        expect(appointmentAfter).toEqual(appointmentBefore);
      } finally {
        database.close();
        await database.delete();
      }
    }
  );

  it("blocks deletion when one linked record is still active even if the other is terminal", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const reminderId = await database.reminders.add(reminder(studentId, "completed"));
      const appointmentId = await database.appointments.add(appointment(studentId, "pending"));
      const callLogId = await database.call_logs.add(
        callLog(studentId, { created_reminder_id: reminderId, created_appointment_id: appointmentId })
      );

      await expect(softDeleteCallLogAndRecomputeStudentSummary(callLogId, database)).rejects.toThrow(
        "aktif/işlenmemiş bir randevu"
      );
      expect((await database.call_logs.get(callLogId))?.deleted_at).toBeNull();
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("soft deletes when all linked reminder and appointment records are terminal", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student({ last_call_result: "appointment" }));
      const reminderId = await database.reminders.add(reminder(studentId, "cancelled"));
      const appointmentId = await database.appointments.add(appointment(studentId, "registered"));
      const callLogId = await database.call_logs.add(
        callLog(studentId, { created_reminder_id: reminderId, created_appointment_id: appointmentId })
      );

      await softDeleteCallLogAndRecomputeStudentSummary(callLogId, database);

      expect((await database.call_logs.get(callLogId))?.deleted_at).toBeTruthy();
      expect((await database.reminders.get(reminderId))?.status).toBe("cancelled");
      expect((await database.appointments.get(appointmentId))?.status).toBe("registered");
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("blocks deletion when a linked reminder or appointment cannot be resolved as closed", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const reminderCallLogId = await database.call_logs.add(callLog(studentId, { created_reminder_id: 999 }));
      const appointmentCallLogId = await database.call_logs.add(callLog(studentId, { created_appointment_id: 999 }));

      await expect(softDeleteCallLogAndRecomputeStudentSummary(reminderCallLogId, database)).rejects.toThrow(
        "aktif bağlı iş"
      );
      await expect(softDeleteCallLogAndRecomputeStudentSummary(appointmentCallLogId, database)).rejects.toThrow(
        "aktif bağlı iş"
      );
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("removes a terminal linked soft-deleted call log from reports and export while preserving it in backup", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student({ last_call_result: "registered" }));
      const appointmentId = await database.appointments.add(appointment(studentId, "registered"));
      const callLogId = await database.call_logs.add(
        callLog(studentId, {
          created_appointment_id: appointmentId,
          call_time: "2026-05-10T10:00:00.000Z",
          call_result: "registered"
        })
      );

      await softDeleteCallLogAndRecomputeStudentSummary(callLogId, database);

      const dailyReport = await readDailyReport("2026-05-10", { database });
      const reportingV2 = await readReportingV2Summary({
        fromDate: "2026-05-10",
        toDate: "2026-05-10",
        database
      });
      const exportData = await readDetailedExportData({ database });
      const backup = await createBackupSnapshot(database);
      const backedUpCallLog = backup.tables.call_logs.find((row) => (row as CallLogRecord & { id?: number }).id === callLogId) as
        | (CallLogRecord & { id?: number })
        | undefined;

      expect(dailyReport.summary.call_log_count).toBe(0);
      expect(reportingV2.totals.totalCallLogs).toBe(0);
      expect(exportData.bundles[0].call_logs).toHaveLength(0);
      expect(backedUpCallLog?.deleted_at).toBeTruthy();
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("does not mutate PhoneRecord fields during deletion", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const phoneId = await database.phones.add(phone(studentId, { is_wrong: true, is_valid: false }));
      const beforePhone = await database.phones.get(phoneId);
      const callLogId = await database.call_logs.add(
        callLog(studentId, {
          contacted_phone_id: phoneId,
          phone_id: phoneId,
          call_time: "2026-05-10T12:00:00.000Z",
          call_result: "wrong_number"
        })
      );

      await softDeleteCallLogAndRecomputeStudentSummary(callLogId, database);
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

  it("uses phone snapshot as fallback when recomputing latest contacted phone", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const oldCallLogId = await database.call_logs.add(
        callLog(studentId, {
          contacted_phone_id: 1,
          call_time: "2026-05-10T10:00:00.000Z",
          call_result: "not_reached"
        })
      );
      await database.call_logs.add(
        callLog(studentId, {
          contacted_phone_id: null,
          phone_id: null,
          phone_snapshot: {
            phone_id: 42,
            reference_label: "Telefon 3",
            relation_label: "Telefon",
            phone_number: "05320000042"
          },
          call_time: "2026-05-10T12:00:00.000Z",
          call_result: "reached"
        })
      );

      await softDeleteCallLogAndRecomputeStudentSummary(oldCallLogId, database);
      const updatedStudent = await database.students.get(studentId);

      expect(updatedStudent?.last_call_result).toBe("reached");
      expect(updatedStudent?.last_contacted_phone_id).toBe(42);
    } finally {
      database.close();
      await database.delete();
    }
  });
});
