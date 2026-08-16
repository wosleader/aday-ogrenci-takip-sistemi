import type { ReminderPopupModel } from "./reminderAlarmReader";
import type { OperationalAlertItem } from "./operationalAlertReader";

export const DISMISS_FOLLOWING_REMINDERS_LABEL = "Sonraki Bildirimleri Kapat";

export type ReminderPopupViewModel = {
  title: string;
  student_name: string;
  guardian_line?: string;
  reminder_line: string;
};

export type OperationalAlertPopupViewModel = {
  title: string;
  student_name: string;
  guardian_line?: string;
  due_line: string;
  context_line?: string;
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

export function createOperationalAlertPopupViewModel(
  alert: OperationalAlertItem,
  dueCount: number
): OperationalAlertPopupViewModel {
  const title =
    dueCount > 1
      ? `${dueCount} operasyon bildirimi zamanı geldi`
      : alert.kind === "call_reminder"
        ? "Tekrar arama zamanı geldi"
        : alert.title;

  return {
    title,
    student_name: alert.student_full_name,
    guardian_line: alert.guardian_full_name ? `Veli: ${alert.guardian_full_name}` : undefined,
    due_line: `Zaman: ${formatReminderPopupDateTime(alert.due_at)}`,
    context_line: alert.note_preview ? `Not: ${alert.note_preview}` : undefined
  };
}
