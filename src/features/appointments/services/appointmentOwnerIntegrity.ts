import type { AppDatabase } from "../../../db/db";
import type { CallLogRecord } from "../../../domain/models/callLog";

type ActiveCallLog = Pick<CallLogRecord, "student_id" | "call_result" | "created_appointment_id"> & { id: number };

const BROKEN_APPOINTMENT_OWNER_LINK_MESSAGE = "Bağlı kayıtlar güvenle doğrulanamadı; veri kontrolü gerekli.";

/**
 * C+ records use both ownership directions. A pending forward owner without its
 * matching call-log back-link is unsafe to mutate and must be handled manually.
 */
export async function assertPendingAppointmentOwnerLinkIntegrity(
  database: AppDatabase,
  callLog: ActiveCallLog
): Promise<void> {
  const pendingOwners = (await database.appointments.toArray()).filter(
    (appointment) =>
      !appointment.deleted_at && appointment.status === "pending" && appointment.call_log_id === callLog.id
  );

  if (pendingOwners.length === 0) {
    return;
  }

  if (pendingOwners.length !== 1) {
    throw new Error(BROKEN_APPOINTMENT_OWNER_LINK_MESSAGE);
  }

  const appointment = pendingOwners[0];

  if (
    appointment.student_id !== callLog.student_id ||
    callLog.call_result !== "appointment" ||
    callLog.created_appointment_id !== appointment.id
  ) {
    throw new Error(BROKEN_APPOINTMENT_OWNER_LINK_MESSAGE);
  }
}
