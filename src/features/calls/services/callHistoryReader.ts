import type { AppDatabase } from "../../../db/db";
import { db } from "../../../db/db";
import type { AuditLogRecord } from "../../../domain/models/auditLog";
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
  linked_reminder_note?: string | null;
  linked_reminder_last_edited_at?: string | null;
  linked_reminder_previous_at?: string | null;
  linked_reminder_previous_note?: string | null;
  linked_reminder_last_editor?: string | null;
  canCompleteLinkedReminder: boolean;
  canEditLinkedReminder: boolean;
  created_by?: string | null;
};

type LinkedCallLogCandidate = {
  id?: number;
  created_reminder_id?: number | null;
  deleted_at?: string | null;
};

type LinkedReminderCandidate = {
  id?: number;
  call_log_id?: number | null;
  reminder_type?: string;
  deleted_at?: string | null;
};

type PendingReminderEditAuditValue = {
  reminder_at?: unknown;
  note?: unknown;
  owner_call_log_id?: unknown;
};

type LatestReminderEditAudit = {
  created_at: string;
  previous_at: string | null;
  previous_note: string | null;
  last_editor: string | null;
};

function parsePendingReminderEditAuditValue(value?: string | null): PendingReminderEditAuditValue | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as unknown;

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }

    return parsed as PendingReminderEditAuditValue;
  } catch {
    return null;
  }
}

function toNullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function toNullableNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

const HIDDEN_ACTOR_LABELS = new Set(["agent", "system", "unknown"]);

export function normalizeVisibleActorLabel(value?: string | null): string | null {
  const label = value?.trim();

  if (!label || HIDDEN_ACTOR_LABELS.has(label.toLowerCase())) {
    return null;
  }

  return label;
}

function isLaterAudit(left: AuditLogRecord, right?: AuditLogRecord): boolean {
  if (!right) {
    return true;
  }

  return left.created_at.localeCompare(right.created_at) > 0 ||
    (left.created_at === right.created_at && (left.id ?? 0) > (right.id ?? 0));
}

function createReminderOwnerCallLogIds(
  logs: LinkedCallLogCandidate[],
  remindersById: Map<number, LinkedReminderCandidate>
) {
  const activeLogs = logs.filter((log) => !log.deleted_at && log.id);
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

    if (reminderOwnerCallLogId && reminderLogs.some((log) => log.id === reminderOwnerCallLogId)) {
      ownerCallLogIds.set(reminderId, reminderOwnerCallLogId);
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
  const linkedReminders = reminderIds.length ? await database.reminders.bulkGet(reminderIds) : [];
  const remindersById = new Map(linkedReminders.flatMap((reminder) => (reminder?.id ? [[reminder.id, reminder]] : [])));
  const reminderOwnerCallLogIds = createReminderOwnerCallLogIds(logs, remindersById);
  const reminderIdsSet = new Set(reminderIds);
  const reminderEditAudits = new Map<number, LatestReminderEditAudit>();

  if (reminderIdsSet.size > 0) {
    const auditLogs = await database.audit_logs.where("entity_id").anyOf(reminderIds).toArray();
    const latestAuditLogs = new Map<number, AuditLogRecord>();

    for (const auditLog of auditLogs) {
      if (
        auditLog.entity_type !== "reminder" ||
        auditLog.action_type !== "update" ||
        auditLog.field_name !== "pending_reminder_edit" ||
        typeof auditLog.entity_id !== "number" ||
        !reminderIdsSet.has(auditLog.entity_id)
      ) {
        continue;
      }

      const oldValue = parsePendingReminderEditAuditValue(auditLog.old_value);
      const newValue = parsePendingReminderEditAuditValue(auditLog.new_value);
      const linkedReminder = remindersById.get(auditLog.entity_id);

      if (
        !oldValue ||
        (auditLog.new_value != null && !newValue) ||
        !linkedReminder ||
        linkedReminder.deleted_at ||
        linkedReminder.reminder_type !== "call"
      ) {
        continue;
      }

      const oldOwnerCallLogId = toNullableNumber(oldValue?.owner_call_log_id);
      const newOwnerCallLogId = toNullableNumber(newValue?.owner_call_log_id);
      const reminderOwnerCallLogId = reminderOwnerCallLogIds.get(auditLog.entity_id) ?? null;

      if (!reminderOwnerCallLogId) {
        continue;
      }

      const hasOwnerMismatch =
        (oldOwnerCallLogId != null && oldOwnerCallLogId !== reminderOwnerCallLogId) ||
        (newOwnerCallLogId != null && newOwnerCallLogId !== reminderOwnerCallLogId);

      if (hasOwnerMismatch) {
        continue;
      }

      const currentLatest = latestAuditLogs.get(auditLog.entity_id);
      if (isLaterAudit(auditLog, currentLatest)) {
        latestAuditLogs.set(auditLog.entity_id, auditLog);
      }
    }

    for (const [reminderId, auditLog] of latestAuditLogs) {
      const oldValue = parsePendingReminderEditAuditValue(auditLog.old_value);

      reminderEditAudits.set(reminderId, {
        created_at: auditLog.created_at,
        previous_at: toNullableString(oldValue?.reminder_at),
        previous_note: toNullableString(oldValue?.note),
        last_editor: normalizeVisibleActorLabel(auditLog.performed_by)
      });
    }
  }

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
      const isLinkedReminderOwner =
        activeLinkedReminder?.reminder_type === "call" &&
        activeLinkedReminder.id === log.created_reminder_id &&
        activeLinkedReminder.call_log_id === log.id &&
        linkedReminderOwnerCallLogId === log.id;
      const isPendingLinkedReminderOwner =
        activeLinkedReminder?.status === "pending" && isLinkedReminderOwner;
      const canEditLinkedReminder = isPendingLinkedReminderOwner && !log.created_appointment_id;
      const reminderEditAudit =
        isLinkedReminderOwner && !log.created_appointment_id && log.created_reminder_id
          ? reminderEditAudits.get(log.created_reminder_id) ?? null
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
        linked_reminder_note: activeLinkedReminder?.note ?? null,
        linked_reminder_last_edited_at: reminderEditAudit?.created_at ?? null,
        linked_reminder_previous_at: reminderEditAudit?.previous_at ?? null,
        linked_reminder_previous_note: reminderEditAudit?.previous_note ?? null,
        linked_reminder_last_editor: reminderEditAudit?.last_editor ?? null,
        canCompleteLinkedReminder: isPendingLinkedReminderOwner,
        canEditLinkedReminder,
        created_by: normalizeVisibleActorLabel(log.created_by)
      };
    });
}
