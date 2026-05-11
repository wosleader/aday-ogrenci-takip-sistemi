import { DEFAULT_SHORTCUTS } from "../../../domain/constants/shortcuts";

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
  type: "conflict" | "reserved_critical_key" | "invalid_key";
  shortcut: string;
  action_keys: ShortcutActionKey[];
  message: string;
};

export type ShortcutBarItem = {
  id: string;
  shortcut: string;
  label: string;
};

const CRITICAL_ACTIONS = new Set<ShortcutActionKey>([
  "next_candidate",
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

const RISKY_SINGLE_KEYS = new Set(["Shift", "Ctrl", "Alt", "CapsLock", "Tab"]);

const ACTION_SHORTCUT_ALIASES: Partial<Record<ShortcutActionKey, string[]>> = {
  next_candidate: ["ArrowDown"]
};

export const OPERATION_SHORTCUTS: ShortcutDefinition[] = DEFAULT_SHORTCUTS.map((shortcut) => ({ ...shortcut }));

export function getDefaultOperationShortcuts(): ShortcutDefinition[] {
  return OPERATION_SHORTCUTS.map((shortcut) => ({ ...shortcut }));
}

export function getShortcutKeyDisplayText(shortcut: string): string {
  const normalizedShortcut = normalizeShortcutValue(shortcut);
  const parts = normalizedShortcut.split("+");
  const key = parts.at(-1) ?? normalizedShortcut;
  const modifiers = parts.slice(0, -1);
  const keyLabel =
    key === "ArrowUp"
      ? "Yukarı Tuşu"
      : key === "ArrowDown"
        ? "Aşağı Tuşu"
        : key === "Escape"
          ? "Kapat / vazgeç"
          : key;

  if (modifiers.length === 0) {
    return keyLabel;
  }

  return [...modifiers, keyLabel].join("+");
}

export function getShortcutDisplayText(shortcut: ShortcutDefinition): string {
  if (shortcut.action_key === "save_call" && normalizeShortcutValue(shortcut.shortcut) === "Ctrl+S") {
    return "Ctrl+S Kaydet";
  }

  return [shortcut.shortcut, ...(ACTION_SHORTCUT_ALIASES[shortcut.action_key] ?? [])]
    .map((value) => getShortcutKeyDisplayText(value))
    .join(" / ");
}

export function getNavigationShortcutDisplayText(): string {
  return "Yukarı/Aşağı Tuşları ile gezin";
}

function getShortcutByAction(shortcuts: ShortcutDefinition[], actionKey: ShortcutActionKey): ShortcutDefinition | undefined {
  return shortcuts.find((shortcut) => shortcut.action_key === actionKey);
}

export function getShortcutDisplayTextForAction(
  shortcuts: ShortcutDefinition[],
  actionKey: ShortcutActionKey
): string {
  const shortcut = getShortcutByAction(shortcuts, actionKey);

  return shortcut ? getShortcutKeyDisplayText(shortcut.shortcut) : "";
}

function getNavigationShortcutBarLabel(shortcuts: ShortcutDefinition[]): string {
  const previousShortcut = getShortcutByAction(shortcuts, "previous_candidate");
  const nextShortcut = getShortcutByAction(shortcuts, "next_candidate");

  if (
    previousShortcut?.is_active &&
    nextShortcut?.is_active &&
    normalizeShortcutValue(previousShortcut.shortcut) === "ArrowUp" &&
    (ACTION_SHORTCUT_ALIASES.next_candidate ?? []).some((shortcut) => normalizeShortcutValue(shortcut) === "ArrowDown")
  ) {
    return "Yukarı/Aşağı Tuşları";
  }

  return [previousShortcut, nextShortcut]
    .filter((shortcut): shortcut is ShortcutDefinition => Boolean(shortcut?.is_active))
    .map((shortcut) => getShortcutKeyDisplayText(shortcut.shortcut))
    .join(" / ");
}

export function getShortcutBarItems(shortcuts: ShortcutDefinition[]): ShortcutBarItem[] {
  const activeShortcuts = shortcuts.filter((shortcut) => shortcut.is_active);
  const itemFor = (actionKey: ShortcutActionKey, label: string): ShortcutBarItem | null => {
    const shortcut = getShortcutByAction(activeShortcuts, actionKey);

    if (!shortcut) {
      return null;
    }

    return {
      id: actionKey,
      shortcut: getShortcutKeyDisplayText(shortcut.shortcut),
      label
    };
  };

  return [
    {
      id: "candidate_navigation",
      shortcut: getNavigationShortcutBarLabel(activeShortcuts),
      label: "ile gezin"
    },
    itemFor("focus_search", "Ara"),
    itemFor("mark_phone_1_contacted", "Tel 1"),
    itemFor("mark_phone_2_contacted", "Tel 2"),
    itemFor("call_reached", "Görüşüldü"),
    itemFor("call_not_reached", "Ulaşılamadı"),
    itemFor("call_wrong_number", "Yanlış Numara"),
    itemFor("call_appointment", "Randevu"),
    itemFor("call_do_not_call", "Aranmayacak"),
    itemFor("save_call", "Kaydet")
  ].filter((item): item is ShortcutBarItem => Boolean(item));
}

export function normalizeShortcutValue(shortcut: string): string {
  return shortcut
    .trim()
    .replace(/^control$/i, "Ctrl")
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

      if (/^capslock$/i.test(value)) {
        return "CapsLock";
      }

      if (/^tab$/i.test(value)) {
        return "Tab";
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
  if (event.key === "Control" || event.key === "Ctrl") {
    return "Ctrl";
  }

  if (event.key === "Shift") {
    return "Shift";
  }

  if (event.key === "Alt") {
    return "Alt";
  }

  if (event.key === "Meta") {
    return "Meta";
  }

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
  const byShortcut = new Map<string, Set<ShortcutActionKey>>();

  for (const shortcut of shortcuts.filter((definition) => definition.is_active)) {
    const normalizedShortcut = normalizeShortcutValue(shortcut.shortcut);
    const shortcutsToCheck = [
      normalizedShortcut,
      ...(ACTION_SHORTCUT_ALIASES[shortcut.action_key] ?? []).map((value) => normalizeShortcutValue(value))
    ];

    for (const shortcutToCheck of shortcutsToCheck) {
      const actionKeys = byShortcut.get(shortcutToCheck) ?? new Set<ShortcutActionKey>();
      actionKeys.add(shortcut.action_key);
      byShortcut.set(shortcutToCheck, actionKeys);
    }

    if (RISKY_SINGLE_KEYS.has(normalizedShortcut)) {
      issues.push({
        type: "invalid_key",
        shortcut: normalizedShortcut,
        action_keys: [shortcut.action_key],
        message: "Bu tuş sistem veya tarayıcı tarafından kullanılıyor olabilir. Lütfen başka bir kısayol seçin."
      });
    }

    if (normalizedShortcut === "3" && CRITICAL_ACTIONS.has(shortcut.action_key)) {
      issues.push({
        type: "reserved_critical_key",
        shortcut: normalizedShortcut,
        action_keys: [shortcut.action_key],
        message: "3 tuşu bu projede kritik işlem kısayolu olarak kullanılamaz. Lütfen başka bir tuş seçin."
      });
    }
  }

  for (const [shortcut, actionKeySet] of byShortcut.entries()) {
    const actionKeys = [...actionKeySet];

    if (actionKeys.length > 1) {
      issues.push({
        type: "conflict",
        shortcut,
        action_keys: actionKeys,
        message: `${getShortcutKeyDisplayText(shortcut)} birden fazla aksiyona atanmış.`
      });
    }
  }

  return issues;
}
