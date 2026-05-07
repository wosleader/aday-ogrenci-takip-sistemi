import { describe, expect, it } from "vitest";
import { simulateImport } from "../../src/features/imports/services/importSimulation";
import type { ParsedWorksheet } from "../../src/features/imports/services/types";

function worksheet(headers: string[], rows: unknown[][]): ParsedWorksheet {
  return {
    file_name: "test.xlsx",
    sheet_name: "Worksheet",
    ignored_sheet_names: [],
    raw_rows: [headers, ...rows],
    detected_header_row_number: 1,
    headers,
    rows,
    preview_rows: rows.slice(0, 20)
  };
}

describe("simulateImport", () => {
  it("assigns default campaign when campaign column is missing", () => {
    const summary = simulateImport(
      worksheet(["Ad Soyad", "Telefon"], [["Ayşe Yılmaz", "5321234567"]])
    );

    expect(summary.default_campaign_assigned_count).toBe(1);
    expect(summary.preview_rows[0].campaign_name).toBe("Diğer");
    expect(summary.logs.some((log) => log.message.includes("Kampanya Tanımı kolonu bulunamadı"))).toBe(
      true
    );
  });

  it("simulates reminder default time assignment without writing records", () => {
    const summary = simulateImport(
      worksheet(
        ["Ad Soyad", "Telefon", "Tekrar arancak mı?", "Tekrar Aranacak Tarih"],
        [["Ayşe Yılmaz", "5321234567", "Evet", "2026-05-12"]]
      )
    );

    expect(summary.default_time_assigned_count).toBe(1);
    expect(summary.preview_rows[0].reminder_at).toBe("2026-05-12T11:00:00");
    expect(summary.auto_matched_columns[0].target_field).toBe("should_call_again");
  });

  it("does not warn when phone 1 and phone 2 are same in the same row", () => {
    const summary = simulateImport(
      worksheet(
        ["Ad Soyad", "Telefon", "2. Telefon"],
        [["Ayşe Yılmaz", "05321234567", "5321234567"]]
      )
    );

    expect(summary.duplicate_phone_warnings).toHaveLength(0);
  });

  it("warns when the same phone belongs to different students in different rows", () => {
    const summary = simulateImport(
      worksheet(
        ["Ad Soyad", "Telefon"],
        [
          ["Ayşe Yılmaz", "05321234567"],
          ["Mehmet Kaya", "+90 532 123 45 67"]
        ]
      )
    );

    expect(summary.duplicate_phone_warnings).toHaveLength(1);
    expect(summary.duplicate_phone_warnings[0].phone_number).toBe("05321234567");
    expect(summary.duplicate_phone_warnings[0].row_numbers).toEqual([2, 3]);
  });

  it("groups missing required fields and keeps row details separate", () => {
    const summary = simulateImport(
      worksheet(["Ad Soyad", "Telefon"], [["", "05321234567"], ["", "05327654321"]])
    );

    expect(summary.skipped_rows).toBe(2);
    expect(summary.readable_rows).toBe(0);
    expect(summary.missing_required_fields[0].field).toBe("student_full_name");
    expect(summary.logs.some((log) => log.message === "2 satır zorunlu alan eksik olduğu için atlandı.")).toBe(
      true
    );
    expect(summary.detailed_logs).toHaveLength(2);
  });

  it("allows manual column mappings during simulation", () => {
    const summary = simulateImport(worksheet(["İsim"], [["Ayşe Yılmaz"]]), {
      manualMappings: { 0: "student_full_name" }
    });

    expect(summary.readable_rows).toBe(1);
    expect(summary.preview_rows[0].student_full_name).toBe("Ayşe Yılmaz");
  });
});
