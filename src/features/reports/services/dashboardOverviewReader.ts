import { db as defaultDb, type AppDatabase } from "../../../db/db";
import { CALL_RESULTS, type CallResult } from "../../../domain/constants/statuses";
import type { CallLogRecord } from "../../../domain/models/callLog";
import type { CampaignRecord } from "../../../domain/models/campaign";
import type { StudentRecord } from "../../../domain/models/student";
import {
  createPreviousDashboardDateRange,
  getDashboardRangeDates,
  normalizeDashboardDateRange,
  type DashboardDateRange
} from "./dashboardDateRange";
import { createLocalDayRange } from "./dailyReportReader";

type StoredCallLog = CallLogRecord & { id: number };
type StoredCampaign = CampaignRecord & { id: number };
type StoredStudent = StudentRecord & { id: number };

const REPORTING_CALL_RESULTS = Object.keys(CALL_RESULTS) as CallResult[];
const LEGACY_CAMPAIGN_FALLBACK = "Kampanyasız / Eski kampanya";
const DEFAULT_CAMPAIGN_NAME = "Diğer";

export type DashboardOverviewMetric = {
  current: number;
  previous: number;
  absoluteDelta: number;
  percentDelta: number | null;
};

export type DashboardOverviewKpis = {
  totalCallLogs: DashboardOverviewMetric;
  uniqueStudentsWithCallLogs: DashboardOverviewMetric;
  reached: DashboardOverviewMetric;
  notReached: DashboardOverviewMetric;
  callLater: DashboardOverviewMetric;
  appointmentResults: DashboardOverviewMetric;
  registeredResults: DashboardOverviewMetric;
};

export type DashboardCallResultDistribution = {
  callResult: CallResult;
  label: string;
  count: number;
};

export type DashboardDailyTrendRow = {
  date: string;
  totalCallLogs: number;
  uniqueStudents: number;
  reached: number;
  notReached: number;
  appointmentResults: number;
  registeredResults: number;
};

export type DashboardCampaignBreakdown = {
  campaignId: number | null;
  campaignName: string;
  uniqueStudents: number;
  totalCallLogs: number;
  reached: number;
  notReached: number;
  callLater: number;
  appointmentResults: number;
  registeredResults: number;
};

export type DashboardOverview = {
  range: DashboardDateRange;
  previousRange: DashboardDateRange;
  kpis: DashboardOverviewKpis;
  byCallResult: DashboardCallResultDistribution[];
  dailyTrend: DashboardDailyTrendRow[];
  byCampaign: DashboardCampaignBreakdown[];
};

export type ReadDashboardOverviewOptions = {
  fromDate: string;
  toDate: string;
  database?: AppDatabase;
};

type ReportingRow = {
  callLog: StoredCallLog;
  callDate: string;
  studentId: number;
  campaignId: number | null;
  campaignName: string;
};

type BasicCounts = {
  totalCallLogs: number;
  uniqueStudentsWithCallLogs: number;
  reached: number;
  notReached: number;
  callLater: number;
  appointmentResults: number;
  registeredResults: number;
};

function isActive<T extends { deleted_at?: string | null }>(record: T): boolean {
  return !record.deleted_at;
}

function getCallLogTime(callLog: CallLogRecord): string {
  return callLog.call_time || callLog.created_at;
}

function isInRange(callLog: CallLogRecord, range: DashboardDateRange): boolean {
  const timestamp = new Date(getCallLogTime(callLog)).getTime();
  return Number.isFinite(timestamp) && timestamp >= range.start.getTime() && timestamp <= range.end.getTime();
}

async function readCallLogsInRange(range: DashboardDateRange, database: AppDatabase): Promise<StoredCallLog[]> {
  const indexedCallLogs = await database.call_logs
    .where("call_time")
    .between(range.start_iso, range.end_iso, true, true)
    .toArray();
  const emptyCallTimeLogs = await database.call_logs.where("call_time").equals("").toArray();
  const unique = new Map<number, StoredCallLog>();

  for (const callLog of [...indexedCallLogs, ...emptyCallTimeLogs]) {
    if (callLog.id && isActive(callLog) && isInRange(callLog, range)) {
      unique.set(callLog.id, callLog as StoredCallLog);
    }
  }

  return [...unique.values()];
}

function getCampaignName(
  student: StoredStudent | undefined,
  campaignsById: Map<number, StoredCampaign>
): { campaignId: number | null; campaignName: string } {
  if (!student?.campaign_id) {
    return { campaignId: null, campaignName: DEFAULT_CAMPAIGN_NAME };
  }

  const campaign = campaignsById.get(student.campaign_id);
  if (!campaign || !campaign.is_active || campaign.deleted_at) {
    return { campaignId: student.campaign_id, campaignName: LEGACY_CAMPAIGN_FALLBACK };
  }

  return { campaignId: campaign.id, campaignName: campaign.name };
}

async function createRows(callLogs: StoredCallLog[], database: AppDatabase): Promise<ReportingRow[]> {
  const studentIds = [...new Set(callLogs.map((callLog) => callLog.student_id))];
  const students = await database.students.bulkGet(studentIds);
  const studentsById = new Map<number, StoredStudent>();
  students.forEach((student) => {
    if (student?.id) {
      studentsById.set(student.id, student as StoredStudent);
    }
  });

  const campaignIds = [...new Set(students.map((student) => student?.campaign_id).filter((id): id is number => Boolean(id)))];
  const campaigns = await database.campaigns.bulkGet(campaignIds);
  const campaignsById = new Map<number, StoredCampaign>();
  campaigns.forEach((campaign) => {
    if (campaign?.id) {
      campaignsById.set(campaign.id, campaign as StoredCampaign);
    }
  });

  return callLogs.map((callLog) => {
    const campaign = getCampaignName(studentsById.get(callLog.student_id), campaignsById);
    return {
      callLog,
      callDate: createLocalDayRange(new Date(getCallLogTime(callLog))).date_input_value,
      studentId: callLog.student_id,
      campaignId: campaign.campaignId,
      campaignName: campaign.campaignName
    };
  });
}

