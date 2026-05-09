export const APP_VERSION = "0.1.0";
export const BACKUP_VERSION = 1;

export const DEFAULT_SETTINGS = [
  { key: "default_category", value: "YKS" },
  { key: "default_student_group", value: "11. Sınıf YKS Hazırlık" },
  { key: "default_campaign", value: "Diğer" },
  { key: "default_reminder_time", value: "11:00" },
  { key: "call_start_time", value: "10:00" },
  { key: "call_end_time", value: "18:00" },
  { key: "reminder_popup_enabled", value: "true" },
  { key: "reminder_sound_enabled", value: "true" },
  { key: "export_mode", value: "Detaylı" },
  { key: "first_sheet_only", value: "true" },
  { key: "auto_match_misspelled_columns", value: "true" }
] as const;
