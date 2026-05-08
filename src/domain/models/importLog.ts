import type { BaseEntity } from "./base";

export type ImportRecord = BaseEntity & {
  file_name: string;
  sheet_name: string;
  total_rows: number;
  imported_rows: number;
  skipped_rows: number;
  warning_count: number;
  error_count: number;
  started_at: string;
  finished_at?: string | null;
  header_row_number?: number | null;
  file_size?: number | null;
  file_last_modified?: number | null;
  import_fingerprint?: string | null;
};

export type ImportLogRecord = {
  id?: number;
  import_id: number;
  row_number?: number | null;
  column_name?: string | null;
  severity: "info" | "warning" | "error";
  message: string;
  auto_fixed: boolean;
  created_at: string;
};
