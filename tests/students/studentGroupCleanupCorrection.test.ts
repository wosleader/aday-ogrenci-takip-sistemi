import { describe, expect, it, vi } from "vitest";
import { AppDatabase } from "../../src/db/db";
import type { GuardianRecord } from "../../src/domain/models/guardian";
import type { PhoneRecord } from "../../src/domain/models/phone";
import type { StudentRecord } from "../../src/domain/models/student";
import {
  correctStudentGroupCleanupCandidate,
  type CorrectStudentGroupCleanupCandidateInput
} from "../../src/features/students/services/studentGroupCleanupCorrection";
import { HARDCODED_STUDENT_GROUP_FALLBACK } from "../../src/features/students/services/studentCleanupCandidates";
import { filterStudentListRows, readStudentListRows } from "../../src/features/students/services/studentListReader";
import { createSearchText, normalizeText } from "../../src/utils/normalizeText";

const timestamp = "2026-06-01T10:00:00.000Z";

async function createDatabase() {
  const database = new AppDatabase(`test-student-group-cleanup-correction-${crypto.randomUUID()}`);
  await database.open();
  return database;
}

function student(overrides: Partial<StudentRecord> = {}): StudentRecord {
  const fullName = overrides.student_full_name ?? "Ayşe Yılmaz";

  return {
    uuid: crypto.randomUUID(),
    student_full_name: fullName,
    normalized_student_name: normalizeText(fullName),
    search_text: createSearchText([
      fullName,
      "Fatma Yılmaz",
      "05321234567",
      "8",
      HARDCODED_STUDENT_GROUP_FALLBACK
    ]),
    current_class: "8",
    student_group: HARDCODED_STUDENT_GROUP_FALLBACK,
    category: "YKS",
    campaign_id: 12,
    lifecycle_status: "candidate",
    last_call_result: "not_called",
    source_file_name: "legacy.xlsx",
    source_sheet_name: "Adaylar",
    source_row_number: 9,
    general_note: "Korunacak not",
    sync_status: "local",
    created_at: timestamp,
    updated_at: timestamp,
    deleted_at: null,
    ...overrides
  };
}

