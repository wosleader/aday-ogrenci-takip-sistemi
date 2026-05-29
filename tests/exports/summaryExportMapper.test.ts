import { describe, expect, it } from "vitest";
import type { CallLogRecord } from "../../src/domain/models/callLog";
import type { PhoneRecord } from "../../src/domain/models/phone";
import type { StudentRecord } from "../../src/domain/models/student";
import {
  createSummaryConversationReportSheet,
  getSummaryCallResultLabel,
  getSummaryPhoneStatusLabel,
  SUMMARY_EXPORT_BASE_HEADERS,
  SUMMARY_EXPORT_TRAILING_HEADERS
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
  });

  it("does not add Telefon 3-10 columns to the summary report", () => {
    const data = dataset([]);
    data.bundles[0].phones = [
      phone({ reference_label: "Telefon 1", priority: 1 }),
      phone({
        id: 3,
        phone_number: "05553333333",
        normalized_phone_number: "05553333333",
        phone_label: "Telefon 3",
        reference_label: "Telefon 3",
        priority: 3,
        is_primary: false
      })
    ];

    const sheet = createSummaryConversationReportSheet(data);

    expect(sheet.headers).toEqual([...SUMMARY_EXPORT_BASE_HEADERS, ...SUMMARY_EXPORT_TRAILING_HEADERS]);
    expect(sheet.headers).not.toContain("Telefon 3");
    expect(sheet.headers).not.toContain("Telefon 3 Durumu");
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
    expect(getSummaryPhoneStatusLabel(null)).toBe("Belirtilmedi");
    expect(getSummaryCallResultLabel("do_not_call")).toBe("Aranmayacak / ilgilenmiyor");
    expect(getSummaryCallResultLabel("wrong_number")).toBe("Yanlış numara");
    expect(getSummaryCallResultLabel(null)).toBe("Aranmadı");
  });
});
