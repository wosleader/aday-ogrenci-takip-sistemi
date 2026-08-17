import type { AppDatabase } from "../../../db/db";
import type { AppointmentRecord } from "../../../domain/models/appointment";
import type { CallLogRecord } from "../../../domain/models/callLog";
import type { StudentRecord } from "../../../domain/models/student";

type ActiveCallLog = Pick<CallLogRecord, "student_id" | "call_result" | "created_appointment_id"> & { id: number };
type LifecycleOwnerCallLog = CallLogRecord & { id: number };
type ActiveStudent = StudentRecord & { id: number };
type ActivePendingAppointment = AppointmentRecord & { id: number; call_log_id: number; guardian_message_generation: number };

export const BROKEN_APPOINTMENT_OWNER_LINK_MESSAGE = "Bağlı kayıtlar güvenle doğrulanamadı; veri kontrolü gerekli.";

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function isValidIsoInstant(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value) &&
    !Number.isNaN(new Date(value).getTime())
  );
}

export type PendingAppointmentLifecycleContext = {
  appointment: ActivePendingAppointment;
  ownerCallLog: LifecycleOwnerCallLog;
  student: ActiveStudent;
};

/**
 * Lifecycle mutations accept only a current C+ pending appointment with one
 * unambiguous owner in both directions. Historical/partial data stays read-only.
 */
export async function readPendingAppointmentLifecycleContext(
  appointmentId: number,
  database: AppDatabase
): Promise<PendingAppointmentLifecycleContext> {
  if (!isPositiveInteger(appointmentId)) {
    throw new Error(BROKEN_APPOINTMENT_OWNER_LINK_MESSAGE);
  }

  const appointment = await database.appointments.get(appointmentId);

  if (
    !appointment ||
    appointment.deleted_at ||
    appointment.status !== "pending" ||
    !isPositiveInteger(appointment.id) ||
    !isPositiveInteger(appointment.call_log_id) ||
    !isPositiveInteger(appointment.guardian_message_generation) ||
    !isValidIsoInstant(appointment.appointment_at) ||
    !isValidIsoInstant(appointment.guardian_message_due_at) ||
    (appointment.guardian_message_sent_at !== null && !isValidIsoInstant(appointment.guardian_message_sent_at))
  ) {
    throw new Error(BROKEN_APPOINTMENT_OWNER_LINK_MESSAGE);
  }

  const student = await database.students.get(appointment.student_id);
  const ownerCallLog = await database.call_logs.get(appointment.call_log_id);

  if (
    !student?.id ||
    student.deleted_at ||
    !ownerCallLog?.id ||
    ownerCallLog.deleted_at ||
    ownerCallLog.student_id !== appointment.student_id ||
    ownerCallLog.call_result !== "appointment" ||
    ownerCallLog.created_appointment_id !== appointment.id
  ) {
    throw new Error(BROKEN_APPOINTMENT_OWNER_LINK_MESSAGE);
  }

  const activeAppointmentsForOwner = (await database.appointments.toArray()).filter(
    (candidate) =>
      !candidate.deleted_at &&
      candidate.call_log_id === ownerCallLog.id
  );
  const activeBacklinks = (await database.call_logs.toArray()).filter(
    (candidate) => !candidate.deleted_at && candidate.created_appointment_id === appointment.id
  );

  if (
    activeAppointmentsForOwner.length !== 1 ||
    activeAppointmentsForOwner[0]?.id !== appointment.id ||
    activeBacklinks.length !== 1 ||
    activeBacklinks[0]?.id !== ownerCallLog.id
  ) {
    throw new Error(BROKEN_APPOINTMENT_OWNER_LINK_MESSAGE);
  }

  return {
    appointment: appointment as ActivePendingAppointment,
    ownerCallLog: ownerCallLog as LifecycleOwnerCallLog,
    student: student as ActiveStudent
  };
}

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
