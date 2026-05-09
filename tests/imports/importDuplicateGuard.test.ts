import { describe, expect, it } from "vitest";
import { AppDatabase } from "../../src/db/db";
import { seedDatabase } from "../../src/db/seed";
import { checkPossibleDuplicateImport, createImportFingerprint } from "../../src/features/imports/services/importDuplicateGuard";
import { simulateImport } from "../../src/features/imports/services/importSimulation";
import type { ParsedWorksheet } from "../../src/features/imports/services/types";

function worksheet(): ParsedWorksheet {
  return {
    file_name: "test.xlsx",
    file_size: 1200,
    file_last_modified: 1710000000000,
    sheet_name: "Worksheet",
    ignored_sheet_names: [],
    raw_rows: [["Ad Soyad"], ["Ayşe Yılmaz"]],
    detected_header_row_number: 1,
    headers: ["Ad Soyad"],
    rows: [["Ayşe Yılmaz"]],
    preview_rows: [["Ayşe Yılmaz"]]
  };
}

describe("checkPossibleDuplicateImport", () => {
  it("warns for the same file, sheet and fingerprint", async () => {
    const database = new AppDatabase(`test-duplicate-guard-${crypto.randomUUID()}`);

    try {
      await database.open();
      await seedDatabase(database);
      const parsedWorksheet = worksheet();
      const summary = simulateImport(parsedWorksheet);
      const fingerprint = createImportFingerprint(parsedWorksheet, summary);

      await database.imports.add({
        uuid: crypto.randomUUID(),
        file_name: parsedWorksheet.file_name,
        sheet_name: parsedWorksheet.sheet_name,
        total_rows: summary.total_rows,
        imported_rows: summary.readable_rows,
        skipped_rows: summary.skipped_rows,
        warning_count: 0,
        error_count: 0,
        started_at: new Date().toISOString(),
        finished_at: new Date().toISOString(),
        header_row_number: parsedWorksheet.detected_header_row_number,
        file_size: parsedWorksheet.file_size,
        file_last_modified: parsedWorksheet.file_last_modified,
        import_fingerprint: fingerprint,
        sync_status: "local",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null
      });

      const result = await checkPossibleDuplicateImport(parsedWorksheet, summary, database);

      expect(result.isPossibleDuplicate).toBe(true);
      expect(result.message).toContain("daha önce içe aktarılmış olabilir");
      expect(result.matched_imports[0]).toMatchObject({
        file_name: "test.xlsx",
        sheet_name: "Worksheet",
        imported_rows: 1,
        total_rows: 1
      });
    } finally {
      database.close();
      await database.delete();
    }
  });
});
