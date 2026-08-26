import { describe, expect, it, vi } from "vitest";

vi.mock("xlsx", () => ({
  read: vi.fn(() => ({ SheetNames: [], Sheets: {} })),
  utils: {
    sheet_to_json: vi.fn()
  }
}));

import { parseFirstWorksheet } from "../../src/features/imports/services/excelReader";

describe("parseFirstWorksheet empty workbook contract", () => {
  it("uses the application-level error when no usable worksheet is available", async () => {
    await expect(parseFirstWorksheet(new ArrayBuffer(0), "bos.xlsx")).rejects.toThrow(
      "Excel dosyasında okunabilir worksheet bulunamadı."
    );
  });
});
