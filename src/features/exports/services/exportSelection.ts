import type { FilteredExportSnapshot } from "./exportTypes";
import { FILTERED_EXPORT_SNAPSHOT_KEY } from "./exportTypes";

export function saveFilteredExportSnapshot(input: {
  student_ids: number[];
  filter_label?: string | null;
  created_at?: string;
}) {
  if (typeof window === "undefined") {
    return;
  }

  const uniqueStudentIds = [...new Set(input.student_ids)];
  const snapshot: FilteredExportSnapshot = {
    created_at: input.created_at ?? new Date().toISOString(),
    student_count: uniqueStudentIds.length,
    filter_label: input.filter_label ?? null,
    student_ids: uniqueStudentIds
  };

  window.sessionStorage.setItem(FILTERED_EXPORT_SNAPSHOT_KEY, JSON.stringify(snapshot));
}

export function readFilteredExportSnapshot(): FilteredExportSnapshot | null {
  if (typeof window === "undefined") {
    return null;
  }

  const rawSnapshot = window.sessionStorage.getItem(FILTERED_EXPORT_SNAPSHOT_KEY);

  if (!rawSnapshot) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawSnapshot) as Partial<FilteredExportSnapshot>;

    if (!Array.isArray(parsed.student_ids)) {
      return null;
    }

    return {
      created_at: parsed.created_at ?? new Date().toISOString(),
      student_count: parsed.student_ids.length,
      filter_label: parsed.filter_label ?? null,
      student_ids: parsed.student_ids.filter((id): id is number => typeof id === "number")
    };
  } catch {
    return null;
  }
}
