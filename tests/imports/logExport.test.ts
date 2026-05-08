import { describe, expect, it } from "vitest";
import { matchColumns } from "../../src/features/imports/services/columnMatching";
import { createImportLogText, createTechnicalSupportLog, maskPersonName, maskPhone } from "../../src/features/imports/services/logExport";
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

describe("log export", () => {
  it("masks phone and person names for privacy mode", () => {
    expect(maskPhone("05321234567")).toBe("0532****567");
    expect(maskPersonName("Ahmet Yılmaz")).toBe("A**** Y*****");
  });

  it("creates import log txt with worksheet and simulation summary", () => {
    const parsedWorksheet = worksheet(["Ad Soyad", "Telefon"], [["Ayşe Yılmaz", "5321234567"]]);
    const summary = simulateImport(parsedWorksheet);
    const columnMatches = matchColumns(parsedWorksheet.headers).matches;
    const content = createImportLogText(parsedWorksheet, summary, columnMatches);

    expect(content).toContain("Dosya adı: test.xlsx");
    expect(content).toContain("Okunan worksheet: Worksheet");
    expect(content).toContain("Simülasyon Özeti");
    expect(content).toContain("Kolon Eşleştirme Özeti");
    expect(content).toContain("Import Log Mesajları");
  });

  it("creates privacy protected support logs", () => {
    const parsedWorksheet = worksheet(
      ["Ad Soyad", "Telefon"],
      [
        ["Ayşe Yılmaz", "05321234567"],
        ["Mehmet Kaya", "+90 532 123 45 67"]
      ]
    );
    const summary = simulateImport(parsedWorksheet);
    const columnMatches = matchColumns(parsedWorksheet.headers).matches;
    const content = createTechnicalSupportLog({
      worksheet: parsedWorksheet,
      summary,
      columnMatches,
      activePage: "/import",
      privacyMode: "private"
    });

    expect(content).toContain("Uygulama adı: Aday Öğrenci Takip Sistemi");
    expect(content).toContain("0532****567");
    expect(content).not.toContain("Ayşe Yılmaz");
    expect(content).not.toContain("05321234567");
  });
});
