import type { AppointmentRecord } from "../../../domain/models/appointment";
import type { CallLogRecord } from "../../../domain/models/callLog";
import type { CampaignRecord } from "../../../domain/models/campaign";
import type { GuardianRecord } from "../../../domain/models/guardian";
import type { PhoneRecord } from "../../../domain/models/phone";
import type { ReminderRecord } from "../../../domain/models/reminder";
import type { StudentRecord } from "../../../domain/models/student";

export type ExportScope = "all" | "filtered";

export type FilteredExportSnapshot = {
  created_at: string;
  student_count: number;
  filter_label?: string | null;
  student_ids: number[];
};

export type ExportPhoneSlots = {
  phone_1?: PhoneRecord | null;
  phone_2?: PhoneRecord | null;
};

export type ExportStudentBundle = ExportPhoneSlots & {
  student: StudentRecord & { id: number };
  guardian?: GuardianRecord | null;
  campaign?: CampaignRecord | null;
  pending_reminder?: ReminderRecord | null;
  appointment?: AppointmentRecord | null;
  call_logs: Array<CallLogRecord & { id: number }>;
  duplicate_phone_keys: string[];
};

export type ExportDataset = {
  bundles: ExportStudentBundle[];
};

export type DetailedExportSheet = {
  headers: string[];
  rows: Array<Array<string | number>>;
  max_call_log_count: number;
  total_call_log_count: number;
  estimated_column_count: number;
};

export type ExportPreviewSummary = {
  scope: ExportScope;
  student_count: number;
  total_call_log_count: number;
  max_call_log_count: number;
  dynamic_call_group_count: number;
  estimated_column_count: number;
};

export const FILTERED_EXPORT_SNAPSHOT_KEY = "aots.filteredExportSnapshot.v1";
