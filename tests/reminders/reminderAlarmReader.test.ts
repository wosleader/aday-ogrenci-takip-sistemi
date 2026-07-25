import { describe, expect, it } from "vitest";
import { AppDatabase } from "../../src/db/db";
import type { PhoneRecord } from "../../src/domain/models/phone";
import type { ReminderRecord } from "../../src/domain/models/reminder";
import type { StudentRecord } from "../../src/domain/models/student";
import {
  createReminderPopupModel,
  dismissAllReminderAlerts,
  dismissReminderAlert,
  getReminderDismissalKey,
  readDueReminderAlerts
} from "../../src/features/reminders/services/reminderAlarmReader";
import { createSearchText, normalizeText } from "../../src/utils/normalizeText";

const timestamp = "2026-05-08T09:00:00.000Z";

async function createDatabase() {
  const database = new AppDatabase(`test-reminder-alarm-${crypto.randomUUID()}`);
  await database.open();
  return database;
}

function student(name = "Ayse Yilmaz"): StudentRecord {
  return {
    uuid: crypto.randomUUID(),
    student_full_name: name,
    normalized_student_name: normalizeText(name),
    search_text: createSearchText([name]),
    current_class: "11",
    student_group: "11. Sinif YKS",
    category: "YKS",
    campaign_id: null,
    lifecycle_status: "candidate",
    last_call_result: "not_called",
    sync_status: "local",
    created_at: timestamp,
    updated_at: timestamp,
    deleted_at: null
  };
}

function phone(studentId: number, overrides: Partial<PhoneRecord> = {}): PhoneRecord {
  const phoneNumber = overrides.phone_number ?? "05321234567";

  return {
    uuid: crypto.randomUUID(),
    student_id: studentId,
    guardian_id: null,
    phone_number: phoneNumber,
    normalized_phone_number: phoneNumber,
    original_phone_value: phoneNumber,
    phone_label: "Telefon 1",
    phone_status: "active",
    is_valid: true,
    is_wrong: false,
    is_primary: true,
    note: null,
    sync_status: "local",
    created_at: timestamp,
    updated_at: timestamp,
    deleted_at: null,
    ...overrides
  };
}

function reminder(studentId: number, reminderAt: string, overrides: Partial<ReminderRecord> = {}): ReminderRecord {
  return {
    uuid: crypto.randomUUID(),
    student_id: studentId,
    reminder_type: "call",
    reminder_at: reminderAt,
    status: "pending",
    note: "Tekrar aranacak",
    is_default_time_assigned: false,
    sync_status: "local",
    created_at: timestamp,
    updated_at: timestamp,
    deleted_at: null,
    ...overrides
  };
}

describe("reminderAlarmReader", () => {
  it("finds due pending call reminders", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      await database.phones.add(phone(studentId));
      await database.reminders.bulkAdd([
        reminder(studentId, "2026-05-09T10:00:00.000Z"),
        reminder(studentId, "2026-05-10T10:00:00.000Z"),
        reminder(studentId, "2026-05-09T09:30:00.000Z", { status: "cancelled" })
      ]);

      const alerts = await readDueReminderAlerts("2026-05-09T10:05:00.000Z", database);

      expect(alerts).toHaveLength(1);
      expect(alerts[0]).toMatchObject({
        student_id: studentId,
        student_full_name: "Ayse Yilmaz",
        phone_1: "05321234567",
        note: "Tekrar aranacak"
      });
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("filters dismissed reminders from the popup model", () => {
    const alerts = [
      {
        reminder_id: 1,
        student_id: 1,
        student_full_name: "Ayse",
        reminder_at: "2026-05-09T10:00:00.000Z"
      },
      {
        reminder_id: 2,
        student_id: 2,
        student_full_name: "Mehmet",
        reminder_at: "2026-05-09T10:05:00.000Z"
      }
    ];

    const dismissed = dismissReminderAlert([], alerts[0]);
    const model = createReminderPopupModel(alerts, dismissed, true);

    expect(model?.dueCount).toBe(1);
    expect(model?.primaryAlert.reminder_id).toBe(2);
  });

  it("allows a dismissed reminder to show again when its date changes", () => {
    const dismissedAlert = {
      reminder_id: 1,
      student_id: 1,
      student_full_name: "Ayse",
      reminder_at: "2026-05-09T10:00:00.000Z"
    };
    const updatedAlert = {
      ...dismissedAlert,
      reminder_at: "2026-05-09T11:00:00.000Z"
    };

    const dismissed = dismissReminderAlert([], dismissedAlert);

    expect(dismissed).toEqual([getReminderDismissalKey(dismissedAlert)]);
    expect(createReminderPopupModel([updatedAlert], dismissed, true)?.primaryAlert.reminder_id).toBe(1);
  });

  it("dismisses all current due reminders for the session", () => {
    const alerts = [
      {
        reminder_id: 1,
        student_id: 1,
        student_full_name: "Ayse",
        reminder_at: "2026-05-09T10:00:00.000Z"
      },
      {
        reminder_id: 2,
        student_id: 2,
        student_full_name: "Mehmet",
        reminder_at: "2026-05-09T10:05:00.000Z"
      }
    ];

    const dismissed = dismissAllReminderAlerts([], alerts);

    expect(createReminderPopupModel(alerts, dismissed, true)).toBeNull();
  });

  it("does not create a popup model when popup setting is disabled", () => {
    const alerts = [
      {
        reminder_id: 1,
        student_id: 1,
        student_full_name: "Ayse",
        reminder_at: "2026-05-09T10:00:00.000Z"
      }
    ];

    expect(createReminderPopupModel(alerts, [], false)).toBeNull();
  });
});
