import { describe, expect, it } from "vitest";
import {
  createDetailedExportFileName,
  createDetailedExportWorkbook,
  createDetailedExportWorksheetData
} from "../../src/features/exports/services/excelExporter";
import type { DetailedExportSheet } from "../../src/features/exports/services/exportTypes";

function sheet(): DetailedExportSheet {
  return {
    headers: ["Sıra No", "Öğrenci Ad Soyad", "Arama 1 Açıklaması"],
    rows: [[1, "Ayşe Yılmaz", "Veli bilgi istedi."]],
    max_call_log_count: 1,
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

  it("creates worksheet data with headers and rows", () => {
    expect(createDetailedExportWorksheetData(sheet())).toEqual([
      ["Sıra No", "Öğrenci Ad Soyad", "Arama 1 Açıklaması"],
      [1, "Ayşe Yılmaz", "Veli bilgi istedi."]
    ]);
  });

  it("creates an xlsx workbook with the detailed export sheet", async () => {
    const workbook = await createDetailedExportWorkbook(sheet());

    expect(workbook.SheetNames).toEqual(["Detaylı Export"]);
    expect(workbook.Sheets["Detaylı Export"]).toBeTruthy();
  });
});
