import { describe, expect, it } from "vitest";
import { DO_NOT_CALL_DEFAULT_NOTE, validateCallSave } from "../../src/features/calls/services/callSaveValidation";

const phone1 = { id: 1, phone_status: "active" as const, is_wrong: false };
const phone2 = { id: 2, phone_status: "active" as const, is_wrong: false };

describe("callSaveValidation", () => {
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

  it("requires a contacted phone when two eligible phones exist", () => {
    expect(validateCallSave({ call_result: "reached", phones: [phone1, phone2] })).toEqual({
      ok: false,
      severity: "error",
      message: "Hangi numarayla görüşüldü? Lütfen görüşmede kullanılan telefonu seçin."
    });
  });

  it("allows automatic phone selection when only one eligible phone exists", () => {
    expect(validateCallSave({ call_result: "reached", phones: [phone1] })).toEqual({ ok: true, note: "" });
  });
});
