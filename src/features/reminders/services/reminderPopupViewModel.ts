import type { ReminderPopupModel } from "./reminderAlarmReader";

export const DISMISS_FOLLOWING_REMINDERS_LABEL = "Sonraki Bildirimleri Kapat";

export type ReminderPopupViewModel = {
  title: string;
  student_name: string;
  guardian_line?: string;
  reminder_line: string;
};

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}

export function formatReminderPopupDateTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}`;
}

export function createReminderPopupViewModel(model: ReminderPopupModel): ReminderPopupViewModel {
  const alert = model.primaryAlert;

  return {
    title: model.isBulk ? `${model.dueCount} hatırlatma zamanı geldi` : "Tekrar arama zamanı geldi",
    student_name: alert.student_full_name,
    guardian_line: alert.guardian_full_name ? `Veli: ${alert.guardian_full_name}` : undefined,
    reminder_line: `Hatırlatma: ${formatReminderPopupDateTime(alert.reminder_at)}`
  };
}
