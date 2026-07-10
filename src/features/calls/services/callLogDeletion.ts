import type { AppDatabase } from "../../../db/db";
import { db } from "../../../db/db";
import type { AppointmentStatus, ReminderStatus } from "../../../domain/constants/statuses";
import type { CallLogRecord } from "../../../domain/models/callLog";
import { nowIso } from "../../../utils/dateTime";

export type SoftDeleteCallLogResult = {
  call_log_id: number;
  student_id: number;
  latest_call_log_id: number | null;
};

type ActiveCallLog = CallLogRecord & { id: number };

function isActiveCallLog(log: CallLogRecord): log is ActiveCallLog {
  return Boolean(log.id && !log.deleted_at);
}

function sortLatestFirst(left: ActiveCallLog, right: ActiveCallLog): number {
  return right.call_time.localeCompare(left.call_time) || right.id - left.id;
}

function resolveContactedPhoneId(log: ActiveCallLog): number | null {
  return log.contacted_phone_id ?? log.phone_snapshot?.phone_id ?? log.phone_id ?? null;
}

function isTerminalReminderStatus(status: ReminderStatus): boolean {
  return status === "completed" || status === "cancelled";
}

function isTerminalAppointmentStatus(status: AppointmentStatus): boolean {
  return status === "attended" || status === "missed" || status === "cancelled" || status === "registered";
}

async function assertCallLogCanBeSoftDeleted(callLog: ActiveCallLog, database: AppDatabase): Promise<void> {
  if (callLog.created_reminder_id) {
    const reminder = await database.reminders.get(callLog.created_reminder_id);

    if (!reminder || reminder.deleted_at) {
      throw new Error("Bu kayıt aktif bağlı iş içerdiği için silinemez.");
    }

    if (!isTerminalReminderStatus(reminder.status)) {
      throw new Error(
        "Bu kayıt açık bir hatırlatma oluşturduğu için silinemez. Önce hatırlatmayı tamamlayın veya iptal edin."
      );
    }
  }

  if (callLog.created_appointment_id) {
    const appointment = await database.appointments.get(callLog.created_appointment_id);

    if (!appointment || appointment.deleted_at) {
      throw new Error("Bu kayıt aktif bağlı iş içerdiği için silinemez.");
    }

    if (!isTerminalAppointmentStatus(appointment.status)) {
      throw new Error(
        "Bu kayıt aktif/işlenmemiş bir randevu oluşturduğu için silinemez. Önce randevu durumunu sonuçlandırın."
      );
    }
  }
}

export async function recomputeStudentSummaryFromActiveCallLogs(
  database: AppDatabase,
  studentId: number,
  timestamp: string = nowIso()
): Promise<number | null> {
  const activeLogs = (await database.call_logs.where("student_id").equals(studentId).toArray())
    .filter(isActiveCallLog)
    .sort(sortLatestFirst);
  const latestLog = activeLogs[0] ?? null;

  await database.students.update(studentId, {
    last_call_result: latestLog?.call_result ?? "not_called",
    last_contacted_at: latestLog?.call_time ?? null,
    last_contacted_phone_id: latestLog ? resolveContactedPhoneId(latestLog) : null,
    updated_at: timestamp
  });

  return latestLog?.id ?? null;
}

export async function softDeleteCallLogAndRecomputeStudentSummary(
  callLogId: number,
  database: AppDatabase = db
): Promise<SoftDeleteCallLogResult> {
  let result: SoftDeleteCallLogResult | undefined;

  await database.transaction(
    "rw",
    [database.call_logs, database.students, database.reminders, database.appointments],
    async () => {
      const callLog = await database.call_logs.get(callLogId);

      if (!callLog?.id) {
        throw new Error("Silinecek iletişim kaydı bulunamadı.");
      }

      if (callLog.deleted_at) {
        throw new Error("Bu iletişim kaydı zaten silindi.");
      }

      await assertCallLogCanBeSoftDeleted(callLog as ActiveCallLog, database);

      const student = await database.students.get(callLog.student_id);

      if (!student?.id || student.deleted_at) {
        throw new Error("İletişim kaydının bağlı olduğu aday bulunamadı.");
      }

      const timestamp = nowIso();
      await database.call_logs.update(callLog.id, {
        deleted_at: timestamp,
        updated_at: timestamp
      });

      const latestCallLogId = await recomputeStudentSummaryFromActiveCallLogs(database, student.id, timestamp);

      result = {
        call_log_id: callLog.id,
        student_id: student.id,
        latest_call_log_id: latestCallLogId
      };
    }
  );

  if (!result) {
    throw new Error("İletişim kaydı silinemedi.");
  }

  return result;
}
