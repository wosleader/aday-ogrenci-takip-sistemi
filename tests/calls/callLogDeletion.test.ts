import { describe, expect, it } from "vitest";
import { AppDatabase } from "../../src/db/db";
import type { CallLogRecord } from "../../src/domain/models/callLog";
import type { PhoneRecord } from "../../src/domain/models/phone";
import type { StudentRecord } from "../../src/domain/models/student";
import { readCallHistoryForStudent } from "../../src/features/calls/services/callHistoryReader";
import { softDeleteCallLogAndRecomputeStudentSummary } from "../../src/features/calls/services/callLogDeletion";
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

  it("blocks deletion when the call log has a linked reminder or appointment", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const reminderCallLogId = await database.call_logs.add(callLog(studentId, { created_reminder_id: 10 }));
      const appointmentCallLogId = await database.call_logs.add(callLog(studentId, { created_appointment_id: 20 }));

      await expect(softDeleteCallLogAndRecomputeStudentSummary(reminderCallLogId, database)).rejects.toThrow(
        "bağlı hatırlatma/randevu"
      );
      await expect(softDeleteCallLogAndRecomputeStudentSummary(appointmentCallLogId, database)).rejects.toThrow(
        "bağlı hatırlatma/randevu"
      );
      expect((await database.call_logs.get(reminderCallLogId))?.deleted_at).toBeNull();
      expect((await database.call_logs.get(appointmentCallLogId))?.deleted_at).toBeNull();
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
