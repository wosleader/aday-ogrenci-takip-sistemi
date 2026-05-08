import type { BackupSnapshot } from "../../../db/backup";
import { createBackupSnapshot } from "../../../db/backup";
import type { AppDatabase } from "../../../db/db";
import { db } from "../../../db/db";

export type PreImportBackup = {
  snapshot: BackupSnapshot;
  file_name: string;
  json: string;
};

export async function createPreImportBackup(
  database: AppDatabase = db
): Promise<PreImportBackup> {
  const snapshot = await createBackupSnapshot(database);
  const stamp = snapshot.metadata.created_at.replace(/[:.]/g, "-");

  return {
    snapshot,
    file_name: `aday-ogrenci-takip-yedek-import-oncesi-${stamp}.json`,
    json: JSON.stringify(snapshot, null, 2)
  };
}
