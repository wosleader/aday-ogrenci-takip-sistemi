import type { AppDatabase } from "../../../db/db";
import { db } from "../../../db/db";
import type { AppointmentStatus, CallResult, ReminderStatus } from "../../../domain/constants/statuses";
import type { CallLogRecord } from "../../../domain/models/callLog";
import type { PhoneRecord } from "../../../domain/models/phone";
import { nowIso } from "../../../utils/dateTime";
import { assertPendingAppointmentOwnerLinkIntegrity } from "../../appointments/services/appointmentOwnerIntegrity";
import { createPhoneSnapshot } from "../../students/services/phoneCompatibility";
import {
  areAllPhonesInvalidOrWrong,
  isSelectableCallPhone,
  requiresCallPhoneSelection
} from "./callSaveValidation";
import { recomputeStudentSummaryFromActiveCallLogs } from "./callLogDeletion";

export type CallLogCorrectionInput = {
  call_log_id: number;
  call_result: CallResult;
  call_time: string;
  note?: string | null;
  contacted_phone_id?: number | null;
};

export type CallLogCorrectionResult = {
  call_log_id: number;
  student_id: number;
  latest_call_log_id: number | null;
  contacted_phone_id: number | null;
  correction_mode: CallLogCorrectionMode;
};

export type CallLogCorrectionMode = "full" | "note_only";

export type CallLogCorrectionPolicy =
  | { mode: "full" }
  | { mode: "note_only" }
  | { mode: "blocked_active"; message: string }
  | { mode: "blocked_missing"; message: string }
  | { mode: "blocked_conflict"; message: string };

type ActiveCallLog = CallLogRecord & { id: number };

const MISSING_LINKED_RECORD_MESSAGE = "Bağlı kayıt bulunamadı. Düzeltme yapılamadı; veri kontrolü gerekli.";
const CONFLICTING_DEPENDENCY_MESSAGE = "Bağlı kayıtlar güvenle doğrulanamadı. Düzeltme yapılamadı; veri kontrolü gerekli.";
const NOTE_ONLY_FIELD_MESSAGE = "Bağlı kayıt tamamlandığı için yalnız açıklama notu düzeltilebilir.";

function isActive<T extends { deleted_at?: string | null }>(record: T): boolean {
  return !record.deleted_at;
}

function isEligibleContactPhone(phone: PhoneRecord): boolean {
  return isActive(phone) && isSelectableCallPhone(phone);
}

function assertValidCallTime(value: string): void {
  if (!value.trim() || Number.isNaN(new Date(value).getTime())) {
    throw new Error("Görüşme tarihi/saat bilgisi geçersiz.");
  }
}

function isTerminalReminderStatus(status: ReminderStatus): boolean {
  return status === "completed" || status === "cancelled";
}

function isTerminalAppointmentStatus(status: AppointmentStatus): boolean {
  return (
    status === "completed" ||
    status === "no_show" ||
    status === "cancelled" ||
    status === "attended" ||
    status === "missed" ||
    status === "registered"
  );
}

function resolveCurrentContactedPhoneId(callLog: ActiveCallLog): number | null {
  return callLog.contacted_phone_id ?? callLog.phone_snapshot?.phone_id ?? callLog.phone_id ?? null;
}

