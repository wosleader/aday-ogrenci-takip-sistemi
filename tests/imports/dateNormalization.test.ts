import { describe, expect, it } from "vitest";
import { normalizeReminderDate } from "../../src/features/imports/services/dateNormalization";

describe("normalizeReminderDate", () => {
  it("assigns default 11:00 when date has no time", () => {
    const result = normalizeReminderDate("2026-05-12", "11:00", "10:00", "18:00");

    expect(result.reminder_at).toBe("2026-05-12T11:00:00");
    expect(result.default_time_assigned).toBe(true);
  });

  it("keeps provided time and warns when outside configured call hours", () => {
    const result = normalizeReminderDate("12.05.2026 19:30", "11:00", "10:00", "18:00");

    expect(result.reminder_at).toBe("2026-05-12T19:30:00");
    expect(result.default_time_assigned).toBe(false);
    expect(result.outside_call_hours).toBe(true);
  });
});
