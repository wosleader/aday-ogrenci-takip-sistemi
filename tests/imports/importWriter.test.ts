import { describe, expect, it } from "vitest";
import { AppDatabase } from "../../src/db/db";
import { seedDatabase } from "../../src/db/seed";
import { createPreImportBackup } from "../../src/features/imports/services/importBackup";
import { writeImportToDatabase } from "../../src/features/imports/services/importWriter";
import { simulateImport } from "../../src/features/imports/services/importSimulation";
import {
  filterStudentListRows,
  readStudentListRows
} from "../../src/features/students/services/studentListReader";
import type { ParsedWorksheet } from "../../src/features/imports/services/types";

function worksheet(headers: string[], rows: unknown[][]): ParsedWorksheet {
  return {
    file_name: "test.xlsx",
    file_size: 1200,
    file_last_modified: 1710000000000,
    sheet_name: "Worksheet",
    ignored_sheet_names: [],
    raw_rows: [headers, ...rows],
    detected_header_row_number: 1,
    headers,
    rows,
    preview_rows: rows.slice(0, 20)
  };
}

async function createDatabase() {
  const database = new AppDatabase(`test-import-writer-${crypto.randomUUID()}`);
  await database.open();
  await seedDatabase(database);
  return database;
}

describe("writeImportToDatabase", () => {
  it("writes students, guardians and phones", async () => {
    const database = await createDatabase();
    const parsedWorksheet = worksheet(
      ["Sınıf", "Öğrenci Grubu", "Ad Soyad", "Veli Ad Soyad", "Telefon"],
      [["11", "11. Sınıf YKS", "Ayşe Yılmaz", "Veli Yılmaz", "5321234567"]]
    );

    try {
      const summary = simulateImport(parsedWorksheet);
      const result = await writeImportToDatabase(parsedWorksheet, summary, { database });

      expect(result.created_students).toBe(1);
      expect(result.created_guardians).toBe(1);
      expect(result.created_phones).toBe(1);
      expect(await database.students.count()).toBe(1);
      expect(await database.guardians.count()).toBe(1);
      expect(await database.phones.count()).toBe(1);
      expect((await database.students.toArray())[0].campaign_id).toBeDefined();
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("imports a row when phone 1 is empty but phone 2 exists", async () => {
    const database = await createDatabase();
    const parsedWorksheet = worksheet(
      ["Ad Soyad", "Telefon", "2. Telefon"],
      [["Ayşe Yılmaz", "", "5321234567"]]
    );

    try {
      const summary = simulateImport(parsedWorksheet);
      const result = await writeImportToDatabase(parsedWorksheet, summary, { database });
      const phones = await database.phones.toArray();

      expect(result.created_students).toBe(1);
      expect(result.created_phones).toBe(1);
      expect(phones[0].normalized_phone_number).toBe("05321234567");
      expect(phones[0].phone_label).toBe("Telefon 2");
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("imports a student without creating phone records when both phones are empty", async () => {
    const database = await createDatabase();
    const parsedWorksheet = worksheet(
      ["Ad Soyad", "Telefon", "2. Telefon"],
      [["Ayşe Yılmaz", "", ""]]
    );

    try {
      const summary = simulateImport(parsedWorksheet);
      const result = await writeImportToDatabase(parsedWorksheet, summary, { database });

      expect(result.created_students).toBe(1);
      expect(result.created_phones).toBe(0);
      expect(await database.students.count()).toBe(1);
      expect(await database.phones.count()).toBe(0);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("creates one phone record when phone 1 and phone 2 are the same", async () => {
    const database = await createDatabase();
    const parsedWorksheet = worksheet(
      ["Ad Soyad", "Telefon", "2. Telefon"],
      [["Ayşe Yılmaz", "05321234567", "5321234567"]]
    );

    try {
      const summary = simulateImport(parsedWorksheet);
      const result = await writeImportToDatabase(parsedWorksheet, summary, { database });

      expect(result.created_phones).toBe(1);
      expect(await database.phones.count()).toBe(1);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("persists multi-phone simulation rows with writer metadata", async () => {
    const database = await createDatabase();
    const parsedWorksheet = worksheet(
      ["Ad Soyad", "Telefon", "2. Telefon", "GSM3", "GSM4"],
      [["Ayşe Yılmaz", "05320000001", "5320000002", "5320000003", "5320000004"]]
    );

    try {
      const summary = simulateImport(parsedWorksheet);
      const result = await writeImportToDatabase(parsedWorksheet, summary, { database });
      const phones = (await database.phones.toArray()).sort(
        (left, right) => (left.priority ?? 0) - (right.priority ?? 0)
      );

      expect(result.created_phones).toBe(4);
      expect(phones).toHaveLength(4);
      expect(phones.map((phone) => phone.normalized_phone_number)).toEqual([
        "05320000001",
        "05320000002",
        "05320000003",
        "05320000004"
      ]);
      expect(phones.map((phone) => phone.phone_label)).toEqual([
        "Telefon 1",
        "Telefon 2",
        "Telefon 3",
        "Telefon 4"
      ]);
      expect(phones.map((phone) => phone.reference_label)).toEqual([
        "Telefon 1",
        "Telefon 2",
        "Telefon 3",
        "Telefon 4"
      ]);
      expect(phones.map((phone) => phone.priority)).toEqual([1, 2, 3, 4]);
      expect(phones[2]).toMatchObject({
        original_phone_value: "5320000003",
        source_column: "GSM3",
        is_valid: true,
        is_wrong: false,
        is_primary: false
      });
      expect(phones.filter((phone) => phone.is_primary)).toHaveLength(1);
      expect(phones[0].is_primary).toBe(true);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("skips empty phone slots and marks the first imported extra phone as primary", async () => {
    const database = await createDatabase();
    const parsedWorksheet = worksheet(
      ["Ad Soyad", "Telefon", "2. Telefon", "GSM3"],
      [["Ayşe Yılmaz", "", "", "5320000003"]]
    );

    try {
      const summary = simulateImport(parsedWorksheet);
      const result = await writeImportToDatabase(parsedWorksheet, summary, { database });
      const phones = await database.phones.toArray();

      expect(result.created_phones).toBe(1);
      expect(phones).toHaveLength(1);
      expect(phones[0]).toMatchObject({
        normalized_phone_number: "05320000003",
        phone_label: "Telefon 3",
        reference_label: "Telefon 3",
        priority: 3,
        is_primary: true
      });
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("de-duplicates multi-phone records within the same imported row", async () => {
    const database = await createDatabase();
    const parsedWorksheet = worksheet(
      ["Ad Soyad", "Telefon", "GSM3", "GSM4"],
      [["Ayşe Yılmaz", "05321234567", "+90 532 123 45 67", "5320000004"]]
    );

    try {
      const summary = simulateImport(parsedWorksheet);
      const result = await writeImportToDatabase(parsedWorksheet, summary, { database });
      const phones = (await database.phones.toArray()).sort(
        (left, right) => (left.priority ?? 0) - (right.priority ?? 0)
      );

      expect(result.created_phones).toBe(2);
      expect(phones.map((phone) => phone.normalized_phone_number)).toEqual([
        "05321234567",
        "05320000004"
      ]);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("persists invalid non-empty phone values from simulation metadata", async () => {
    const database = await createDatabase();
    const parsedWorksheet = worksheet(
      ["Ad Soyad", "GSM3"],
      [["Ayşe Yılmaz", "12345"]]
    );

    try {
      const summary = simulateImport(parsedWorksheet);
      expect(summary.preview_rows[0].phones[0]).toMatchObject({
        reference_label: "Telefon 3",
        normalized_phone_number: "12345",
        is_valid: false
      });

      const result = await writeImportToDatabase(parsedWorksheet, summary, { database });
      const phones = await database.phones.toArray();

      expect(result.created_phones).toBe(1);
      expect(phones[0]).toMatchObject({
        normalized_phone_number: "12345",
        original_phone_value: "12345",
        phone_label: "Telefon 3",
        reference_label: "Telefon 3",
        is_valid: false,
        is_wrong: false
      });
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("includes extra phones in imported student search text", async () => {
    const database = await createDatabase();
    const parsedWorksheet = worksheet(
      ["Ad Soyad", "GSM3"],
      [["Ayşe Yılmaz", "5320000003"]]
    );

    try {
      const summary = simulateImport(parsedWorksheet);
      await writeImportToDatabase(parsedWorksheet, summary, { database });

      const student = (await database.students.toArray())[0];
      expect(student.search_text).toContain("05320000003");

      const rows = await readStudentListRows(database);
      expect(filterStudentListRows(rows, "05320000003")).toHaveLength(1);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("creates reminders when reminder date exists", async () => {
    const database = await createDatabase();
    const parsedWorksheet = worksheet(
      ["Ad Soyad", "Telefon", "Tekrar arancak mı?", "Tekrar Aranacak Tarih"],
      [["Ayşe Yılmaz", "5321234567", "Evet", "2026-05-12"]]
    );

    try {
      const summary = simulateImport(parsedWorksheet);
      const result = await writeImportToDatabase(parsedWorksheet, summary, { database });
      const reminder = (await database.reminders.toArray())[0];

      expect(result.created_reminders).toBe(1);
      expect(reminder.reminder_at).toBe("2026-05-12T11:00:00");
      expect(reminder.reminder_type).toBe("call");
      expect(reminder.status).toBe("pending");
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("stores import history, import logs and audit logs", async () => {
    const database = await createDatabase();
    const parsedWorksheet = worksheet(["Ad Soyad", "Telefon"], [["Ayşe Yılmaz", "5321234567"]]);

    try {
      const summary = simulateImport(parsedWorksheet);
      const result = await writeImportToDatabase(parsedWorksheet, summary, { database });

      expect(await database.imports.count()).toBe(1);
      expect(await database.import_logs.count()).toBe(result.saved_import_logs);
      expect((await database.imports.toArray())[0].import_fingerprint).toContain("test.xlsx");
      expect((await database.audit_logs.toArray()).some((log) => log.action_type === "import_completed")).toBe(
        true
      );
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("creates backup before writing import records", async () => {
    const database = await createDatabase();
    const parsedWorksheet = worksheet(["Ad Soyad"], [["Ayşe Yılmaz"]]);
    let backupCalled = false;

    try {
      const summary = simulateImport(parsedWorksheet);
      const result = await writeImportToDatabase(parsedWorksheet, summary, {
        database,
        backupProvider: async () => {
          backupCalled = true;
          return createPreImportBackup(database);
        }
      });

      expect(backupCalled).toBe(true);
      expect(result.backup.file_name).toContain("import-oncesi");
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("rolls back transaction when writing fails", async () => {
    const database = await createDatabase();
    const parsedWorksheet = worksheet(
      ["Ad Soyad", "Telefon", "GSM3", "GSM4"],
      [["Ayşe Yılmaz", "5320000001", "5320000003", "5320000004"]]
    );

    try {
      const summary = simulateImport(parsedWorksheet);

      await expect(
        writeImportToDatabase(parsedWorksheet, summary, {
          database,
          failAfterFirstStudentForTest: true
        })
      ).rejects.toThrow("rollback");

      expect(await database.students.count()).toBe(0);
      expect(await database.phones.count()).toBe(0);
      expect(await database.imports.count()).toBe(0);
    } finally {
      database.close();
      await database.delete();
    }
  });
});
