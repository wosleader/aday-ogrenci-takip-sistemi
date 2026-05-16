import type { AppDatabase } from "../../../db/db";
import { db } from "../../../db/db";
import { CALL_RESULTS } from "../../../domain/constants/statuses";
import type { CallLogRecord } from "../../../domain/models/callLog";
import type { GuardianRecord } from "../../../domain/models/guardian";
import {
  createReminderTaskSummary,
  readReminderTaskRows,
  type ReminderTaskSummary
} from "../../reminders/services/reminderListReader";

export type DailyReportSummary = {
  unique_student_count: number;
  call_log_count: number;
  reached_count: number;
  not_reached_count: number;
  call_later_count: number;
  appointment_count: number;
  registered_count: number;
  do_not_call_count: number;
  wrong_number_count: number;
};

export type DailyReportRecentCallRow = {
  call_log_id: number;
  student_id: number;
  call_time: string;
  call_time_label: string;
  student_full_name: string;
  guardian_full_name?: string | null;
  call_result: string;
  call_result_label: string;
  note_preview?: string | null;
};

export type DailyReport = {
  selected_date: string;
  day_start: string;
  day_end: string;
  summary: DailyReportSummary;
  recent_calls: DailyReportRecentCallRow[];
  reminder_summary: ReminderTaskSummary;
};

export type DailyReportReaderOptions = {
  database?: AppDatabase;
  now?: string | Date;
};

export type LocalDayRange = {
  date_input_value: string;
  start: Date;
  end: Date;
  start_iso: string;
  end_iso: string;
};

const EMPTY_SUMMARY: DailyReportSummary = {
  unique_student_count: 0,
  call_log_count: 0,
  reached_count: 0,
  not_reached_count: 0,
  call_later_count: 0,
  appointment_count: 0,
  registered_count: 0,
  do_not_call_count: 0,
  wrong_number_count: 0
};

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}

function parseSelectedDate(value: string | Date): Date {
  if (value instanceof Date) {
    return value;
  }

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? new Date() : date;
}

