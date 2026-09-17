import { afterEach, describe, expect, it } from "vitest";
import { AppDatabase } from "../../src/db/db";
import {
  readSmartOperationalAlertsEnabled,
  SMART_OPERATIONAL_ALERTS_ENABLED_KEY,
  updateSmartOperationalAlertsEnabled
} from "../../src/features/settings/services/smartTechnologySettings";

const databases: AppDatabase[] = [];

async function createDatabase(): Promise<AppDatabase> {
  const database = new AppDatabase(`test-smart-technology-settings-${crypto.randomUUID()}`);
  await database.open();
  databases.push(database);
  return database;
}

afterEach(async () => {
  while (databases.length > 0) {
    const database = databases.pop()!;
    database.close();
    await database.delete();
  }
});

describe("smartTechnologySettings", () => {
  it("defaults to enabled when the setting is absent", async () => {
    const database = await createDatabase();

    await expect(readSmartOperationalAlertsEnabled(database)).resolves.toBe(true);
  });

  it("persists false and reads it back", async () => {
    const database = await createDatabase();

    await updateSmartOperationalAlertsEnabled(false, database);

    await expect(readSmartOperationalAlertsEnabled(database)).resolves.toBe(false);
  });

  it("persists true and reads it back", async () => {
    const database = await createDatabase();

    await updateSmartOperationalAlertsEnabled(true, database);

    await expect(readSmartOperationalAlertsEnabled(database)).resolves.toBe(true);
  });

  it("changes only the smart operational alerts setting", async () => {
    const database = await createDatabase();
    const unrelated = {
      key: "unrelated_setting",
      value: "keep-me",
      updated_at: "2026-05-10T12:00:00.000Z"
    };
    await database.settings.put(unrelated);

    await updateSmartOperationalAlertsEnabled(false, database);

    expect(await database.settings.get("unrelated_setting")).toEqual(unrelated);
    expect(await database.settings.get(SMART_OPERATIONAL_ALERTS_ENABLED_KEY)).toMatchObject({
      key: SMART_OPERATIONAL_ALERTS_ENABLED_KEY,
      value: "false"
    });
    expect(await database.settings.count()).toBe(2);
  });
});
