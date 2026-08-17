import { afterEach, describe, expect, it, vi } from "vitest";
import { AppDatabase } from "../../src/db/db";
import type { AppointmentRecord } from "../../src/domain/models/appointment";
import type { CallLogRecord } from "../../src/domain/models/callLog";
import type { StudentRecord } from "../../src/domain/models/student";
import {
  cancelPendingAppointment,
  completePendingAppointment,
  markGuardianMessageSent,
  markPendingAppointmentNoShow,
  reschedulePendingAppointment,
  updatePendingAppointmentNote
} from "../../src/features/appointments/services/appointmentLifecycle";
import { readOperationalAlertItems } from "../../src/features/reminders/services/operationalAlertReader";
import { createSearchText, normalizeText } from "../../src/utils/normalizeText";

const createdAt = "2026-05-10T08:00:00.000Z";
const readerNow = "2026-05-10T09:00:00.000Z";

async function createDatabase() {
  const database = new AppDatabase(`test-appointment-lifecycle-${crypto.randomUUID()}`);
  await database.open();
  return database;
}

function student(overrides: Partial<StudentRecord> = {}): StudentRecord {
  const fullName = "AYŞE YILMAZ";

  return {
    uuid: crypto.randomUUID(),
    student_full_name: fullName,
    normalized_student_name: normalizeText(fullName),
    search_text: createSearchText([fullName]),
    student_group: "YKS",
    category: "YKS",
    lifecycle_status: "candidate",
    last_call_result: "not_called",
    created_at: createdAt,
    updated_at: createdAt,
    deleted_at: null,
    sync_status: "local",
    ...overrides
  };
}

function ownerCallLog(studentId: number, overrides: Partial<CallLogRecord> = {}): CallLogRecord {
  return {
    uuid: crypto.randomUUID(),
    student_id: studentId,
    call_time: createdAt,
    call_result: "appointment",
    note: "İlk görüşme notu",
    created_reminder_id: null,
    created_appointment_id: null,
    created_at: createdAt,
    updated_at: createdAt,
    deleted_at: null,
    sync_status: "local",
    ...overrides
  };
}

function appointment(studentId: number, ownerId: number, overrides: Partial<AppointmentRecord> = {}): AppointmentRecord {
  return {
    uuid: crypto.randomUUID(),
    student_id: studentId,
    guardian_id: null,
    appointment_at: "2099-05-12T09:00:00.000Z",
    status: "pending",
    campaign_id: null,
    note: "Randevu notu",
    call_log_id: ownerId,
    guardian_message_due_at: "2099-05-11T11:00:00.000Z",
    guardian_message_sent_at: null,
    guardian_message_generation: 1,
    created_at: createdAt,
    updated_at: createdAt,
    deleted_at: null,
    sync_status: "local",
    ...overrides
  };
}

async function seedPendingAppointment(database: AppDatabase, overrides: Partial<AppointmentRecord> = {}) {
  const studentId = await database.students.add(student());
  const ownerCallLogId = await database.call_logs.add(ownerCallLog(studentId));
  const appointmentId = await database.appointments.add(appointment(studentId, ownerCallLogId, overrides));
  await database.call_logs.update(ownerCallLogId, { created_appointment_id: appointmentId });

  return { appointmentId, ownerCallLogId, studentId };
}

function expected(appointmentRecord: AppointmentRecord) {
  return { expected_updated_at: appointmentRecord.updated_at };
}

type LifecycleSeed = {
  appointmentId: number;
  ownerCallLogId: number;
  studentId: number;
};

type LifecycleCorruption = (database: AppDatabase, seed: LifecycleSeed) => Promise<void>;

