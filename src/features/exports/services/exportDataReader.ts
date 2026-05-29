import type { AppDatabase } from "../../../db/db";
import { db } from "../../../db/db";
import type { CallLogRecord } from "../../../domain/models/callLog";
import type { GuardianRecord } from "../../../domain/models/guardian";
import type { PhoneRecord } from "../../../domain/models/phone";
import type { ReminderRecord } from "../../../domain/models/reminder";
import type { StudentRecord } from "../../../domain/models/student";
import { normalizeText } from "../../../utils/normalizeText";
import type { ExportDataset } from "./exportTypes";

export type ExportDataReaderOptions = {
  studentIds?: number[];
  database?: AppDatabase;
};

function isActive<T extends { deleted_at?: string | null }>(record: T): boolean {
  return !record.deleted_at;
}

function byCreatedAt<T extends { created_at: string; id?: number }>(left: T, right: T): number {
  return left.created_at.localeCompare(right.created_at) || (left.id ?? 0) - (right.id ?? 0);
}

function byPhoneExportOrder(left: PhoneRecord, right: PhoneRecord): number {
  return (
    (left.priority ?? Number.MAX_SAFE_INTEGER) - (right.priority ?? Number.MAX_SAFE_INTEGER) ||
    left.created_at.localeCompare(right.created_at) ||
    (left.id ?? 0) - (right.id ?? 0)
  );
}

function isSecondPhoneLabel(label?: string | null): boolean {
  const normalizedLabel = normalizeText(label ?? "");

  return normalizedLabel.includes("2") || normalizedLabel.includes("ikinci");
}

function isFirstPhoneCandidate(phone: PhoneRecord): boolean {
  const normalizedLabel = normalizeText(phone.phone_label ?? "");

  return phone.is_primary || normalizedLabel === "telefon" || normalizedLabel === "telefon 1";
}

function pickPhoneSlots(phones: PhoneRecord[]) {
  const sortedPhones = [...phones].sort(byCreatedAt);
  const secondByLabel = sortedPhones.find((phone) => isSecondPhoneLabel(phone.phone_label));

  if (secondByLabel && sortedPhones.length === 1) {
    return {
      phone_1: null,
      phone_2: secondByLabel
    };
  }

  const firstByLabel = sortedPhones.find(
    (phone) => phone.normalized_phone_number !== secondByLabel?.normalized_phone_number && isFirstPhoneCandidate(phone)
  );
  const phone1 = firstByLabel ?? sortedPhones.find((phone) => phone.id !== secondByLabel?.id) ?? sortedPhones[0];
  const phone2 =
    secondByLabel && secondByLabel.id !== phone1?.id
      ? secondByLabel
      : sortedPhones.find((phone) => phone.id !== phone1?.id);

  return {
    phone_1: phone1 ?? null,
    phone_2: phone2 ?? null
  };
}

function groupByStudentId<T extends { student_id: number }>(records: T[]): Map<number, T[]> {
  const grouped = new Map<number, T[]>();

  for (const record of records) {
    grouped.set(record.student_id, [...(grouped.get(record.student_id) ?? []), record]);
  }

  return grouped;
}

function pickGuardian(guardians: GuardianRecord[]): GuardianRecord | undefined {
  return [...guardians].sort(byCreatedAt)[0];
}

function pickPendingReminder(reminders: ReminderRecord[]): ReminderRecord | undefined {
  return reminders
    .filter((reminder) => reminder.status === "pending" && reminder.reminder_type === "call")
    .sort((left, right) => left.reminder_at.localeCompare(right.reminder_at) || byCreatedAt(left, right))[0];
}

function createPhoneDuplicateInfo(phones: PhoneRecord[]): Map<number, string[]> {
  const phoneOwners = new Map<string, Set<number>>();

  for (const phone of phones) {
    if (!phone.normalized_phone_number) {
      continue;
    }

    const owners = phoneOwners.get(phone.normalized_phone_number) ?? new Set<number>();
    owners.add(phone.student_id);
    phoneOwners.set(phone.normalized_phone_number, owners);
  }

  const duplicatedPhonesByStudent = new Map<number, string[]>();

  for (const [phoneNumber, owners] of phoneOwners.entries()) {
    if (owners.size < 2) {
      continue;
    }

    for (const studentId of owners) {
      duplicatedPhonesByStudent.set(studentId, [...(duplicatedPhonesByStudent.get(studentId) ?? []), phoneNumber]);
    }
  }

  return duplicatedPhonesByStudent;
}

export async function readDetailedExportData(options: ExportDataReaderOptions = {}): Promise<ExportDataset> {
  const database = options.database ?? db;
  const requestedStudentIds = options.studentIds ? new Set(options.studentIds) : null;
  const [students, guardians, phones, campaigns, reminders, appointments, callLogs] = await Promise.all([
    database.students.toArray(),
    database.guardians.toArray(),
    database.phones.toArray(),
    database.campaigns.toArray(),
    database.reminders.toArray(),
    database.appointments.toArray(),
    database.call_logs.toArray()
  ]);
  const activeStudents = students
    .filter(isActive)
    .flatMap((student) => (student.id ? [student as StudentRecord & { id: number }] : []))
    .filter((student) => !requestedStudentIds || requestedStudentIds.has(student.id))
    .sort((left, right) => byCreatedAt(left, right));
  const activeGuardians = guardians.filter(isActive);
  const activePhones = phones.filter(isActive);
  const guardiansByStudent = groupByStudentId(activeGuardians);
  const phonesByStudent = groupByStudentId(activePhones);
  const remindersByStudent = groupByStudentId(reminders.filter(isActive));
  const appointmentsByStudent = groupByStudentId(appointments.filter(isActive));
  const callLogsByStudent = groupByStudentId(
    callLogs.filter(isActive).flatMap((log) => (log.id ? [log as CallLogRecord & { id: number }] : []))
  );
  const campaignsById = new Map(campaigns.filter(isActive).flatMap((campaign) => (campaign.id ? [[campaign.id, campaign]] : [])));
  const duplicatedPhonesByStudent = createPhoneDuplicateInfo(activePhones);

  return {
    bundles: activeStudents.map((student) => {
      const phonesForStudent = phonesByStudent.get(student.id) ?? [];
      const sortedPhonesForExport = [...phonesForStudent].sort(byPhoneExportOrder);
      const callLogsForStudent = [...(callLogsByStudent.get(student.id) ?? [])].sort(
        (left, right) => left.call_time.localeCompare(right.call_time) || (left.id ?? 0) - (right.id ?? 0)
      );

      return {
        student,
        guardian: pickGuardian(guardiansByStudent.get(student.id) ?? []) ?? null,
        campaign: student.campaign_id ? campaignsById.get(student.campaign_id) ?? null : null,
        pending_reminder: pickPendingReminder(remindersByStudent.get(student.id) ?? []) ?? null,
        appointment: [...(appointmentsByStudent.get(student.id) ?? [])].sort(byCreatedAt)[0] ?? null,
        call_logs: callLogsForStudent,
        duplicate_phone_keys: duplicatedPhonesByStudent.get(student.id) ?? [],
        phones: sortedPhonesForExport,
        ...pickPhoneSlots(phonesForStudent)
      };
    })
  };
}
