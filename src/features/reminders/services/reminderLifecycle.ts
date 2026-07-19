import type { AppDatabase } from "../../../db/db";
import { db } from "../../../db/db";
import type { ReminderStatus } from "../../../domain/constants/statuses";
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

function assertValidReminderAt(value: string): void {
  if (!value.trim() || Number.isNaN(new Date(value).getTime())) {
    throw new Error("Hatırlatma tarih/saat bilgisi geçersiz.");
  }
}

export async function updatePendingReminder(
  reminderId: number,
  input: UpdatePendingReminderInput,
  database: AppDatabase = db
): Promise<UpdatePendingReminderResult> {
  let result: UpdatePendingReminderResult | undefined;

  assertValidReminderAt(input.reminder_at);

  await database.transaction("rw", [database.reminders, database.call_logs, database.audit_logs], async () => {
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
      ownerCallLog.student_id !== reminder.student_id ||
      ownerCallLog.created_reminder_id !== reminder.id
    ) {
      throw new Error("Hatırlatmanın bağlı görüşme kaydı güncellenemedi.");
    }

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
