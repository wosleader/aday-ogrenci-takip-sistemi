export const DATABASE_NAME = "aday-ogrenci-takip-db";
export const DATABASE_VERSION = 2;

export const STORES = {
  students:
    "++id, uuid, normalized_student_name, search_text, category, campaign_id, lifecycle_status, last_call_result, sync_status, deleted_at, updated_at",
  guardians:
    "++id, uuid, student_id, normalized_guardian_name, sync_status, deleted_at, updated_at",
  phones:
    "++id, uuid, student_id, guardian_id, normalized_phone_number, is_valid, is_wrong, is_primary, sync_status, deleted_at, updated_at",
  call_logs:
    "++id, uuid, student_id, phone_id, call_time, call_result, created_reminder_id, created_appointment_id, sync_status, deleted_at, updated_at",
  reminders:
    "++id, uuid, student_id, reminder_type, reminder_at, status, is_default_time_assigned, sync_status, deleted_at, updated_at",
  appointments:
    "++id, uuid, student_id, guardian_id, appointment_at, status, campaign_id, sync_status, deleted_at, updated_at",
  campaigns: "++id, uuid, name, is_default, is_active, sync_status, deleted_at, updated_at",
  imports: "++id, uuid, file_name, sheet_name, started_at, finished_at, sync_status, deleted_at",
  import_logs: "++id, import_id, row_number, column_name, severity, auto_fixed, created_at",
  duplicate_checks: "++id, duplicate_type, duplicate_value, severity, count, created_at",
  audit_logs: "++id, entity_type, entity_id, action_type, field_name, performed_by, created_at",
  whatsapp_draft_logs: "++id, uuid, student_id, phone_id, template_id, status, created_at, deleted_at",
  settings: "key, updated_at",
  keyboard_shortcuts: "++id, action_key, shortcut, is_active, updated_at"
} as const;
