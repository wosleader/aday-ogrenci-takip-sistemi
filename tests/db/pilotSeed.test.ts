import { describe, expect, it } from "vitest";
import { AppDatabase } from "../../src/db/db";
import { bootstrapPilotSeedIfNeeded } from "../../src/db/pilotSeed";
import {
  PILOT_SEED_CANDIDATES,
  PILOT_SEED_GUARDIANS,
  PILOT_SEED_PHONES,
  type PilotSeedCandidate
} from "../../src/db/pilotSeedData";
import { seedDatabase } from "../../src/db/seed";
import { PHONE_CALL_OUTCOME_OPTIONS } from "../../src/domain/models/phone";
import { readDetailedExportData } from "../../src/features/exports/services/exportDataReader";
import { readReminderTaskRows } from "../../src/features/reminders/services/reminderListReader";
import { readDailyReport } from "../../src/features/reports/services/dailyReportReader";
import { filterStudentListRows, readStudentListRows } from "../../src/features/students/services/studentListReader";
import { createStudentSearchText } from "../../src/features/students/services/studentSearchText";
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

async function seedPilotDatabase() {
  const database = await createDatabase();
  const result = await bootstrapPilotSeedIfNeeded(database, true);
  return { database, result };
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

  it("seeds the fixture-backed pilot dataset when enabled and CRM tables are empty", async () => {
    const { database, result } = await seedPilotDatabase();

    try {
      expect(result).toEqual({
        appointments: 24,
        callLogs: 180,
        guardians: 140,
        phones: 390,
        reminders: 30,
        students: 70
      });
      expect(await database.students.count()).toBe(70);
      expect(await database.guardians.count()).toBe(140);
      expect(await database.phones.count()).toBe(390);
      expect(await database.call_logs.count()).toBe(180);
      expect(await database.reminders.count()).toBe(30);
      expect(await database.appointments.count()).toBe(24);

      const students = await database.students.toArray();
      const classCounts = students.reduce<Record<string, number>>((counts, student) => {
        counts[student.current_class ?? ""] = (counts[student.current_class ?? ""] ?? 0) + 1;
        return counts;
      }, {});

      expect(classCounts).toEqual({
        "5. Sınıf": 10,
        "6. Sınıf": 10,
        "7. Sınıf": 12,
        "8. Sınıf": 18,
        LGS: 10,
        YKS: 10
      });
    } finally {
      await destroyDatabase(database);
    }
  });

  it("is visible through the student list reader", async () => {
    const { database } = await seedPilotDatabase();

    try {
      const rows = await readStudentListRows(database);

      expect(rows).toHaveLength(70);
      expect(rows.every((row) => row.phone_count >= 3)).toBe(true);
      expect(rows.every((row) => row.phone_count <= 10)).toBe(true);
      expect(rows.some((row) => row.mother_full_name?.startsWith("Demo Anne"))).toBe(true);
      expect(rows.some((row) => row.father_full_name?.startsWith("Demo Baba"))).toBe(true);
      expect(rows.every((row) => row.visible_phones.length >= 2)).toBe(true);
    } finally {
      await destroyDatabase(database);
    }
  });

  it("keeps school outside canonical pilot search when no authoritative neighborhood exists", async () => {
    const { database } = await seedPilotDatabase();
    const candidate: PilotSeedCandidate = PILOT_SEED_CANDIDATES[0];

    try {
      const student = await database.students.filter((item) => item.student_full_name === candidate.student_name).first();
      const guardians = PILOT_SEED_GUARDIANS.filter((item) => item.candidate_id === candidate.candidate_id);
      const phones = PILOT_SEED_PHONES.filter((item) => item.candidate_id === candidate.candidate_id);

      expect(student?.search_text).toBe(
        createStudentSearchText({
          student_full_name: candidate.student_name,
          guardian_names: guardians.map((item) => item.guardian_name),
          phone_values: phones.map((item) => item.phone_number),
          current_class: candidate.class_group,
          student_group: candidate.class_group === "LGS" ? "LGS Hazırlık" : candidate.class_group === "YKS" ? "YKS Hazırlık" : `${candidate.class_group} Demo Grup`,
          district: candidate.district,
          neighborhood: null
        })
      );
      const rows = await readStudentListRows(database);

      expect(student?.neighborhood).toBeNull();
      expect(student?.search_text).toContain(normalizeText(candidate.district));
      expect(student?.search_text).not.toContain(normalizeText(candidate.school));
      expect(student?.search_text).not.toContain(normalizeText(candidate.source_campaign));
      expect(student?.search_text).not.toContain(normalizeText(candidate.priority));
      expect(student?.search_text).not.toContain(normalizeText(candidate.candidate_note));
      expect(filterStudentListRows(rows, candidate.district).map((row) => row.student_full_name)).toContain(candidate.student_name);
      expect(filterStudentListRows(rows, candidate.school)).toHaveLength(0);
    } finally {
      await destroyDatabase(database);
    }
  });

  it("preserves fixture phone richness and mother/father badge linkage", async () => {
    const { database } = await seedPilotDatabase();

    try {
      const [students, guardians, phones] = await Promise.all([
        database.students.toArray(),
        database.guardians.toArray(),
        database.phones.toArray()
      ]);
      const activeStudents = students.filter((student) => !student.deleted_at && student.id);
      const phonesByStudent = new Map<number, typeof phones>();
      const guardiansById = new Map(guardians.flatMap((guardian) => (guardian.id ? [[guardian.id, guardian]] : [])));
      const distribution = new Map<number, number>();

      for (const phone of phones.filter((record) => !record.deleted_at)) {
        phonesByStudent.set(phone.student_id, [...(phonesByStudent.get(phone.student_id) ?? []), phone]);
      }

      for (const student of activeStudents) {
        const studentPhones = phonesByStudent.get(student.id!) ?? [];
        distribution.set(studentPhones.length, (distribution.get(studentPhones.length) ?? 0) + 1);
        expect(studentPhones.length).toBeGreaterThanOrEqual(3);
        expect(studentPhones.length).toBeLessThanOrEqual(10);

        const motherPhone = studentPhones.find((phone) => phone.relation_label === "Anne");
        const fatherPhone = studentPhones.find((phone) => phone.relation_label === "Baba");
        expect(motherPhone).toBeTruthy();
        expect(fatherPhone).toBeTruthy();
        expect(motherPhone?.guardian_id ? guardiansById.get(motherPhone.guardian_id)?.relation_type : null).toBe("mother");
        expect(fatherPhone?.guardian_id ? guardiansById.get(fatherPhone.guardian_id)?.relation_type : null).toBe("father");
      }

      expect(Object.fromEntries([...distribution.entries()].sort(([left], [right]) => left - right))).toEqual({
        3: 13,
        4: 24,
        5: 3,
        6: 10,
        8: 10,
        10: 10
      });
      expect(activeStudents.filter((student) => (phonesByStudent.get(student.id!) ?? []).length === 10)).toHaveLength(10);
      expect(activeStudents.filter((student) => (phonesByStudent.get(student.id!) ?? []).length >= 8)).toHaveLength(20);
    } finally {
      await destroyDatabase(database);
    }
  });

  it("covers every phone-level outcome key many times", async () => {
    const { database } = await seedPilotDatabase();

    try {
      const counts = (await database.phones.toArray()).reduce<Record<string, number>>((summary, phone) => {
        const outcome = phone.call_outcome ?? "not_called";
        summary[outcome] = (summary[outcome] ?? 0) + 1;
        return summary;
      }, {});

      for (const outcome of PHONE_CALL_OUTCOME_OPTIONS) {
        expect(counts[outcome]).toBeGreaterThanOrEqual(50);
      }
    } finally {
      await destroyDatabase(database);
    }
  });

  it("creates visible reminders, daily report data, and detailed export rows", async () => {
    const { database } = await seedPilotDatabase();

    try {
      const reminderRows = await readReminderTaskRows("2026-06-20T12:00:00.000Z", database);
      const report = await readDailyReport("2026-06-20", {
        database,
        now: "2026-06-20T12:00:00.000Z"
      });
      const exportDataset = await readDetailedExportData({ database });

      expect(reminderRows.length).toBeGreaterThanOrEqual(20);
      expect(new Set(reminderRows.map((row) => row.bucket)).size).toBeGreaterThanOrEqual(2);
      expect(report.summary.call_log_count).toBeGreaterThan(0);
      expect(report.summary.unique_student_count).toBeGreaterThan(0);
      expect(report.summary.reached_count).toBeGreaterThan(0);
      expect(report.summary.not_reached_count).toBeGreaterThan(0);
      expect(report.summary.appointment_count).toBeGreaterThan(0);
      expect(exportDataset.bundles).toHaveLength(70);
      expect(exportDataset.bundles.every((bundle) => (bundle.phones ?? []).length >= 3)).toBe(true);
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

  it("does not duplicate when bootstrap is called concurrently", async () => {
    const database = await createDatabase();

    try {
      const [firstResult, secondResult] = await Promise.all([
        bootstrapPilotSeedIfNeeded(database, true),
        bootstrapPilotSeedIfNeeded(database, true)
      ]);

      expect(firstResult ?? secondResult).toEqual({
        appointments: 24,
        callLogs: 180,
        guardians: 140,
        phones: 390,
        reminders: 30,
        students: 70
      });
      expect(await database.students.count()).toBe(70);
      expect(await database.guardians.count()).toBe(140);
      expect(await database.phones.count()).toBe(390);
      expect(await database.call_logs.count()).toBe(180);
      expect(await database.reminders.count()).toBe(30);
      expect(await database.appointments.count()).toBe(24);
    } finally {
      await destroyDatabase(database);
    }
  });
});
