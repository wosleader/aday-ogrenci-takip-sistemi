import { describe, expect, it } from "vitest";
import { AppDatabase } from "../../src/db/db";
import type { ReminderStatus } from "../../src/domain/constants/statuses";
import type { CallLogRecord } from "../../src/domain/models/callLog";
import type { ReminderRecord } from "../../src/domain/models/reminder";
import type { StudentRecord } from "../../src/domain/models/student";
import { readCallHistoryForStudent } from "../../src/features/calls/services/callHistoryReader";
import { createSearchText, normalizeText } from "../../src/utils/normalizeText";

const timestamp = "2026-05-08T09:00:00.000Z";

async function createDatabase() {
  const database = new AppDatabase(`test-call-history-${crypto.randomUUID()}`);
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

function callLog(studentId: number, overrides: Partial<CallLogRecord> = {}): CallLogRecord {
  return {
    uuid: crypto.randomUUID(),
    student_id: studentId,
    phone_id: null,
    contacted_phone_id: null,
    contacted_phone_number: null,
    contacted_phone_label: null,
    call_time: timestamp,
    call_result: "reached",
    note: null,
    reminder_at: null,
    next_action: null,
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

function reminder(studentId: number, status: ReminderStatus, overrides: Partial<ReminderRecord> = {}): ReminderRecord {
  return {
    uuid: crypto.randomUUID(),
    student_id: studentId,
    reminder_type: "call",
    reminder_at: "2026-05-10T11:00:00.000Z",
    status,
    note: null,
    is_default_time_assigned: false,
    sync_status: "local",
    created_at: timestamp,
    updated_at: timestamp,
    deleted_at: null,
    ...overrides
  };
}

describe("callHistoryReader", () => {
  it("returns call logs newest first with labels and phone info", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      await database.call_logs.bulkAdd([
        callLog(studentId, {
          call_time: "2026-05-08T09:00:00.000Z",
          note: "İlk görüşme"
        }),
        callLog(studentId, {
          call_time: "2026-05-09T09:00:00.000Z",
          call_result: "call_later",
          contacted_phone_number: "05321234567",
          contacted_phone_label: "Telefon 1",
          reminder_at: "2026-05-10T11:00:00.000Z",
          note: "Yarın aranacak"
        })
      ]);

      const history = await readCallHistoryForStudent(studentId, database);

      expect(history).toHaveLength(2);
      expect(history[0]).toMatchObject({
        call_result: "call_later",
        call_result_label: "Sonra Aranacak",
        contacted_phone_number: "05321234567",
        contacted_phone_label: "Telefon 1",
        phone_context_label: "Telefon 1",
        phone_context_number: "05321234567",
        note: "Yarın aranacak"
      });
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("uses phone snapshot before legacy contacted phone fields", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      await database.call_logs.add(
        callLog(studentId, {
          phone_snapshot: {
            phone_id: 42,
            reference_label: "Telefon 3",
            relation_label: "Öğrenci",
            phone_number: "05551234567",
            source_column: "Öğrenci Telefon"
          },
          contacted_phone_number: "05321234567",
          contacted_phone_label: "Telefon 1"
        })
      );

      const history = await readCallHistoryForStudent(studentId, database);

      expect(history[0]).toMatchObject({
        phone_context_label: "Telefon 3 · Öğrenci",
        phone_context_number: "05551234567",
        contacted_phone_label: "Telefon 1",
        contacted_phone_number: "05321234567"
      });
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("keeps phone context fields null when snapshot and legacy phone data are missing", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      await database.call_logs.add(callLog(studentId));

      const history = await readCallHistoryForStudent(studentId, database);

      expect(history[0]).toMatchObject({
        phone_context_label: null,
        phone_context_number: null,
        contacted_phone_label: null,
        contacted_phone_number: null
      });
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("preserves Turkish relation labels from phone snapshots", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      await database.call_logs.bulkAdd([
        callLog(studentId, {
          call_time: "2026-05-08T09:00:00.000Z",
          phone_snapshot: {
            phone_id: 1,
            reference_label: "Telefon 4",
            relation_label: "Yakın",
            phone_number: "05550000001"
          }
        }),
        callLog(studentId, {
          call_time: "2026-05-08T10:00:00.000Z",
          phone_snapshot: {
            phone_id: 2,
            reference_label: "Telefon 5",
            relation_label: "Diğer",
            phone_number: "05550000002"
          }
        })
      ]);

      const history = await readCallHistoryForStudent(studentId, database);

      expect(history.map((item) => item.phone_context_label)).toEqual(["Telefon 5 · Diğer", "Telefon 4 · Yakın"]);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it.each([
    ["pending", true],
    ["completed", false],
    ["cancelled", false]
  ] satisfies Array<[ReminderStatus, boolean]>)(
    "exposes linked reminder completion state for %s reminders",
    async (status, canComplete) => {
      const database = await createDatabase();

      try {
        const studentId = await database.students.add(student());
        const reminderId = await database.reminders.add(reminder(studentId, status));
        await database.call_logs.add(
          callLog(studentId, {
            created_reminder_id: reminderId,
            reminder_at: "2026-05-10T11:00:00.000Z"
          })
        );

        const history = await readCallHistoryForStudent(studentId, database);

        expect(history[0]).toMatchObject({
          linked_reminder_id: reminderId,
          linked_reminder_status: status,
          linked_reminder_at: "2026-05-10T11:00:00.000Z",
          canCompleteLinkedReminder: canComplete
        });
      } finally {
        database.close();
        await database.delete();
      }
    }
  );

  it("exposes linked reminder completion only on the reminder owner call log", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const reminderId = await database.reminders.add(reminder(studentId, "pending"));
      const firstCallLogId = await database.call_logs.add(
        callLog(studentId, {
          call_time: "2026-05-08T09:00:00.000Z",
          created_reminder_id: reminderId,
          note: "Eski tekrar arama kaydı"
        })
      );
      const ownerCallLogId = await database.call_logs.add(
        callLog(studentId, {
          call_time: "2026-05-09T09:00:00.000Z",
          created_reminder_id: reminderId,
          note: "Hatırlatma sahibi kayıt"
        })
      );
      const thirdCallLogId = await database.call_logs.add(
        callLog(studentId, {
          call_time: "2026-05-10T09:00:00.000Z",
          created_reminder_id: reminderId,
          note: "Daha yeni ama owner olmayan kayıt"
        })
      );
      await database.reminders.update(reminderId, { call_log_id: ownerCallLogId });

      const history = await readCallHistoryForStudent(studentId, database);
      const completionByCallLogId = new Map(history.map((item) => [item.call_log_id, item.canCompleteLinkedReminder]));

      expect(completionByCallLogId.get(firstCallLogId)).toBe(false);
      expect(completionByCallLogId.get(ownerCallLogId)).toBe(true);
      expect(completionByCallLogId.get(thirdCallLogId)).toBe(false);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("falls back to the latest active linked call log when reminder owner is missing", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const reminderId = await database.reminders.add(reminder(studentId, "pending"));
      const firstCallLogId = await database.call_logs.add(
        callLog(studentId, {
          call_time: "2026-05-08T09:00:00.000Z",
          created_reminder_id: reminderId
        })
      );
      const latestCallLogId = await database.call_logs.add(
        callLog(studentId, {
          call_time: "2026-05-09T09:00:00.000Z",
          created_reminder_id: reminderId
        })
      );

      const history = await readCallHistoryForStudent(studentId, database);
      const completionByCallLogId = new Map(history.map((item) => [item.call_log_id, item.canCompleteLinkedReminder]));

      expect(completionByCallLogId.get(firstCallLogId)).toBe(false);
      expect(completionByCallLogId.get(latestCallLogId)).toBe(true);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("uses created_at as the owner fallback when linked call_time is empty", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const reminderId = await database.reminders.add(reminder(studentId, "pending"));
      const firstCallLogId = await database.call_logs.add(
        callLog(studentId, {
          call_time: "",
          created_at: "2026-05-08T09:00:00.000Z",
          created_reminder_id: reminderId
        })
      );
      const latestCallLogId = await database.call_logs.add(
        callLog(studentId, {
          call_time: "",
          created_at: "2026-05-09T09:00:00.000Z",
          created_reminder_id: reminderId
        })
      );

      const history = await readCallHistoryForStudent(studentId, database);
      const completionByCallLogId = new Map(history.map((item) => [item.call_log_id, item.canCompleteLinkedReminder]));

      expect(completionByCallLogId.get(firstCallLogId)).toBe(false);
      expect(completionByCallLogId.get(latestCallLogId)).toBe(true);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("keeps each linked reminder scoped to its own owner call log", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      const firstReminderId = await database.reminders.add(reminder(studentId, "pending"));
      const secondReminderId = await database.reminders.add(reminder(studentId, "pending"));
      const firstOwnerCallLogId = await database.call_logs.add(
        callLog(studentId, {
          call_time: "2026-05-08T09:00:00.000Z",
          created_reminder_id: firstReminderId
        })
      );
      const secondOwnerCallLogId = await database.call_logs.add(
        callLog(studentId, {
          call_time: "2026-05-09T09:00:00.000Z",
          created_reminder_id: secondReminderId
        })
      );
      await database.reminders.update(firstReminderId, { call_log_id: firstOwnerCallLogId });
      await database.reminders.update(secondReminderId, { call_log_id: secondOwnerCallLogId });

      const history = await readCallHistoryForStudent(studentId, database);
      const completionByCallLogId = new Map(history.map((item) => [item.call_log_id, item.canCompleteLinkedReminder]));

      expect(completionByCallLogId.get(firstOwnerCallLogId)).toBe(true);
      expect(completionByCallLogId.get(secondOwnerCallLogId)).toBe(true);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("keeps unlinked and missing linked reminders safe for completion UI", async () => {
    const database = await createDatabase();

    try {
      const studentId = await database.students.add(student());
      await database.call_logs.bulkAdd([
        callLog(studentId, { call_time: "2026-05-08T10:00:00.000Z" }),
        callLog(studentId, {
          call_time: "2026-05-08T11:00:00.000Z",
          created_reminder_id: 999,
          reminder_at: "2026-05-10T11:00:00.000Z"
        })
      ]);

      const history = await readCallHistoryForStudent(studentId, database);

      expect(history[0]).toMatchObject({
        linked_reminder_id: 999,
        linked_reminder_status: null,
        canCompleteLinkedReminder: false
      });
      expect(history[1]).toMatchObject({
        linked_reminder_id: null,
        linked_reminder_status: null,
        canCompleteLinkedReminder: false
      });
    } finally {
      database.close();
      await database.delete();
    }
  });
});
