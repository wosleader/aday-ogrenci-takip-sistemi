import type { CallResult, LifecycleStatus, StudentCategory } from "../constants/statuses";
import type { BaseEntity } from "./base";

export type StudentRecord = BaseEntity & {
  student_full_name: string;
  normalized_student_name: string;
  search_text: string;
  current_class?: string | null;
  student_group: string;
  neighborhood?: string | null;
  district?: string | null;
  category: StudentCategory;
  campaign_id?: number | null;
  lifecycle_status: LifecycleStatus;
  last_call_result: CallResult;
  last_contacted_at?: string | null;
  last_contacted_phone_id?: number | null;
  source_file_name?: string | null;
  source_sheet_name?: string | null;
  source_row_number?: number | null;
  general_note?: string | null;
};
