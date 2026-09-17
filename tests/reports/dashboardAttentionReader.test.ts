import { describe, expect, it } from "vitest";
import { readDashboardAttention } from "../../src/features/reports/services/dashboardAttentionReader";
import { createReportsDatabase, makeAppointment, makePhone, makeReminder, makeStudent } from "./dashboardTestFixtures";

describe("dashboardAttentionReader", () => {
  it("returns overdue reminders, today's pending appointments, and candidates without usable phones", async () => {
    const database = await createReportsDatabase("test-dashboard-attention");

    try {
      const healthyCandidateId = await database.students.add(makeStudent({ student_full_name: "Healthy Candidate" }));
      const unavailableCandidateId = await database.students.add(makeStudent({ student_full_name: "Unavailable Candidate" }));
      const noPhoneCandidateId = await database.students.add(makeStudent({ student_full_name: "No Phone Candidate" }));
      await database.students.add(makeStudent({ student_full_name: "Registered Student", lifecycle_status: "registered" }));
      await database.students.add(makeStudent({ student_full_name: "Do Not Call Student", lifecycle_status: "do_not_call" }));
      await database.students.add(makeStudent({ student_full_name: "Archived Student", lifecycle_status: "archived" }));
      const deletedCandidateId = await database.students.add(
        makeStudent({ student_full_name: "Deleted Candidate", deleted_at: "2026-05-10T12:00:00.000Z" })
      );

      await database.phones.add(makePhone(healthyCandidateId));
      await database.phones.add(makePhone(unavailableCandidateId, { phone_status: "invalid" }));
      await database.phones.add(makePhone(deletedCandidateId, { phone_status: "invalid" }));
      await database.reminders.bulkAdd([
        makeReminder(healthyCandidateId, { reminder_at: "2026-05-09T12:00:00.000Z" }),
        makeReminder(healthyCandidateId, { reminder_at: "2026-05-10T14:00:00.000Z" }),
        makeReminder(healthyCandidateId, { reminder_type: "follow_up", reminder_at: "2026-05-09T12:00:00.000Z" })
      ]);
      await database.appointments.bulkAdd([
        makeAppointment(healthyCandidateId, { appointment_at: "2026-05-10T15:00:00.000Z" }),
        makeAppointment(healthyCandidateId, { appointment_at: "2026-05-10T15:00:00.000Z", status: "completed" }),
        makeAppointment(healthyCandidateId, { appointment_at: "2026-05-11T15:00:00.000Z" })
      ]);

      await expect(readDashboardAttention("2026-05-10T12:00:00.000Z", database)).resolves.toEqual({
        overdueCallReminders: 1,
        todaysPendingAppointments: 1,
        candidatesWithoutUsablePhone: {
          count: 2,
          studentIds: [unavailableCandidateId, noPhoneCandidateId]
        }
      });
    } finally {
      database.close();
      await database.delete();
    }
  });
});
