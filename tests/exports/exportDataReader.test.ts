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

  it("reads Veli, Anne and Baba guardians by relation instead of creation order", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student("Ayşe Yılmaz"));
      await database.guardians.bulkAdd([
        {
          uuid: crypto.randomUUID(),
          student_id: studentId,
          guardian_full_name: "Fatma Yılmaz",
          normalized_guardian_name: "fatma yilmaz",
          relation_type: "mother",
          sync_status: "local",
          created_at: "2026-05-08T09:00:00",
          updated_at: timestamp,
          deleted_at: null
        },
        {
          uuid: crypto.randomUUID(),
          student_id: studentId,
          guardian_full_name: "Mehmet Yılmaz",
          normalized_guardian_name: "mehmet yilmaz",
          relation_type: "father",
          sync_status: "local",
          created_at: "2026-05-08T09:01:00",
          updated_at: timestamp,
          deleted_at: null
        },
        {
          uuid: crypto.randomUUID(),
          student_id: studentId,
          guardian_full_name: "Zeynep Yılmaz",
          normalized_guardian_name: "zeynep yilmaz",
          relation_type: "guardian",
          sync_status: "local",
          created_at: "2026-05-08T09:02:00",
          updated_at: timestamp,
          deleted_at: null
        }
      ]);

      const bundle = (await readDetailedExportData({ database })).bundles[0];

      expect(bundle.guardian?.guardian_full_name).toBe("Zeynep Yılmaz");
      expect(bundle.mother?.guardian_full_name).toBe("Fatma Yılmaz");
      expect(bundle.father?.guardian_full_name).toBe("Mehmet Yılmaz");
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("treats a legacy null relation guardian as Veli", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student("Ayşe Yılmaz"));
      await database.guardians.bulkAdd([
        {
          uuid: crypto.randomUUID(),
          student_id: studentId,
          guardian_full_name: "Fatma Yılmaz",
          normalized_guardian_name: "fatma yilmaz",
          relation_type: "mother",
          sync_status: "local",
          created_at: timestamp,
          updated_at: timestamp,
          deleted_at: null
        },
        {
          uuid: crypto.randomUUID(),
          student_id: studentId,
          guardian_full_name: "Legacy Veli",
          normalized_guardian_name: "legacy veli",
          relation_type: null,
          sync_status: "local",
          created_at: "2026-05-08T09:01:00",
          updated_at: timestamp,
          deleted_at: null
        }
      ]);

      const bundle = (await readDetailedExportData({ database })).bundles[0];

      expect(bundle.guardian?.guardian_full_name).toBe("Legacy Veli");
      expect(bundle.mother?.guardian_full_name).toBe("Fatma Yılmaz");
      expect(bundle.father).toBeNull();
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

  it("keeps legacy phone slots while carrying all active phones in export order", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student("Ayşe Yılmaz"));
      await database.phones.bulkAdd([
        phone(studentId, {
          phone_number: "05550000003",
          normalized_phone_number: "05550000003",
          phone_label: "Telefon 3",
          reference_label: "Telefon 3",
          priority: 3,
          is_primary: false,
          created_at: "2026-05-08T09:03:00"
        }),
        phone(studentId, {
          phone_number: "05320000001",
          normalized_phone_number: "05320000001",
          phone_label: "Telefon 1",
          reference_label: "Telefon 1",
          priority: 1,
          is_primary: true,
          created_at: "2026-05-08T09:01:00"
        }),
        phone(studentId, {
          phone_number: "05430000002",
          normalized_phone_number: "05430000002",
          phone_label: "2. Telefon",
          reference_label: "Telefon 2",
          priority: 2,
          is_primary: false,
          created_at: "2026-05-08T09:02:00"
        }),
        phone(studentId, {
          phone_number: "05550000004",
          normalized_phone_number: "05550000004",
          phone_label: "Telefon 4",
          reference_label: "Telefon 4",
          priority: 4,
          is_primary: false,
          deleted_at: "2026-05-09T09:00:00"
        })
      ]);

      const data = await readDetailedExportData({ database });
      const bundle = data.bundles[0];

      expect(bundle.phone_1?.phone_number).toBe("05320000001");
      expect(bundle.phone_2?.phone_number).toBe("05430000002");
      expect(bundle.phones?.map((exportPhone) => exportPhone.phone_number)).toEqual([
        "05320000001",
        "05430000002",
        "05550000003"
      ]);
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
