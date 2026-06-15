import type { AppDatabase } from "../../../db/db";
import { db } from "../../../db/db";
import type { PhoneCallOutcome } from "../../../domain/models/phone";
import { nowIso } from "../../../utils/dateTime";

export type PhoneOutcomeUpdateResult = {
  phone_id: number;
  student_id: number;
  call_outcome: PhoneCallOutcome;
  call_outcome_updated_at: string;
};

async function getPhoneOrThrow(database: AppDatabase, phoneId: number) {
  const phone = await database.phones.get(phoneId);

  if (!phone?.id) {
    throw new Error("Telefon kaydı bulunamadı.");
  }

  return phone as typeof phone & { id: number };
}

export async function updatePhoneOutcome(
  phoneId: number,
  outcome: PhoneCallOutcome,
  database: AppDatabase = db
): Promise<PhoneOutcomeUpdateResult> {
  const phone = await getPhoneOrThrow(database, phoneId);
  const timestamp = nowIso();

  await database.phones.update(phone.id, {
    call_outcome: outcome,
    call_outcome_updated_at: timestamp,
    updated_at: timestamp
  });

  return {
    phone_id: phone.id,
    student_id: phone.student_id,
    call_outcome: outcome,
    call_outcome_updated_at: timestamp
  };
}
