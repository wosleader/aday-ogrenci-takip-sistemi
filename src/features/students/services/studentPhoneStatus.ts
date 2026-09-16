import type { AppDatabase } from "../../../db/db";
import { db } from "../../../db/db";
import type {
  PhoneCallOutcome,
  PhoneInvalidReason,
  PhoneRecord,
  PhoneStatus
} from "../../../domain/models/phone";
import { nowIso } from "../../../utils/dateTime";

export type PhoneStatusUpdateResult = {
  phone_id: number;
  student_id: number;
  phone_status: PhoneStatus;
};

export type PhoneStateTransition =
  | { type: "toggle_contacted" }
  | { type: "set_contacted" }
  | { type: "toggle_manual_invalid" }
  | { type: "set_outcome"; outcome: PhoneCallOutcome };

export type PhoneStateTransitionResult = PhoneStatusUpdateResult & {
  call_outcome?: PhoneCallOutcome | null;
  call_outcome_updated_at?: string | null;
};

type OperationalSnapshot = {
  phone_status: PhoneStatus;
  invalid_reason: PhoneInvalidReason | null;
  invalidated_at: string | null;
  is_wrong: boolean;
};

function getOperationalSnapshot(phone: PhoneRecord): OperationalSnapshot {
  return {
    phone_status: phone.phone_status ?? "active",
    invalid_reason: phone.invalid_reason ?? null,
    invalidated_at: phone.invalidated_at ?? null,
    is_wrong: Boolean(phone.is_wrong)
  };
}

function isOperationallyUnusable(snapshot: OperationalSnapshot): boolean {
  return snapshot.phone_status === "invalid" || snapshot.is_wrong;
}

function isInvalidatingOutcome(outcome?: PhoneCallOutcome | null): boolean {
  return outcome === "wrong_number" || outcome === "unused";
}

function isOutcomeCausedInvalid(snapshot: OperationalSnapshot): boolean {
  return (
    snapshot.phone_status === "invalid" &&
    (snapshot.invalid_reason === "wrong_number" || snapshot.invalid_reason === "not_in_use")
  );
}

function shouldAuditOperationalChange(before: OperationalSnapshot, after: OperationalSnapshot): boolean {
  return (
    before.phone_status !== after.phone_status ||
    before.invalid_reason !== after.invalid_reason ||
    before.invalidated_at !== after.invalidated_at ||
    before.is_wrong !== after.is_wrong
  );
}

function invalidSnapshot(reason: PhoneInvalidReason, timestamp: string): OperationalSnapshot {
  return {
    phone_status: "invalid",
    invalid_reason: reason,
    invalidated_at: timestamp,
    is_wrong: reason === "wrong_number"
  };
}

function usableSnapshot(status: Exclude<PhoneStatus, "invalid">): OperationalSnapshot {
  return {
    phone_status: status,
    invalid_reason: null,
    invalidated_at: null,
    is_wrong: false
  };
}

async function getPhoneOrThrow(database: AppDatabase, phoneId: number) {
  const phone = await database.phones.get(phoneId);

  if (!phone?.id) {
    throw new Error("Telefon kaydı bulunamadı.");
  }

  return phone as PhoneRecord & { id: number };
}

async function addOperationalAudit(
  database: AppDatabase,
  phoneId: number,
  before: OperationalSnapshot,
  after: OperationalSnapshot,
  timestamp: string
): Promise<void> {
  await database.audit_logs.add({
    entity_type: "phone",
    entity_id: phoneId,
    action_type: "update",
    field_name: "operational_status",
    old_value: JSON.stringify(before),
    new_value: JSON.stringify(after),
    note: "Telefon kullanım durumu güncellendi.",
    performed_by: "agent",
    created_at: timestamp
  });
}

