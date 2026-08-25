import type { AppDatabase } from "../../../db/db";
import { db } from "../../../db/db";
import type { GuardianRecord } from "../../../domain/models/guardian";
import type { PhoneRecord } from "../../../domain/models/phone";
import { assessHardcodedStudentGroupCleanupCandidate, type StudentGroupCleanupAssessment } from "./studentCleanupCandidates";
import { createStudentSearchTextFromRelations } from "./studentSearchText";
import { createNextStudentUpdatedAt } from "./studentUpdatedAt";

export type StudentGroupCleanupTargetMode = "verified_value" | "unspecified";

export type CorrectStudentGroupCleanupCandidateInput = {
  student_id: number;
  expected_updated_at: string;
  target_mode: StudentGroupCleanupTargetMode;
  target_student_group?: string | null;
  correction_reason: string;
  performed_by?: string | null;
};

export type StudentGroupCleanupCorrectionErrorCode =
  | "student_missing"
  | "student_deleted"
  | "student_stale"
  | "not_cleanup_candidate"
  | "invalid_target"
  | "same_target"
  | "missing_reason";

export class StudentGroupCleanupCorrectionError extends Error {
  constructor(
    public readonly code: StudentGroupCleanupCorrectionErrorCode,
    message: string
  ) {
    super(message);
    this.name = "StudentGroupCleanupCorrectionError";
  }
}

export type StudentGroupCleanupCorrectionResult = {
  student_id: number;
  student_group: string;
  updated_at: string;
};

type ValidatedCorrectionInput = {
  target_student_group: string;
  correction_reason: string;
  performed_by: string;
};

function validateCorrectionInput(input: CorrectStudentGroupCleanupCandidateInput, currentStudentGroup?: string): ValidatedCorrectionInput {
  const correctionReason = input.correction_reason.trim();

  if (!correctionReason) {
    throw new StudentGroupCleanupCorrectionError("missing_reason", "Düzeltme nedeni boş olamaz.");
  }

  let targetStudentGroup: string;

  if (input.target_mode === "unspecified") {
    if (input.target_student_group?.trim()) {
      throw new StudentGroupCleanupCorrectionError("invalid_target", "Belirtilmemiş hedefi ek öğrenci grubu değeri içeremez.");
    }

    targetStudentGroup = "";
  } else if (input.target_mode === "verified_value") {
    targetStudentGroup = input.target_student_group?.trim() ?? "";

    if (!targetStudentGroup) {
      throw new StudentGroupCleanupCorrectionError("invalid_target", "Doğrulanmış öğrenci grubu boş olamaz.");
    }
  } else {
    throw new StudentGroupCleanupCorrectionError("invalid_target", "Öğrenci grubu hedefi geçerli değil.");
  }

  if (currentStudentGroup != null && currentStudentGroup.trim() === targetStudentGroup) {
    throw new StudentGroupCleanupCorrectionError("same_target", "Yeni öğrenci grubu mevcut değerle aynı olamaz.");
  }

  return {
    target_student_group: targetStudentGroup,
    correction_reason: correctionReason,
    performed_by: input.performed_by?.trim() || "agent"
  };
}

function createCorrectedSearchText(
  student: Parameters<typeof assessHardcodedStudentGroupCleanupCandidate>[0],
  guardians: GuardianRecord[],
  phones: PhoneRecord[],
  studentGroup: string
): string {
  return createStudentSearchTextFromRelations({ ...student, student_group: studentGroup }, guardians, phones);
}

function createAuditValue(
  student: Parameters<typeof assessHardcodedStudentGroupCleanupCandidate>[0],
  assessment: StudentGroupCleanupAssessment,
  studentGroup: string,
  searchText: string,
  updatedAt: string,
  correctionReason?: string
) {
  return {
    student_group: studentGroup,
    search_text: searchText,
    updated_at: updatedAt,
    current_class: student.current_class ?? null,
    category: student.category,
    risk_level: assessment.risk_level,
    evidence: assessment.reason,
    source_file_name: student.source_file_name ?? null,
    source_sheet_name: student.source_sheet_name ?? null,
    source_row_number: student.source_row_number ?? null,
    correction_reason: correctionReason ?? null
  };
}

export async function correctStudentGroupCleanupCandidate(
  input: CorrectStudentGroupCleanupCandidateInput,
  database: AppDatabase = db
): Promise<StudentGroupCleanupCorrectionResult> {
  validateCorrectionInput(input);
  let result: StudentGroupCleanupCorrectionResult | undefined;

  await database.transaction("rw", [database.students, database.guardians, database.phones, database.audit_logs], async () => {
    const student = await database.students.get(input.student_id);

    if (!student?.id) {
      throw new StudentGroupCleanupCorrectionError("student_missing", "Düzeltilecek aday bulunamadı.");
    }

    if (student.deleted_at) {
      throw new StudentGroupCleanupCorrectionError("student_deleted", "Silinmiş aday düzeltilemez.");
    }

    if (!input.expected_updated_at || student.updated_at !== input.expected_updated_at) {
      throw new StudentGroupCleanupCorrectionError("student_stale", "Aday kaydı güncel değil. Listeyi yenileyip yeniden deneyin.");
    }

    const assessment = assessHardcodedStudentGroupCleanupCandidate(student);

    if (!assessment) {
      throw new StudentGroupCleanupCorrectionError("not_cleanup_candidate", "Bu kayıt artık öğrenci grubu cleanup adayı değil.");
    }

    const validatedInput = validateCorrectionInput(input, student.student_group);
    const [guardians, phones] = await Promise.all([
      database.guardians.where("student_id").equals(student.id).toArray(),
      database.phones.where("student_id").equals(student.id).toArray()
    ]);
    const updatedAt = createNextStudentUpdatedAt(student.updated_at);
    const searchText = createCorrectedSearchText(student, guardians, phones, validatedInput.target_student_group);
    const updatedCount = await database.students.update(student.id, {
      student_group: validatedInput.target_student_group,
      search_text: searchText,
      updated_at: updatedAt
    });

    if (updatedCount !== 1) {
      throw new Error("Öğrenci grubu düzeltilemedi.");
    }

    await database.audit_logs.add({
      entity_type: "student",
      entity_id: student.id,
      action_type: "update",
      field_name: "student_group_cleanup",
      old_value: JSON.stringify(createAuditValue(student, assessment, student.student_group, student.search_text, student.updated_at)),
      new_value: JSON.stringify(
        createAuditValue(student, assessment, validatedInput.target_student_group, searchText, updatedAt, validatedInput.correction_reason)
      ),
      note: validatedInput.correction_reason,
      performed_by: validatedInput.performed_by,
      created_at: updatedAt
    });

    result = {
      student_id: student.id,
      student_group: validatedInput.target_student_group,
      updated_at: updatedAt
    };
  });

  if (!result) {
    throw new Error("Öğrenci grubu düzeltilemedi.");
  }

  return result;
}
