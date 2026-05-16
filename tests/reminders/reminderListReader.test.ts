import { describe, expect, it, beforeEach } from "vitest";
import { AppDatabase } from "../../src/db/db";
import type { CallLogRecord } from "../../src/domain/models/callLog";
import type { GuardianRecord } from "../../src/domain/models/guardian";
import type { PhoneRecord } from "../../src/domain/models/phone";
import type { ReminderRecord } from "../../src/domain/models/reminder";
import type { StudentRecord } from "../../src/domain/models/student";
import { persistDismissedReminderAlert } from "../../src/features/reminders/services/reminderDismissalStore";
import {
  createReminderTaskSummary,
  filterReminderTaskRows,
  readReminderTaskRows
} from "../../src/features/reminders/services/reminderListReader";
import { createSearchText, normalizeText } from "../../src/utils/normalizeText";

const timestamp = "2026-05-08T09:00:00.000Z";
const now = "2026-05-10T12:00:00.000Z";

async function createDatabase() {
  const database = new AppDatabase(`test-reminder-list-${crypto.randomUUID()}`);
  await database.open();
  return database;
}

function student(name = "Ayse Yilmaz", overrides: Partial<StudentRecord> = {}): StudentRecord {
  return {
    uuid: crypto.randomUUID(),
    student_full_name: name,
    normalized_student_name: normalizeText(name),
    search_text: createSearchText([name]),
    current_class: "11",
    student_group: "11. Sınıf YKS",
    category: "YKS",
    campaign_id: null,
    lifecycle_status: "candidate",
    last_call_result: "not_called",
    sync_status: "local",
    created_at: timestamp,
    updated_at: timestamp,
    deleted_at: null,
    ...overrides
  };
}

