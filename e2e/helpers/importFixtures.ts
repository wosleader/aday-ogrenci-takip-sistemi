import path from "node:path";
import { mkdirSync } from "node:fs";
import { utils, writeFile } from "xlsx";

export type ImportSmokeWorkbookPaths = {
  filePath: string;
};

export function createImportSmokeWorkbook(outputDir: string): ImportSmokeWorkbookPaths {
  const rows = [
    {
      AD: "Ayşe",
      SOYAD: "Yılmaz",
      Mahalle: "Cumhuriyet",
      "İlçe": "Osmangazi",
      Telefon: "0532 111 22 33",
      "Veli Adı": "Fatma Yılmaz",
      "Açıklama": "Playwright smoke test"
    }
  ];
  const worksheet = utils.json_to_sheet(rows);
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, "Adaylar");

  mkdirSync(outputDir, { recursive: true });
  const filePath = path.join(outputDir, "import-smoke.xlsx");
  writeFile(workbook, filePath, { bookType: "xlsx" });

  return { filePath };
}
