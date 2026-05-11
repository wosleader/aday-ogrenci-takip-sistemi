import type { AppDatabase } from "../../../db/db";
import { db } from "../../../db/db";
import type { PhoneRecord } from "../../../domain/models/phone";

export type DueReminderAlert = {
  reminder_id: number;
  student_id: number;
  student_full_name: string;
  guardian_full_name?: string | null;
  phone_1?: string | null;
  phone_2?: string | null;
  reminder_at: string;
  note?: string | null;
  call_result?: string | null;
};

export type ReminderPopupModel = {
  alerts: DueReminderAlert[];
  primaryAlert: DueReminderAlert;
  dueCount: number;
  isBulk: boolean;
};

export function getReminderDismissalKey(alert: Pick<DueReminderAlert, "reminder_id" | "reminder_at">): string {
  return `${alert.reminder_id}|${alert.reminder_at}`;
}

export function filterDismissedReminderAlerts(
  alerts: DueReminderAlert[],
  dismissedReminderKeys: string[],
  popupEnabled = true
): DueReminderAlert[] {
  if (!popupEnabled) {
    return [];
  }

  const dismissed = new Set(dismissedReminderKeys);

  return alerts.filter((alert) => !dismissed.has(getReminderDismissalKey(alert)));
}

export function createReminderPopupModel(
  alerts: DueReminderAlert[],
  dismissedReminderKeys: string[],
  popupEnabled = true
): ReminderPopupModel | null {
  const visibleAlerts = filterDismissedReminderAlerts(alerts, dismissedReminderKeys, popupEnabled);
  const primaryAlert = visibleAlerts[0];

  if (!primaryAlert) {
    return null;
  }

  return {
    alerts: visibleAlerts,
    primaryAlert,
    dueCount: visibleAlerts.length,
    isBulk: visibleAlerts.length > 1
  };
}

export function dismissReminderAlert(
  dismissedReminderKeys: string[],
  alert: Pick<DueReminderAlert, "reminder_id" | "reminder_at">
): string[] {
  return [...new Set([...dismissedReminderKeys, getReminderDismissalKey(alert)])];
}

export function dismissAllReminderAlerts(
  dismissedReminderKeys: string[],
  alerts: Array<Pick<DueReminderAlert, "reminder_id" | "reminder_at">>
): string[] {
  return [...new Set([...dismissedReminderKeys, ...alerts.map((alert) => getReminderDismissalKey(alert))])];
}

function isSecondPhoneLabel(label?: string | null): boolean {
  return Boolean(label?.includes("2") || label?.toLocaleLowerCase("tr-TR").includes("ikinci"));
}

function pickPhones(phones: PhoneRecord[]) {
  const sortedPhones = [...phones].sort(
    (left, right) => left.created_at.localeCompare(right.created_at) || (left.id ?? 0) - (right.id ?? 0)
  );
  const phone2 = sortedPhones.find((phone) => isSecondPhoneLabel(phone.phone_label));
  const phone1 = sortedPhones.find((phone) => phone.id !== phone2?.id) ?? sortedPhones[0];

  return {
    phone_1: phone1?.phone_number ?? null,
    phone_2: phone2?.phone_number ?? null
  };
}

export async function readDueReminderAlerts(
  now: string = new Date().toISOString(),
  database: AppDatabase = db
): Promise<DueReminderAlert[]> {
  const [reminders, students, guardians, phones, callLogs] = await Promise.all([
    database.reminders.toArray(),
    database.students.toArray(),
    database.guardians.toArray(),
    database.phones.toArray(),
    database.call_logs.toArray()
  ]);
  const activeStudents = new Map(students.filter((student) => !student.deleted_at && student.id).map((student) => [student.id!, student]));
  const guardiansByStudent = new Map<number, typeof guardians>();
  const phonesByStudent = new Map<number, PhoneRecord[]>();
  const callLogsById = new Map(callLogs.filter((log) => log.id).map((log) => [log.id!, log]));

  for (const guardian of guardians.filter((record) => !record.deleted_at)) {
    guardiansByStudent.set(guardian.student_id, [...(guardiansByStudent.get(guardian.student_id) ?? []), guardian]);
  }

  for (const phone of phones.filter((record) => !record.deleted_at)) {
    phonesByStudent.set(phone.student_id, [...(phonesByStudent.get(phone.student_id) ?? []), phone]);
  }

  return reminders
    .filter(
      (reminder) =>
        !reminder.deleted_at &&
        reminder.status === "pending" &&
        reminder.reminder_type === "call" &&
        reminder.reminder_at <= now &&
        reminder.id &&
        activeStudents.has(reminder.student_id)
    )
    .sort((left, right) => left.reminder_at.localeCompare(right.reminder_at))
    .map((reminder) => {
      const student = activeStudents.get(reminder.student_id)!;
      const guardian = (guardiansByStudent.get(reminder.student_id) ?? [])[0];
      const pickedPhones = pickPhones(phonesByStudent.get(reminder.student_id) ?? []);
      const callLog = reminder.call_log_id ? callLogsById.get(reminder.call_log_id) : undefined;

      return {
        reminder_id: reminder.id!,
        student_id: reminder.student_id,
        student_full_name: student.student_full_name,
        guardian_full_name: guardian?.guardian_full_name ?? null,
        phone_1: pickedPhones.phone_1,
        phone_2: pickedPhones.phone_2,
        reminder_at: reminder.reminder_at,
        note: reminder.note ?? null,
        call_result: callLog?.call_result ?? null
      };
    });
}
