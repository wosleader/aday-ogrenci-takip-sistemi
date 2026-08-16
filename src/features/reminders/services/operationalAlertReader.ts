import type { AppDatabase } from "../../../db/db";
import { db } from "../../../db/db";
import { CALL_RESULTS } from "../../../domain/constants/statuses";
import type { AppointmentRecord } from "../../../domain/models/appointment";
import type { CallLogRecord } from "../../../domain/models/callLog";
import type { GuardianRecord } from "../../../domain/models/guardian";
import type { PhoneRecord } from "../../../domain/models/phone";
import type { ReminderRecord } from "../../../domain/models/reminder";
import type { StudentRecord } from "../../../domain/models/student";
import { createPhoneSnapshotDisplayLabel } from "../../calls/services/callLogPhoneContext";
import { classifyReminderTask, formatReminderTaskDate, formatReminderTaskTime, type ReminderTaskBucket } from "./reminderListReader";

export type OperationalAlertKind =
  | "call_reminder"
  | "appointment_guardian_message"
  | "appointment_start";

export type OperationalAlertSourceType = "reminder" | "appointment";
export type OperationalAlertFilter = "all" | ReminderTaskBucket;

export type OperationalAlertItem = {
  identity: string;
  kind: OperationalAlertKind;
  source_type: OperationalAlertSourceType;
  source_id: number;
  student_id: number;
  student_full_name: string;
  guardian_full_name?: string | null;
  due_at: string;
  title: string;
  note?: string | null;
  bucket: ReminderTaskBucket;
  bucket_label: string;
  due_date_label: string;
  due_time_label: string;
  phone_1?: string | null;
  phone_2?: string | null;
  phone_context_label?: string | null;
  phone_context_number?: string | null;
  last_call_result?: string | null;
  last_call_result_label: string;
  note_preview?: string | null;
};

export type OperationalAlertSummary = {
  overdue: number;
  today: number;
  upcoming: number;
  all: number;
};

const BUCKET_LABELS: Record<ReminderTaskBucket, string> = {
  overdue: "Süresi geçti",
  today: "Bugün",
  upcoming: "Yaklaşan"
};

const BUCKET_ORDER: Record<ReminderTaskBucket, number> = {
  overdue: 0,
  today: 1,
  upcoming: 2
};

const KIND_ORDER: Record<OperationalAlertKind, number> = {
  call_reminder: 0,
  appointment_guardian_message: 1,
  appointment_start: 2
};

const KIND_LABELS: Record<OperationalAlertKind, string> = {
  call_reminder: "Arama hatırlatması",
  appointment_guardian_message: "Veli mesajı hatırlatması",
  appointment_start: "Randevu zamanı"
};

function isValidDate(value?: string | null): value is string {
  return Boolean(value?.trim()) && !Number.isNaN(new Date(value!).getTime());
}

function isPositiveInteger(value?: number | null): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
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

