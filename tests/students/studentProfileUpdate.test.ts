import { describe, expect, it, vi } from "vitest";
import { AppDatabase } from "../../src/db/db";
import type { GuardianRecord } from "../../src/domain/models/guardian";
import type { PhoneRecord } from "../../src/domain/models/phone";
import type { StudentRecord } from "../../src/domain/models/student";
import { type UpdateStudentProfileInput, updateStudentProfile } from "../../src/features/students/services/studentProfileUpdate";
import { createStudentSearchText } from "../../src/features/students/services/studentSearchText";
import { normalizeText } from "../../src/utils/normalizeText";

const timestamp = "2026-08-25T09:00:00.000Z";

async function createDatabase() {
  const database = new AppDatabase(`test-student-profile-update-${crypto.randomUUID()}`);
  await database.open();
  return database;
}

function student(overrides: Partial<StudentRecord> = {}): StudentRecord {
  const fullName = overrides.student_full_name ?? "Ayşe Yılmaz";

  return {
    uuid: crypto.randomUUID(),
    student_full_name: fullName,
    normalized_student_name: normalizeText(fullName),
    search_text: "legacy search text",
    current_class: "8",
    student_group: "8. Sınıf LGS Hazırlık",
    neighborhood: "Fenerbahçe",
    district: "Kadıköy",
    category: "LGS",
    campaign_id: 13,
    lifecycle_status: "candidate",
    last_call_result: "not_called",
    last_contacted_at: "2026-08-24T12:00:00.000Z",
    last_contacted_phone_id: 4,
    source_file_name: "source.xlsx",
    source_sheet_name: "Adaylar",
    source_row_number: 14,
    general_note: "Korunacak genel not",
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
    note: "Korunacak veli notu",
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
    reference_label: "Telefon 1",
    relation_label: "Veli",
    priority: 1,
    phone_status: "active",
    is_valid: true,
    is_wrong: false,
    is_primary: true,
    note: "Korunacak telefon notu",
    sync_status: "local",
    created_at: timestamp,
    updated_at: timestamp,
    deleted_at: null,
    ...overrides
  };
}

async function seedStudent(database: AppDatabase, overrides: Partial<StudentRecord> = {}) {
  const studentId = await database.students.add(student(overrides));
  await database.guardians.add(guardian(studentId));
  await database.phones.add(phone(studentId));
  const stored = await database.students.get(studentId);

  if (!stored) {
    throw new Error("Test adayı oluşturulamadı.");
  }

  return { studentId, stored };
}

function input(
  studentId: number,
  stored: StudentRecord,
  overrides: Partial<UpdateStudentProfileInput> = {}
): UpdateStudentProfileInput {
  return {
    student_id: studentId,
    student_uuid: stored.uuid,
    expected_updated_at: stored.updated_at,
    student_full_name: stored.student_full_name,
    current_class: stored.current_class ?? null,
    student_group: stored.student_group,
    neighborhood: stored.neighborhood ?? null,
    district: stored.district ?? null,
    change_reason: "Kaynak kayıt ile doğrulandı.",
    performed_by: "agent",
    ...overrides
  };
}

async function expectNoMutation(
  database: AppDatabase,
  studentId: number,
  action: () => Promise<unknown>,
  code: string
) {
  const before = await database.students.get(studentId);
  const auditCount = await database.audit_logs.count();

  await expect(action()).rejects.toMatchObject({ code });
  expect(await database.students.get(studentId)).toEqual(before);
  expect(await database.audit_logs.count()).toBe(auditCount);
}

