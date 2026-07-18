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
        phone_id: phoneId,
        phone_snapshot: {
          phone_id: phoneId,
          reference_label: "Telefon 1",
          relation_label: "Telefon",
          phone_number: "05321234567",
          source_column: null
        },
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

  it("writes phone snapshot while keeping legacy contacted phone fields", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const phoneId = await database.phones.add(
        phone(studentId, {
          phone_number: "05327654321",
          normalized_phone_number: "05327654321",
          phone_label: "Anne Telefon",
          reference_label: "Telefon 2",
          relation_label: "Anne",
          source_column: "Anne Telefon"
        })
      );

      const result = await writeCallLog(
        {
          student_id: studentId,
          contacted_phone_id: phoneId,
          call_result: "reached"
        },
        { database }
      );
      const callLog = await database.call_logs.get(result.call_log_id);

      expect(callLog).toMatchObject({
        phone_id: phoneId,
        phone_snapshot: {
          phone_id: phoneId,
          reference_label: "Telefon 2",
          relation_label: "Anne",
          phone_number: "05327654321",
          source_column: "Anne Telefon"
        },
        contacted_phone_id: phoneId,
        contacted_phone_number: "05327654321",
        contacted_phone_label: "Anne Telefon"
      });
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("writes phone snapshot when a single eligible phone is auto-selected", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const phoneId = await database.phones.add(
        phone(studentId, {
          phone_label: "Veli Telefon",
          reference_label: "Telefon 5",
          relation_label: "Veli",
          source_column: "GSM 5"
        })
      );

      const result = await writeCallLog(
        {
          student_id: studentId,
          call_result: "reached"
        },
        { database }
      );
      const callLog = await database.call_logs.get(result.call_log_id);

      expect(callLog).toMatchObject({
        phone_id: phoneId,
        phone_snapshot: {
          phone_id: phoneId,
          reference_label: "Telefon 5",
          relation_label: "Veli",
          phone_number: "05321234567",
          source_column: "GSM 5"
        },
        contacted_phone_id: phoneId,
        contacted_phone_number: "05321234567",
        contacted_phone_label: "Veli Telefon"
      });
    } finally {
      database.close();
      await database.delete();
    }
  });

  it.each(["Öğrenci", "Yakın", "Diğer"] as const)(
    "preserves Turkish relation label in persisted phone snapshot: %s",
    async (relationLabel) => {
      const database = await createDatabase();

      try {
        const studentId = await database.students.add(student());
        const phoneId = await database.phones.add(
          phone(studentId, {
            phone_label: `${relationLabel} Telefon`,
            reference_label: "Telefon 3",
            relation_label: relationLabel,
            source_column: `${relationLabel} Telefon`
          })
        );

        const result = await writeCallLog(
          {
            student_id: studentId,
            contacted_phone_id: phoneId,
            call_result: "reached"
          },
          { database }
        );
        const callLog = await database.call_logs.get(result.call_log_id);

        expect(callLog?.phone_snapshot?.relation_label).toBe(relationLabel);
        expect(callLog?.phone_snapshot?.reference_label).toBe("Telefon 3");
      } finally {
        database.close();
        await database.delete();
      }
    }
  );

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

  it("does not auto-select invalid phones for optional call results", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      await database.phones.add(phone(studentId, { phone_status: "invalid", is_wrong: true }));

      await writeCallLog(
        {
          student_id: studentId,
          call_result: "not_reached"
        },
        { database }
      );

      const callLog = (await database.call_logs.toArray())[0];
      expect(callLog.contacted_phone_id).toBeNull();
      expect(callLog.phone_id).toBeNull();
      expect(callLog.phone_snapshot).toBeNull();
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("allows not_reached without selected phone when multiple eligible phones exist", async () => {
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

      const result = await writeCallLog({ student_id: studentId, call_result: "not_reached" }, { database });
      const callLog = await database.call_logs.get(result.call_log_id);
      const updatedStudent = await database.students.get(studentId);

      expect(callLog).toMatchObject({
        call_result: "not_reached",
        contacted_phone_id: null,
        phone_id: null,
        phone_snapshot: null
      });
      expect(updatedStudent?.last_call_result).toBe("not_reached");
      expect(updatedStudent?.last_contacted_phone_id).toBeNull();
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("allows wrong_number with null phone context when all existing phones are invalid or wrong", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const phoneId = await database.phones.add(phone(studentId, { phone_status: "invalid", is_wrong: true }));

      const result = await writeCallLog({ student_id: studentId, call_result: "wrong_number" }, { database });
      const callLog = await database.call_logs.get(result.call_log_id);
      const updatedStudent = await database.students.get(studentId);
      const updatedPhone = await database.phones.get(phoneId);

      expect(callLog).toMatchObject({
        call_result: "wrong_number",
        contacted_phone_id: null,
        phone_id: null,
        phone_snapshot: null
      });
      expect(updatedStudent?.last_call_result).toBe("wrong_number");
      expect(updatedStudent?.last_contacted_phone_id).toBeNull();
      expect(updatedPhone?.phone_status).toBe("invalid");
      expect(updatedPhone?.is_wrong).toBe(true);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("rejects wrong_number when no phone exists", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());

      await expect(writeCallLog({ student_id: studentId, call_result: "wrong_number" }, { database })).rejects.toThrow(
        "Bu kayıt için seçilebilir telefon bulunmadı."
      );
      expect(await database.call_logs.count()).toBe(0);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("allows call_later without selected phone when multiple eligible phones exist", async () => {
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

      const result = await writeCallLog(
        {
          student_id: studentId,
          call_result: "call_later",
          reminder_at: "2026-05-16T11:00:00.000Z"
        },
        { database }
      );
      const callLog = await database.call_logs.get(result.call_log_id);
      const reminderRecord = await database.reminders.get(result.created_reminder_id!);

      expect(callLog).toMatchObject({
        call_result: "call_later",
        contacted_phone_id: null,
        phone_id: null,
        phone_snapshot: null
      });
      expect(reminderRecord).toMatchObject({
        phone_id: null,
        phone_snapshot: null,
        reminder_at: "2026-05-16T11:00:00.000Z"
      });
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("allows appointment without selected phone when multiple eligible phones exist", async () => {
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

      const result = await writeCallLog({ student_id: studentId, call_result: "appointment" }, { database });
      const callLog = await database.call_logs.get(result.call_log_id);

      expect(callLog).toMatchObject({
        call_result: "appointment",
        contacted_phone_id: null,
        phone_id: null,
        phone_snapshot: null
      });
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("requires explicit phone selection for reached when two eligible phones exist", async () => {
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
        "Hangi telefonla işlem yapılacak"
      );
      expect(await database.call_logs.count()).toBe(0);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("requires explicit phone selection for wrong_number when two eligible phones exist", async () => {
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

      await expect(writeCallLog({ student_id: studentId, call_result: "wrong_number" }, { database })).rejects.toThrow(
        "Hangi telefonla işlem yapılacak"
      );
      expect(await database.call_logs.count()).toBe(0);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("requires explicit phone selection for wrong_number when one eligible phone exists", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      await database.phones.add(phone(studentId));

      await expect(writeCallLog({ student_id: studentId, call_result: "wrong_number" }, { database })).rejects.toThrow(
        "Hangi telefonla işlem yapılacak"
      );
      expect(await database.call_logs.count()).toBe(0);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("rejects selected wrong or unusable phones for optional call results", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const phoneId = await database.phones.add(phone(studentId, { phone_status: "invalid", is_wrong: true }));

      await expect(
        writeCallLog(
          {
            student_id: studentId,
            contacted_phone_id: phoneId,
            call_result: "not_reached"
          },
          { database }
        )
      ).rejects.toThrow("Yanlış numara / kullanılmıyor işaretli telefon bu kayıt için seçilemez.");
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
        phone_id: phoneId,
        phone_snapshot: {
          phone_id: phoneId,
          reference_label: "Telefon 1",
          relation_label: "Telefon",
          phone_number: "05321234567",
          source_column: null
        },
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

  it.each([
    "not_interested",
    "do_not_call",
    "registered",
    "reached",
    "not_reached",
    "wrong_number",
    "appointment",
    "not_called"
  ] as const)("ignores stale reminder date for %s", async (callResult) => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const phoneId = await database.phones.add(phone(studentId));

      const result = await writeCallLog(
        {
          student_id: studentId,
          contacted_phone_id: callResult === "wrong_number" || callResult === "reached" ? phoneId : null,
          call_result: callResult,
          reminder_at: "2026-05-16T11:00:00.000Z"
        },
        { database }
      );
      const callLog = await database.call_logs.get(result.call_log_id);

      expect(result.created_reminder_id).toBeNull();
      expect(result.updated_existing_reminder).toBe(false);
      expect(await database.reminders.count()).toBe(0);
      expect(callLog).toMatchObject({
        call_result: callResult,
        reminder_at: null,
        next_action: null,
        created_reminder_id: null
      });
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("does not update an existing pending reminder from a non-reminder result with stale reminder date", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const reminderId = await database.reminders.add(reminder(studentId));

      const result = await writeCallLog(
        {
          student_id: studentId,
          call_result: "not_interested",
          reminder_at: "2026-05-16T11:00:00.000Z"
        },
        { database }
      );
      const callLog = await database.call_logs.get(result.call_log_id);
      const existingReminder = await database.reminders.get(reminderId);

      expect(result.created_reminder_id).toBeNull();
      expect(result.updated_existing_reminder).toBe(false);
      expect(await database.reminders.count()).toBe(1);
      expect(existingReminder).toMatchObject({
        reminder_at: "2026-05-12T11:00:00.000Z",
        status: "pending"
      });
      expect(existingReminder?.call_log_id).toBeUndefined();
      expect(callLog).toMatchObject({
        call_result: "not_interested",
        reminder_at: null,
        next_action: null,
        created_reminder_id: null
      });
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("updates existing pending reminder phone context from the contacted phone", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const oldSnapshot = {
        phone_id: 999,
        reference_label: "Telefon 9",
        relation_label: "Diğer" as const,
        phone_number: "05000000000",
        source_column: "Eski Telefon"
      };
      const reminderId = await database.reminders.add(
        reminder(studentId, {
          phone_id: 999,
          phone_snapshot: oldSnapshot
        })
      );
      const phoneId = await database.phones.add(
        phone(studentId, {
          phone_number: "05327654321",
          normalized_phone_number: "05327654321",
          phone_label: "Veli Telefon",
          reference_label: "Telefon 2",
          relation_label: "Veli",
          source_column: "Veli Telefon"
        })
      );

      const result = await writeCallLog(
        {
          student_id: studentId,
          contacted_phone_id: phoneId,
          call_result: "call_later",
          reminder_at: "2026-05-16T11:00:00.000Z"
        },
        { database }
      );
      const reminderRecord = await database.reminders.get(reminderId);

      expect(result.created_reminder_id).toBe(reminderId);
      expect(result.updated_existing_reminder).toBe(true);
      expect(await database.reminders.count()).toBe(1);
      expect(reminderRecord).toMatchObject({
        phone_id: phoneId,
        phone_snapshot: {
          phone_id: phoneId,
          reference_label: "Telefon 2",
          relation_label: "Veli",
          phone_number: "05327654321",
          source_column: "Veli Telefon"
        },
        reminder_at: "2026-05-16T11:00:00.000Z"
      });
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("clears old pending reminder phone context when no contacted phone exists", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const reminderId = await database.reminders.add(
        reminder(studentId, {
          phone_id: 999,
          phone_snapshot: {
            phone_id: 999,
            reference_label: "Telefon 9",
            relation_label: "Yakın",
            phone_number: "05000000000",
            source_column: "Eski Telefon"
          }
        })
      );

      await writeCallLog(
        {
          student_id: studentId,
          call_result: "call_later",
          reminder_at: "2026-05-16T11:00:00.000Z"
        },
        { database }
      );
      const reminderRecord = await database.reminders.get(reminderId);

      expect(reminderRecord?.phone_id).toBeNull();
      expect(reminderRecord?.phone_snapshot).toBeNull();
      expect(reminderRecord?.reminder_at).toBe("2026-05-16T11:00:00.000Z");
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
