import type { CallResult } from "../../../domain/constants/statuses";
import type { PhoneStatus } from "../../../domain/models/phone";

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
  past_appointment_confirm_count?: number;
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
      confirmation_type?: "appointment_note" | "past_appointment";
    };

function hasDateTime(input: CallSaveValidationInput): boolean {
  return Boolean(input.reminder_date?.trim() && input.reminder_time?.trim());
}

function createAppointmentDate(input: CallSaveValidationInput): Date | null {
  if (!hasDateTime(input)) {
    return null;
  }

  const date = new Date(`${input.reminder_date}T${input.reminder_time}:00`);

  return Number.isNaN(date.getTime()) ? null : date;
}

function isPastAppointment(input: CallSaveValidationInput): boolean {
  const appointmentDate = createAppointmentDate(input);
  const now = input.now ? new Date(input.now) : new Date();

  if (!appointmentDate || Number.isNaN(now.getTime())) {
    return false;
  }

  return appointmentDate.getTime() < now.getTime();
}

function isEligiblePhone(phone: CallSaveValidationPhone): boolean {
  return Boolean(phone.id && !phone.is_wrong && phone.phone_status !== "invalid");
}

function validatePhoneSelection(input: CallSaveValidationInput): CallSaveValidationResult | null {
  const eligiblePhones = input.phones.filter(isEligiblePhone);

  if (input.contacted_phone_id) {
    const selectedPhone = input.phones.find((phone) => phone.id === input.contacted_phone_id);

    if (!selectedPhone || !isEligiblePhone(selectedPhone)) {
      return {
        ok: false,
        severity: "error",
        message: "Yanlış numara / kullanılmıyor işaretli telefon görüşülen numara olarak seçilemez."
      };
    }

    return null;
  }

  if (eligiblePhones.length > 1) {
    return {
      ok: false,
      severity: "error",
      message: "Hangi numarayla görüşüldü? Lütfen görüşmede kullanılan telefonu seçin."
    };
  }

  return null;
}

export function validateCallSave(input: CallSaveValidationInput): CallSaveValidationResult {
  const trimmedNote = input.note?.trim() ?? "";

  if (input.call_result === "call_later" && !hasDateTime(input)) {
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

    if (isPastAppointment(input)) {
      const confirmCount = input.past_appointment_confirm_count ?? 0;

      if (confirmCount < 2) {
        return {
          ok: false,
          severity: "warning",
          confirmation_required: true,
          confirmation_type: "past_appointment",
          message:
            confirmCount === 0
              ? "Randevu tarihi geçmişte görünüyor. Bilerek kaydetmek istiyorsanız tekrar Kaydet'e basın."
              : "Randevu tarihi hâlâ geçmişte. Yine de kaydetmek için bir kez daha Kaydet'e basın."
        };
      }
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