function countBasic(rows: ReportingRow[]): BasicCounts {
  const counts: BasicCounts = {
    totalCallLogs: rows.length,
    uniqueStudentsWithCallLogs: new Set(rows.map((row) => row.studentId)).size,
    reached: 0,
    notReached: 0,
    callLater: 0,
    appointmentResults: 0,
    registeredResults: 0
  };

  for (const row of rows) {
    switch (row.callLog.call_result) {
      case "reached":
        counts.reached += 1;
        break;
      case "not_reached":
        counts.notReached += 1;
        break;
      case "call_later":
        counts.callLater += 1;
        break;
      case "appointment":
        counts.appointmentResults += 1;
        break;
      case "registered":
        counts.registeredResults += 1;
        break;
    }
  }

  return counts;
}

function compareMetric(current: number, previous: number): DashboardOverviewMetric {
  return {
    current,
    previous,
    absoluteDelta: current - previous,
    percentDelta: previous === 0 ? null : (current - previous) / previous
  };
}

function createKpis(current: BasicCounts, previous: BasicCounts): DashboardOverviewKpis {
  return {
    totalCallLogs: compareMetric(current.totalCallLogs, previous.totalCallLogs),
    uniqueStudentsWithCallLogs: compareMetric(current.uniqueStudentsWithCallLogs, previous.uniqueStudentsWithCallLogs),
    reached: compareMetric(current.reached, previous.reached),
    notReached: compareMetric(current.notReached, previous.notReached),
    callLater: compareMetric(current.callLater, previous.callLater),
    appointmentResults: compareMetric(current.appointmentResults, previous.appointmentResults),
    registeredResults: compareMetric(current.registeredResults, previous.registeredResults)
  };
}

function createDistribution(rows: ReportingRow[]): DashboardCallResultDistribution[] {
  return REPORTING_CALL_RESULTS.map((callResult) => ({
    callResult,
    label: CALL_RESULTS[callResult],
    count: rows.filter((row) => row.callLog.call_result === callResult).length
  }));
}

function createDailyTrend(rows: ReportingRow[], range: DashboardDateRange): DashboardDailyTrendRow[] {
  const rowsByDate = new Map<string, ReportingRow[]>();
  for (const row of rows) {
    rowsByDate.set(row.callDate, [...(rowsByDate.get(row.callDate) ?? []), row]);
  }

  return getDashboardRangeDates(range).map((date) => {
    const dayRows = rowsByDate.get(date) ?? [];
    return {
      date,
      totalCallLogs: dayRows.length,
      uniqueStudents: new Set(dayRows.map((row) => row.studentId)).size,
      reached: dayRows.filter((row) => row.callLog.call_result === "reached").length,
      notReached: dayRows.filter((row) => row.callLog.call_result === "not_reached").length,
      appointmentResults: dayRows.filter((row) => row.callLog.call_result === "appointment").length,
      registeredResults: dayRows.filter((row) => row.callLog.call_result === "registered").length
    };
  });
}

function createCampaignBreakdown(rows: ReportingRow[]): DashboardCampaignBreakdown[] {
  const groups = new Map<string, ReportingRow[]>();
  for (const row of rows) {
    const key = row.campaignId === null ? "null" : String(row.campaignId);
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }

  return [...groups.values()]
    .map((groupRows) => {
      const sample = groupRows[0];
      const counts = countBasic(groupRows);
      return {
        campaignId: sample.campaignId,
        campaignName: sample.campaignName,
        uniqueStudents: counts.uniqueStudentsWithCallLogs,
        totalCallLogs: counts.totalCallLogs,
        reached: counts.reached,
        notReached: counts.notReached,
        callLater: counts.callLater,
        appointmentResults: counts.appointmentResults,
        registeredResults: counts.registeredResults
      };
    })
    .sort((left, right) => right.totalCallLogs - left.totalCallLogs || left.campaignName.localeCompare(right.campaignName));
}

export async function readDashboardOverview({
  fromDate,
  toDate,
  database = defaultDb
}: ReadDashboardOverviewOptions): Promise<DashboardOverview> {
  const range = normalizeDashboardDateRange(fromDate, toDate);
  const previousRange = createPreviousDashboardDateRange(range);
  const combinedRange = normalizeDashboardDateRange(previousRange.fromDate, range.toDate);
  const allCallLogs = await readCallLogsInRange(combinedRange, database);
  const currentLogs = allCallLogs.filter((callLog) => isInRange(callLog, range));
  const previousLogs = allCallLogs.filter((callLog) => isInRange(callLog, previousRange));
  const [currentRows, previousRows] = await Promise.all([
    createRows(currentLogs, database),
    createRows(previousLogs, database)
  ]);

  return {
    range,
    previousRange,
    kpis: createKpis(countBasic(currentRows), countBasic(previousRows)),
    byCallResult: createDistribution(currentRows),
    dailyTrend: createDailyTrend(currentRows, range),
    byCampaign: createCampaignBreakdown(currentRows)
  };
}
