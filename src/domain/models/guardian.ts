import type { BaseEntity } from "./base";

export type GuardianRecord = BaseEntity & {
  student_id: number;
  guardian_full_name: string;
  normalized_guardian_name: string;
  relation_type?: string | null;
  note?: string | null;
};
