import type { BaseEntity } from "./base";

export type GuardianRelationType = "guardian" | "mother" | "father";

export type GuardianRecord = BaseEntity & {
  student_id: number;
  guardian_full_name: string;
  normalized_guardian_name: string;
  relation_type?: GuardianRelationType | null;
  note?: string | null;
};
