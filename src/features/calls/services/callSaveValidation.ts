import { isReminderCallResult, type CallResult } from "../../../domain/constants/statuses";
import type { PhoneStatus } from "../../../domain/models/phone";
import { createIstanbulAppointmentAt } from "../../appointments/services/guardianMessageDueTime";

export const DO_NOT_CALL_DEFAULT_NOTE = "Veli/öğrenci ilgilenmiyor";

export type CallSaveValidationPhone = {
  id?: number | null;
  phone_status?: PhoneStatus | null;
  is_wrong?: boolean;
};

export type CallSaveValidationInput = {
  call_result: CallResult;
  note?: string | null;
  reminder_date?: string | null;
  reminder_time?: string | null;
  contacted_phone_id?: number | null;
  phones: CallSaveValidationPhone[];
  allow_appointment_without_note?: boolean;
  now?: string | Date;
};

export type CallSaveValidationResult =
  | {
      ok: true;
      note: string;
    }
  | {
      ok: false;
      message: string;
      severity: "warning" | "error";
      confirmation_required?: boolean;
      confirmation_type?: "appointment_note";
    };

const CALL_RESULTS_REQUIRING_PHONE_SELECTION = new Set<CallResult>(["reached", "wrong_number"]);

export function requiresCallPhoneSelection(callResult: CallResult): boolean {
  return CALL_RESULTS_REQUIRING_PHONE_SELECTION.has(callResult);
}

function hasDateTime(input: CallSaveValidationInput): boolean {
  return Boolean(input.reminder_date?.trim() && input.reminder_time?.trim());
}

function createAppointmentDate(input: CallSaveValidationInput): Date | null {
  if (!hasDateTime(input)) {
    return null;
  }

  try {
    const date = new Date(createIstanbulAppointmentAt(input.reminder_date ?? "", input.reminder_time ?? ""));

    return Number.isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

function isPastAppointment(input: CallSaveValidationInput): boolean {
  const appointmentDate = createAppointmentDate(input);
  const now = input.now ? new Date(input.now) : new Date();

  if (!appointmentDate || Number.isNaN(now.getTime())) {
    return false;
  }

  return appointmentDate.getTime() <= now.getTime();
}

export function isSelectableCallPhone(phone: CallSaveValidationPhone): boolean {
  return Boolean(phone.id && !phone.is_wrong && phone.phone_status !== "invalid");
}

export function areAllPhonesInvalidOrWrong(phones: CallSaveValidationPhone[]): boolean {
  const existingPhones = phones.filter((phone) => Boolean(phone.id));

  return (
    existingPhones.length > 0 &&
    existingPhones.every((phone) => Boolean(phone.is_wrong) || phone.phone_status === "invalid")
  );
}

function canSaveWrongNumberWithoutPhoneContext(input: CallSaveValidationInput): boolean {
  return input.call_result === "wrong_number" && areAllPhonesInvalidOrWrong(input.phones);
}

function validatePhoneSelection(input: CallSaveValidationInput): CallSaveValidationResult | null {
  const eligiblePhones = input.phones.filter(isSelectableCallPhone);

  if (input.contacted_phone_id) {
    const selectedPhone = input.phones.find((phone) => phone.id === input.contacted_phone_id);

    if (!selectedPhone || !isSelectableCallPhone(selectedPhone)) {
      return {
        ok: false,
        severity: "error",
        message: "Yanlış numara / kullanılmıyor işaretli telefon bu kayıt için seçilemez."
      };
    }

    return null;
  }

  if (!requiresCallPhoneSelection(input.call_result)) {
    return null;
  }

  if (input.call_result === "wrong_number") {
    if (eligiblePhones.length === 0 && canSaveWrongNumberWithoutPhoneContext(input)) {
      return null;
    }

    if (eligiblePhones.length > 0) {
      return {
        ok: false,
        severity: "error",
        message: "Hangi telefonla işlem yapılacak? Lütfen bu kayıt için ilgili telefonu seçin."
      };
    }
  }

  if (eligiblePhones.length === 0) {
    return {
      ok: false,
      severity: "error",
      message: "Bu kayıt için seçilebilir telefon bulunmadı."
    };
  }

  if (eligiblePhones.length > 1) {
    return {
      ok: false,
      severity: "error",
      message: "Hangi telefonla işlem yapılacak? Lütfen bu kayıt için ilgili telefonu seçin."
    };
  }

  return null;
}

export function validateCallSave(input: CallSaveValidationInput): CallSaveValidationResult {
  const trimmedNote = input.note?.trim() ?? "";

  if (isReminderCallResult(input.call_result) && !hasDateTime(input)) {
    return {
      ok: false,
      severity: "error",
      message: "Tekrar arama için tarih ve saat seçmelisiniz."
    };
  }

  if (input.call_result === "appointment") {
    if (!hasDateTime(input)) {
      return {
        ok: false,
        severity: "error",
        message: "Randevu için tarih ve saat seçmelisiniz."
      };
    }

    if (!createAppointmentDate(input)) {
      return {
        ok: false,
        severity: "error",
        message: "Randevu tarihi/saat bilgisi geçersiz."
      };
    }

    if (isPastAppointment(input)) {
      return {
        ok: false,
        severity: "error",
        message: "Randevu tarihi/saat bilgisi gelecekte olmalıdır."
      };
    }

    if (!trimmedNote && !input.allow_appointment_without_note) {
      return {
        ok: false,
        severity: "warning",
        confirmation_required: true,
        confirmation_type: "appointment_note",
        message: "Görüşme açıklaması girmeniz faydalı olabilir. Açıklamasız kaydetmek için tekrar Kaydet'e basın."
      };
    }
  }

  const phoneValidation = validatePhoneSelection(input);

  if (phoneValidation) {
    return phoneValidation;
  }

  return {
    ok: true,
    note: input.call_result === "do_not_call" && !trimmedNote ? DO_NOT_CALL_DEFAULT_NOTE : trimmedNote
  };
}
