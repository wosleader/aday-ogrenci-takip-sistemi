import type { CallResult } from "../constants/statuses";
import type { BaseEntity } from "./base";

export type CallLogRecord = BaseEntity & {
  student_id: number;
  phone_id?: number | null;
  call_time: string;
  call_result: CallResult;
  note?: string | null;
  next_action?: string | null;
  created_reminder_id?: number | null;
  created_appointment_id?: number | null;
};
