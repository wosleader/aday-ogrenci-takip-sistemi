import { describe, expect, it, vi } from "vitest";
import { AppDatabase } from "../../src/db/db";
import type { GuardianRecord } from "../../src/domain/models/guardian";
import type { PhoneRecord } from "../../src/domain/models/phone";
import type { StudentRecord } from "../../src/domain/models/student";
import {
  StudentSearchReindexError,
  reindexActiveStudentSearchText
} from "../../src/features/students/services/studentSearchReindex";
import { createStudentSearchText } from "../../src/features/students/services/studentSearchText";
import { normalizeText } from "../../src/utils/normalizeText";

const timestamp = "2026-08-25T09:00:00.000Z";

async function createDatabase() {
  const database = new AppDatabase(`test-student-search-reindex-${crypto.randomUUID()}`);
  await database.open();
  return database;
}

function student(overrides: Partial<StudentRecord> = {}): StudentRecord {
  const fullName = overrides.student_full_name ?? "Ayşe Yılmaz";

  return {
    uuid: crypto.randomUUID(),
    student_full_name: fullName,
    normalized_student_name: normalizeText(fullName),
    search_text: "ayse yilmaz yaz kampi sicak eski aday notu",
    current_class: "8",
    student_group: "8. Sınıf LGS Hazırlık",
    neighborhood: "Fenerbahçe",
    district: "Kadıköy",
    category: "LGS",
    campaign_id: 11,
    lifecycle_status: "candidate",
    last_call_result: "not_called",
    source_file_name: "legacy.xlsx",
    source_sheet_name: "Adaylar",
    source_row_number: 12,
    general_note: "Korunacak aday notu",
    sync_status: "local",
    created_at: timestamp,
    updated_at: timestamp,
    deleted_at: null,
    ...overrides
  };
}

function guardian(studentId: number, overrides: Partial<GuardianRecord> = {}): GuardianRecord {
  const fullName = overrides.guardian_full_name ?? "Veli Yılmaz";

  return {
    uuid: crypto.randomUUID(),
    student_id: studentId,
    guardian_full_name: fullName,
    normalized_guardian_name: normalizeText(fullName),
    relation_type: "guardian",
    note: null,
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
    normalized_phone_number: phoneNumber.replace(/\D/g, ""),
    original_phone_value: phoneNumber,
    phone_label: "Telefon 1",
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

describe("reindexActiveStudentSearchText", () => {
  it("converges active legacy records to canonical search text without changing profile or provenance data", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      await database.guardians.bulkAdd([
        guardian(studentId, { guardian_full_name: "İkinci Veli", created_at: "2026-08-25T09:01:00.000Z" }),
        guardian(studentId, { guardian_full_name: "Eski Veli", deleted_at: "2026-08-25T09:02:00.000Z" })
      ]);
      await database.phones.bulkAdd([
        phone(studentId, { phone_number: "05329998877", priority: 2 }),
        phone(studentId, { phone_number: "05321112233", priority: 1 }),
        phone(studentId, { phone_number: "05320000000", deleted_at: "2026-08-25T09:02:00.000Z" })
      ]);
      const before = await database.students.get(studentId);

      const result = await reindexActiveStudentSearchText(database);
      const after = await database.students.get(studentId);

      expect(result).toEqual({ scanned_students: 1, updated_students: 1 });
      expect(after?.search_text).toBe(
        createStudentSearchText({
          student_full_name: "Ayşe Yılmaz",
          guardian_names: ["İkinci Veli"],
          phone_values: ["05321112233", "05329998877"],
          current_class: "8",
          student_group: "8. Sınıf LGS Hazırlık",
          district: "Kadıköy",
          neighborhood: "Fenerbahçe"
        })
      );
      expect(after?.search_text).not.toContain("yaz kampi");
      expect(after?.search_text).not.toContain("sicak");
      expect(after).toMatchObject({
        uuid: before?.uuid,
        category: "LGS",
        campaign_id: 11,
        source_file_name: "legacy.xlsx",
        source_sheet_name: "Adaylar",
        source_row_number: 12,
        general_note: "Korunacak aday notu",
        updated_at: timestamp
      });
      expect(await database.guardians.count()).toBe(2);
      expect(await database.phones.count()).toBe(3);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("is idempotent and skips deleted students", async () => {
    const database = await createDatabase();

    try {
      const activeId = await database.students.add(student());
      const deletedId = await database.students.add(student({
        student_full_name: "Silinmiş Aday",
        search_text: "legacy silinmis token",
        deleted_at: "2026-08-25T10:00:00.000Z"
      }));

      const first = await reindexActiveStudentSearchText(database);
      const activeAfterFirst = await database.students.get(activeId);
      const second = await reindexActiveStudentSearchText(database);
      const activeAfterSecond = await database.students.get(activeId);
      const deleted = await database.students.get(deletedId);

      expect(first).toEqual({ scanned_students: 1, updated_students: 1 });
      expect(second).toEqual({ scanned_students: 1, updated_students: 0 });
      expect(activeAfterSecond).toEqual(activeAfterFirst);
      expect(deleted?.search_text).toBe("legacy silinmis token");
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("fails without reporting success when persistence fails", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const before = await database.students.get(studentId);
      const update = vi.spyOn(database.students, "update").mockRejectedValueOnce(new Error("write failed"));

      await expect(reindexActiveStudentSearchText(database)).rejects.toBeInstanceOf(StudentSearchReindexError);
      expect(await database.students.get(studentId)).toEqual(before);

      update.mockRestore();
    } finally {
      database.close();
      await database.delete();
    }
  });
});
