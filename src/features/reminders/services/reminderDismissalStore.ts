import {
  dismissAllReminderAlerts,
  dismissReminderAlert,
  type DueReminderAlert
} from "./reminderAlarmReader";
import {
  dismissOperationalAlert,
  dismissOperationalAlerts,
  type OperationalAlertItem,
  type OperationalAlertKind,
  type OperationalAlertSourceType
} from "./operationalAlertReader";

const DISMISSED_REMINDER_KEYS_STORAGE_KEY = "aots.dismissedReminderAlertKeys";
const DISMISSED_REMINDER_SUMMARIES_STORAGE_KEY = "aots.dismissedReminderAlertSummaries";
const DISMISSED_REMINDER_BADGE_STORAGE_KEY = "aots.dismissedReminderBadge";
const SUMMARY_RETENTION_DAYS = 3;
const MAX_STORED_SUMMARIES = 20;
export const MAX_VISIBLE_DISMISSED_REMINDERS = 10;

export const REMINDER_DISMISSAL_BADGE_EVENT = "aots:reminder-dismissal-badge";

export type DismissedReminderSummary = {
  dismissal_key: string;
  reminder_id?: number;
  source_type?: OperationalAlertSourceType;
  source_id?: number;
  alert_kind?: OperationalAlertKind;
  title?: string;
  student_id: number;
  student_full_name: string;
  guardian_full_name?: string | null;
  reminder_at: string;
  due_at?: string;
  dismissed_at: string;
};

function safeReadJsonArray(key: string): string[] {
  try {
    const rawValue = window.localStorage.getItem(key);
    const parsed = rawValue ? JSON.parse(rawValue) : [];

    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string") : [];
  } catch {
    return [];
  }
}

function safeReadSummaryArray(): DismissedReminderSummary[] {
  try {
    const rawValue = window.localStorage.getItem(DISMISSED_REMINDER_SUMMARIES_STORAGE_KEY);
    const parsed = rawValue ? JSON.parse(rawValue) : [];

    return Array.isArray(parsed)
      ? parsed.filter(
          (value): value is DismissedReminderSummary =>
            typeof value?.dismissal_key === "string" &&
            typeof value?.student_id === "number" &&
            typeof value?.student_full_name === "string" &&
            typeof value?.reminder_at === "string" &&
            typeof value?.dismissed_at === "string" &&
            (typeof value?.reminder_id === "number" ||
              (typeof value?.source_id === "number" && typeof value?.alert_kind === "string"))
        )
      : [];
  } catch {
    return [];
  }
}

function writeDismissedReminderSummaries(summaries: DismissedReminderSummary[]): void {
  try {
    window.localStorage.setItem(DISMISSED_REMINDER_SUMMARIES_STORAGE_KEY, JSON.stringify(summaries));
  } catch {
    // Local storage can be unavailable in private mode; badge and popup suppression still degrade safely.
  }
}

function pruneDismissedReminderSummaries(summaries: DismissedReminderSummary[]): DismissedReminderSummary[] {
  const minDismissedAt = Date.now() - SUMMARY_RETENTION_DAYS * 24 * 60 * 60 * 1000;

  return summaries
    .filter((summary) => {
      const dismissedAt = new Date(summary.dismissed_at).getTime();

      return Number.isFinite(dismissedAt) && dismissedAt >= minDismissedAt;
    })
    .sort((left, right) => new Date(right.dismissed_at).getTime() - new Date(left.dismissed_at).getTime())
    .slice(0, MAX_STORED_SUMMARIES);
}

function safeWriteJsonArray(key: string, values: string[]): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(values));
  } catch {
    // Local storage can be unavailable in private mode; reminder popup still works in memory.
  }
}

function emitBadgeChange(): void {
  window.dispatchEvent(new Event(REMINDER_DISMISSAL_BADGE_EVENT));
}

export function readPersistedDismissedReminderKeys(): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  return safeReadJsonArray(DISMISSED_REMINDER_KEYS_STORAGE_KEY);
}

export function readDismissedReminderSummaries(): DismissedReminderSummary[] {
  if (typeof window === "undefined") {
    return [];
  }

  const prunedSummaries = pruneDismissedReminderSummaries(safeReadSummaryArray());
  writeDismissedReminderSummaries(prunedSummaries);

  return prunedSummaries;
}

function persistDismissedReminderSummary(alert: DueReminderAlert): void {
  const dismissalKey = `${alert.reminder_id}|${alert.reminder_at}`;
  const currentSummaries = readDismissedReminderSummaries();
  const nextSummary: DismissedReminderSummary = {
    dismissal_key: dismissalKey,
    reminder_id: alert.reminder_id,
    student_id: alert.student_id,
    student_full_name: alert.student_full_name,
    guardian_full_name: alert.guardian_full_name ?? null,
    reminder_at: alert.reminder_at,
    dismissed_at: new Date().toISOString()
  };
  const nextSummaries = pruneDismissedReminderSummaries([
    nextSummary,
    ...currentSummaries.filter((summary) => summary.dismissal_key !== dismissalKey)
  ]);

  writeDismissedReminderSummaries(nextSummaries);
}

