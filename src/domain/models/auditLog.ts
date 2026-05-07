import type { AuditActionType } from "../constants/statuses";

export type AuditLogRecord = {
  id?: number;
  entity_type: string;
  entity_id: number | string;
  action_type: AuditActionType;
  field_name?: string | null;
  old_value?: string | null;
  new_value?: string | null;
  note?: string | null;
  performed_by?: string | null;
  created_at: string;
};
