import { describe, expect, it } from "vitest";
import { AppDatabase } from "../../src/db/db";
import type { CallLogRecord } from "../../src/domain/models/callLog";
import type { PhoneSnapshot } from "../../src/domain/models/phone";
import type { ReminderRecord } from "../../src/domain/models/reminder";
import type { StudentRecord } from "../../src/domain/models/student";
import { softDeleteCallLogAndRecomputeStudentSummary } from "../../src/features/calls/services/callLogDeletion";
import { readDueReminderAlerts } from "../../src/features/reminders/services/reminderAlarmReader";
import { completeReminder, updatePendingReminder } from "../../src/features/reminders/services/reminderLifecycle";
import { readReminderTaskRows } from "../../src/features/reminders/services/reminderListReader";
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

async function createLinkedReminder(
  database: AppDatabase,
  studentId: number,
  reminderOverrides: Partial<ReminderRecord> = {},
  callLogOverrides: Partial<CallLogRecord> = {}
) {
  const reminderId = await database.reminders.add(reminder(studentId, reminderOverrides));
  const callLogId = await database.call_logs.add(
    callLog(studentId, { created_reminder_id: reminderId, ...callLogOverrides })
  );
  await database.reminders.update(reminderId, { call_log_id: callLogId });

  return { reminderId, callLogId };
}

