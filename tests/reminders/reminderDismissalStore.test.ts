import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearDismissedReminderBadge,
  clearDismissedReminderSummaries,
  getVisibleDismissedReminderSummaries,
  persistDismissedReminderAlert,
  persistDismissedReminderAlerts,
  persistDismissedOperationalAlert,
  readDismissedReminderSummaries,
  readDismissedReminderBadge,
  readPersistedDismissedReminderKeys,
  removeDismissedReminderSummary
} from "../../src/features/reminders/services/reminderDismissalStore";
import { createReminderPopupModel, type DueReminderAlert } from "../../src/features/reminders/services/reminderAlarmReader";
import { filterDismissedOperationalAlerts, type OperationalAlertItem } from "../../src/features/reminders/services/operationalAlertReader";

const firstAlert: DueReminderAlert = {
  reminder_id: 1,
  student_id: 1,
  student_full_name: "Ayse",
  reminder_at: "2026-05-09T10:00:00.000Z"
};

const secondAlert: DueReminderAlert = {
  reminder_id: 2,
  student_id: 2,
  student_full_name: "Mehmet",
  reminder_at: "2026-05-09T10:05:00.000Z"
};

const guardianAlert: OperationalAlertItem = {
  identity: "appointment_guardian_message|7|1|2026-05-10T11:00:00.000Z",
  kind: "appointment_guardian_message",
  source_type: "appointment",
  source_id: 7,
  student_id: 3,
  student_full_name: "Derya",
  guardian_full_name: "Veli Derya",
  due_at: "2026-05-10T11:00:00.000Z",
  title: "Veli mesajı hatırlatması",
  note: null,
  bucket: "overdue",
  bucket_label: "Süresi geçti",
  due_date_label: "10.05.2026",
  due_time_label: "11:00",
  last_call_result_label: "Randevu Verildi",
  note_preview: null
};

const appointmentStartAlert: OperationalAlertItem = {
  ...guardianAlert,
  identity: "appointment_start|7|2026-05-10T11:00:00.000Z",
  kind: "appointment_start",
  title: "Randevu zamanı"
};

describe("reminderDismissalStore", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-10T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("persists one dismissed reminder without completing it", () => {
    const dismissed = persistDismissedReminderAlert([], firstAlert);

    expect(readPersistedDismissedReminderKeys()).toEqual(dismissed);
    expect(readDismissedReminderSummaries()).toEqual([
      expect.objectContaining({
        reminder_id: firstAlert.reminder_id,
        student_full_name: firstAlert.student_full_name,
        reminder_at: firstAlert.reminder_at
      })
    ]);
    expect(createReminderPopupModel([firstAlert, secondAlert], dismissed, true)?.primaryAlert.reminder_id).toBe(2);
    expect(readDismissedReminderBadge()).toBe(true);
  });

  it("persists all current due dismissed reminders", () => {
    const dismissed = persistDismissedReminderAlerts([], [firstAlert, secondAlert]);

    expect(readPersistedDismissedReminderKeys()).toEqual(dismissed);
    expect(createReminderPopupModel([firstAlert, secondAlert], dismissed, true)).toBeNull();
  });

  it("clears only the bell badge state", () => {
    persistDismissedReminderAlert([], firstAlert);
    clearDismissedReminderBadge();

    expect(readDismissedReminderBadge()).toBe(false);
    expect(readPersistedDismissedReminderKeys()).not.toEqual([]);
  });

  it("removes one bell panel summary without removing popup dismissal", () => {
    persistDismissedReminderAlert([], firstAlert);
    const dismissalKey = `${firstAlert.reminder_id}|${firstAlert.reminder_at}`;

    const remainingSummaries = removeDismissedReminderSummary(dismissalKey);

    expect(remainingSummaries).toEqual([]);
    expect(readDismissedReminderSummaries()).toEqual([]);
    expect(readPersistedDismissedReminderKeys()).toContain(dismissalKey);
  });

  it("clears bell panel history without removing popup dismissals", () => {
    persistDismissedReminderAlert([], firstAlert);
    const dismissalKey = `${firstAlert.reminder_id}|${firstAlert.reminder_at}`;

    clearDismissedReminderSummaries();

    expect(readDismissedReminderSummaries()).toEqual([]);
    expect(readPersistedDismissedReminderKeys()).toContain(dismissalKey);
  });

  it("keeps at most 20 panel history summaries", () => {
    let dismissedKeys: string[] = [];

    for (let index = 1; index <= 25; index += 1) {
      vi.setSystemTime(new Date(`2026-05-10T12:${String(index).padStart(2, "0")}:00.000Z`));
      dismissedKeys = persistDismissedReminderAlert(dismissedKeys, {
        reminder_id: index,
        student_id: index,
        student_full_name: `Aday ${index}`,
        reminder_at: `2026-05-10T11:${String(index).padStart(2, "0")}:00.000Z`
      });
    }

    const summaries = readDismissedReminderSummaries();

    expect(summaries).toHaveLength(20);
    expect(summaries[0].reminder_id).toBe(25);
    expect(summaries.at(-1)?.reminder_id).toBe(6);
  });

  it("hides dismissed reminder summaries older than 3 days", () => {
    persistDismissedReminderAlert([], firstAlert);
    vi.setSystemTime(new Date("2026-05-14T12:00:00.000Z"));

    expect(readDismissedReminderSummaries()).toEqual([]);
  });

  it("returns only the first 10 visible panel summaries", () => {
    const summaries = Array.from({ length: 12 }, (_, index) => ({
      dismissal_key: `${index}`,
      reminder_id: index,
      student_id: index,
      student_full_name: `Aday ${index}`,
      reminder_at: "2026-05-10T11:00:00.000Z",
      dismissed_at: "2026-05-10T12:00:00.000Z"
    }));

    expect(getVisibleDismissedReminderSummaries(summaries)).toEqual({
      visibleSummaries: summaries.slice(0, 10),
      hiddenCount: 2
    });
  });

  it("keeps appointment guardian and start dismissals independent while preserving legacy summaries", () => {
    const dismissed = persistDismissedOperationalAlert([], guardianAlert);

    expect(readPersistedDismissedReminderKeys()).toContain(guardianAlert.identity);
    expect(readDismissedReminderSummaries()[0]).toMatchObject({
      dismissal_key: guardianAlert.identity,
      alert_kind: "appointment_guardian_message",
      source_id: 7,
      due_at: guardianAlert.due_at
    });
    expect(filterDismissedOperationalAlerts([guardianAlert, appointmentStartAlert], dismissed)).toEqual([
      appointmentStartAlert
    ]);
    expect(createReminderPopupModel([firstAlert], readPersistedDismissedReminderKeys(), true)?.primaryAlert).toBe(firstAlert);
  });
});
