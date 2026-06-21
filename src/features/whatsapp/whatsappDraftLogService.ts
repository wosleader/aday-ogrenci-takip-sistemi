import type { AppDatabase } from "../../db/db";
import { db } from "../../db/db";
import type { WhatsAppDraftLogRecord, WhatsAppDraftLogStatus } from "../../domain/models/whatsappDraftLog";
import { nowIso } from "../../utils/dateTime";
import { createUuid } from "../../utils/id";

export type WhatsAppDraftLogInput = {
  student_id: number;
  phone_id?: number | null;
  phone_number: string;
  template_id: string;
  template_title: string;
  message_preview: string;
  status: WhatsAppDraftLogStatus;
  created_by_optional?: string | null;
};

export async function createWhatsAppDraftLog(
  input: WhatsAppDraftLogInput,
  database: AppDatabase = db
): Promise<number> {
  const timestamp = nowIso();

  return database.whatsapp_draft_logs.add({
    uuid: createUuid(),
    student_id: input.student_id,
    phone_id: input.phone_id ?? null,
    phone_number: input.phone_number,
    template_id: input.template_id,
    template_title: input.template_title,
    message_preview: input.message_preview,
    status: input.status,
    created_by_optional: input.created_by_optional ?? "agent",
    created_at: timestamp,
    updated_at: timestamp,
    deleted_at: null,
    sync_status: "local"
  } satisfies WhatsAppDraftLogRecord);
}
