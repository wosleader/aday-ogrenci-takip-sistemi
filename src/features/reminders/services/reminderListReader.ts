import type { AppDatabase } from "../../../db/db";
import { db } from "../../../db/db";
import { CALL_RESULTS } from "../../../domain/constants/statuses";
import type { CallLogRecord } from "../../../domain/models/callLog";
import type { GuardianRecord } from "../../../domain/models/guardian";
import type { PhoneRecord } from "../../../domain/models/phone";

export type ReminderTaskBucket = "overdue" | "today" | "upcoming";
export type ReminderTaskFilter = "all" | ReminderTaskBucket;

export type ReminderTaskRow = {
  reminder_id: number;
  student_id: number;
  student_full_name: string;
  guardian_full_name?: string | null;
  phone_1?: string | null;
  phone_2?: string | null;
  reminder_at: string;
  reminder_date_label: string;
  reminder_time_label: string;
  bucket: ReminderTaskBucket;
  bucket_label: string;
  last_call_result?: string | null;
  last_call_result_label: string;
  note_preview?: string | null;
};

export type ReminderTaskSummary = {
  overdue: number;
  today: number;
  upcoming: number;
  all: number;
};

const BUCKET_LABELS: Record<ReminderTaskBucket, string> = {
  overdue: "Süresi geçti",
  today: "Bugün aranacak",
  upcoming: "Yaklaşan"
};

const BUCKET_ORDER: Record<ReminderTaskBucket, number> = {
  overdue: 0,
  today: 1,
  upcoming: 2
};

