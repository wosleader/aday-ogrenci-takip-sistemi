import type { AppDatabase } from "../../../db/db";
import { db } from "../../../db/db";
import type { KeyboardShortcutRecord } from "../../../domain/models/setting";
import { nowIso } from "../../../utils/dateTime";
import {
  getDefaultOperationShortcuts,
  normalizeShortcutValue,
  validateShortcutConfig,
  type ShortcutActionKey,
  type ShortcutDefinition
} from "./shortcutRegistry";

export type ShortcutUpdateResult = {
  ok: true;
  shortcut: ShortcutDefinition;
};

function isKnownShortcutAction(actionKey: string): actionKey is ShortcutActionKey {
  return getDefaultOperationShortcuts().some((shortcut) => shortcut.action_key === actionKey);
}

export function mergeShortcutRecords(records: KeyboardShortcutRecord[]): ShortcutDefinition[] {
  const recordsByAction = new Map(records.map((record) => [record.action_key, record]));

  return getDefaultOperationShortcuts().map((defaultShortcut) => {
    const record = recordsByAction.get(defaultShortcut.action_key);

    if (!record) {
      return defaultShortcut;
    }

    return {
      action_key: defaultShortcut.action_key,
      label: defaultShortcut.label,
      shortcut: normalizeShortcutValue(record.shortcut || defaultShortcut.shortcut),
      is_active: record.is_active
    };
  });
}

export async function readActiveOperationShortcuts(database: AppDatabase = db): Promise<ShortcutDefinition[]> {
  const records = await database.keyboard_shortcuts.toArray();

  return mergeShortcutRecords(records);
}

export function validateShortcutChange(
  shortcuts: ShortcutDefinition[],
  actionKey: ShortcutActionKey,
  nextShortcut: string
): { ok: true; normalizedShortcut: string } | { ok: false; message: string } {
  const normalizedShortcut = normalizeShortcutValue(nextShortcut);
  const candidateShortcuts = shortcuts.map((shortcut) =>
    shortcut.action_key === actionKey
      ? {
          ...shortcut,
          shortcut: normalizedShortcut,
          is_active: true
        }
      : shortcut
  );
  const issues = validateShortcutConfig(candidateShortcuts).filter((issue) => issue.action_keys.includes(actionKey));

  if (issues.length === 0) {
    return { ok: true, normalizedShortcut };
  }

  const conflict = issues.find((issue) => issue.type === "conflict");

  if (conflict) {
    const conflictingAction = candidateShortcuts.find(
      (shortcut) => shortcut.action_key !== actionKey && conflict.action_keys.includes(shortcut.action_key)
    );

    return {
      ok: false,
      message: conflictingAction
        ? `Bu kısayol zaten '${conflictingAction.label}' işlemi için kullanılıyor.`
        : conflict.message
    };
  }

  return {
    ok: false,
    message: issues[0].message
  };
}

async function upsertShortcutRecord(
  actionKey: ShortcutActionKey,
  shortcut: ShortcutDefinition,
  database: AppDatabase
): Promise<void> {
  const existingRecord = await database.keyboard_shortcuts.where("action_key").equals(actionKey).first();
  const record: KeyboardShortcutRecord = {
    action_key: actionKey,
    label: shortcut.label,
    shortcut: shortcut.shortcut,
    is_active: shortcut.is_active,
    updated_at: nowIso()
  };

  if (existingRecord?.id) {
    await database.keyboard_shortcuts.update(existingRecord.id, record);
    return;
  }

  await database.keyboard_shortcuts.add(record);
}

export async function updateShortcutForAction(
  actionKey: ShortcutActionKey,
  nextShortcut: string,
  database: AppDatabase = db
): Promise<ShortcutUpdateResult> {
  if (!isKnownShortcutAction(actionKey)) {
    throw new Error("Bilinmeyen kısayol işlemi.");
  }

  const shortcuts = await readActiveOperationShortcuts(database);
  const validation = validateShortcutChange(shortcuts, actionKey, nextShortcut);

  if (!validation.ok) {
    throw new Error(validation.message);
  }

  const defaultShortcut = getDefaultOperationShortcuts().find((shortcut) => shortcut.action_key === actionKey);

  if (!defaultShortcut) {
    throw new Error("Bilinmeyen kısayol işlemi.");
  }

  const shortcut: ShortcutDefinition = {
    ...defaultShortcut,
    shortcut: validation.normalizedShortcut,
    is_active: true
  };

  await upsertShortcutRecord(actionKey, shortcut, database);

  return { ok: true, shortcut };
}

export async function resetShortcutToDefault(
  actionKey: ShortcutActionKey,
  database: AppDatabase = db
): Promise<ShortcutUpdateResult> {
  const defaultShortcut = getDefaultOperationShortcuts().find((shortcut) => shortcut.action_key === actionKey);

  if (!defaultShortcut) {
    throw new Error("Bilinmeyen kısayol işlemi.");
  }

  const shortcuts = await readActiveOperationShortcuts(database);
  const validation = validateShortcutChange(shortcuts, actionKey, defaultShortcut.shortcut);

  if (!validation.ok) {
    throw new Error(validation.message);
  }

  await upsertShortcutRecord(actionKey, defaultShortcut, database);

  return { ok: true, shortcut: defaultShortcut };
}
