import { createSearchText } from "../../../utils/normalizeText";

export type StudentSearchTextInput = {
  student_full_name: string;
  guardian_names?: ReadonlyArray<string | null | undefined>;
  phone_values?: ReadonlyArray<string | null | undefined>;
  current_class?: string | null;
  student_group?: string | null;
};

export function createStudentSearchText(input: StudentSearchTextInput): string {
  return createSearchText([
    input.student_full_name,
    ...(input.guardian_names ?? []),
    ...(input.phone_values ?? []),
    input.current_class,
    input.student_group
  ]);
}
