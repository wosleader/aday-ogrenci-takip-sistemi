import { describe, expect, it } from "vitest";
import { AppDatabase } from "../../src/db/db";
import type { CallLogRecord } from "../../src/domain/models/callLog";
import type { PhoneSnapshot } from "../../src/domain/models/phone";
import type { ReminderRecord } from "../../src/domain/models/reminder";
import type { StudentRecord } from "../../src/domain/models/student";
import { softDeleteCallLogAndRecomputeStudentSummary } from "../../src/features/calls/services/callLogDeletion";
import { readDueReminderAlerts } from "../../src/features/reminders/services/reminderAlarmReader";
import {
  cancelPendingLinkedCallReminder,
  completeReminder,
  updatePendingReminder
} from "../../src/features/reminders/services/reminderLifecycle";
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

async function createLegacyLinkedReminder(
  database: AppDatabase,
  studentId: number,
  reminderOverrides: Partial<ReminderRecord> = {},
  callLogOverrides: Partial<CallLogRecord> = {}
) {
  const reminderId = await database.reminders.add(reminder(studentId, reminderOverrides));
  const callLogId = await database.call_logs.add(
    callLog(studentId, { ...callLogOverrides, created_reminder_id: null })
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

  it("cancels only a valid owner-linked pending call reminder, preserves related records, and appends an audit", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const { reminderId, callLogId } = await createLinkedReminder(database, studentId, {}, { note: "Açık owner notu" });
      const appointmentId = await database.appointments.add({
        uuid: crypto.randomUUID(),
        student_id: studentId,
        guardian_id: null,
        appointment_at: "2026-05-13T10:00:00.000Z",
        status: "pending",
        campaign_id: null,
        note: "Randevu korunmalı",
        sync_status: "local",
        created_at: timestamp,
        updated_at: timestamp,
        deleted_at: null
      });
      await database.call_logs.update(callLogId, { created_appointment_id: appointmentId });
      await updatePendingReminder(
        reminderId,
        { reminder_at: "2026-05-13T09:30:00.000Z", note: "Önceki edit audit", performed_by: "test-agent" },
        database
      );
      const reminderBefore = await database.reminders.get(reminderId);
      const callLogBefore = await database.call_logs.get(callLogId);
      const studentBefore = await database.students.get(studentId);
      const appointmentBefore = await database.appointments.get(appointmentId);

      const result = await cancelPendingLinkedCallReminder(
        reminderId,
        {
          owner_call_log_id: callLogId,
          cancellation_reason: "  Yanlış takip zamanı  ",
          performed_by: "test-agent"
        },
        database
      );
      const reminderAfter = await database.reminders.get(reminderId);
      const auditLogs = await database.audit_logs.where("entity_id").equals(reminderId).toArray();
      const cancellationAudit = auditLogs.find((audit) => audit.field_name === "pending_reminder_cancel");

      expect(result).toEqual({
        reminder_id: reminderId,
        student_id: studentId,
        owner_call_log_id: callLogId,
        previous_status: "pending",
        status: "cancelled",
        cancellation_reason: "Yanlış takip zamanı"
      });
      expect(reminderAfter).toMatchObject({
        uuid: reminderBefore?.uuid,
        student_id: studentId,
        call_log_id: callLogId,
        reminder_at: "2026-05-13T09:30:00.000Z",
        note: "Önceki edit audit",
        status: "cancelled"
      });
      expect(reminderAfter?.updated_at).not.toBe(reminderBefore?.updated_at);
      expect(await database.call_logs.get(callLogId)).toEqual(callLogBefore);
      expect(await database.students.get(studentId)).toEqual(studentBefore);
      expect(await database.appointments.get(appointmentId)).toEqual(appointmentBefore);
      expect(auditLogs.filter((audit) => audit.field_name === "pending_reminder_edit")).toHaveLength(1);
      expect(cancellationAudit).toMatchObject({
        entity_type: "reminder",
        entity_id: reminderId,
        action_type: "update",
        field_name: "pending_reminder_cancel",
        performed_by: "test-agent"
      });
      expect(JSON.parse(cancellationAudit?.old_value ?? "{}")).toMatchObject({
        reminder_id: reminderId,
        student_id: studentId,
        owner_call_log_id: callLogId,
        previous_status: "pending",
        reminder_at: "2026-05-13T09:30:00.000Z"
      });
      expect(JSON.parse(cancellationAudit?.new_value ?? "{}")).toMatchObject({
        reminder_id: reminderId,
        student_id: studentId,
        owner_call_log_id: callLogId,
        new_status: "cancelled",
        reminder_at: "2026-05-13T09:30:00.000Z",
        cancellation_reason: "Yanlış takip zamanı"
      });
      expect(await readReminderTaskRows("2026-05-12T09:00:00.000Z", database)).toEqual([]);
      expect(await readDueReminderAlerts("2026-05-14T09:00:00.000Z", database)).toEqual([]);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("cancels a safe legacy owner without backfilling its call-log link", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const { reminderId, callLogId } = await createLegacyLinkedReminder(
        database,
        studentId,
        { note: "Eski açık reminder notu" },
        { note: "Eski reminder sahibi satırı" }
      );
      const appointmentId = await database.appointments.add({
        uuid: crypto.randomUUID(),
        student_id: studentId,
        guardian_id: null,
        appointment_at: "2026-05-13T10:00:00.000Z",
        status: "pending",
        campaign_id: null,
        note: "Randevu korunmalı",
        sync_status: "local",
        created_at: timestamp,
        updated_at: timestamp,
        deleted_at: null
      });
      await database.call_logs.update(callLogId, { created_appointment_id: appointmentId });
      const callLogBefore = await database.call_logs.get(callLogId);
      const appointmentBefore = await database.appointments.get(appointmentId);

      const result = await cancelPendingLinkedCallReminder(
        reminderId,
        {
          owner_call_log_id: callLogId,
          cancellation_reason: "  Eski takip artık gerekmiyor  ",
          performed_by: "test-agent"
        },
        database
      );
      const cancellationAudit = (await database.audit_logs.where("entity_id").equals(reminderId).toArray()).find(
        (audit) => audit.field_name === "pending_reminder_cancel"
      );

      expect(result).toMatchObject({
        reminder_id: reminderId,
        owner_call_log_id: callLogId,
        status: "cancelled",
        cancellation_reason: "Eski takip artık gerekmiyor"
      });
      expect((await database.reminders.get(reminderId))?.status).toBe("cancelled");
      expect(await database.call_logs.get(callLogId)).toEqual(callLogBefore);
      expect((await database.call_logs.get(callLogId))?.created_reminder_id).toBeNull();
      expect(await database.appointments.get(appointmentId)).toEqual(appointmentBefore);
      expect(JSON.parse(cancellationAudit?.new_value ?? "{}")).toMatchObject({
        owner_call_log_id: callLogId,
        new_status: "cancelled",
        cancellation_reason: "Eski takip artık gerekmiyor"
      });
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("rejects two pending legacy reminders that point to one owner without mutation or audit", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const { reminderId: firstReminderId, callLogId } = await createLegacyLinkedReminder(database, studentId);
      const secondReminderId = await database.reminders.add(reminder(studentId, { call_log_id: callLogId }));
      const ownerCallLogBefore = await database.call_logs.get(callLogId);

      await expect(
        cancelPendingLinkedCallReminder(firstReminderId, { owner_call_log_id: callLogId }, database)
      ).rejects.toThrow("çelişkili");
      await expect(
        cancelPendingLinkedCallReminder(secondReminderId, { owner_call_log_id: callLogId }, database)
      ).rejects.toThrow("çelişkili");

      expect((await database.reminders.get(firstReminderId))?.status).toBe("pending");
      expect((await database.reminders.get(secondReminderId))?.status).toBe("pending");
      expect(await database.call_logs.get(callLogId)).toEqual(ownerCallLogBefore);
      expect(await database.audit_logs.count()).toBe(0);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("rejects a modern owner when a pending legacy reminder also points to it", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const { reminderId: modernReminderId, callLogId } = await createLinkedReminder(database, studentId);
      const legacyReminderId = await database.reminders.add(reminder(studentId, { call_log_id: callLogId }));
      const ownerCallLogBefore = await database.call_logs.get(callLogId);

      await expect(
        cancelPendingLinkedCallReminder(modernReminderId, { owner_call_log_id: callLogId }, database)
      ).rejects.toThrow("çelişkili");
      await expect(
        cancelPendingLinkedCallReminder(legacyReminderId, { owner_call_log_id: callLogId }, database)
      ).rejects.toThrow("çelişkili");

      expect((await database.reminders.get(modernReminderId))?.status).toBe("pending");
      expect((await database.reminders.get(legacyReminderId))?.status).toBe("pending");
      expect(await database.call_logs.get(callLogId)).toEqual(ownerCallLogBefore);
      expect(await database.audit_logs.count()).toBe(0);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("cancels a modern owner with historical references while rejecting a shared history row", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const { reminderId, callLogId } = await createLinkedReminder(database, studentId);
      const sharedCallLogId = await database.call_logs.add(callLog(studentId, { created_reminder_id: reminderId }));
      const secondSharedCallLogId = await database.call_logs.add(callLog(studentId, { created_reminder_id: reminderId }));
      const appointmentId = await database.appointments.add({
        uuid: crypto.randomUUID(),
        student_id: studentId,
        guardian_id: null,
        appointment_at: "2026-05-13T10:00:00.000Z",
        status: "pending",
        campaign_id: null,
        note: "Randevu korunmalı",
        sync_status: "local",
        created_at: timestamp,
        updated_at: timestamp,
        deleted_at: null
      });
      await database.call_logs.update(callLogId, { created_appointment_id: appointmentId });
      const ownerBefore = await database.call_logs.get(callLogId);
      const sharedBefore = await database.call_logs.get(sharedCallLogId);
      const secondSharedBefore = await database.call_logs.get(secondSharedCallLogId);
      const appointmentBefore = await database.appointments.get(appointmentId);

      await expect(
        cancelPendingLinkedCallReminder(reminderId, { owner_call_log_id: sharedCallLogId }, database)
      ).rejects.toThrow("yalnız güncel sahibi");

      await expect(cancelPendingLinkedCallReminder(reminderId, { owner_call_log_id: callLogId }, database)).resolves.toMatchObject({
        reminder_id: reminderId,
        owner_call_log_id: callLogId,
        status: "cancelled"
      });

      expect((await database.reminders.get(reminderId))?.status).toBe("cancelled");
      expect(await database.call_logs.get(callLogId)).toEqual(ownerBefore);
      expect(await database.call_logs.get(sharedCallLogId)).toEqual(sharedBefore);
      expect(await database.call_logs.get(secondSharedCallLogId)).toEqual(secondSharedBefore);
      expect(await database.appointments.get(appointmentId)).toEqual(appointmentBefore);
      expect(await database.audit_logs.where("entity_id").equals(reminderId).count()).toBe(1);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("fails closed for a legacy owner with a conflicting reciprocal link without a mutation or audit", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const { reminderId, callLogId } = await createLegacyLinkedReminder(database, studentId);
      const otherReminderId = await database.reminders.add(reminder(studentId));
      await database.call_logs.update(callLogId, { created_reminder_id: otherReminderId });

      await expect(
        cancelPendingLinkedCallReminder(reminderId, { owner_call_log_id: callLogId }, database)
      ).rejects.toThrow("çelişkili");
      expect((await database.reminders.get(reminderId))?.status).toBe("pending");
      expect(await database.audit_logs.count()).toBe(0);

    } finally {
      database.close();
      await database.delete();
    }
  });

  it("normalizes an empty cancellation reason and rejects a second terminal cancellation without a new audit", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const { reminderId, callLogId } = await createLinkedReminder(database, studentId);

      const result = await cancelPendingLinkedCallReminder(
        reminderId,
        { owner_call_log_id: callLogId, cancellation_reason: "   " },
        database
      );
      expect(result.cancellation_reason).toBeNull();

      await expect(
        cancelPendingLinkedCallReminder(reminderId, { owner_call_log_id: callLogId }, database)
      ).rejects.toThrow("Yalnızca açık hatırlatmalar");
      expect(await database.audit_logs.count()).toBe(1);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("fails closed for missing, terminal, non-call, unlinked, missing-owner, and student-mismatched reminders", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const otherStudentId = await database.students.add(student());
      const completedReminderId = await database.reminders.add(reminder(studentId, { status: "completed" }));
      const nonCallReminderId = await database.reminders.add(reminder(studentId, { reminder_type: "follow_up" }));
      const unlinkedReminderId = await database.reminders.add(reminder(studentId));
      const missingOwnerReminderId = await database.reminders.add(reminder(studentId, { call_log_id: 99999 }));
      const { reminderId: mismatchedReminderId, callLogId: mismatchedCallLogId } = await createLinkedReminder(database, studentId);
      await database.call_logs.update(mismatchedCallLogId, { student_id: otherStudentId });

      await expect(cancelPendingLinkedCallReminder(99999, { owner_call_log_id: 1 }, database)).rejects.toThrow(
        "Güncellenecek hatırlatma bulunamadı"
      );
      await expect(
        cancelPendingLinkedCallReminder(completedReminderId, { owner_call_log_id: 1 }, database)
      ).rejects.toThrow("Yalnızca açık hatırlatmalar");
      await expect(
        cancelPendingLinkedCallReminder(nonCallReminderId, { owner_call_log_id: 1 }, database)
      ).rejects.toThrow("Yalnızca arama hatırlatmaları");
      await expect(
        cancelPendingLinkedCallReminder(unlinkedReminderId, { owner_call_log_id: 1 }, database)
      ).rejects.toThrow("bağlı görüşme kaydı bulunamadı");
      await expect(
        cancelPendingLinkedCallReminder(missingOwnerReminderId, { owner_call_log_id: 99999 }, database)
      ).rejects.toThrow("bağlı görüşme kaydı güncellenemedi");
      await expect(
        cancelPendingLinkedCallReminder(mismatchedReminderId, { owner_call_log_id: mismatchedCallLogId }, database)
      ).rejects.toThrow("bağlı görüşme kaydı güncellenemedi");

      expect((await database.reminders.get(completedReminderId))?.status).toBe("completed");
      expect((await database.reminders.get(nonCallReminderId))?.status).toBe("pending");
      expect((await database.reminders.get(unlinkedReminderId))?.status).toBe("pending");
      expect((await database.reminders.get(missingOwnerReminderId))?.status).toBe("pending");
      expect((await database.reminders.get(mismatchedReminderId))?.status).toBe("pending");
      expect(await database.audit_logs.count()).toBe(0);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("fails closed and rolls back cancellation when ownership validation or audit persistence fails", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const { reminderId, callLogId } = await createLinkedReminder(database, studentId);
      const otherReminderId = await database.reminders.add(reminder(studentId));
      await database.call_logs.update(callLogId, { created_reminder_id: otherReminderId });

      await expect(
        cancelPendingLinkedCallReminder(reminderId, { owner_call_log_id: callLogId }, database)
      ).rejects.toThrow("bağlı görüşme kaydı");
      expect((await database.reminders.get(reminderId))?.status).toBe("pending");
      expect(await database.audit_logs.count()).toBe(0);

      await database.call_logs.update(callLogId, { created_reminder_id: reminderId });
      const reminderBefore = await database.reminders.get(reminderId);
      database.audit_logs.hook("creating", () => {
        throw new Error("Cancellation audit yazılamadı.");
      });

      await expect(
        cancelPendingLinkedCallReminder(reminderId, { owner_call_log_id: callLogId }, database)
      ).rejects.toThrow("Cancellation audit yazılamadı");
      expect(await database.reminders.get(reminderId)).toEqual(reminderBefore);
      expect(await database.audit_logs.count()).toBe(0);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("rolls back a safe legacy cancellation when the audit cannot be persisted", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const { reminderId, callLogId } = await createLegacyLinkedReminder(database, studentId);
      const reminderBefore = await database.reminders.get(reminderId);
      const callLogBefore = await database.call_logs.get(callLogId);
      database.audit_logs.hook("creating", () => {
        throw new Error("Legacy cancellation audit yazılamadı.");
      });

      await expect(
        cancelPendingLinkedCallReminder(reminderId, { owner_call_log_id: callLogId }, database)
      ).rejects.toThrow("Legacy cancellation audit yazılamadı");
      expect(await database.reminders.get(reminderId)).toEqual(reminderBefore);
      expect(await database.call_logs.get(callLogId)).toEqual(callLogBefore);
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