async function resolveCallLogCorrectionPolicy(
  callLog: ActiveCallLog,
  database: AppDatabase
): Promise<CallLogCorrectionPolicy> {
  try {
    await assertPendingAppointmentOwnerLinkIntegrity(database, callLog);
  } catch {
    return { mode: "blocked_conflict", message: CONFLICTING_DEPENDENCY_MESSAGE };
  }

  if (callLog.created_reminder_id && callLog.created_appointment_id) {
    return { mode: "blocked_conflict", message: CONFLICTING_DEPENDENCY_MESSAGE };
  }

  if (callLog.created_reminder_id) {
    const reminder = await database.reminders.get(callLog.created_reminder_id);

    if (!reminder) {
      return { mode: "blocked_missing", message: MISSING_LINKED_RECORD_MESSAGE };
    }

    if (reminder.deleted_at || reminder.student_id !== callLog.student_id) {
      return { mode: "blocked_conflict", message: CONFLICTING_DEPENDENCY_MESSAGE };
    }

    if (isTerminalReminderStatus(reminder.status)) {
      return { mode: "note_only" };
    }

    if (reminder.status === "pending") {
      return {
        mode: "blocked_active",
        message: "Bu görüşmeye bağlı aktif bir hatırlatma bulunuyor. Normal düzeltme yerine Hatırlatmayı düzenle işlemini kullanın."
      };
    }

    return { mode: "blocked_conflict", message: CONFLICTING_DEPENDENCY_MESSAGE };
  }

  if (callLog.created_appointment_id) {
    const appointment = await database.appointments.get(callLog.created_appointment_id);

    if (!appointment) {
      return { mode: "blocked_missing", message: MISSING_LINKED_RECORD_MESSAGE };
    }

    if (appointment.deleted_at || appointment.student_id !== callLog.student_id) {
      return { mode: "blocked_conflict", message: CONFLICTING_DEPENDENCY_MESSAGE };
    }

    if (
      appointment.call_log_id != null &&
      (appointment.call_log_id !== callLog.id || callLog.call_result !== "appointment")
    ) {
      return { mode: "blocked_conflict", message: CONFLICTING_DEPENDENCY_MESSAGE };
    }

    if (isTerminalAppointmentStatus(appointment.status)) {
      return { mode: "note_only" };
    }

    if (appointment.status === "pending" || appointment.status === "postponed") {
      return {
        mode: "blocked_active",
        message: "Bu görüşmeye bağlı aktif bir etkinlik bulunuyor. Etkinlik tamamlanmadan normal düzeltme yapılamaz."
      };
    }

    return { mode: "blocked_conflict", message: CONFLICTING_DEPENDENCY_MESSAGE };
  }

  return { mode: "full" };
}

function assertNoteOnlyCorrection(input: CallLogCorrectionInput, callLog: ActiveCallLog): void {
  if (
    input.call_time !== callLog.call_time ||
    input.call_result !== callLog.call_result ||
    (input.contacted_phone_id ?? null) !== resolveCurrentContactedPhoneId(callLog)
  ) {
    throw new Error(NOTE_ONLY_FIELD_MESSAGE);
  }
}

function createCorrectionAuditValue(callLog: ActiveCallLog, correctionMode: CallLogCorrectionMode) {
  return {
    correction_mode: correctionMode,
    note: callLog.note ?? null,
    call_time: callLog.call_time,
    call_result: callLog.call_result,
    phone_id: callLog.phone_id ?? null,
    phone_snapshot: callLog.phone_snapshot ?? null,
    created_reminder_id: callLog.created_reminder_id ?? null,
    created_appointment_id: callLog.created_appointment_id ?? null
  };
}

function assertCorrectionPolicyAllowsSave(policy: CallLogCorrectionPolicy): asserts policy is {
  mode: CallLogCorrectionMode;
} {
  if (policy.mode !== "full" && policy.mode !== "note_only") {
    throw new Error(policy.message);
  }
}

export async function getCallLogCorrectionPolicy(
  callLogId: number,
  database: AppDatabase = db
): Promise<CallLogCorrectionPolicy> {
  const callLog = await database.call_logs.get(callLogId);

  if (!callLog?.id) {
    throw new Error("Düzeltilecek iletişim kaydı bulunamadı.");
  }

  if (callLog.deleted_at) {
    throw new Error("Silinmiş iletişim kaydı düzeltilemez.");
  }

  return resolveCallLogCorrectionPolicy(callLog as ActiveCallLog, database);
}

async function resolveCorrectedContactPhone(
  database: AppDatabase,
  studentId: number,
  callResult: CallResult,
  contactedPhoneId?: number | null
): Promise<(PhoneRecord & { id: number }) | null> {
  const phones = (await database.phones.where("student_id").equals(studentId).toArray()).flatMap((phone) =>
    phone.id ? [phone as PhoneRecord & { id: number }] : []
  );

  if (contactedPhoneId) {
    const phone = phones.find((studentPhone) => studentPhone.id === contactedPhoneId);

    if (!phone) {
      throw new Error("Seçilen telefon bu adaya ait değil.");
    }

    if (!isEligibleContactPhone(phone)) {
      throw new Error("Yanlış numara / kullanılmıyor işaretli telefon bu kayıt için seçilemez.");
    }

    return phone;
  }

  const activePhones = phones.filter(isActive);
  const eligiblePhones = activePhones.filter(isSelectableCallPhone);

  if (callResult !== "wrong_number" && eligiblePhones.length === 1) {
    return eligiblePhones[0];
  }

  if (callResult === "wrong_number") {
    if (eligiblePhones.length === 0 && areAllPhonesInvalidOrWrong(activePhones)) {
      return null;
    }

    if (eligiblePhones.length > 0) {
      throw new Error("Hangi telefonla işlem yapılacak? Lütfen bu kayıt için ilgili telefonu seçin.");
    }
  }

  if (requiresCallPhoneSelection(callResult)) {
    if (eligiblePhones.length === 0) {
      throw new Error("Bu kayıt için seçilebilir telefon bulunmadı.");
    }

    if (eligiblePhones.length > 1) {
      throw new Error("Hangi telefonla işlem yapılacak? Lütfen bu kayıt için ilgili telefonu seçin.");
    }
  }

  return null;
}

