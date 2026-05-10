import { describe, expect, it } from "vitest";
import type { ReminderPopupModel } from "../../src/features/reminders/services/reminderAlarmReader";
import {
  createReminderPopupViewModel,
  DISMISS_FOLLOWING_REMINDERS_LABEL,
  formatReminderPopupDateTime
} from "../../src/features/reminders/services/reminderPopupViewModel";

function popupModel(overrides: Partial<ReminderPopupModel> = {}): ReminderPopupModel {
  const primaryAlert = {
    reminder_id: 1,
    student_id: 10,
    student_full_name: "ZEYNEP SUBAŞI",
    guardian_full_name: "RAMAZAN SUBAŞI",
    phone_1: "05321234567",
    phone_2: "05431234567",
    reminder_at: "2026-05-09T11:00:00",
    note: "Uzun açıklama popup içinde görünmemeli."
  };

  return {
    alerts: [primaryAlert],
    primaryAlert,
    dueCount: 1,
    isBulk: false,
    ...overrides
  };
}

describe("reminderPopupViewModel", () => {
  it("formats reminder date and time as dd.mm.yyyy hh:mm", () => {
    expect(formatReminderPopupDateTime("2026-05-09T11:00:00")).toBe("09.05.2026 11:00");
  });

  it("creates a simplified single reminder popup model without phone or note content", () => {
    const viewModel = createReminderPopupViewModel(popupModel());

    expect(viewModel).toEqual({
      title: "Tekrar arama zamanı geldi",
      student_name: "ZEYNEP SUBAŞI",
      guardian_line: "Veli: RAMAZAN SUBAŞI",
      reminder_line: "Hatırlatma: 09.05.2026 11:00"
    });
    expect(JSON.stringify(viewModel)).not.toContain("05321234567");
    expect(JSON.stringify(viewModel)).not.toContain("Uzun açıklama");
  });

  it("uses a compact bulk title for multiple due reminders", () => {
    const viewModel = createReminderPopupViewModel(popupModel({ dueCount: 5, isBulk: true }));

    expect(viewModel.title).toBe("5 hatırlatma zamanı geldi");
  });

  it("uses the new dismiss following reminders label", () => {
    expect(DISMISS_FOLLOWING_REMINDERS_LABEL).toBe("Sonraki Bildirimleri Kapat");
  });
});
