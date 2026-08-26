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

  it("preserves the app-visible date/time contract for formatted Excel cells", async () => {
    // Excel's 1900-date-system serial for 2026-01-15 plus 04:30 as a day fraction.
    const excelDateTimeSerial = 46037 + (4 * 60 + 30) / (24 * 60);
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([
      ["Ad Soyad", "Görüşme Tarihi", "Puan"],
      ["Ayşe İpek", excelDateTimeSerial, 42]
    ]);
    const dateCell = worksheet.B2;

    if (!dateCell) {
      throw new Error("Date fixture cell could not be created.");
    }

    dateCell.z = "yyyy-mm-dd hh:mm:ss";
    XLSX.utils.book_append_sheet(workbook, worksheet, "Tarih");

    const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx", cellDates: true }) as ArrayBuffer;
    const parsed = await parseFirstWorksheet(buffer, "tarih-saat.xlsx");

    expect(parsed.headers).toEqual(["Ad Soyad", "Görüşme Tarihi", "Puan"]);
    expect(parsed.rows[0]?.[0]).toBe("Ayşe İpek");
    expect(parsed.rows[0]?.[1]).toBe("2026-01-15 04:30:00");
    expect(parsed.rows[0]?.[2]).toBe("42");
  });

  it("parses representative legacy xls content with Turkish text and numbers", async () => {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([
      ["Ad Soyad", "Deneme Puanı"],
      ["Çağrı Şahin", 378]
    ]);

    XLSX.utils.book_append_sheet(workbook, worksheet, "Adaylar");

    const buffer = XLSX.write(workbook, { type: "array", bookType: "xls" }) as ArrayBuffer;
    const parsed = await parseFirstWorksheet(buffer, "legacy-adaylar.xls");

    expect(parsed.sheet_name).toBe("Adaylar");
    expect(parsed.headers).toEqual(["Ad Soyad", "Deneme Puanı"]);
    expect(parsed.rows).toEqual([["Çağrı Şahin", "378"]]);
  });

  it("rejects malformed workbook bytes", async () => {
    const malformed = new Uint8Array([0x50, 0x4b, 0x03, 0x04]);

    await expect(parseFirstWorksheet(malformed.buffer, "bozuk.xlsx")).rejects.toThrow();
  });
});
