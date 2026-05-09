import type { BackupSnapshot } from "../../../db/backup";
import { createBackupSnapshot } from "../../../db/backup";
import type { AppDatabase } from "../../../db/db";
import { db } from "../../../db/db";

export const DELETE_ALL_STUDENTS_CONFIRMATION = "TÜM ADAYLARI SİL";

export type DataCleanupBackup = {
  snapshot: BackupSnapshot;
  file_name: string;
  json: string;
};

export type CandidateDataCleanupResult = {
  backup: DataCleanupBackup;
  deleted_students: number;
  deleted_guardians: number;
  deleted_phones: number;
  deleted_reminders: number;
  deleted_appointments: number;
  deleted_imports: number;
  deleted_import_logs: number;
  deleted_duplicate_checks: number;
  deleted_audit_logs: number;
};

type CleanupOptions = {
  database?: AppDatabase;
  backupProvider?: (database: AppDatabase) => Promise<DataCleanupBackup>;
};

export async function createDataCleanupBackup(database: AppDatabase = db): Promise<DataCleanupBackup> {
  const snapshot = await createBackupSnapshot(database);
  const stamp = snapshot.metadata.created_at.replace(/[:.]/g, "-");

  return {
    snapshot,
    file_name: `aday-ogrenci-takip-yedek-veri-temizleme-oncesi-${stamp}.json`,
    json: JSON.stringify(snapshot, null, 2)
  };
}

function isCandidateOrImportAuditLog(log: { entity_type: string; action_type: string }): boolean {
  return (
    ["student", "guardian", "phone", "reminder", "appointment", "import"].includes(log.entity_type) ||
    log.action_type.startsWith("import_") ||
    log.action_type.endsWith("_created")
  );
}

export async function clearCandidateData(
  confirmationText: string,
  options: CleanupOptions = {}
): Promise<CandidateDataCleanupResult> {
  if (confirmationText !== DELETE_ALL_STUDENTS_CONFIRMATION) {
    throw new Error(`İşlem için onay metni tam olarak "${DELETE_ALL_STUDENTS_CONFIRMATION}" olmalı.`);
  }

  const database = options.database ?? db;
  const backupProvider = options.backupProvider ?? createDataCleanupBackup;
  const backup = await backupProvider(database);

  if (!backup) {
    throw new Error("Veri temizleme öncesi yedek alınamadı; işlem başlatılmadı.");
  }

  const result: CandidateDataCleanupResult = {
    backup,
    deleted_students: 0,
    deleted_guardians: 0,
    deleted_phones: 0,
    deleted_reminders: 0,
    deleted_appointments: 0,
    deleted_imports: 0,
    deleted_import_logs: 0,
    deleted_duplicate_checks: 0,
    deleted_audit_logs: 0
  };

  await database.transaction(
    "rw",
    [
      database.students,
      database.guardians,
      database.phones,
      database.reminders,
      database.appointments,
      database.imports,
      database.import_logs,
      database.duplicate_checks,
      database.audit_logs
    ],
    async () => {
      const [students, guardians, phones, reminders, appointments, imports, importLogs, duplicateChecks, auditLogs] =
        await Promise.all([
          database.students.count(),
          database.guardians.count(),
          database.phones.count(),
          database.reminders.count(),
          database.appointments.count(),
          database.imports.count(),
          database.import_logs.count(),
          database.duplicate_checks.count(),
          database.audit_logs.toArray()
        ]);
      const auditLogIds = auditLogs
        .filter(isCandidateOrImportAuditLog)
        .flatMap((auditLog) => (auditLog.id ? [auditLog.id] : []));

      await Promise.all([
        database.students.clear(),
        database.guardians.clear(),
        database.phones.clear(),
        database.reminders.clear(),
        database.appointments.clear(),
        database.imports.clear(),
        database.import_logs.clear(),
        database.duplicate_checks.clear(),
        database.audit_logs.bulkDelete(auditLogIds)
      ]);

      result.deleted_students = students;
      result.deleted_guardians = guardians;
      result.deleted_phones = phones;
      result.deleted_reminders = reminders;
      result.deleted_appointments = appointments;
      result.deleted_imports = imports;
      result.deleted_import_logs = importLogs;
      result.deleted_duplicate_checks = duplicateChecks;
      result.deleted_audit_logs = auditLogIds.length;
    }
  );

  return result;
}
