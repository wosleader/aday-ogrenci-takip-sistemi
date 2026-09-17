import type { AppDatabase } from "../../../db/db";
import { db } from "../../../db/db";
import { nowIso } from "../../../utils/dateTime";

export const SMART_OPERATIONAL_ALERTS_ENABLED_KEY = "smart_operational_alerts_enabled";

export async function readSmartOperationalAlertsEnabled(database: AppDatabase = db): Promise<boolean> {
  const setting = await database.settings.get(SMART_OPERATIONAL_ALERTS_ENABLED_KEY);

  return setting?.value !== "false";
}

export async function updateSmartOperationalAlertsEnabled(
  enabled: boolean,
  database: AppDatabase = db
): Promise<void> {
  await database.settings.put({
    key: SMART_OPERATIONAL_ALERTS_ENABLED_KEY,
    value: String(enabled),
    updated_at: nowIso()
  });
}
