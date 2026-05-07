import type { BaseEntity } from "./base";

export type PhoneRecord = BaseEntity & {
  student_id: number;
  guardian_id?: number | null;
  phone_number: string;
  normalized_phone_number: string;
  original_phone_value?: string | null;
  phone_label?: string | null;
  is_valid: boolean;
  is_wrong: boolean;
  is_primary: boolean;
  note?: string | null;
};
