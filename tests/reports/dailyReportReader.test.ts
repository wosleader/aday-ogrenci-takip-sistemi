import { afterEach, describe, expect, it } from "vitest";
import { AppDatabase } from "../../src/db/db";
import type { CallLogRecord } from "../../src/domain/models/callLog";
import type { GuardianRecord } from "../../src/domain/models/guardian";
import type { ReminderRecord } from "../../src/domain/models/reminder";
import type { StudentRecord } from "../../src/domain/models/student";
import {
  createDailyReportSummary,
  createLocalDayRange,
  getRecentDailyCallRows,
  readDailyReport
} from "../../src/features/reports/services/dailyReportReader";
import { createSearchText, normalizeText } from "../../src/utils/normalizeText";

const timestamp = "2026-05-10T09:00:00.000";
const selectedDay = "2026-05-10";

let database: AppDatabase | null = null;

async function createDatabase() {
  database = new AppDatabase(`test-daily-report-${crypto.randomUUID()}`);
  await database.open();
  return database;
}

function student(name: string, overrides: Partial<StudentRecord> = {}): StudentRecord {
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
    sync_status: "local",
    created_at: timestamp,
    updated_at: timestamp,
    deleted_at: null,
    ...overrides
  };
}

function guardian(studentId: number, name = "Veli Aday"): GuardianRecord {
  return {
    uuid: crypto.randomUUID(),
    student_id: studentId,
    guardian_full_name: name,
    normalized_guardian_name: normalizeText(name),
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
    call_time: "2026-05-10T10:00:00.000",
    call_result: "reached",
    note: null,
    sync_status: "local",
    created_at: "2026-05-10T10:00:00.000",
    updated_at: "2026-05-10T10:00:00.000",
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

async function seedStudent(name = "Aday Ogrenci") {
  const testDb = database ?? (await createDatabase());
  const studentId = await testDb.students.add(student(name));
  await testDb.guardians.add(guardian(studentId, `${name} Velisi`));

  return studentId;
}

describe("dailyReportReader", () => {
  afterEach(async () => {
    if (database) {
      database.close();
      await database.delete();
      database = null;
    }
  });

  it("creates a local day range from midnight to the end of the selected day", () => {
    const range = createLocalDayRange("2026-05-10");

    expect(range.date_input_value).toBe("2026-05-10");
    expect(range.start.getHours()).toBe(0);
    expect(range.start.getMinutes()).toBe(0);
    expect(range.start.getMilliseconds()).toBe(0);
    expect(range.end.getHours()).toBe(23);
    expect(range.end.getMinutes()).toBe(59);
    expect(range.end.getSeconds()).toBe(59);
    expect(range.end.getMilliseconds()).toBe(999);
  });

  it("counts only selected-day call logs and keeps unique student count separate from call log count", async () => {
    const testDb = await createDatabase();
    const firstStudentId = await seedStudent("Birinci Aday");
    const secondStudentId = await seedStudent("Ikinci Aday");
    await testDb.call_logs.bulkAdd([
      callLog(firstStudentId, { call_time: "2026-05-10T09:00:00.000", call_result: "reached" }),
      callLog(firstStudentId, { call_time: "2026-05-10T11:00:00.000", call_result: "not_reached" }),
      callLog(secondStudentId, { call_time: "2026-05-10T12:00:00.000", call_result: "call_later" }),
      callLog(secondStudentId, { call_time: "2026-05-11T12:00:00.000", call_result: "registered" })
    ]);

    const report = await readDailyReport(selectedDay, { database: testDb, now: "2026-05-10T12:00:00.000" });

    expect(report.summary.unique_student_count).toBe(2);
    expect(report.summary.call_log_count).toBe(3);
    expect(report.summary.reached_count).toBe(1);
    expect(report.summary.not_reached_count).toBe(1);
    expect(report.summary.call_later_count).toBe(1);
    expect(report.summary.registered_count).toBe(0);
  });

  it("counts call result breakdowns with the real call_result values", () => {
    const summary = createDailyReportSummary([
      callLog(1, { call_result: "reached" }),
      callLog(2, { call_result: "not_reached" }),
      callLog(3, { call_result: "call_later" }),
      callLog(4, { call_result: "appointment" }),
      callLog(5, { call_result: "registered" }),
      callLog(6, { call_result: "do_not_call" }),
      callLog(7, { call_result: "not_interested" }),
      callLog(8, { call_result: "wrong_number" }),
      callLog(9, { call_result: "not_called" })
    ]);

    expect(summary).toMatchObject({
      unique_student_count: 9,
      call_log_count: 9,
      reached_count: 1,
      not_reached_count: 1,
      call_later_count: 1,
      appointment_count: 1,
      registered_count: 1,
      do_not_call_count: 2,
      wrong_number_count: 1
    });
    expect(summary).not.toHaveProperty("not_called_count");
  });

  it("creates recent call rows from newest to oldest, limits to 10 and ignores empty note previews", async () => {
    const testDb = await createDatabase();
    const studentId = await seedStudent("Son Gorusme Adayi");
    const callLogIds: number[] = [];

    for (let index = 1; index <= 11; index += 1) {
      const hour = String(8 + index).padStart(2, "0");
      const id = await testDb.call_logs.add(
        callLog(studentId, {
          call_time: `2026-05-10T${hour}:00:00.000`,
          call_result: index === 11 ? "appointment" : "reached",
          note: index === 11 ? "  " : `Not ${index}`
        })
      );
      callLogIds.push(id);
    }

    const rows = getRecentDailyCallRows(
      (await testDb.call_logs.toArray()) as Array<CallLogRecord & { id: number }>,
      new Map([[studentId, { student_full_name: "Son Gorusme Adayi" }]]),
      new Map([[studentId, [guardian(studentId, "Son Veli")]]])
    );

    expect(rows).toHaveLength(10);
    expect(rows[0]).toMatchObject({
      call_log_id: callLogIds[10],
      call_result: "appointment",
      note_preview: null
    });
    expect(rows.at(-1)?.call_log_id).toBe(callLogIds[1]);
  });

  it("uses created_at as the daily filter fallback when call_time is empty", async () => {
    const testDb = await createDatabase();
    const studentId = await seedStudent("Fallback Aday");
    await testDb.call_logs.add(
      callLog(studentId, {
        call_time: "",
        created_at: "2026-05-10T15:00:00.000",
        call_result: "registered"
      })
    );

    const report = await readDailyReport(selectedDay, { database: testDb, now: "2026-05-10T12:00:00.000" });

    expect(report.summary.call_log_count).toBe(1);
    expect(report.summary.registered_count).toBe(1);
    expect(report.recent_calls[0].call_time_label).not.toBe("-");
  });

  it("includes a reminder summary that follows the reminder list reader buckets", async () => {
    const testDb = await createDatabase();
    const overdueStudentId = await seedStudent("Geciken Aday");
    const todayStudentId = await seedStudent("Bugunku Aday");
    const upcomingStudentId = await seedStudent("Yaklasan Aday");
    await testDb.reminders.bulkAdd([
      reminder(overdueStudentId, "2026-05-09T10:00:00.000"),
      reminder(todayStudentId, "2026-05-10T13:00:00.000"),
      reminder(upcomingStudentId, "2026-05-11T13:00:00.000")
    ]);

    const report = await readDailyReport(selectedDay, { database: testDb, now: "2026-05-10T12:00:00.000" });

    expect(report.reminder_summary).toEqual({ overdue: 1, today: 1, upcoming: 1, all: 3 });
  });
});
