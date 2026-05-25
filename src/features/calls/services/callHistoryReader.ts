import type { AppDatabase } from "../../../db/db";
import { db } from "../../../db/db";
import { CALL_RESULTS } from "../../../domain/constants/statuses";
import { createPhoneSnapshotDisplayLabel } from "./callLogPhoneContext";

export type CallHistoryItem = {
  call_log_id: number;
  student_id: number;
  call_time: string;
  call_result: string;
  call_result_label: string;
  contacted_phone_label?: string | null;
  contacted_phone_number?: string | null;
  phone_context_label?: string | null;
  phone_context_number?: string | null;
  note?: string | null;
  reminder_at?: string | null;
  created_by?: string | null;
};

export async function readCallHistoryForStudent(
  studentId: number,
  database: AppDatabase = db
): Promise<CallHistoryItem[]> {
  const logs = await database.call_logs.where("student_id").equals(studentId).toArray();

  return logs
    .filter((log) => !log.deleted_at && log.id)
    .sort((left, right) => right.call_time.localeCompare(left.call_time) || (right.id ?? 0) - (left.id ?? 0))
    .map((log) => {
      const snapshotLabel = createPhoneSnapshotDisplayLabel(log.phone_snapshot, "");
      const snapshotNumber = log.phone_snapshot?.phone_number?.trim() || null;
      const legacyLabel = log.contacted_phone_label?.trim() || null;
      const legacyNumber = log.contacted_phone_number?.trim() || null;

      return {
        call_log_id: log.id!,
        student_id: log.student_id,
        call_time: log.call_time,
        call_result: log.call_result,
        call_result_label: CALL_RESULTS[log.call_result] ?? log.call_result,
        contacted_phone_label: log.contacted_phone_label ?? null,
        contacted_phone_number: log.contacted_phone_number ?? null,
        phone_context_label: snapshotLabel || legacyLabel,
        phone_context_number: snapshotNumber || legacyNumber,
        note: log.note ?? null,
        reminder_at: log.reminder_at ?? null,
        created_by: log.created_by ?? "system"
      };
    });
}