function guardian(studentId: number, overrides: Partial<GuardianRecord> = {}): GuardianRecord {
  const fullName = overrides.guardian_full_name ?? "Fatma Yılmaz";

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

async function seedCandidate(database: AppDatabase, overrides: Partial<StudentRecord> = {}) {
  const studentId = await database.students.add(student(overrides));
  await database.guardians.add(guardian(studentId));
  await database.phones.add(phone(studentId));
  const storedStudent = await database.students.get(studentId);

  if (!storedStudent) {
    throw new Error("Test adayı oluşturulamadı.");
  }

  return { studentId, storedStudent };
}

function input(
  studentId: number,
  expectedUpdatedAt: string,
  overrides: Partial<CorrectStudentGroupCleanupCandidateInput> = {}
): CorrectStudentGroupCleanupCandidateInput {
  return {
    student_id: studentId,
    expected_updated_at: expectedUpdatedAt,
    target_mode: "verified_value",
    target_student_group: "8. Sınıf LGS Hazırlık",
    correction_reason: "Kaynak Excel ile doğrulandı.",
    performed_by: "agent",
    ...overrides
  };
}

async function expectErrorCode(promise: Promise<unknown>, code: string) {
  await expect(promise).rejects.toMatchObject({ code });
}

async function expectRejectedWithoutStudentMutation(
  database: AppDatabase,
  studentId: number,
  code: string,
  action: () => Promise<unknown>
) {
  const beforeStudent = await database.students.get(studentId);
  const beforeAuditCount = await database.audit_logs.count();

  await expectErrorCode(action(), code);

  expect(await database.students.get(studentId)).toEqual(beforeStudent);
  expect(await database.audit_logs.count()).toBe(beforeAuditCount);
}

describe("correctStudentGroupCleanupCandidate", () => {
  it("updates a verified group, refreshes search text, and appends an audit without changing category", async () => {
    const database = await createDatabase();

    try {
      const { studentId, storedStudent } = await seedCandidate(database);

      const result = await correctStudentGroupCleanupCandidate(input(studentId, storedStudent.updated_at), database);
      const updatedStudent = await database.students.get(studentId);
      const auditLogs = await database.audit_logs.toArray();
      const rows = await readStudentListRows(database);

      expect(result).toMatchObject({ student_id: studentId, student_group: "8. Sınıf LGS Hazırlık" });
      expect(result.updated_at > storedStudent.updated_at).toBe(true);
      expect(updatedStudent).toMatchObject({
        student_group: "8. Sınıf LGS Hazırlık",
        category: "YKS",
        current_class: "8",
        campaign_id: 12,
        source_file_name: "legacy.xlsx",
        source_sheet_name: "Adaylar",
        source_row_number: 9,
        general_note: "Korunacak not"
      });
      expect(updatedStudent?.search_text).not.toContain(normalizeText(HARDCODED_STUDENT_GROUP_FALLBACK));
      expect(updatedStudent?.search_text).toContain(normalizeText("8. Sınıf LGS Hazırlık"));
      expect(filterStudentListRows(rows, HARDCODED_STUDENT_GROUP_FALLBACK)).toHaveLength(0);
      expect(filterStudentListRows(rows, "8. Sınıf LGS Hazırlık")).toHaveLength(1);
      expect(auditLogs).toHaveLength(1);
      expect(auditLogs[0]).toMatchObject({
        entity_type: "student",
        entity_id: studentId,
        action_type: "update",
        field_name: "student_group_cleanup",
        note: "Kaynak Excel ile doğrulandı.",
        performed_by: "agent"
      });
      expect(JSON.parse(auditLogs[0].old_value ?? "{}")).toMatchObject({
        student_group: HARDCODED_STUDENT_GROUP_FALLBACK,
        risk_level: "high_confidence",
        source_file_name: "legacy.xlsx"
      });
      expect(JSON.parse(auditLogs[0].new_value ?? "{}")).toMatchObject({
        student_group: "8. Sınıf LGS Hazırlık",
        correction_reason: "Kaynak Excel ile doğrulandı."
      });
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("persists an explicit unspecified target as an empty group", async () => {
    const database = await createDatabase();

    try {
      const { studentId, storedStudent } = await seedCandidate(database);

      await correctStudentGroupCleanupCandidate(
        input(studentId, storedStudent.updated_at, { target_mode: "unspecified", target_student_group: undefined }),
        database
      );

      const updatedStudent = await database.students.get(studentId);
      const rows = await readStudentListRows(database);

      expect(updatedStudent?.student_group).toBe("");
      expect(updatedStudent?.search_text).not.toContain(normalizeText(HARDCODED_STUDENT_GROUP_FALLBACK));
      expect(filterStudentListRows(rows, HARDCODED_STUDENT_GROUP_FALLBACK)).toHaveLength(0);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("rejects missing, deleted, stale, and no-longer-candidate records", async () => {
    const database = await createDatabase();

    try {
      const missingStudentCount = await database.students.count();
      const missingAuditCount = await database.audit_logs.count();

      await expectErrorCode(correctStudentGroupCleanupCandidate(input(999, timestamp), database), "student_missing");

      expect(await database.students.count()).toBe(missingStudentCount);
      expect(await database.students.get(999)).toBeUndefined();
      expect(await database.audit_logs.count()).toBe(missingAuditCount);

      const deleted = await seedCandidate(database, { deleted_at: "2026-06-01T11:00:00.000Z" });
      await expectRejectedWithoutStudentMutation(database, deleted.studentId, "student_deleted", () =>
        correctStudentGroupCleanupCandidate(input(deleted.studentId, deleted.storedStudent.updated_at), database)
      );

      const stale = await seedCandidate(database);
      await database.students.update(stale.studentId, { updated_at: "2026-06-01T11:01:00.000Z" });
      await expectRejectedWithoutStudentMutation(database, stale.studentId, "student_stale", () =>
        correctStudentGroupCleanupCandidate(input(stale.studentId, stale.storedStudent.updated_at), database)
      );

      const revalidated = await seedCandidate(database);
      await database.students.update(revalidated.studentId, { current_class: "11" });
      await expectRejectedWithoutStudentMutation(database, revalidated.studentId, "not_cleanup_candidate", () =>
        correctStudentGroupCleanupCandidate(input(revalidated.studentId, revalidated.storedStudent.updated_at), database)
      );
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("rejects invalid targets, same targets, and missing correction reasons", async () => {
    const database = await createDatabase();

    try {
      const { studentId, storedStudent } = await seedCandidate(database);

      await expectRejectedWithoutStudentMutation(database, studentId, "invalid_target", () =>
        correctStudentGroupCleanupCandidate(input(studentId, storedStudent.updated_at, { target_student_group: "   " }), database)
      );
      await expectRejectedWithoutStudentMutation(database, studentId, "same_target", () =>
        correctStudentGroupCleanupCandidate(
          input(studentId, storedStudent.updated_at, { target_student_group: HARDCODED_STUDENT_GROUP_FALLBACK }),
          database
        )
      );
      await expectRejectedWithoutStudentMutation(database, studentId, "missing_reason", () =>
        correctStudentGroupCleanupCandidate(input(studentId, storedStudent.updated_at, { correction_reason: "   " }), database)
      );
      await expectRejectedWithoutStudentMutation(database, studentId, "invalid_target", () =>
        correctStudentGroupCleanupCandidate(
          input(studentId, storedStudent.updated_at, { target_mode: "unspecified", target_student_group: "8. Sınıf" }),
          database
        )
      );
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("rolls back the student update when the audit append fails", async () => {
    const database = await createDatabase();

    try {
      const { studentId, storedStudent } = await seedCandidate(database);
      const auditAdd = vi.spyOn(database.audit_logs, "add").mockRejectedValueOnce(new Error("Audit append failed"));

      await expect(correctStudentGroupCleanupCandidate(input(studentId, storedStudent.updated_at), database)).rejects.toThrow("Audit append failed");

      expect(await database.students.get(studentId)).toEqual(storedStudent);
      expect(await database.audit_logs.count()).toBe(0);
      auditAdd.mockRestore();
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("does not partially write when the student update fails", async () => {
    const database = await createDatabase();

    try {
      const { studentId, storedStudent } = await seedCandidate(database);
      const studentUpdate = vi.spyOn(database.students, "update").mockRejectedValueOnce(new Error("Student update failed"));

      await expect(correctStudentGroupCleanupCandidate(input(studentId, storedStudent.updated_at), database)).rejects.toThrow("Student update failed");

      expect(await database.students.get(studentId)).toEqual(storedStudent);
      expect(await database.audit_logs.count()).toBe(0);
      studentUpdate.mockRestore();
    } finally {
      database.close();
      await database.delete();
    }
  });
});