function guardian(studentId: number, overrides: Partial<GuardianRecord> = {}): GuardianRecord {
  return {
    uuid: crypto.randomUUID(),
    student_id: studentId,
    guardian_full_name: "Fatma Yilmaz",
    normalized_guardian_name: "fatma yilmaz",
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
    normalized_phone_number: phoneNumber,
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

function reminder(studentId: number, reminderAt: string, overrides: Partial<ReminderRecord> = {}): ReminderRecord {
  return {
    uuid: crypto.randomUUID(),
    student_id: studentId,
    reminder_type: "call",
    reminder_at: reminderAt,
    status: "pending",
    note: "Tekrar aranacak",
    is_default_time_assigned: false,
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
    call_time: "2026-05-09T10:00:00.000Z",
    call_result: "call_later",
    note: "Veli bilgi istedi",
    sync_status: "local",
    created_at: "2026-05-09T10:00:00.000Z",
    updated_at: "2026-05-09T10:00:00.000Z",
    deleted_at: null,
    ...overrides
  };
}

async function seedStudent(database: AppDatabase, name = "Ayse Yilmaz") {
  const studentId = await database.students.add(student(name));
  await database.guardians.add(guardian(studentId));
  await database.phones.bulkAdd([
    phone(studentId, { phone_number: "05321234567", phone_label: "Telefon 1" }),
    phone(studentId, { phone_number: "05327654321", phone_label: "Telefon 2" })
  ]);

  return studentId;
}

describe("reminderListReader", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("lists pending call reminders by overdue, today and upcoming buckets", async () => {
    const database = await createDatabase();

    try {
      const overdueStudentId = await seedStudent(database, "Geciken Aday");
      const todayStudentId = await seedStudent(database, "Bugunku Aday");
      const upcomingStudentId = await seedStudent(database, "Yaklasan Aday");
      await database.reminders.bulkAdd([
        reminder(upcomingStudentId, "2026-05-11T09:00:00.000Z"),
        reminder(todayStudentId, "2026-05-10T13:00:00.000Z"),
        reminder(overdueStudentId, "2026-05-09T10:00:00.000Z")
      ]);

      const rows = await readReminderTaskRows(now, database);

      expect(rows.map((row) => row.bucket)).toEqual(["overdue", "today", "upcoming"]);
      expect(rows.map((row) => row.student_full_name)).toEqual(["Geciken Aday", "Bugunku Aday", "Yaklasan Aday"]);
      expect(rows[0]).toMatchObject({
        bucket_label: "Süresi geçti",
        phone_1: "05321234567",
        phone_2: "05327654321",
        guardian_full_name: "Fatma Yilmaz"
      });
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("excludes completed, deleted, non-call and deleted-student reminders", async () => {
    const database = await createDatabase();

    try {
      const activeStudentId = await seedStudent(database, "Aktif Aday");
      const deletedStudentId = await database.students.add(student("Silinmis Aday", { deleted_at: now }));
      await database.reminders.bulkAdd([
        reminder(activeStudentId, "2026-05-10T13:00:00.000Z"),
        reminder(activeStudentId, "2026-05-10T13:30:00.000Z", { status: "completed" }),
        reminder(activeStudentId, "2026-05-10T14:00:00.000Z", { deleted_at: now }),
        reminder(activeStudentId, "2026-05-10T14:30:00.000Z", { reminder_type: "follow_up" }),
        reminder(deletedStudentId, "2026-05-10T15:00:00.000Z")
      ]);

      const rows = await readReminderTaskRows(now, database);

      expect(rows).toHaveLength(1);
      expect(rows[0].student_id).toBe(activeStudentId);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("creates summaries and filters rows", async () => {
    const database = await createDatabase();

    try {
      const firstStudentId = await seedStudent(database, "Birinci Aday");
      const secondStudentId = await seedStudent(database, "Ikinci Aday");
      const thirdStudentId = await seedStudent(database, "Ucuncu Aday");
      await database.reminders.bulkAdd([
        reminder(firstStudentId, "2026-05-10T11:00:00.000Z"),
        reminder(secondStudentId, "2026-05-10T13:00:00.000Z"),
        reminder(thirdStudentId, "2026-05-11T09:00:00.000Z")
      ]);

      const rows = await readReminderTaskRows(now, database);
      const summary = createReminderTaskSummary(rows);

      expect(summary).toEqual({ overdue: 1, today: 1, upcoming: 1, all: 3 });
      expect(filterReminderTaskRows(rows, "all")).toHaveLength(3);
      expect(filterReminderTaskRows(rows, "overdue")).toHaveLength(1);
      expect(filterReminderTaskRows(rows, "today")).toHaveLength(1);
      expect(filterReminderTaskRows(rows, "upcoming")).toHaveLength(1);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("sorts within each bucket by reminder time", async () => {
    const database = await createDatabase();

    try {
      const lateStudentId = await seedStudent(database, "Gec Saat");
      const earlyStudentId = await seedStudent(database, "Erken Saat");
      await database.reminders.bulkAdd([
        reminder(lateStudentId, "2026-05-10T15:00:00.000Z"),
        reminder(earlyStudentId, "2026-05-10T13:00:00.000Z")
      ]);

      const rows = await readReminderTaskRows(now, database);

      expect(rows.map((row) => row.student_full_name)).toEqual(["Erken Saat", "Gec Saat"]);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("uses the latest call result and short note when available", async () => {
    const database = await createDatabase();

    try {
      const studentId = await seedStudent(database, "Notlu Aday");
      await database.call_logs.bulkAdd([
        callLog(studentId, {
          call_time: "2026-05-08T10:00:00.000Z",
          call_result: "not_reached",
          note: "Eski not"
        }),
        callLog(studentId, {
          call_time: "2026-05-09T10:00:00.000Z",
          call_result: "call_later",
          note: "Yeni görüşme notu"
        })
      ]);
      await database.reminders.add(reminder(studentId, "2026-05-10T13:00:00.000Z", { note: null }));

      const rows = await readReminderTaskRows(now, database);

      expect(rows[0].last_call_result).toBe("call_later");
      expect(rows[0].last_call_result_label).toBe("Sonra Aranacak");
      expect(rows[0].note_preview).toBe("Yeni görüşme notu");
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("does not let dismissed popup history hide pending reminder tasks", async () => {
    const database = await createDatabase();

    try {
      const studentId = await seedStudent(database, "Dismissed Aday");
      const reminderId = await database.reminders.add(reminder(studentId, "2026-05-10T13:00:00.000Z"));

      persistDismissedReminderAlert([], {
        reminder_id: reminderId,
        student_id: studentId,
        student_full_name: "Dismissed Aday",
        reminder_at: "2026-05-10T13:00:00.000Z"
      });

      const rows = await readReminderTaskRows(now, database);

      expect(rows).toHaveLength(1);
      expect(rows[0].reminder_id).toBe(reminderId);
    } finally {
      database.close();
      await database.delete();
    }
  });
});
