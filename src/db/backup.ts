import { APP_NAME, APP_SCHEMA_VERSION, APP_VERSION, BACKUP_TYPE, BACKUP_VERSION } from "../domain/constants/settings";
import type { AppDatabase } from "./db";
import { db } from "./db";

export const TABLE_NAMES = [
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

export type BackupTableName = (typeof TABLE_NAMES)[number];
export type BackupTables = Record<BackupTableName, unknown[]>;
export type BackupCounts = Record<BackupTableName, number>;

export type BackupSnapshot = {
  metadata: {
    app_name: string;
    backup_type: string;
    backup_version: number;
    app_version: string;
    app_schema_version: number;
    created_at: string;
    counts: BackupCounts;
  };
  tables: BackupTables;
};

export type RestorePreview = {
  metadata: BackupSnapshot["metadata"];
  counts: BackupCounts;
  total_records: number;
};

export type RestoreResult = RestorePreview & {
  restored_counts: BackupCounts;
};

export class BackupValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BackupValidationError";
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function emptyCounts(): BackupCounts {
  return Object.fromEntries(TABLE_NAMES.map((tableName) => [tableName, 0])) as BackupCounts;
}

function createCountsFromTables(tables: BackupTables): BackupCounts {
  return Object.fromEntries(TABLE_NAMES.map((tableName) => [tableName, tables[tableName].length])) as BackupCounts;
}

function createTotalCount(counts: BackupCounts): number {
  return TABLE_NAMES.reduce((total, tableName) => total + counts[tableName], 0);
}

function assertBackupLikeObject(value: unknown): asserts value is BackupSnapshot {
  if (!isPlainObject(value) || !isPlainObject(value.metadata) || !isPlainObject(value.tables)) {
    throw new BackupValidationError("Bu dosya Tam Sistem Yedeği dosyası gibi görünmüyor.");
  }
}

export async function createBackupSnapshot(database: AppDatabase = db): Promise<BackupSnapshot> {
  const tableEntries = await Promise.all(
    TABLE_NAMES.map(async (tableName) => {
      const rows = await database.table(tableName).toArray();
      return [tableName, rows] as const;
    })
  );
  const tables = Object.fromEntries(tableEntries) as BackupTables;
  const counts = createCountsFromTables(tables);

  return {
    metadata: {
      app_name: APP_NAME,
      backup_type: BACKUP_TYPE,
      backup_version: BACKUP_VERSION,
      app_version: APP_VERSION,
      app_schema_version: APP_SCHEMA_VERSION,
      created_at: new Date().toISOString(),
      counts
    },
    tables
  };
}

export function parseBackupSnapshotJson(raw: string): BackupSnapshot {
  try {
    const parsed = JSON.parse(raw) as unknown;
    assertBackupLikeObject(parsed);

    return parsed;
  } catch (error) {
    if (error instanceof BackupValidationError) {
      throw error;
    }

    throw new BackupValidationError("Yedek dosyası okunamadı. Dosya bozuk veya eksik olabilir.");
  }
}

export function validateBackupSnapshot(snapshot: BackupSnapshot): void {
  assertBackupLikeObject(snapshot);

  if (snapshot.metadata.backup_type !== BACKUP_TYPE) {
    throw new BackupValidationError("Bu dosya Tam Sistem Yedeği dosyası gibi görünmüyor.");
  }

  if (typeof snapshot.metadata.backup_version !== "number") {
    throw new BackupValidationError("Yedek dosyası okunamadı. Dosya bozuk veya eksik olabilir.");
  }

  if (snapshot.metadata.backup_version > BACKUP_VERSION) {
    throw new BackupValidationError("Bu yedek daha yeni bir uygulama sürümüyle oluşturulmuş olabilir.");
  }

  if (snapshot.metadata.backup_version < BACKUP_VERSION) {
    throw new BackupValidationError("Bu yedek dosyasının sürümü desteklenmiyor.");
  }

  for (const tableName of TABLE_NAMES) {
    if (!(tableName in snapshot.tables)) {
      throw new BackupValidationError("Yedek dosyası eksik tablo bilgisi içeriyor.");
    }

    if (!Array.isArray(snapshot.tables[tableName])) {
      throw new BackupValidationError("Yedek dosyası okunamadı. Dosya bozuk veya eksik olabilir.");
    }
  }
}

export function createRestorePreview(snapshot: BackupSnapshot): RestorePreview {
  validateBackupSnapshot(snapshot);

  const counts = createCountsFromTables(snapshot.tables);

  return {
    metadata: {
      ...snapshot.metadata,
      counts: {
        ...emptyCounts(),
        ...snapshot.metadata.counts,
        ...counts
      }
    },
    counts,
    total_records: createTotalCount(counts)
  };
}

export async function restoreBackupSnapshot(
  snapshot: BackupSnapshot,
  database: AppDatabase = db
): Promise<RestoreResult> {
  const preview = createRestorePreview(snapshot);

  const tables = TABLE_NAMES.map((tableName) => database.table(tableName));
  let restoredCounts: BackupCounts = emptyCounts();

  await database.transaction("rw", tables, async () => {
    for (const tableName of TABLE_NAMES) {
      const table = database.table(tableName);
      await table.clear();
      await table.bulkAdd(snapshot.tables[tableName]);
    }

    restoredCounts = Object.fromEntries(
      await Promise.all(TABLE_NAMES.map(async (tableName) => [tableName, await database.table(tableName).count()] as const))
    ) as BackupCounts;

    for (const tableName of TABLE_NAMES) {
      if (restoredCounts[tableName] !== preview.counts[tableName]) {
        throw new BackupValidationError("Geri yükleme tamamlanamadı. Mevcut veriler korunmaya çalışıldı.");
      }
    }
  });

  return {
    ...preview,
    restored_counts: restoredCounts
  };
}