function toValidDate(value: string): Date | null {
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function isSameLocalDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function isBeforeLocalDay(left: Date, right: Date): boolean {
  const leftDay = new Date(left.getFullYear(), left.getMonth(), left.getDate()).getTime();
  const rightDay = new Date(right.getFullYear(), right.getMonth(), right.getDate()).getTime();

  return leftDay < rightDay;
}

export function classifyReminderTask(reminderAt: string, now: string = new Date().toISOString()): ReminderTaskBucket {
  const reminderDate = toValidDate(reminderAt);
  const nowDate = toValidDate(now) ?? new Date();

  if (!reminderDate) {
    return "upcoming";
  }

  if (isBeforeLocalDay(reminderDate, nowDate)) {
    return "overdue";
  }

  if (isSameLocalDay(reminderDate, nowDate)) {
    return reminderDate.getTime() < nowDate.getTime() ? "overdue" : "today";
  }

  return "upcoming";
}

export function formatReminderTaskDate(value: string): string {
  const date = toValidDate(value);

  if (!date) {
    return "-";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(date);
}

export function formatReminderTaskTime(value: string): string {
  const date = toValidDate(value);

  if (!date) {
    return "-";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function isSecondPhoneLabel(label?: string | null): boolean {
  const normalizedLabel = label?.toLocaleLowerCase("tr-TR") ?? "";

  return normalizedLabel.includes("2") || normalizedLabel.includes("ikinci");
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

function pickPrimaryGuardian(guardians: GuardianRecord[]): GuardianRecord | undefined {
  return [...guardians].sort(
    (left, right) => left.created_at.localeCompare(right.created_at) || (left.id ?? 0) - (right.id ?? 0)
  )[0];
}

function compareCallLogDesc(left: CallLogRecord, right: CallLogRecord): number {
  const leftTime = left.call_time ?? left.created_at;
  const rightTime = right.call_time ?? right.created_at;

  return rightTime.localeCompare(leftTime) || (right.id ?? 0) - (left.id ?? 0);
}

function createNotePreview(...notes: Array<string | null | undefined>): string | null {
  const note = notes.find((value) => value?.trim());

  if (!note) {
    return null;
  }

  const compactNote = note.trim().replace(/\s+/g, " ");

  return compactNote.length > 90 ? `${compactNote.slice(0, 87)}...` : compactNote;
}

function getCallResultLabel(value?: string | null): string {
  if (!value) {
    return "Aranmadı";
  }

  return CALL_RESULTS[value as keyof typeof CALL_RESULTS] ?? value;
}

export function createReminderTaskSummary(rows: ReminderTaskRow[]): ReminderTaskSummary {
  return rows.reduce<ReminderTaskSummary>(
    (summary, row) => ({
      ...summary,
      [row.bucket]: summary[row.bucket] + 1,
      all: summary.all + 1
    }),
    { overdue: 0, today: 0, upcoming: 0, all: 0 }
  );
}

export function filterReminderTaskRows(rows: ReminderTaskRow[], filter: ReminderTaskFilter): ReminderTaskRow[] {
  if (filter === "all") {
    return rows;
  }

  return rows.filter((row) => row.bucket === filter);
}

export async function readReminderTaskRows(
  now: string = new Date().toISOString(),
  database: AppDatabase = db
): Promise<ReminderTaskRow[]> {
  const [reminders, students, guardians, phones, callLogs] = await Promise.all([
    database.reminders.toArray(),
    database.students.toArray(),
    database.guardians.toArray(),
    database.phones.toArray(),
    database.call_logs.toArray()
  ]);
  const activeStudents = new Map(
    students.filter((student) => !student.deleted_at && student.id).map((student) => [student.id!, student])
  );
  const guardiansByStudent = new Map<number, GuardianRecord[]>();
  const phonesByStudent = new Map<number, PhoneRecord[]>();
  const callLogsByStudent = new Map<number, CallLogRecord[]>();

  for (const guardian of guardians.filter((record) => !record.deleted_at)) {
    guardiansByStudent.set(guardian.student_id, [...(guardiansByStudent.get(guardian.student_id) ?? []), guardian]);
  }

  for (const phone of phones.filter((record) => !record.deleted_at)) {
    phonesByStudent.set(phone.student_id, [...(phonesByStudent.get(phone.student_id) ?? []), phone]);
  }

  for (const callLog of callLogs.filter((record) => !record.deleted_at)) {
    callLogsByStudent.set(callLog.student_id, [...(callLogsByStudent.get(callLog.student_id) ?? []), callLog]);
  }

  return reminders
    .filter(
      (reminder) =>
        !reminder.deleted_at &&
        reminder.status === "pending" &&
        reminder.reminder_type === "call" &&
        reminder.id &&
        activeStudents.has(reminder.student_id)
    )
    .map((reminder) => {
      const student = activeStudents.get(reminder.student_id)!;
      const guardian = pickPrimaryGuardian(guardiansByStudent.get(reminder.student_id) ?? []);
      const pickedPhones = pickPhones(phonesByStudent.get(reminder.student_id) ?? []);
      const latestCallLog = [...(callLogsByStudent.get(reminder.student_id) ?? [])].sort(compareCallLogDesc)[0];
      const bucket = classifyReminderTask(reminder.reminder_at, now);

      return {
        reminder_id: reminder.id!,
        student_id: reminder.student_id,
        student_full_name: student.student_full_name,
        guardian_full_name: guardian?.guardian_full_name ?? null,
        phone_1: pickedPhones.phone_1,
        phone_2: pickedPhones.phone_2,
        reminder_at: reminder.reminder_at,
        reminder_date_label: formatReminderTaskDate(reminder.reminder_at),
        reminder_time_label: formatReminderTaskTime(reminder.reminder_at),
        bucket,
        bucket_label: BUCKET_LABELS[bucket],
        last_call_result: latestCallLog?.call_result ?? student.last_call_result ?? null,
        last_call_result_label: getCallResultLabel(latestCallLog?.call_result ?? student.last_call_result),
        note_preview: createNotePreview(reminder.note, latestCallLog?.note)
      };
    })
    .sort(
      (left, right) =>
        BUCKET_ORDER[left.bucket] - BUCKET_ORDER[right.bucket] ||
        left.reminder_at.localeCompare(right.reminder_at) ||
        left.reminder_id - right.reminder_id
    );
}
