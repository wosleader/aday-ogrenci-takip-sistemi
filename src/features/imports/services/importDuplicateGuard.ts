import type { AppDatabase } from "../../../db/db";
import { db } from "../../../db/db";
import type { ImportSimulationSummary, ParsedWorksheet } from "./types";

export type DuplicateImportMatch = {
  import_id: number;
  file_name: string;
  sheet_name: string;
  imported_rows: number;
  total_rows: number;
  started_at: string;
  finished_at?: string | null;
};

export type DuplicateImportWarning = {
  isPossibleDuplicate: boolean;
  message?: string;
  matched_import_ids: number[];
  matched_imports: DuplicateImportMatch[];
  import_fingerprint: string;
};

export function createImportFingerprint(
  worksheet: ParsedWorksheet,
  summary: ImportSimulationSummary
): string {
  return [
    worksheet.file_name,
    worksheet.sheet_name,
    summary.total_rows,
    worksheet.detected_header_row_number,
    worksheet.file_size ?? "",
    worksheet.file_last_modified ?? ""
  ].join("|");
}

export async function checkPossibleDuplicateImport(
  worksheet: ParsedWorksheet,
  summary: ImportSimulationSummary,
  database: AppDatabase = db
): Promise<DuplicateImportWarning> {
  const importFingerprint = createImportFingerprint(worksheet, summary);
  const imports = await database.imports.toArray();
  const matches = imports.filter((importRecord) => {
    if (importRecord.import_fingerprint && importRecord.import_fingerprint === importFingerprint) {
      return true;
    }

    return (
      importRecord.file_name === worksheet.file_name &&
      importRecord.sheet_name === worksheet.sheet_name &&
      importRecord.total_rows === summary.total_rows &&
      importRecord.header_row_number === worksheet.detected_header_row_number &&
      (worksheet.file_size == null || importRecord.file_size === worksheet.file_size) &&
      (worksheet.file_last_modified == null ||
        importRecord.file_last_modified === worksheet.file_last_modified)
    );
  });

  return {
    isPossibleDuplicate: matches.length > 0,
    message:
      matches.length > 0
        ? "Bu dosya daha önce içe aktarılmış olabilir. Otomatik birleştirme yapılmayacak."
        : undefined,
    matched_import_ids: matches.flatMap((importRecord) =>
      importRecord.id == null ? [] : [importRecord.id]
    ),
    matched_imports: matches.flatMap((importRecord) =>
      importRecord.id == null
        ? []
        : [
            {
              import_id: importRecord.id,
              file_name: importRecord.file_name,
              sheet_name: importRecord.sheet_name,
              imported_rows: importRecord.imported_rows,
              total_rows: importRecord.total_rows,
              started_at: importRecord.started_at,
              finished_at: importRecord.finished_at ?? null
            }
          ]
    ),
    import_fingerprint: importFingerprint
  };
}
