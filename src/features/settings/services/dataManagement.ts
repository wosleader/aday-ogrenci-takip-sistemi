import type { BackupSnapshot, RestorePreview, RestoreResult } from "../../../db/backup";
import {
  BackupValidationError,
  createBackupSnapshot,
  createRestorePreview,
  parseBackupSnapshotJson,
  restoreBackupSnapshot
} from "../../../db/backup";
import type { AppDatabase } from "../../../db/db";
import { db } from "../../../db/db";

export const DELETE_ALL_STUDENTS_CONFIRMATION = "TÜM ADAYLARI SİL";
export const RESTORE_SYSTEM_BACKUP_CONFIRMATION = "GERİ YÜKLE";

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

export type SystemBackupAnalysis = {
  snapshot: BackupSnapshot;
  preview: RestorePreview;
};

export type SystemRestoreResult = RestoreResult;

type CleanupOptions = {
  database?: AppDatabase;
  backupProvider?: (database: AppDatabase) => Promise<DataCleanupBackup>;
};

type RestoreOptions = {
  database?: AppDatabase;
};

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}

export function createSystemBackupFileName(date = new Date()): string {
  const datePart = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const timePart = `${pad(date.getHours())}-${pad(date.getMinutes())}`;

  return `AOTS_Tam_Sistem_Yedegi_${datePart}_${timePart}.json`;
}

function toUserFriendlyBackupError(error: unknown): Error {
  if (error instanceof BackupValidationError) {
    return error;
  }

  return new Error("Geri yükleme tamamlanamadı. Mevcut veriler korunmaya çalışıldı.");
}

export async function createDataCleanupBackup(database: AppDatabase = db): Promise<DataCleanupBackup> {
  const snapshot = await createBackupSnapshot(database);

  return {
    snapshot,
    file_name: createSystemBackupFileName(new Date(snapshot.metadata.created_at)),
    json: JSON.stringify(snapshot, null, 2)
  };
}

export function analyzeSystemBackupFileText(raw: string): SystemBackupAnalysis {
  try {
    const snapshot = parseBackupSnapshotJson(raw);

    return {
      snapshot,
      preview: createRestorePreview(snapshot)
    };
  } catch (error) {
    throw toUserFriendlyBackupError(error);
  }
}

export async function restoreSystemBackup(
  snapshot: BackupSnapshot,
  confirmationText: string,
  options: RestoreOptions = {}
): Promise<SystemRestoreResult> {
  if (confirmationText !== RESTORE_SYSTEM_BACKUP_CONFIRMATION) {
    throw new Error(`İşlem için onay metni tam olarak "${RESTORE_SYSTEM_BACKUP_CONFIRMATION}" olmalı.`);
  }

  try {
    return await restoreBackupSnapshot(snapshot, options.database ?? db);
  } catch (error) {
    throw toUserFriendlyBackupError(error);
  }
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
