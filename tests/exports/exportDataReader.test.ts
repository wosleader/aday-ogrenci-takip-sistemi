import { describe, expect, it } from "vitest";
import { AppDatabase } from "../../src/db/db";
import type { PhoneRecord } from "../../src/domain/models/phone";
import type { StudentRecord } from "../../src/domain/models/student";
import { readDetailedExportData } from "../../src/features/exports/services/exportDataReader";
import { createSearchText, normalizeText } from "../../src/utils/normalizeText";

const timestamp = "2026-05-08T09:00:00";

async function createDatabase() {
  const database = new AppDatabase(`test-export-reader-${crypto.randomUUID()}`);
  await database.open();
  return database;
}

function student(name: string, overrides: Partial<StudentRecord> = {}): StudentRecord {
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
    sync_status: "local",
    created_at: timestamp,
    updated_at: timestamp,
    deleted_at: null,
    ...overrides
  };
}

describe("exportDataReader", () => {
  it("reads combined export data for active students", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student("Ayşe Yılmaz", { general_note: "Excel notu" }));
      await database.guardians.add({
        uuid: crypto.randomUUID(),
        student_id: studentId,
        guardian_full_name: "Fatma Yılmaz",
        normalized_guardian_name: "fatma yilmaz",
        sync_status: "local",
        created_at: timestamp,
        updated_at: timestamp,
        deleted_at: null
      });
      await database.phones.add(phone(studentId));
      await database.reminders.add({
        uuid: crypto.randomUUID(),
        student_id: studentId,
        reminder_type: "call",
        reminder_at: "2026-05-12T11:00:00",
        status: "pending",
        is_default_time_assigned: false,
        sync_status: "local",
        created_at: timestamp,
        updated_at: timestamp,
        deleted_at: null
      });
      await database.call_logs.add({
        uuid: crypto.randomUUID(),
        student_id: studentId,
        call_time: "2026-05-10T11:00:00",
        call_result: "reached",
        note: "Görüşüldü",
        sync_status: "local",
        created_at: timestamp,
        updated_at: timestamp,
        deleted_at: null
      });

      const data = await readDetailedExportData({ database });

      expect(data.bundles).toHaveLength(1);
      expect(data.bundles[0]).toMatchObject({
        guardian: expect.objectContaining({ guardian_full_name: "Fatma Yılmaz" }),
        pending_reminder: expect.objectContaining({ status: "pending" })
      });
      expect(data.bundles[0].phone_1?.phone_number).toBe("05321234567");
      expect(data.bundles[0].call_logs).toHaveLength(1);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("filters export data by selected student ids", async () => {
    const database = await createDatabase();

    try {
      const firstStudentId = await database.students.add(student("Ayşe Yılmaz"));
      await database.students.add(student("Mehmet Demir"));

      const data = await readDetailedExportData({ database, studentIds: [firstStudentId] });

      expect(data.bundles).toHaveLength(1);
      expect(data.bundles[0].student.id).toBe(firstStudentId);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("marks duplicate phones only when the same number belongs to different students", async () => {
    const database = await createDatabase();

    try {
      const firstStudentId = await database.students.add(student("Ayşe Yılmaz"));
      const secondStudentId = await database.students.add(student("Mehmet Demir"));
      await database.phones.bulkAdd([
        phone(firstStudentId, { phone_number: "05320000000", normalized_phone_number: "05320000000" }),
        phone(secondStudentId, { phone_number: "05320000000", normalized_phone_number: "05320000000" })
      ]);

      const data = await readDetailedExportData({ database });

      expect(data.bundles.every((bundle) => bundle.duplicate_phone_keys.includes("05320000000"))).toBe(true);
    } finally {
      database.close();
      await database.delete();
    }
  });
});
