import { expect, type Page, test } from "@playwright/test";

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

  return {
    assertNoErrors() {
      expect(pageErrors, "Beklenmeyen runtime hatası olmamalı.").toEqual([]);
      expect(consoleErrors, "Beklenmeyen console.error olmamalı.").toEqual([]);
    }
  };
}

async function clearBrowserStorage(page: Page) {
  await page.goto("/manifest.webmanifest");
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
}

async function openStudentFromList(page: Page, studentName: string) {
  const studentTable = page.locator(".student-table");
  const studentRow = studentTable.getByRole("row", { name: new RegExp(studentName) });
  await expect(studentRow).toBeVisible();
  await studentRow.click({ force: true });

  const drawer = page.locator(".student-drawer");
  await expect(drawer).toContainText(studentName);
  return drawer;
}

async function expectExpandedPhoneCardCount(drawer: ReturnType<Page["locator"]>, expectedCount: number) {
  const expandButton = drawer.getByRole("button", { name: /numara daha göster/i });

  if (await expandButton.isVisible()) {
    await expandButton.click();
  }

  await expect(drawer.locator(".drawer-phone-card")).toHaveCount(expectedCount);
}

test("pilot seed renders rich phone cards in the browser UI", async ({ page }) => {
  const runtimeErrors = guardRuntimeErrors(page);

  await clearBrowserStorage(page);
  await page.goto("/");

  await expect(page).toHaveURL(/\/students$/);
  await expect(page.getByRole("heading", { name: "Aday Listesi" })).toBeVisible();
  await expect(page.locator(".count-badge")).toHaveText("70 aday");

  const tenPhoneDrawer = await openStudentFromList(page, "Ada Yılmaz");
  await expect(tenPhoneDrawer.locator(".drawer-phone-card")).toHaveCount(3);
  await expectExpandedPhoneCardCount(tenPhoneDrawer, 10);
  await expect(tenPhoneDrawer).toContainText("Anne telefonu");
  await expect(tenPhoneDrawer).toContainText("Baba telefonu");
  await expect(tenPhoneDrawer).toContainText("Telefon 10");
  await expect(tenPhoneDrawer).toContainText("0500 000 10 10");

  const eightPhoneDrawer = await openStudentFromList(page, "Eylül Taş");
  await expectExpandedPhoneCardCount(eightPhoneDrawer, 8);
  await expect(eightPhoneDrawer).toContainText("Telefon 8");
  await expect(eightPhoneDrawer).toContainText("Anne telefonu");
  await expect(eightPhoneDrawer).toContainText("Baba telefonu");

  await page.getByRole("link", { name: "Hatırlatmalar" }).click();
  await expect(page.getByRole("heading", { name: "Hatırlatmalar" })).toBeVisible();
  await expect(page.locator(".reminder-table tbody tr").first()).toBeVisible();

  await page.getByRole("link", { name: "Raporlar" }).click();
  await expect(page.getByRole("heading", { name: "Raporlar" })).toBeVisible();
  await page.getByLabel("Rapor tarihi").fill("2026-06-20");
  await expect(page.locator(".daily-call-table tbody tr").first()).toBeVisible();

  runtimeErrors.assertNoErrors();
});
