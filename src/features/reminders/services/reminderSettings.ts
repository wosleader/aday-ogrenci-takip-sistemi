import type { AppDatabase } from "../../../db/db";
import { db } from "../../../db/db";
import { nowIso } from "../../../utils/dateTime";

export type ReminderNotificationSettings = {
  popup_enabled: boolean;
  sound_enabled: boolean;
};

const POPUP_SETTING_KEY = "reminder_popup_enabled";
const SOUND_SETTING_KEY = "reminder_sound_enabled";

function toBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value == null) {
    return defaultValue;
  }

  return value === "true";
}

export async function readReminderNotificationSettings(
  database: AppDatabase = db
): Promise<ReminderNotificationSettings> {
  const [popupSetting, soundSetting] = await Promise.all([
    database.settings.get(POPUP_SETTING_KEY),
    database.settings.get(SOUND_SETTING_KEY)
  ]);

  return {
    popup_enabled: toBoolean(popupSetting?.value, true),
    sound_enabled: toBoolean(soundSetting?.value, true)
  };
}

export async function updateReminderNotificationSettings(
  settings: ReminderNotificationSettings,
  database: AppDatabase = db
): Promise<void> {
  const timestamp = nowIso();

  await database.transaction("rw", database.settings, async () => {
    await database.settings.put({
      key: POPUP_SETTING_KEY,
      value: String(settings.popup_enabled),
      updated_at: timestamp
    });
    await database.settings.put({
      key: SOUND_SETTING_KEY,
      value: String(settings.sound_enabled),
      updated_at: timestamp
    });
  });
}
