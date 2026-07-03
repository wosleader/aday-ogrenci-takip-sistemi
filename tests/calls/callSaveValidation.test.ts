import { describe, expect, it } from "vitest";
import {
  DO_NOT_CALL_DEFAULT_NOTE,
  validateCallSave,
  type CallSaveValidationInput
} from "../../src/features/calls/services/callSaveValidation";

const phone1 = { id: 1, phone_status: "active" as const, is_wrong: false };
const phone2 = { id: 2, phone_status: "active" as const, is_wrong: false };

describe("callSaveValidation", () => {
  const phoneSelectionMessage = "Hangi telefonla işlem yapılacak? Lütfen bu kayıt için ilgili telefonu seçin.";

  it("allows call_later without note when date and time exist", () => {
    expect(
      validateCallSave({
        call_result: "call_later",
        note: "",
        reminder_date: "2026-05-12",
        reminder_time: "11:00",
        contacted_phone_id: 1,
        phones: [phone1, phone2]
      })
    ).toEqual({ ok: true, note: "" });
  });

  it("requires date and time for call_later", () => {
    expect(
      validateCallSave({
        call_result: "call_later",
        contacted_phone_id: 1,
        phones: [phone1]
      })
    ).toEqual({
      ok: false,
      severity: "error",
      message: "Tekrar arama için tarih ve saat seçmelisiniz."
    });
  });

  it("warns on first appointment save without note", () => {
    expect(
      validateCallSave({
        call_result: "appointment",
        reminder_date: "2026-05-12",
        reminder_time: "11:00",
        now: "2026-05-10T10:00:00",
        contacted_phone_id: 1,
        phones: [phone1]
      })
    ).toEqual({
      ok: false,
      severity: "warning",
      confirmation_required: true,
      confirmation_type: "appointment_note",
      message: "Görüşme açıklaması girmeniz faydalı olabilir. Açıklamasız kaydetmek için tekrar Kaydet'e basın."
    });
  });

  it("allows second appointment save without note after confirmation", () => {
    expect(
      validateCallSave({
        call_result: "appointment",
        reminder_date: "2026-05-12",
        reminder_time: "11:00",
        now: "2026-05-10T10:00:00",
        contacted_phone_id: 1,
        phones: [phone1],
        allow_appointment_without_note: true
      })
    ).toEqual({ ok: true, note: "" });
  });

  it("requires date and time for appointment", () => {
    expect(
      validateCallSave({
        call_result: "appointment",
        contacted_phone_id: 1,
        phones: [phone1]
      })
    ).toEqual({
      ok: false,
      severity: "error",
      message: "Randevu için tarih ve saat seçmelisiniz."
    });
  });

  it("warns twice before allowing an appointment in the past", () => {
    const input = {
      call_result: "appointment" as const,
      reminder_date: "2026-05-09",
      reminder_time: "11:00",
      now: "2026-05-10T10:00:00",
      note: "Randevu notu",
      contacted_phone_id: 1,
      phones: [phone1]
    };

    expect(validateCallSave({ ...input, past_appointment_confirm_count: 0 })).toEqual({
      ok: false,
      severity: "warning",
      confirmation_required: true,
      confirmation_type: "past_appointment",
      message: "Randevu tarihi geçmişte görünüyor. Bilerek kaydetmek istiyorsanız tekrar Kaydet'e basın."
    });
    expect(validateCallSave({ ...input, past_appointment_confirm_count: 1 })).toEqual({
      ok: false,
      severity: "warning",
      confirmation_required: true,
      confirmation_type: "past_appointment",
      message: "Randevu tarihi hâlâ geçmişte. Yine de kaydetmek için bir kez daha Kaydet'e basın."
    });
    expect(validateCallSave({ ...input, past_appointment_confirm_count: 2 })).toEqual({
      ok: true,
      note: "Randevu notu"
    });
  });

  it("allows future appointment date without past-date warning", () => {
    expect(
      validateCallSave({
        call_result: "appointment",
        reminder_date: "2026-05-12",
        reminder_time: "11:00",
        now: "2026-05-10T10:00:00",
        note: "Randevu notu",
        contacted_phone_id: 1,
        phones: [phone1]
      })
    ).toEqual({ ok: true, note: "Randevu notu" });
  });

  it("checks missing appointment date before past-date confirmation", () => {
    expect(
      validateCallSave({
        call_result: "appointment",
        reminder_time: "11:00",
        now: "2026-05-10T10:00:00",
        past_appointment_confirm_count: 2,
        note: "Randevu notu",
        contacted_phone_id: 1,
        phones: [phone1]
      })
    ).toEqual({
      ok: false,
      severity: "error",
      message: "Randevu için tarih ve saat seçmelisiniz."
    });
  });

  it("does not require note or date for wrong_number and registered", () => {
    expect(validateCallSave({ call_result: "wrong_number", contacted_phone_id: 1, phones: [phone1] })).toEqual({
      ok: true,
      note: ""
    });
    expect(validateCallSave({ call_result: "registered", contacted_phone_id: 1, phones: [phone1] })).toEqual({
      ok: true,
      note: ""
    });
  });

  it("adds an automatic note for do_not_call when note is empty", () => {
    expect(validateCallSave({ call_result: "do_not_call", contacted_phone_id: 1, phones: [phone1] })).toEqual({
      ok: true,
      note: DO_NOT_CALL_DEFAULT_NOTE
    });
  });

  it("does not require phone selection for non-contact results when multiple eligible phones exist", () => {
    const optionalPhoneCases: Array<{
      callResult: CallSaveValidationInput["call_result"];
      extraInput?: Partial<CallSaveValidationInput>;
      expectedNote?: string;
    }> = [
      { callResult: "not_reached" },
      { callResult: "not_called" },
      { callResult: "call_later", extraInput: { reminder_date: "2026-05-12", reminder_time: "11:00" } },
      {
        callResult: "appointment",
        extraInput: {
          reminder_date: "2026-05-12",
          reminder_time: "11:00",
          note: "Randevu notu",
          now: "2026-05-10T10:00:00"
        },
        expectedNote: "Randevu notu"
      },
      { callResult: "do_not_call", expectedNote: DO_NOT_CALL_DEFAULT_NOTE },
      { callResult: "not_interested" },
      { callResult: "registered" }
    ];

    for (const testCase of optionalPhoneCases) {
      const result = validateCallSave({
        call_result: testCase.callResult,
        phones: [phone1, phone2],
        ...testCase.extraInput
      });

      expect(result).toEqual({ ok: true, note: testCase.expectedNote ?? "" });
    }
  });

  it("requires a phone context for reached when two eligible phones exist", () => {
    expect(validateCallSave({ call_result: "reached", phones: [phone1, phone2] })).toEqual({
      ok: false,
      severity: "error",
      message: phoneSelectionMessage
    });
  });

  it("requires a phone context for wrong_number when eligible phones exist", () => {
    expect(validateCallSave({ call_result: "wrong_number", phones: [phone1] })).toEqual({
      ok: false,
      severity: "error",
      message: phoneSelectionMessage
    });
    expect(validateCallSave({ call_result: "wrong_number", phones: [phone1, phone2] })).toEqual({
      ok: false,
      severity: "error",
      message: phoneSelectionMessage
    });
  });

  it("allows wrong_number without phone context when all existing phones are invalid or wrong", () => {
    expect(
      validateCallSave({
        call_result: "wrong_number",
        phones: [
          { ...phone1, phone_status: "invalid", is_wrong: true },
          { ...phone2, phone_status: "invalid", is_wrong: true }
        ]
      })
    ).toEqual({ ok: true, note: "" });
  });

  it("still requires a selectable phone for wrong_number when no phone exists", () => {
    expect(validateCallSave({ call_result: "wrong_number", phones: [] })).toEqual({
      ok: false,
      severity: "error",
      message: "Bu kayıt için seçilebilir telefon bulunmadı."
    });
  });

  it("still blocks reached when all existing phones are invalid or wrong", () => {
    expect(
      validateCallSave({
        call_result: "reached",
        phones: [{ ...phone1, phone_status: "invalid", is_wrong: true }]
      })
    ).toEqual({
      ok: false,
      severity: "error",
      message: "Bu kayıt için seçilebilir telefon bulunmadı."
    });
  });

  it("does not use görüşüldü wording in the phone selection error", () => {
    const result = validateCallSave({ call_result: "reached", phones: [phone1, phone2] });

    expect(result).toMatchObject({
      ok: false,
      message: phoneSelectionMessage
    });
    expect(result.ok ? "" : result.message.toLocaleLowerCase("tr-TR")).not.toContain("görüş");
  });

  it("rejects a selected wrong or unusable phone for any call result", () => {
    expect(
      validateCallSave({
        call_result: "not_reached",
        contacted_phone_id: 1,
        phones: [{ ...phone1, phone_status: "invalid", is_wrong: true }]
      })
    ).toEqual({
      ok: false,
      severity: "error",
      message: "Yanlış numara / kullanılmıyor işaretli telefon bu kayıt için seçilemez."
    });
  });

  it("allows automatic phone selection when only one eligible phone exists", () => {
    expect(validateCallSave({ call_result: "reached", phones: [phone1] })).toEqual({ ok: true, note: "" });
  });
});
