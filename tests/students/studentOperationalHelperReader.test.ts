import { afterEach, describe, expect, it } from "vitest";
import { AppDatabase } from "../../src/db/db";
import type { PhoneRecord } from "../../src/domain/models/phone";
import type { ReminderRecord } from "../../src/domain/models/reminder";
import type { StudentRecord } from "../../src/domain/models/student";
import {
  readStudentOperationalHelper,
  resolveStudentOperationalHelper
} from "../../src/features/students/services/studentOperationalHelperReader";
import { createSearchText, normalizeText } from "../../src/utils/normalizeText";

const createdAt = "2026-05-08T09:00:00.000Z";
const now = "2026-05-10T12:00:00.000Z";
const databases: AppDatabase[] = [];

function student(name = "Ayse Yilmaz"): StudentRecord {
  return {
    uuid: crypto.randomUUID(),
    student_full_name: name,
    normalized_student_name: normalizeText(name),
    search_text: createSearchText([name]),
    current_class: "11",
    student_group: "11. Sinif YKS",
    category: "YKS",
    campaign_id: null,
    lifecycle_status: "candidate",
    last_call_result: "not_called",
    sync_status: "local",
    created_at: createdAt,
    updated_at: createdAt,
    deleted_at: null
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
    reference_label: "Telefon 1",
    relation_label: "Telefon",
    priority: 1,
    phone_status: "active",
    is_valid: true,
    is_wrong: false,
    is_primary: true,
    call_outcome: "not_called",
    call_outcome_updated_at: null,
    sync_status: "local",
    created_at: createdAt,
    updated_at: createdAt,
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
    created_at: createdAt,
    updated_at: createdAt,
    deleted_at: null,
    ...overrides
  };
}

async function createDatabase(): Promise<AppDatabase> {
  const database = new AppDatabase(`test-student-operational-helper-${crypto.randomUUID()}`);
  await database.open();
  databases.push(database);
  return database;
}

afterEach(async () => {
  while (databases.length > 0) {
    const database = databases.pop()!;
    database.close();
    await database.delete();
  }
});

