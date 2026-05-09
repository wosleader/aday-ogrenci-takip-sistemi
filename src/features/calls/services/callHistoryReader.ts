import type { AppDatabase } from "../../../db/db";
import { db } from "../../../db/db";
import { CALL_RESULTS } from "../../../domain/constants/statuses";

export type CallHistoryItem = {
  call_log_id: number;
  student_id: number;
  call_time: string;
  call_result: string;
  call_result_label: string;
  contacted_phone_label?: string | null;
  contacted_phone_number?: string | null;
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
    .map((log) => ({
      call_log_id: log.id!,
      student_id: log.student_id,
      call_time: log.call_time,
      call_result: log.call_result,
      call_result_label: CALL_RESULTS[log.call_result] ?? log.call_result,
      contacted_phone_label: log.contacted_phone_label ?? null,
      contacted_phone_number: log.contacted_phone_number ?? null,
      note: log.note ?? null,
      reminder_at: log.reminder_at ?? null,
      created_by: log.created_by ?? "system"
    }));
}
