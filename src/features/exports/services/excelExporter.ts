import type { DetailedExportSheet } from "./exportTypes";

export function createDetailedExportFileName(now: Date = new Date()): string {
  const pad = (value: number) => value.toString().padStart(2, "0");
  const datePart = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const timePart = `${pad(now.getHours())}-${pad(now.getMinutes())}`;

  return `Aday_Ogrenci_Detayli_Export_${datePart}_${timePart}.xlsx`;
}

export function createDetailedExportWorksheetData(sheet: DetailedExportSheet): Array<Array<string | number>> {
  return [sheet.headers, ...sheet.rows];
}

export async function createDetailedExportWorkbook(sheet: DetailedExportSheet) {
  const XLSX = await import("xlsx");
  const worksheet = XLSX.utils.aoa_to_sheet(createDetailedExportWorksheetData(sheet));
  const workbook = XLSX.utils.book_new();

  worksheet["!cols"] = sheet.headers.map((header) => ({
    wch: Math.min(Math.max(header.length + 4, 14), 42)
  }));

  XLSX.utils.book_append_sheet(workbook, worksheet, "Detaylı Export");

  return workbook;
}

export async function downloadDetailedExportWorkbook(
  sheet: DetailedExportSheet,
  fileName = createDetailedExportFileName()
): Promise<string> {
  const XLSX = await import("xlsx");
  const workbook = await createDetailedExportWorkbook(sheet);

  XLSX.writeFile(workbook, fileName);

  return fileName;
}
