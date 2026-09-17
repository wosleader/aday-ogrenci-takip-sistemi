import { describe, expect, it } from "vitest";
import { normalizeDashboardDateRange } from "../../src/features/reports/services/dashboardDateRange";
import { readDashboardOverview } from "../../src/features/reports/services/dashboardOverviewReader";
import {
  createReportsDatabase,
  makeCallLog,
  makeCampaign,
  makeStudent
} from "./dashboardTestFixtures";

describe("dashboardOverviewReader", () => {
  it("reads bounded calls, computes KPI deltas, distributions, daily zero rows, and current campaign attribution", async () => {
    const database = await createReportsDatabase("test-dashboard-overview");

    try {
      const activeCampaignId = await database.campaigns.add(makeCampaign({ name: "Aktif Kampanya" }));
      const inactiveCampaignId = await database.campaigns.add(makeCampaign({ name: "Eski Kampanya", is_active: false }));
      const firstStudentId = await database.students.add(makeStudent({ campaign_id: activeCampaignId }));
      const secondStudentId = await database.students.add(makeStudent({ student_full_name: "Second Student" }));
      const thirdStudentId = await database.students.add(
        makeStudent({ student_full_name: "Inactive Campaign Student", campaign_id: inactiveCampaignId })
      );

      await database.call_logs.bulkAdd([
        makeCallLog(firstStudentId, { call_time: "2026-05-10T10:00:00.000Z", call_result: "reached" }),
        makeCallLog(firstStudentId, { call_time: "2026-05-11T10:00:00.000Z", call_result: "not_reached" }),
        makeCallLog(firstStudentId, { call_time: "2026-05-12T10:00:00.000Z", call_result: "appointment" }),
        makeCallLog(firstStudentId, { call_time: "2026-05-13T10:00:00.000Z", call_result: "registered" }),
        makeCallLog(firstStudentId, { call_time: "2026-05-14T10:00:00.000Z", call_result: "call_later" }),
        makeCallLog(secondStudentId, { call_time: "2026-05-16T10:00:00.000Z", call_result: "reached" }),
        makeCallLog(thirdStudentId, { call_time: "2026-05-15T10:00:00.000Z", call_result: "wrong_number" }),
        makeCallLog(firstStudentId, { call_time: "2026-05-09T10:00:00.000Z", call_result: "reached" }),
        makeCallLog(firstStudentId, { call_time: "2026-05-17T10:00:00.000Z", call_result: "reached" }),
        makeCallLog(firstStudentId, { call_time: "2026-05-12T11:00:00.000Z", call_result: "reached", deleted_at: "2026-05-12T12:00:00.000Z" }),
        makeCallLog(firstStudentId, { call_time: "", created_at: "2026-05-13T15:00:00.000Z", call_result: "not_interested" })
      ]);

      const overview = await readDashboardOverview({ fromDate: "2026-05-10", toDate: "2026-05-16", database });

      expect(overview.range.dayCount).toBe(7);
      expect(overview.previousRange.fromDate).toBe("2026-05-03");
      expect(overview.previousRange.toDate).toBe("2026-05-09");
      expect(overview.kpis.totalCallLogs).toEqual({ current: 8, previous: 1, absoluteDelta: 7, percentDelta: 7 });
      expect(overview.kpis.uniqueStudentsWithCallLogs.current).toBe(3);
      expect(overview.kpis.reached.current).toBe(2);
      expect(overview.kpis.notReached.current).toBe(1);
      expect(overview.kpis.callLater.current).toBe(1);
      expect(overview.kpis.appointmentResults).toMatchObject({ current: 1, previous: 0, percentDelta: null });
      expect(overview.kpis.registeredResults.current).toBe(1);
      expect(overview.byCallResult.find((item) => item.callResult === "reached")?.count).toBe(2);
      expect(overview.byCallResult).toHaveLength(9);
      expect(overview.dailyTrend).toHaveLength(7);
      expect(overview.dailyTrend.find((row) => row.date === "2026-05-15")).toMatchObject({ totalCallLogs: 1, reached: 0 });
      expect(overview.dailyTrend.find((row) => row.date === "2026-05-16")).toMatchObject({ totalCallLogs: 1, uniqueStudents: 1 });
      expect(overview.byCampaign).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ campaignId: activeCampaignId, campaignName: "Aktif Kampanya", totalCallLogs: 6 }),
          expect.objectContaining({ campaignId: inactiveCampaignId, campaignName: "Kampanyasız / Eski kampanya", totalCallLogs: 1 }),
          expect.objectContaining({ campaignId: null, campaignName: "Diğer", totalCallLogs: 1 })
        ])
      );
      expect(overview.byCampaign).toHaveLength(3);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("uses the explicit range and does not require a seven-day reader default", () => {
    const range = normalizeDashboardDateRange("2026-05-01", "2026-05-30");
    expect(range.dayCount).toBe(30);
  });
});
