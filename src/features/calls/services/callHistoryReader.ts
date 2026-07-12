import type { AppDatabase } from "../../../db/db";
import { db } from "../../../db/db";
import { CALL_RESULTS, type ReminderStatus } from "../../../domain/constants/statuses";
import { createPhoneSnapshotDisplayLabel } from "./callLogPhoneContext";

export type CallHistoryItem = {
  call_log_id: number;
  student_id: number;
  phone_id?: number | null;
  phone_snapshot_phone_id?: number | null;
  contacted_phone_id?: number | null;
  call_time: string;
  call_result: string;
  call_result_label: string;
  contacted_phone_label?: string | null;
  contacted_phone_number?: string | null;
  phone_context_label?: string | null;
  phone_context_number?: string | null;
  note?: string | null;
  reminder_at?: string | null;
  linked_reminder_id?: number | null;
  linked_reminder_status?: ReminderStatus | null;
  linked_reminder_at?: string | null;
  canCompleteLinkedReminder: boolean;
  created_by?: string | null;
};

type LinkedCallLogCandidate = {
  id?: number;
  created_reminder_id?: number | null;
  call_time?: string | null;
  created_at: string;
  deleted_at?: string | null;
};

type LinkedReminderCandidate = {
  id?: number;
  call_log_id?: number | null;
  deleted_at?: string | null;
};

function resolveCallLogSortTime(log: Pick<LinkedCallLogCandidate, "call_time" | "created_at">) {
  return log.call_time?.trim() || log.created_at;
}

function compareLatestCallLog(left: LinkedCallLogCandidate, right: LinkedCallLogCandidate) {
  return resolveCallLogSortTime(right).localeCompare(resolveCallLogSortTime(left)) || (right.id ?? 0) - (left.id ?? 0);
}

function createReminderOwnerCallLogIds(
  logs: LinkedCallLogCandidate[],
  remindersById: Map<number, LinkedReminderCandidate>
) {
  const activeLogs = logs.filter((log) => !log.deleted_at && log.id);
  const activeLogIds = new Set(activeLogs.map((log) => log.id!));
  const logsByReminderId = new Map<number, LinkedCallLogCandidate[]>();

  for (const log of activeLogs) {
    if (!log.created_reminder_id) {
      continue;
    }

    const reminderLogs = logsByReminderId.get(log.created_reminder_id) ?? [];
    reminderLogs.push(log);
    logsByReminderId.set(log.created_reminder_id, reminderLogs);
  }

  const ownerCallLogIds = new Map<number, number>();

  for (const [reminderId, reminderLogs] of logsByReminderId) {
    const reminder = remindersById.get(reminderId);
    const reminderOwnerCallLogId = reminder && !reminder.deleted_at ? reminder.call_log_id ?? null : null;

    if (reminderOwnerCallLogId && activeLogIds.has(reminderOwnerCallLogId)) {
      ownerCallLogIds.set(reminderId, reminderOwnerCallLogId);
      continue;
    }

    const fallbackOwner = [...reminderLogs].sort(compareLatestCallLog)[0];
    if (fallbackOwner?.id) {
      ownerCallLogIds.set(reminderId, fallbackOwner.id);
    }
  }

  return ownerCallLogIds;
}

export async function readCallHistoryForStudent(
  studentId: number,
  database: AppDatabase = db
): Promise<CallHistoryItem[]> {
  const logs = await database.call_logs.where("student_id").equals(studentId).toArray();
  const reminderIds = [
    ...new Set(
      logs.flatMap((log) => (log.created_reminder_id && !log.deleted_at ? [log.created_reminder_id] : []))
    )
  ];
  const linkedReminders = await Promise.all(reminderIds.map((reminderId) => database.reminders.get(reminderId)));
  const remindersById = new Map(linkedReminders.flatMap((reminder) => (reminder?.id ? [[reminder.id, reminder]] : [])));
  const reminderOwnerCallLogIds = createReminderOwnerCallLogIds(logs, remindersById);

  return logs
    .filter((log) => !log.deleted_at && log.id)
    .sort((left, right) => right.call_time.localeCompare(left.call_time) || (right.id ?? 0) - (left.id ?? 0))
    .map((log) => {
      const snapshotLabel = createPhoneSnapshotDisplayLabel(log.phone_snapshot, "");
      const snapshotNumber = log.phone_snapshot?.phone_number?.trim() || null;
      const legacyLabel = log.contacted_phone_label?.trim() || null;
      const legacyNumber = log.contacted_phone_number?.trim() || null;
      const linkedReminder = log.created_reminder_id ? remindersById.get(log.created_reminder_id) : null;
      const activeLinkedReminder = linkedReminder && !linkedReminder.deleted_at ? linkedReminder : null;
      const linkedReminderOwnerCallLogId = log.created_reminder_id
        ? reminderOwnerCallLogIds.get(log.created_reminder_id)
        : null;

      return {
        call_log_id: log.id!,
        student_id: log.student_id,
        phone_id: log.phone_id ?? null,
        phone_snapshot_phone_id: log.phone_snapshot?.phone_id ?? null,
        contacted_phone_id: log.contacted_phone_id ?? null,
        call_time: log.call_time,
        call_result: log.call_result,
        call_result_label: CALL_RESULTS[log.call_result] ?? log.call_result,
        contacted_phone_label: log.contacted_phone_label ?? null,
        contacted_phone_number: log.contacted_phone_number ?? null,
        phone_context_label: snapshotLabel || legacyLabel,
        phone_context_number: snapshotNumber || legacyNumber,
        note: log.note ?? null,
        reminder_at: log.reminder_at ?? null,
        linked_reminder_id: log.created_reminder_id ?? null,
        linked_reminder_status: activeLinkedReminder?.status ?? null,
        linked_reminder_at: activeLinkedReminder?.reminder_at ?? log.reminder_at ?? null,
        canCompleteLinkedReminder: activeLinkedReminder?.status === "pending" && linkedReminderOwnerCallLogId === log.id,
        created_by: log.created_by ?? "system"
      };
    });
}
