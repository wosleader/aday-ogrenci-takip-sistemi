import { describe, expect, it } from "vitest";
import { AppDatabase } from "../../src/db/db";
import type { BackupSnapshot } from "../../src/db/backup";
import {
  clearCandidateData,
  createSystemBackupFileName,
  DELETE_ALL_STUDENTS_CONFIRMATION,
  type DataCleanupBackup
} from "../../src/features/settings/services/dataManagement";
import { createSearchText, normalizeText } from "../../src/utils/normalizeText";

const timestamp = "2026-05-08T09:00:00.000Z";

async function createDatabase() {
  const database = new AppDatabase(`test-data-management-${crypto.randomUUID()}`);
  await database.open();
  return database;
}

function backup(): DataCleanupBackup {
  const snapshot: BackupSnapshot = {
    metadata: {
      app_name: "Aday Öğrenci Takip Sistemi",
      backup_type: "full_system_backup",
      backup_version: 1,
      app_version: "0.1.0",
      app_schema_version: 1,
      created_at: timestamp,
      counts: {
        students: 0,
        guardians: 0,
        phones: 0,
        call_logs: 0,
        reminders: 0,
        appointments: 0,
        campaigns: 0,
        imports: 0,
        import_logs: 0,
        duplicate_checks: 0,
        audit_logs: 0,
        settings: 0,
        keyboard_shortcuts: 0
      }
    },
    tables: {
      students: [],
      guardians: [],
      phones: [],
      call_logs: [],
      reminders: [],
      appointments: [],
      campaigns: [],
      imports: [],
      import_logs: [],
      duplicate_checks: [],
      audit_logs: [],
      settings: [],
      keyboard_shortcuts: []
    }
  };

  return {
    snapshot,
    file_name: "backup.json",
    json: JSON.stringify(snapshot)
  };
}

describe("clearCandidateData", () => {
  it("creates a user friendly full system backup file name", () => {
    expect(createSystemBackupFileName(new Date(2026, 4, 10, 14, 30))).toBe(
      "AOTS_Tam_Sistem_Yedegi_2026-05-10_14-30.json"
    );
  });

  it("clears candidate data and keeps settings, shortcuts and campaigns", async () => {
    const database = await createDatabase();
    let backupCalled = false;

    try {
      const studentId = await database.students.add({
        uuid: crypto.randomUUID(),
        student_full_name: "Ayse Yilmaz",
        normalized_student_name: normalizeText("Ayse Yilmaz"),
        search_text: createSearchText(["Ayse Yilmaz"]),
        current_class: "11",
        student_group: "11. Sinif YKS",
        category: "YKS",
        campaign_id: null,
        lifecycle_status: "candidate",
        last_call_result: "not_called",
        general_note: null,
        sync_status: "local",
        created_at: timestamp,
        updated_at: timestamp,
        deleted_at: null
      });
      await database.guardians.add({
        uuid: crypto.randomUUID(),
        student_id: studentId,
        guardian_full_name: "Veli Yilmaz",
        normalized_guardian_name: "veli yilmaz",
        sync_status: "local",
        created_at: timestamp,
        updated_at: timestamp,
        deleted_at: null
      });
      await database.phones.add({
        uuid: crypto.randomUUID(),
        student_id: studentId,
        phone_number: "05321234567",
        normalized_phone_number: "05321234567",
        phone_status: "active",
        is_valid: true,
        is_wrong: false,
        is_primary: true,
        sync_status: "local",
        created_at: timestamp,
        updated_at: timestamp,
        deleted_at: null
      });
      await database.reminders.add({
        uuid: crypto.randomUUID(),
        student_id: studentId,
        reminder_type: "call",
        reminder_at: "2026-05-12T11:00:00",
        status: "pending",
        is_default_time_assigned: true,
        sync_status: "local",
        created_at: timestamp,
        updated_at: timestamp,
        deleted_at: null
      });
      await database.imports.add({
        uuid: crypto.randomUUID(),
        file_name: "test.xlsx",
        sheet_name: "Worksheet",
        total_rows: 1,
        imported_rows: 1,
        skipped_rows: 0,
        warning_count: 0,
        error_count: 0,
        started_at: timestamp,
        finished_at: timestamp,
        sync_status: "local",
        created_at: timestamp,
        updated_at: timestamp,
        deleted_at: null
      });
      await database.import_logs.add({
        import_id: 1,
        severity: "info",
        message: "Test log",
        auto_fixed: false,
        created_at: timestamp
      });
      await database.duplicate_checks.add({
        duplicate_type: "phone",
        duplicate_value: "05321234567",
        severity: "warning",
        count: 2,
        related_student_ids: [studentId],
        created_at: timestamp
      });
      await database.audit_logs.bulkAdd([
        {
          entity_type: "student",
          entity_id: studentId,
          action_type: "create",
          created_at: timestamp
        },
        {
          entity_type: "system",
          entity_id: "settings",
          action_type: "backup",
          created_at: timestamp
        }
      ]);
      await database.settings.add({ key: "theme", value: "light", updated_at: timestamp });
      await database.keyboard_shortcuts.add({
        action_key: "search",
        label: "Ara",
        shortcut: "F",
        is_active: true,
        updated_at: timestamp
      });
      await database.campaigns.add({
        uuid: crypto.randomUUID(),
        name: "Diğer",
        is_default: true,
        is_active: true,
        sync_status: "local",
        created_at: timestamp,
        updated_at: timestamp,
        deleted_at: null
      });

      const result = await clearCandidateData(DELETE_ALL_STUDENTS_CONFIRMATION, {
        database,
        backupProvider: async () => {
          backupCalled = true;
          return backup();
        }
      });

      expect(backupCalled).toBe(true);
      expect(result.deleted_students).toBe(1);
      expect(result.deleted_import_logs).toBe(1);
      expect(await database.students.count()).toBe(0);
      expect(await database.guardians.count()).toBe(0);
      expect(await database.phones.count()).toBe(0);
      expect(await database.reminders.count()).toBe(0);
      expect(await database.imports.count()).toBe(0);
      expect(await database.import_logs.count()).toBe(0);
      expect(await database.duplicate_checks.count()).toBe(0);
      expect(await database.settings.count()).toBe(1);
      expect(await database.keyboard_shortcuts.count()).toBe(1);
      expect(await database.campaigns.count()).toBe(1);
      expect(await database.audit_logs.count()).toBe(1);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("does not clear data without the exact confirmation text", async () => {
    const database = await createDatabase();

    try {
      await expect(clearCandidateData("sil", { database, backupProvider: async () => backup() })).rejects.toThrow(
        "onay"
      );
    } finally {
      database.close();
      await database.delete();
    }
  });
});
