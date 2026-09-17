import type { AppDatabase } from "../../../db/db";
import { db } from "../../../db/db";
import type { ReminderRecord } from "../../../domain/models/reminder";
import { createPhoneSnapshotDisplayLabel } from "../../calls/services/callLogPhoneContext";
import {
  classifyReminderTask,
  formatReminderTaskDate,
  formatReminderTaskTime,
  type ReminderTaskBucket
} from "../../reminders/services/reminderListReader";

export type StudentOperationalHelperKind = "overdue_call" | "today_call";

export type StudentOperationalHelperReminder = {
  reminder_id: number;
  reminder_at: string;
  bucket: Exclude<ReminderTaskBucket, "upcoming">;
  reminder_date_label: string;
  reminder_time_label: string;
  phone_context_label: string | null;
  phone_context_number: string | null;
};

export type StudentOperationalHelper = {
  kind: StudentOperationalHelperKind;
  primary_label: string;
  display_label: string;
  reminder: StudentOperationalHelperReminder;
};

export type ResolveStudentOperationalHelperInput = {
  reminders: ReminderRecord[];
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

export function resolveStudentOperationalHelper({
  reminders,
  now = new Date().toISOString()
}: ResolveStudentOperationalHelperInput): StudentOperationalHelper | null {
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

  if (!activeBucket) {
    return null;
  }

  const reminderContext = createReminderContext(reminder, activeBucket);
  const primaryLabel = activeBucket === "overdue" ? "Gecikmiş arama" : "Bugün aranacak";
  const displayLabel =
    activeBucket === "overdue"
      ? `${primaryLabel} · ${reminderContext.reminder_date_label} ${reminderContext.reminder_time_label}`
      : `Bugün ${reminderContext.reminder_time_label}'te aranacak`;

  return {
    kind: activeBucket === "overdue" ? "overdue_call" : "today_call",
    primary_label: primaryLabel,
    display_label: displayLabel,
    reminder: reminderContext
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

  return resolveStudentOperationalHelper({ reminders, now });
}
