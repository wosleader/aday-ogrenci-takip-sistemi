import { expect, test } from "@playwright/test";
import { createImportSmokeWorkbook } from "./helpers/importFixtures";

const DATABASE_NAME = "aday-ogrenci-takip-db";

test("imports AD/SOYAD, location, guardian, and phone through the browser", async ({ page }, testInfo) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });
  page.on("dialog", async (dialog) => {
    await dialog.accept();
  });

  const { filePath } = createImportSmokeWorkbook(testInfo.outputDir);

  await page.goto("/");
  await page.evaluate(async (databaseName) => {
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

  await page.locator('input[type="file"]').setInputFiles(filePath);

  const guardianMappingRow = page.locator("tbody tr").filter({ hasText: "Veli Adı" });
  await guardianMappingRow.locator("select").selectOption("guardian_full_name");
  await page.getByRole("button", { name: "Eşleştirmeyi Güncelle ve Tekrar Simüle Et" }).click();

  const summary = page.getByLabel(/ön kontrol özeti/i);
  await expect(summary.locator(".summary-metric").filter({ hasText: "Toplam satır" }).locator("strong")).toHaveText("1");
  await expect(summary.locator(".summary-metric").filter({ hasText: "Okunacak satır" }).locator("strong")).toHaveText("1");
  await expect(
    summary.locator(".summary-metric").filter({ hasText: "İçe aktarılmayacak satır" }).locator("strong")
  ).toHaveText("0");
  await expect(page.getByText("Ayşe Yılmaz")).toBeVisible();

  const importSection = page.locator("section.panel").filter({ has: page.getByRole("heading", { name: "İçe Aktarma" }) });
  await importSection.getByRole("button", { name: "İçe Aktar" }).click();

  await expect(page.getByText("İçe Aktarma Tamamlandı")).toBeVisible();
  await page.getByRole("button", { name: "Aday Listesine Git" }).click();

  const studentTable = page.locator(".student-table");
  const importedStudentRow = studentTable.getByRole("row", { name: /Ayşe Yılmaz/ });
  await expect(importedStudentRow).toBeVisible();
  await importedStudentRow.click();

  const drawer = page.locator(".student-drawer");
  await expect(drawer).toContainText("Ayşe Yılmaz");
  await expect(drawer).toContainText("Fatma Yılmaz");
  await expect(drawer).toContainText("Mahalle / İlçe: Cumhuriyet / Osmangazi");
  await expect(drawer).toContainText("05321112233");
  await expect(drawer).toContainText("Playwright smoke test");

  expect(pageErrors, "Beklenmeyen runtime hatası olmamalı.").toEqual([]);
  expect(consoleErrors, "Beklenmeyen console.error olmamalı.").toEqual([]);
});
