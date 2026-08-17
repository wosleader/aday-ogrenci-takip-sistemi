import { describe, expect, it, vi } from "vitest";
import {
  assertFutureAppointmentAt,
  calculateGuardianMessageDueTime,
  createIstanbulAppointmentAt,
  getIstanbulAppointmentInputValues
} from "../../src/features/appointments/services/guardianMessageDueTime";

describe("guardianMessageDueTime", () => {
  it("uses 24 hours for an 11:59 Istanbul appointment", () => {
    expect(calculateGuardianMessageDueTime("2026-05-10T08:59:00.000Z", "2026-05-01T00:00:00.000Z")).toMatchObject({
      dueAt: "2026-05-09T08:59:00.000Z",
      isDue: false
    });
  });

  it("uses 22 hours for a 12:00 Istanbul appointment", () => {
    expect(calculateGuardianMessageDueTime("2026-05-10T09:00:00.000Z", "2026-05-01T00:00:00.000Z")).toMatchObject({
      dueAt: "2026-05-09T11:00:00.000Z"
    });
  });

  it.each([
    ["18:59 raw due", "2026-05-11T13:59:00.000Z", "2026-05-10T15:59:00.000Z"],
    ["19:00 raw due", "2026-05-11T14:00:00.000Z", "2026-05-10T16:00:00.000Z"],
    ["19:01 raw due", "2026-05-11T14:01:00.000Z", "2026-05-10T16:00:00.000Z"]
  ])("applies the 19:00 cap for %s", (_label, appointmentAt, dueAt) => {
    expect(calculateGuardianMessageDueTime(appointmentAt, "2026-05-01T00:00:00.000Z").dueAt).toBe(dueAt);
  });

  it("handles day, month, year, and leap-day rollovers", () => {
    expect(calculateGuardianMessageDueTime("2027-01-01T08:59:00.000Z", "2026-01-01T00:00:00.000Z").dueAt).toBe(
      "2026-12-31T08:59:00.000Z"
    );
    expect(calculateGuardianMessageDueTime("2028-03-01T08:59:00.000Z", "2027-01-01T00:00:00.000Z").dueAt).toBe(
      "2028-02-29T08:59:00.000Z"
    );
  });

  it("keeps an already past due time instead of clamping it to now", () => {
    expect(calculateGuardianMessageDueTime("2026-05-11T09:00:00.000Z", "2026-05-10T12:00:00.000Z")).toEqual({
      dueAt: "2026-05-10T11:00:00.000Z",
      isDue: true
    });
  });

  it("reports exact due and future due instants", () => {
    expect(calculateGuardianMessageDueTime("2026-05-11T09:00:00.000Z", "2026-05-10T11:00:00.000Z").isDue).toBe(true);
    expect(calculateGuardianMessageDueTime("2026-05-11T09:00:00.000Z", "2026-05-10T10:59:59.000Z").isDue).toBe(false);
  });

  it("converts form date/time in the Istanbul timezone", () => {
    expect(createIstanbulAppointmentAt("2026-05-10", "12:00")).toBe("2026-05-10T09:00:00.000Z");
  });

  it.each([
    ["Istanbul midnight boundary", "2099-05-11T21:30:00.000Z", { dateValue: "2099-05-12", timeValue: "00:30" }],
    ["Istanbul late night", "2099-05-12T20:30:00.000Z", { dateValue: "2099-05-12", timeValue: "23:30" }]
  ])("formats %s with explicit Istanbul input values", (_label, appointmentAt, expected) => {
    expect(getIstanbulAppointmentInputValues(appointmentAt)).toEqual(expected);
  });

  it("rejects invalid instant and local form inputs", () => {
    expect(() => calculateGuardianMessageDueTime("2026-05-10 09:00", "2026-05-01T00:00:00.000Z")).toThrow(
      "geçersiz"
    );
    expect(() => createIstanbulAppointmentAt("2026-02-31", "12:00")).toThrow("geçersiz");
  });

  it("accepts only an appointment instant strictly after the current instant", () => {
    const now = "2026-05-10T09:00:00.000Z";

    expect(assertFutureAppointmentAt("2026-05-10T09:01:00.000Z", now)).toBe("2026-05-10T09:01:00.000Z");
    expect(() => assertFutureAppointmentAt(now, now)).toThrow("gelecekte");
    expect(() => assertFutureAppointmentAt("2026-05-10T08:59:59.000Z", now)).toThrow("gelecekte");
  });

  it("does not depend on the browser timezone", () => {
    const expected = calculateGuardianMessageDueTime("2026-05-11T14:01:00.000Z", "2026-05-01T00:00:00.000Z");
    vi.stubEnv("TZ", "America/New_York");
    expect(calculateGuardianMessageDueTime("2026-05-11T14:01:00.000Z", "2026-05-01T00:00:00.000Z")).toEqual(expected);
    vi.unstubAllEnvs();
  });

  it("keeps appointment form values in Istanbul when the runtime timezone differs", () => {
    vi.stubEnv("TZ", "America/New_York");

    expect(getIstanbulAppointmentInputValues("2099-05-11T21:30:00.000Z")).toEqual({
      dateValue: "2099-05-12",
      timeValue: "00:30"
    });

    vi.unstubAllEnvs();
  });
});