describe("studentOperationalHelperReader", () => {
  it("returns no helper when there is no pending reminder", () => {
    expect(resolveStudentOperationalHelper({ reminders: [], now })).toBeNull();
  });

  it("returns an overdue helper for a pending call reminder", () => {
    const helper = resolveStudentOperationalHelper({
      reminders: [reminder(1, "2026-05-09T10:00:00.000Z", { id: 1 })],
      now
    });

    expect(helper).toMatchObject({
      kind: "overdue_call",
      primary_label: "Gecikmiş arama",
      display_label: expect.stringContaining("Gecikmiş arama"),
      reminder: { bucket: "overdue" }
    });
  });

  it("returns a today helper for a pending call reminder", () => {
    const helper = resolveStudentOperationalHelper({
      reminders: [reminder(1, "2026-05-10T13:00:00.000Z", { id: 1 })],
      now
    });

    expect(helper).toMatchObject({
      kind: "today_call",
      primary_label: "Bugün aranacak",
      display_label: expect.stringContaining("Bugün"),
      reminder: { bucket: "today" }
    });
  });

  it("does not require a usable phone for reminder helpers", async () => {
    const database = await createDatabase();
    const studentId = await database.students.add(student("Kullanılamayan Telefon"));
    await database.phones.add(phone(studentId, { phone_status: "invalid", is_wrong: true, invalid_reason: "manual" }));

    expect(await readStudentOperationalHelper(studentId, now, database)).toBeNull();

    await database.reminders.add(reminder(studentId, "2026-05-09T10:00:00.000Z", { id: 1 }));
    expect(await readStudentOperationalHelper(studentId, now, database)).toMatchObject({ kind: "overdue_call" });

    await database.reminders.clear();
    await database.reminders.add(reminder(studentId, "2026-05-10T13:00:00.000Z", { id: 2 }));
    expect(await readStudentOperationalHelper(studentId, now, database)).toMatchObject({ kind: "today_call" });
  });

  it("prioritizes overdue over today and selects the earliest due reminder", () => {
    const helper = resolveStudentOperationalHelper({
      reminders: [
        reminder(1, "2026-05-10T15:00:00.000Z", { id: 1 }),
        reminder(1, "2026-05-09T11:00:00.000Z", { id: 2 }),
        reminder(1, "2026-05-09T09:00:00.000Z", { id: 3 })
      ],
      now
    });

    expect(helper).toMatchObject({
      kind: "overdue_call",
      reminder: { reminder_at: "2026-05-09T09:00:00.000Z" }
    });
  });

  it("selects the earliest reminder among multiple today reminders", () => {
    const helper = resolveStudentOperationalHelper({
      reminders: [
        reminder(1, "2026-05-10T15:00:00.000Z", { id: 1 }),
        reminder(1, "2026-05-10T13:00:00.000Z", { id: 2 })
      ],
      now
    });

    expect(helper).toMatchObject({
      kind: "today_call",
      reminder: { reminder_at: "2026-05-10T13:00:00.000Z" }
    });
  });

  it("ignores upcoming, completed, cancelled, deleted and non-call reminders", () => {
    const helper = resolveStudentOperationalHelper({
      reminders: [
        reminder(1, "2026-05-11T10:00:00.000Z", { id: 1 }),
        reminder(1, "2026-05-10T10:00:00.000Z", { id: 2, status: "completed" }),
        reminder(1, "2026-05-10T10:00:00.000Z", { id: 3, status: "cancelled" }),
        reminder(1, "2026-05-10T10:00:00.000Z", { id: 4, deleted_at: now }),
        reminder(1, "2026-05-10T10:00:00.000Z", { id: 5, reminder_type: "follow_up" }),
        reminder(1, "not-a-date", { id: 6 })
      ],
      now
    });

    expect(helper).toBeNull();
  });

  it("does not let phone state affect the reminder helper", async () => {
    const database = await createDatabase();
    const studentId = await database.students.add(student("Telefon Durumu"));
    const phoneId = await database.phones.add(phone(studentId));
    await database.reminders.add(reminder(studentId, "2026-05-09T10:00:00.000Z"));

    const activeHelper = await readStudentOperationalHelper(studentId, now, database);
    await database.phones.update(phoneId, { phone_status: "invalid", is_wrong: true });
    const invalidHelper = await readStudentOperationalHelper(studentId, now, database);

    expect(activeHelper).toEqual(invalidHelper);
  });

  it("preserves reminder snapshot input while resolving read-only context", () => {
    const reminders = [
      reminder(1, "2026-05-10T13:00:00.000Z", {
        id: 1,
        phone_snapshot: {
          phone_id: 7,
          reference_label: "Telefon 7",
          relation_label: "Yakın",
          phone_number: "05551234567",
          source_column: "Yakın Telefon"
        }
      })
    ];
    const before = structuredClone(reminders);

    const helper = resolveStudentOperationalHelper({ reminders, now });

    expect(helper?.reminder).toMatchObject({
      phone_context_label: "Telefon 7 · Yakın",
      phone_context_number: "05551234567"
    });
    expect(reminders).toEqual(before);
  });

  it("reads only the selected active student and ignores a deleted student", async () => {
    const database = await createDatabase();
    const activeStudentId = await database.students.add(student("Aktif Aday"));
    const deletedStudentId = await database.students.add({ ...student("Silinmis Aday"), deleted_at: now });
    await database.reminders.add(reminder(activeStudentId, "2026-05-10T13:00:00.000Z"));

    expect(await readStudentOperationalHelper(activeStudentId, now, database)).toMatchObject({
      kind: "today_call",
      primary_label: "Bugün aranacak"
    });
    expect(await readStudentOperationalHelper(deletedStudentId, now, database)).toBeNull();
  });
});