export function createLocalDayRange(selectedDate: string | Date): LocalDayRange {
  const date = parseSelectedDate(selectedDate);
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
  const dateInputValue = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`;

  return {
    date_input_value: dateInputValue,
    start,
    end,
    start_iso: start.toISOString(),
    end_iso: end.toISOString()
  };
}

export function getTodayInputValue(now: Date = new Date()): string {
  return createLocalDayRange(now).date_input_value;
}

function isActive<T extends { deleted_at?: string | null }>(record: T): boolean {
  return !record.deleted_at;
}

function getCallLogTime(callLog: CallLogRecord): string {
  return callLog.call_time || callLog.created_at;
}

function isCallLogInRange(callLog: CallLogRecord, range: LocalDayRange): boolean {
  const callTime = new Date(getCallLogTime(callLog)).getTime();

  return Number.isFinite(callTime) && callTime >= range.start.getTime() && callTime <= range.end.getTime();
}

function formatTimeLabel(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function createNotePreview(note?: string | null): string | null {
  const trimmedNote = note?.trim();

  if (!trimmedNote) {
    return null;
  }

  const compactNote = trimmedNote.replace(/\s+/g, " ");

  return compactNote.length > 84 ? `${compactNote.slice(0, 81)}...` : compactNote;
}

function groupGuardiansByStudent(guardians: GuardianRecord[]): Map<number, GuardianRecord[]> {
  const grouped = new Map<number, GuardianRecord[]>();

  for (const guardian of guardians.filter(isActive)) {
    grouped.set(guardian.student_id, [...(grouped.get(guardian.student_id) ?? []), guardian]);
  }

  return grouped;
}

function pickGuardian(guardians: GuardianRecord[]): GuardianRecord | undefined {
  return [...guardians].sort(
    (left, right) => left.created_at.localeCompare(right.created_at) || (left.id ?? 0) - (right.id ?? 0)
  )[0];
}

function sortCallLogsDesc(left: CallLogRecord, right: CallLogRecord): number {
  return getCallLogTime(right).localeCompare(getCallLogTime(left)) || (right.id ?? 0) - (left.id ?? 0);
}

export function createDailyReportSummary(callLogs: CallLogRecord[]): DailyReportSummary {
  const uniqueStudentIds = new Set(callLogs.map((callLog) => callLog.student_id));

  return callLogs.reduce<DailyReportSummary>(
    (summary, callLog) => {
      if (callLog.call_result === "reached") {
        summary.reached_count += 1;
      }

      if (callLog.call_result === "not_reached") {
        summary.not_reached_count += 1;
      }

      if (callLog.call_result === "call_later") {
        summary.call_later_count += 1;
      }

      if (callLog.call_result === "appointment") {
        summary.appointment_count += 1;
      }

      if (callLog.call_result === "registered") {
        summary.registered_count += 1;
      }

      if (callLog.call_result === "do_not_call" || callLog.call_result === "not_interested") {
        summary.do_not_call_count += 1;
      }

      if (callLog.call_result === "wrong_number") {
        summary.wrong_number_count += 1;
      }

      return summary;
    },
    {
      ...EMPTY_SUMMARY,
      unique_student_count: uniqueStudentIds.size,
      call_log_count: callLogs.length
    }
  );
}

export function getRecentDailyCallRows(
  callLogs: Array<CallLogRecord & { id: number }>,
  studentsById: Map<number, { student_full_name: string }>,
  guardiansByStudent: Map<number, GuardianRecord[]>,
  limit = 10
): DailyReportRecentCallRow[] {
  return [...callLogs]
    .sort(sortCallLogsDesc)
    .slice(0, limit)
    .map((callLog) => {
      const callTime = getCallLogTime(callLog);
      const student = studentsById.get(callLog.student_id);
      const guardian = pickGuardian(guardiansByStudent.get(callLog.student_id) ?? []);

      return {
        call_log_id: callLog.id,
        student_id: callLog.student_id,
        call_time: callTime,
        call_time_label: formatTimeLabel(callTime),
        student_full_name: student?.student_full_name ?? "Aday bulunamadı",
        guardian_full_name: guardian?.guardian_full_name ?? null,
        call_result: callLog.call_result,
        call_result_label: CALL_RESULTS[callLog.call_result] ?? callLog.call_result,
        note_preview: createNotePreview(callLog.note)
      };
    });
}

export async function readDailyReport(
  selectedDate: string | Date = new Date(),
  options: DailyReportReaderOptions = {}
): Promise<DailyReport> {
  const database = options.database ?? db;
  const dayRange = createLocalDayRange(selectedDate);
  const [callLogs, students, guardians, reminderRows] = await Promise.all([
    database.call_logs.toArray(),
    database.students.toArray(),
    database.guardians.toArray(),
    readReminderTaskRows(
      options.now instanceof Date ? options.now.toISOString() : options.now ?? new Date().toISOString(),
      database
    )
  ]);
  const activeStudentsById = new Map(
    students.filter(isActive).flatMap((student) => (student.id ? [[student.id, student]] : []))
  );
  const guardiansByStudent = groupGuardiansByStudent(guardians);
  const dailyCallLogs = callLogs
    .filter(isActive)
    .flatMap((callLog) => (callLog.id ? [callLog as CallLogRecord & { id: number }] : []))
    .filter((callLog) => isCallLogInRange(callLog, dayRange));

  return {
    selected_date: dayRange.date_input_value,
    day_start: dayRange.start_iso,
    day_end: dayRange.end_iso,
    summary: createDailyReportSummary(dailyCallLogs),
    recent_calls: getRecentDailyCallRows(dailyCallLogs, activeStudentsById, guardiansByStudent, 10),
    reminder_summary: createReminderTaskSummary(reminderRows)
  };
}
