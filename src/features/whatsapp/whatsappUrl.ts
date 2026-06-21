export type WhatsAppPhoneNormalizationResult =
  | {
      ok: true;
      normalizedPhone: string;
    }
  | {
      ok: false;
      normalizedPhone: string;
      reason: string;
    };

export function normalizeWhatsAppPhoneNumber(phoneNumber: string): WhatsAppPhoneNormalizationResult {
  const digits = phoneNumber.replace(/\D/g, "");

  if (!digits) {
    return {
      ok: false,
      normalizedPhone: "",
      reason: "Telefon numarası boş."
    };
  }

  let normalizedPhone = digits;

  if (normalizedPhone.startsWith("00")) {
    normalizedPhone = normalizedPhone.slice(2);
  }

  if (normalizedPhone.startsWith("0") && normalizedPhone.length === 11) {
    normalizedPhone = `90${normalizedPhone.slice(1)}`;
  } else if (normalizedPhone.length === 10 && normalizedPhone.startsWith("5")) {
    normalizedPhone = `90${normalizedPhone}`;
  }

  if (normalizedPhone.startsWith("90") && normalizedPhone.length === 12) {
    return {
      ok: true,
      normalizedPhone
    };
  }

  if (/^\d{8,15}$/.test(normalizedPhone)) {
    return {
      ok: true,
      normalizedPhone
    };
  }

  return {
    ok: false,
    normalizedPhone,
    reason: "Telefon numarası WhatsApp bağlantısı için uygun görünmüyor."
  };
}

export function buildWhatsAppDraftUrl(phoneNumber: string, message: string): string {
  const normalized = normalizeWhatsAppPhoneNumber(phoneNumber);

  if (!normalized.ok) {
    throw new Error(normalized.reason);
  }

  return `https://wa.me/${normalized.normalizedPhone}?text=${encodeURIComponent(message)}`;
}
