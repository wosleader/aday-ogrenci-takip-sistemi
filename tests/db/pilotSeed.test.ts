import { describe, expect, it } from "vitest";
import { AppDatabase } from "../../src/db/db";
import { bootstrapPilotSeedIfNeeded } from "../../src/db/pilotSeed";
import { seedDatabase } from "../../src/db/seed";
import { PHONE_CALL_OUTCOME_OPTIONS } from "../../src/domain/models/phone";
import { createSearchText, normalizeText } from "../../src/utils/normalizeText";

async function createDatabase() {
  const database = new AppDatabase(`test-pilot-seed-${crypto.randomUUID()}`);
  await database.open();
  await seedDatabase(database);
  return database;
}

async function destroyDatabase(database: AppDatabase) {
  database.close();
  await database.delete();
}

describe("pilot seed bootstrap", () => {
  it("does nothing when pilot seed is disabled", async () => {
    const database = await createDatabase();

    try {
      const result = await bootstrapPilotSeedIfNeeded(database, false);

      expect(result).toBeNull();
      expect(await database.students.count()).toBe(0);
      expect(await database.guardians.count()).toBe(0);
      expect(await database.phones.count()).toBe(0);
      expect(await database.call_logs.count()).toBe(0);
      expect(await database.reminders.count()).toBe(0);
      expect(await database.appointments.count()).toBe(0);
    } finally {
      await destroyDatabase(database);
    }
  });

  it("seeds fictional pilot data when enabled and the CRM tables are empty", async () => {
    const database = await createDatabase();

    try {
      const result = await bootstrapPilotSeedIfNeeded(database, true);

      expect(result).toEqual({
        appointments: 18,
        callLogs: 110,
        guardians: 140,
        phones: 160,
        reminders: 18,
        students: 70
      });
      expect(await database.students.count()).toBe(70);
      expect(await database.guardians.count()).toBe(140);
      expect(await database.phones.count()).toBe(160);
      expect(await database.call_logs.count()).toBe(110);
      expect(await database.reminders.count()).toBe(18);
      expect(await database.appointments.count()).toBe(18);

      const students = await database.students.toArray();
      const classCounts = students.reduce<Record<string, number>>((counts, student) => {
        counts[student.current_class ?? ""] = (counts[student.current_class ?? ""] ?? 0) + 1;
        return counts;
      }, {});

      expect(classCounts).toMatchObject({
        "5. Sınıf": 10,
        "6. Sınıf": 10,
        "7. Sınıf": 12,
        "8. Sınıf": 18,
        LGS: 10,
        YKS: 10
      });

      const phoneNumbers = await database.phones.toArray();
      expect(phoneNumbers.every((phone) => phone.phone_number.startsWith("0500 000"))).toBe(true);
      expect(phoneNumbers.some((phone) => phone.relation_label === "Anne")).toBe(true);
      expect(phoneNumbers.some((phone) => phone.relation_label === "Baba")).toBe(true);
      expect(phoneNumbers.some((phone) => phone.reference_label === "Telefon 3")).toBe(true);
    } finally {
      await destroyDatabase(database);
    }
  });

  it("does not overwrite or duplicate an existing CRM database", async () => {
    const database = await createDatabase();

    try {
      await database.students.add({
        uuid: crypto.randomUUID(),
        student_full_name: "Mevcut Aday",
        normalized_student_name: normalizeText("Mevcut Aday"),
        search_text: createSearchText(["Mevcut Aday"]),
        current_class: "YKS",
        student_group: "YKS",
        category: "YKS",
        campaign_id: null,
        lifecycle_status: "candidate",
        last_call_result: "not_called",
        sync_status: "local",
        created_at: "2026-06-01T09:00:00.000Z",
        updated_at: "2026-06-01T09:00:00.000Z",
        deleted_at: null
      });

      const result = await bootstrapPilotSeedIfNeeded(database, true);

      expect(result).toBeNull();
      expect(await database.students.count()).toBe(1);
      expect(await database.guardians.count()).toBe(0);
      expect(await database.phones.count()).toBe(0);
    } finally {
      await destroyDatabase(database);
    }
  });

  it("covers every phone-level outcome key", async () => {
    const database = await createDatabase();

    try {
      await bootstrapPilotSeedIfNeeded(database, true);

      const outcomes = new Set((await database.phones.toArray()).map((phone) => phone.call_outcome));
      for (const outcome of PHONE_CALL_OUTCOME_OPTIONS) {
        expect(outcomes.has(outcome)).toBe(true);
      }
    } finally {
      await destroyDatabase(database);
    }
  });
});
