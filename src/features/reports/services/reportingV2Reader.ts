import { db as defaultDb, type AppDatabase } from "../../../db/db";
import { CALL_RESULTS, type CallResult } from "../../../domain/constants/statuses";
import type { CallLogRecord } from "../../../domain/models/callLog";
import type { CampaignRecord } from "../../../domain/models/campaign";
import type { StudentRecord } from "../../../domain/models/student";
import { createLocalDayRange } from "./dailyReportReader";

type StoredCallLog = CallLogRecord & { id: number };
type StoredCampaign = CampaignRecord & { id: number };
type StoredStudent = StudentRecord & { id: number };

const REPORTING_CALL_RESULTS = Object.keys(CALL_RESULTS) as CallResult[];
const LEGACY_CAMPAIGN_FALLBACK = "Kampanyasız / Eski kampanya";
const DEFAULT_CAMPAIGN_NAME = "Diğer";

export type ReportingV2Filters = {
  fromDate: string;
  toDate: string;
  campaignId: number | null;
  campaignName: string | null;
};

export type ReportingV2Totals = {
  totalCallLogs: number;
  uniqueStudentsWithCallLogs: number;
  notCalled: number;
  notReached: number;
  reached: number;
  callLater: number;
  appointmentResults: number;
  doNotCall: number;
  wrongNumber: number;
  registeredResults: number;
  notInterested: number;
};

export type ReportingV2CallResultBreakdown = {
  callResult: CallResult;
  label: string;
  count: number;
};

export type ReportingV2CampaignBreakdown = {
  campaignId: number | null;
  campaignName: string;
  totalCallLogs: number;
  uniqueStudentsWithCallLogs: number;
  byCallResult: ReportingV2CallResultBreakdown[];
};

export type ReportingV2DailyTrendRow = {
  date: string;
  totalCallLogs: number;
  uniqueStudentsWithCallLogs: number;
  appointmentResults: number;
  registeredResults: number;
};

export type ReportingV2Summary = {
  filters: ReportingV2Filters;
  totals: ReportingV2Totals;
  byCallResult: ReportingV2CallResultBreakdown[];
  byCampaign: ReportingV2CampaignBreakdown[];
  dailyTrend: ReportingV2DailyTrendRow[];
};

export type ReadReportingV2SummaryOptions = {
  fromDate: string;
  toDate: string;
  campaignId?: number | null;
  database?: AppDatabase;
};

type ReportingRow = {
  callLog: StoredCallLog;
  callDate: string;
  studentId: number;
  campaignId: number | null;
  campaignName: string;
};

const createEmptyTotals = (): ReportingV2Totals => ({
  totalCallLogs: 0,
  uniqueStudentsWithCallLogs: 0,
  notCalled: 0,
  notReached: 0,
  reached: 0,
  callLater: 0,
  appointmentResults: 0,
  doNotCall: 0,
  wrongNumber: 0,
  registeredResults: 0,
  notInterested: 0,
});

const isActive = <T extends { deleted_at?: string | null }>(record: T) => !record.deleted_at;

const getCallLogTime = (callLog: CallLogRecord) => callLog.call_time || callLog.created_at;

const normalizeDateRange = (fromDate: string, toDate: string) => {
  const from = createLocalDayRange(fromDate);
  const to = createLocalDayRange(toDate);

  if (from.start.getTime() <= to.end.getTime()) {
    return {
      fromDate: from.date_input_value,
      toDate: to.date_input_value,
      start: from.start,
      end: to.end,
    };
  }

  return {
    fromDate: to.date_input_value,
    toDate: from.date_input_value,
    start: to.start,
    end: from.end,
  };
};

const getLocalDateInputValue = (value: string) => createLocalDayRange(value).date_input_value;

const incrementTotal = (totals: ReportingV2Totals, callResult: CallResult) => {
  totals.totalCallLogs += 1;

  switch (callResult) {
    case "not_called":
      totals.notCalled += 1;
      break;
    case "not_reached":
      totals.notReached += 1;
      break;
    case "reached":
      totals.reached += 1;
      break;
    case "call_later":
      totals.callLater += 1;
      break;
    case "appointment":
      totals.appointmentResults += 1;
      break;
    case "do_not_call":
      totals.doNotCall += 1;
      break;
    case "wrong_number":
      totals.wrongNumber += 1;
      break;
    case "registered":
      totals.registeredResults += 1;
      break;
    case "not_interested":
      totals.notInterested += 1;
      break;
  }
};

const createCallResultBreakdown = (callLogs: StoredCallLog[]): ReportingV2CallResultBreakdown[] =>
  REPORTING_CALL_RESULTS.map((callResult) => ({
    callResult,
    label: CALL_RESULTS[callResult],
    count: callLogs.filter((callLog) => callLog.call_result === callResult).length,
  }));

