import { describe, expect, it } from "vitest";
import type { CallLogRecord } from "../../src/domain/models/callLog";
import type { PhoneRecord } from "../../src/domain/models/phone";
import type { ReminderRecord } from "../../src/domain/models/reminder";
import type { StudentRecord } from "../../src/domain/models/student";
import {
  BASE_EXPORT_HEADERS,
  createDetailedExportSheet,
  getCallResultLabel,
  getPhoneStatusLabel
} from "../../src/features/exports/services/exportMapper";
import type { ExportDataset } from "../../src/features/exports/services/exportTypes";

const timestamp = "2026-05-08T09:00:00";

function student(overrides: Partial<StudentRecord & { id: number }> = {}): StudentRecord & { id: number } {
  return {
    id: 1,
    uuid: "student-1",
    student_full_name: "Ayşe Yılmaz",
    normalized_student_name: "ayse yilmaz",
    search_text: "ayse yilmaz",
    current_class: "11",
    student_group: "11. Sınıf YKS",
    category: "YKS",
    campaign_id: 1,
    lifecycle_status: "candidate",
    last_call_result: "reached",
    general_note: "Excel notu",
    source_row_number: 42,
    sync_status: "local",
    created_at: timestamp,
    updated_at: timestamp,
    deleted_at: null,
    ...overrides
  };
}

function phone(overrides: Partial<PhoneRecord> = {}): PhoneRecord {
  return {
    id: 1,
    uuid: "phone-1",
    student_id: 1,
    guardian_id: null,
    phone_number: "05321234567",
    normalized_phone_number: "05321234567",
    phone_label: "Telefon 1",
    phone_status: "active",
    is_valid: true,
    is_wrong: false,
    is_primary: true,
    sync_status: "local",
    created_at: timestamp,
    updated_at: timestamp,
    deleted_at: null,
    ...overrides
  };
}

function phoneForSlot(slot: number, overrides: Partial<PhoneRecord> = {}): PhoneRecord {
  const phoneNumber = `05${slot.toString().padStart(2, "0")}0000000`;

  return phone({
    id: slot,
    phone_number: phoneNumber,
    normalized_phone_number: phoneNumber,
    phone_label: `Telefon ${slot}`,
    reference_label: `Telefon ${slot}`,
    priority: slot,
    is_primary: slot === 1,
    ...overrides
  });
}

function callLog(id: number, callTime: string, overrides: Partial<CallLogRecord> = {}): CallLogRecord & { id: number } {
  return {
    id,
    uuid: `call-${id}`,
    student_id: 1,
    call_time: callTime,
    call_result: "reached",
    note: `Not ${id}`,
    contacted_phone_number: "05321234567",
    reminder_at: null,
    sync_status: "local",
    created_at: callTime,
    updated_at: callTime,
    deleted_at: null,
    ...overrides
  };
}

function reminder(overrides: Partial<ReminderRecord> = {}): ReminderRecord {
  return {
    id: 1,
    uuid: "reminder-1",
    student_id: 1,
    reminder_type: "call",
    reminder_at: "2026-05-12T11:00:00",
    status: "pending",
    is_default_time_assigned: false,
    sync_status: "local",
    created_at: timestamp,
    updated_at: timestamp,
    deleted_at: null,
    ...overrides
  };
}

function dataset(callLogs: Array<CallLogRecord & { id: number }> = []): ExportDataset {
  const primaryPhone = phone({ phone_status: "contacted" });
  const secondaryPhone = phone({
    id: 2,
    phone_number: "05431234567",
    normalized_phone_number: "05431234567",
    phone_label: "2. Telefon",
    reference_label: "Telefon 2",
    priority: 2,
    phone_status: "invalid",
    is_wrong: true,
    is_primary: false
  });

  return {
    bundles: [
      {
        student: student(),
        guardian: {
          id: 1,
          uuid: "guardian-1",
          student_id: 1,
          guardian_full_name: "Fatma Yılmaz",
          normalized_guardian_name: "fatma yilmaz",
          relation_type: null,
          sync_status: "local",
          created_at: timestamp,
          updated_at: timestamp,
          deleted_at: null
        },
        campaign: {
          id: 1,
          uuid: "campaign-1",
          name: "Diğer",
          is_default: true,
          is_active: true,
          sync_status: "local",
          created_at: timestamp,
          updated_at: timestamp,
          deleted_at: null
        },
        pending_reminder: reminder(),
        appointment: null,
        phone_1: primaryPhone,
        phone_2: secondaryPhone,
        phones: [primaryPhone, secondaryPhone],
        call_logs: callLogs,
        duplicate_phone_keys: ["05321234567"]
      }
    ]
  };
}

