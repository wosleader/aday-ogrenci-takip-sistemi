import { describe, expect, it } from "vitest";
import type { CallLogRecord } from "../../src/domain/models/callLog";
import type { PhoneRecord } from "../../src/domain/models/phone";
import type { StudentRecord } from "../../src/domain/models/student";
import {
  createSummaryCanonicalRows,
  createSummaryColumnPlan,
  createSummaryConversationReportSheet,
  getSummaryCallResultLabel,
  getSummaryPhoneStatusLabel,
  SUMMARY_EXPORT_BASE_HEADERS,
  SUMMARY_EXPORT_TRAILING_HEADERS,
  validateSummaryColumnPlan
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
    general_note: "Excel genel açıklaması",
    sync_status: "local",
    created_at: timestamp,
    updated_at: "2026-05-11T13:15:00",
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
    uuid: `phone-${slot}`,
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

function dataset(callLogs: Array<CallLogRecord & { id: number }>): ExportDataset {
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
        pending_reminder: null,
        appointment: null,
        phone_1: phone({ phone_status: "contacted" }),
        phone_2: phone({
          id: 2,
          phone_number: "05431234567",
          normalized_phone_number: "05431234567",
          phone_label: "2. Telefon",
          phone_status: "invalid",
          is_wrong: true,
          is_primary: false
        }),
        call_logs: callLogs,
        duplicate_phone_keys: []
      }
    ]
  };
}

function cellByHeader(sheet: ReturnType<typeof createSummaryConversationReportSheet>, header: string): string | number {
  const index = sheet.headers.indexOf(header);

  expect(index).toBeGreaterThanOrEqual(0);

  return sheet.rows[0][index];
}

