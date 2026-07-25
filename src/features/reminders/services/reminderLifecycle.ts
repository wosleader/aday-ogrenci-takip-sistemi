import type { AppDatabase } from "../../../db/db";
import { db } from "../../../db/db";
import type { ReminderStatus } from "../../../domain/constants/statuses";
import type { CallLogRecord } from "../../../domain/models/callLog";
import type { ReminderRecord } from "../../../domain/models/reminder";
import { nowIso } from "../../../utils/dateTime";

export type CompleteReminderResult = {
  reminder_id: number;
  previous_status: ReminderStatus;
  status: ReminderStatus;
  completed: boolean;
};

export type UpdatePendingReminderInput = {
  reminder_at: string;
  note?: string | null;
  performed_by?: string | null;
};

export type UpdatePendingReminderResult = {
  reminder_id: number;
  student_id: number;
  reminder_at: string;
  note: string | null;
  status: "pending";
};

export type CancelPendingLinkedCallReminderInput = {
  owner_call_log_id: number;
  cancellation_reason?: string | null;
  performed_by?: string | null;
};

export type CancelPendingLinkedCallReminderResult = {
  reminder_id: number;
  student_id: number;
  owner_call_log_id: number;
  previous_status: "pending";
  status: "cancelled";
  cancellation_reason: string | null;
};

type ActiveReminder = ReminderRecord & { id: number; call_log_id: number };
type ActiveCallLog = CallLogRecord & { id: number };

export type LinkedCallReminderOwnerCandidate = Pick<
  CallLogRecord,
  "id" | "student_id" | "created_reminder_id" | "deleted_at"
>;

export type LinkedCallReminderCandidate = Pick<ReminderRecord, "id" | "student_id" | "call_log_id">;

export type LinkedCallReminderOwnershipCandidate = Pick<
  ReminderRecord,
  "id" | "call_log_id" | "status" | "deleted_at"
>;

export type LinkedCallReminderOwnerResolution = {
  owner_call_log_id: number;
  ownership: "modern" | "legacy";
};

/**
 * Resolves only an unambiguous owner relationship for cancellation. The
 * reminder's call_log_id is authoritative; other call-log references may be
 * historical. Legacy records may omit the back-link, but must not have an
 * active reminder rival for the same owner.
 */
export function resolveLinkedCallReminderOwner(
  reminder: LinkedCallReminderCandidate,
  callLogs: readonly LinkedCallReminderOwnerCandidate[],
  reminders: readonly LinkedCallReminderOwnershipCandidate[]
): LinkedCallReminderOwnerResolution | null {
  if (!reminder.id || !reminder.call_log_id) {
    return null;
  }

  const ownerCallLog = callLogs.find((callLog) => callLog.id === reminder.call_log_id);

  if (!ownerCallLog?.id || ownerCallLog.deleted_at || ownerCallLog.student_id !== reminder.student_id) {
    return null;
  }

  const activeOwnerReminderCandidates = reminders.filter(
    (candidate) =>
      candidate.id &&
      !candidate.deleted_at &&
      candidate.status === "pending" &&
      candidate.call_log_id === ownerCallLog.id
  );

  if (
    activeOwnerReminderCandidates.length !== 1 ||
    activeOwnerReminderCandidates[0]?.id !== reminder.id
  ) {
    return null;
  }

  if (ownerCallLog.created_reminder_id === reminder.id) {
    return { owner_call_log_id: ownerCallLog.id, ownership: "modern" };
  }

  if (ownerCallLog.created_reminder_id == null) {
    return { owner_call_log_id: ownerCallLog.id, ownership: "legacy" };
  }

  return null;
}

function assertValidReminderAt(value: string): void {
  if (!value.trim() || Number.isNaN(new Date(value).getTime())) {
    throw new Error("Hatırlatma tarih/saat bilgisi geçersiz.");
  }
}

async function readPendingCallReminderOwnerCandidate(
  reminderId: number,
  database: AppDatabase
): Promise<{ reminder: ActiveReminder; ownerCallLog: ActiveCallLog }> {
  const reminder = await database.reminders.get(reminderId);

  if (!reminder?.id) {
    throw new Error("Güncellenecek hatırlatma bulunamadı.");
  }

  if (reminder.deleted_at) {
    throw new Error("Silinmiş hatırlatma güncellenemez.");
  }

  if (reminder.status !== "pending") {
    throw new Error("Yalnızca açık hatırlatmalar güncellenebilir.");
  }

  if (reminder.reminder_type !== "call") {
    throw new Error("Yalnızca arama hatırlatmaları bu ekrandan güncellenebilir.");
  }

  if (!reminder.call_log_id) {
    throw new Error("Hatırlatmanın bağlı görüşme kaydı bulunamadı.");
  }

  const ownerCallLog = await database.call_logs.get(reminder.call_log_id);

  if (
    !ownerCallLog?.id ||
    ownerCallLog.deleted_at ||
    ownerCallLog.student_id !== reminder.student_id
  ) {
    throw new Error("Hatırlatmanın bağlı görüşme kaydı güncellenemedi.");
  }

  return {
    reminder: reminder as ActiveReminder,
    ownerCallLog: ownerCallLog as ActiveCallLog
  };
}

