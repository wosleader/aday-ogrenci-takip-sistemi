export type ShortcutActionKey =
  | "previous_candidate"
  | "next_candidate"
  | "focus_search"
  | "save_call"
  | "call_reached"
  | "call_not_reached"
  | "call_wrong_number"
  | "call_appointment"
  | "call_do_not_call"
  | "mark_phone_1_contacted"
  | "mark_phone_2_contacted"
  | "toggle_active_phone_invalid"
  | "escape";

export type ShortcutDefinition = {
  action_key: ShortcutActionKey;
  label: string;
  shortcut: string;
  is_active: boolean;
};

export type ShortcutValidationIssue = {
  type: "conflict" | "reserved_critical_key";
  shortcut: string;
  action_keys: ShortcutActionKey[];
  message: string;
};

const CRITICAL_ACTIONS = new Set<ShortcutActionKey>([
  "save_call",
  "call_reached",
  "call_not_reached",
  "call_wrong_number",
  "call_appointment",
  "call_do_not_call",
  "mark_phone_1_contacted",
  "mark_phone_2_contacted",
  "toggle_active_phone_invalid"
]);

const ACTION_SHORTCUT_ALIASES: Partial<Record<ShortcutActionKey, string[]>> = {
  next_candidate: ["ArrowDown"]
};

export const OPERATION_SHORTCUTS: ShortcutDefinition[] = DEFAULT_SHORTCUTS.map((shortcut) => ({ ...shortcut }));

export function getDefaultOperationShortcuts(): ShortcutDefinition[] {
  return OPERATION_SHORTCUTS.map((shortcut) => ({ ...shortcut }));
}

export function getShortcutDisplayText(shortcut: ShortcutDefinition): string {
  return [shortcut.shortcut, ...(ACTION_SHORTCUT_ALIASES[shortcut.action_key] ?? [])].join(" / ");
}

export function normalizeShortcutValue(shortcut: string): string {
  return shortcut
    .trim()
    .replace(/^esc$/i, "Escape")
    .replace(/^up$/i, "ArrowUp")
    .replace(/^down$/i, "ArrowDown")
    .split("+")
    .map((part) => {
      const value = part.trim();

      if (/^(ctrl|control)$/i.test(value)) {
        return "Ctrl";
      }

      if (/^shift$/i.test(value)) {
        return "Shift";
      }

      if (/^alt$/i.test(value)) {
        return "Alt";
      }

      if (/^meta$/i.test(value)) {
        return "Meta";
      }

      if (/^arrow(up|down|left|right)$/i.test(value)) {
        return `Arrow${value.slice(5, 6).toUpperCase()}${value.slice(6).toLowerCase()}`;
      }

      if (/^escape$/i.test(value)) {
        return "Escape";
      }

      if (value.length === 1) {
        return value.toUpperCase();
      }

      return value;
    })
    .join("+");
}

export function shortcutFromKeyboardEvent(event: Pick<KeyboardEvent, "key" | "ctrlKey" | "metaKey" | "altKey" | "shiftKey">): string {
  const modifiers: string[] = [];

  if (event.ctrlKey || event.metaKey) {
    modifiers.push("Ctrl");
  }

  if (event.altKey) {
    modifiers.push("Alt");
  }

  if (event.shiftKey && event.key.length !== 1) {
    modifiers.push("Shift");
  }

  const key = event.key.length === 1 ? event.key.toUpperCase() : event.key;

  return normalizeShortcutValue([...modifiers, key].join("+"));
}

export function isEditableShortcutTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (target.isContentEditable) {
    return true;
  }

  return ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

export function shouldSuppressShortcutEvent(event: KeyboardEvent): boolean {
  if (!isEditableShortcutTarget(event.target)) {
    return false;
  }

  const shortcut = shortcutFromKeyboardEvent(event);

  return shortcut !== "Ctrl+S" && shortcut !== "Escape";
}

export function resolveShortcutAction(
  event: KeyboardEvent,
  shortcuts: ShortcutDefinition[] = OPERATION_SHORTCUTS
): ShortcutActionKey | null {
  if (shouldSuppressShortcutEvent(event)) {
    return null;
  }

  const shortcut = shortcutFromKeyboardEvent(event);
  const match = shortcuts.find(
    (definition) =>
      definition.is_active &&
      [definition.shortcut, ...(ACTION_SHORTCUT_ALIASES[definition.action_key] ?? [])].some(
        (candidate) => normalizeShortcutValue(candidate) === shortcut
      )
  );

  return match?.action_key ?? null;
}

export function validateShortcutConfig(shortcuts: ShortcutDefinition[]): ShortcutValidationIssue[] {
  const issues: ShortcutValidationIssue[] = [];
  const byShortcut = new Map<string, ShortcutActionKey[]>();

  for (const shortcut of shortcuts.filter((definition) => definition.is_active)) {
    const normalizedShortcut = normalizeShortcutValue(shortcut.shortcut);
    const actionKeys = byShortcut.get(normalizedShortcut) ?? [];
    byShortcut.set(normalizedShortcut, [...actionKeys, shortcut.action_key]);

    if (normalizedShortcut === "3" && CRITICAL_ACTIONS.has(shortcut.action_key)) {
      issues.push({
        type: "reserved_critical_key",
        shortcut: normalizedShortcut,
        action_keys: [shortcut.action_key],
        message: "3 tuşu kritik varsayılan işlem kısayolu olarak kullanılamaz."
      });
    }
  }

  for (const [shortcut, actionKeys] of byShortcut.entries()) {
    if (actionKeys.length > 1) {
      issues.push({
        type: "conflict",
        shortcut,
        action_keys: actionKeys,
        message: `${shortcut} birden fazla aksiyona atanmış.`
      });
    }
  }

  return issues;
}
import { DEFAULT_SHORTCUTS } from "../../../domain/constants/shortcuts";
