import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import {
  createDetailedExportFileName,
  createDetailedExportWorkbook,
  createDetailedExportWorksheetData,
  createSummaryConversationReportFileName,
  createSummaryConversationReportWorkbook,
  createSummaryExportWorksheetData
} from "../../src/features/exports/services/excelExporter";
import type { DetailedExportSheet, SummaryConversationReportSheet } from "../../src/features/exports/services/exportTypes";

function sheet(): DetailedExportSheet {
  return {
    headers: ["Sıra No", "Öğrenci Ad Soyad", "Arama 1 Açıklaması"],
    rows: [[1, "Ayşe Yılmaz", "Veli bilgi istedi."]],
    max_call_log_count: 1,
    total_call_log_count: 1,
    estimated_column_count: 3
  };
}

function summarySheet(): SummaryConversationReportSheet {
  return {
    headers: ["Sıra No", "Öğrenci Ad Soyad", "Açıklama 1"],
    rows: [[1, "Ayşe Yılmaz", "Veli bilgi istedi."]],
    max_note_count: 1,
    total_call_log_count: 1,
    estimated_column_count: 3
  };
}

describe("excelExporter", () => {
  it("creates a filename with date and time", () => {
    expect(createDetailedExportFileName(new Date(2026, 4, 10, 14, 30))).toBe(
      "Aday_Ogrenci_Detayli_Export_2026-05-10_14-30.xlsx"
    );
  });

  it("creates a summary report filename with date and time", () => {
    expect(createSummaryConversationReportFileName(new Date(2026, 4, 10, 14, 30))).toBe(
      "Aday_Ogrenci_Ozet_Gorusme_Raporu_2026-05-10_14-30.xlsx"
    );
  });

  it("creates worksheet data with headers and rows", () => {
    expect(createDetailedExportWorksheetData(sheet())).toEqual([
      ["Sıra No", "Öğrenci Ad Soyad", "Arama 1 Açıklaması"],
      [1, "Ayşe Yılmaz", "Veli bilgi istedi."]
    ]);
  });

  it("creates summary worksheet data with headers and rows", () => {
    expect(createSummaryExportWorksheetData(summarySheet())).toEqual([
      ["Sıra No", "Öğrenci Ad Soyad", "Açıklama 1"],
      [1, "Ayşe Yılmaz", "Veli bilgi istedi."]
    ]);
  });

  it("creates an xlsx workbook with the detailed export sheet", async () => {
    const workbook = await createDetailedExportWorkbook(sheet());

    expect(workbook.SheetNames).toEqual(["Detaylı Export"]);
    expect(workbook.Sheets["Detaylı Export"]).toBeTruthy();
  });

  it("creates an xlsx workbook with the summary report sheet", async () => {
    const workbook = await createSummaryConversationReportWorkbook(summarySheet());

    expect(workbook.SheetNames).toEqual(["Özet Görüşme Raporu"]);
    expect(workbook.Sheets["Özet Görüşme Raporu"]).toBeTruthy();
  });

  it("round-trips detailed export headers, Turkish text, and numeric values", async () => {
    const workbook = await createDetailedExportWorkbook(sheet());
    const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
    const readBack = XLSX.read(buffer, { type: "array" });
    const exportedRows = XLSX.utils.sheet_to_json<unknown[]>(readBack.Sheets["Detaylı Export"], {
      header: 1,
      defval: "",
      raw: false
    });

    expect(exportedRows).toEqual([
      ["Sıra No", "Öğrenci Ad Soyad", "Arama 1 Açıklaması"],
      ["1", "Ayşe Yılmaz", "Veli bilgi istedi."]
    ]);
  });
});
