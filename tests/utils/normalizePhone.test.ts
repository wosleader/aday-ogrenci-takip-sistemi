import { describe, expect, it } from "vitest";
import { normalizePhone } from "../../src/utils/normalizePhone";

describe("normalizePhone", () => {
  it("converts +90 GSM numbers to leading-zero format", () => {
    expect(normalizePhone("+90 532 123 45 67")).toEqual({
      phone_number: "05321234567",
      normalized_phone_number: "05321234567",
      is_valid: true
    });
  });

  it("adds a leading zero to 10 digit GSM numbers", () => {
    expect(normalizePhone("5321234567").normalized_phone_number).toBe("05321234567");
  });

  it("marks incomplete phone values invalid", () => {
    expect(normalizePhone("12345").is_valid).toBe(false);
  });
});
