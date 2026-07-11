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
