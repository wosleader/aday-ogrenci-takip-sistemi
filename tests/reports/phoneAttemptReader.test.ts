import { describe, expect, it } from "vitest";
import { AppDatabase } from "../../src/db/db";
import type { AuditLogRecord } from "../../src/domain/models/auditLog";
import { readFirstPhoneAttemptAt, readPhoneAttemptEfficiency, readPhoneAttemptEvents } from "../../src/features/reports/services/phoneAttemptReader";

const range = {
  start: "2026-05-01T00:00:00.000Z",
  end: "2026-05-31T23:59:59.999Z"
};

async function createDatabase() {
  const database = new AppDatabase(`test-phone-attempt-reader-${crypto.randomUUID()}`);
  await database.open();
  return database;
}

function attempt(
  id: number,
  phoneId: number,
  studentId: number,
  createdAt: string,
  outcome: string,
  campaignId: number | null,
  contactEstablished: boolean
): AuditLogRecord {
  return {
    id,
    entity_type: "phone_attempt",
    entity_id: phoneId,
    action_type: "create",
    field_name: "phone_attempt_v1",
    old_value: null,
    new_value: JSON.stringify({
      event_version: 1,
      student_id: studentId,
      outcome,
      campaign_id_at_attempt: campaignId,
      contact_established: contactEstablished
    }),
    performed_by: "agent",
    created_at: createdAt
  };
}

describe("phoneAttemptReader", () => {
  it("reads only valid selected-period events and computes bounded efficiency metrics", async () => {
    const database = await createDatabase();

    try {
      await database.audit_logs.bulkAdd([
        attempt(1, 11, 1, "2026-05-02T10:00:00.000Z", "no_answer", null, false),
        attempt(2, 12, 1, "2026-05-03T10:00:00.000Z", "busy", null, false),
        attempt(3, 12, 1, "2026-05-04T10:00:00.000Z", "reached", null, true),
        attempt(4, 13, 1, "2026-05-05T10:00:00.000Z", "busy", null, false),
        attempt(5, 21, 2, "2026-05-03T11:00:00.000Z", "reached", null, true),
        attempt(6, 31, 3, "2026-05-03T12:00:00.000Z", "closed", null, false),
        attempt(7, 41, 4, "2026-06-01T10:00:00.000Z", "reached", null, true),
        attempt(8, 51, 5, "2026-05-05T10:00:00.000Z", "not_called", null, false),
        {
          entity_type: "phone_attempt",
          entity_id: 61,
          action_type: "create",
          field_name: "phone_attempt_v1",
          new_value: "{malformed",
          created_at: "2026-05-06T10:00:00.000Z"
        }
      ]);

      const events = await readPhoneAttemptEvents(range, database);
      expect(events.map((event) => event.phone_id)).toEqual([11, 12, 21, 31, 12, 13]);

      const metrics = await readPhoneAttemptEfficiency(range, database);
      expect(metrics).toMatchObject({
        attemptedStudents: 3,
        contactedStudents: 2,
        uncontactedStudents: 1,
        contactRate: 2 / 3,
        averageHealthyAttempts: 1.5,
        averageFailedDistinct: 0.5,
        firstPhoneRate: 1 / 3,
        withinFirstThreeRate: 2 / 3,
        fourPlusRate: 0
      });
      expect(await readFirstPhoneAttemptAt(database)).toBe("2026-05-02T10:00:00.000Z");
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("keeps campaign attribution from the attempt snapshot and separates student campaign sequences", async () => {
    const database = await createDatabase();

    try {
      await database.campaigns.add({
        name: "Bahar Kampanyası",
        is_default: false,
        is_active: true,
        uuid: crypto.randomUUID(),
        sync_status: "local",
        created_at: range.start,
        updated_at: range.start,
        deleted_at: null
      });
      await database.audit_logs.bulkAdd([
        attempt(1, 11, 1, "2026-05-02T10:00:00.000Z", "reached", 1, true),
        attempt(2, 12, 1, "2026-05-03T10:00:00.000Z", "reached", 2, true),
        attempt(3, 21, 2, "2026-05-03T11:00:00.000Z", "no_answer", 1, false)
      ]);

      const result = await readPhoneAttemptEfficiency(range, database);
      expect(result.attemptedStudents).toBe(2);
      expect(result.contactedStudents).toBe(1);
      expect(result.byCampaign).toEqual([
        expect.objectContaining({ campaign_id: 1, campaign_name: "Bahar Kampanyası", attemptedStudents: 2, contactedStudents: 1 }),
        expect.objectContaining({ campaign_id: 2, campaign_name: "Kampanyasız / Eski kampanya", attemptedStudents: 1 })
      ]);
      expect(result.events[0].campaign_id_at_attempt).toBe(1);
      expect(result.events[1].campaign_id_at_attempt).toBe(2);
    } finally {
      database.close();
      await database.delete();
    }
  });
});
