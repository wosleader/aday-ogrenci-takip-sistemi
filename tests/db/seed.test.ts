import { describe, expect, it } from "vitest";
import { AppDatabase } from "../../src/db/db";
import { seedDatabase } from "../../src/db/seed";

describe("seedDatabase", () => {
  it("seeds default campaign, settings and shortcuts", async () => {
    const database = new AppDatabase(`test-db-${crypto.randomUUID()}`);

    try {
      await database.open();
      await seedDatabase(database);

      const campaigns = await database.campaigns.toArray();
      const shortcuts = await database.keyboard_shortcuts.toArray();
      const defaultCampaignSetting = await database.settings.get("default_campaign");

      expect(campaigns).toHaveLength(1);
      expect(campaigns[0].name).toBe("Diğer");
      expect(campaigns.some((campaign) => campaign.name === "Normal")).toBe(false);
      expect(defaultCampaignSetting?.value).toBe("Diğer");
      expect(shortcuts.some((shortcut) => shortcut.shortcut === "3")).toBe(false);
    } finally {
      database.close();
      await database.delete();
    }
  });
});
