import type { AuditLogRecord } from "../../../domain/models/auditLog";
import type { PhoneCallOutcome } from "../../../domain/models/phone";
import type { AppDatabase } from "../../../db/db";

export const PHONE_ATTEMPT_ENTITY_TYPE = "phone_attempt";
export const PHONE_ATTEMPT_ACTION_TYPE = "create" as const;
export const PHONE_ATTEMPT_FIELD_NAME = "phone_attempt_v1";
export const PHONE_ATTEMPT_EVENT_VERSION = 1;

export type PhoneAttemptOutcome = Exclude<PhoneCallOutcome, "not_called">;

export type PhoneAttemptPayload = {
  event_version: typeof PHONE_ATTEMPT_EVENT_VERSION;
  student_id: number;
  outcome: PhoneAttemptOutcome;
  campaign_id_at_attempt: number | null;
  contact_established: boolean;
};

export type PhoneAttemptEvent = PhoneAttemptPayload & {
  id?: number;
  phone_id: number;
  occurred_at: string;
};

const PHONE_ATTEMPT_OUTCOMES: ReadonlySet<PhoneAttemptOutcome> = new Set([
  "no_answer",
  "busy",
  "closed",
  "reached",
  "wrong_number",
  "unused"
]);

export function isPhoneAttemptOutcome(outcome: PhoneCallOutcome): outcome is PhoneAttemptOutcome {
  return PHONE_ATTEMPT_OUTCOMES.has(outcome as PhoneAttemptOutcome);
}

export async function appendPhoneAttemptEvent(
  database: AppDatabase,
  event: PhoneAttemptEvent
): Promise<void> {
  const payload: PhoneAttemptPayload = {
    event_version: event.event_version,
    student_id: event.student_id,
    outcome: event.outcome,
    campaign_id_at_attempt: event.campaign_id_at_attempt,
    contact_established: event.contact_established
  };

  await database.audit_logs.add({
    entity_type: PHONE_ATTEMPT_ENTITY_TYPE,
    entity_id: event.phone_id,
    action_type: PHONE_ATTEMPT_ACTION_TYPE,
    field_name: PHONE_ATTEMPT_FIELD_NAME,
    old_value: null,
    new_value: JSON.stringify(payload),
    note: null,
    performed_by: "agent",
    created_at: event.occurred_at
  });
}

export function parsePhoneAttemptEvent(record: AuditLogRecord): PhoneAttemptEvent | null {
  if (
    record.entity_type !== PHONE_ATTEMPT_ENTITY_TYPE ||
    record.action_type !== PHONE_ATTEMPT_ACTION_TYPE ||
    record.field_name !== PHONE_ATTEMPT_FIELD_NAME ||
    typeof record.entity_id !== "number" ||
    !Number.isInteger(record.entity_id) ||
    !record.created_at ||
    Number.isNaN(Date.parse(record.created_at)) ||
    !record.new_value
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(record.new_value) as Partial<PhoneAttemptPayload>;
    if (
      payload.event_version !== PHONE_ATTEMPT_EVENT_VERSION ||
      typeof payload.student_id !== "number" ||
      !Number.isInteger(payload.student_id) ||
      !isPhoneAttemptOutcome(payload.outcome as PhoneCallOutcome) ||
      (payload.campaign_id_at_attempt !== null &&
        (typeof payload.campaign_id_at_attempt !== "number" || !Number.isInteger(payload.campaign_id_at_attempt))) ||
      typeof payload.contact_established !== "boolean"
    ) {
      return null;
    }

    return {
      id: record.id,
      phone_id: record.entity_id,
      occurred_at: record.created_at,
      event_version: PHONE_ATTEMPT_EVENT_VERSION,
      student_id: payload.student_id,
      outcome: payload.outcome as PhoneAttemptOutcome,
      campaign_id_at_attempt: payload.campaign_id_at_attempt ?? null,
      contact_established: payload.contact_established
    };
  } catch {
    return null;
  }
}