const getCampaignName = (
  student: StoredStudent | undefined,
  activeCampaignsById: Map<number, StoredCampaign>
) => {
  if (!student?.campaign_id) {
    return { campaignId: null, campaignName: DEFAULT_CAMPAIGN_NAME };
  }

  const campaign = activeCampaignsById.get(student.campaign_id);
  if (!campaign) {
    return { campaignId: student.campaign_id, campaignName: LEGACY_CAMPAIGN_FALLBACK };
  }

  return { campaignId: campaign.id, campaignName: campaign.name };
};

const createCampaignBreakdown = (rows: ReportingRow[]): ReportingV2CampaignBreakdown[] => {
  const groups = new Map<string, ReportingRow[]>();

  for (const row of rows) {
    const key = row.campaignId === null ? "null" : String(row.campaignId);
    const existing = groups.get(key);
    if (existing) {
      existing.push(row);
    } else {
      groups.set(key, [row]);
    }
  }

  return Array.from(groups.values())
    .map((groupRows) => {
      const sample = groupRows[0];
      const studentIds = new Set(groupRows.map((row) => row.studentId));

      return {
        campaignId: sample.campaignId,
        campaignName: sample.campaignName,
        totalCallLogs: groupRows.length,
        uniqueStudentsWithCallLogs: studentIds.size,
        byCallResult: createCallResultBreakdown(groupRows.map((row) => row.callLog)),
      };
    })
    .sort((a, b) => b.totalCallLogs - a.totalCallLogs || a.campaignName.localeCompare(b.campaignName));
};

const createDailyTrend = (rows: ReportingRow[], fromDate: string, toDate: string): ReportingV2DailyTrendRow[] => {
  const rowsByDate = new Map<string, ReportingRow[]>();
  for (const row of rows) {
    const existing = rowsByDate.get(row.callDate);
    if (existing) {
      existing.push(row);
    } else {
      rowsByDate.set(row.callDate, [row]);
    }
  }

  const trend: ReportingV2DailyTrendRow[] = [];
  const cursor = createLocalDayRange(fromDate).start;
  const end = createLocalDayRange(toDate).start;

  while (cursor.getTime() <= end.getTime()) {
    const date = createLocalDayRange(cursor).date_input_value;
    const dayRows = rowsByDate.get(date) ?? [];
    const uniqueStudents = new Set(dayRows.map((row) => row.studentId));

    trend.push({
      date,
      totalCallLogs: dayRows.length,
      uniqueStudentsWithCallLogs: uniqueStudents.size,
      appointmentResults: dayRows.filter((row) => row.callLog.call_result === "appointment").length,
      registeredResults: dayRows.filter((row) => row.callLog.call_result === "registered").length,
    });

    cursor.setDate(cursor.getDate() + 1);
  }

  return trend;
};

export const readReportingV2Summary = async ({
  fromDate,
  toDate,
  campaignId = null,
  database = defaultDb,
}: ReadReportingV2SummaryOptions): Promise<ReportingV2Summary> => {
  const range = normalizeDateRange(fromDate, toDate);
  const [allCallLogs, allStudents, allCampaigns] = await Promise.all([
    database.call_logs.toArray(),
    database.students.toArray(),
    database.campaigns.toArray(),
  ]);

  const studentsById = new Map(
    (allStudents as StoredStudent[]).filter((student) => typeof student.id === "number").map((student) => [student.id, student])
  );
  const activeCampaignsById = new Map(
    (allCampaigns as StoredCampaign[])
      .filter((campaign) => typeof campaign.id === "number" && isActive(campaign) && campaign.is_active)
      .map((campaign) => [campaign.id, campaign])
  );
  const selectedCampaign =
    campaignId === null || campaignId === undefined ? null : activeCampaignsById.get(campaignId) ?? null;

  const rows = (allCallLogs as StoredCallLog[])
    .filter(isActive)
    .filter((callLog) => {
      const callTime = getCallLogTime(callLog);
      const parsedTime = new Date(callTime).getTime();
      return parsedTime >= range.start.getTime() && parsedTime <= range.end.getTime();
    })
    .map((callLog): ReportingRow => {
      const student = studentsById.get(callLog.student_id);
      const campaign = getCampaignName(student, activeCampaignsById);

      return {
        callLog,
        callDate: getLocalDateInputValue(getCallLogTime(callLog)),
        studentId: callLog.student_id,
        campaignId: campaign.campaignId,
        campaignName: campaign.campaignName,
      };
    })
    .filter((row) => campaignId === null || campaignId === undefined || row.campaignId === campaignId);

  const totals = createEmptyTotals();
  const uniqueStudentIds = new Set<number>();
  for (const row of rows) {
    incrementTotal(totals, row.callLog.call_result);
    uniqueStudentIds.add(row.studentId);
  }
  totals.uniqueStudentsWithCallLogs = uniqueStudentIds.size;

  return {
    filters: {
      fromDate: range.fromDate,
      toDate: range.toDate,
      campaignId: campaignId ?? null,
      campaignName: selectedCampaign?.name ?? null,
    },
    totals,
    byCallResult: createCallResultBreakdown(rows.map((row) => row.callLog)),
    byCampaign: createCampaignBreakdown(rows),
    dailyTrend: createDailyTrend(rows, range.fromDate, range.toDate),
  };
};
