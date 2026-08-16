import { describe, expect, it } from "vitest";
import { AppDatabase } from "../../src/db/db";
import type { AppointmentRecord } from "../../src/domain/models/appointment";
import type { CallLogRecord } from "../../src/domain/models/callLog";
import type { GuardianRecord } from "../../src/domain/models/guardian";
import type { ReminderRecord } from "../../src/domain/models/reminder";
import type { StudentRecord } from "../../src/domain/models/student";
import {
  dismissOperationalAlert,
  filterDismissedOperationalAlerts,
  readDueOperationalAlerts,
  readOperationalAlertItems
} from "../../src/features/reminders/services/operationalAlertReader";
import { createSearchText, normalizeText } from "../../src/utils/normalizeText";

const timestamp = "2026-05-10T08:00:00.000Z";
const now = "2026-05-10T12:00:00.000Z";

async function createDatabase() {
  const database = new AppDatabase(`test-operational-alerts-${crypto.randomUUID()}`);
  await database.open();
  return database;
}

function student(name = "AYŞE YILMAZ", overrides: Partial<StudentRecord> = {}): StudentRecord {
  return {
    uuid: crypto.randomUUID(),
    student_full_name: name,
    normalized_student_name: normalizeText(name),
    search_text: createSearchText([name]),
    current_class: "11",
    student_group: "YKS",
    category: "YKS",
    campaign_id: null,
    lifecycle_status: "candidate",
    last_call_result: "not_called",
    created_at: timestamp,
    updated_at: timestamp,
    deleted_at: null,
    sync_status: "local",
    ...overrides
  };
}

function guardian(studentId: number, overrides: Partial<GuardianRecord> = {}): GuardianRecord {
  return {
    uuid: crypto.randomUUID(),
    student_id: studentId,
    guardian_full_name: "FATMA YILMAZ",
    normalized_guardian_name: "fatma yilmaz",
    created_at: timestamp,
    updated_at: timestamp,
    deleted_at: null,
    sync_status: "local",
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
    created_at: timestamp,
    updated_at: timestamp,
    deleted_at: null,
    sync_status: "local",
    ...overrides
  };
}

function ownerCallLog(studentId: number, overrides: Partial<CallLogRecord> = {}): CallLogRecord {
  return {
    uuid: crypto.randomUUID(),
    student_id: studentId,
    call_time: timestamp,
    call_result: "appointment",
    note: "Randevu notu",
    created_at: timestamp,
    updated_at: timestamp,
    deleted_at: null,
    sync_status: "local",
    ...overrides
  };
}

function appointment(studentId: number, ownerId: number, overrides: Partial<AppointmentRecord> = {}): AppointmentRecord {
  return {
    uuid: crypto.randomUUID(),
    student_id: studentId,
    appointment_at: "2026-05-10T14:00:00.000Z",
    status: "pending",
    call_log_id: ownerId,
    guardian_message_due_at: "2026-05-10T11:00:00.000Z",
    guardian_message_sent_at: null,
    guardian_message_generation: 1,
    note: "Randevuya hazırlık",
    created_at: timestamp,
    updated_at: timestamp,
    deleted_at: null,
    sync_status: "local",
    ...overrides
  };
}

async function seedModernAppointment(database: AppDatabase, overrides: Partial<AppointmentRecord> = {}) {
  const studentId = await database.students.add(student());
  const guardianId = await database.guardians.add(guardian(studentId));
  const ownerId = await database.call_logs.add(ownerCallLog(studentId));
  const appointmentId = await database.appointments.add(appointment(studentId, ownerId, { guardian_id: guardianId, ...overrides }));
  await database.call_logs.update(ownerId, { created_appointment_id: appointmentId });

  return { studentId, guardianId, ownerId, appointmentId };
}

