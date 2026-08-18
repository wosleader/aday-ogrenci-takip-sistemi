import type { AppDatabase } from "../../../db/db";
import { db } from "../../../db/db";
import type { StudentCategory } from "../../../domain/constants/statuses";
import type { StudentRecord } from "../../../domain/models/student";
import { normalizeText } from "../../../utils/normalizeText";

export const HARDCODED_STUDENT_GROUP_FALLBACK = "11. Sınıf YKS Hazırlık";

export type StudentGroupCleanupRiskLevel = "high_confidence" | "needs_review";

export type StudentGroupCleanupCandidate = {
  id: number;
  full_name: string;
  current_class: string | null;
  student_group: string;
  category: StudentCategory;
  source_file_name: string | null;
  source_sheet_name: string | null;
  source_row_number: number | null;
  created_at: string;
  updated_at: string;
  risk_level: StudentGroupCleanupRiskLevel;
  reason: string;
};

export type StudentGroupCleanupAssessment = {
  risk_level: StudentGroupCleanupRiskLevel;
  reason: string;
};

type ClassCompatibility =
  | { kind: "compatible_11" }
  | { kind: "non_11_grade"; grade: number }
  | { kind: "known_non_11_label"; label: string }
  | { kind: "unknown_class" };

function classifyCurrentClass(value?: string | null): ClassCompatibility {
  const normalized = normalizeText(value);

  if (!normalized) {
    return { kind: "unknown_class" };
  }

  const gradeMatch = normalized.match(/^(\d{1,2})(?:\b|\s|$)/);

  if (gradeMatch) {
    const grade = Number(gradeMatch[1]);

    if (grade === 11) {
      return { kind: "compatible_11" };
    }

    if (grade >= 1 && grade <= 12) {
      return { kind: "non_11_grade", grade };
    }
  }

  if (/\blgs\b/.test(normalized)) {
    return { kind: "known_non_11_label", label: "LGS" };
  }

  return { kind: "unknown_class" };
}

function createReason(compatibility: Exclude<ClassCompatibility, { kind: "compatible_11" }>, category: StudentCategory) {
  const categoryHint = category === "YKS" ? " Kategori de YKS olduğu için eski fallback sinyali güçleniyor." : "";

  if (compatibility.kind === "non_11_grade") {
    return `Öğrenci grubu eski fallback değeriyle aynı; sınıf ${compatibility.grade} olduğu için 11. sınıf programıyla çelişiyor.${categoryHint}`;
  }

  if (compatibility.kind === "known_non_11_label") {
    return `Öğrenci grubu eski fallback değeriyle aynı; sınıf alanı ${compatibility.label} olduğu için 11. sınıf programıyla çelişiyor.${categoryHint}`;
  }

  return `Öğrenci grubu eski fallback değeriyle aynı; sınıf bilgisi boş veya net yorumlanamıyor.${categoryHint}`;
}

export function assessHardcodedStudentGroupCleanupCandidate(student: StudentRecord): StudentGroupCleanupAssessment | null {
  if (student.deleted_at || student.student_group?.trim() !== HARDCODED_STUDENT_GROUP_FALLBACK) {
    return null;
  }

  const compatibility = classifyCurrentClass(student.current_class);

  if (compatibility.kind === "compatible_11") {
    return null;
  }

  return {
    risk_level: compatibility.kind === "unknown_class" ? "needs_review" : "high_confidence",
    reason: createReason(compatibility, student.category)
  };
}

export async function readHardcodedStudentGroupCleanupCandidates(
  database: AppDatabase = db
): Promise<StudentGroupCleanupCandidate[]> {
  const students = await database.students.toArray();
  const candidates: StudentGroupCleanupCandidate[] = [];

  for (const student of students) {
    if (!student.id) {
      continue;
    }

    const assessment = assessHardcodedStudentGroupCleanupCandidate(student);

    if (!assessment) {
      continue;
    }

    candidates.push({
      id: student.id,
      full_name: student.student_full_name,
      current_class: student.current_class ?? null,
      student_group: student.student_group,
      category: student.category,
      source_file_name: student.source_file_name ?? null,
      source_sheet_name: student.source_sheet_name ?? null,
      source_row_number: student.source_row_number ?? null,
      created_at: student.created_at,
      updated_at: student.updated_at,
      risk_level: assessment.risk_level,
      reason: assessment.reason
    });
  }

  return candidates.sort((left, right) => {
    const riskOrder = left.risk_level === right.risk_level ? 0 : left.risk_level === "high_confidence" ? -1 : 1;

    return riskOrder || left.created_at.localeCompare(right.created_at) || left.id - right.id;
  });
}