describe("reminderLifecycle", () => {
  it("updates the pending reminder and only its owner call log note, then records an audit entry", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const phoneSnapshot: PhoneSnapshot = {
        phone_id: 42,
        reference_label: "Telefon 2",
        relation_label: "Veli",
        phone_number: "05321234567"
      };
      const { reminderId, callLogId } = await createLinkedReminder(
        database,
        studentId,
        {
          phone_id: 42,
          phone_snapshot: phoneSnapshot
        },
        {
          note: "Önceki görünür not",
          phone_id: 42,
          phone_snapshot: phoneSnapshot
        }
      );
      const sharedCallLogId = await database.call_logs.add(
        callLog(studentId, {
          created_reminder_id: reminderId,
          note: "Eski shared not"
        })
      );
      const originalOwnerCallLog = await database.call_logs.get(callLogId);
      const originalSharedCallLog = await database.call_logs.get(sharedCallLogId);
      const originalStudent = await database.students.get(studentId);

      const result = await updatePendingReminder(
        reminderId,
        {
          reminder_at: "2026-05-13T09:30:00.000Z",
          note: "  Yeni hatırlatma notu  ",
          performed_by: "test-agent"
        },
        database
      );
      const updatedReminder = await database.reminders.get(reminderId);
      const auditLog = await database.audit_logs.where("entity_id").equals(reminderId).first();

      expect(result).toEqual({
        reminder_id: reminderId,
        student_id: studentId,
        reminder_at: "2026-05-13T09:30:00.000Z",
        note: "Yeni hatırlatma notu",
        status: "pending"
      });
      expect(updatedReminder).toMatchObject({
        student_id: studentId,
        call_log_id: callLogId,
        phone_id: 42,
        phone_snapshot: phoneSnapshot,
        reminder_at: "2026-05-13T09:30:00.000Z",
        note: "Yeni hatırlatma notu",
        status: "pending"
      });
      expect(updatedReminder?.updated_at).not.toBe(timestamp);
      expect(await database.call_logs.get(callLogId)).toMatchObject({
        note: "Yeni hatırlatma notu",
        call_result: originalOwnerCallLog?.call_result,
        call_time: originalOwnerCallLog?.call_time,
        created_at: originalOwnerCallLog?.created_at,
        reminder_at: originalOwnerCallLog?.reminder_at,
        next_action: originalOwnerCallLog?.next_action,
        created_reminder_id: reminderId,
        phone_id: 42,
        phone_snapshot: phoneSnapshot
      });
      expect((await database.call_logs.get(callLogId))?.updated_at).toBe(originalOwnerCallLog?.updated_at);
      expect(await database.call_logs.get(sharedCallLogId)).toEqual(originalSharedCallLog);
      expect(await database.students.get(studentId)).toEqual(originalStudent);
      expect(auditLog).toMatchObject({
        entity_type: "reminder",
        entity_id: reminderId,
        action_type: "update",
        field_name: "pending_reminder_edit",
        performed_by: "test-agent"
      });
      expect(auditLog?.created_at).toBe(updatedReminder?.updated_at);
      expect(JSON.parse(auditLog?.old_value ?? "{}")).toEqual({
        reminder_at: "2026-05-12T11:00:00.000Z",
        note: "Tekrar aranacak",
        owner_call_log_id: callLogId
      });
      expect(JSON.parse(auditLog?.new_value ?? "{}")).toEqual({
        reminder_at: "2026-05-13T09:30:00.000Z",
        note: "Yeni hatırlatma notu",
        owner_call_log_id: callLogId
      });
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("appends one audit entry per pending reminder edit without changing call chronology", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const { reminderId, callLogId } = await createLinkedReminder(database, studentId, {}, { note: "İlk not" });
      const originalCallLog = await database.call_logs.get(callLogId);

      await updatePendingReminder(
        reminderId,
        { reminder_at: "2026-05-13T09:30:00.000Z", note: "Birinci düzenleme" },
        database
      );
      await updatePendingReminder(
        reminderId,
        { reminder_at: "2026-05-14T10:45:00.000Z", note: "İkinci düzenleme" },
        database
      );

      const auditLogs = await database.audit_logs.where("entity_id").equals(reminderId).toArray();
      const updatedCallLog = await database.call_logs.get(callLogId);

      expect(auditLogs).toHaveLength(2);
      expect(JSON.parse(auditLogs[0].new_value ?? "{}")).toMatchObject({
        reminder_at: "2026-05-13T09:30:00.000Z",
        note: "Birinci düzenleme",
        owner_call_log_id: callLogId
      });
      expect(JSON.parse(auditLogs[1].old_value ?? "{}")).toMatchObject({
        reminder_at: "2026-05-13T09:30:00.000Z",
        note: "Birinci düzenleme",
        owner_call_log_id: callLogId
      });
      expect(updatedCallLog).toMatchObject({
        call_time: originalCallLog?.call_time,
        created_at: originalCallLog?.created_at,
        call_result: originalCallLog?.call_result,
        phone_id: originalCallLog?.phone_id,
        phone_snapshot: originalCallLog?.phone_snapshot,
        created_reminder_id: reminderId,
        created_appointment_id: originalCallLog?.created_appointment_id,
        updated_at: originalCallLog?.updated_at
      });
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("rolls back reminder and owner call log updates when the audit write fails", async () => {
    const database = await createDatabase();
    database.audit_logs.hook("creating", () => {
      throw new Error("Audit kaydı yazılamadı.");
    });

    try {
      const studentId = await database.students.add(student());
      const { reminderId, callLogId } = await createLinkedReminder(database, studentId, {}, { note: "Önceki not" });
      const originalReminder = await database.reminders.get(reminderId);
      const originalCallLog = await database.call_logs.get(callLogId);

      await expect(
        updatePendingReminder(
          reminderId,
          { reminder_at: "2026-05-13T09:30:00.000Z", note: "Bu kayıt yazılmamalı" },
          database
        )
      ).rejects.toThrow("Audit kaydı yazılamadı");

      expect(await database.reminders.get(reminderId)).toEqual(originalReminder);
      expect(await database.call_logs.get(callLogId)).toEqual(originalCallLog);
      expect(await database.audit_logs.count()).toBe(0);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("makes the updated pending reminder date available to reminder list and alarm readers", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const { reminderId } = await createLinkedReminder(database, studentId);

      await updatePendingReminder(
        reminderId,
        { reminder_at: "2026-05-13T09:30:00.000Z", note: "Yeni alarm zamanı" },
        database
      );

      const taskRows = await readReminderTaskRows("2026-05-12T09:00:00.000Z", database);
      const alerts = await readDueReminderAlerts("2026-05-13T09:31:00.000Z", database);

      expect(taskRows[0]).toMatchObject({
        reminder_id: reminderId,
        reminder_at: "2026-05-13T09:30:00.000Z",
        note_preview: "Yeni alarm zamanı"
      });
      expect(alerts[0]).toMatchObject({
        reminder_id: reminderId,
        reminder_at: "2026-05-13T09:30:00.000Z",
        note: "Yeni alarm zamanı"
      });
      expect((await database.reminders.get(reminderId))?.status).toBe("pending");
    } finally {
      database.close();
      await database.delete();
    }
  });

  it.each(["completed", "cancelled"] as const)("does not update a %s reminder", async (status) => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const reminderId = await database.reminders.add(reminder(studentId, { status }));

      await expect(
        updatePendingReminder(reminderId, { reminder_at: "2026-05-13T09:30:00.000Z" }, database)
      ).rejects.toThrow("Yalnızca açık hatırlatmalar");
      expect((await database.reminders.get(reminderId))?.updated_at).toBe(timestamp);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("rejects missing, deleted, non-call and invalid-date reminder updates", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const deletedReminderId = await database.reminders.add(reminder(studentId, { deleted_at: timestamp }));
      const followUpReminderId = await database.reminders.add(reminder(studentId, { reminder_type: "follow_up" }));

      await expect(
        updatePendingReminder(999, { reminder_at: "2026-05-13T09:30:00.000Z" }, database)
      ).rejects.toThrow("bulunamadı");
      await expect(
        updatePendingReminder(deletedReminderId, { reminder_at: "2026-05-13T09:30:00.000Z" }, database)
      ).rejects.toThrow("Silinmiş hatırlatma");
      await expect(
        updatePendingReminder(followUpReminderId, { reminder_at: "2026-05-13T09:30:00.000Z" }, database)
      ).rejects.toThrow("Yalnızca arama hatırlatmaları");
      await expect(updatePendingReminder(followUpReminderId, { reminder_at: "geçersiz" }, database)).rejects.toThrow(
        "tarih/saat bilgisi geçersiz"
      );
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("rolls back without changing the reminder when its owner call log is missing", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const reminderId = await database.reminders.add(reminder(studentId, { call_log_id: 999 }));
      const originalReminder = await database.reminders.get(reminderId);

      await expect(
        updatePendingReminder(
          reminderId,
          { reminder_at: "2026-05-13T09:30:00.000Z", note: "Bu not yazılmamalı" },
          database
        )
      ).rejects.toThrow("bağlı görüşme kaydı");

      expect(await database.reminders.get(reminderId)).toEqual(originalReminder);
      expect(await database.audit_logs.count()).toBe(0);
    } finally {
      database.close();
      await database.delete();
    }
  });

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