export async function updateCallLogCorrection(
  input: CallLogCorrectionInput,
  database: AppDatabase = db
): Promise<CallLogCorrectionResult> {
  let result: CallLogCorrectionResult | undefined;

  await database.transaction(
    "rw",
    [database.call_logs, database.students, database.phones, database.reminders, database.appointments, database.audit_logs],
    async () => {
    const callLog = await database.call_logs.get(input.call_log_id);

    if (!callLog?.id) {
      throw new Error("Düzeltilecek iletişim kaydı bulunamadı.");
    }

    if (callLog.deleted_at) {
      throw new Error("Silinmiş iletişim kaydı düzeltilemez.");
    }

    const student = await database.students.get(callLog.student_id);

    if (!student?.id || student.deleted_at) {
      throw new Error("İletişim kaydının bağlı olduğu aday bulunamadı.");
    }

    const activeCallLog = callLog as ActiveCallLog;
    const policy = await resolveCallLogCorrectionPolicy(activeCallLog, database);
    assertCorrectionPolicyAllowsSave(policy);

    if (activeCallLog.call_result !== "appointment" && input.call_result === "appointment") {
      throw new Error("Randevu yalnız randevu oluşturma akışından kaydedilebilir.");
    }

    const timestamp = nowIso();
    const oldAuditValue = createCorrectionAuditValue(activeCallLog, policy.mode);
    let latestCallLogId: number | null = null;
    let contactedPhoneId = resolveCurrentContactedPhoneId(activeCallLog);

    if (policy.mode === "note_only") {
      assertNoteOnlyCorrection(input, activeCallLog);
      await database.call_logs.update(activeCallLog.id, {
        note: input.note?.trim() || null,
        updated_at: timestamp
      });
    } else {
      assertValidCallTime(input.call_time);
      const contactedPhone = await resolveCorrectedContactPhone(
        database,
        student.id,
        input.call_result,
        input.contacted_phone_id
      );
      const phoneSnapshot = contactedPhone ? createPhoneSnapshot(contactedPhone) : null;

      contactedPhoneId = contactedPhone?.id ?? null;
      await database.call_logs.update(activeCallLog.id, {
        call_time: input.call_time,
        call_result: input.call_result,
        note: input.note?.trim() || null,
        phone_id: contactedPhone?.id ?? null,
        phone_snapshot: phoneSnapshot,
        contacted_phone_id: contactedPhone?.id ?? null,
        contacted_phone_number: contactedPhone?.phone_number ?? null,
        contacted_phone_label: contactedPhone?.phone_label ?? null,
        updated_at: timestamp
      });

      latestCallLogId = await recomputeStudentSummaryFromActiveCallLogs(database, student.id, timestamp);
    }

    const updatedCallLog = await database.call_logs.get(activeCallLog.id);

    if (!updatedCallLog?.id) {
      throw new Error("İletişim kaydı düzeltilemedi.");
    }

    await database.audit_logs.add({
      entity_type: "call_log",
      entity_id: activeCallLog.id,
      action_type: "update",
      field_name: "call_log_correction",
      old_value: JSON.stringify(oldAuditValue),
      new_value: JSON.stringify(createCorrectionAuditValue(updatedCallLog as ActiveCallLog, policy.mode)),
      note: "İletişim kaydı düzeltildi.",
      performed_by: "agent",
      created_at: timestamp
    });

    result = {
      call_log_id: activeCallLog.id,
      student_id: student.id,
      latest_call_log_id: latestCallLogId,
      contacted_phone_id: contactedPhoneId,
      correction_mode: policy.mode
    };
    }
  );

  if (!result) {
    throw new Error("İletişim kaydı düzeltilemedi.");
  }

  return result;
}
