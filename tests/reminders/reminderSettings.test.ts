import { describe, expect, it } from "vitest";
import { AppDatabase } from "../../src/db/db";
import {
  readReminderNotificationSettings,
  updateReminderNotificationSettings
} from "../../src/features/reminders/services/reminderSettings";

async function createDatabase() {
  const database = new AppDatabase(`test-reminder-settings-${crypto.randomUUID()}`);
  await database.open();
  return database;
}

describe("reminderSettings", () => {
  it("uses popup and sound enabled by default", async () => {
    const database = await createDatabase();

    try {
      await expect(readReminderNotificationSettings(database)).resolves.toEqual({
        popup_enabled: true,
        sound_enabled: true
      });
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("persists reminder notification settings", async () => {
    const database = await createDatabase();

    try {
      await updateReminderNotificationSettings({ popup_enabled: false, sound_enabled: false }, database);

      await expect(readReminderNotificationSettings(database)).resolves.toEqual({
        popup_enabled: false,
        sound_enabled: false
      });
    } finally {
      database.close();
      await database.delete();
    }
  });
});