describe("operationalAlertReader", () => {
  it("keeps call reminders as list items and only includes due items in the alarm reader", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const dueReminderId = await database.reminders.add(reminder(studentId, "2026-05-10T11:00:00.000Z"));
      const futureReminderId = await database.reminders.add(reminder(studentId, "2026-05-10T13:00:00.000Z"));

      const allItems = await readOperationalAlertItems(now, database);
      const dueItems = await readDueOperationalAlerts(now, database);

      expect(allItems).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            identity: `${dueReminderId}|2026-05-10T11:00:00.000Z`,
            kind: "call_reminder",
            source_type: "reminder",
            source_id: dueReminderId
          }),
          expect.objectContaining({ identity: `${futureReminderId}|2026-05-10T13:00:00.000Z`, bucket: "today" })
        ])
      );
      expect(dueItems.map((item) => item.source_id)).toEqual([dueReminderId]);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("derives separate guardian-message and appointment-start items from one modern pending appointment", async () => {
    const database = await createDatabase();

    try {
      const { appointmentId } = await seedModernAppointment(database);
      const allItems = await readOperationalAlertItems(now, database);
      const dueItems = await readDueOperationalAlerts(now, database);

      expect(allItems.filter((item) => item.source_id === appointmentId)).toEqual([
        expect.objectContaining({
          kind: "appointment_guardian_message",
          identity: `appointment_guardian_message|${appointmentId}|1|2026-05-10T11:00:00.000Z`,
          title: "Veli mesajı hatırlatması",
          bucket: "overdue"
        }),
        expect.objectContaining({
          kind: "appointment_start",
          identity: `appointment_start|${appointmentId}|2026-05-10T14:00:00.000Z`,
          title: "Randevu zamanı",
          bucket: "today"
        })
      ]);
      expect(dueItems.map((item) => item.kind)).toEqual(["appointment_guardian_message"]);
      expect(await database.reminders.count()).toBe(0);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("creates the guardian task only when the sent marker is explicitly null", async () => {
    const database = await createDatabase();

    try {
      const { appointmentId } = await seedModernAppointment(database);

      expect((await readOperationalAlertItems(now, database)).filter((item) => item.source_id === appointmentId).map((item) => item.kind)).toEqual([
        "appointment_guardian_message",
        "appointment_start"
      ]);

      for (const guardianMessageSentAt of [undefined, "", "2026-05-10T11:05:00.000Z"]) {
        await database.appointments.update(appointmentId, { guardian_message_sent_at: guardianMessageSentAt });

        expect((await readOperationalAlertItems(now, database)).filter((item) => item.source_id === appointmentId).map((item) => item.kind)).toEqual([
          "appointment_start"
        ]);
      }
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("fails closed for incomplete, conflicting and terminal appointment records", async () => {
    const database = await createDatabase();

    try {
      const { appointmentId, ownerId } = await seedModernAppointment(database);
      await database.appointments.update(appointmentId, { guardian_message_generation: 0 });
      expect(await readOperationalAlertItems(now, database)).toHaveLength(0);

      await database.appointments.update(appointmentId, { guardian_message_generation: 1 });
      await database.call_logs.update(ownerId, { created_appointment_id: null });
      expect(await readOperationalAlertItems(now, database)).toHaveLength(0);

      await database.call_logs.update(ownerId, { created_appointment_id: appointmentId });
      await database.appointments.update(appointmentId, { status: "completed" });
      expect(await readOperationalAlertItems(now, database)).toHaveLength(0);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("does not infer operational alerts for legacy appointment statuses or missing owner links", async () => {
    const database = await createDatabase();

    try {
      const { appointmentId } = await seedModernAppointment(database, { call_log_id: null });
      expect(await readOperationalAlertItems(now, database)).toHaveLength(0);

      await database.appointments.update(appointmentId, { status: "attended" });
      expect(await readOperationalAlertItems(now, database)).toHaveLength(0);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("keeps guardian and appointment-start dismissal identities independent", async () => {
    const database = await createDatabase();

    try {
      const { appointmentId } = await seedModernAppointment(database, { appointment_at: "2026-05-10T10:00:00.000Z" });
      const dueItems = await readDueOperationalAlerts(now, database);
      const guardianAlert = dueItems.find((item) => item.kind === "appointment_guardian_message")!;
      const startAlert = dueItems.find((item) => item.kind === "appointment_start")!;
      const dismissed = dismissOperationalAlert([], guardianAlert);

      expect(guardianAlert.source_id).toBe(appointmentId);
      expect(guardianAlert.identity).not.toBe(startAlert.identity);
      expect(filterDismissedOperationalAlerts(dueItems, dismissed).map((item) => item.identity)).toEqual([startAlert.identity]);
    } finally {
      database.close();
      await database.delete();
    }
  });
});
