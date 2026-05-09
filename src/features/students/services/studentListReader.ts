import type { AppDatabase } from "../../../db/db";
import { db } from "../../../db/db";
import type { CampaignRecord } from "../../../domain/models/campaign";
import type { CallLogRecord } from "../../../domain/models/callLog";
import type { GuardianRecord } from "../../../domain/models/guardian";
import type { PhoneRecord } from "../../../domain/models/phone";
import type { ReminderRecord } from "../../../domain/models/reminder";
import type { StudentRecord } from "../../../domain/models/student";
import { createSearchText, normalizeText } from "../../../utils/normalizeText";

export type StudentListFilter =
  | "all"
  | "missing_phone"
  | "has_reminder"
  | "duplicate_phone"
  | "not_called"
  | "has_note";

export type StudentListRow = {
  student_id: number;
  student_full_name: string;
  normalized_student_name: string;
  current_class?: string | null;
  student_group: string;
  category: string;
  campaign_id?: number | null;
  campaign_name?: string | null;
  guardian_id?: number | null;
  guardian_full_name?: string | null;
  phone_1_id?: number | null;
  phone_1?: string | null;
  phone_1_status: "active" | "contacted" | "invalid";
  phone_1_is_wrong: boolean;
  phone_1_is_contacted: boolean;
  phone_2_id?: number | null;
  phone_2?: string | null;
  phone_2_status: "active" | "contacted" | "invalid";
  phone_2_is_wrong: boolean;
  phone_2_is_contacted: boolean;
  phone_count: number;
  has_missing_phone: boolean;
  has_duplicate_phone: boolean;
  duplicate_group_key?: string | null;
  duplicate_phone_keys: string[];
  has_reminder: boolean;
  next_reminder_at?: string | null;
  lifecycle_status: string;
  last_call_result: string;
  general_note?: string | null;
  note_count: number;
  next_action_label: string;
  source_row_number?: number | null;
  created_at: string;
  updated_at: string;
  search_blob: string;
};

function isActive<T extends { deleted_at?: string | null }>(record: T): boolean {
  return !record.deleted_at;
}

function byCreatedAt<T extends { created_at: string; id?: number }>(left: T, right: T): number {
  return left.created_at.localeCompare(right.created_at) || (left.id ?? 0) - (right.id ?? 0);
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
    if (!phoneNumber || owners.size < 2) {
      continue;
    }

    for (const studentId of owners) {
      const studentPhones = duplicatedPhonesByStudent.get(studentId) ?? [];
      studentPhones.push(phoneNumber);
      duplicatedPhonesByStudent.set(studentId, studentPhones);
    }
  }

  return duplicatedPhonesByStudent;
}

function groupByStudentId<T extends { student_id: number }>(records: T[]): Map<number, T[]> {
  const grouped = new Map<number, T[]>();

  for (const record of records) {
    const recordsForStudent = grouped.get(record.student_id) ?? [];
    recordsForStudent.push(record);
    grouped.set(record.student_id, recordsForStudent);
  }

  return grouped;
}

function buildCampaignMap(campaigns: CampaignRecord[]): Map<number, CampaignRecord> {
  return new Map(campaigns.flatMap((campaign) => (campaign.id ? [[campaign.id, campaign]] : [])));
}

function pickGuardian(guardians: GuardianRecord[]): GuardianRecord | undefined {
  return [...guardians].sort(byCreatedAt)[0];
}

function pickNextPendingReminder(reminders: ReminderRecord[]): ReminderRecord | undefined {
  return reminders
    .filter((reminder) => reminder.status === "pending")
    .sort((left, right) => left.reminder_at.localeCompare(right.reminder_at) || byCreatedAt(left, right))[0];
}

