import type { AppDatabase } from "../../../db/db";
import { db } from "../../../db/db";
import type { CallResult } from "../../../domain/constants/statuses";
import type { PhoneRecord } from "../../../domain/models/phone";
import { nowIso } from "../../../utils/dateTime";
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
};

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

  assertValidCallTime(input.call_time);

  await database.transaction("rw", [database.call_logs, database.students, database.phones], async () => {
    const callLog = await database.call_logs.get(input.call_log_id);

    if (!callLog?.id) {
      throw new Error("Düzeltilecek iletişim kaydı bulunamadı.");
    }

    if (callLog.deleted_at) {
      throw new Error("Silinmiş iletişim kaydı düzeltilemez.");
    }

    if (callLog.created_reminder_id || callLog.created_appointment_id) {
      throw new Error("Bu kayıt bağlı hatırlatma/randevu içerdiği için bu aşamada düzeltilemez.");
    }

    const student = await database.students.get(callLog.student_id);

    if (!student?.id || student.deleted_at) {
      throw new Error("İletişim kaydının bağlı olduğu aday bulunamadı.");
    }

    const contactedPhone = await resolveCorrectedContactPhone(
      database,
      student.id,
      input.call_result,
      input.contacted_phone_id
    );
    const timestamp = nowIso();
    const phoneSnapshot = contactedPhone ? createPhoneSnapshot(contactedPhone) : null;

    await database.call_logs.update(callLog.id, {
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

    const latestCallLogId = await recomputeStudentSummaryFromActiveCallLogs(database, student.id, timestamp);

    result = {
      call_log_id: callLog.id,
      student_id: student.id,
      latest_call_log_id: latestCallLogId,
      contacted_phone_id: contactedPhone?.id ?? null
    };
  });

  if (!result) {
    throw new Error("İletişim kaydı düzeltilemedi.");
  }

  return result;
}