describe("summaryExportMapper", () => {
  it("creates summary report columns in the expected order without campaign or reminder date", () => {
    const sheet = createSummaryConversationReportSheet(
      dataset([
        callLog(1, "2026-05-09T10:00:00", { note: "İlk görüşme notu" }),
        callLog(2, "2026-05-10T11:00:00", { note: "İkinci görüşme notu" })
      ])
    );

    expect(sheet.headers).toEqual([
      ...SUMMARY_EXPORT_BASE_HEADERS,
      "Açıklama 1",
      "Açıklama 1 Tarihi",
      "Açıklama 2",
      "Açıklama 2 Tarihi",
      ...SUMMARY_EXPORT_TRAILING_HEADERS
    ]);
    expect(sheet.headers).not.toContain("Kampanya");
    expect(sheet.headers).not.toContain("Tekrar Arama Tarihi");
    expect(cellByHeader(sheet, "Telefon 1")).toBe("05321234567");
    expect(cellByHeader(sheet, "Telefon 1 Durumu")).toBe("Son görüşülen numara");
    expect(cellByHeader(sheet, "Telefon 2")).toBe("05431234567");
    expect(cellByHeader(sheet, "Telefon 2 Durumu")).toBe("Yanlış numara / kullanılmıyor");
  });

  it("keeps Telefon 1/2 and expands through the highest slot without compressing Telefon 7", () => {
    const data = dataset([]);
    const telefon7 = phoneForSlot(7, {
      phone_number: "05557777777",
      normalized_phone_number: "05557777777",
      relation_label: "Anne",
      guardian_id: 7
    });
    data.bundles[0].phone_1 = telefon7;
    data.bundles[0].phone_2 = null;
    data.bundles[0].phones = [telefon7];

    const sheet = createSummaryConversationReportSheet(data);

    for (let slot = 1; slot <= 7; slot += 1) {
      expect(sheet.headers).toContain(`Telefon ${slot}`);
      expect(sheet.headers).toContain(`Telefon ${slot} Durumu`);
    }
    expect(cellByHeader(sheet, "Telefon 1")).toBe("");
    expect(cellByHeader(sheet, "Telefon 1 Durumu")).toBe("");
    expect(cellByHeader(sheet, "Telefon 6")).toBe("");
    expect(cellByHeader(sheet, "Telefon 7")).toBe("05557777777");
    expect(sheet.headers).not.toContain("Telefon 8");
    expect(sheet.headers).not.toContain("Anne Telefonu");
  });

  it("expands through Telefon 10 without exceeding the supported slot range", () => {
    const data = dataset([]);
    const telefon10 = phoneForSlot(10, {
      phone_number: "05551010101",
      normalized_phone_number: "05551010101"
    });
    data.bundles[0].phone_1 = null;
    data.bundles[0].phone_2 = telefon10;
    data.bundles[0].phones = [telefon10];

    const sheet = createSummaryConversationReportSheet(data);

    expect(cellByHeader(sheet, "Telefon 1")).toBe("");
    expect(cellByHeader(sheet, "Telefon 2")).toBe("");
    expect(cellByHeader(sheet, "Telefon 10")).toBe("05551010101");
    expect(sheet.headers).not.toContain("Telefon 11");
    for (let slot = 1; slot <= 10; slot += 1) {
      expect(sheet.headers).toContain(`Telefon ${slot}`);
      expect(sheet.headers).toContain(`Telefon ${slot} Durumu`);
    }
  });

  it("adds adaptive guardian and location columns only when the dataset contains values", () => {
    const emptySheet = createSummaryConversationReportSheet(dataset([]));

    expect(emptySheet.headers).not.toContain("Anne Adı");
    expect(emptySheet.headers).not.toContain("Baba Adı");
    expect(emptySheet.headers).not.toContain("Mahalle");
    expect(emptySheet.headers).not.toContain("İlçe");

    const data = dataset([]);
    data.bundles[0].mother = {
      id: 2,
      uuid: "mother-1",
      student_id: 1,
      guardian_full_name: "Emine Yılmaz",
      normalized_guardian_name: "emine yilmaz",
      relation_type: "mother",
      sync_status: "local",
      created_at: timestamp,
      updated_at: timestamp,
      deleted_at: null
    };
    data.bundles[0].father = {
      id: 3,
      uuid: "father-1",
      student_id: 1,
      guardian_full_name: "Ahmet Yılmaz",
      normalized_guardian_name: "ahmet yilmaz",
      relation_type: "father",
      sync_status: "local",
      created_at: timestamp,
      updated_at: timestamp,
      deleted_at: null
    };
    data.bundles[0].student.neighborhood = "Cumhuriyet";
    data.bundles[0].student.district = "Osmangazi";

    const sheet = createSummaryConversationReportSheet(data);
    const guardianIndex = sheet.headers.indexOf("Veli Ad Soyad");

    expect(sheet.headers.slice(guardianIndex, guardianIndex + 9)).toEqual([
      "Veli Ad Soyad",
      "Anne Adı",
      "Baba Adı",
      "Mahalle",
      "İlçe",
      "Telefon 1",
      "Telefon 1 Durumu",
      "Telefon 2",
      "Telefon 2 Durumu"
    ]);
    expect(cellByHeader(sheet, "Anne Adı")).toBe("Emine Yılmaz");
    expect(cellByHeader(sheet, "Baba Adı")).toBe("Ahmet Yılmaz");
    expect(cellByHeader(sheet, "Mahalle")).toBe("Cumhuriyet");
    expect(cellByHeader(sheet, "İlçe")).toBe("Osmangazi");
  });

  it("plans each adaptive guardian and location field independently", () => {
    const data = dataset([]);
    data.bundles[0].father = {
      id: 3,
      uuid: "father-1",
      student_id: 1,
      guardian_full_name: "Ahmet Yılmaz",
      normalized_guardian_name: "ahmet yilmaz",
      relation_type: "father",
      sync_status: "local",
      created_at: timestamp,
      updated_at: timestamp,
      deleted_at: null
    };
    data.bundles[0].student.district = "Osmangazi";

    const plan = createSummaryColumnPlan(createSummaryCanonicalRows(data));
    const sheet = createSummaryConversationReportSheet(data);

    expect(plan).toMatchObject({
      includeMother: false,
      includeFather: true,
      includeNeighborhood: false,
      includeDistrict: true,
      maxPhoneSlot: 2
    });
    expect(sheet.headers).not.toContain("Anne Adı");
    expect(sheet.headers).toContain("Baba Adı");
    expect(sheet.headers).not.toContain("Mahalle");
    expect(sheet.headers).toContain("İlçe");
  });

  it("exports invalid phones with a status while leaving empty slot statuses blank", () => {
    const data = dataset([]);
    const invalidTelefon3 = phoneForSlot(3, {
      phone_number: "12345",
      normalized_phone_number: "12345",
      is_valid: false
    });
    data.bundles[0].phone_1 = invalidTelefon3;
    data.bundles[0].phone_2 = null;
    data.bundles[0].phones = [invalidTelefon3];

    const sheet = createSummaryConversationReportSheet(data);

    expect(cellByHeader(sheet, "Telefon 1")).toBe("");
    expect(cellByHeader(sheet, "Telefon 1 Durumu")).toBe("");
    expect(cellByHeader(sheet, "Telefon 3")).toBe("12345");
    expect(cellByHeader(sheet, "Telefon 3 Durumu")).toBe("Geçersiz format");
  });

  it("fails fast when a supplied summary plan would omit populated data", () => {
    const data = dataset([]);
    data.bundles[0].mother = {
      id: 2,
      uuid: "mother-1",
      student_id: 1,
      guardian_full_name: "Emine Yılmaz",
      normalized_guardian_name: "emine yilmaz",
      relation_type: "mother",
      sync_status: "local",
      created_at: timestamp,
      updated_at: timestamp,
      deleted_at: null
    };
    data.bundles[0].phones = [phoneForSlot(7)];
    const rows = createSummaryCanonicalRows(data);

    expect(() =>
      validateSummaryColumnPlan(rows, {
        includeMother: false,
        includeFather: false,
        includeNeighborhood: false,
        includeDistrict: false,
        maxPhoneSlot: 7
      })
    ).toThrow("Anne Adı");
    expect(() =>
      validateSummaryColumnPlan(rows, {
        includeMother: true,
        includeFather: false,
        includeNeighborhood: false,
        includeDistrict: false,
        maxPhoneSlot: 2
      })
    ).toThrow("Telefon 7");
  });

  it("maps only filled call notes into chronological explanation columns", () => {
    const sheet = createSummaryConversationReportSheet(
      dataset([
        callLog(3, "2026-05-11T12:00:00", { call_result: "appointment", note: "" }),
        callLog(1, "2026-05-09T10:00:00", { call_result: "not_reached", note: "İlk not" }),
        callLog(2, "2026-05-10T11:00:00", { call_result: "reached", note: "  İkinci not  " })
      ])
    );
    const row = sheet.rows[0];

    expect(sheet.max_note_count).toBe(2);
    expect(row[8]).toBe("Excel genel açıklaması");
    expect(row[9]).toBe("İlk not");
    expect(row[10]).toBe("09.05.2026 10:00");
    expect(row[11]).toBe("İkinci not");
    expect(row[12]).toBe("10.05.2026 11:00");
    expect(row[13]).toBe("Randevu");
    expect(row[14]).toBe("11.05.2026 12:00");
    expect(sheet.rows.every((exportRow) => exportRow.length === sheet.headers.length)).toBe(true);
  });

  it("calculates the last updated date with the expected priority", () => {
    const withStudentUpdatedAt = createSummaryConversationReportSheet(dataset([callLog(1, "2026-05-10T11:00:00")]));

    expect(withStudentUpdatedAt.rows[0][withStudentUpdatedAt.rows[0].length - 1]).toBe("11.05.2026 13:15");

    const withoutUpdatedAt = dataset([callLog(1, "2026-05-10T11:00:00")]);
    withoutUpdatedAt.bundles[0].student.updated_at = "";

    const withoutUpdatedAtRow = createSummaryConversationReportSheet(withoutUpdatedAt).rows[0];
    expect(withoutUpdatedAtRow[withoutUpdatedAtRow.length - 1]).toBe("10.05.2026 11:00");

    const withoutCallLog = dataset([]);
    withoutCallLog.bundles[0].student.updated_at = "";

    const withoutCallLogRow = createSummaryConversationReportSheet(withoutCallLog).rows[0];
    expect(withoutCallLogRow[withoutCallLogRow.length - 1]).toBe("08.05.2026 09:00");
  });

  it("translates summary phone status and call result values", () => {
    expect(getSummaryPhoneStatusLabel(phone({ phone_status: "active" }))).toBe("Aktif");
    expect(getSummaryPhoneStatusLabel(phone({ phone_status: "contacted" }))).toBe("Son görüşülen numara");
    expect(getSummaryPhoneStatusLabel(phone({ phone_status: "invalid", is_wrong: true }))).toBe(
      "Yanlış numara / kullanılmıyor"
    );
    expect(getSummaryPhoneStatusLabel(phone({ is_valid: false }))).toBe("Geçersiz format");
    expect(getSummaryPhoneStatusLabel(null)).toBe("");
    expect(getSummaryCallResultLabel("do_not_call")).toBe("Aranmayacak / ilgilenmiyor");
    expect(getSummaryCallResultLabel("wrong_number")).toBe("Yanlış numara");
    expect(getSummaryCallResultLabel(null)).toBe("Aranmadı");
  });
});
