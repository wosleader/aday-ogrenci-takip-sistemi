import type { AppDatabase } from "../../../db/db";
import { db } from "../../../db/db";
import type { AppointmentRecord } from "../../../domain/models/appointment";
import type { CallLogRecord } from "../../../domain/models/callLog";
import type { ReminderRecord } from "../../../domain/models/reminder";
import { createPhoneSnapshotDisplayLabel } from "../../calls/services/callLogPhoneContext";
import { getIstanbulAppointmentInputValues } from "../../appointments/services/guardianMessageDueTime";
import {
  classifyReminderTask,
  formatReminderTaskDate,
  formatReminderTaskTime,
  type ReminderTaskBucket
} from "../../reminders/services/reminderListReader";

export type StudentOperationalHelperKind =
  | "overdue_appointment"
  | "overdue_call"
  | "today_appointment"
  | "today_call";

export type StudentOperationalHelperReminder = {
  reminder_id: number;
  reminder_at: string;
  bucket: Exclude<ReminderTaskBucket, "upcoming">;
  reminder_date_label: string;
  reminder_time_label: string;
  phone_context_label: string | null;
  phone_context_number: string | null;
};

export type StudentOperationalHelperAppointment = {
  appointment_id: number;
  appointment_at: string;
  bucket: Exclude<ReminderTaskBucket, "upcoming">;
  appointment_date_label: string;
  appointment_time_label: string;
};

export type StudentOperationalHelper = {
  kind: StudentOperationalHelperKind;
  primary_label: string;
  display_label: string;
  reminder?: StudentOperationalHelperReminder;
  appointment?: StudentOperationalHelperAppointment;
};

export type ResolveStudentOperationalHelperInput = {
  reminders: ReminderRecord[];
  appointments?: AppointmentRecord[];
  call_logs?: CallLogRecord[];
  now?: string;
};

const REMINDER_BUCKET_ORDER: Record<Exclude<ReminderTaskBucket, "upcoming">, number> = {
  overdue: 0,
  today: 1
};

function isActivePendingCallReminder(reminder: ReminderRecord): boolean {
  return Boolean(
    reminder.id &&
      !reminder.deleted_at &&
      reminder.status === "pending" &&
      reminder.reminder_type === "call"
  );
}

function compareReminderCandidates(left: ReminderRecord, right: ReminderRecord, now: string): number {
  const leftBucket = classifyReminderTask(left.reminder_at, now);
  const rightBucket = classifyReminderTask(right.reminder_at, now);

  return (
    REMINDER_BUCKET_ORDER[leftBucket as Exclude<ReminderTaskBucket, "upcoming">] -
      REMINDER_BUCKET_ORDER[rightBucket as Exclude<ReminderTaskBucket, "upcoming">] ||
    left.reminder_at.localeCompare(right.reminder_at) ||
    (left.id ?? 0) - (right.id ?? 0)
  );
}

function createReminderContext(
  reminder: ReminderRecord,
  bucket: Exclude<ReminderTaskBucket, "upcoming">
): StudentOperationalHelperReminder {
  return {
    reminder_id: reminder.id!,
    reminder_at: reminder.reminder_at,
    bucket,
    reminder_date_label: formatReminderTaskDate(reminder.reminder_at),
    reminder_time_label: formatReminderTaskTime(reminder.reminder_at),
    phone_context_label: createPhoneSnapshotDisplayLabel(reminder.phone_snapshot, "") || null,
    phone_context_number: reminder.phone_snapshot?.phone_number?.trim() || null
  };
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function isValidIsoInstant(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value) &&
    !Number.isNaN(new Date(value).getTime())
  );
}

function formatIstanbulAppointment(appointmentAt: string): { dateLabel: string; timeLabel: string } | null {
  try {
    const { dateValue, timeValue } = getIstanbulAppointmentInputValues(appointmentAt);
    const [year, month, day] = dateValue.split("-");

    return {
      dateLabel: `${day}.${month}.${year}`,
      timeLabel: timeValue
    };
  } catch {
    return null;
  }
}

