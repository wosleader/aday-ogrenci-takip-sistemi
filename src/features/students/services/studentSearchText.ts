import type { GuardianRecord } from "../../../domain/models/guardian";
import type { PhoneRecord } from "../../../domain/models/phone";
import type { StudentRecord } from "../../../domain/models/student";
import { createSearchText } from "../../../utils/normalizeText";

export type StudentSearchTextInput = {
  student_full_name: string;
  guardian_names?: ReadonlyArray<string | null | undefined>;
  phone_values?: ReadonlyArray<string | null | undefined>;
  current_class?: string | null;
  student_group?: string | null;
  district?: string | null;
  neighborhood?: string | null;
};

type StudentSearchSource = Pick<
  StudentRecord,
  "student_full_name" | "current_class" | "student_group" | "district" | "neighborhood"
>;

function isActive<T extends { deleted_at?: string | null }>(record: T): boolean {
  return !record.deleted_at;
}

function byStableCreatedOrder<T extends { created_at: string; id?: number }>(left: T, right: T): number {
  return left.created_at.localeCompare(right.created_at) || (left.id ?? 0) - (right.id ?? 0);
}

export function createStudentSearchText(input: StudentSearchTextInput): string {
  return createSearchText([
    input.student_full_name,
    ...(input.guardian_names ?? []),
    ...(input.phone_values ?? []),
    input.current_class,
    input.student_group,
    input.district,
    input.neighborhood
  ]);
}

export function createStudentSearchTextFromRelations(
  student: StudentSearchSource,
  guardians: ReadonlyArray<GuardianRecord>,
  phones: ReadonlyArray<PhoneRecord>
): string {
  return createStudentSearchText({
    student_full_name: student.student_full_name,
    guardian_names: guardians
      .filter(isActive)
      .sort(byStableCreatedOrder)
      .map((guardian) => guardian.guardian_full_name),
    phone_values: phones
      .filter(isActive)
      .sort((left, right) => (left.priority ?? 0) - (right.priority ?? 0) || byStableCreatedOrder(left, right))
      .map((phone) => phone.normalized_phone_number || phone.phone_number),
    current_class: student.current_class,
    student_group: student.student_group,
    district: student.district ?? null,
    neighborhood: student.neighborhood ?? null
  });
}
