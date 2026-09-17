import { afterEach, describe, expect, it } from "vitest";
import { AppDatabase } from "../../src/db/db";
import type { AppointmentRecord } from "../../src/domain/models/appointment";
import type { CallLogRecord } from "../../src/domain/models/callLog";
import type { PhoneRecord } from "../../src/domain/models/phone";
import type { ReminderRecord } from "../../src/domain/models/reminder";
import type { StudentRecord } from "../../src/domain/models/student";
import {
  readStudentOperationalHelper,
  resolveStudentOperationalHelper
} from "../../src/features/students/services/studentOperationalHelperReader";
import { createSearchText, normalizeText } from "../../src/utils/normalizeText";

const createdAt = "2026-05-08T09:00:00.000Z";
const now = "2026-05-10T12:00:00.000Z";
const databases: AppDatabase[] = [];

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
    created_at: createdAt,
    updated_at: createdAt,
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
    reference_label: "Telefon 1",
    relation_label: "Telefon",
    priority: 1,
    phone_status: "active",
    is_valid: true,
    is_wrong: false,
    is_primary: true,
    call_outcome: "not_called",
    call_outcome_updated_at: null,
    sync_status: "local",
    created_at: createdAt,
    updated_at: createdAt,
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
    created_at: createdAt,
    updated_at: createdAt,
    deleted_at: null,
    ...overrides
  };
}

function appointment(
  studentId: number,
  id: number,
  appointmentAt: string,
  overrides: Partial<AppointmentRecord> = {}
): AppointmentRecord {
  return {
    id,
    uuid: crypto.randomUUID(),
    student_id: studentId,
    guardian_id: null,
    appointment_at: appointmentAt,
    status: "pending",
    campaign_id: null,
    note: null,
    call_log_id: id,
    guardian_message_due_at: "2026-05-09T09:00:00.000Z",
    guardian_message_sent_at: null,
    guardian_message_generation: 1,
    sync_status: "local",
    created_at: createdAt,
    updated_at: createdAt,
    deleted_at: null,
    ...overrides
  };
}

function appointmentOwner(studentId: number, appointmentId: number, overrides: Partial<CallLogRecord> = {}): CallLogRecord {
  return {
    id: appointmentId,
    uuid: crypto.randomUUID(),
    student_id: studentId,
    call_time: createdAt,
    call_result: "appointment",
    created_appointment_id: appointmentId,
    sync_status: "local",
    created_at: createdAt,
    updated_at: createdAt,
    deleted_at: null,
    ...overrides
  };
}

async function createDatabase(): Promise<AppDatabase> {
  const database = new AppDatabase(`test-student-operational-helper-${crypto.randomUUID()}`);
  await database.open();
  databases.push(database);
  return database;
}

afterEach(async () => {
  while (databases.length > 0) {
    const database = databases.pop()!;
    database.close();
    await database.delete();
  }
});

