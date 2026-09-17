import type { AppDatabase } from "../../../db/db";
import { db } from "../../../db/db";
import { isSelectableCallPhone } from "../../calls/services/callSaveValidation";
import { readTodayPendingAppointmentCount } from "./dashboardAppointmentReader";
import { readDashboardReminderHealth } from "./dashboardReminderReader";

export type DashboardPhoneHealthAttention = {
  count: number;
  studentIds: number[];
};

export type DashboardAttentionSummary = {
  overdueCallReminders: number;
  todaysPendingAppointments: number;
  candidatesWithoutUsablePhone: DashboardPhoneHealthAttention;
};

export async function readCandidatesWithoutUsablePhone(database: AppDatabase = db): Promise<DashboardPhoneHealthAttention> {
  const candidates = (await database.students.where("lifecycle_status").equals("candidate").toArray()).filter(
    (student) => !student.deleted_at && Boolean(student.id)
  );
  const studentIds = candidates.map((student) => student.id!);
  const phones = studentIds.length === 0 ? [] : await database.phones.where("student_id").anyOf(studentIds).toArray();
  const selectableByStudent = new Set(
    phones
      .filter((phone) => !phone.deleted_at && isSelectableCallPhone(phone))
      .map((phone) => phone.student_id)
  );
  const attentionIds = studentIds.filter((studentId) => !selectableByStudent.has(studentId));

  return { count: attentionIds.length, studentIds: attentionIds };
}

export async function readDashboardAttention(
  now: string | Date = new Date(),
  database: AppDatabase = db
): Promise<DashboardAttentionSummary> {
  const [reminders, appointments, phoneHealth] = await Promise.all([
    readDashboardReminderHealth(now, database),
    readTodayPendingAppointmentCount(now, database),
    readCandidatesWithoutUsablePhone(database)
  ]);

  return {
    overdueCallReminders: reminders.overdue,
    todaysPendingAppointments: appointments,
    candidatesWithoutUsablePhone: phoneHealth
  };
}
