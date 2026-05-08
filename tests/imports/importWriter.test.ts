import { describe, expect, it } from "vitest";
import { AppDatabase } from "../../src/db/db";
import { seedDatabase } from "../../src/db/seed";
import { createPreImportBackup } from "../../src/features/imports/services/importBackup";
import { writeImportToDatabase } from "../../src/features/imports/services/importWriter";
import { simulateImport } from "../../src/features/imports/services/importSimulation";
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
    const parsedWorksheet = worksheet(["Ad Soyad"], [["Ayşe Yılmaz"]]);

    try {
      const summary = simulateImport(parsedWorksheet);

      await expect(
        writeImportToDatabase(parsedWorksheet, summary, {
          database,
          failAfterFirstStudentForTest: true
        })
      ).rejects.toThrow("rollback");

      expect(await database.students.count()).toBe(0);
      expect(await database.imports.count()).toBe(0);
    } finally {
      database.close();
      await database.delete();
    }
  });
});
