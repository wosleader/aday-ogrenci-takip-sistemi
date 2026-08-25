import type { AppDatabase } from "../../../db/db";
import { db } from "../../../db/db";
import type { StudentRecord } from "../../../domain/models/student";
import { normalizeText } from "../../../utils/normalizeText";
import { createStudentSearchTextFromRelations } from "./studentSearchText";
import { createNextStudentUpdatedAt } from "./studentUpdatedAt";

export type StudentProfileEditableField =
  | "student_full_name"
  | "current_class"
  | "student_group"
  | "neighborhood"
  | "district";

export type UpdateStudentProfileInput = {
  student_id: number;
  student_uuid: string;
  expected_updated_at: string;
  student_full_name: string;
  current_class?: string | null;
  student_group?: string | null;
  neighborhood?: string | null;
  district?: string | null;
  change_reason: string;
  performed_by?: string | null;
};

export type StudentProfileUpdateErrorCode =
  | "invalid_student_full_name"
  | "missing_reason"
  | "student_missing"
  | "student_deleted"
  | "student_uuid_mismatch"
  | "student_stale"
  | "no_change"
  | "student_write_failed"
  | "audit_failed";

export class StudentProfileUpdateError extends Error {
  constructor(
    public readonly code: StudentProfileUpdateErrorCode,
    message: string
  ) {
    super(message);
    this.name = "StudentProfileUpdateError";
  }
}

export type StudentProfileUpdateResult = {
  student_id: number;
  changed_fields: StudentProfileEditableField[];
  updated_at: string;
};

type ValidatedProfileValues = {
  student_full_name: string;
  current_class: string | null;
  student_group: string;
  neighborhood: string | null;
  district: string | null;
  change_reason: string;
  performed_by: string;
};

function trimToNull(value?: string | null): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed || null;
}

function trimToEmpty(value?: string | null): string {
  return value?.trim() ?? "";
}

function validateInput(input: UpdateStudentProfileInput): ValidatedProfileValues {
  const studentFullName = input.student_full_name.trim();
  const changeReason = input.change_reason.trim();

  if (!studentFullName) {
    throw new StudentProfileUpdateError("invalid_student_full_name", "Aday adı boş olamaz.");
  }

  if (!changeReason) {
    throw new StudentProfileUpdateError("missing_reason", "Değişiklik nedeni boş olamaz.");
  }

  return {
    student_full_name: studentFullName,
    current_class: trimToNull(input.current_class),
    student_group: trimToEmpty(input.student_group),
    neighborhood: trimToNull(input.neighborhood),
    district: trimToNull(input.district),
    change_reason: changeReason,
    performed_by: input.performed_by?.trim() || "agent"
  };
}

function currentProfileValues(student: StudentRecord): Omit<ValidatedProfileValues, "change_reason" | "performed_by"> {
  return {
    student_full_name: student.student_full_name.trim(),
    current_class: trimToNull(student.current_class),
    student_group: trimToEmpty(student.student_group),
    neighborhood: trimToNull(student.neighborhood),
    district: trimToNull(student.district)
  };
}

function getChangedFields(
  current: Omit<ValidatedProfileValues, "change_reason" | "performed_by">,
  next: ValidatedProfileValues
): StudentProfileEditableField[] {
  const fields: StudentProfileEditableField[] = [];

  if (current.student_full_name !== next.student_full_name) {
    fields.push("student_full_name");
  }

  if (current.current_class !== next.current_class) {
    fields.push("current_class");
  }

  if (current.student_group !== next.student_group) {
    fields.push("student_group");
  }

  if (current.neighborhood !== next.neighborhood) {
    fields.push("neighborhood");
  }

  if (current.district !== next.district) {
    fields.push("district");
  }

  return fields;
}

