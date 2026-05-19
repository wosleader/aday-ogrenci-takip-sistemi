import type { PhoneRecord } from "../../src/domain/models/phone";
import {
  createCompatibilityPhoneList,
  createPhoneDisplayLabel,
  createPhoneReferenceLabel,
  createPhoneSnapshot,
  createPhonesFromLegacyFields,
  getLegacyPhoneSlotsFromPhoneList
} from "../../src/features/students/services/phoneCompatibility";

function phone(overrides: Partial<PhoneRecord> = {}): PhoneRecord {
  const phoneNumber = overrides.phone_number ?? "05321234567";

  return {
    uuid: overrides.uuid ?? crypto.randomUUID(),
    student_id: overrides.student_id ?? 1,
    guardian_id: overrides.guardian_id ?? null,
    phone_number: phoneNumber,
    normalized_phone_number: overrides.normalized_phone_number ?? phoneNumber,
    original_phone_value: overrides.original_phone_value ?? phoneNumber,
    phone_label: overrides.phone_label ?? "Telefon 1",
    reference_label: overrides.reference_label ?? null,
    relation_label: overrides.relation_label ?? null,
    source_column: overrides.source_column ?? null,
    priority: overrides.priority ?? null,
    phone_status: overrides.phone_status ?? "active",
    is_valid: overrides.is_valid ?? true,
    is_wrong: overrides.is_wrong ?? false,
    is_primary: overrides.is_primary ?? false,
    note: overrides.note ?? null,
    sync_status: overrides.sync_status ?? "local",
    created_at: overrides.created_at ?? "2026-05-19T09:00:00.000Z",
    updated_at: overrides.updated_at ?? "2026-05-19T09:00:00.000Z",
    deleted_at: overrides.deleted_at ?? null,
    id: overrides.id
  };
}

describe("phoneCompatibility", () => {
  it("creates a phone list from legacy phone1 and phone2 fields", () => {
    const phones = createPhonesFromLegacyFields({
      phone_1: "0532 123 45 67",
      phone_2: "0532 765 43 21"
    });

    expect(phones).toEqual([
      expect.objectContaining({
        phone_number: "05321234567",
        reference_label: "Telefon 1",
        relation_label: "Telefon",
        source_column: "phone_1",
        priority: 1
      }),
      expect.objectContaining({
        phone_number: "05327654321",
        reference_label: "Telefon 2",
        relation_label: "Telefon",
        source_column: "phone_2",
        priority: 2
      })
    ]);
  });

  it("skips empty legacy phones and deduplicates the same student phone number", () => {
    const phones = createPhonesFromLegacyFields({
      phone_1: "0532 123 45 67",
      phone_2: "5321234567"
    });

    expect(phones).toHaveLength(1);
    expect(createPhonesFromLegacyFields({ phone_1: "", phone_2: "   " })).toEqual([]);
  });

  it("reads legacy phone1 and phone2 slots from a phone list", () => {
    const phones = createCompatibilityPhoneList([
      phone({ id: 22, phone_number: "05327654321", normalized_phone_number: "05327654321", phone_label: "Telefon 2" }),
      phone({ id: 11, phone_number: "05321234567", normalized_phone_number: "05321234567", phone_label: "Telefon 1" }),
      phone({ id: 33, phone_number: "05329998877", normalized_phone_number: "05329998877", reference_label: "Telefon 3" })
    ]);
    const slots = getLegacyPhoneSlotsFromPhoneList(phones);

    expect(slots.phone_1).toEqual(expect.objectContaining({ id: 11, phone_number: "05321234567" }));
    expect(slots.phone_2).toEqual(expect.objectContaining({ id: 22, phone_number: "05327654321" }));
  });

  it("creates reference and display labels", () => {
    expect(createPhoneReferenceLabel(1)).toBe("Telefon 1");
    expect(createPhoneReferenceLabel(5)).toBe("Telefon 5");
    expect(createPhoneDisplayLabel("Telefon 2", "Anne")).toBe("Telefon 2 · Anne");
    expect(createPhoneDisplayLabel("Telefon 3", "Öğrenci")).toBe("Telefon 3 · Öğrenci");
    expect(createPhoneDisplayLabel("Telefon 4", "Yakın")).toBe("Telefon 4 · Yakın");
    expect(createPhoneDisplayLabel("Telefon 5", "Diğer")).toBe("Telefon 5 · Diğer");
    expect(createPhoneDisplayLabel("Telefon 3", "Telefon")).toBe("Telefon 3");
  });

  it("creates a phone snapshot with reference, relation and source column", () => {
    const snapshot = createPhoneSnapshot(
      phone({
        id: 5,
        phone_number: "05321234567",
        reference_label: "Telefon 5",
        relation_label: "Veli",
        source_column: "GSM 5"
      })
    );

    expect(snapshot).toEqual({
      phone_id: 5,
      reference_label: "Telefon 5",
      relation_label: "Veli",
      phone_number: "05321234567",
      source_column: "GSM 5"
    });
  });

  it("deduplicates phone lists safely at helper level", () => {
    const phones = createCompatibilityPhoneList([
      phone({ id: 1, phone_number: "0532 123 45 67", normalized_phone_number: "05321234567", phone_label: "Telefon 1" }),
      phone({ id: 2, phone_number: "5321234567", normalized_phone_number: "05321234567", phone_label: "Telefon 2" })
    ]);

    expect(phones).toHaveLength(1);
    expect(phones[0]).toEqual(expect.objectContaining({ id: 1, reference_label: "Telefon 1" }));
  });
});
