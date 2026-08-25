import type { AppDatabase } from "../../../db/db";
import { db } from "../../../db/db";
import type { GuardianRecord } from "../../../domain/models/guardian";
import type { PhoneRecord } from "../../../domain/models/phone";
import { createStudentSearchTextFromRelations } from "./studentSearchText";

export type StudentSearchReindexResult = {
  scanned_students: number;
  updated_students: number;
};

export class StudentSearchReindexError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StudentSearchReindexError";
  }
}

function groupByStudentId<T extends { student_id: number }>(records: T[]): Map<number, T[]> {
  const grouped = new Map<number, T[]>();

  for (const record of records) {
    const current = grouped.get(record.student_id) ?? [];
    current.push(record);
    grouped.set(record.student_id, current);
  }

  return grouped;
}

export async function reindexActiveStudentSearchText(
  database: AppDatabase = db
): Promise<StudentSearchReindexResult> {
  let result: StudentSearchReindexResult | undefined;

  try {
    await database.transaction("rw", [database.students, database.guardians, database.phones], async () => {
      const [students, guardians, phones] = await Promise.all([
        database.students.toArray(),
        database.guardians.toArray(),
        database.phones.toArray()
      ]);
      const guardiansByStudentId = groupByStudentId<GuardianRecord>(guardians);
      const phonesByStudentId = groupByStudentId<PhoneRecord>(phones);
      let scannedStudents = 0;
      let updatedStudents = 0;

      for (const student of students) {
        if (!student.id || student.deleted_at) {
          continue;
        }

        scannedStudents += 1;
        const searchText = createStudentSearchTextFromRelations(
          student,
          guardiansByStudentId.get(student.id) ?? [],
          phonesByStudentId.get(student.id) ?? []
        );

        if (searchText === student.search_text) {
          continue;
        }

        const updatedCount = await database.students.update(student.id, { search_text: searchText });

        if (updatedCount !== 1) {
          throw new StudentSearchReindexError("Aday arama metni güvenle yenilenemedi.");
        }

        updatedStudents += 1;
      }

      result = {
        scanned_students: scannedStudents,
        updated_students: updatedStudents
      };
    });
  } catch (error) {
    if (error instanceof StudentSearchReindexError) {
      throw error;
    }

    throw new StudentSearchReindexError("Aday arama metinleri yenilenemedi.");
  }

  if (!result) {
    throw new StudentSearchReindexError("Aday arama metinleri yenilenemedi.");
  }

  return result;
}
