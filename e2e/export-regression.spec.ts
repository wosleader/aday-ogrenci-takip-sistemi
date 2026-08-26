import { readFileSync } from "node:fs";
import { expect, type Page, test } from "@playwright/test";
import * as XLSX from "xlsx";
import { createImportWorkbook } from "./helpers/importFixtures";

const DATABASE_NAME = "aday-ogrenci-takip-db";

async function resetAndOpenImport(page: Page) {
  page.on("dialog", async (dialog) => {
    await dialog.accept();
  });

  await page.goto("/");
  await page.evaluate(async (databaseName: string) => {
    localStorage.clear();
    sessionStorage.clear();

    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase(databaseName);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error ?? new Error("IndexedDB temizlenemedi."));
      request.onblocked = () => resolve();
    });
  }, DATABASE_NAME);
  await page.goto("/import");
}

test("downloads a browser-generated detailed Excel export with readable content", async ({ page }, testInfo) => {
  const { filePath } = createImportWorkbook(testInfo.outputDir, "export-source.xlsx", [
    {
      AD: "Ayşe",
      SOYAD: "Yılmaz",
      Telefon: "0532 111 22 33",
      Mahalle: "Cumhuriyet",
      İlçe: "Osmangazi"
    }
  ]);

  await resetAndOpenImport(page);
  await page.locator('input[type="file"]').setInputFiles(filePath);

  const importSection = page.locator("section.panel").filter({ has: page.getByRole("heading", { name: "İçe Aktarma" }) });
  const importSummary = page.getByLabel(/ön kontrol özeti/i);
  await expect(importSummary.locator(".summary-metric").filter({ hasText: "Okunacak satır" }).locator("strong")).toHaveText("1");
  await importSection.getByRole("button", { name: "İçe Aktar" }).click();
  await expect(page.getByText("İçe Aktarma Tamamlandı")).toBeVisible();

  await page.goto("/export");
  const exportButton = page.getByRole("button", { name: "Detaylı Excel Dışa Aktar" });
  await expect(exportButton).toBeEnabled();

  const downloadPromise = page.waitForEvent("download");
  await exportButton.click();
  const download = await downloadPromise;
  const downloadPath = testInfo.outputPath(download.suggestedFilename());

  await download.saveAs(downloadPath);
  expect(await download.failure()).toBeNull();
  expect(download.suggestedFilename()).toMatch(/^Aday_Ogrenci_Detayli_Export_.*\.xlsx$/);

  const workbook = XLSX.read(readFileSync(downloadPath), { type: "buffer" });
  const rows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets["Detaylı Export"], {
    header: 1,
    defval: "",
    raw: false
  });

  expect(rows[0]).toContain("Öğrenci Ad Soyad");
  expect(rows[1]).toContain("Ayşe Yılmaz");
  expect(rows[1]).toContain("05321112233");
});
