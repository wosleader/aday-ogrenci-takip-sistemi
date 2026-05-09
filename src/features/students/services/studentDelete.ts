import type { AppDatabase } from "../../../db/db";
import { db } from "../../../db/db";
import { nowIso } from "../../../utils/dateTime";

export type StudentDeleteResult = {
  student_id: number;
  deleted_students: number;
  deleted_guardians: number;
  deleted_phones: number;
  deleted_reminders: number;
  deleted_appointments: number;
};

export async function deleteStudentWithRelations(
  studentId: number,
  database: AppDatabase = db
): Promise<StudentDeleteResult> {
  const student = await database.students.get(studentId);

  if (!student) {
    throw new Error("Silinecek aday bulunamadı.");
  }

  const result: StudentDeleteResult = {
    student_id: studentId,
    deleted_students: 0,
    deleted_guardians: 0,
    deleted_phones: 0,
    deleted_reminders: 0,
    deleted_appointments: 0
  };

  await database.transaction(
    "rw",
    [
      database.students,
      database.guardians,
      database.phones,
      database.reminders,
      database.appointments,
      database.audit_logs
    ],
    async () => {
      const [guardians, phones, reminders, appointments] = await Promise.all([
        database.guardians.where("student_id").equals(studentId).toArray(),
        database.phones.where("student_id").equals(studentId).toArray(),
        database.reminders.where("student_id").equals(studentId).toArray(),
        database.appointments.where("student_id").equals(studentId).toArray()
      ]);

      await Promise.all([
        database.guardians.bulkDelete(guardians.flatMap((record) => (record.id ? [record.id] : []))),
        database.phones.bulkDelete(phones.flatMap((record) => (record.id ? [record.id] : []))),
        database.reminders.bulkDelete(reminders.flatMap((record) => (record.id ? [record.id] : []))),
        database.appointments.bulkDelete(appointments.flatMap((record) => (record.id ? [record.id] : []))),
        database.students.delete(studentId)
      ]);

      result.deleted_students = 1;
      result.deleted_guardians = guardians.length;
      result.deleted_phones = phones.length;
      result.deleted_reminders = reminders.length;
      result.deleted_appointments = appointments.length;

      await database.audit_logs.add({
        entity_type: "student",
        entity_id: studentId,
        action_type: "delete",
        note: `${student.student_full_name} adayı ve ilişkili kayıtları silindi.`,
        created_at: nowIso()
      });
    }
  );

  return result;
}
