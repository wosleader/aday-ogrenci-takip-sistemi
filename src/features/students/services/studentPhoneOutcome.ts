import type { AppDatabase } from "../../../db/db";
import { db } from "../../../db/db";
import type { PhoneCallOutcome, PhoneStatus } from "../../../domain/models/phone";
import { nowIso } from "../../../utils/dateTime";
import {
  appendPhoneAttemptEvent,
  isPhoneAttemptOutcome,
  PHONE_ATTEMPT_EVENT_VERSION
} from "../../reports/services/phoneAttemptContract";
import { applyPhoneStateTransitionInTransaction, type PhoneStateTransitionResult } from "./studentPhoneStatus";

export type PhoneOutcomeUpdateResult = {
  phone_id: number;
  student_id: number;
  phone_status: PhoneStatus;
  call_outcome: PhoneCallOutcome;
  call_outcome_updated_at: string;
};

export async function updatePhoneOutcome(
  phoneId: number,
  outcome: PhoneCallOutcome,
  database: AppDatabase = db
): Promise<PhoneOutcomeUpdateResult> {
  let result: PhoneStateTransitionResult | undefined;

  await database.transaction("rw", [database.phones, database.students, database.audit_logs], async () => {
    const timestamp = nowIso();
    result = await applyPhoneStateTransitionInTransaction(phoneId, { type: "set_outcome", outcome }, database, timestamp);

    if (isPhoneAttemptOutcome(outcome)) {
      const student = await database.students.get(result.student_id);
      await appendPhoneAttemptEvent(database, {
        phone_id: result.phone_id,
        student_id: result.student_id,
        outcome,
        campaign_id_at_attempt: student?.campaign_id ?? null,
        contact_established: outcome === "reached" && result.phone_status === "contacted",
        event_version: PHONE_ATTEMPT_EVENT_VERSION,
        occurred_at: timestamp
      });
    }
  });

  if (!result) {
    throw new Error("Telefon sonucu güncellenemedi.");
  }

  return {
    phone_id: result.phone_id,
    student_id: result.student_id,
    phone_status: result.phone_status,
    call_outcome: outcome,
    call_outcome_updated_at: result.call_outcome_updated_at!
  };
}