describe("studentOperationalHelperReader", () => {
  it("returns no helper when there is no pending reminder", () => {
    expect(resolveStudentOperationalHelper({ reminders: [], now })).toBeNull();
  });

  it("returns an overdue helper for a pending call reminder", () => {
    const helper = resolveStudentOperationalHelper({
      reminders: [reminder(1, "2026-05-09T10:00:00.000Z", { id: 1 })],
      now
    });

    expect(helper).toMatchObject({
      kind: "overdue_call",
      primary_label: "Gecikmiş arama",
      display_label: expect.stringContaining("Gecikmiş arama"),
      reminder: { bucket: "overdue" }
    });
  });

  it("returns a today helper for a pending call reminder", () => {
    const helper = resolveStudentOperationalHelper({
      reminders: [reminder(1, "2026-05-10T13:00:00.000Z", { id: 1 })],
      now
    });

    expect(helper).toMatchObject({
      kind: "today_call",
      primary_label: "Bugün aranacak",
      display_label: expect.stringContaining("Bugün"),
      reminder: { bucket: "today" }
    });
  });

  it("does not require a usable phone for reminder helpers", async () => {
    const database = await createDatabase();
    const studentId = await database.students.add(student("Kullanılamayan Telefon"));
    await database.phones.add(phone(studentId, { phone_status: "invalid", is_wrong: true, invalid_reason: "manual" }));

    expect(await readStudentOperationalHelper(studentId, now, database)).toBeNull();

    await database.reminders.add(reminder(studentId, "2026-05-09T10:00:00.000Z", { id: 1 }));
    expect(await readStudentOperationalHelper(studentId, now, database)).toMatchObject({ kind: "overdue_call" });

    await database.reminders.clear();
    await database.reminders.add(reminder(studentId, "2026-05-10T13:00:00.000Z", { id: 2 }));
    expect(await readStudentOperationalHelper(studentId, now, database)).toMatchObject({ kind: "today_call" });
  });

  it("prioritizes overdue over today and selects the earliest due reminder", () => {
    const helper = resolveStudentOperationalHelper({
      reminders: [
        reminder(1, "2026-05-10T15:00:00.000Z", { id: 1 }),
        reminder(1, "2026-05-09T11:00:00.000Z", { id: 2 }),
        reminder(1, "2026-05-09T09:00:00.000Z", { id: 3 })
      ],
      now
    });

    expect(helper).toMatchObject({
      kind: "overdue_call",
      reminder: { reminder_at: "2026-05-09T09:00:00.000Z" }
    });
  });

  it("selects the earliest reminder among multiple today reminders", () => {
    const helper = resolveStudentOperationalHelper({
      reminders: [
        reminder(1, "2026-05-10T15:00:00.000Z", { id: 1 }),
        reminder(1, "2026-05-10T13:00:00.000Z", { id: 2 })
      ],
      now
    });

    expect(helper).toMatchObject({
      kind: "today_call",
      reminder: { reminder_at: "2026-05-10T13:00:00.000Z" }
    });
  });

  it("selects a today appointment before a today call reminder", () => {
    const helper = resolveStudentOperationalHelper({
      reminders: [reminder(1, "2026-05-10T13:00:00.000Z", { id: 1 })],
      appointments: [appointment(1, 2, "2026-05-10T13:00:00.000Z")],
      call_logs: [appointmentOwner(1, 2)],
      now
    });

    expect(helper).toMatchObject({
      kind: "today_appointment",
      primary_label: "Bugün",
      display_label: "Bugün 16:00'da randevu",
      appointment: {
        appointment_date_label: "10.05.2026",
        appointment_time_label: "16:00"
      }
    });
  });

  it("selects an overdue appointment before an overdue call and does not infer no-show", () => {
    const helper = resolveStudentOperationalHelper({
      reminders: [reminder(1, "2026-05-09T10:00:00.000Z", { id: 1 })],
      appointments: [appointment(1, 2, "2026-05-09T10:00:00.000Z")],
      call_logs: [appointmentOwner(1, 2)],
      now
    });

    expect(helper).toMatchObject({
      kind: "overdue_appointment",
      primary_label: "Gecikmiş randevu",
      appointment: { bucket: "overdue" }
    });
    expect(helper?.display_label).not.toContain("Gelmedi");
  });

  it("keeps an overdue appointment ahead of a today call", () => {
    const helper = resolveStudentOperationalHelper({
      reminders: [reminder(1, "2026-05-10T13:00:00.000Z", { id: 1 })],
      appointments: [appointment(1, 2, "2026-05-09T10:00:00.000Z")],
      call_logs: [appointmentOwner(1, 2)],
      now
    });

    expect(helper).toMatchObject({
      kind: "overdue_appointment",
      primary_label: "Gecikmiş randevu",
      display_label: "Gecikmiş randevu · 09.05.2026 13:00"
    });
  });

  it("keeps an overdue call ahead of a today appointment", () => {
    const helper = resolveStudentOperationalHelper({
      reminders: [reminder(1, "2026-05-09T10:00:00.000Z", { id: 1 })],
      appointments: [appointment(1, 2, "2026-05-10T13:00:00.000Z")],
      call_logs: [appointmentOwner(1, 2)],
      now
    });

    expect(helper).toMatchObject({ kind: "overdue_call", primary_label: "Gecikmiş arama" });
  });

  it("excludes future-day, terminal, deleted and malformed appointments", () => {
    const appointments = [
      appointment(1, 1, "2026-05-11T10:00:00.000Z"),
      appointment(1, 2, "2026-05-10T13:00:00.000Z", { status: "completed", call_log_id: 2 }),
      appointment(1, 3, "2026-05-10T13:00:00.000Z", { status: "cancelled", call_log_id: 3 }),
      appointment(1, 4, "2026-05-10T13:00:00.000Z", { status: "no_show", call_log_id: 4 }),
      appointment(1, 5, "2026-05-10T13:00:00.000Z", { deleted_at: now, call_log_id: 5 }),
      appointment(1, 6, "not-a-date", { call_log_id: 6 })
    ];

    expect(
      resolveStudentOperationalHelper({
        reminders: [],
        appointments,
        call_logs: appointments.map((candidate) => appointmentOwner(1, candidate.id!)),
        now
      })
    ).toBeNull();
  });

  it("selects the oldest overdue and earliest today appointment with stable id tie-break", () => {
    const overdueOldest = appointment(1, 2, "2026-05-08T10:00:00.000Z");
    const overdueNewer = appointment(1, 1, "2026-05-09T10:00:00.000Z");
    const todayLater = appointment(1, 4, "2026-05-10T15:00:00.000Z");
    const todayEarlier = appointment(1, 3, "2026-05-10T13:00:00.000Z");
    const sameTimeHigherId = appointment(1, 8, "2026-05-10T13:00:00.000Z");
    const sameTimeLowerId = appointment(1, 7, "2026-05-10T13:00:00.000Z");

    expect(
      resolveStudentOperationalHelper({
        reminders: [],
        appointments: [overdueNewer, todayLater, sameTimeHigherId, overdueOldest, todayEarlier, sameTimeLowerId],
        call_logs: [1, 2, 3, 4, 7, 8].map((id) => appointmentOwner(1, id)),
        now
      })
    ).toMatchObject({ appointment: { appointment_id: 2 } });

    expect(
      resolveStudentOperationalHelper({
        reminders: [],
        appointments: [todayLater, sameTimeHigherId, todayEarlier, sameTimeLowerId],
        call_logs: [3, 4, 7, 8].map((id) => appointmentOwner(1, id)),
        now
      })
    ).toMatchObject({ appointment: { appointment_id: 3 } });

    expect(
      resolveStudentOperationalHelper({
        reminders: [],
        appointments: [sameTimeHigherId, sameTimeLowerId],
        call_logs: [7, 8].map((id) => appointmentOwner(1, id)),
        now
      })
    ).toMatchObject({ appointment: { appointment_id: 7 } });
  });

  it("classifies appointment boundaries by the Istanbul calendar rather than machine-local date", () => {
    const helper = resolveStudentOperationalHelper({
      reminders: [],
      appointments: [appointment(1, 1, "2026-05-10T20:31:00.000Z")],
      call_logs: [appointmentOwner(1, 1)],
      now: "2026-05-10T20:30:00.000Z"
    });

    expect(helper).toMatchObject({
      kind: "today_appointment",
      appointment: { appointment_date_label: "10.05.2026", appointment_time_label: "23:31" }
    });
  });

  it("ignores upcoming, completed, cancelled, deleted and non-call reminders", () => {
    const helper = resolveStudentOperationalHelper({
      reminders: [
        reminder(1, "2026-05-11T10:00:00.000Z", { id: 1 }),
        reminder(1, "2026-05-10T10:00:00.000Z", { id: 2, status: "completed" }),
        reminder(1, "2026-05-10T10:00:00.000Z", { id: 3, status: "cancelled" }),
        reminder(1, "2026-05-10T10:00:00.000Z", { id: 4, deleted_at: now }),
        reminder(1, "2026-05-10T10:00:00.000Z", { id: 5, reminder_type: "follow_up" }),
        reminder(1, "not-a-date", { id: 6 })
      ],
      now
    });

    expect(helper).toBeNull();
  });

  it("does not let phone state affect the reminder helper", async () => {
    const database = await createDatabase();
    const studentId = await database.students.add(student("Telefon Durumu"));
    const phoneId = await database.phones.add(phone(studentId));
    await database.reminders.add(reminder(studentId, "2026-05-09T10:00:00.000Z"));

    const activeHelper = await readStudentOperationalHelper(studentId, now, database);
    await database.phones.update(phoneId, { phone_status: "invalid", is_wrong: true });
    const invalidHelper = await readStudentOperationalHelper(studentId, now, database);

    expect(activeHelper).toEqual(invalidHelper);
  });

  it("preserves reminder snapshot input while resolving read-only context", () => {
    const reminders = [
      reminder(1, "2026-05-10T13:00:00.000Z", {
        id: 1,
        phone_snapshot: {
          phone_id: 7,
          reference_label: "Telefon 7",
          relation_label: "Yakın",
          phone_number: "05551234567",
          source_column: "Yakın Telefon"
        }
      })
    ];
    const before = structuredClone(reminders);

    const helper = resolveStudentOperationalHelper({ reminders, now });

    expect(helper?.reminder).toMatchObject({
      phone_context_label: "Telefon 7 · Yakın",
      phone_context_number: "05551234567"
    });
    expect(reminders).toEqual(before);
  });

  it("reads only the selected active student and ignores a deleted student", async () => {
    const database = await createDatabase();
    const activeStudentId = await database.students.add(student("Aktif Aday"));
    const deletedStudentId = await database.students.add({ ...student("Silinmis Aday"), deleted_at: now });
    await database.reminders.add(reminder(activeStudentId, "2026-05-10T13:00:00.000Z"));

    expect(await readStudentOperationalHelper(activeStudentId, now, database)).toMatchObject({
      kind: "today_call",
      primary_label: "Bugün aranacak"
    });
    expect(await readStudentOperationalHelper(deletedStudentId, now, database)).toBeNull();
  });
});
