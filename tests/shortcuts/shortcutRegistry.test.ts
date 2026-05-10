import { describe, expect, it } from "vitest";
import {
  getDefaultOperationShortcuts,
  getShortcutDisplayText,
  resolveShortcutAction,
  shouldSuppressShortcutEvent,
  validateShortcutConfig,
  type ShortcutDefinition
} from "../../src/features/shortcuts/services/shortcutRegistry";

function keyboardEvent(key: string, options: KeyboardEventInit = {}) {
  return new KeyboardEvent("keydown", { key, bubbles: true, ...options });
}

describe("shortcutRegistry", () => {
  it("returns operation defaults without using 3 for critical actions", () => {
    const shortcuts = getDefaultOperationShortcuts();

    expect(shortcuts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ action_key: "save_call", shortcut: "Ctrl+S" }),
        expect.objectContaining({ action_key: "call_reached", shortcut: "1" }),
        expect.objectContaining({ action_key: "call_not_reached", shortcut: "2" }),
        expect.objectContaining({ action_key: "call_wrong_number", shortcut: "4" })
      ])
    );
    expect(shortcuts.some((shortcut) => shortcut.shortcut === "3")).toBe(false);
    expect(validateShortcutConfig(shortcuts)).toEqual([]);
    expect(getShortcutDisplayText(shortcuts.find((shortcut) => shortcut.action_key === "next_candidate")!)).toBe(
      "N / ArrowDown"
    );
  });

  it("blocks assigning 3 to a critical shortcut", () => {
    const shortcuts: ShortcutDefinition[] = [
      { action_key: "call_reached", label: "Görüşüldü", shortcut: "3", is_active: true }
    ];

    expect(validateShortcutConfig(shortcuts)).toEqual([
      expect.objectContaining({ type: "reserved_critical_key", shortcut: "3", action_keys: ["call_reached"] })
    ]);
  });

  it("detects active shortcut conflicts", () => {
    const shortcuts: ShortcutDefinition[] = [
      { action_key: "call_reached", label: "Görüşüldü", shortcut: "1", is_active: true },
      { action_key: "call_not_reached", label: "Ulaşılamadı", shortcut: "1", is_active: true }
    ];

    expect(validateShortcutConfig(shortcuts)).toEqual([
      expect.objectContaining({ type: "conflict", shortcut: "1", action_keys: ["call_reached", "call_not_reached"] })
    ]);
  });

  it("suppresses global letter and number shortcuts while typing", () => {
    const input = document.createElement("input");
    const event = keyboardEvent("f");
    Object.defineProperty(event, "target", { value: input });

    expect(shouldSuppressShortcutEvent(event)).toBe(true);
    expect(resolveShortcutAction(event)).toBeNull();
  });

  it("allows Ctrl+S while typing so browser save can be intercepted", () => {
    const textarea = document.createElement("textarea");
    const event = keyboardEvent("s", { ctrlKey: true });
    Object.defineProperty(event, "target", { value: textarea });

    expect(shouldSuppressShortcutEvent(event)).toBe(false);
    expect(resolveShortcutAction(event)).toBe("save_call");
  });

  it("maps keyboard events to shortcut actions", () => {
    expect(resolveShortcutAction(keyboardEvent("ArrowUp"))).toBe("previous_candidate");
    expect(resolveShortcutAction(keyboardEvent("ArrowDown"))).toBe("next_candidate");
    expect(resolveShortcutAction(keyboardEvent("n"))).toBe("next_candidate");
    expect(resolveShortcutAction(keyboardEvent("f"))).toBe("focus_search");
    expect(resolveShortcutAction(keyboardEvent("1"))).toBe("call_reached");
    expect(resolveShortcutAction(keyboardEvent("2"))).toBe("call_not_reached");
    expect(resolveShortcutAction(keyboardEvent("4"))).toBe("call_wrong_number");
    expect(resolveShortcutAction(keyboardEvent("5"))).toBe("call_appointment");
    expect(resolveShortcutAction(keyboardEvent("6"))).toBe("call_do_not_call");
  });
});
