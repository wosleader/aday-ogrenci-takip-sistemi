import type { AppDatabase } from "../../../db/db";
import { db } from "../../../db/db";

export type StudentProfileSnapshot = {
  id: number;
  uuid: string;
  student_full_name: string;
  current_class: string | null;
  student_group: string;
  neighborhood: string | null;
  district: string | null;
  source_file_name: string | null;
  source_sheet_name: string | null;
  source_row_number: number | null;
  updated_at: string;
};

export type StudentProfileReaderErrorCode = "student_missing" | "student_deleted";

export class StudentProfileReaderError extends Error {
  constructor(
    public readonly code: StudentProfileReaderErrorCode,
    message: string
  ) {
    super(message);
    this.name = "StudentProfileReaderError";
  }
}

export async function readStudentProfileForEdit(
  studentId: number,
  database: AppDatabase = db
): Promise<StudentProfileSnapshot> {
  const student = await database.students.get(studentId);

  if (!student?.id) {
    throw new StudentProfileReaderError("student_missing", "Aday bulunamadı.");
  }

  if (student.deleted_at) {
    throw new StudentProfileReaderError("student_deleted", "Silinmiş aday düzenlenemez.");
  }

  return {
    id: student.id,
    uuid: student.uuid,
    student_full_name: student.student_full_name,
    current_class: student.current_class ?? null,
    student_group: student.student_group,
    neighborhood: student.neighborhood ?? null,
    district: student.district ?? null,
    source_file_name: student.source_file_name ?? null,
    source_sheet_name: student.source_sheet_name ?? null,
    source_row_number: student.source_row_number ?? null,
    updated_at: student.updated_at
  };
}
