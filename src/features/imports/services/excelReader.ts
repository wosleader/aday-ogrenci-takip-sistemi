import type { ParsedWorksheet } from "./types";
import { scoreHeaderRow } from "./columnMatching";

function cellToString(value: unknown): string {
  if (value == null) {
    return "";
  }

  return String(value).trim();
}

export function detectHeaderRow(rawRows: unknown[][], scanLimit = 10) {
  const rowsToScan = rawRows.slice(0, scanLimit);
  let best = {
    header_row_index: 0,
    header_row_number: 1,
    score: -1
  };

  rowsToScan.forEach((row, index) => {
    const score = scoreHeaderRow(row);

    if (score > best.score) {
      best = {
        header_row_index: index,
        header_row_number: index + 1,
        score
      };
    }
  });

  return best;
}

export function createParsedWorksheet(
  fileName: string,
  sheetName: string,
  ignoredSheetNames: string[],
  rawRows: unknown[][],
  headerRowIndex: number,
  fileMetadata: { file_size?: number; file_last_modified?: number } = {}
): ParsedWorksheet {
  const headerRow = rawRows[headerRowIndex] ?? [];
  const rows = rawRows.slice(headerRowIndex + 1);
  const headers = headerRow.map(cellToString);

  return {
    file_name: fileName,
    file_size: fileMetadata.file_size,
    file_last_modified: fileMetadata.file_last_modified,
    sheet_name: sheetName,
    ignored_sheet_names: ignoredSheetNames,
    raw_rows: rawRows,
    detected_header_row_number: headerRowIndex + 1,
    headers,
    rows,
    preview_rows: rows.slice(0, 20)
  };
}

export function reparseWorksheetWithHeaderRow(
  worksheet: ParsedWorksheet,
  headerRowNumber: number
): ParsedWorksheet {
  const headerRowIndex = Math.max(0, headerRowNumber - 1);

  return createParsedWorksheet(
    worksheet.file_name,
    worksheet.sheet_name,
    worksheet.ignored_sheet_names,
    worksheet.raw_rows,
    headerRowIndex,
    {
      file_size: worksheet.file_size,
      file_last_modified: worksheet.file_last_modified
    }
  );
}

export async function parseFirstWorksheet(buffer: ArrayBuffer, fileName: string): Promise<ParsedWorksheet> {
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(buffer, {
    type: "array",
    cellDates: true
  });

  const [firstSheetName, ...ignoredSheetNames] = workbook.SheetNames;

  if (!firstSheetName) {
    throw new Error("Excel dosyasında okunabilir worksheet bulunamadı.");
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
    header: 1,
    defval: "",
    blankrows: false,
    raw: false
  });

  const detectedHeader = detectHeaderRow(rawRows);

  return createParsedWorksheet(
    fileName,
    firstSheetName,
    ignoredSheetNames,
    rawRows,
    detectedHeader.header_row_index
  );
}
