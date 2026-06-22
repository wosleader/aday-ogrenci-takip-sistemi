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

export type WhatsAppManualSentSummary = {
  phone_id?: number | null;
  phone_number: string;
  template_title: string;
  created_at: string;
};

export type WhatsAppManualSentLookup = {
  byPhoneId: Map<number, WhatsAppManualSentSummary>;
  byPhoneNumber: Map<string, WhatsAppManualSentSummary>;
};

function normalizePhoneLookupValue(value?: string | null): string {
  return value?.replace(/\D/g, "") ?? "";
}

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

export async function readLatestManualSentWhatsAppDraftsForStudent(
  studentId: number,
  database: AppDatabase = db
): Promise<WhatsAppManualSentLookup> {
  const logs = (await database.whatsapp_draft_logs.where("student_id").equals(studentId).toArray())
    .filter((log) => !log.deleted_at && log.status === "manually_marked_sent")
    .sort((left, right) => right.created_at.localeCompare(left.created_at) || (right.id ?? 0) - (left.id ?? 0));
  const byPhoneId = new Map<number, WhatsAppManualSentSummary>();
  const byPhoneNumber = new Map<string, WhatsAppManualSentSummary>();

  for (const log of logs) {
    const summary: WhatsAppManualSentSummary = {
      phone_id: log.phone_id ?? null,
      phone_number: log.phone_number,
      template_title: log.template_title,
      created_at: log.created_at
    };

    if (log.phone_id != null && !byPhoneId.has(log.phone_id)) {
      byPhoneId.set(log.phone_id, summary);
    }

    const normalizedPhoneNumber = normalizePhoneLookupValue(log.phone_number);
    if (normalizedPhoneNumber && !byPhoneNumber.has(normalizedPhoneNumber)) {
      byPhoneNumber.set(normalizedPhoneNumber, summary);
    }
  }

  return { byPhoneId, byPhoneNumber };
}