export async function applyPhoneStateTransitionInTransaction(
  phoneId: number,
  transition: PhoneStateTransition,
  database: AppDatabase,
  timestamp: string = nowIso()
): Promise<PhoneStateTransitionResult> {
  const phone = await getPhoneOrThrow(database, phoneId);
  const before = getOperationalSnapshot(phone);
  let after = before;
  let writesOperationalState = false;
  const patch: Partial<PhoneRecord> = {};

  if (transition.type === "toggle_contacted" || transition.type === "set_contacted") {
    writesOperationalState = true;
    const nextStatus =
      transition.type === "set_contacted"
        ? "contacted"
        : before.phone_status === "contacted"
          ? "active"
          : "contacted";
    after = usableSnapshot(nextStatus);

    if (nextStatus === "contacted") {
      const studentPhones = await database.phones.where("student_id").equals(phone.student_id).toArray();
      for (const studentPhone of studentPhones) {
        if (!studentPhone.id || studentPhone.id === phone.id || studentPhone.phone_status !== "contacted") {
          continue;
        }

        const otherBefore = getOperationalSnapshot(studentPhone);
        const otherAfter = usableSnapshot("active");
        await database.phones.update(studentPhone.id, {
          ...otherAfter,
          updated_at: timestamp
        });
        await addOperationalAudit(database, studentPhone.id, otherBefore, otherAfter, timestamp);
      }
    }
  } else if (transition.type === "toggle_manual_invalid") {
    writesOperationalState = true;
    after = isOperationallyUnusable(before) ? usableSnapshot("active") : invalidSnapshot("manual", timestamp);
  } else {
    patch.call_outcome = transition.outcome;
    patch.call_outcome_updated_at = timestamp;

    if (transition.outcome === "wrong_number") {
      writesOperationalState = true;
      after = invalidSnapshot("wrong_number", timestamp);
    } else if (transition.outcome === "unused") {
      writesOperationalState = true;
      after = invalidSnapshot("not_in_use", timestamp);
    } else if (
      transition.outcome === "reached" &&
      (!isOperationallyUnusable(before) || isOutcomeCausedInvalid(before))
    ) {
      writesOperationalState = true;
      after = usableSnapshot("contacted");
      const studentPhones = await database.phones.where("student_id").equals(phone.student_id).toArray();
      for (const studentPhone of studentPhones) {
        if (!studentPhone.id || studentPhone.id === phone.id || studentPhone.phone_status !== "contacted") {
          continue;
        }

        const otherBefore = getOperationalSnapshot(studentPhone);
        const otherAfter = usableSnapshot("active");
        await database.phones.update(studentPhone.id, {
          ...otherAfter,
          updated_at: timestamp
        });
        await addOperationalAudit(database, studentPhone.id, otherBefore, otherAfter, timestamp);
      }
    } else if (isOutcomeCausedInvalid(before)) {
      writesOperationalState = true;
      after = usableSnapshot("active");
    }
  }

  if (
    writesOperationalState &&
    after.phone_status !== "invalid" &&
    transition.type !== "set_outcome" &&
    isInvalidatingOutcome(phone.call_outcome)
  ) {
    patch.call_outcome = "not_called";
    patch.call_outcome_updated_at = timestamp;
  }

  if (writesOperationalState) {
    Object.assign(patch, after);
    patch.updated_at = timestamp;
  }
  await database.phones.update(phone.id, patch);

  if (writesOperationalState && shouldAuditOperationalChange(before, after)) {
    await addOperationalAudit(database, phone.id, before, after, timestamp);
  }

  const resultingOutcome = patch.call_outcome === undefined ? phone.call_outcome ?? null : patch.call_outcome;
  const resultingOutcomeUpdatedAt =
    patch.call_outcome_updated_at === undefined
      ? phone.call_outcome_updated_at ?? null
      : patch.call_outcome_updated_at;

  return {
    phone_id: phone.id,
    student_id: phone.student_id,
    phone_status: after.phone_status,
    call_outcome: resultingOutcome,
    call_outcome_updated_at: resultingOutcomeUpdatedAt
  };
}

export async function applyPhoneStateTransition(
  phoneId: number,
  transition: PhoneStateTransition,
  database: AppDatabase = db
): Promise<PhoneStateTransitionResult> {
  return database.transaction("rw", [database.phones, database.audit_logs], () =>
    applyPhoneStateTransitionInTransaction(phoneId, transition, database)
  );
}

export async function markPhoneAsContacted(
  phoneId: number,
  database: AppDatabase = db
): Promise<PhoneStatusUpdateResult> {
  return applyPhoneStateTransition(phoneId, { type: "toggle_contacted" }, database);
}

export async function markPhoneAsInvalid(
  phoneId: number,
  database: AppDatabase = db
): Promise<PhoneStatusUpdateResult> {
  return applyPhoneStateTransition(phoneId, { type: "toggle_manual_invalid" }, database);
}
