import type { AppointmentStatus } from "../constants/statuses";
import type { BaseEntity } from "./base";

export type AppointmentRecord = BaseEntity & {
  student_id: number;
  guardian_id?: number | null;
  appointment_at: string;
  status: AppointmentStatus;
  campaign_id?: number | null;
  note?: string | null;
  call_log_id?: number | null;
  guardian_message_due_at?: string | null;
  guardian_message_sent_at?: string | null;
  guardian_message_generation?: number | null;
};
