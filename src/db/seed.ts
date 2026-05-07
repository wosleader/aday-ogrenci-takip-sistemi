import type { Table } from "dexie";
import { DEFAULT_SETTINGS } from "../domain/constants/settings";
import { DEFAULT_SHORTCUTS } from "../domain/constants/shortcuts";
import type { CampaignRecord } from "../domain/models/campaign";
import type { KeyboardShortcutRecord, SettingRecord } from "../domain/models/setting";
import { createUuid } from "../utils/id";
import { nowIso } from "../utils/dateTime";
import { db, type AppDatabase } from "./db";

async function seedIfEmpty<T, Key>(
  table: Table<T, Key>,
  records: T[]
): Promise<void> {
  const existingCount = await table.count();

  if (existingCount === 0) {
    await table.bulkAdd(records);
  }
}

export async function seedDatabase(database: AppDatabase = db): Promise<void> {
  const timestamp = nowIso();

  await database.transaction(
    "rw",
    database.campaigns,
    database.settings,
    database.keyboard_shortcuts,
    async () => {
      const defaultCampaign: CampaignRecord = {
        uuid: createUuid(),
        name: "Diğer",
        is_default: true,
        is_active: true,
        sync_status: "local",
        created_at: timestamp,
        updated_at: timestamp,
        deleted_at: null
      };

      const settings: SettingRecord[] = DEFAULT_SETTINGS.map((setting) => ({
        key: setting.key,
        value: setting.value,
        updated_at: timestamp
      }));

      const shortcuts: KeyboardShortcutRecord[] = DEFAULT_SHORTCUTS.map((shortcut) => ({
        ...shortcut,
        updated_at: timestamp
      }));

      await seedIfEmpty(database.campaigns, [defaultCampaign]);
      await seedIfEmpty(database.settings, settings);
      await seedIfEmpty(database.keyboard_shortcuts, shortcuts);
    }
  );
}

export async function initializeDatabase(): Promise<void> {
  await db.open();
  await seedDatabase(db);
}
