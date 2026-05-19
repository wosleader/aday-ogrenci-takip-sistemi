import type { BaseEntity } from "./base";

export type PhoneStatus = "active" | "contacted" | "invalid";
export type PhoneRelationLabel = "Telefon" | "Anne" | "Baba" | "Öğrenci" | "Veli" | "Yakın" | "Diğer";
export type PhoneOperationalStatus =
  | PhoneStatus
  | "not_reached"
  | "reached"
  | "wrong_number"
  | "unused"
  | "unavailable"
  | "call_later"
  | "passive";

export type PhoneSnapshot = {
  phone_id?: number | null;
  reference_label: string;
  relation_label?: PhoneRelationLabel | null;
  phone_number: string;
  source_column?: string | null;
};

export type PhoneRecord = BaseEntity & {
  student_id: number;
  guardian_id?: number | null;
  phone_number: string;
  normalized_phone_number: string;
  original_phone_value?: string | null;
  phone_label?: string | null;
  reference_label?: string | null;
  relation_label?: PhoneRelationLabel | null;
  source_column?: string | null;
  priority?: number | null;
  phone_status?: PhoneStatus;
  is_valid: boolean;
  is_wrong: boolean;
  is_primary: boolean;
  note?: string | null;
};
