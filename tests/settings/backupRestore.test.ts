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

  it("preserves pending reminder edit audit payloads across full backup restore", async () => {
    const sourceDatabase = await createDatabase();
    const targetDatabase = await createDatabase();
    const oldValue = JSON.stringify({
      reminder_at: "2026-05-12T11:00:00.000Z",
      note: "İlk açıklama",
      owner_call_log_id: 42
    });
    const newValue = JSON.stringify({
      reminder_at: "2026-05-13T09:30:00.000Z",
      note: "Güncellenen açıklama",
      owner_call_log_id: 42
    });

    try {
      await sourceDatabase.audit_logs.add({
        entity_type: "reminder",
        entity_id: 7,
        action_type: "update",
        field_name: "pending_reminder_edit",
        old_value: oldValue,
        new_value: newValue,
        note: "Açık arama hatırlatmasının tarih/saat veya not bilgisi güncellendi.",
        performed_by: "agent",
        created_at: "2026-05-12T09:00:00.000Z"
      });

      const snapshot = await createBackupSnapshot(sourceDatabase);
      await restoreSystemBackup(snapshot, RESTORE_SYSTEM_BACKUP_CONFIRMATION, { database: targetDatabase });
      const [restoredAudit] = await targetDatabase.audit_logs.toArray();

      expect(snapshot.tables.audit_logs).toHaveLength(1);
      expect(restoredAudit).toMatchObject({
        entity_type: "reminder",
        entity_id: 7,
        field_name: "pending_reminder_edit",
        old_value: oldValue,
        new_value: newValue
      });
    } finally {
      sourceDatabase.close();
      targetDatabase.close();
      await sourceDatabase.delete();
      await targetDatabase.delete();
    }
  });

  it("preserves guardian relations and relation-aware phone metadata across backup restore", async () => {
    const sourceDatabase = await createDatabase();
    const targetDatabase = await createDatabase();

    try {
      const studentId = await sourceDatabase.students.add(student("Ayşe Yılmaz"));
      const guardianId = await sourceDatabase.guardians.add({
        uuid: crypto.randomUUID(),
        student_id: studentId,
        guardian_full_name: "Zeynep Yılmaz",
        normalized_guardian_name: "zeynep yilmaz",
        relation_type: "guardian",
        sync_status: "local",
        created_at: timestamp,
        updated_at: timestamp,
        deleted_at: null
      });
      const motherId = await sourceDatabase.guardians.add({
        uuid: crypto.randomUUID(),
        student_id: studentId,
        guardian_full_name: "Fatma Yılmaz",
        normalized_guardian_name: "fatma yilmaz",
        relation_type: "mother",
        sync_status: "local",
        created_at: timestamp,
        updated_at: timestamp,
        deleted_at: null
      });
      const fatherId = await sourceDatabase.guardians.add({
        uuid: crypto.randomUUID(),
        student_id: studentId,
        guardian_full_name: "Mehmet Yılmaz",
        normalized_guardian_name: "mehmet yilmaz",
        relation_type: "father",
        sync_status: "local",
        created_at: timestamp,
        updated_at: timestamp,
        deleted_at: null
      });
      await sourceDatabase.guardians.add({
        uuid: crypto.randomUUID(),
        student_id: studentId,
        guardian_full_name: "Legacy Veli",
        normalized_guardian_name: "legacy veli",
        relation_type: null,
        sync_status: "local",
        created_at: timestamp,
        updated_at: timestamp,
        deleted_at: null
      });

      await sourceDatabase.phones.bulkAdd([
        {
          uuid: crypto.randomUUID(),
          student_id: studentId,
          guardian_id: guardianId,
          phone_number: "05320000001",
          normalized_phone_number: "05320000001",
          original_phone_value: "0532 000 00 01",
          phone_label: "Telefon 1",
          reference_label: "Telefon 1",
          relation_label: "Veli",
          source_column: "GSM",
          priority: 1,
          phone_status: "active",
          is_valid: true,
          is_wrong: false,
          is_primary: true,
          call_outcome: "no_answer",
          call_outcome_updated_at: "2026-05-08T12:00:00.000Z",
          sync_status: "local",
          created_at: timestamp,
          updated_at: timestamp,
          deleted_at: null
        },
        {
          uuid: crypto.randomUUID(),
          student_id: studentId,
          guardian_id: motherId,
          phone_number: "05320000002",
          normalized_phone_number: "05320000002",
          original_phone_value: "0532 000 00 02",
          phone_label: "Anne Telefon",
          reference_label: "Telefon 2",
          relation_label: "Anne",
          source_column: "ANNE TEL",
          priority: 2,
          phone_status: "active",
          is_valid: true,
          is_wrong: false,
          is_primary: false,
          call_outcome: "busy",
          call_outcome_updated_at: "2026-05-08T13:00:00.000Z",
          sync_status: "local",
          created_at: timestamp,
          updated_at: timestamp,
          deleted_at: null
        },
        {
          uuid: crypto.randomUUID(),
          student_id: studentId,
          guardian_id: fatherId,
          phone_number: "05320000003",
          normalized_phone_number: "05320000003",
          original_phone_value: "0532 000 00 03",
          phone_label: "Baba Telefon",
          reference_label: "Telefon 3",
          relation_label: "Baba",
          source_column: "BABA TEL",
          priority: 3,
          phone_status: "active",
          is_valid: true,
          is_wrong: false,
          is_primary: false,
          sync_status: "local",
          created_at: timestamp,
          updated_at: timestamp,
          deleted_at: null
        },
        {
          uuid: crypto.randomUUID(),
          student_id: studentId,
          guardian_id: null,
          phone_number: "05320000004",
          normalized_phone_number: "05320000004",
          original_phone_value: "0532 000 00 04",
          phone_label: "Anne Telefon",
          reference_label: "Telefon 4",
          relation_label: "Anne",
          source_column: "ANNE GSM",
          priority: 4,
          phone_status: "active",
          is_valid: true,
          is_wrong: false,
          is_primary: false,
          sync_status: "local",
          created_at: timestamp,
          updated_at: timestamp,
          deleted_at: null
        }
      ]);

      const snapshot = await createBackupSnapshot(sourceDatabase);
      await restoreSystemBackup(snapshot, RESTORE_SYSTEM_BACKUP_CONFIRMATION, { database: targetDatabase });

      const restoredGuardians = await targetDatabase.guardians.orderBy("id").toArray();
      const restoredPhones = await targetDatabase.phones.orderBy("id").toArray();

      expect(restoredGuardians).toHaveLength(4);
      expect(
        restoredGuardians.map(({ guardian_full_name, relation_type }) => ({ guardian_full_name, relation_type }))
      ).toEqual([
        { guardian_full_name: "Zeynep Yılmaz", relation_type: "guardian" },
        { guardian_full_name: "Fatma Yılmaz", relation_type: "mother" },
        { guardian_full_name: "Mehmet Yılmaz", relation_type: "father" },
        { guardian_full_name: "Legacy Veli", relation_type: null }
      ]);
      expect(restoredPhones).toHaveLength(4);
      expect(
        restoredPhones.map(({ guardian_id, relation_label, source_column, reference_label, priority, call_outcome, call_outcome_updated_at }) => ({
          guardian_id,
          relation_label,
          source_column,
          reference_label,
          priority,
          call_outcome,
          call_outcome_updated_at
        }))
      ).toEqual([
        {
          guardian_id: guardianId,
          relation_label: "Veli",
          source_column: "GSM",
          reference_label: "Telefon 1",
          priority: 1,
          call_outcome: "no_answer",
          call_outcome_updated_at: "2026-05-08T12:00:00.000Z"
        },
        {
          guardian_id: motherId,
          relation_label: "Anne",
          source_column: "ANNE TEL",
          reference_label: "Telefon 2",
          priority: 2,
          call_outcome: "busy",
          call_outcome_updated_at: "2026-05-08T13:00:00.000Z"
        },
        {
          guardian_id: fatherId,
          relation_label: "Baba",
          source_column: "BABA TEL",
          reference_label: "Telefon 3",
          priority: 3,
          call_outcome: undefined,
          call_outcome_updated_at: undefined
        },
        {
          guardian_id: null,
          relation_label: "Anne",
          source_column: "ANNE GSM",
          reference_label: "Telefon 4",
          priority: 4,
          call_outcome: undefined,
          call_outcome_updated_at: undefined
        }
      ]);
    } finally {
      sourceDatabase.close();
      targetDatabase.close();
      await sourceDatabase.delete();
      await targetDatabase.delete();
    }
  });
});
