import type { ReminderStatus, ReminderType } from "../constants/statuses";
import type { BaseEntity } from "./base";

export type ReminderRecord = BaseEntity & {
  student_id: number;
  reminder_type: ReminderType;
  reminder_at: string;
  status: ReminderStatus;
  note?: string | null;
  is_default_time_assigned: boolean;
};
