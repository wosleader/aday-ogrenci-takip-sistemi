import type { ReminderRecord } from "../../../domain/models/reminder";
import { createPhoneSnapshotDisplayLabel } from "../../calls/services/callLogPhoneContext";

export function getReminderPhoneContextLabel(
  reminder: Pick<ReminderRecord, "phone_id" | "phone_snapshot">
): string {
  return createPhoneSnapshotDisplayLabel(reminder.phone_snapshot);
}
