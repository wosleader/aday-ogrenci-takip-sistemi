import { APP_VERSION, BACKUP_VERSION } from "../domain/constants/settings";
import type { AppDatabase } from "./db";
import { db } from "./db";

const TABLE_NAMES = [
  "students",
  "guardians",
  "phones",
  "call_logs",
  "reminders",
  "appointments",
  "campaigns",
  "imports",
  "import_logs",
  "duplicate_checks",
  "audit_logs",
  "settings",
  "keyboard_shortcuts"
] as const;

type BackupTableName = (typeof TABLE_NAMES)[number];
type BackupTables = Record<BackupTableName, unknown[]>;

export type BackupSnapshot = {
  metadata: {
    backup_version: number;
    app_version: string;
    created_at: string;
  };
  tables: BackupTables;
};

export async function createBackupSnapshot(database: AppDatabase = db): Promise<BackupSnapshot> {
  const tableEntries = await Promise.all(
    TABLE_NAMES.map(async (tableName) => {
      const rows = await database.table(tableName).toArray();
      return [tableName, rows] as const;
    })
  );

  return {
    metadata: {
      backup_version: BACKUP_VERSION,
      app_version: APP_VERSION,
      created_at: new Date().toISOString()
    },
    tables: Object.fromEntries(tableEntries) as BackupTables
  };
}

export async function restoreBackupSnapshot(
  snapshot: BackupSnapshot,
  database: AppDatabase = db
): Promise<void> {
  if (snapshot.metadata.backup_version !== BACKUP_VERSION) {
    throw new Error("Unsupported backup version.");
  }

  const tables = TABLE_NAMES.map((tableName) => database.table(tableName));

  await database.transaction("rw", tables, async () => {
    for (const tableName of TABLE_NAMES) {
      const table = database.table(tableName);
      await table.clear();
      await table.bulkAdd(snapshot.tables[tableName] ?? []);
    }
  });
}
