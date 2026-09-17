import { describe, expect, it } from "vitest";
import { readDashboardReminderHealth } from "../../src/features/reports/services/dashboardReminderReader";
import { createReportsDatabase, makeReminder, makeStudent } from "./dashboardTestFixtures";

describe("dashboardReminderReader", () => {
  it("counts only open call reminders by local health bucket", async () => {
    const database = await createReportsDatabase("test-dashboard-reminders");

    try {
      const studentId = await database.students.add(makeStudent());
      await database.reminders.bulkAdd([
        makeReminder(studentId, { reminder_at: "2026-05-09T23:00:00.000Z" }),
        makeReminder(studentId, { reminder_at: "2026-05-10T14:00:00.000Z" }),
        makeReminder(studentId, { reminder_at: "2026-05-11T14:00:00.000Z" }),
        makeReminder(studentId, { reminder_type: "follow_up" }),
        makeReminder(studentId, { status: "completed" }),
        makeReminder(studentId, { deleted_at: "2026-05-10T12:00:00.000Z" })
      ]);

      await expect(readDashboardReminderHealth("2026-05-10T12:00:00.000Z", database)).resolves.toEqual({
        overdue: 1,
        today: 1,
        upcoming: 1,
        openTotal: 3
      });
    } finally {
      database.close();
      await database.delete();
    }
  });
});
