import type { AppDatabase } from "../../../db/db";
import { db } from "../../../db/db";
import { classifyReminderTask } from "../../reminders/services/reminderListReader";

export type DashboardReminderHealth = {
  overdue: number;
  today: number;
  upcoming: number;
  openTotal: number;
};

export async function readDashboardReminderHealth(
  now: string | Date = new Date(),
  database: AppDatabase = db
): Promise<DashboardReminderHealth> {
  const nowValue = now instanceof Date ? now.toISOString() : now;
  const pendingReminders = await database.reminders.where("status").equals("pending").toArray();
  const summary: DashboardReminderHealth = { overdue: 0, today: 0, upcoming: 0, openTotal: 0 };

  for (const reminder of pendingReminders) {
    if (reminder.deleted_at || reminder.reminder_type !== "call") {
      continue;
    }

    summary[classifyReminderTask(reminder.reminder_at, nowValue)] += 1;
    summary.openTotal += 1;
  }

  return summary;
}
