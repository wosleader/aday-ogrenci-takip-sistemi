import path from "node:path";
import { mkdirSync } from "node:fs";
import { utils, writeFile } from "xlsx";

export type ImportWorkbookPaths = {
  filePath: string;
};

export function createImportWorkbook(
  outputDir: string,
  fileName: string,
  rows: Array<Record<string, string>>
): ImportWorkbookPaths {
  const worksheet = utils.json_to_sheet(rows);
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, "Adaylar");

  mkdirSync(outputDir, { recursive: true });
  const filePath = path.join(outputDir, fileName);
  writeFile(workbook, filePath, { bookType: "xlsx" });

  return { filePath };
}

export function createImportSmokeWorkbook(outputDir: string): ImportWorkbookPaths {
  return createImportWorkbook(outputDir, "import-smoke.xlsx", [
    {
      AD: "Ayşe",
      SOYAD: "Yılmaz",
      Mahalle: "Cumhuriyet",
      İlçe: "Osmangazi",
      Telefon: "0532 111 22 33",
      "Veli Adı": "Fatma Yılmaz",
      Açıklama: "Playwright smoke test"
    }
  ]);
}
