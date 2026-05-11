import { describe, expect, it } from "vitest";
import { AppDatabase } from "../../src/db/db";
import { seedDatabase } from "../../src/db/seed";
import {
  mergeShortcutRecords,
  readActiveOperationShortcuts,
  resetShortcutToDefault,
  updateShortcutForAction,
  validateShortcutChange
} from "../../src/features/shortcuts/services/shortcutSettings";

describe("shortcutSettings", () => {
  async function createDatabase() {
    const database = new AppDatabase(`test-shortcut-settings-${crypto.randomUUID()}`);
    await seedDatabase(database);

    return database;
  }

  it("merges missing IndexedDB records with defaults", () => {
    const shortcuts = mergeShortcutRecords([
      {
        action_key: "mark_phone_1_contacted",
        label: "Eski Telefon 1",
        shortcut: "G",
        is_active: true,
        updated_at: new Date().toISOString()
      }
    ]);

    expect(shortcuts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ action_key: "mark_phone_1_contacted", shortcut: "G" }),
        expect.objectContaining({ action_key: "save_call", shortcut: "Ctrl+S" })
      ])
    );
  });

  it("updates a user shortcut and persists it", async () => {
    const database = await createDatabase();

    try {
      await updateShortcutForAction("mark_phone_1_contacted", "G", database);

      const shortcuts = await readActiveOperationShortcuts(database);
      expect(shortcuts).toEqual(
        expect.arrayContaining([expect.objectContaining({ action_key: "mark_phone_1_contacted", shortcut: "G" })])
      );
    } finally {
      await database.delete();
    }
  });

  it("does not save conflicting shortcuts", async () => {
    const database = await createDatabase();

    try {
      await expect(updateShortcutForAction("mark_phone_1_contacted", "Y", database)).rejects.toThrow(
        "Bu kısayol zaten 'Telefon 2'yi görüşülen numara yap' işlemi için kullanılıyor."
      );

      const shortcuts = await readActiveOperationShortcuts(database);
      expect(shortcuts).toEqual(
        expect.arrayContaining([expect.objectContaining({ action_key: "mark_phone_1_contacted", shortcut: "T" })])
      );
    } finally {
      await database.delete();
    }
  });

  it("blocks assigning 3 to a critical action", async () => {
    const database = await createDatabase();

    try {
      await expect(updateShortcutForAction("next_candidate", "3", database)).rejects.toThrow(
        "3 tuşu bu projede kritik işlem kısayolu olarak kullanılamaz. Lütfen başka bir tuş seçin."
      );
    } finally {
      await database.delete();
    }
  });

  it("rejects risky single keys", async () => {
    const database = await createDatabase();

    try {
      await expect(updateShortcutForAction("focus_search", "Tab", database)).rejects.toThrow(
        "Bu tuş sistem veya tarayıcı tarafından kullanılıyor olabilir. Lütfen başka bir kısayol seçin."
      );
    } finally {
      await database.delete();
    }
  });

  it("resets one action back to its default shortcut", async () => {
    const database = await createDatabase();

    try {
      await updateShortcutForAction("mark_phone_1_contacted", "G", database);
      await resetShortcutToDefault("mark_phone_1_contacted", database);

      const shortcuts = await readActiveOperationShortcuts(database);
      expect(shortcuts).toEqual(
        expect.arrayContaining([expect.objectContaining({ action_key: "mark_phone_1_contacted", shortcut: "T" })])
      );
    } finally {
      await database.delete();
    }
  });

  it("validates shortcut changes without mutating the current list", async () => {
    const database = await createDatabase();

    try {
      const shortcuts = await readActiveOperationShortcuts(database);

      expect(validateShortcutChange(shortcuts, "mark_phone_2_contacted", "H")).toEqual({
        ok: true,
        normalizedShortcut: "H"
      });
      expect(validateShortcutChange(shortcuts, "mark_phone_2_contacted", "T")).toEqual({
        ok: false,
        message: "Bu kısayol zaten 'Telefon 1'i görüşülen numara yap' işlemi için kullanılıyor."
      });
    } finally {
      await database.delete();
    }
  });
});