function createAuditValues(
  values: Omit<ValidatedProfileValues, "change_reason" | "performed_by">,
  fields: StudentProfileEditableField[]
): Record<StudentProfileEditableField, string | null> {
  return fields.reduce<Record<StudentProfileEditableField, string | null>>(
    (result, field) => {
      result[field] = values[field];
      return result;
    },
    {} as Record<StudentProfileEditableField, string | null>
  );
}

export async function updateStudentProfile(
  input: UpdateStudentProfileInput,
  database: AppDatabase = db
): Promise<StudentProfileUpdateResult> {
  const validatedInput = validateInput(input);
  let result: StudentProfileUpdateResult | undefined;

  try {
    await database.transaction("rw", [database.students, database.guardians, database.phones, database.audit_logs], async () => {
      const student = await database.students.get(input.student_id);

      if (!student?.id) {
        throw new StudentProfileUpdateError("student_missing", "Aday bulunamadı.");
      }

      if (student.deleted_at) {
        throw new StudentProfileUpdateError("student_deleted", "Silinmiş aday düzenlenemez.");
      }

      if (!input.student_uuid || student.uuid !== input.student_uuid) {
        throw new StudentProfileUpdateError("student_uuid_mismatch", "Aday kimliği güncel değil.");
      }

      if (!input.expected_updated_at || student.updated_at !== input.expected_updated_at) {
        throw new StudentProfileUpdateError("student_stale", "Aday kaydı güncel değil. Yenileyip yeniden deneyin.");
      }

      const currentValues = currentProfileValues(student);
      const changedFields = getChangedFields(currentValues, validatedInput);

      if (changedFields.length === 0) {
        throw new StudentProfileUpdateError("no_change", "Kaydedilecek bir değişiklik yok.");
      }

      const [guardians, phones] = await Promise.all([
        database.guardians.where("student_id").equals(student.id).toArray(),
        database.phones.where("student_id").equals(student.id).toArray()
      ]);
      const finalStudent: StudentRecord = {
        ...student,
        student_full_name: validatedInput.student_full_name,
        current_class: validatedInput.current_class,
        student_group: validatedInput.student_group,
        neighborhood: validatedInput.neighborhood,
        district: validatedInput.district
      };
      const updatedAt = createNextStudentUpdatedAt(student.updated_at);
      let updatedCount: number;

      try {
        updatedCount = await database.students.update(student.id, {
          student_full_name: finalStudent.student_full_name,
          current_class: finalStudent.current_class,
          student_group: finalStudent.student_group,
          neighborhood: finalStudent.neighborhood,
          district: finalStudent.district,
          normalized_student_name: normalizeText(finalStudent.student_full_name),
          search_text: createStudentSearchTextFromRelations(finalStudent, guardians, phones),
          updated_at: updatedAt
        });
      } catch {
        throw new StudentProfileUpdateError("student_write_failed", "Aday bilgileri güncellenemedi.");
      }

      if (updatedCount !== 1) {
        throw new StudentProfileUpdateError("student_write_failed", "Aday bilgileri güncellenemedi.");
      }

      try {
        await database.audit_logs.add({
          entity_type: "student",
          entity_id: student.id,
          action_type: "update",
          field_name: "student_profile_edit",
          old_value: JSON.stringify(createAuditValues(currentValues, changedFields)),
          new_value: JSON.stringify(createAuditValues(validatedInput, changedFields)),
          note: validatedInput.change_reason,
          performed_by: validatedInput.performed_by,
          created_at: updatedAt
        });
      } catch {
        throw new StudentProfileUpdateError("audit_failed", "Aday güncelleme kaydı yazılamadı.");
      }

      result = {
        student_id: student.id,
        changed_fields: changedFields,
        updated_at: updatedAt
      };
    });
  } catch (error) {
    if (error instanceof StudentProfileUpdateError) {
      throw error;
    }

    throw new StudentProfileUpdateError("student_write_failed", "Aday bilgileri güncellenemedi.");
  }

  if (!result) {
    throw new StudentProfileUpdateError("student_write_failed", "Aday bilgileri güncellenemedi.");
  }

  return result;
}
