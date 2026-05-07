import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { parseFirstWorksheet, reparseWorksheetWithHeaderRow } from "../../src/features/imports/services/excelReader";

describe("parseFirstWorksheet", () => {
  it("reads only the first worksheet and prepares first 20 rows", async () => {
    const workbook = XLSX.utils.book_new();
    const firstSheet = XLSX.utils.aoa_to_sheet([
      ["Ad Soyad"],
      ...Array.from({ length: 25 }, (_, index) => [`Öğrenci ${index + 1}`])
    ]);
    const secondSheet = XLSX.utils.aoa_to_sheet([["Yok Sayılacak"], ["Veri"]]);

    XLSX.utils.book_append_sheet(workbook, firstSheet, "Worksheet");
    XLSX.utils.book_append_sheet(workbook, secondSheet, "İkinci Sekme");

    const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
    const parsed = await parseFirstWorksheet(buffer, "test.xlsx");

    expect(parsed.sheet_name).toBe("Worksheet");
    expect(parsed.ignored_sheet_names).toEqual(["İkinci Sekme"]);
    expect(parsed.headers).toEqual(["Ad Soyad"]);
    expect(parsed.rows).toHaveLength(25);
    expect(parsed.preview_rows).toHaveLength(20);
  });

  it("detects the real header row within the first 10 rows", async () => {
    const workbook = XLSX.utils.book_new();
    const firstSheet = XLSX.utils.aoa_to_sheet([
      ["ATATÜRK AL-2024 GÜNCEL"],
      [
        "Sınıf",
        "Sınıf",
        "Ad Soyad",
        "Veli Ad Soyad",
        "Telefon",
        "2. Telefon",
        "Ulaşıldı mı",
        "Tekrar arancak mı?",
        "AÇIKLAMA",
        "Tekrar Aranacak Tarih"
      ],
      ["11", "11. Sınıf YKS", "Ayşe Yılmaz", "Veli Yılmaz", "5321234567"]
    ]);

    XLSX.utils.book_append_sheet(workbook, firstSheet, "Worksheet");

    const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
    const parsed = await parseFirstWorksheet(buffer, "test.xlsx");

    expect(parsed.detected_header_row_number).toBe(2);
    expect(parsed.headers[2]).toBe("Ad Soyad");
    expect(parsed.rows).toHaveLength(1);
  });

  it("supports manual header row changes from parsed raw rows", async () => {
    const workbook = XLSX.utils.book_new();
    const firstSheet = XLSX.utils.aoa_to_sheet([
      ["Ad Soyad"],
      ["Ayşe Yılmaz"],
      ["Not a header"]
    ]);

    XLSX.utils.book_append_sheet(workbook, firstSheet, "Worksheet");

    const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
    const parsed = await parseFirstWorksheet(buffer, "test.xlsx");
    const reparsed = reparseWorksheetWithHeaderRow(parsed, 2);

    expect(reparsed.detected_header_row_number).toBe(2);
    expect(reparsed.headers).toEqual(["Ayşe Yılmaz"]);
  });
});
