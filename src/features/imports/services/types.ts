export type ImportPhoneFieldKey =
  | "phone_1"
  | "phone_2"
  | "phone_3"
  | "phone_4"
  | "phone_5"
  | "phone_6"
  | "phone_7"
  | "phone_8"
  | "phone_9"
  | "phone_10";

export type ImportFieldKey =
  | "current_class"
  | "student_group"
  | "student_full_name"
  | "student_first_name"
  | "student_last_name"
  | "guardian_full_name"
  | "mother_full_name"
  | "father_full_name"
  | "neighborhood"
  | "district"
  | ImportPhoneFieldKey
  | "last_call_result"
  | "should_call_again"
  | "general_note"
  | "reminder_date"
  | "campaign_name";

export type ImportLogSeverity = "info" | "warning" | "error";

export type ImportEngineLog = {
  row_number?: number;
  column_name?: string;
  column_letter?: string;
  column_number?: number;
  field_name?: string;
  severity: ImportLogSeverity;
  message: string;
  suggested_action?: string;
  auto_fixed: boolean;
};

export type ColumnMatchStatus = "matched" | "auto_fixed" | "manual" | "mapping_required" | "ignored";

export type ColumnMatch = {
  source_index: number;
  source_column_letter: string;
  source_column_number: number;
  source_header: string;
  normalized_header: string;
  target_field?: ImportFieldKey;
  status: ColumnMatchStatus;
  confidence: number;
  note?: string;
};

export type ParsedWorksheet = {
  file_name: string;
  file_size?: number;
  file_last_modified?: number;
  sheet_name: string;
  ignored_sheet_names: string[];
  raw_rows: unknown[][];
  detected_header_row_number: number;
  headers: string[];
  rows: unknown[][];
  preview_rows: unknown[][];
};

export type HeaderDetectionResult = {
  header_row_index: number;
  header_row_number: number;
  score: number;
};

export type SimulatedImportPhone = {
  field: ImportPhoneFieldKey;
  source_index: number;
  source_header: string;
  source_column_letter: string;
  raw_value: string;
  phone_number: string;
  normalized_phone_number: string;
  reference_label: string;
  relation_label?: string;
  source_column: string;
  priority: number;
  is_valid: boolean;
};

export type SimulatedImportRow = {
  row_number: number;
  current_class?: string;
  student_group?: string;
  student_first_name?: string;
  student_last_name?: string;
  student_full_name: string;
  guardian_full_name?: string;
  mother_full_name?: string;
  father_full_name?: string;
  neighborhood?: string;
  district?: string;
  phone_1?: string;
  phone_2?: string;
  phones: SimulatedImportPhone[];
  last_call_result?: string;
  should_call_again: boolean;
  general_note?: string;
  reminder_at?: string;
  campaign_name: string;
};

export type DuplicatePhoneWarning = {
  phone_number: string;
  row_numbers: number[];
  student_names: string[];
};

export type ImportSimulationSummary = {
  total_rows: number;
  readable_rows: number;
  skipped_rows: number;
  auto_matched_columns: ColumnMatch[];
  mapping_required_columns: ColumnMatch[];
  missing_required_fields: Array<{
    row_number: number;
    field: ImportFieldKey;
    message: string;
  }>;
  empty_row_count: number;
  empty_phone_count: number;
  phone1_empty_with_alternative_count: number;
  both_phones_empty_count: number;
  duplicate_phone_warnings: DuplicatePhoneWarning[];
  default_campaign_assigned_count: number;
  default_time_assigned_count: number;
  logs: ImportEngineLog[];
  detailed_logs: ImportEngineLog[];
  simulated_rows: SimulatedImportRow[];
  preview_rows: SimulatedImportRow[];
};

export type ImportSimulationOptions = {
  defaultCampaignName: string;
  defaultReminderTime: string;
  callStartTime: string;
  callEndTime: string;
  manualMappings?: Record<number, ImportFieldKey | "ignore" | "">;
};