function classifyIstanbulAppointment(
  appointmentAt: string,
  now: string
): Exclude<ReminderTaskBucket, "upcoming"> | null {
  if (!isValidIsoInstant(appointmentAt) || !isValidIsoInstant(now)) {
    return null;
  }

  const appointmentDate = new Date(appointmentAt);
  const nowDate = new Date(now);

  if (appointmentDate.getTime() < nowDate.getTime()) {
    return "overdue";
  }

  const appointmentDisplay = formatIstanbulAppointment(appointmentAt);
  const nowDisplay = formatIstanbulAppointment(now);

  return appointmentDisplay && nowDisplay && appointmentDisplay.dateLabel === nowDisplay.dateLabel ? "today" : null;
}

function isModernPendingAppointment(
  appointment: AppointmentRecord,
  appointments: AppointmentRecord[],
  callLogs: CallLogRecord[],
  callLogsById: Map<number, CallLogRecord>
): appointment is AppointmentRecord & { id: number; call_log_id: number; guardian_message_generation: number } {
  const owner = isPositiveInteger(appointment.call_log_id) ? callLogsById.get(appointment.call_log_id) : undefined;
  const activeOwnerCount = appointments.filter(
    (candidate) => !candidate.deleted_at && candidate.call_log_id === appointment.call_log_id
  ).length;
  const activeBacklinkCount = callLogs.filter(
    (candidate) => !candidate.deleted_at && candidate.created_appointment_id === appointment.id
  ).length;

  return Boolean(
    !appointment.deleted_at &&
      appointment.status === "pending" &&
      isPositiveInteger(appointment.id) &&
      isPositiveInteger(appointment.call_log_id) &&
      isPositiveInteger(appointment.guardian_message_generation) &&
      isValidIsoInstant(appointment.appointment_at) &&
      isValidIsoInstant(appointment.guardian_message_due_at) &&
      (appointment.guardian_message_sent_at === null || isValidIsoInstant(appointment.guardian_message_sent_at)) &&
      owner &&
      !owner.deleted_at &&
      owner.student_id === appointment.student_id &&
      owner.call_result === "appointment" &&
      owner.created_appointment_id === appointment.id &&
      activeOwnerCount === 1 &&
      activeBacklinkCount === 1
  );
}

function createAppointmentContext(
  appointment: AppointmentRecord & { id: number },
  bucket: Exclude<ReminderTaskBucket, "upcoming">,
  formatted: { dateLabel: string; timeLabel: string }
): StudentOperationalHelperAppointment {
  return {
    appointment_id: appointment.id,
    appointment_at: appointment.appointment_at,
    bucket,
    appointment_date_label: formatted.dateLabel,
    appointment_time_label: formatted.timeLabel
  };
}

function selectAppointment(
  appointments: AppointmentRecord[],
  callLogs: CallLogRecord[],
  now: string
): { appointment: StudentOperationalHelperAppointment; kind: "overdue_appointment" | "today_appointment" } | null {
  const callLogsById = new Map(
    callLogs.flatMap((callLog) => (isPositiveInteger(callLog.id) ? [[callLog.id, callLog] as const] : []))
  );
  const candidates = appointments.flatMap((appointment) => {
    if (!isModernPendingAppointment(appointment, appointments, callLogs, callLogsById)) {
      return [];
    }

    const bucket = classifyIstanbulAppointment(appointment.appointment_at, now);
    const formatted = bucket ? formatIstanbulAppointment(appointment.appointment_at) : null;

    return bucket && formatted ? [{ appointment, bucket, formatted }] : [];
  });

  const overdue = candidates
    .filter((candidate) => candidate.bucket === "overdue")
    .sort((left, right) => left.appointment.appointment_at.localeCompare(right.appointment.appointment_at) || left.appointment.id - right.appointment.id)[0];

  if (overdue) {
    return {
      kind: "overdue_appointment",
      appointment: createAppointmentContext(overdue.appointment, overdue.bucket, overdue.formatted)
    };
  }

  const today = candidates
    .filter((candidate) => candidate.bucket === "today")
    .sort((left, right) => left.appointment.appointment_at.localeCompare(right.appointment.appointment_at) || left.appointment.id - right.appointment.id)[0];

  return today
    ? {
        kind: "today_appointment",
        appointment: createAppointmentContext(today.appointment, today.bucket, today.formatted)
      }
    : null;
}

