import { describe, expect, it } from "vitest";
import { readDashboardAppointmentSummary, readTodayPendingAppointmentCount } from "../../src/features/reports/services/dashboardAppointmentReader";
import { normalizeDashboardDateRange } from "../../src/features/reports/services/dashboardDateRange";
import { createReportsDatabase, makeAppointment, makeStudent } from "./dashboardTestFixtures";

describe("dashboardAppointmentReader", () => {
  it("normalizes lifecycle statuses and excludes deleted or unknown appointments", async () => {
    const database = await createReportsDatabase("test-dashboard-appointments");

    try {
      const studentId = await database.students.add(makeStudent());
      await database.appointments.bulkAdd([
        makeAppointment(studentId, { status: "pending" }),
        makeAppointment(studentId, { status: "completed" }),
        makeAppointment(studentId, { status: "no_show" }),
        makeAppointment(studentId, { status: "cancelled" }),
        makeAppointment(studentId, { status: "postponed" }),
        makeAppointment(studentId, { status: "registered" }),
        makeAppointment(studentId, { status: "attended" }),
        makeAppointment(studentId, { status: "missed" }),
        makeAppointment(studentId, { status: "pending", deleted_at: "2026-05-10T12:00:00.000Z" }),
        makeAppointment(studentId, { status: "pending", appointment_at: "2026-05-17T15:00:00.000Z" })
      ]);

      await expect(
        readDashboardAppointmentSummary(normalizeDashboardDateRange("2026-05-10", "2026-05-16"), database)
      ).resolves.toEqual({
        total: 8,
        pending: 1,
        attended: 2,
        noShow: 2,
        cancelled: 1,
        postponed: 1,
        registered: 1
      });
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("counts only non-deleted pending appointments on the local day", async () => {
    const database = await createReportsDatabase("test-dashboard-today-appointments");

    try {
      const studentId = await database.students.add(makeStudent());
      await database.appointments.bulkAdd([
        makeAppointment(studentId, { appointment_at: "2026-05-10T00:00:00.000Z" }),
        makeAppointment(studentId, { appointment_at: "2026-05-10T20:59:59.999Z" }),
        makeAppointment(studentId, { appointment_at: "2026-05-10T12:00:00.000Z", status: "completed" }),
        makeAppointment(studentId, { appointment_at: "2026-05-10T12:00:00.000Z", deleted_at: "2026-05-10T13:00:00.000Z" }),
        makeAppointment(studentId, { appointment_at: "2026-05-11T12:00:00.000Z" })
      ]);

      await expect(readTodayPendingAppointmentCount("2026-05-10T12:00:00.000Z", database)).resolves.toBe(2);
    } finally {
      database.close();
      await database.delete();
    }
  });
});