function persistDismissedOperationalAlertSummary(alert: OperationalAlertItem): void {
  const currentSummaries = readDismissedReminderSummaries();
  const nextSummary: DismissedReminderSummary = {
    dismissal_key: alert.identity,
    source_type: alert.source_type,
    source_id: alert.source_id,
    alert_kind: alert.kind,
    title: alert.title,
    student_id: alert.student_id,
    student_full_name: alert.student_full_name,
    guardian_full_name: alert.guardian_full_name ?? null,
    // reminder_at stays populated so historic notification panel consumers retain a single due field.
    reminder_at: alert.due_at,
    due_at: alert.due_at,
    dismissed_at: new Date().toISOString()
  };
  const nextSummaries = pruneDismissedReminderSummaries([
    nextSummary,
    ...currentSummaries.filter((summary) => summary.dismissal_key !== alert.identity)
  ]);

  writeDismissedReminderSummaries(nextSummaries);
}

export function removeDismissedReminderSummary(dismissalKey: string): DismissedReminderSummary[] {
  if (typeof window === "undefined") {
    return [];
  }

  const nextSummaries = readDismissedReminderSummaries().filter((summary) => summary.dismissal_key !== dismissalKey);
  writeDismissedReminderSummaries(nextSummaries);

  if (nextSummaries.length === 0) {
    clearDismissedReminderBadge();
  } else {
    emitBadgeChange();
  }

  return nextSummaries;
}

export function clearDismissedReminderSummaries(): void {
  if (typeof window === "undefined") {
    return;
  }

  writeDismissedReminderSummaries([]);
  clearDismissedReminderBadge();
}

export function getVisibleDismissedReminderSummaries(
  summaries: DismissedReminderSummary[]
): { visibleSummaries: DismissedReminderSummary[]; hiddenCount: number } {
  return {
    visibleSummaries: summaries.slice(0, MAX_VISIBLE_DISMISSED_REMINDERS),
    hiddenCount: Math.max(summaries.length - MAX_VISIBLE_DISMISSED_REMINDERS, 0)
  };
}

export function writePersistedDismissedReminderKeys(keys: string[]): void {
  if (typeof window === "undefined") {
    return;
  }

  safeWriteJsonArray(DISMISSED_REMINDER_KEYS_STORAGE_KEY, [...new Set(keys)]);
}

export function readDismissedReminderBadge(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(DISMISSED_REMINDER_BADGE_STORAGE_KEY) === "true";
}

export function markDismissedReminderBadge(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(DISMISSED_REMINDER_BADGE_STORAGE_KEY, "true");
  emitBadgeChange();
}

export function clearDismissedReminderBadge(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(DISMISSED_REMINDER_BADGE_STORAGE_KEY);
  emitBadgeChange();
}

export function persistDismissedReminderAlert(
  currentKeys: string[],
  alert: DueReminderAlert
): string[] {
  const nextKeys = dismissReminderAlert(currentKeys, alert);
  writePersistedDismissedReminderKeys(nextKeys);
  persistDismissedReminderSummary(alert);
  markDismissedReminderBadge();

  return nextKeys;
}

export function persistDismissedReminderAlerts(
  currentKeys: string[],
  alerts: DueReminderAlert[]
): string[] {
  const nextKeys = dismissAllReminderAlerts(currentKeys, alerts);
  writePersistedDismissedReminderKeys(nextKeys);
  for (const alert of alerts) {
    persistDismissedReminderSummary(alert);
  }
  markDismissedReminderBadge();

  return nextKeys;
}

export function persistDismissedOperationalAlert(
  currentKeys: string[],
  alert: OperationalAlertItem
): string[] {
  const nextKeys = dismissOperationalAlert(currentKeys, alert);
  writePersistedDismissedReminderKeys(nextKeys);
  persistDismissedOperationalAlertSummary(alert);
  markDismissedReminderBadge();

  return nextKeys;
}

export function persistDismissedOperationalAlerts(
  currentKeys: string[],
  alerts: OperationalAlertItem[]
): string[] {
  const nextKeys = dismissOperationalAlerts(currentKeys, alerts);
  writePersistedDismissedReminderKeys(nextKeys);

  for (const alert of alerts) {
    persistDismissedOperationalAlertSummary(alert);
  }

  if (alerts.length) {
    markDismissedReminderBadge();
  }

  return nextKeys;
}