function mapStudentToRow(
  student: StudentRecord & { id: number },
  guardiansByStudent: Map<number, GuardianRecord[]>,
  phonesByStudent: Map<number, PhoneRecord[]>,
  remindersByStudent: Map<number, ReminderRecord[]>,
  callLogsByStudent: Map<number, CallLogRecord[]>,
  campaignMap: Map<number, CampaignRecord>,
  duplicatedPhonesByStudent: Map<number, string[]>
): StudentListRow {
  const guardians = guardiansByStudent.get(student.id) ?? [];
  const phones = phonesByStudent.get(student.id) ?? [];
  const pendingReminder = pickNextPendingReminder(remindersByStudent.get(student.id) ?? []);
  const callLogs = callLogsByStudent.get(student.id) ?? [];
  const callLogNotes = callLogs.flatMap((log) => (log.note?.trim() ? [log.note] : []));
  const guardian = pickGuardian(guardians);
  const { phone_1: phone1, phone_2: phone2 } = pickPhoneSlots(phones);
  const campaign = student.campaign_id ? campaignMap.get(student.campaign_id) : undefined;
  const phone1Status = phone1?.phone_status ?? (phone1?.is_wrong ? "invalid" : "active");
  const phone2Status = phone2?.phone_status ?? (phone2?.is_wrong ? "invalid" : "active");
  const duplicatePhoneKeys = duplicatedPhonesByStudent.get(student.id) ?? [];

  return {
    student_id: student.id,
    student_full_name: student.student_full_name,
    normalized_student_name: student.normalized_student_name,
    current_class: student.current_class ?? null,
    student_group: student.student_group,
    category: student.category,
    campaign_id: student.campaign_id ?? null,
    campaign_name: campaign?.name ?? null,
    guardian_id: guardian?.id ?? null,
    guardian_full_name: guardian?.guardian_full_name ?? null,
    phone_1_id: phone1?.id ?? null,
    phone_1: phone1?.phone_number ?? null,
    phone_1_status: phone1Status,
    phone_1_is_wrong: phone1Status === "invalid" || Boolean(phone1?.is_wrong),
    phone_1_is_contacted: phone1Status === "contacted",
    phone_2_id: phone2?.id ?? null,
    phone_2: phone2?.phone_number ?? null,
    phone_2_status: phone2Status,
    phone_2_is_wrong: phone2Status === "invalid" || Boolean(phone2?.is_wrong),
    phone_2_is_contacted: phone2Status === "contacted",
    phone_count: phones.length,
    has_missing_phone: phones.length === 0,
    has_duplicate_phone: duplicatePhoneKeys.length > 0,
    duplicate_group_key: duplicatePhoneKeys[0] ?? null,
    duplicate_phone_keys: duplicatePhoneKeys,
    has_reminder: Boolean(pendingReminder),
    next_reminder_at: pendingReminder?.reminder_at ?? null,
    lifecycle_status: student.lifecycle_status,
    last_call_result: student.last_call_result,
    general_note: student.general_note ?? null,
    note_count: (student.general_note?.trim() ? 1 : 0) + callLogNotes.length,
    next_action_label: pendingReminder ? `Tekrar ara: ${pendingReminder.reminder_at}` : "-",
    source_row_number: student.source_row_number ?? null,
    created_at: student.created_at,
    updated_at: student.updated_at,
    search_blob: createSearchText([
      student.search_text,
      student.student_full_name,
      guardian?.guardian_full_name,
      phone1?.phone_number,
      phone2?.phone_number,
      student.general_note,
      ...callLogNotes
    ])
  };
}

export async function readStudentListRows(database: AppDatabase = db): Promise<StudentListRow[]> {
  const [students, guardians, phones, reminders, campaigns, callLogs] = await Promise.all([
    database.students.toArray(),
    database.guardians.toArray(),
    database.phones.toArray(),
    database.reminders.toArray(),
    database.campaigns.toArray(),
    database.call_logs.toArray()
  ]);
  const activeStudents = students.filter(isActive).flatMap((student) => (student.id ? [student as StudentRecord & { id: number }] : []));
  const activeGuardians = guardians.filter(isActive);
  const activePhones = phones.filter(isActive);
  const activeReminders = reminders.filter(isActive);

  const guardiansByStudent = groupByStudentId(activeGuardians);
  const phonesByStudent = groupByStudentId(activePhones);
  const remindersByStudent = groupByStudentId(activeReminders);
  const callLogsByStudent = groupByStudentId(callLogs.filter(isActive));
  const campaignMap = buildCampaignMap(campaigns.filter(isActive));
  const duplicatedPhonesByStudent = createPhoneDuplicateInfo(activePhones);

  return activeStudents
    .sort((left, right) => byCreatedAt(right, left))
    .map((student) =>
      mapStudentToRow(
        student,
        guardiansByStudent,
        phonesByStudent,
        remindersByStudent,
        callLogsByStudent,
        campaignMap,
        duplicatedPhonesByStudent
      )
    );
}

export function filterStudentListRows(
  rows: StudentListRow[],
  query: string,
  filter: StudentListFilter = "all"
): StudentListRow[] {
  const normalizedQuery = normalizeText(query);

  return rows.filter((row) => {
    const matchesQuery = !normalizedQuery || row.search_blob.includes(normalizedQuery);

    if (!matchesQuery) {
      return false;
    }

    if (filter === "missing_phone") {
      return row.has_missing_phone;
    }

    if (filter === "has_reminder") {
      return row.has_reminder;
    }

    if (filter === "duplicate_phone") {
      return row.has_duplicate_phone;
    }

    if (filter === "not_called") {
      return row.last_call_result === "not_called";
    }

    if (filter === "has_note") {
      return Boolean(row.general_note?.trim());
    }

    return true;
  });
}
