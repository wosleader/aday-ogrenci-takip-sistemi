import { describe, expect, it } from "vitest";
import { AppDatabase } from "../../src/db/db";
import type { CallLogRecord } from "../../src/domain/models/callLog";
import type { ReminderRecord } from "../../src/domain/models/reminder";
import type { StudentRecord } from "../../src/domain/models/student";
import { softDeleteCallLogAndRecomputeStudentSummary } from "../../src/features/calls/services/callLogDeletion";
import { completeReminder } from "../../src/features/reminders/services/reminderLifecycle";
import { createSearchText, normalizeText } from "../../src/utils/normalizeText";

const timestamp = "2026-05-08T09:00:00.000Z";

async function createDatabase() {
  const database = new AppDatabase(`test-reminder-lifecycle-${crypto.randomUUID()}`);
  await database.open();
  return database;
}

function student(): StudentRecord {
  return {
    uuid: crypto.randomUUID(),
    student_full_name: "Ayse Yilmaz",
    normalized_student_name: normalizeText("Ayse Yilmaz"),
    search_text: createSearchText(["Ayse Yilmaz"]),
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

function reminder(studentId: number, overrides: Partial<ReminderRecord> = {}): ReminderRecord {
  return {
    uuid: crypto.randomUUID(),
    student_id: studentId,
    reminder_type: "call",
    reminder_at: "2026-05-12T11:00:00.000Z",
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

function callLog(studentId: number, overrides: Partial<CallLogRecord> = {}): CallLogRecord {
  return {
    uuid: crypto.randomUUID(),
    student_id: studentId,
    phone_id: null,
    phone_snapshot: null,
    contacted_phone_id: null,
    contacted_phone_number: null,
    contacted_phone_label: null,
    call_time: timestamp,
    call_result: "call_later",
    note: null,
    reminder_at: "2026-05-12T11:00:00.000Z",
    next_action: "Tekrar arama",
    created_by: "agent",
    created_reminder_id: null,
    created_appointment_id: null,
    sync_status: "local",
    created_at: timestamp,
    updated_at: timestamp,
    deleted_at: null,
    ...overrides
  };
}

describe("reminderLifecycle", () => {
  it("marks a pending reminder as completed without deleting it", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const reminderId = await database.reminders.add(reminder(studentId));

      const result = await completeReminder(reminderId, database);
      const updatedReminder = await database.reminders.get(reminderId);

      expect(result).toMatchObject({
        reminder_id: reminderId,
        previous_status: "pending",
        status: "completed",
        completed: true
      });
      expect(updatedReminder?.status).toBe("completed");
      expect(updatedReminder?.deleted_at).toBeNull();
      expect(updatedReminder?.updated_at).not.toBe(timestamp);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("completes only the requested reminder when multiple reminders are pending", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const firstReminderId = await database.reminders.add(reminder(studentId, { uuid: "first-pending-reminder" }));
      const secondReminderId = await database.reminders.add(reminder(studentId, { uuid: "second-pending-reminder" }));

      await completeReminder(firstReminderId, database);

      expect((await database.reminders.get(firstReminderId))?.status).toBe("completed");
      expect((await database.reminders.get(secondReminderId))?.status).toBe("pending");
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("does not mutate a non-pending reminder", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const reminderId = await database.reminders.add(reminder(studentId, { status: "cancelled" }));

      const result = await completeReminder(reminderId, database);
      const unchangedReminder = await database.reminders.get(reminderId);

      expect(result).toMatchObject({
        reminder_id: reminderId,
        previous_status: "cancelled",
        status: "cancelled",
        completed: false
      });
      expect(unchangedReminder?.status).toBe("cancelled");
      expect(unchangedReminder?.updated_at).toBe(timestamp);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("keeps the linked call log active and lets the existing delete guard allow soft delete afterwards", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const reminderId = await database.reminders.add(reminder(studentId));
      const callLogId = await database.call_logs.add(callLog(studentId, { created_reminder_id: reminderId }));

      await expect(softDeleteCallLogAndRecomputeStudentSummary(callLogId, database)).rejects.toThrow(
        "açık bir hatırlatma"
      );

      await completeReminder(reminderId, database);
      expect((await database.call_logs.get(callLogId))?.deleted_at).toBeNull();

      await softDeleteCallLogAndRecomputeStudentSummary(callLogId, database);

      expect((await database.reminders.get(reminderId))?.status).toBe("completed");
      expect((await database.call_logs.get(callLogId))?.deleted_at).toBeTruthy();
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("throws when the reminder cannot be found or is deleted", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const deletedReminderId = await database.reminders.add(reminder(studentId, { deleted_at: timestamp }));

      await expect(completeReminder(999, database)).rejects.toThrow("bulunamadı");
      await expect(completeReminder(deletedReminderId, database)).rejects.toThrow("Silinmiş hatırlatma");
    } finally {
      database.close();
      await database.delete();
    }
  });
});
