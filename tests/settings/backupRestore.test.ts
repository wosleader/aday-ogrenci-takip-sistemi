import { describe, expect, it } from "vitest";
import { createBackupSnapshot, TABLE_NAMES } from "../../src/db/backup";
import { AppDatabase } from "../../src/db/db";
import type { StudentRecord } from "../../src/domain/models/student";
import {
  analyzeSystemBackupFileText,
  RESTORE_SYSTEM_BACKUP_CONFIRMATION,
  restoreSystemBackup
} from "../../src/features/settings/services/dataManagement";
import { createSearchText, normalizeText } from "../../src/utils/normalizeText";

const timestamp = "2026-05-08T09:00:00.000Z";

async function createDatabase(name = `test-backup-restore-${crypto.randomUUID()}`) {
  const database = new AppDatabase(name);
  await database.open();
  return database;
}

function student(name: string): StudentRecord {
  return {
    uuid: crypto.randomUUID(),
    student_full_name: name,
    normalized_student_name: normalizeText(name),
    search_text: createSearchText([name]),
    current_class: "11",
    student_group: "11. Sınıf YKS",
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

describe("backup and restore hardening", () => {
  it("creates a full system backup with required tables and metadata counts", async () => {
    const database = await createDatabase();

    try {
      await database.students.add(student("Ayşe Yılmaz"));
      await database.settings.add({ key: "theme", value: "light", updated_at: timestamp });

      const snapshot = await createBackupSnapshot(database);

      expect(snapshot.metadata).toMatchObject({
        app_name: "Aday Öğrenci Takip Sistemi",
        backup_type: "full_system_backup",
        backup_version: 1,
        app_version: "0.1.0",
        app_schema_version: 1
      });
      expect(snapshot.metadata.created_at).toBeTruthy();
      expect(snapshot.metadata.counts.students).toBe(1);
      expect(snapshot.metadata.counts.settings).toBe(1);

      for (const tableName of TABLE_NAMES) {
        expect(Array.isArray(snapshot.tables[tableName])).toBe(true);
      }
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("rejects invalid JSON and non-backup JSON with user friendly messages", () => {
    expect(() => analyzeSystemBackupFileText("{bozuk")).toThrow("Yedek dosyası okunamadı");
    expect(() => analyzeSystemBackupFileText(JSON.stringify({ headers: ["Sıra No"], rows: [] }))).toThrow(
      "Tam Sistem Yedeği"
    );
  });

  it("rejects missing or malformed required tables", async () => {
    const database = await createDatabase();

    try {
      const snapshot = await createBackupSnapshot(database);
      const missingTableSnapshot = structuredClone(snapshot) as typeof snapshot;
      delete (missingTableSnapshot.tables as Partial<typeof missingTableSnapshot.tables>).students;

      expect(() => analyzeSystemBackupFileText(JSON.stringify(missingTableSnapshot))).toThrow("eksik tablo");

      const malformedTableSnapshot = structuredClone(snapshot) as typeof snapshot;
      (malformedTableSnapshot.tables as unknown as Record<string, unknown>).students = {};

      expect(() => analyzeSystemBackupFileText(JSON.stringify(malformedTableSnapshot))).toThrow("bozuk veya eksik");
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("rejects backups from newer backup versions", async () => {
    const database = await createDatabase();

    try {
      const snapshot = await createBackupSnapshot(database);
      snapshot.metadata.backup_version = 999;

      expect(() => analyzeSystemBackupFileText(JSON.stringify(snapshot))).toThrow("daha yeni");
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("creates a restore preview from backup counts", async () => {
    const database = await createDatabase();

    try {
      await database.students.add(student("Ayşe Yılmaz"));
      await database.guardians.add({
        uuid: crypto.randomUUID(),
        student_id: 1,
        guardian_full_name: "Fatma Yılmaz",
        normalized_guardian_name: "fatma yilmaz",
        sync_status: "local",
        created_at: timestamp,
        updated_at: timestamp,
        deleted_at: null
      });

      const analysis = analyzeSystemBackupFileText(JSON.stringify(await createBackupSnapshot(database)));

      expect(analysis.preview.counts.students).toBe(1);
      expect(analysis.preview.counts.guardians).toBe(1);
      expect(analysis.preview.total_records).toBeGreaterThanOrEqual(2);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("requires restore confirmation before replacing data", async () => {
    const database = await createDatabase();

    try {
      const snapshot = await createBackupSnapshot(database);

      await expect(restoreSystemBackup(snapshot, "geri yükle", { database })).rejects.toThrow("GERİ YÜKLE");
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("restores in replace mode and verifies restored counts", async () => {
    const sourceDatabase = await createDatabase();
    const targetDatabase = await createDatabase();

    try {
      await sourceDatabase.students.add(student("Yedekteki Aday"));
      await sourceDatabase.call_logs.add({
        uuid: crypto.randomUUID(),
        student_id: 1,
        call_time: "2026-05-10T11:00:00.000Z",
        call_result: "reached",
        note: "Görüşüldü",
        sync_status: "local",
        created_at: timestamp,
        updated_at: timestamp,
        deleted_at: null
      });
      await targetDatabase.students.add(student("Mevcut Aday"));
      await targetDatabase.students.add(student("Silinecek Aday"));

      const snapshot = await createBackupSnapshot(sourceDatabase);
      const result = await restoreSystemBackup(snapshot, RESTORE_SYSTEM_BACKUP_CONFIRMATION, {
        database: targetDatabase
      });
      const restoredStudents = await targetDatabase.students.toArray();

      expect(result.restored_counts.students).toBe(1);
      expect(result.restored_counts.call_logs).toBe(1);
      expect(restoredStudents).toHaveLength(1);
      expect(restoredStudents[0].student_full_name).toBe("Yedekteki Aday");
    } finally {
      sourceDatabase.close();
      targetDatabase.close();
      await sourceDatabase.delete();
      await targetDatabase.delete();
    }
  });
});