describe("updateStudentProfile", () => {
  it.each([
    ["student_full_name", { student_full_name: "  Elif Demir  " }, "Elif Demir"],
    ["current_class", { current_class: " 9 " }, "9"],
    ["student_group", { student_group: " 9. Sınıf LGS Hazırlık " }, "9. Sınıf LGS Hazırlık"],
    ["neighborhood", { neighborhood: "  Göztepe " }, "Göztepe"],
    ["district", { district: "  Üsküdar " }, "Üsküdar"]
  ] as const)("updates only the requested %s field", async (field, overrides, expectedValue) => {
    const database = await createDatabase();

    try {
      const { studentId, stored } = await seedStudent(database);
      const result = await updateStudentProfile(input(studentId, stored, overrides), database);
      const updated = await database.students.get(studentId);

      expect(result.changed_fields).toEqual([field]);
      expect(updated?.[field]).toBe(expectedValue);
      expect((updated?.updated_at ?? "") > stored.updated_at).toBe(true);
      expect(updated).toMatchObject({
        uuid: stored.uuid,
        category: "LGS",
        campaign_id: 13,
        source_file_name: "source.xlsx",
        source_sheet_name: "Adaylar",
        source_row_number: 14,
        general_note: "Korunacak genel not",
        lifecycle_status: "candidate",
        last_call_result: "not_called",
        last_contacted_at: "2026-08-24T12:00:00.000Z",
        last_contacted_phone_id: 4,
        created_at: timestamp,
        deleted_at: null,
        sync_status: "local"
      });
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("normalizes all editable values, rebuilds derived values, and records changed fields only", async () => {
    const database = await createDatabase();

    try {
      const { studentId, stored } = await seedStudent(database);
      const result = await updateStudentProfile(
        input(studentId, stored, {
          student_full_name: "  Elif Demir  ",
          current_class: "   ",
          student_group: "   ",
          neighborhood: "  Göztepe  ",
          district: "  Üsküdar  ",
          change_reason: "  Kaynak kayıt ile doğrulandı.  ",
          performed_by: "  user-1  "
        }),
        database
      );
      const updated = await database.students.get(studentId);
      const guardians = await database.guardians.toArray();
      const phones = await database.phones.toArray();
      const [audit] = await database.audit_logs.toArray();

      expect(result.changed_fields).toEqual([
        "student_full_name",
        "current_class",
        "student_group",
        "neighborhood",
        "district"
      ]);
      expect(updated).toMatchObject({
        student_full_name: "Elif Demir",
        normalized_student_name: "elif demir",
        current_class: null,
        student_group: "",
        neighborhood: "Göztepe",
        district: "Üsküdar"
      });
      expect(updated?.search_text).toBe(
        createStudentSearchText({
          student_full_name: "Elif Demir",
          guardian_names: ["Veli Yılmaz"],
          phone_values: ["05321234567"],
          current_class: null,
          student_group: "",
          neighborhood: "Göztepe",
          district: "Üsküdar"
        })
      );
      expect(updated?.search_text).toContain("veli yilmaz");
      expect(updated?.search_text).toContain("05321234567");
      expect(guardians).toHaveLength(1);
      expect(phones).toHaveLength(1);
      expect(audit).toMatchObject({
        entity_type: "student",
        entity_id: studentId,
        action_type: "update",
        field_name: "student_profile_edit",
        note: "Kaynak kayıt ile doğrulandı.",
        performed_by: "user-1",
        created_at: updated?.updated_at
      });
      expect(JSON.parse(audit.old_value ?? "{}")).toEqual({
        student_full_name: "Ayşe Yılmaz",
        current_class: "8",
        student_group: "8. Sınıf LGS Hazırlık",
        neighborhood: "Fenerbahçe",
        district: "Kadıköy"
      });
      expect(JSON.parse(audit.new_value ?? "{}")).toEqual({
        student_full_name: "Elif Demir",
        current_class: null,
        student_group: "",
        neighborhood: "Göztepe",
        district: "Üsküdar"
      });
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("rejects invalid, unchanged, stale, deleted, missing, and mismatched records without mutating them", async () => {
    const database = await createDatabase();

    try {
      const { studentId, stored } = await seedStudent(database);

      await expectNoMutation(database, studentId, () => updateStudentProfile(input(studentId, stored, { student_full_name: "  " }), database), "invalid_student_full_name");
      await expectNoMutation(database, studentId, () => updateStudentProfile(input(studentId, stored, { change_reason: "  " }), database), "missing_reason");
      await expectNoMutation(database, studentId, () => updateStudentProfile(input(studentId, stored), database), "no_change");
      await expectNoMutation(database, studentId, () => updateStudentProfile(input(studentId, stored, { student_uuid: crypto.randomUUID(), current_class: "9" }), database), "student_uuid_mismatch");

      await database.students.update(studentId, { updated_at: "2026-08-25T10:00:00.000Z" });
      await expectNoMutation(database, studentId, () => updateStudentProfile(input(studentId, stored, { current_class: "9" }), database), "student_stale");

      const deleted = await seedStudent(database, { deleted_at: "2026-08-25T10:00:00.000Z" });
      await expectNoMutation(database, deleted.studentId, () => updateStudentProfile(input(deleted.studentId, deleted.stored, { current_class: "9" }), database), "student_deleted");

      await expect(updateStudentProfile(input(999, stored, { current_class: "9" }), database)).rejects.toMatchObject({
        code: "student_missing"
      });
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("rolls back the profile mutation when student persistence or audit writing fails", async () => {
    const database = await createDatabase();

    try {
      const first = await seedStudent(database);
      const beforeWriteFailure = await database.students.get(first.studentId);
      const studentUpdate = vi.spyOn(database.students, "update").mockRejectedValueOnce(new Error("write failed"));

      await expect(updateStudentProfile(input(first.studentId, first.stored, { current_class: "9" }), database)).rejects.toMatchObject({
        code: "student_write_failed"
      });
      expect(await database.students.get(first.studentId)).toEqual(beforeWriteFailure);
      expect(await database.audit_logs.count()).toBe(0);
      studentUpdate.mockRestore();

      const second = await seedStudent(database, { student_full_name: "Buse Yılmaz" });
      const beforeAuditFailure = await database.students.get(second.studentId);
      const auditAdd = vi.spyOn(database.audit_logs, "add").mockRejectedValueOnce(new Error("audit failed"));

      await expect(updateStudentProfile(input(second.studentId, second.stored, { current_class: "9" }), database)).rejects.toMatchObject({
        code: "audit_failed"
      });
      expect(await database.students.get(second.studentId)).toEqual(beforeAuditFailure);
      expect(await database.audit_logs.count()).toBe(0);
      auditAdd.mockRestore();
    } finally {
      database.close();
      await database.delete();
    }
  });
});
