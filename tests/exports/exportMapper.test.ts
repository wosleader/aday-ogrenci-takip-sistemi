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
        duplicate_phone_keys: ["05321234567"]
      }
    ]
  };
}

describe("exportMapper", () => {
  it("creates Turkish base headers before dynamic call columns", () => {
    const sheet = createDetailedExportSheet(dataset());

    expect(sheet.headers.slice(0, BASE_EXPORT_HEADERS.length)).toEqual([...BASE_EXPORT_HEADERS]);
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
    const row = sheet.rows[0];

    expect(row[15]).toBe("Evet");
    expect(row[16]).toBe("12.05.2026");
    expect(row[17]).toBe("11:00");
    expect(row[21]).toBe("Var - aynı telefon farklı adaylarda geçiyor");
  });

  it("uses Hayır when there is no pending reminder", () => {
    const data = dataset();
    data.bundles[0].pending_reminder = null;

    expect(createDetailedExportSheet(data).rows[0][15]).toBe("Hayır");
  });
});