function cellByHeader(sheet: ReturnType<typeof createDetailedExportSheet>, header: string): string | number {
  const index = sheet.headers.indexOf(header);

  expect(index).toBeGreaterThanOrEqual(0);

  return sheet.rows[0][index];
}

describe("exportMapper", () => {
  it("creates Turkish base headers before dynamic call columns", () => {
    const sheet = createDetailedExportSheet(dataset());

    expect(sheet.headers.slice(0, BASE_EXPORT_HEADERS.length)).toEqual([...BASE_EXPORT_HEADERS]);
  });

  it("adds Telefon 3-10 detailed headers immediately after Telefon 2 Durumu", () => {
    const sheet = createDetailedExportSheet(dataset());
    const telefon1Index = sheet.headers.indexOf("Telefon 1");

    expect(sheet.headers.slice(telefon1Index, telefon1Index + 20)).toEqual([
      "Telefon 1",
      "Telefon 1 Durumu",
      "Telefon 2",
      "Telefon 2 Durumu",
      "Telefon 3",
      "Telefon 3 Durumu",
      "Telefon 4",
      "Telefon 4 Durumu",
      "Telefon 5",
      "Telefon 5 Durumu",
      "Telefon 6",
      "Telefon 6 Durumu",
      "Telefon 7",
      "Telefon 7 Durumu",
      "Telefon 8",
      "Telefon 8 Durumu",
      "Telefon 9",
      "Telefon 9 Durumu",
      "Telefon 10",
      "Telefon 10 Durumu"
    ]);
  });

  it("maps Telefon 3-only and Telefon 7-only records to their explicit detailed export slots", () => {
    const telefon3 = phoneForSlot(3, { phone_number: "05553333333", normalized_phone_number: "05553333333" });
    const telefon3Only = dataset();
    telefon3Only.bundles[0].phone_1 = telefon3;
    telefon3Only.bundles[0].phone_2 = null;
    telefon3Only.bundles[0].phones = [telefon3];

    const telefon3Sheet = createDetailedExportSheet(telefon3Only);

    expect(cellByHeader(telefon3Sheet, "Telefon 1")).toBe("");
    expect(cellByHeader(telefon3Sheet, "Telefon 2")).toBe("");
    expect(cellByHeader(telefon3Sheet, "Telefon 3")).toBe("05553333333");
    expect(cellByHeader(telefon3Sheet, "Telefon 4")).toBe("");

    const telefon7 = phoneForSlot(7, { phone_number: "05557777777", normalized_phone_number: "05557777777" });
    const telefon7Only = dataset();
    telefon7Only.bundles[0].phone_1 = telefon7;
    telefon7Only.bundles[0].phone_2 = null;
    telefon7Only.bundles[0].phones = [telefon7];

    const telefon7Sheet = createDetailedExportSheet(telefon7Only);

    expect(cellByHeader(telefon7Sheet, "Telefon 1")).toBe("");
    expect(cellByHeader(telefon7Sheet, "Telefon 2")).toBe("");
    expect(cellByHeader(telefon7Sheet, "Telefon 3")).toBe("");
    expect(cellByHeader(telefon7Sheet, "Telefon 6")).toBe("");
    expect(cellByHeader(telefon7Sheet, "Telefon 7")).toBe("05557777777");
  });

  it("maps Telefon 10-only records without copying them into Telefon 1 or Telefon 2", () => {
    const telefon10 = phoneForSlot(10, { phone_number: "05551010101", normalized_phone_number: "05551010101" });
    const data = dataset();
    data.bundles[0].phone_1 = null;
    data.bundles[0].phone_2 = telefon10;
    data.bundles[0].phones = [telefon10];

    const sheet = createDetailedExportSheet(data);

    expect(cellByHeader(sheet, "Telefon 1")).toBe("");
    expect(cellByHeader(sheet, "Telefon 2")).toBe("");
    expect(cellByHeader(sheet, "Telefon 10")).toBe("05551010101");
  });

  it("maps Telefon 1-10 records into their detailed export columns", () => {
    const data = dataset();
    const phones = Array.from({ length: 10 }, (_, index) => phoneForSlot(index + 1));
    data.bundles[0].phone_1 = phones[0];
    data.bundles[0].phone_2 = phones[1];
    data.bundles[0].phones = phones;

    const sheet = createDetailedExportSheet(data);

    for (const exportPhone of phones) {
      expect(cellByHeader(sheet, exportPhone.reference_label ?? "")).toBe(exportPhone.phone_number);
    }
  });

  it("exports invalid, wrong and duplicate extra phones with the expected detailed statuses", () => {
    const invalidTelefon3 = phoneForSlot(3, {
      phone_number: "05550000000",
      normalized_phone_number: "05550000000",
      is_valid: false
    });
    const data = dataset();
    data.bundles[0].phone_1 = invalidTelefon3;
    data.bundles[0].phone_2 = null;
    data.bundles[0].phones = [
      invalidTelefon3,
      phoneForSlot(4, {
        phone_number: "05554444444",
        normalized_phone_number: "05554444444",
        is_wrong: true
      }),
      phoneForSlot(5, {
        phone_number: "05550000000",
        normalized_phone_number: "05550000000"
      })
    ];

    const sheet = createDetailedExportSheet(data);

    expect(cellByHeader(sheet, "Telefon 1")).toBe("");
    expect(cellByHeader(sheet, "Telefon 3")).toBe("05550000000");
    expect(cellByHeader(sheet, "Telefon 3 Durumu")).toBe("Geçersiz format");
    expect(cellByHeader(sheet, "Telefon 4")).toBe("05554444444");
    expect(cellByHeader(sheet, "Telefon 4 Durumu")).toBe("Yanlış numara / kullanılmıyor");
    expect(cellByHeader(sheet, "Telefon 5")).toBe("");
    expect(cellByHeader(sheet, "Telefon 5 Durumu")).toBe("");
  });

  it("maps call logs into dynamic chronological Arama columns", () => {
    const sheet = createDetailedExportSheet(
      dataset([
        callLog(1, "2026-05-09T10:00:00", { call_result: "not_reached", note: "İlk not" }),
        callLog(2, "2026-05-10T11:00:00", {
          call_result: "appointment",
          note: "Randevu konuşuldu",
          reminder_at: "2026-05-12T11:00:00"
        })
      ])
    );

    expect(sheet.headers).toContain("Arama 1 Açıklaması");
    expect(sheet.headers).toContain("Arama 2 Tekrar Arama Tarihi");
    expect(sheet.max_call_log_count).toBe(2);
    expect(sheet.rows[0][BASE_EXPORT_HEADERS.length]).toBe("09.05.2026 10:00");
    expect(sheet.rows[0][BASE_EXPORT_HEADERS.length + 1]).toBe("Ulaşılamadı");
    expect(sheet.rows[0][BASE_EXPORT_HEADERS.length + 5]).toBe("10.05.2026 11:00");
    expect(sheet.rows[0][BASE_EXPORT_HEADERS.length + 6]).toBe("Randevu");
  });

  it("translates phone status and call result values", () => {
    expect(getPhoneStatusLabel(phone({ phone_status: "contacted" }))).toBe("Son görüşülen / iletişim kurulan numara");
    expect(getPhoneStatusLabel(phone({ phone_status: "invalid", is_wrong: true }))).toBe("Yanlış numara / kullanılmıyor");
    expect(getPhoneStatusLabel(null)).toBe("Belirtilmedi");
    expect(getCallResultLabel("wrong_number")).toBe("Yanlış numara");
    expect(getCallResultLabel(null)).toBe("Aranmadı");
  });

  it("marks pending reminder and duplicate phone state in base columns", () => {
    const sheet = createDetailedExportSheet(dataset());

    expect(cellByHeader(sheet, "Tekrar Aranacak mı?")).toBe("Evet");
    expect(cellByHeader(sheet, "Tekrar Arama Tarihi")).toBe("12.05.2026");
    expect(cellByHeader(sheet, "Tekrar Arama Saati")).toBe("11:00");
    expect(cellByHeader(sheet, "Mükerrer Telefon Uyarısı")).toBe("Var - aynı telefon farklı adaylarda geçiyor");
  });

  it("uses Hayır when there is no pending reminder", () => {
    const data = dataset();
    data.bundles[0].pending_reminder = null;

    expect(cellByHeader(createDetailedExportSheet(data), "Tekrar Aranacak mı?")).toBe("Hayır");
  });
});
