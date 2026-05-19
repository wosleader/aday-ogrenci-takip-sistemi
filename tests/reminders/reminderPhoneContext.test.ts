import { describe, expect, it } from "vitest";
import type { ReminderRecord } from "../../src/domain/models/reminder";
import { getReminderPhoneContextLabel } from "../../src/features/reminders/services/reminderPhoneContext";

const timestamp = "2026-05-19T09:00:00.000Z";

function reminder(overrides: Partial<ReminderRecord> = {}): ReminderRecord {
  return {
    uuid: crypto.randomUUID(),
    student_id: 1,
    reminder_type: "call",
    reminder_at: "2026-05-20T11:00:00.000Z",
    status: "pending",
    note: null,
    is_default_time_assigned: false,
    sync_status: "local",
    created_at: timestamp,
    updated_at: timestamp,
    deleted_at: null,
    ...overrides
  };
}

describe("reminderPhoneContext", () => {
  it("keeps old reminder records valid without phone context", () => {
    expect(getReminderPhoneContextLabel(reminder())).toBe("Telefon bilgisi yok");
  });

  it("creates a display label from reminder phone snapshot", () => {
    expect(
      getReminderPhoneContextLabel(
        reminder({
          phone_id: 5,
          phone_snapshot: {
            phone_id: 5,
            reference_label: "Telefon 5",
            relation_label: "Veli",
            phone_number: "05321234567",
            source_column: "GSM 5"
          }
        })
      )
    ).toBe("Telefon 5 · Veli");
  });

  it("preserves Turkish relation labels from phone snapshot", () => {
    expect(
      getReminderPhoneContextLabel(
        reminder({
          phone_snapshot: {
            phone_id: 3,
            reference_label: "Telefon 3",
            relation_label: "Öğrenci",
            phone_number: "05321234567"
          }
        })
      )
    ).toBe("Telefon 3 · Öğrenci");
    expect(
      getReminderPhoneContextLabel(
        reminder({
          phone_snapshot: {
            phone_id: 4,
            reference_label: "Telefon 4",
            relation_label: "Yakın",
            phone_number: "05327654321"
          }
        })
      )
    ).toBe("Telefon 4 · Yakın");
    expect(
      getReminderPhoneContextLabel(
        reminder({
          phone_snapshot: {
            phone_id: 6,
            reference_label: "Telefon 6",
            relation_label: "Diğer",
            phone_number: "05329998877"
          }
        })
      )
    ).toBe("Telefon 6 · Diğer");
  });

  it("falls back safely when phone id exists without snapshot", () => {
    expect(getReminderPhoneContextLabel(reminder({ phone_id: 9 }))).toBe("Telefon bilgisi yok");
  });
});
