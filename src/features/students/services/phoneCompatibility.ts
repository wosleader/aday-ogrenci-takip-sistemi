import type { PhoneRecord, PhoneRelationLabel, PhoneSnapshot, PhoneStatus } from "../../../domain/models/phone";
import { normalizePhone } from "../../../utils/normalizePhone";
import { normalizeText } from "../../../utils/normalizeText";

const DEFAULT_RELATION_LABEL: PhoneRelationLabel = "Telefon";

export type LegacyPhoneFields = {
  phone_1?: string | null;
  phone_2?: string | null;
};

export type MultiPhoneCompatibilityItem = {
  id?: number | null;
  phone_number: string;
  normalized_phone_number: string;
  reference_label: string;
  relation_label: PhoneRelationLabel;
  source_column?: string | null;
  priority: number;
  status: PhoneStatus;
  is_wrong: boolean;
};

export type LegacyPhoneSlots = {
  phone_1?: MultiPhoneCompatibilityItem | null;
  phone_2?: MultiPhoneCompatibilityItem | null;
};

function normalizeRelationLabel(value?: string | null): PhoneRelationLabel {
  const normalized = normalizeText(value ?? "");

  if (normalized.includes("anne")) {
    return "Anne";
  }

  if (normalized.includes("baba")) {
    return "Baba";
  }

  if (normalized.includes("ogrenci")) {
    return "Öğrenci";
  }

  if (normalized.includes("veli")) {
    return "Veli";
  }

  if (normalized.includes("yakin")) {
    return "Yakın";
  }

  if (normalized.includes("diger")) {
    return "Diğer";
  }

  return DEFAULT_RELATION_LABEL;
}

function extractReferenceNumber(value?: string | null): number | null {
  const match = value?.match(/\d+/);

  if (!match) {
    return null;
  }

  const number = Number(match[0]);

  return Number.isFinite(number) && number > 0 ? number : null;
}

function comparePhones(left: MultiPhoneCompatibilityItem, right: MultiPhoneCompatibilityItem): number {
  return (
    left.priority - right.priority ||
    left.reference_label.localeCompare(right.reference_label, "tr") ||
    left.phone_number.localeCompare(right.phone_number, "tr")
  );
}

export function createPhoneReferenceLabel(index: number): string {
  const safeIndex = Number.isFinite(index) ? Math.floor(index) : 0;

  return safeIndex > 0 ? `Telefon ${safeIndex}` : "Telefon";
}

export function createPhoneDisplayLabel(referenceLabel: string, relationLabel?: PhoneRelationLabel | null): string {
  if (!relationLabel || relationLabel === DEFAULT_RELATION_LABEL) {
    return referenceLabel;
  }

  return `${referenceLabel} · ${relationLabel}`;
}

export function getPhoneReferenceLabel(
  phone: Pick<PhoneRecord, "reference_label" | "phone_label"> &
    Partial<Pick<PhoneRecord, "priority" | "source_column">>,
  fallbackIndex: number
): string {
  const explicitReference = phone.reference_label?.trim();

  if (explicitReference) {
    return explicitReference;
  }

  const legacyNumber = extractReferenceNumber(phone.phone_label);

  if (legacyNumber) {
    return createPhoneReferenceLabel(legacyNumber);
  }

  const priority = phone.priority;

  if (typeof priority === "number" && Number.isInteger(priority) && priority >= 1 && priority <= 10) {
    return createPhoneReferenceLabel(priority);
  }

  const sourceColumn = phone.source_column?.trim();
  const sourceSlot = sourceColumn?.match(/\b(?:telefon|phone|tel|gsm)\s*(10|[1-9])\b/i)?.[1];

  return createPhoneReferenceLabel(sourceSlot ? Number(sourceSlot) : fallbackIndex);
}

export function getPhoneRelationLabel(phone: Pick<PhoneRecord, "relation_label" | "phone_label">): PhoneRelationLabel {
  return phone.relation_label ?? normalizeRelationLabel(phone.phone_label);
}

export function createPhoneSnapshot(
  phone: Pick<
    PhoneRecord,
    "id" | "phone_number" | "phone_label" | "reference_label" | "relation_label" | "source_column"
  >,
  fallbackIndex = 1
): PhoneSnapshot {
  return {
    phone_id: phone.id ?? null,
    reference_label: getPhoneReferenceLabel(phone, fallbackIndex),
    relation_label: getPhoneRelationLabel(phone),
    phone_number: phone.phone_number,
    source_column: phone.source_column ?? null
  };
}

export function createPhonesFromLegacyFields(fields: LegacyPhoneFields): MultiPhoneCompatibilityItem[] {
  const legacyPhones = [
    { value: fields.phone_1, index: 1, source_column: "phone_1" },
    { value: fields.phone_2, index: 2, source_column: "phone_2" }
  ];
  const seen = new Set<string>();

  return legacyPhones.flatMap((legacyPhone) => {
    const normalized = normalizePhone(legacyPhone.value);

    if (!normalized.normalized_phone_number || seen.has(normalized.normalized_phone_number)) {
      return [];
    }

    seen.add(normalized.normalized_phone_number);

    return [
      {
        phone_number: normalized.phone_number,
        normalized_phone_number: normalized.normalized_phone_number,
        reference_label: createPhoneReferenceLabel(legacyPhone.index),
        relation_label: DEFAULT_RELATION_LABEL,
        source_column: legacyPhone.source_column,
        priority: legacyPhone.index,
        status: "active" as const,
        is_wrong: false
      }
    ];
  });
}

export function createCompatibilityPhoneList(phones: PhoneRecord[]): MultiPhoneCompatibilityItem[] {
  const seen = new Set<string>();

  return phones
    .filter((phone) => !phone.deleted_at)
    .map((phone, index) => {
      const normalized = normalizePhone(phone.phone_number);
      const normalizedNumber = normalized.normalized_phone_number || phone.normalized_phone_number;
      const referenceLabel = getPhoneReferenceLabel(phone, index + 1);
      const referenceNumber = extractReferenceNumber(referenceLabel) ?? index + 1;

      return {
        id: phone.id ?? null,
        phone_number: phone.phone_number,
        normalized_phone_number: normalizedNumber,
        reference_label: referenceLabel,
        relation_label: getPhoneRelationLabel(phone),
        source_column: phone.source_column ?? null,
        priority: phone.priority ?? referenceNumber,
        status: phone.phone_status ?? (phone.is_wrong ? "invalid" : "active"),
        is_wrong: Boolean(phone.is_wrong)
      };
    })
    .sort(comparePhones)
    .filter((phone) => {
      if (!phone.normalized_phone_number) {
        return false;
      }

      if (seen.has(phone.normalized_phone_number)) {
        return false;
      }

      seen.add(phone.normalized_phone_number);
      return true;
    });
}

export function getLegacyPhoneSlotsFromPhoneList(phones: MultiPhoneCompatibilityItem[]): LegacyPhoneSlots {
  const sortedPhones = [...phones].sort(comparePhones);
  const phone1 = sortedPhones.find((phone) => extractReferenceNumber(phone.reference_label) === 1) ?? sortedPhones[0] ?? null;
  const phone2 =
    sortedPhones.find((phone) => extractReferenceNumber(phone.reference_label) === 2 && phone !== phone1) ??
    sortedPhones.find((phone) => phone !== phone1) ??
    null;

  return {
    phone_1: phone1,
    phone_2: phone2
  };
}
