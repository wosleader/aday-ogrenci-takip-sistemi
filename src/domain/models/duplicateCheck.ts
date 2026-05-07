export type DuplicateCheckRecord = {
  id?: number;
  duplicate_type: "phone" | "student_guardian" | "student_name";
  duplicate_value: string;
  severity: "info" | "warning" | "danger";
  count: number;
  related_student_ids: number[];
  created_at: string;
};
