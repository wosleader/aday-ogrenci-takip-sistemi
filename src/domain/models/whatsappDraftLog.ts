import type { BaseEntity } from "./base";

export type WhatsAppDraftLogStatus = "draft_opened" | "manually_marked_sent" | "copied";

export type WhatsAppDraftLogRecord = BaseEntity & {
  student_id: number;
  phone_id?: number | null;
  phone_number: string;
  template_id: string;
  template_title: string;
  message_preview: string;
  status: WhatsAppDraftLogStatus;
  created_by_optional?: string | null;
};