async function readPendingLinkedCallReminder(
  reminderId: number,
  database: AppDatabase
): Promise<{ reminder: ActiveReminder; ownerCallLog: ActiveCallLog }> {
  const linkedReminder = await readPendingCallReminderOwnerCandidate(reminderId, database);

  if (linkedReminder.ownerCallLog.created_reminder_id !== linkedReminder.reminder.id) {
    throw new Error("Hatırlatmanın bağlı görüşme kaydı güncellenemedi.");
  }

  return linkedReminder;
}

export async function updatePendingReminder(
  reminderId: number,
  input: UpdatePendingReminderInput,
  database: AppDatabase = db
): Promise<UpdatePendingReminderResult> {
  let result: UpdatePendingReminderResult | undefined;

  assertValidReminderAt(input.reminder_at);

  await database.transaction("rw", [database.reminders, database.call_logs, database.audit_logs], async () => {
    const { reminder, ownerCallLog } = await readPendingLinkedCallReminder(reminderId, database);

    const timestamp = nowIso();
    const note = input.note?.trim() || null;

    await database.reminders.update(reminder.id, {
      reminder_at: input.reminder_at,
      note,
      updated_at: timestamp
    });

    await database.call_logs.update(ownerCallLog.id, {
      note
    });

    await database.audit_logs.add({
      entity_type: "reminder",
      entity_id: reminder.id,
      action_type: "update",
      field_name: "pending_reminder_edit",
      old_value: JSON.stringify({
        reminder_at: reminder.reminder_at,
        note: reminder.note ?? null,
        owner_call_log_id: reminder.call_log_id
      }),
      new_value: JSON.stringify({
        reminder_at: input.reminder_at,
        note,
        owner_call_log_id: reminder.call_log_id
      }),
      note: "Açık arama hatırlatmasının tarih/saat veya not bilgisi güncellendi.",
      performed_by: input.performed_by ?? "agent",
      created_at: timestamp
    });

    result = {
      reminder_id: reminder.id,
      student_id: reminder.student_id,
      reminder_at: input.reminder_at,
      note,
      status: "pending"
    };
  });

  if (!result) {
    throw new Error("Hatırlatma güncellenemedi.");
  }

  return result;
}

export async function cancelPendingLinkedCallReminder(
  reminderId: number,
  input: CancelPendingLinkedCallReminderInput,
  database: AppDatabase = db
): Promise<CancelPendingLinkedCallReminderResult> {
  let result: CancelPendingLinkedCallReminderResult | undefined;

  await database.transaction("rw", [database.reminders, database.call_logs, database.audit_logs], async () => {
    const { reminder, ownerCallLog } = await readPendingCallReminderOwnerCandidate(reminderId, database);

    if (input.owner_call_log_id !== ownerCallLog.id) {
      throw new Error("Hatırlatma yalnız güncel sahibi olan görüşme satırından iptal edilebilir.");
    }

    const reminderCandidates = await database.reminders.toArray();
    const ownership = resolveLinkedCallReminderOwner(
      reminder,
      [ownerCallLog],
      reminderCandidates
    );

    if (!ownership || ownership.owner_call_log_id !== ownerCallLog.id) {
      throw new Error("Hatırlatmanın bağlı görüşme kaydı çelişkili.");
    }

    const timestamp = nowIso();
    const cancellationReason = input.cancellation_reason?.trim() || null;

    await database.reminders.update(reminder.id, {
      status: "cancelled",
      updated_at: timestamp
    });

    await database.audit_logs.add({
      entity_type: "reminder",
      entity_id: reminder.id,
      action_type: "update",
      field_name: "pending_reminder_cancel",
      old_value: JSON.stringify({
        reminder_id: reminder.id,
        student_id: reminder.student_id,
        owner_call_log_id: ownerCallLog.id,
        previous_status: "pending",
        reminder_at: reminder.reminder_at
      }),
      new_value: JSON.stringify({
        reminder_id: reminder.id,
        student_id: reminder.student_id,
        owner_call_log_id: ownerCallLog.id,
        new_status: "cancelled",
        reminder_at: reminder.reminder_at,
        cancellation_reason: cancellationReason
      }),
      note: "Açık arama hatırlatması iptal edildi.",
      performed_by: input.performed_by ?? "agent",
      created_at: timestamp
    });

    result = {
      reminder_id: reminder.id,
      student_id: reminder.student_id,
      owner_call_log_id: ownerCallLog.id,
      previous_status: "pending",
      status: "cancelled",
      cancellation_reason: cancellationReason
    };
  });

  if (!result) {
    throw new Error("Hatırlatma iptal edilemedi.");
  }

  return result;
}

export async function completeReminder(
  reminderId: number,
  database: AppDatabase = db
): Promise<CompleteReminderResult> {
  let result: CompleteReminderResult | undefined;

  await database.transaction("rw", [database.reminders], async () => {
    const reminder = await database.reminders.get(reminderId);

    if (!reminder?.id) {
      throw new Error("Tamamlanacak hatırlatma bulunamadı.");
    }

    if (reminder.deleted_at) {
      throw new Error("Silinmiş hatırlatma tamamlanamaz.");
    }

    if (reminder.status !== "pending") {
      result = {
        reminder_id: reminder.id,
        previous_status: reminder.status,
        status: reminder.status,
        completed: false
      };
      return;
    }

    const timestamp = nowIso();
    await database.reminders.update(reminder.id, {
      status: "completed",
      updated_at: timestamp
    });

    result = {
      reminder_id: reminder.id,
      previous_status: "pending",
      status: "completed",
      completed: true
    };
  });

  if (!result) {
    throw new Error("Hatırlatma tamamlanamadı.");
  }

  return result;
}