function selectCallHelper(
  reminders: ReminderRecord[],
  now: string
): { reminder: StudentOperationalHelperReminder; kind: "overdue_call" | "today_call" } | null {
  const reminder = reminders
    .filter(isActivePendingCallReminder)
    .filter((candidate) => {
      const bucket = classifyReminderTask(candidate.reminder_at, now);

      return bucket === "overdue" || bucket === "today";
    })
    .sort((left, right) => compareReminderCandidates(left, right, now))[0];

  if (!reminder) {
    return null;
  }

  const bucket = classifyReminderTask(reminder.reminder_at, now);
  const activeBucket = bucket === "overdue" || bucket === "today" ? bucket : null;

  return activeBucket
    ? { kind: activeBucket === "overdue" ? "overdue_call" : "today_call", reminder: createReminderContext(reminder, activeBucket) }
    : null;
}

export function resolveStudentOperationalHelper({
  reminders,
  appointments = [],
  call_logs = [],
  now = new Date().toISOString()
}: ResolveStudentOperationalHelperInput): StudentOperationalHelper | null {
  const appointmentHelper = selectAppointment(appointments, call_logs, now);
  const callHelper = selectCallHelper(reminders, now);

  if (
    appointmentHelper?.kind === "overdue_appointment" ||
    (appointmentHelper?.kind === "today_appointment" && callHelper?.kind !== "overdue_call")
  ) {
    const primaryLabel = appointmentHelper.kind === "overdue_appointment" ? "Gecikmiş randevu" : "Bugün";

    return {
      kind: appointmentHelper.kind,
      primary_label: primaryLabel,
      display_label:
        appointmentHelper.kind === "overdue_appointment"
          ? `${primaryLabel} · ${appointmentHelper.appointment.appointment_date_label} ${appointmentHelper.appointment.appointment_time_label}`
          : `${primaryLabel} ${appointmentHelper.appointment.appointment_time_label}'da randevu`,
      appointment: appointmentHelper.appointment
    };
  }

  if (!callHelper) {
    return null;
  }

  const primaryLabel = callHelper.kind === "overdue_call" ? "Gecikmiş arama" : "Bugün aranacak";

  return {
    kind: callHelper.kind,
    primary_label: primaryLabel,
    display_label:
      callHelper.kind === "overdue_call"
        ? `${primaryLabel} · ${callHelper.reminder.reminder_date_label} ${callHelper.reminder.reminder_time_label}`
        : `Bugün ${callHelper.reminder.reminder_time_label}'te aranacak`,
    reminder: callHelper.reminder
  };
}

export async function readStudentOperationalHelper(
  studentId: number,
  now: string = new Date().toISOString(),
  database: AppDatabase = db
): Promise<StudentOperationalHelper | null> {
  const [student, reminders] = await Promise.all([
    database.students.get(studentId),
    database.reminders.where("student_id").equals(studentId).toArray()
  ]);

  if (!student || student.deleted_at) {
    return null;
  }

  const [appointments, call_logs] = await Promise.all([
    database.appointments.where("student_id").equals(studentId).toArray(),
    database.call_logs.where("student_id").equals(studentId).toArray()
  ]);

  return resolveStudentOperationalHelper({ reminders, appointments, call_logs, now });
}
