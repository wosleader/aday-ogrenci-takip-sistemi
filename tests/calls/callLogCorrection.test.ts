import { describe, expect, it } from "vitest";
import { AppDatabase } from "../../src/db/db";
import type { CallLogRecord } from "../../src/domain/models/callLog";
import type { PhoneRecord } from "../../src/domain/models/phone";
import type { StudentRecord } from "../../src/domain/models/student";
import { updateCallLogCorrection } from "../../src/features/calls/services/callLogCorrection";
import { readCallHistoryForStudent } from "../../src/features/calls/services/callHistoryReader";
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

      await updateCallLogCorrection(
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
      expect(updatedStudent?.last_call_result).toBe("reached");
      expect(updatedStudent?.last_contacted_at).toBe("2026-05-10T12:30:00.000Z");
      expect(updatedStudent?.last_contacted_phone_id).toBe(phoneId);
      expect(history[0].call_result_label).toBe("Görüşüldü");
      expect(history[0].note).toBe("Düzeltilmiş not");
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

  it("blocks correction when the call log has a linked reminder or appointment", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const reminderCallLogId = await database.call_logs.add(callLog(studentId, { created_reminder_id: 10 }));
      const appointmentCallLogId = await database.call_logs.add(callLog(studentId, { created_appointment_id: 20 }));

      await expect(
        updateCallLogCorrection(
          {
            call_log_id: reminderCallLogId,
            call_time: timestamp,
            call_result: "reached",
            note: "Düzeltme",
            contacted_phone_id: null
          },
          database
        )
      ).rejects.toThrow("bağlı hatırlatma/randevu");
      await expect(
        updateCallLogCorrection(
          {
            call_log_id: appointmentCallLogId,
            call_time: timestamp,
            call_result: "reached",
            note: "Düzeltme",
            contacted_phone_id: null
          },
          database
        )
      ).rejects.toThrow("bağlı hatırlatma/randevu");
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
