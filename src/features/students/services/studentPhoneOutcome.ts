import type { AppDatabase } from "../../../db/db";
import { db } from "../../../db/db";
import type { PhoneCallOutcome } from "../../../domain/models/phone";
import { applyPhoneStateTransition } from "./studentPhoneStatus";

export type PhoneOutcomeUpdateResult = {
  phone_id: number;
  student_id: number;
  call_outcome: PhoneCallOutcome;
  call_outcome_updated_at: string;
};

export async function updatePhoneOutcome(
  phoneId: number,
  outcome: PhoneCallOutcome,
  database: AppDatabase = db
): Promise<PhoneOutcomeUpdateResult> {
  const result = await applyPhoneStateTransition(phoneId, { type: "set_outcome", outcome }, database);

  return {
    phone_id: result.phone_id,
    student_id: result.student_id,
    call_outcome: outcome,
    call_outcome_updated_at: result.call_outcome_updated_at!
  };
}
