import { expect, type Page, test } from "@playwright/test";
import { createImportWorkbook } from "./helpers/importFixtures";

const DATABASE_NAME = "aday-ogrenci-takip-db";

type RuntimeErrorGuard = {
  assertNoErrors: () => void;
};

function guardRuntimeErrors(page: Page): RuntimeErrorGuard {
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

  return {
    assertNoErrors() {
      expect(pageErrors, "Beklenmeyen runtime hatası olmamalı.").toEqual([]);
      expect(consoleErrors, "Beklenmeyen console.error olmamalı.").toEqual([]);
    }
  };
}

async function resetAndOpenImport(page: Page) {
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
}

async function expectImportSummary(page: Page, readableRows: string, skippedRows: string) {
  const summary = page.getByLabel(/ön kontrol özeti/i);
  await expect(summary.locator(".summary-metric").filter({ hasText: "Toplam satır" }).locator("strong")).toHaveText("1");
  await expect(summary.locator(".summary-metric").filter({ hasText: "Okunacak satır" }).locator("strong")).toHaveText(
    readableRows
  );
  await expect(
    summary.locator(".summary-metric").filter({ hasText: "İçe aktarılmayacak satır" }).locator("strong")
  ).toHaveText(skippedRows);
}

async function importWorkbookAndOpenStudent(page: Page, filePath: string, studentName: string) {
  await page.locator('input[type="file"]').setInputFiles(filePath);
  await expectImportSummary(page, "1", "0");

  const importSection = page.locator("section.panel").filter({ has: page.getByRole("heading", { name: "İçe Aktarma" }) });
  await importSection.getByRole("button", { name: "İçe Aktar" }).click();
  await expect(page.getByText("İçe Aktarma Tamamlandı")).toBeVisible();
  await page.getByRole("button", { name: "Aday Listesine Git" }).click();

  const studentRow = page.locator(".student-table").getByRole("row", { name: new RegExp(studentName) });
  await expect(studentRow).toBeVisible();
  await studentRow.click();

  const drawer = page.locator(".student-drawer");
  await expect(drawer).toContainText(studentName);
  return drawer;
}

test.describe("import regression matrix", () => {
  test("keeps Telefon 1-10 values through browser import", async ({ page }, testInfo) => {
    const runtimeErrors = guardRuntimeErrors(page);
    const row: Record<string, string> = {
      AD: "Telefon",
      SOYAD: "Onlu",
      Telefon: "0532 100 00 01",
      "2. Telefon": "0532 100 00 02"
    };

    for (let slot = 3; slot <= 10; slot += 1) {
      row[`Telefon ${slot}`] = `0532 100 00 ${String(slot).padStart(2, "0")}`;
    }

    const { filePath } = createImportWorkbook(testInfo.outputDir, "telefon-1-10.xlsx", [row]);

    await resetAndOpenImport(page);
    const drawer = await importWorkbookAndOpenStudent(page, filePath, "Telefon Onlu");

    const expandButton = drawer.getByRole("button", { name: /numara daha göster/i });
    await expect(expandButton).toBeVisible();
    await expandButton.click();

    for (let slot = 1; slot <= 10; slot += 1) {
      await expect(drawer).toContainText(`053210000${String(slot).padStart(2, "0")}`);
    }

    runtimeErrors.assertNoErrors();
  });

  test("imports empty Mahalle and İlçe without rendering an empty location line", async ({ page }, testInfo) => {
    const runtimeErrors = guardRuntimeErrors(page);
    const { filePath } = createImportWorkbook(testInfo.outputDir, "empty-location.xlsx", [
      {
        AD: "Bos",
        SOYAD: "Konum",
        Telefon: "0532 200 00 01",
        Mahalle: "",
        İlçe: ""
      }
    ]);

    await resetAndOpenImport(page);
    const drawer = await importWorkbookAndOpenStudent(page, filePath, "Bos Konum");

    await expect(drawer).toContainText("05322000001");
    await expect(drawer.getByText(/Mahalle \/ İlçe:/)).toHaveCount(0);

    runtimeErrors.assertNoErrors();
  });

  test("does not use Anne or Baba fields as the student name", async ({ page }, testInfo) => {
    const runtimeErrors = guardRuntimeErrors(page);
    const { filePath } = createImportWorkbook(testInfo.outputDir, "parent-name-safety.xlsx", [
      {
        "Anne adı": "Anne Güvenlik",
        "Baba adı": "Baba Güvenlik",
        Mahalle: "Test Mahalle",
        İlçe: "Test İlçe",
        Telefon: "0532 300 00 01"
      }
    ]);

    await resetAndOpenImport(page);
    await page.locator('input[type="file"]').setInputFiles(filePath);

    await expectImportSummary(page, "0", "1");
    await expect(page.getByText(/Ad Soyad alanı boş/).first()).toBeVisible();

    const importSection = page.locator("section.panel").filter({ has: page.getByRole("heading", { name: "İçe Aktarma" }) });
    await expect(importSection.getByRole("button", { name: "İçe Aktar" })).toBeDisabled();

    runtimeErrors.assertNoErrors();
  });
});
