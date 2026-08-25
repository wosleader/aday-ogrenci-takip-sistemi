import { describe, expect, it } from "vitest";
import { AppDatabase } from "../../src/db/db";
import type { StudentRecord } from "../../src/domain/models/student";
import { readStudentProfileForEdit } from "../../src/features/students/services/studentProfileReader";
import { normalizeText } from "../../src/utils/normalizeText";

const timestamp = "2026-08-25T09:00:00.000Z";

async function createDatabase() {
  const database = new AppDatabase(`test-student-profile-reader-${crypto.randomUUID()}`);
  await database.open();
  return database;
}

function student(overrides: Partial<StudentRecord> = {}): StudentRecord {
  return {
    uuid: crypto.randomUUID(),
    student_full_name: "Ayşe Yılmaz",
    normalized_student_name: normalizeText("Ayşe Yılmaz"),
    search_text: "ayse yilmaz",
    current_class: "8",
    student_group: "8. Sınıf LGS Hazırlık",
    neighborhood: "Fenerbahçe",
    district: "Kadıköy",
    category: "LGS",
    campaign_id: 22,
    lifecycle_status: "candidate",
    last_call_result: "not_called",
    source_file_name: "kaynak.xlsx",
    source_sheet_name: "Adaylar",
    source_row_number: 7,
    general_note: "Read-only not",
    sync_status: "local",
    created_at: timestamp,
    updated_at: timestamp,
    deleted_at: null,
    ...overrides
  };
}

describe("readStudentProfileForEdit", () => {
  it("returns a fresh editable snapshot with read-only provenance context", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const stored = await database.students.get(studentId);

      await expect(readStudentProfileForEdit(studentId, database)).resolves.toEqual({
        id: studentId,
        uuid: stored?.uuid,
        student_full_name: "Ayşe Yılmaz",
        current_class: "8",
        student_group: "8. Sınıf LGS Hazırlık",
        neighborhood: "Fenerbahçe",
        district: "Kadıköy",
        source_file_name: "kaynak.xlsx",
        source_sheet_name: "Adaylar",
        source_row_number: 7,
        updated_at: timestamp
      });
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("rejects missing and deleted records", async () => {
    const database = await createDatabase();

    try {
      await expect(readStudentProfileForEdit(999, database)).rejects.toMatchObject({
        code: "student_missing"
      });

      const studentId = await database.students.add(student({ deleted_at: "2026-08-25T10:00:00.000Z" }));
      await expect(readStudentProfileForEdit(studentId, database)).rejects.toMatchObject({
        code: "student_deleted"
      });
    } finally {
      database.close();
      await database.delete();
    }
  });
});
