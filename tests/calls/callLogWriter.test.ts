import { describe, expect, it } from "vitest";
import { AppDatabase } from "../../src/db/db";
import type { PhoneRecord } from "../../src/domain/models/phone";
import type { ReminderRecord } from "../../src/domain/models/reminder";
import type { StudentRecord } from "../../src/domain/models/student";
import { writeCallLog } from "../../src/features/calls/services/callLogWriter";
import { createSearchText, normalizeText } from "../../src/utils/normalizeText";

const timestamp = "2026-05-08T09:00:00.000Z";

async function createDatabase() {
  const database = new AppDatabase(`test-call-writer-${crypto.randomUUID()}`);
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

function reminder(studentId: number, overrides: Partial<ReminderRecord> = {}): ReminderRecord {
  return {
    uuid: crypto.randomUUID(),
    student_id: studentId,
    reminder_type: "call",
    reminder_at: "2026-05-12T11:00:00.000Z",
    status: "pending",
    note: null,
    is_default_time_assigned: false,
    sync_status: "local",
    created_at: timestamp,
    updated_at: timestamp,
    deleted_at: null,
    ...overrides
  };
}

describe("callLogWriter", () => {
  it("creates a call log with contacted phone and note", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const phoneId = await database.phones.add(phone(studentId));

      const result = await writeCallLog(
        {
          student_id: studentId,
          contacted_phone_id: phoneId,
          call_result: "reached",
          note: "Veli bilgi istedi.",
          created_by: "agent"
        },
        { database }
      );
      const callLog = await database.call_logs.get(result.call_log_id);
      const updatedStudent = await database.students.get(studentId);
      const updatedPhone = await database.phones.get(phoneId);

      expect(callLog).toMatchObject({
        student_id: studentId,
        contacted_phone_id: phoneId,
        contacted_phone_number: "05321234567",
        contacted_phone_label: "Telefon 1",
        call_result: "reached",
        note: "Veli bilgi istedi."
      });
      expect(updatedStudent?.last_call_result).toBe("reached");
      expect(updatedStudent?.last_contacted_phone_id).toBe(phoneId);
      expect(updatedPhone?.phone_status).toBe("contacted");
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("keeps only one contacted phone for the student", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const firstPhoneId = await database.phones.add(phone(studentId, { phone_status: "contacted" }));
      const secondPhoneId = await database.phones.add(
        phone(studentId, {
          phone_number: "05327654321",
          normalized_phone_number: "05327654321",
          phone_label: "Telefon 2",
          is_primary: false
        })
      );

      await writeCallLog(
        {
          student_id: studentId,
          contacted_phone_id: secondPhoneId,
          call_result: "reached"
        },
        { database }
      );

      expect((await database.phones.get(firstPhoneId))?.phone_status).toBe("active");
      expect((await database.phones.get(secondPhoneId))?.phone_status).toBe("contacted");
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("does not auto-select invalid phones", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      await database.phones.add(phone(studentId, { phone_status: "invalid", is_wrong: true }));

      await writeCallLog(
        {
          student_id: studentId,
          call_result: "wrong_number"
        },
        { database }
      );

      const callLog = (await database.call_logs.toArray())[0];
      expect(callLog.contacted_phone_id).toBeNull();
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("requires explicit phone selection when two eligible phones exist", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      await database.phones.bulkAdd([
        phone(studentId),
        phone(studentId, {
          phone_number: "05327654321",
          normalized_phone_number: "05327654321",
          phone_label: "Telefon 2",
          is_primary: false
        })
      ]);

      await expect(writeCallLog({ student_id: studentId, call_result: "reached" }, { database })).rejects.toThrow(
        "Hangi numarayla görüşüldü"
      );
      expect(await database.call_logs.count()).toBe(0);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("creates a pending reminder when reminder date exists", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const phoneId = await database.phones.add(phone(studentId));

      const result = await writeCallLog(
        {
          student_id: studentId,
          contacted_phone_id: phoneId,
          call_result: "call_later",
          reminder_at: "2026-05-15T11:00:00.000Z"
        },
        { database }
      );
      const reminderRecord = await database.reminders.get(result.created_reminder_id!);

      expect(reminderRecord).toMatchObject({
        student_id: studentId,
        call_log_id: result.call_log_id,
        status: "pending",
        reminder_at: "2026-05-15T11:00:00.000Z"
      });
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("updates existing pending call reminder instead of creating a duplicate", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const reminderId = await database.reminders.add(reminder(studentId));

      const result = await writeCallLog(
        {
          student_id: studentId,
          call_result: "call_later",
          reminder_at: "2026-05-16T11:00:00.000Z"
        },
        { database }
      );

      expect(result.created_reminder_id).toBe(reminderId);
      expect(result.updated_existing_reminder).toBe(true);
      expect(await database.reminders.count()).toBe(1);
      expect((await database.reminders.get(reminderId))?.reminder_at).toBe("2026-05-16T11:00:00.000Z");
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("rolls back when transaction fails", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const phoneId = await database.phones.add(phone(studentId));

      await expect(
        writeCallLog(
          {
            student_id: studentId,
            contacted_phone_id: phoneId,
            call_result: "reached"
          },
          { database, failAfterCallLogForTest: true }
        )
      ).rejects.toThrow("Test transaction rollback");

      expect(await database.call_logs.count()).toBe(0);
      expect((await database.phones.get(phoneId))?.phone_status).toBe("active");
    } finally {
      database.close();
      await database.delete();
    }
  });
});