function pickGuardian(guardians: GuardianRecord[], guardianId?: number | null): GuardianRecord | undefined {
  const sortedGuardians = [...guardians].sort(
    (left, right) => left.created_at.localeCompare(right.created_at) || (left.id ?? 0) - (right.id ?? 0)
  );

  return (isPositiveInteger(guardianId) ? sortedGuardians.find((guardian) => guardian.id === guardianId) : undefined) ?? sortedGuardians[0];
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

function createItemBase(
  identity: string,
  kind: OperationalAlertKind,
  sourceType: OperationalAlertSourceType,
  sourceId: number,
  student: StudentRecord,
  guardian: GuardianRecord | undefined,
  dueAt: string,
  now: string,
  phones: PhoneRecord[],
  latestCallLog?: CallLogRecord
): Omit<OperationalAlertItem, "title" | "note" | "phone_context_label" | "phone_context_number"> {
  const bucket = classifyReminderTask(dueAt, now);
  const pickedPhones = pickPhones(phones);

  return {
    identity,
    kind,
    source_type: sourceType,
    source_id: sourceId,
    student_id: student.id!,
    student_full_name: student.student_full_name,
    guardian_full_name: guardian?.guardian_full_name ?? null,
    due_at: dueAt,
    bucket,
    bucket_label: BUCKET_LABELS[bucket],
    due_date_label: formatReminderTaskDate(dueAt),
    due_time_label: formatReminderTaskTime(dueAt),
    phone_1: pickedPhones.phone_1,
    phone_2: pickedPhones.phone_2,
    last_call_result: latestCallLog?.call_result ?? student.last_call_result ?? null,
    last_call_result_label: getCallResultLabel(latestCallLog?.call_result ?? student.last_call_result),
    note_preview: null
  };
}

function isModernPendingAppointment(
  appointment: AppointmentRecord,
  student: StudentRecord | undefined,
  owner: CallLogRecord | undefined
): boolean {
  return Boolean(
    !appointment.deleted_at &&
      appointment.status === "pending" &&
      isPositiveInteger(appointment.id) &&
      isPositiveInteger(appointment.call_log_id) &&
      isPositiveInteger(appointment.guardian_message_generation) &&
      student &&
      !student.deleted_at &&
      owner &&
      !owner.deleted_at &&
      owner.student_id === appointment.student_id &&
      owner.call_result === "appointment" &&
      owner.created_appointment_id === appointment.id
  );
}

export function getOperationalAlertKindLabel(kind: OperationalAlertKind): string {
  return KIND_LABELS[kind];
}

export function getOperationalAlertDismissalKey(alert: Pick<OperationalAlertItem, "identity">): string {
  return alert.identity;
}

export function dismissOperationalAlert(
  dismissedOperationalAlertKeys: string[],
  alert: Pick<OperationalAlertItem, "identity">
): string[] {
  return [...new Set([...dismissedOperationalAlertKeys, getOperationalAlertDismissalKey(alert)])];
}

export function dismissOperationalAlerts(
  dismissedOperationalAlertKeys: string[],
  alerts: Array<Pick<OperationalAlertItem, "identity">>
): string[] {
  return [...new Set([...dismissedOperationalAlertKeys, ...alerts.map(getOperationalAlertDismissalKey)])];
}

export function filterDismissedOperationalAlerts(
  alerts: OperationalAlertItem[],
  dismissedOperationalAlertKeys: string[],
  popupEnabled = true
): OperationalAlertItem[] {
  if (!popupEnabled) {
    return [];
  }

  const dismissed = new Set(dismissedOperationalAlertKeys);

  return alerts.filter((alert) => !dismissed.has(alert.identity));
}

export function createOperationalAlertSummary(rows: OperationalAlertItem[]): OperationalAlertSummary {
  return rows.reduce<OperationalAlertSummary>(
    (summary, row) => ({ ...summary, [row.bucket]: summary[row.bucket] + 1, all: summary.all + 1 }),
    { overdue: 0, today: 0, upcoming: 0, all: 0 }
  );
}

export function filterOperationalAlertItems(
  rows: OperationalAlertItem[],
  filter: OperationalAlertFilter
): OperationalAlertItem[] {
  return filter === "all" ? rows : rows.filter((row) => row.bucket === filter);
}

export async function readOperationalAlertItems(
  now: string = new Date().toISOString(),
  database: AppDatabase = db
): Promise<OperationalAlertItem[]> {
  const [reminders, appointments, students, guardians, phones, callLogs] = await Promise.all([
    database.reminders.toArray(),
    database.appointments.toArray(),
    database.students.toArray(),
    database.guardians.toArray(),
    database.phones.toArray(),
    database.call_logs.toArray()
  ]);
  const activeStudents = new Map(
    students.filter((student) => !student.deleted_at && isPositiveInteger(student.id)).map((student) => [student.id!, student])
  );
  const activeGuardiansByStudent = new Map<number, GuardianRecord[]>();
  const activePhonesByStudent = new Map<number, PhoneRecord[]>();
  const activeCallLogsByStudent = new Map<number, CallLogRecord[]>();
  const activeCallLogsById = new Map<number, CallLogRecord>();

  for (const guardian of guardians.filter((guardian) => !guardian.deleted_at)) {
    activeGuardiansByStudent.set(guardian.student_id, [...(activeGuardiansByStudent.get(guardian.student_id) ?? []), guardian]);
  }

  for (const phone of phones.filter((phone) => !phone.deleted_at)) {
    activePhonesByStudent.set(phone.student_id, [...(activePhonesByStudent.get(phone.student_id) ?? []), phone]);
  }

  for (const callLog of callLogs.filter((callLog) => !callLog.deleted_at)) {
    activeCallLogsByStudent.set(callLog.student_id, [...(activeCallLogsByStudent.get(callLog.student_id) ?? []), callLog]);
    if (isPositiveInteger(callLog.id)) {
      activeCallLogsById.set(callLog.id, callLog);
    }
  }

  const createContext = (studentId: number, guardianId?: number | null) => {
    const student = activeStudents.get(studentId);
    const guardiansForStudent = activeGuardiansByStudent.get(studentId) ?? [];
    const phonesForStudent = activePhonesByStudent.get(studentId) ?? [];
    const latestCallLog = [...(activeCallLogsByStudent.get(studentId) ?? [])].sort(compareCallLogDesc)[0];

    return {
      student,
      guardian: pickGuardian(guardiansForStudent, guardianId),
      phones: phonesForStudent,
      latestCallLog
    };
  };

  const items: OperationalAlertItem[] = [];

  for (const reminder of reminders) {
    if (
      reminder.deleted_at ||
      reminder.status !== "pending" ||
      reminder.reminder_type !== "call" ||
      !isPositiveInteger(reminder.id) ||
      !isValidDate(reminder.reminder_at)
    ) {
      continue;
    }

    const context = createContext(reminder.student_id);
    if (!context.student) {
      continue;
    }

    const base = createItemBase(
      `${reminder.id}|${reminder.reminder_at}`,
      "call_reminder",
      "reminder",
      reminder.id,
      context.student,
      context.guardian,
      reminder.reminder_at,
      now,
      context.phones,
      context.latestCallLog
    );
    const phoneContextLabel = createPhoneSnapshotDisplayLabel(reminder.phone_snapshot, "") || null;

    items.push({
      ...base,
      title: KIND_LABELS.call_reminder,
      note: reminder.note ?? null,
      note_preview: createNotePreview(reminder.note, context.latestCallLog?.note),
      phone_context_label: phoneContextLabel,
      phone_context_number: reminder.phone_snapshot?.phone_number?.trim() || null
    });
  }

  for (const appointment of appointments) {
    const student = activeStudents.get(appointment.student_id);
    const owner = isPositiveInteger(appointment.call_log_id) ? activeCallLogsById.get(appointment.call_log_id) : undefined;

    if (!isModernPendingAppointment(appointment, student, owner) || !student) {
      continue;
    }

    const context = createContext(appointment.student_id, appointment.guardian_id);
    const addAppointmentItem = (kind: OperationalAlertKind, dueAt: string) => {
      const base = createItemBase(
        kind === "appointment_guardian_message"
          ? `appointment_guardian_message|${appointment.id}|${appointment.guardian_message_generation}|${dueAt}`
          : `appointment_start|${appointment.id}|${dueAt}`,
        kind,
        "appointment",
        appointment.id!,
        student,
        context.guardian,
        dueAt,
        now,
        context.phones,
        owner
      );

      items.push({
        ...base,
        title: KIND_LABELS[kind],
        note: appointment.note ?? null,
        note_preview: createNotePreview(appointment.note, owner?.note),
        phone_context_label: null,
        phone_context_number: null
      });
    };

    if (appointment.guardian_message_sent_at === null && isValidDate(appointment.guardian_message_due_at)) {
      addAppointmentItem("appointment_guardian_message", appointment.guardian_message_due_at);
    }

    if (isValidDate(appointment.appointment_at)) {
      addAppointmentItem("appointment_start", appointment.appointment_at);
    }
  }

  return items.sort(
    (left, right) =>
      BUCKET_ORDER[left.bucket] - BUCKET_ORDER[right.bucket] ||
      left.due_at.localeCompare(right.due_at) ||
      KIND_ORDER[left.kind] - KIND_ORDER[right.kind] ||
      left.identity.localeCompare(right.identity)
  );
}

export async function readDueOperationalAlerts(
  now: string = new Date().toISOString(),
  database: AppDatabase = db
): Promise<OperationalAlertItem[]> {
  const alerts = await readOperationalAlertItems(now, database);

  return alerts.filter((alert) => alert.due_at <= now);
}
