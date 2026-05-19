import type { ReminderStatus, ReminderType } from "../constants/statuses";
import type { BaseEntity } from "./base";
import type { PhoneSnapshot } from "./phone";

export type ReminderRecord = BaseEntity & {
  student_id: number;
  call_log_id?: number | null;
  phone_id?: PhoneSnapshot["phone_id"];
  phone_snapshot?: PhoneSnapshot | null;
  reminder_type: ReminderType;
  reminder_at: string;
  status: ReminderStatus;
  note?: string | null;
  is_default_time_assigned: boolean;
};
