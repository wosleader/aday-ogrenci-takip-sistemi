import { describe, expect, it } from "vitest";
import type { CallLogRecord } from "../../src/domain/models/callLog";
import { getCallLogPhoneContextLabel } from "../../src/features/calls/services/callLogPhoneContext";

const timestamp = "2026-05-19T09:00:00.000Z";

function callLog(overrides: Partial<CallLogRecord> = {}): CallLogRecord {
  return {
    uuid: crypto.randomUUID(),
    student_id: 1,
    call_time: timestamp,
    call_result: "reached",
    note: null,
    sync_status: "local",
    created_at: timestamp,
    updated_at: timestamp,
    deleted_at: null,
    ...overrides
  };
}

describe("callLogPhoneContext", () => {
  it("keeps old call log records valid without phone context", () => {
    expect(getCallLogPhoneContextLabel(callLog())).toBe("Telefon bilgisi yok");
  });

  it("creates a display label from call log phone snapshot", () => {
    expect(
      getCallLogPhoneContextLabel(
        callLog({
          phone_id: 2,
          phone_snapshot: {
            phone_id: 2,
            reference_label: "Telefon 2",
            relation_label: "Anne",
            phone_number: "05321234567",
            source_column: "Anne Telefon"
          }
        })
      )
    ).toBe("Telefon 2 · Anne");
  });

  it("preserves Turkish relation labels from phone snapshot", () => {
    expect(
      getCallLogPhoneContextLabel(
        callLog({
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
      getCallLogPhoneContextLabel(
        callLog({
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
      getCallLogPhoneContextLabel(
        callLog({
          phone_snapshot: {
            phone_id: 5,
            reference_label: "Telefon 5",
            relation_label: "Diğer",
            phone_number: "05329998877"
          }
        })
      )
    ).toBe("Telefon 5 · Diğer");
  });

  it("falls back safely when phone id exists without snapshot", () => {
    expect(getCallLogPhoneContextLabel(callLog({ phone_id: 7 }))).toBe("Telefon bilgisi yok");
  });

  it("keeps legacy contacted phone label as fallback when snapshot does not exist", () => {
    expect(getCallLogPhoneContextLabel(callLog({ contacted_phone_label: "Telefon 1" }))).toBe("Telefon 1");
  });
});