const integrityCorruptions: Array<[string, LifecycleCorruption]> = [
  ["deleted student", async (database, seed) => {
    await database.students.update(seed.studentId, { deleted_at: "2026-05-10T09:00:00.000Z" });
  }],
  ["deleted owner call log", async (database, seed) => {
    await database.call_logs.update(seed.ownerCallLogId, { deleted_at: "2026-05-10T09:00:00.000Z" });
  }],
  ["owner from another student", async (database, seed) => {
    const otherStudentId = await database.students.add(student({ uuid: crypto.randomUUID() }));
    await database.call_logs.update(seed.ownerCallLogId, { student_id: otherStudentId });
  }],
  ["owner result other than appointment", async (database, seed) => {
    await database.call_logs.update(seed.ownerCallLogId, { call_result: "reached" });
  }],
  ["missing owner call-log id", async (database, seed) => {
    await database.appointments.update(seed.appointmentId, { call_log_id: null });
  }],
  ["missing guardian message generation", async (database, seed) => {
    await database.appointments.update(seed.appointmentId, { guardian_message_generation: null });
  }],
  ["zero guardian message generation", async (database, seed) => {
    await database.appointments.update(seed.appointmentId, { guardian_message_generation: 0 });
  }],
  ["negative guardian message generation", async (database, seed) => {
    await database.appointments.update(seed.appointmentId, { guardian_message_generation: -1 });
  }]
];

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("appointmentLifecycle", () => {
  it("marks only the guardian-message task as sent and records audit", async () => {
    const database = await createDatabase();

    try {
      const { appointmentId } = await seedPendingAppointment(database);
      const before = (await database.appointments.get(appointmentId))!;
      await expect(
        markGuardianMessageSent(
          appointmentId,
          {
            ...expected(before),
            expected_guardian_message_generation: 2,
            expected_guardian_message_due_at: before.guardian_message_due_at!
          },
          database
        )
      ).rejects.toThrow("güncel değil");
      await expect(
        markGuardianMessageSent(
          appointmentId,
          {
            ...expected(before),
            expected_guardian_message_generation: 1,
            expected_guardian_message_due_at: "2099-05-11T12:00:00.000Z"
          },
          database
        )
      ).rejects.toThrow("güncel değil");
      await expect(
        markGuardianMessageSent(
          appointmentId,
          {
            expected_updated_at: "2099-05-10T08:00:00.000Z",
            expected_guardian_message_generation: 1,
            expected_guardian_message_due_at: before.guardian_message_due_at!
          },
          database
        )
      ).rejects.toThrow("güncel değil");
      const result = await markGuardianMessageSent(
        appointmentId,
        {
          ...expected(before),
          expected_guardian_message_generation: 1,
          expected_guardian_message_due_at: before.guardian_message_due_at!
        },
        database
      );
      const updated = (await database.appointments.get(appointmentId))!;
      const alerts = await readOperationalAlertItems(readerNow, database);

      expect(result).toMatchObject({ appointment_id: appointmentId, status: "pending", guardian_message_sent_at: expect.any(String) });
      expect(updated).toMatchObject({
        status: "pending",
        appointment_at: before.appointment_at,
        guardian_message_due_at: before.guardian_message_due_at,
        guardian_message_generation: 1,
        guardian_message_sent_at: expect.any(String)
      });
      expect(alerts.filter((item) => item.source_id === appointmentId).map((item) => item.kind)).toEqual(["appointment_start"]);
      expect((await database.audit_logs.where("entity_id").equals(appointmentId).toArray())).toEqual(
        expect.arrayContaining([expect.objectContaining({ field_name: "appointment_guardian_message_sent" })])
      );
      await expect(
        markGuardianMessageSent(
          appointmentId,
          {
            expected_updated_at: updated.updated_at,
            expected_guardian_message_generation: 1,
            expected_guardian_message_due_at: updated.guardian_message_due_at!
          },
          database
        )
      ).rejects.toThrow("zaten gönderildi");
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("updates only the pending appointment note and rejects stale writes", async () => {
    const database = await createDatabase();

    try {
      const { appointmentId, ownerCallLogId } = await seedPendingAppointment(database);
      const before = (await database.appointments.get(appointmentId))!;
      await updatePendingAppointmentNote(appointmentId, { ...expected(before), note: "Yeni randevu notu" }, database);
      const updated = (await database.appointments.get(appointmentId))!;

      expect(updated).toMatchObject({
        note: "Yeni randevu notu",
        appointment_at: before.appointment_at,
        guardian_message_due_at: before.guardian_message_due_at,
        guardian_message_generation: before.guardian_message_generation,
        guardian_message_sent_at: before.guardian_message_sent_at,
        status: "pending"
      });
      expect((await database.call_logs.get(ownerCallLogId))?.note).toBe("İlk görüşme notu");
      await expect(updatePendingAppointmentNote(appointmentId, { ...expected(before), note: "Eski modal notu" }, database)).rejects.toThrow(
        "güncel değil"
      );
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("reschedules the same appointment, resets its guardian cycle, and changes both identities", async () => {
    const database = await createDatabase();

    try {
      const { appointmentId, ownerCallLogId } = await seedPendingAppointment(database, {
        guardian_message_sent_at: "2026-05-10T08:30:00.000Z"
      });
      const before = (await database.appointments.get(appointmentId))!;
      const oldIdentities = (await readOperationalAlertItems(readerNow, database)).map((item) => item.identity);
      await reschedulePendingAppointment(
        appointmentId,
        { ...expected(before), appointment_at: "2099-05-13T14:01:00.000Z" },
        database
      );
      const updated = (await database.appointments.get(appointmentId))!;
      const newAlerts = await readOperationalAlertItems(readerNow, database);

      expect(updated).toMatchObject({
        id: appointmentId,
        call_log_id: ownerCallLogId,
        status: "pending",
        appointment_at: "2099-05-13T14:01:00.000Z",
        guardian_message_due_at: "2099-05-12T16:00:00.000Z",
        guardian_message_generation: 2,
        guardian_message_sent_at: null
      });
      expect(newAlerts.filter((item) => item.source_id === appointmentId).map((item) => item.identity)).toEqual([
        `appointment_guardian_message|${appointmentId}|2|2099-05-12T16:00:00.000Z`,
        `appointment_start|${appointmentId}|2099-05-13T14:01:00.000Z`
      ]);
      expect(newAlerts.map((item) => item.identity).some((identity) => oldIdentities.includes(identity))).toBe(false);
      expect(await database.reminders.count()).toBe(0);
      await expect(
        reschedulePendingAppointment(appointmentId, { ...expected(before), appointment_at: "2099-05-14T09:00:00.000Z" }, database)
      ).rejects.toThrow("güncel değil");
    } finally {
      database.close();
      await database.delete();
    }
  });

  it.each([
    ["completed", completePendingAppointment, "appointment_complete"],
    ["no_show", markPendingAppointmentNoShow, "appointment_no_show"],
    ["cancelled", cancelPendingAppointment, "appointment_cancel"]
  ] as const)("transitions a pending appointment to %s once without mutating its owner", async (status, action, marker) => {
    const database = await createDatabase();

    try {
      const { appointmentId, ownerCallLogId } = await seedPendingAppointment(database);
      const before = (await database.appointments.get(appointmentId))!;
      const ownerBefore = await database.call_logs.get(ownerCallLogId);
      await action(appointmentId, expected(before), database);
      const updated = (await database.appointments.get(appointmentId))!;

      expect(updated.status).toBe(status);
      expect(await database.call_logs.get(ownerCallLogId)).toEqual(ownerBefore);
      expect((await readOperationalAlertItems(readerNow, database)).filter((item) => item.source_id === appointmentId)).toHaveLength(0);
      expect((await database.audit_logs.where("entity_id").equals(appointmentId).toArray())).toEqual(
        expect.arrayContaining([expect.objectContaining({ field_name: marker })])
      );
      await expect(action(appointmentId, { expected_updated_at: updated.updated_at }, database)).rejects.toThrow(
        "güvenle doğrulanamadı"
      );
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("fails closed for stale, legacy, deleted, and conflicting lifecycle ownership", async () => {
    const database = await createDatabase();

    try {
      const { appointmentId, ownerCallLogId, studentId } = await seedPendingAppointment(database);
      const before = (await database.appointments.get(appointmentId))!;

      await expect(reschedulePendingAppointment(appointmentId, { ...expected(before), appointment_at: "2020-05-10T09:00:00.000Z" }, database)).rejects.toThrow(
        "gelecekte"
      );
      for (const status of ["attended", "missed", "registered", "postponed"] as const) {
        await database.appointments.update(appointmentId, { status });
        await expect(updatePendingAppointmentNote(appointmentId, { ...expected(before), note: "Eski" }, database)).rejects.toThrow(
          "güvenle doğrulanamadı"
        );
      }
      await database.appointments.update(appointmentId, { status: "pending", deleted_at: "2026-05-10T09:00:00.000Z" });
      await expect(updatePendingAppointmentNote(appointmentId, { ...expected(before), note: "Eski" }, database)).rejects.toThrow(
        "güvenle doğrulanamadı"
      );
      await database.appointments.update(appointmentId, { deleted_at: null });
      await database.call_logs.update(ownerCallLogId, { created_appointment_id: null });
      await expect(updatePendingAppointmentNote(appointmentId, { ...expected(before), note: "Eski" }, database)).rejects.toThrow(
        "güvenle doğrulanamadı"
      );
      await database.call_logs.update(ownerCallLogId, { created_appointment_id: appointmentId });
      const duplicateOwnerId = await database.call_logs.add(ownerCallLog(studentId, { created_appointment_id: appointmentId }));
      await expect(updatePendingAppointmentNote(appointmentId, { ...expected(before), note: "Eski" }, database)).rejects.toThrow(
        "güvenle doğrulanamadı"
      );
      await database.call_logs.delete(duplicateOwnerId);
      await database.appointments.add(appointment(studentId, ownerCallLogId, { status: "completed" }));
      await expect(updatePendingAppointmentNote(appointmentId, { ...expected(before), note: "Eski" }, database)).rejects.toThrow(
        "güvenle doğrulanamadı"
      );
    } finally {
      database.close();
      await database.delete();
    }
  });

  it.each(integrityCorruptions)("rejects lifecycle mutation for %s without changing records or audit", async (_label, corrupt) => {
    const database = await createDatabase();

    try {
      const seed = await seedPendingAppointment(database);
      await corrupt(database, seed);
      const appointmentBefore = (await database.appointments.get(seed.appointmentId))!;
      const ownerBefore = await database.call_logs.get(seed.ownerCallLogId);
      const studentBefore = await database.students.get(seed.studentId);
      const auditCountBefore = await database.audit_logs.count();

      await expect(
        updatePendingAppointmentNote(seed.appointmentId, { ...expected(appointmentBefore), note: "Yazılmamalı" }, database)
      ).rejects.toThrow("güvenle doğrulanamadı");

      expect(await database.appointments.get(seed.appointmentId)).toEqual(appointmentBefore);
      expect(await database.call_logs.get(seed.ownerCallLogId)).toEqual(ownerBefore);
      expect(await database.students.get(seed.studentId)).toEqual(studentBefore);
      expect(await database.audit_logs.count()).toBe(auditCountBefore);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("rolls back the appointment mutation when audit append fails", async () => {
    const database = await createDatabase();

    try {
      const { appointmentId } = await seedPendingAppointment(database);
      const before = (await database.appointments.get(appointmentId))!;
      vi.spyOn(database.audit_logs, "add").mockRejectedValueOnce(new Error("Audit append failed"));

      await expect(updatePendingAppointmentNote(appointmentId, { ...expected(before), note: "Yazılmamalı" }, database)).rejects.toThrow(
        "Audit append failed"
      );
      expect(await database.appointments.get(appointmentId)).toEqual(before);
    } finally {
      database.close();
      await database.delete();
    }
  });
});
