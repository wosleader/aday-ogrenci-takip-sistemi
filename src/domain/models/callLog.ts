import type { CallResult } from "../constants/statuses";
import type { BaseEntity } from "./base";

export type CallLogRecord = BaseEntity & {
  student_id: number;
  guardian_id?: number | null;
  phone_id?: number | null;
  contacted_phone_id?: number | null;
  contacted_phone_number?: string | null;
  contacted_phone_label?: string | null;
  call_time: string;
  call_result: CallResult;
  note?: string | null;
  reminder_at?: string | null;
  next_action?: string | null;
  created_by?: string | null;
  created_reminder_id?: number | null;
  created_appointment_id?: number | null;
};
