import type { AppDatabase } from "../../../db/db";
import { db } from "../../../db/db";
import type { AppointmentStatus } from "../../../domain/constants/statuses";
import { createLocalDayRange } from "./dailyReportReader";
import type { DashboardDateRange } from "./dashboardDateRange";

export type DashboardAppointmentSummary = {
  total: number;
  pending: number;
  attended: number;
  noShow: number;
  cancelled: number;
  postponed: number;
  registered: number;
};

const EMPTY_SUMMARY: DashboardAppointmentSummary = {
  total: 0,
  pending: 0,
  attended: 0,
  noShow: 0,
  cancelled: 0,
  postponed: 0,
  registered: 0
};

function normalizeAppointmentStatus(status: AppointmentStatus): keyof Omit<DashboardAppointmentSummary, "total"> | null {
  switch (status) {
    case "pending":
      return "pending";
    case "completed":
    case "attended":
      return "attended";
    case "no_show":
    case "missed":
      return "noShow";
    case "cancelled":
      return "cancelled";
    case "postponed":
      return "postponed";
    case "registered":
      return "registered";
    default:
      return null;
  }
}

export async function readDashboardAppointmentSummary(
  range: DashboardDateRange,
  database: AppDatabase = db
): Promise<DashboardAppointmentSummary> {
  const appointments = await database.appointments
    .where("appointment_at")
    .between(range.start_iso, range.end_iso, true, true)
    .toArray();
  const summary: DashboardAppointmentSummary = { ...EMPTY_SUMMARY };

  for (const appointment of appointments) {
    if (appointment.deleted_at) {
      continue;
    }

    const bucket = normalizeAppointmentStatus(appointment.status);
    if (!bucket) {
      continue;
    }

    summary.total += 1;
    summary[bucket] += 1;
  }

  return summary;
}

export async function readTodayPendingAppointmentCount(
  now: string | Date = new Date(),
  database: AppDatabase = db
): Promise<number> {
  const day = createLocalDayRange(now instanceof Date ? now : new Date(now));
  const appointments = await database.appointments
    .where("appointment_at")
    .between(day.start_iso, day.end_iso, true, true)
    .toArray();

  return appointments.filter((appointment) => !appointment.deleted_at && appointment.status === "pending").length;
}
