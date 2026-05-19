import type { CallLogRecord } from "../../../domain/models/callLog";
import type { PhoneSnapshot } from "../../../domain/models/phone";
import { createPhoneDisplayLabel } from "../../students/services/phoneCompatibility";

export const PHONE_CONTEXT_FALLBACK_LABEL = "Telefon bilgisi yok";

export function createPhoneSnapshotDisplayLabel(
  phoneSnapshot?: PhoneSnapshot | null,
  fallbackLabel = PHONE_CONTEXT_FALLBACK_LABEL
): string {
  if (!phoneSnapshot) {
    return fallbackLabel;
  }

  const referenceLabel = phoneSnapshot.reference_label?.trim();

  if (!referenceLabel) {
    return fallbackLabel;
  }

  return createPhoneDisplayLabel(referenceLabel, phoneSnapshot.relation_label);
}

export function getCallLogPhoneContextLabel(
  callLog: Pick<CallLogRecord, "phone_id" | "phone_snapshot" | "contacted_phone_label">
): string {
  const snapshotLabel = createPhoneSnapshotDisplayLabel(callLog.phone_snapshot, "");

  if (snapshotLabel) {
    return snapshotLabel;
  }

  const legacyContactLabel = callLog.contacted_phone_label?.trim();

  if (legacyContactLabel) {
    return legacyContactLabel;
  }

  return PHONE_CONTEXT_FALLBACK_LABEL;
}
