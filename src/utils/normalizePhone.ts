export type NormalizedPhone = {
  phone_number: string;
  normalized_phone_number: string;
  is_valid: boolean;
};

export function normalizePhone(value: string | number | null | undefined): NormalizedPhone {
  const original = value == null ? "" : String(value);
  let digits = original.replace(/\D/g, "");

  if (digits.startsWith("0090")) {
    digits = digits.slice(4);
  }

  if (digits.startsWith("90")) {
    digits = digits.slice(2);
  }

  if (digits.length === 10 && digits.startsWith("5")) {
    digits = `0${digits}`;
  }

  if (digits.length === 11 && digits.startsWith("0")) {
    return {
      phone_number: digits,
      normalized_phone_number: digits,
      is_valid: /^05\d{9}$/.test(digits)
    };
  }

  return {
    phone_number: digits,
    normalized_phone_number: digits,
    is_valid: false
  };
}
